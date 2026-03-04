from django.db.models import Count, Q
from rest_framework import parsers, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

import logging

from apps.accounts.models import User
from apps.schools.models import School, Section, AcademicYear
from core.pagination import StandardResultsSetPagination
from core.permissions import IsSchoolAdmin, IsAdminOrTeacher

from .models import (
    Class,
    Lesson,
    Level,
    LevelSubject,
    Resource,
    ScheduleSlot,
    Stream,
    StudentProfile,
    Subject,
    TeacherAssignment,
    TeacherProfile,
    Timetable,
)
from .serializers import (
    BulkSubjectSyncSerializer,
    BulkTeacherSetupSerializer,
    ClassSerializer,
    LessonSerializer,
    LevelSerializer,
    LevelSubjectSerializer,
    ResourceSerializer,
    ScheduleSlotSerializer,
    StreamSerializer,
    StudentSerializer,
    SubjectSerializer,
    TeacherAssignmentSerializer,
    TeacherSerializer,
    TimetableSerializer,
)

logger = logging.getLogger(__name__)


def _resolve_school(request):
    """Resolve school for the current user (supports SUPER_ADMIN)."""
    user = request.user
    if user.school_id:
        return user.school
    # SUPER_ADMIN: try query param, then request body, then single-school fallback
    school_id = request.query_params.get("school") or request.data.get("school")
    if school_id:
        return School.objects.filter(pk=school_id, is_deleted=False).first()
    schools = School.objects.filter(is_deleted=False)
    if schools.count() == 1:
        return schools.first()
    return None


# ═══════════════════════════════════════════════════════════════════════════
# Hierarchy views
# ═══════════════════════════════════════════════════════════════════════════


class LevelViewSet(viewsets.ModelViewSet):
    """CRUD for grade levels within a school."""

    serializer_class = LevelSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return Level.objects.none()
        qs = Level.objects.filter(
            school=school,
        ).select_related("section")
        # ?section=<section_type> filter
        section_type = self.request.query_params.get("section_type")
        if section_type:
            qs = qs.filter(section__section_type=section_type.upper())
        return qs

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school)


class StreamViewSet(viewsets.ModelViewSet):
    """CRUD for streams (filières) within lycée levels."""

    serializer_class = StreamSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return Stream.objects.none()
        qs = Stream.objects.filter(
            school=school,
        ).select_related("level")
        # ?level=<uuid> filter
        level_id = self.request.query_params.get("level")
        if level_id:
            qs = qs.filter(level_id=level_id)
        return qs

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school)


# ═══════════════════════════════════════════════════════════════════════════
# Subject views
# ═══════════════════════════════════════════════════════════════════════════


class SubjectViewSet(viewsets.ModelViewSet):
    """CRUD for the school's subject catalog."""

    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return Subject.objects.none()
        return Subject.objects.filter(school=school)

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school)

    def destroy(self, request, *args, **kwargs):
        """DELETE /academics/subjects/{id}/
        Check for existing grades before deleting.
        If grades exist → 409 with {has_grades: true, count: N}.
        If no grades → delete normally.
        """
        from apps.grades.models import Grade

        instance = self.get_object()
        grade_count = Grade.objects.filter(exam_type__subject=instance).count()
        if grade_count > 0:
            return Response(
                {"has_grades": True, "count": grade_count},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)

    # ── Batch endpoint for setup wizard ──────────────────────────────────
    @action(detail=False, methods=["post"], url_path="bulk-sync")
    def bulk_sync(self, request):
        """
        POST /academics/subjects/bulk-sync/
        Accepts:
          {
            "subjects": [
              {"name": "Mathématiques", "arabic_name": "رياضيات",
               "code": "MATH", "color": "#E91E63"}
            ],
            "level_subjects": [
              {"level": "<uuid>", "stream": "<uuid>|null",
               "subject_code": "MATH", "coefficient": 5, "is_mandatory": true}
            ]
          }
        Creates/updates subjects (by code) and level-subject configs
        in one transaction. Returns {created_subjects, updated_subjects,
        created_level_subjects, updated_level_subjects}.
        """
        from django.db import transaction

        school = _resolve_school(self.request)
        if not school:
            return Response(
                {"detail": "No school resolved for current user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ser = BulkSubjectSyncSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        created_subjects = 0
        updated_subjects = 0
        created_ls = 0
        updated_ls = 0

        with transaction.atomic():
            # 1. Upsert subjects by (school, code)
            code_to_subject = {}
            for s in data["subjects"]:
                obj, created = Subject.objects.update_or_create(
                    school=school,
                    code=s["code"],
                    defaults={
                        "name": s["name"],
                        "arabic_name": s.get("arabic_name", ""),
                        "color": s.get("color", "#2196F3"),
                        "icon": s.get("icon", ""),
                        "is_custom": s.get("is_custom", False),
                    },
                )
                code_to_subject[s["code"]] = obj
                if created:
                    created_subjects += 1
                else:
                    updated_subjects += 1

            # 2. Upsert level-subject configs
            for ls in data["level_subjects"]:
                subject = code_to_subject.get(ls["subject_code"])
                if not subject:
                    continue
                level_id = ls["level"]
                stream_id = ls.get("stream")
                defaults = {
                    "coefficient": ls.get("coefficient", 1),
                    "is_mandatory": ls.get("is_mandatory", True),
                }
                if ls.get("weekly_hours") is not None:
                    defaults["weekly_hours"] = ls["weekly_hours"]

                if stream_id:
                    obj, created = LevelSubject.objects.update_or_create(
                        school=school,
                        level_id=level_id,
                        stream_id=stream_id,
                        subject=subject,
                        defaults=defaults,
                    )
                else:
                    obj, created = LevelSubject.objects.update_or_create(
                        school=school,
                        level_id=level_id,
                        stream__isnull=True,
                        subject=subject,
                        defaults={**defaults, "stream": None},
                    )
                if created:
                    created_ls += 1
                else:
                    updated_ls += 1

        logger.info(
            "bulk_sync subjects for school=%s: "
            "subjects created=%d updated=%d, "
            "level_subjects created=%d updated=%d",
            school.id, created_subjects, updated_subjects,
            created_ls, updated_ls,
        )
        return Response({
            "created_subjects": created_subjects,
            "updated_subjects": updated_subjects,
            "created_level_subjects": created_ls,
            "updated_level_subjects": updated_ls,
        })


class LevelSubjectViewSet(viewsets.ModelViewSet):
    """CRUD for subject ↔ level/stream configuration (coefficients, etc.)."""

    serializer_class = LevelSubjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return LevelSubject.objects.none()
        qs = LevelSubject.objects.filter(
            school=school,
        ).select_related("level", "stream", "subject")
        # ?level=<uuid>
        level_id = self.request.query_params.get("level")
        if level_id:
            qs = qs.filter(level_id=level_id)
        # ?stream=<uuid>
        stream_id = self.request.query_params.get("stream")
        if stream_id:
            qs = qs.filter(stream_id=stream_id)
        return qs

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school)


# ═══════════════════════════════════════════════════════════════════════════
# Classroom views
# ═══════════════════════════════════════════════════════════════════════════


class ClassViewSet(viewsets.ModelViewSet):
    serializer_class = ClassSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return Class.objects.none()
        qs = Class.objects.filter(
            school=school,
        ).select_related(
            "section", "level", "stream", "academic_year", "homeroom_teacher"
        )
        # Filters
        level_id = self.request.query_params.get("level")
        if level_id:
            qs = qs.filter(level_id=level_id)
        section_id = self.request.query_params.get("section")
        if section_id:
            qs = qs.filter(section_id=section_id)
        return qs

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        extra = {"school": school}

        # Auto-infer section from level if not provided
        if not serializer.validated_data.get("section"):
            level = serializer.validated_data.get("level")
            if level and hasattr(level, "section"):
                extra["section"] = level.section

        # Auto-infer academic_year if not provided
        if not serializer.validated_data.get("academic_year"):
            current_year = AcademicYear.objects.filter(
                school=school, is_current=True
            ).first()
            if current_year:
                extra["academic_year"] = current_year
            else:
                # Fallback to most recent
                latest = AcademicYear.objects.filter(school=school).order_by("-start_date").first()
                if latest:
                    extra["academic_year"] = latest

        logger.info(
            "Creating class: school=%s, data=%s, extra_keys=%s",
            school.id if school else None,
            {k: str(v) for k, v in serializer.validated_data.items()},
            list(extra.keys()),
        )
        serializer.save(**extra)


class TeacherAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = TeacherAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return TeacherAssignment.objects.none()
        return TeacherAssignment.objects.filter(school=school)

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school)


class ScheduleSlotViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleSlotSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return ScheduleSlot.objects.none()
        return ScheduleSlot.objects.filter(school=school)

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school)


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return Lesson.objects.none()
        return Lesson.objects.filter(school=school)

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school, teacher=self.request.user)


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return Resource.objects.none()
        return Resource.objects.filter(school=school)

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school, teacher=self.request.user)


# ---------------------------------------------------------------------------
# Student / Teacher  (composite User + Profile endpoints)
# ---------------------------------------------------------------------------


class StudentViewSet(viewsets.ModelViewSet):
    """
    CRUD for students (User + StudentProfile).
    GET  /academics/students/       — paginated list
    POST /academics/students/       — create student user
    GET  /academics/students/{id}/  — detail
    PATCH/PUT /academics/students/{id}/ — update
    DELETE /academics/students/{id}/    — soft-deactivate
    """

    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return User.objects.none()
        qs = (
            User.objects.filter(role=User.Role.STUDENT, school=school)
            .select_related("student_profile", "student_profile__current_class")
            .order_by("last_name", "first_name")
        )
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone_number__icontains=search)
            )
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["school"] = _resolve_school(self.request)
        return ctx

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: deactivate the user instead of hard-deleting."""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeacherViewSet(viewsets.ModelViewSet):
    """
    CRUD for teachers (User + TeacherProfile).
    """

    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return User.objects.none()
        qs = (
            User.objects.filter(role=User.Role.TEACHER, school=school)
            .select_related("teacher_profile")
            .order_by("last_name", "first_name")
        )
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone_number__icontains=search)
            )
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["school"] = _resolve_school(self.request)
        return ctx

    def destroy(self, request, *args, **kwargs):
        """Soft-delete: deactivate the user instead of hard-deleting."""
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["post"], url_path="bulk-setup")
    def bulk_setup(self, request):
        """
        POST /api/v1/academics/teachers/bulk-setup/
        Wizard step 6: create teachers in bulk with sections, subjects, and
        class assignments.
        """
        from django.db import transaction
        school = _resolve_school(request)
        if not school:
            return Response(
                {"detail": "School not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ser = BulkTeacherSetupSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        created = 0
        skipped = 0
        errors = []

        # Pre-fetch look-ups
        sections = {
            s.section_type: s
            for s in Section.objects.filter(school=school)
        }
        subjects_by_code = {
            s.code: s
            for s in Subject.objects.filter(school=school)
        }
        classes_by_name = {
            c.name: c
            for c in Class.objects.filter(school=school)
        }
        academic_year = AcademicYear.objects.filter(
            school=school, is_current=True,
        ).first() or AcademicYear.objects.filter(
            school=school,
        ).order_by("-start_date").first()

        for t in ser.validated_data["teachers"]:
            phone = t["phone_number"]
            # Check for existing user
            if User.objects.filter(phone_number=phone).exists():
                skipped += 1
                errors.append(f"{phone}: existe déjà")
                continue

            try:
                with transaction.atomic():
                    # 1. Create user
                    user = User(
                        phone_number=phone,
                        first_name=t["first_name"],
                        last_name=t["last_name"],
                        email=t.get("email") or "",
                        role=User.Role.TEACHER,
                        school=school,
                        created_by=request.user,
                    )
                    user.set_password(t["password"])
                    user.save()

                    # 2. Create / update TeacherProfile
                    # (post_save signal may have already created an empty one)
                    first_section = None
                    for st in t.get("section_types", []):
                        if st in sections:
                            first_section = sections[st]
                            break
                    specialization = ", ".join(
                        subjects_by_code[sc].name
                        for sc in t.get("subject_codes", [])
                        if sc in subjects_by_code
                    )
                    TeacherProfile.objects.update_or_create(
                        user=user,
                        defaults={
                            "section": first_section,
                            "specialization": specialization,
                        },
                    )

                    # 3. Create TeacherAssignments
                    if academic_year:
                        subject_codes = t.get("subject_codes", [])
                        class_names = t.get("class_names", [])
                        for cname in class_names:
                            cls = classes_by_name.get(cname)
                            if not cls:
                                continue
                            for scode in subject_codes:
                                subj = subjects_by_code.get(scode)
                                if not subj:
                                    continue
                                TeacherAssignment.objects.get_or_create(
                                    school=school,
                                    teacher=user,
                                    subject=subj,
                                    assigned_class=cls,
                                    academic_year=academic_year,
                                )

                    created += 1
            except Exception as exc:
                skipped += 1
                errors.append(f"{phone}: {str(exc)}")
                logger.error("Teacher bulk_setup error for %s: %s", phone, exc)

        return Response({
            "created": created,
            "skipped": skipped,
            "errors": errors,
        }, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Timetable
# ---------------------------------------------------------------------------


class TimetableViewSet(viewsets.ModelViewSet):
    """
    CRUD for image-based timetables.
    Accepts multipart/form-data for create/update.
    """

    serializer_class = TimetableSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return Timetable.objects.none()
        qs = (
            Timetable.objects.filter(school=school, is_deleted=False)
            .select_related("class_group", "academic_year", "uploaded_by")
            .order_by("-created_at")
        )
        # ?class= filter
        class_id = self.request.query_params.get("class")
        if class_id:
            qs = qs.filter(class_group_id=class_id)
        return qs

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(
            school=school,
            uploaded_by=self.request.user,
        )

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        # Hard delete (also removes the file)
        if instance.image:
            instance.image.delete(save=False)
        instance.delete()

    @action(detail=False, methods=["get"], url_path="classes-status")
    def classes_status(self, request):
        """
        Returns a list of all classes in the school, each with:
        - class id, name
        - timetable_count
        - timetable_titles list
        """
        school = _resolve_school(request)
        if not school:
            return Response([])
        classes = Class.objects.filter(section__school=school).order_by("level", "name")
        result = []
        for cls in classes:
            timetables = Timetable.objects.filter(
                school=school, class_group=cls, is_deleted=False
            )
            result.append(
                {
                    "id": str(cls.id),
                    "name": cls.name,
                    "timetable_count": timetables.count(),
                    "timetable_titles": list(
                        timetables.values_list("title", flat=True)
                    ),
                }
            )
        return Response(result)
