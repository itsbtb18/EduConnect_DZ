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
    Room,
    ScheduleSlot,
    Stream,
    StudentProfile,
    Subject,
    TeacherAssignment,
    TeacherAvailability,
    TeacherProfile,
    TimeSlotConfig,
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
    RoomSerializer,
    ScheduleSlotSerializer,
    StreamSerializer,
    StudentSerializer,
    SubjectSerializer,
    TeacherAssignmentSerializer,
    TeacherAvailabilitySerializer,
    TeacherSerializer,
    TimeSlotConfigSerializer,
    TimetableSerializer,
)
from .services import (
    detect_conflicts,
    export_class_timetable_pdf,
    export_teacher_timetable_pdf,
    generate_teacher_schedule,
    get_class_schedule,
    get_room_occupancy,
    validate_slot,
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
            school.id,
            created_subjects,
            updated_subjects,
            created_ls,
            updated_ls,
        )
        return Response(
            {
                "created_subjects": created_subjects,
                "updated_subjects": updated_subjects,
                "created_level_subjects": created_ls,
                "updated_level_subjects": updated_ls,
            }
        )


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
                latest = (
                    AcademicYear.objects.filter(school=school)
                    .order_by("-start_date")
                    .first()
                )
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
        qs = ScheduleSlot.objects.filter(school=school).select_related(
            "assigned_class", "subject", "teacher", "room"
        )
        # Filters
        class_id = self.request.query_params.get("class")
        if class_id:
            qs = qs.filter(assigned_class_id=class_id)
        teacher_id = self.request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        day = self.request.query_params.get("day")
        if day is not None:
            qs = qs.filter(day_of_week=day)
        return qs

    def _validate_and_save(self, serializer, exclude_id=None):
        """Validate conflicts before saving a slot."""
        school = _resolve_school(self.request)
        data = serializer.validated_data
        issues = validate_slot(
            school=school,
            day_of_week=data["day_of_week"],
            start_time=data["start_time"],
            end_time=data["end_time"],
            teacher=data.get("teacher"),
            room=data.get("room"),
            assigned_class=data.get("assigned_class"),
            academic_year=data.get("academic_year"),
            exclude_slot_id=exclude_id,
        )
        # Allow ?force=true to skip conflict check
        force = self.request.query_params.get("force", "").lower() == "true"
        if issues and not force:
            return Response(
                {"conflicts": issues},
                status=status.HTTP_409_CONFLICT,
            )
        serializer.save(school=school)
        return None

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conflict_response = self._validate_and_save(serializer)
        if conflict_response:
            return conflict_response
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        conflict_response = self._validate_and_save(serializer, exclude_id=instance.pk)
        if conflict_response:
            return conflict_response
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        # For partial update, merge with existing data for conflict check
        data = {
            "day_of_week": serializer.validated_data.get(
                "day_of_week", instance.day_of_week
            ),
            "start_time": serializer.validated_data.get(
                "start_time", instance.start_time
            ),
            "end_time": serializer.validated_data.get("end_time", instance.end_time),
            "teacher": serializer.validated_data.get("teacher", instance.teacher),
            "room": serializer.validated_data.get("room", instance.room),
            "assigned_class": serializer.validated_data.get(
                "assigned_class", instance.assigned_class
            ),
            "academic_year": serializer.validated_data.get(
                "academic_year", instance.academic_year
            ),
        }
        school = _resolve_school(self.request)
        issues = validate_slot(
            school=school,
            day_of_week=data["day_of_week"],
            start_time=data["start_time"],
            end_time=data["end_time"],
            teacher=data["teacher"],
            room=data["room"],
            assigned_class=data["assigned_class"],
            academic_year=data["academic_year"],
            exclude_slot_id=instance.pk,
        )
        force = self.request.query_params.get("force", "").lower() == "true"
        if issues and not force:
            return Response(
                {"conflicts": issues},
                status=status.HTTP_409_CONFLICT,
            )
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="check-conflicts")
    def check_conflicts(self, request):
        """
        POST /api/v1/academics/schedule/check-conflicts/
        Preview conflicts before creating a slot.
        Body: {day_of_week, start_time, end_time, teacher, room, assigned_class}
        """
        school = _resolve_school(request)
        from datetime import time as dt_time

        day = request.data.get("day_of_week")
        start_str = request.data.get("start_time")
        end_str = request.data.get("end_time")
        teacher_id = request.data.get("teacher")
        room_id = request.data.get("room")
        class_id = request.data.get("assigned_class")
        exclude_id = request.data.get("exclude_slot_id")

        if day is None or not start_str or not end_str:
            return Response(
                {"detail": "day_of_week, start_time, end_time are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Parse times
        try:
            parts = start_str.split(":")
            start_time = dt_time(int(parts[0]), int(parts[1]))
            parts = end_str.split(":")
            end_time = dt_time(int(parts[0]), int(parts[1]))
        except (ValueError, IndexError):
            return Response(
                {"detail": "Invalid time format. Use HH:MM."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        teacher = User.objects.filter(pk=teacher_id).first() if teacher_id else None
        room = Room.objects.filter(pk=room_id).first() if room_id else None
        assigned_class = Class.objects.filter(pk=class_id).first() if class_id else None

        issues = validate_slot(
            school=school,
            day_of_week=int(day),
            start_time=start_time,
            end_time=end_time,
            teacher=teacher,
            room=room,
            assigned_class=assigned_class,
            exclude_slot_id=exclude_id,
        )
        return Response({"conflicts": issues, "has_conflicts": len(issues) > 0})

    @action(
        detail=False,
        methods=["get"],
        url_path="class-schedule/(?P<class_id>[0-9a-f-]+)",
    )
    def class_schedule(self, request, class_id=None):
        """
        GET /api/v1/academics/schedule/class-schedule/<class_id>/
        Returns the full weekly schedule for a class organized by day.
        """
        school = _resolve_school(request)
        assigned_class = Class.objects.filter(pk=class_id, school=school).first()
        if not assigned_class:
            return Response(
                {"detail": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        schedule = get_class_schedule(school, assigned_class)
        return Response(schedule)

    @action(
        detail=False,
        methods=["get"],
        url_path="teacher-schedule/(?P<teacher_id>[0-9a-f-]+)",
    )
    def teacher_schedule(self, request, teacher_id=None):
        """
        GET /api/v1/academics/schedule/teacher-schedule/<teacher_id>/
        Auto-generated teacher schedule derived from class timetables.
        """
        school = _resolve_school(request)
        teacher = User.objects.filter(
            pk=teacher_id, school=school, role="TEACHER"
        ).first()
        if not teacher:
            return Response(
                {"detail": "Teacher not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        schedule = generate_teacher_schedule(school, teacher)
        return Response(schedule)

    @action(
        detail=False,
        methods=["get"],
        url_path="export-class-pdf/(?P<class_id>[0-9a-f-]+)",
    )
    def export_class_pdf(self, request, class_id=None):
        """
        GET /api/v1/academics/schedule/export-class-pdf/<class_id>/
        Export class timetable as PDF.
        """
        from django.http import HttpResponse as DjHttpResponse

        school = _resolve_school(request)
        assigned_class = Class.objects.filter(pk=class_id, school=school).first()
        if not assigned_class:
            return Response(
                {"detail": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            pdf_bytes = export_class_timetable_pdf(school, assigned_class)
        except ImportError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )
        response = DjHttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="emploi_du_temps_{assigned_class.name}.pdf"'
        )
        return response

    @action(
        detail=False,
        methods=["get"],
        url_path="export-teacher-pdf/(?P<teacher_id>[0-9a-f-]+)",
    )
    def export_teacher_pdf(self, request, teacher_id=None):
        """
        GET /api/v1/academics/schedule/export-teacher-pdf/<teacher_id>/
        Export teacher timetable as PDF.
        """
        from django.http import HttpResponse as DjHttpResponse

        school = _resolve_school(request)
        teacher = User.objects.filter(
            pk=teacher_id, school=school, role="TEACHER"
        ).first()
        if not teacher:
            return Response(
                {"detail": "Teacher not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        try:
            pdf_bytes = export_teacher_timetable_pdf(school, teacher)
        except ImportError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )
        response = DjHttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="emploi_du_temps_{teacher.full_name}.pdf"'
        )
        return response

    @action(detail=False, methods=["post"], url_path="publish/(?P<class_id>[0-9a-f-]+)")
    def publish(self, request, class_id=None):
        """
        POST /api/v1/academics/schedule/publish/<class_id>/
        Publish all DRAFT slots for a class → set status=PUBLISHED.
        """
        school = _resolve_school(request)
        assigned_class = Class.objects.filter(pk=class_id, school=school).first()
        if not assigned_class:
            return Response(
                {"detail": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        updated = ScheduleSlot.objects.filter(
            school=school,
            assigned_class=assigned_class,
            status=ScheduleSlot.Status.DRAFT,
        ).update(status=ScheduleSlot.Status.PUBLISHED)
        return Response({"published": updated})

    @action(
        detail=False, methods=["post"], url_path="unpublish/(?P<class_id>[0-9a-f-]+)"
    )
    def unpublish(self, request, class_id=None):
        """Revert PUBLISHED slots back to DRAFT for a class."""
        school = _resolve_school(request)
        assigned_class = Class.objects.filter(pk=class_id, school=school).first()
        if not assigned_class:
            return Response(
                {"detail": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        updated = ScheduleSlot.objects.filter(
            school=school,
            assigned_class=assigned_class,
            status=ScheduleSlot.Status.PUBLISHED,
        ).update(status=ScheduleSlot.Status.DRAFT)
        return Response({"unpublished": updated})

    @action(
        detail=False,
        methods=["get"],
        url_path="validate-timetable/(?P<class_id>[0-9a-f-]+)",
    )
    def validate_timetable(self, request, class_id=None):
        """
        GET /api/v1/academics/schedule/validate-timetable/<class_id>/
        Check the full timetable for a class — returns any internal conflicts.
        """
        school = _resolve_school(request)
        assigned_class = Class.objects.filter(pk=class_id, school=school).first()
        if not assigned_class:
            return Response(
                {"detail": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        slots = ScheduleSlot.objects.filter(
            school=school,
            assigned_class=assigned_class,
        ).select_related("subject", "teacher", "room")

        all_issues = []
        for slot in slots:
            issues = validate_slot(
                school=school,
                day_of_week=slot.day_of_week,
                start_time=slot.start_time,
                end_time=slot.end_time,
                teacher=slot.teacher,
                room=slot.room,
                assigned_class=slot.assigned_class,
                academic_year=slot.academic_year,
                exclude_slot_id=slot.pk,
            )
            for issue in issues:
                issue["slot_id"] = str(slot.pk)
                issue["slot_label"] = str(slot)
                all_issues.append(issue)

        return Response(
            {
                "class_id": str(class_id),
                "class_name": assigned_class.name,
                "total_slots": slots.count(),
                "issues": all_issues,
                "is_valid": len(all_issues) == 0,
            }
        )

    @action(
        detail=False, methods=["get"], url_path="room-schedule/(?P<room_id>[0-9a-f-]+)"
    )
    def room_schedule(self, request, room_id=None):
        """
        GET /api/v1/academics/schedule/room-schedule/<room_id>/
        Returns the full weekly schedule for a specific room.
        """
        school = _resolve_school(request)
        room = Room.objects.filter(pk=room_id, school=school, is_deleted=False).first()
        if not room:
            return Response(
                {"detail": "Room not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        from collections import defaultdict

        slots = (
            ScheduleSlot.objects.filter(school=school, room=room)
            .select_related("assigned_class", "subject", "teacher")
            .order_by("day_of_week", "start_time")
        )
        schedule = defaultdict(list)
        for slot in slots:
            schedule[slot.day_of_week].append(
                {
                    "id": str(slot.pk),
                    "day": slot.day_of_week,
                    "start": slot.start_time.strftime("%H:%M"),
                    "end": slot.end_time.strftime("%H:%M"),
                    "class": slot.assigned_class.name,
                    "subject": slot.subject.name,
                    "teacher": slot.teacher.full_name,
                }
            )
        return Response(dict(schedule))


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
        sections = {s.section_type: s for s in Section.objects.filter(school=school)}
        subjects_by_code = {s.code: s for s in Subject.objects.filter(school=school)}
        classes_by_name = {c.name: c for c in Class.objects.filter(school=school)}
        academic_year = (
            AcademicYear.objects.filter(
                school=school,
                is_current=True,
            ).first()
            or AcademicYear.objects.filter(
                school=school,
            )
            .order_by("-start_date")
            .first()
        )

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

        return Response(
            {
                "created": created,
                "skipped": skipped,
                "errors": errors,
            },
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Room Management
# ---------------------------------------------------------------------------


class RoomViewSet(viewsets.ModelViewSet):
    """
    CRUD for physical rooms in a school.
    GET    /api/v1/academics/rooms/             — list all rooms
    POST   /api/v1/academics/rooms/             — create a room
    GET    /api/v1/academics/rooms/{id}/        — room detail
    PATCH  /api/v1/academics/rooms/{id}/        — update room
    DELETE /api/v1/academics/rooms/{id}/        — delete room
    GET    /api/v1/academics/rooms/occupancy/   — room occupancy overview
    """

    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return Room.objects.none()
        qs = Room.objects.filter(school=school, is_deleted=False).order_by("name")
        # Filters
        room_type = self.request.query_params.get("type")
        if room_type:
            qs = qs.filter(room_type=room_type)
        available = self.request.query_params.get("available")
        if available is not None:
            qs = qs.filter(is_available=available.lower() == "true")
        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(code__icontains=search))
        return qs

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school)

    def perform_destroy(self, instance):
        """Soft-delete the room."""
        instance.soft_delete()

    @action(detail=False, methods=["get"], url_path="occupancy")
    def occupancy(self, request):
        """
        GET /api/v1/academics/rooms/occupancy/?day=0
        Returns room occupancy information for all school rooms.
        """
        school = _resolve_school(request)
        if not school:
            return Response([])
        day = request.query_params.get("day")
        day_int = int(day) if day is not None else None
        result = get_room_occupancy(school, day_of_week=day_int)
        return Response(result)

    @action(detail=True, methods=["get"], url_path="schedule")
    def room_schedule(self, request, pk=None):
        """
        GET /api/v1/academics/rooms/{id}/schedule/
        Returns the full weekly schedule for a specific room.
        """
        school = _resolve_school(request)
        room = Room.objects.filter(pk=pk, school=school, is_deleted=False).first()
        if not room:
            return Response(
                {"detail": "Room not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        slots = (
            ScheduleSlot.objects.filter(school=school, room=room)
            .select_related("assigned_class", "subject", "teacher")
            .order_by("day_of_week", "start_time")
        )
        from collections import defaultdict

        schedule = defaultdict(list)
        for slot in slots:
            schedule[slot.day_of_week].append(
                {
                    "id": str(slot.pk),
                    "day": slot.day_of_week,
                    "start": slot.start_time.strftime("%H:%M"),
                    "end": slot.end_time.strftime("%H:%M"),
                    "class": slot.assigned_class.name,
                    "subject": slot.subject.name,
                    "teacher": slot.teacher.full_name,
                }
            )
        return Response(dict(schedule))


# ---------------------------------------------------------------------------
# Teacher Availability
# ---------------------------------------------------------------------------


class TeacherAvailabilityViewSet(viewsets.ModelViewSet):
    """
    CRUD for teacher unavailability blocks.
    These blocks prevent scheduling a teacher during those times.
    """

    serializer_class = TeacherAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return TeacherAvailability.objects.none()
        qs = TeacherAvailability.objects.filter(school=school).select_related("teacher")
        teacher_id = self.request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        return qs

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school)


# ---------------------------------------------------------------------------
# Time Slot Config
# ---------------------------------------------------------------------------


class TimeSlotConfigViewSet(viewsets.ModelViewSet):
    """CRUD for configurable time slots (the grid rows)."""

    serializer_class = TimeSlotConfigSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return TimeSlotConfig.objects.none()
        return TimeSlotConfig.objects.filter(school=school, is_deleted=False)

    def perform_create(self, serializer):
        school = _resolve_school(self.request)
        serializer.save(school=school)

    @action(detail=False, methods=["post"], url_path="seed-defaults")
    def seed_defaults(self, request):
        """
        POST /api/v1/academics/time-slots/seed-defaults/
        Seeds the default Algerian school time slots if none exist.
        """
        school = _resolve_school(request)
        if not school:
            return Response(
                {"detail": "No school resolved."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        existing = TimeSlotConfig.objects.filter(
            school=school, is_deleted=False
        ).count()
        if existing > 0:
            return Response(
                {"detail": "Time slots already configured.", "count": existing}
            )

        from datetime import time as dt_time

        defaults = [
            ("8h-9h", dt_time(8, 0), dt_time(9, 0), 1, False),
            ("9h-10h", dt_time(9, 0), dt_time(10, 0), 2, False),
            ("10h-10h15", dt_time(10, 0), dt_time(10, 15), 3, True),
            ("10h15-11h15", dt_time(10, 15), dt_time(11, 15), 4, False),
            ("11h15-12h15", dt_time(11, 15), dt_time(12, 15), 5, False),
            ("12h15-13h", dt_time(12, 15), dt_time(13, 0), 6, True),
            ("13h-14h", dt_time(13, 0), dt_time(14, 0), 7, False),
            ("14h-15h", dt_time(14, 0), dt_time(15, 0), 8, False),
            ("15h-15h15", dt_time(15, 0), dt_time(15, 15), 9, True),
            ("15h15-16h15", dt_time(15, 15), dt_time(16, 15), 10, False),
            ("16h15-17h15", dt_time(16, 15), dt_time(17, 15), 11, False),
        ]
        created = []
        for label, start, end, order, is_break in defaults:
            obj = TimeSlotConfig.objects.create(
                school=school,
                label=label,
                start_time=start,
                end_time=end,
                order=order,
                is_break=is_break,
            )
            created.append(obj.pk)
        return Response({"created": len(created)}, status=status.HTTP_201_CREATED)


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
