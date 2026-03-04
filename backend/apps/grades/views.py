"""
╔══════════════════════════════════════════════════════════════════════════╗
║  Grades Views — complete REST API                                      ║
║                                                                        ║
║  ExamType           CRUD + percentage validation                       ║
║  Grade              bulk-enter / list / publish / correct              ║
║  SubjectAverage     list / recalculate / override / publish            ║
║  TrimesterAverage   list / recalculate / override / publish / lock     ║
║  GradeAppeal        create / list / respond / pending-count            ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

import logging
from decimal import Decimal

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import StudentProfile, TeacherAssignment
from apps.accounts.models import User

from .models import (
    AnnualAverage,
    ExamType,
    Grade,
    GradeAppeal,
    GradeAuditLog,
    ReportCard,
    SubjectAverage,
    TrimesterAverage,
)
from .audit import log_grade_action
from .permissions import (
    IsAdminOnly,
    IsAdminOrTeacherOfClassroom,
    IsNotLocked,
    IsTeacherOfClassroom,
)
from .serializers import (
    AnnualAverageSerializer,
    ExamTypeCreateSerializer,
    ExamTypeSerializer,
    GradeAppealCreateSerializer,
    GradeAppealRespondSerializer,
    GradeAppealSerializer,
    GradeAuditLogSerializer,
    GradeBulkEnterSerializer,
    GradeCorrectSerializer,
    GradePublishSerializer,
    GradeSerializer,
    ReportCardSerializer,
    SubjectAverageOverrideSerializer,
    SubjectAveragePublishSerializer,
    SubjectAverageRecalcSerializer,
    SubjectAverageSerializer,
    TrimesterAverageSerializer,
    TrimesterLockSerializer,
    TrimesterOverrideSerializer,
    TrimesterPublishSerializer,
    TrimesterRecalcSerializer,
    TrimesterUnlockSerializer,
)

logger = logging.getLogger(__name__)


def _resolve_school(request):
    """Resolve school for the current user."""
    user = request.user
    if user.school_id:
        return user.school
    from apps.schools.models import School

    school_id = request.query_params.get("school") or request.data.get("school")
    if school_id:
        return School.objects.filter(pk=school_id, is_deleted=False).first()
    schools = School.objects.filter(is_deleted=False)
    if schools.count() == 1:
        return schools.first()
    return None


def _get_active_academic_year(school):
    """Return the current academic year for a school."""
    from apps.schools.models import AcademicYear

    return AcademicYear.objects.filter(school=school, is_current=True).first()


# ═══════════════════════════════════════════════════════════════════════════
# 1. EXAM TYPE — CRUD
# ═══════════════════════════════════════════════════════════════════════════


class ExamTypeViewSet(viewsets.ModelViewSet):
    """
    CRUD for ExamType.
    - POST/PUT/DELETE: IsAdminOrTeacherOfClassroom + IsNotLocked
    - GET: IsAdminOrTeacherOfClassroom
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacherOfClassroom]

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ExamTypeCreateSerializer
        return ExamTypeSerializer

    def get_queryset(self):
        school = _resolve_school(self.request)
        if not school:
            return ExamType.objects.none()

        qs = ExamType.objects.filter(
            classroom__section__school=school,
        ).select_related("subject", "classroom", "academic_year")

        # Filters
        classroom_id = self.request.query_params.get("classroom_id")
        subject_id = self.request.query_params.get("subject_id")
        trimester = self.request.query_params.get("trimester")

        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)
        if trimester:
            qs = qs.filter(trimester=int(trimester))

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [
                permissions.IsAuthenticated(),
                IsAdminOrTeacherOfClassroom(),
                IsNotLocked(),
            ]
        return super().get_permissions()

    @extend_schema(tags=["grades"], summary="Delete exam type")
    def destroy(self, request, *args, **kwargs):
        """Vérifier qu'aucune note n'existe avant suppression."""
        instance = self.get_object()
        grade_count = Grade.objects.filter(exam_type=instance).count()
        if grade_count > 0:
            return Response(
                {
                    "detail": (
                        f"Impossible de supprimer : {grade_count} note(s) existent "
                        "pour ce type d'examen. Supprimez les notes d'abord."
                    ),
                    "grade_count": grade_count,
                },
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)


# ═══════════════════════════════════════════════════════════════════════════
# 2. GRADE — bulk-enter / list / publish / correct
# ═══════════════════════════════════════════════════════════════════════════


class GradeBulkEnterView(APIView):
    """
    POST /api/grades/bulk-enter/
    Body: { exam_type_id, grades: [{student_id, score, is_absent}] }
    Permission: IsTeacherOfClassroom + IsNotLocked
    """

    permission_classes = [
        permissions.IsAuthenticated,
        IsTeacherOfClassroom,
        IsNotLocked,
    ]

    @extend_schema(
        tags=["grades"],
        summary="Bulk enter grades for an exam",
        request=GradeBulkEnterSerializer,
    )
    def post(self, request):
        ser = GradeBulkEnterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        exam_type = get_object_or_404(ExamType, pk=ser.validated_data["exam_type_id"])
        user = request.user
        saved = 0
        errors = []

        for idx, item in enumerate(ser.validated_data["grades"]):
            try:
                student = StudentProfile.objects.get(
                    pk=item["student_id"],
                    is_deleted=False,
                )
            except StudentProfile.DoesNotExist:
                errors.append({"index": idx, "error": "Élève introuvable."})
                continue

            score = item.get("score")
            is_absent = item.get("is_absent", False)

            if score is not None and score > exam_type.max_score:
                errors.append(
                    {
                        "index": idx,
                        "error": f"Note {score} dépasse le barème {exam_type.max_score}.",
                    }
                )
                continue

            grade, _ = Grade.objects.update_or_create(
                student=student,
                exam_type=exam_type,
                defaults={
                    "score": score,
                    "is_absent": is_absent,
                    "entered_by": user,
                },
            )
            saved += 1
            # Audit
            log_grade_action(
                action="GRADE_ENTERED",
                instance=grade,
                performed_by=user,
                request=request,
                student=student,
                new_value=score,
                subject_name=str(exam_type.subject),
                exam_name=exam_type.name,
                trimester=exam_type.trimester,
            )
            # Note: post_save signal on Grade will trigger async_recalculate_cascade

        return Response(
            {"saved": saved, "errors": errors},
            status=status.HTTP_200_OK,
        )


class GradeListView(APIView):
    """
    GET /api/grades/?classroom_id=X&exam_type_id=Y
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacherOfClassroom]

    @extend_schema(tags=["grades"], summary="List grades")
    def get(self, request):
        qs = Grade.objects.select_related(
            "student__user",
            "exam_type__subject",
            "exam_type__classroom",
        )

        classroom_id = request.query_params.get("classroom_id")
        exam_type_id = request.query_params.get("exam_type_id")
        student_id = request.query_params.get("student_id")
        trimester = request.query_params.get("trimester")

        if classroom_id:
            qs = qs.filter(exam_type__classroom_id=classroom_id)
        if exam_type_id:
            qs = qs.filter(exam_type_id=exam_type_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        if trimester:
            qs = qs.filter(exam_type__trimester=int(trimester))

        # Tenant isolation: only grades from user's school
        school = _resolve_school(request)
        if school:
            qs = qs.filter(exam_type__classroom__section__school=school)

        serializer = GradeSerializer(qs, many=True)
        return Response(serializer.data)


class GradePublishView(APIView):
    """
    POST /api/grades/publish/
    Body: { exam_type_id }
    Permission: IsTeacherOfClassroom
    Publier toutes les notes d'un exam_type.
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacherOfClassroom]

    @extend_schema(tags=["grades"], summary="Publish grades for an exam type")
    def post(self, request):
        ser = GradePublishSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        exam_type = get_object_or_404(ExamType, pk=ser.validated_data["exam_type_id"])
        now = timezone.now()

        grades_to_publish = list(
            Grade.objects.filter(
                exam_type=exam_type,
                is_published=False,
            ).select_related("student")
        )
        count = Grade.objects.filter(
            pk__in=[g.pk for g in grades_to_publish],
        ).update(
            is_published=True,
            published_at=now,
            published_by=request.user,
        )

        # Audit — one entry per published grade
        for g in grades_to_publish:
            log_grade_action(
                action="GRADE_PUBLISHED",
                instance=g,
                performed_by=request.user,
                request=request,
                student=g.student,
                new_value=g.score,
                subject_name=str(exam_type.subject),
                exam_name=exam_type.name,
                trimester=exam_type.trimester,
            )

        return Response({"published_count": count})


class GradeCorrectView(APIView):
    """
    POST /api/grades/{id}/correct/
    Body: { new_score, reason }
    Permission: IsAdminOrTeacherOfClassroom + IsNotLocked
    Modifier la note + recalcul en cascade + log.
    """

    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminOrTeacherOfClassroom,
        IsNotLocked,
    ]

    @extend_schema(
        tags=["grades"],
        summary="Correct a grade",
        request=GradeCorrectSerializer,
    )
    def post(self, request, pk):
        ser = GradeCorrectSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        grade = get_object_or_404(
            Grade.objects.select_related("exam_type"),
            pk=pk,
        )

        old_score = grade.score
        new_score = ser.validated_data["new_score"]
        reason = ser.validated_data["reason"]

        # Validate against max_score
        if new_score > grade.exam_type.max_score:
            return Response(
                {
                    "detail": f"La note {new_score} dépasse le barème {grade.exam_type.max_score}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update grade
        grade.score = new_score
        grade.is_absent = False
        grade.entered_by = request.user
        grade.save()
        # post_save signal triggers cascade

        # Audit
        log_grade_action(
            action="GRADE_CORRECTED",
            instance=grade,
            performed_by=request.user,
            request=request,
            student=grade.student,
            old_value=old_score,
            new_value=new_score,
            reason=reason,
            subject_name=str(grade.exam_type.subject),
            exam_name=grade.exam_type.name,
            trimester=grade.exam_type.trimester,
        )

        logger.info(
            "GRADE_CORRECT: grade=%s old=%s new=%s reason='%s' by=%s",
            pk,
            old_score,
            new_score,
            reason,
            request.user.pk,
        )

        return Response(
            {
                "id": str(grade.pk),
                "old_score": str(old_score) if old_score is not None else None,
                "new_score": str(new_score),
                "reason": reason,
            }
        )


# ═══════════════════════════════════════════════════════════════════════════
# 3. SUBJECT AVERAGE — list / recalculate / override / publish
# ═══════════════════════════════════════════════════════════════════════════


class SubjectAverageListView(APIView):
    """
    GET /api/grades/subject-averages/?classroom_id=X&trimester=1
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["grades"], summary="List subject averages")
    def get(self, request):
        qs = SubjectAverage.objects.select_related(
            "student__user",
            "subject",
            "classroom",
        )

        classroom_id = request.query_params.get("classroom_id")
        trimester = request.query_params.get("trimester")
        student_id = request.query_params.get("student_id")
        subject_id = request.query_params.get("subject_id")

        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        if trimester:
            qs = qs.filter(trimester=int(trimester))
        if student_id:
            qs = qs.filter(student_id=student_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        # Tenant isolation
        school = _resolve_school(request)
        if school:
            qs = qs.filter(classroom__section__school=school)

        serializer = SubjectAverageSerializer(qs, many=True)
        return Response(serializer.data)


class SubjectAverageRecalculateView(APIView):
    """
    POST /api/grades/subject-averages/recalculate/
    Body: { classroom_id, subject_id, trimester }
    Forcer le recalcul pour toute la classe.
    """

    permission_classes = [
        permissions.IsAuthenticated,
        IsAdminOrTeacherOfClassroom,
    ]

    @extend_schema(
        tags=["grades"],
        summary="Force subject average recalculation",
        request=SubjectAverageRecalcSerializer,
    )
    def post(self, request):
        ser = SubjectAverageRecalcSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        from apps.academics.models import Class

        classroom = get_object_or_404(Class, pk=ser.validated_data["classroom_id"])
        subject_id = ser.validated_data["subject_id"]
        trimester = ser.validated_data["trimester"]
        academic_year = _get_active_academic_year(_resolve_school(request))

        if not academic_year:
            return Response(
                {"detail": "Aucune année scolaire active trouvée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .services import LockedException, calculate_subject_average

        students = StudentProfile.objects.filter(
            current_class=classroom,
            is_deleted=False,
        )

        recalculated = 0
        locked_skipped = 0
        for student in students:
            try:
                result = calculate_subject_average(
                    student.pk,
                    subject_id,
                    classroom.pk,
                    academic_year.pk,
                    trimester,
                    save=True,
                )
                if result is not None:
                    recalculated += 1
            except LockedException:
                locked_skipped += 1

        return Response(
            {
                "recalculated": recalculated,
                "locked_skipped": locked_skipped,
            }
        )


class SubjectAverageOverrideView(APIView):
    """
    POST /api/grades/subject-averages/override/
    Body: { subject_average_id, new_value, reason }
    Permission: IsAdminOnly
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]

    @extend_schema(
        tags=["grades"],
        summary="Override subject average (admin)",
        request=SubjectAverageOverrideSerializer,
    )
    def post(self, request):
        ser = SubjectAverageOverrideSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        from .services import (
            LockedException,
            PermissionDeniedException,
            admin_override_average,
        )

        sa = get_object_or_404(
            SubjectAverage, pk=ser.validated_data["subject_average_id"]
        )
        old_val = sa.effective_average

        try:
            result = admin_override_average(
                override_type="subject_average",
                object_id=ser.validated_data["subject_average_id"],
                new_value=ser.validated_data["new_value"],
                admin_user=request.user,
            )
        except LockedException as e:
            return Response({"detail": str(e)}, status=status.HTTP_423_LOCKED)
        except PermissionDeniedException as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)

        # Audit
        log_grade_action(
            action="AVERAGE_OVERRIDDEN",
            instance=sa,
            performed_by=request.user,
            request=request,
            student=sa.student,
            old_value=old_val,
            new_value=ser.validated_data["new_value"],
            reason=ser.validated_data["reason"],
            subject_name=str(sa.subject),
            trimester=sa.trimester,
        )

        logger.info(
            "SubjectAverage override — reason='%s' by=%s",
            ser.validated_data["reason"],
            request.user.pk,
        )
        return Response(result)


class SubjectAveragePublishView(APIView):
    """
    POST /api/grades/subject-averages/publish/
    Body: { classroom_id, subject_id, trimester }
    Permission: IsAdminOnly
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]

    @extend_schema(
        tags=["grades"],
        summary="Publish subject averages (admin only)",
        request=SubjectAveragePublishSerializer,
    )
    def post(self, request):
        ser = SubjectAveragePublishSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        now = timezone.now()
        count = SubjectAverage.objects.filter(
            classroom_id=ser.validated_data["classroom_id"],
            subject_id=ser.validated_data["subject_id"],
            trimester=ser.validated_data["trimester"],
            is_published=False,
        ).update(
            is_published=True,
            published_at=now,
            published_by=request.user,
        )

        return Response({"published_count": count})


# ═══════════════════════════════════════════════════════════════════════════
# 4. TRIMESTER AVERAGE — list / recalculate / override / publish / lock
# ═══════════════════════════════════════════════════════════════════════════


class TrimesterAverageListView(APIView):
    """
    GET /api/grades/trimester-averages/?classroom_id=X&trimester=1
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["grades"], summary="List trimester averages")
    def get(self, request):
        qs = TrimesterAverage.objects.select_related(
            "student__user",
            "classroom",
        )

        classroom_id = request.query_params.get("classroom_id")
        trimester = request.query_params.get("trimester")
        student_id = request.query_params.get("student_id")

        if classroom_id:
            qs = qs.filter(classroom_id=classroom_id)
        if trimester:
            qs = qs.filter(trimester=int(trimester))
        if student_id:
            qs = qs.filter(student_id=student_id)

        school = _resolve_school(request)
        if school:
            qs = qs.filter(classroom__section__school=school)

        serializer = TrimesterAverageSerializer(qs, many=True)
        return Response(serializer.data)


class TrimesterRecalculateView(APIView):
    """
    POST /api/grades/trimester-averages/recalculate/
    Body: { classroom_id, trimester }
    Permission: IsAdminOnly
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]

    @extend_schema(
        tags=["grades"],
        summary="Recalculate trimester averages + rankings",
        request=TrimesterRecalcSerializer,
    )
    def post(self, request):
        ser = TrimesterRecalcSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        from .services import recalculate_classroom_trimester

        school = _resolve_school(request)
        academic_year = _get_active_academic_year(school) if school else None
        if not academic_year:
            return Response(
                {"detail": "Aucune année scolaire active trouvée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        summary = recalculate_classroom_trimester(
            ser.validated_data["classroom_id"],
            academic_year.pk,
            ser.validated_data["trimester"],
        )
        return Response(summary)


class TrimesterOverrideView(APIView):
    """
    POST /api/grades/trimester-averages/override/
    Body: { trimester_average_id, new_value, reason }
    Permission: IsAdminOnly
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]

    @extend_schema(
        tags=["grades"],
        summary="Override trimester average (admin)",
        request=TrimesterOverrideSerializer,
    )
    def post(self, request):
        ser = TrimesterOverrideSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        from .services import (
            LockedException,
            PermissionDeniedException,
            admin_override_average,
        )

        ta = get_object_or_404(
            TrimesterAverage, pk=ser.validated_data["trimester_average_id"]
        )
        old_val = ta.effective_average

        try:
            result = admin_override_average(
                override_type="trimester_average",
                object_id=ser.validated_data["trimester_average_id"],
                new_value=ser.validated_data["new_value"],
                admin_user=request.user,
            )
        except LockedException as e:
            return Response({"detail": str(e)}, status=status.HTTP_423_LOCKED)
        except PermissionDeniedException as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)

        # Audit
        log_grade_action(
            action="AVERAGE_OVERRIDDEN",
            instance=ta,
            performed_by=request.user,
            request=request,
            student=ta.student,
            old_value=old_val,
            new_value=ser.validated_data["new_value"],
            reason=ser.validated_data["reason"],
            trimester=ta.trimester,
        )

        logger.info(
            "TrimesterAverage override — reason='%s' by=%s",
            ser.validated_data["reason"],
            request.user.pk,
        )
        return Response(result)


class TrimesterPublishView(APIView):
    """
    POST /api/grades/trimester-averages/publish/
    Body: { classroom_id, trimester }
    Permission: IsAdminOnly
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]

    @extend_schema(
        tags=["grades"],
        summary="Publish trimester averages (admin only)",
        request=TrimesterPublishSerializer,
    )
    def post(self, request):
        ser = TrimesterPublishSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        now = timezone.now()
        count = TrimesterAverage.objects.filter(
            classroom_id=ser.validated_data["classroom_id"],
            trimester=ser.validated_data["trimester"],
            is_published=False,
        ).update(
            is_published=True,
            published_at=now,
            published_by=request.user,
        )

        return Response({"published_count": count})


class TrimesterLockView(APIView):
    """
    POST /api/grades/trimester-averages/lock/
    Body: { classroom_id, trimester }
    Permission: IsAdminOnly
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]

    @extend_schema(
        tags=["grades"],
        summary="Lock trimester",
        request=TrimesterLockSerializer,
    )
    def post(self, request):
        ser = TrimesterLockSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        from .services import LockedException, PermissionDeniedException, lock_trimester

        school = _resolve_school(request)
        academic_year = _get_active_academic_year(school) if school else None
        if not academic_year:
            return Response(
                {"detail": "Aucune année scolaire active trouvée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = lock_trimester(
                classroom_id=ser.validated_data["classroom_id"],
                academic_year_id=academic_year.pk,
                trimester=ser.validated_data["trimester"],
                director_user=request.user,
                check_completeness=True,
            )
        except PermissionDeniedException as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Audit — log for each locked trimester average
        locked_avgs = TrimesterAverage.objects.filter(
            classroom_id=ser.validated_data["classroom_id"],
            trimester=ser.validated_data["trimester"],
            is_locked=True,
        ).select_related("student")
        for ta in locked_avgs:
            log_grade_action(
                action="TRIMESTER_LOCKED",
                instance=ta,
                performed_by=request.user,
                request=request,
                student=ta.student,
                trimester=ser.validated_data["trimester"],
            )

        return Response(result)


class TrimesterUnlockView(APIView):
    """
    POST /api/grades/trimester-averages/unlock/
    Body: { classroom_id, trimester, reason }
    Permission: IsAdminOnly
    """

    permission_classes = [permissions.IsAuthenticated, IsAdminOnly]

    @extend_schema(
        tags=["grades"],
        summary="Unlock trimester",
        request=TrimesterUnlockSerializer,
    )
    def post(self, request):
        ser = TrimesterUnlockSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        from .services import PermissionDeniedException, unlock_trimester

        school = _resolve_school(request)
        academic_year = _get_active_academic_year(school) if school else None
        if not academic_year:
            return Response(
                {"detail": "Aucune année scolaire active trouvée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            result = unlock_trimester(
                classroom_id=ser.validated_data["classroom_id"],
                academic_year_id=academic_year.pk,
                trimester=ser.validated_data["trimester"],
                director_user=request.user,
                reason=ser.validated_data["reason"],
            )
        except PermissionDeniedException as e:
            return Response({"detail": str(e)}, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Audit — log for each unlocked trimester average
        unlocked_avgs = TrimesterAverage.objects.filter(
            classroom_id=ser.validated_data["classroom_id"],
            trimester=ser.validated_data["trimester"],
            is_locked=False,
        ).select_related("student")
        for ta in unlocked_avgs:
            log_grade_action(
                action="TRIMESTER_UNLOCKED",
                instance=ta,
                performed_by=request.user,
                request=request,
                student=ta.student,
                trimester=ser.validated_data["trimester"],
                reason=ser.validated_data["reason"],
            )

        return Response(result)


# ═══════════════════════════════════════════════════════════════════════════
# 5. GRADE APPEAL — create / list / respond / pending-count
# ═══════════════════════════════════════════════════════════════════════════


class GradeAppealCreateView(APIView):
    """
    POST /api/grades/appeals/
    Permission: IsAuthenticated (student from their app)
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["grades"],
        summary="Create a grade appeal",
        request=GradeAppealCreateSerializer,
    )
    def post(self, request):
        ser = GradeAppealCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        # Resolve student profile
        try:
            student = request.user.student_profile
        except StudentProfile.DoesNotExist:
            return Response(
                {"detail": "Profil étudiant introuvable."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        appeal_type = data["appeal_type"]
        appeal = GradeAppeal(
            student=student,
            appeal_type=appeal_type,
            reason=data["reason"],
            student_comment=data.get("student_comment", ""),
            status=GradeAppeal.Status.PENDING,
        )

        # Resolve FK + auto-assign teacher or admin
        if appeal_type == GradeAppeal.AppealType.EXAM_GRADE:
            grade = get_object_or_404(Grade, pk=data["grade_id"])
            appeal.grade = grade
            appeal.original_value = grade.score
            # Assign to the teacher of that subject in that class
            teacher = self._find_teacher(
                grade.exam_type.classroom,
                grade.exam_type.subject,
            )
            if teacher:
                appeal.assigned_to_teacher = teacher

        elif appeal_type == GradeAppeal.AppealType.SUBJECT_AVERAGE:
            sa = get_object_or_404(SubjectAverage, pk=data["subject_average_id"])
            appeal.subject_average = sa
            appeal.original_value = sa.effective_average
            teacher = self._find_teacher(sa.classroom, sa.subject)
            if teacher:
                appeal.assigned_to_teacher = teacher

        elif appeal_type == GradeAppeal.AppealType.TRIMESTER_AVERAGE:
            ta = get_object_or_404(TrimesterAverage, pk=data["trimester_average_id"])
            appeal.trimester_average = ta
            appeal.original_value = ta.effective_average
            appeal.assigned_to_admin = True

        elif appeal_type == GradeAppeal.AppealType.ANNUAL_AVERAGE:
            appeal.assigned_to_admin = True

        appeal.save()
        # Signal post_save triggers notify_appeal_assigned

        # Audit
        log_grade_action(
            action="APPEAL_CREATED",
            instance=appeal,
            performed_by=request.user,
            request=request,
            student=student,
            old_value=appeal.original_value,
            reason=data["reason"],
        )

        return Response(
            GradeAppealSerializer(appeal).data,
            status=status.HTTP_201_CREATED,
        )

    @staticmethod
    def _find_teacher(classroom, subject):
        """Find the TeacherProfile assigned to this subject/classroom."""
        from apps.academics.models import TeacherProfile

        assignment = (
            TeacherAssignment.objects.filter(
                assigned_class=classroom,
                subject=subject,
            )
            .select_related("teacher__teacher_profile")
            .first()
        )

        if assignment:
            try:
                return assignment.teacher.teacher_profile
            except TeacherProfile.DoesNotExist:
                pass
        return None


class GradeAppealListView(APIView):
    """
    GET /api/grades/appeals/
    Permission: role-based filtering
    - STUDENT → own appeals only
    - TEACHER → appeals assigned to them
    - ADMIN/SECTION_ADMIN → all school appeals
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["grades"], summary="List grade appeals")
    def get(self, request):
        user = request.user
        qs = GradeAppeal.objects.select_related(
            "student__user",
            "grade__exam_type__subject",
            "subject_average__subject",
            "trimester_average",
            "assigned_to_teacher__user",
            "responded_by",
        ).order_by("-created_at")

        if user.role == User.Role.STUDENT:
            try:
                student = user.student_profile
                qs = qs.filter(student=student)
            except StudentProfile.DoesNotExist:
                qs = qs.none()

        elif user.role == User.Role.TEACHER:
            try:
                teacher_profile = user.teacher_profile
                qs = qs.filter(assigned_to_teacher=teacher_profile)
            except Exception:
                qs = qs.none()

        elif user.role in (
            User.Role.ADMIN,
            User.Role.SECTION_ADMIN,
            User.Role.SUPER_ADMIN,
        ):
            school = _resolve_school(request)
            if school:
                qs = qs.filter(student__current_class__section__school=school)
        else:
            qs = qs.none()

        # Optional filters
        appeal_status = request.query_params.get("status")
        if appeal_status:
            qs = qs.filter(status=appeal_status.upper())

        serializer = GradeAppealSerializer(qs, many=True)
        return Response(serializer.data)


class GradeAppealRespondView(APIView):
    """
    POST /api/grades/appeals/{id}/respond/
    Body: { status, response, corrected_value (optional) }
    Permission: TEACHER (for their appeals) or ADMIN
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["grades"],
        summary="Respond to a grade appeal",
        request=GradeAppealRespondSerializer,
    )
    def post(self, request, pk):
        ser = GradeAppealRespondSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        appeal = get_object_or_404(
            GradeAppeal.objects.select_related(
                "grade__exam_type",
                "subject_average",
                "trimester_average",
                "student__user",
            ),
            pk=pk,
        )

        user = request.user

        # Permission check: teacher can only respond to their own assigned appeals
        if user.role == User.Role.TEACHER:
            try:
                tp = user.teacher_profile
                if appeal.assigned_to_teacher_id != tp.pk:
                    return Response(
                        {"detail": "Ce recours ne vous est pas assigné."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except Exception:
                return Response(
                    {"detail": "Profil enseignant introuvable."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif user.role not in (
            User.Role.ADMIN,
            User.Role.SECTION_ADMIN,
            User.Role.SUPER_ADMIN,
        ):
            return Response(
                {"detail": "Permission refusée."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Update appeal
        appeal.status = data["status"]
        appeal.response = data["response"]
        appeal.responded_by = user
        appeal.responded_at = timezone.now()

        # If ACCEPTED + corrected_value → apply correction
        corrected_value = data.get("corrected_value")
        if (
            data["status"] == GradeAppeal.Status.ACCEPTED
            and corrected_value is not None
        ):
            appeal.corrected_value = corrected_value

            if appeal.appeal_type == GradeAppeal.AppealType.EXAM_GRADE and appeal.grade:
                # Correct the grade directly
                appeal.grade.score = corrected_value
                appeal.grade.is_absent = False
                appeal.grade.entered_by = user
                appeal.grade.save()  # triggers cascade via signal

            elif (
                appeal.appeal_type == GradeAppeal.AppealType.SUBJECT_AVERAGE
                and appeal.subject_average
            ):
                from .services import LockedException, admin_override_average

                try:
                    admin_override_average(
                        override_type="subject_average",
                        object_id=appeal.subject_average_id,
                        new_value=corrected_value,
                        admin_user=user,
                    )
                except (LockedException, Exception) as e:
                    logger.warning("Appeal override failed: %s", e)

            elif (
                appeal.appeal_type == GradeAppeal.AppealType.TRIMESTER_AVERAGE
                and appeal.trimester_average
            ):
                from .services import LockedException, admin_override_average

                try:
                    admin_override_average(
                        override_type="trimester_average",
                        object_id=appeal.trimester_average_id,
                        new_value=corrected_value,
                        admin_user=user,
                    )
                except (LockedException, Exception) as e:
                    logger.warning("Appeal override failed: %s", e)

        appeal.save()

        # Audit
        audit_action = (
            "APPEAL_ACCEPTED"
            if data["status"] == GradeAppeal.Status.ACCEPTED
            else "APPEAL_REJECTED"
        )
        log_grade_action(
            action=audit_action,
            instance=appeal,
            performed_by=user,
            request=request,
            student=appeal.student,
            old_value=appeal.original_value,
            new_value=corrected_value,
            reason=data["response"],
        )

        # Notify student of outcome
        try:
            from apps.notifications.tasks import send_notification

            status_label = (
                "accepté" if data["status"] == GradeAppeal.Status.ACCEPTED else "rejeté"
            )
            send_notification.delay(
                user_id=str(appeal.student.user_id),
                title=f"Recours {status_label}",
                body=f"Votre recours a été {status_label}. Réponse : {data['response'][:100]}",
                notification_type="GRADE_APPEAL",
                related_object_id=str(appeal.pk),
                related_object_type="GradeAppeal",
            )
        except Exception:
            logger.exception("Failed to notify student about appeal response")

        return Response(GradeAppealSerializer(appeal).data)


class GradeAppealPendingCountView(APIView):
    """
    GET /api/grades/appeals/pending-count/
    Returns { teacher_pending, admin_pending }
    For sidebar badge notifications.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(tags=["grades"], summary="Pending appeal counts")
    def get(self, request):
        user = request.user
        school = _resolve_school(request)

        base_qs = GradeAppeal.objects.filter(
            status__in=[GradeAppeal.Status.PENDING, GradeAppeal.Status.UNDER_REVIEW],
        )
        if school:
            base_qs = base_qs.filter(student__current_class__section__school=school)

        teacher_pending = 0
        admin_pending = 0

        if user.role == User.Role.TEACHER:
            try:
                tp = user.teacher_profile
                teacher_pending = base_qs.filter(assigned_to_teacher=tp).count()
            except Exception:
                pass
        elif user.role in (
            User.Role.ADMIN,
            User.Role.SECTION_ADMIN,
            User.Role.SUPER_ADMIN,
        ):
            teacher_pending = base_qs.filter(
                assigned_to_teacher__isnull=False,
            ).count()
            admin_pending = base_qs.filter(assigned_to_admin=True).count()

        return Response(
            {
                "teacher_pending": teacher_pending,
                "admin_pending": admin_pending,
            }
        )


# ═══════════════════════════════════════════════════════════════════════════
# 6. AUDIT LOG
# ═══════════════════════════════════════════════════════════════════════════


class GradeAuditLogView(APIView):
    """
    GET /api/grades/audit-log/?student_id=X&trimester=1
    Permission: IsAdminOnly ou enseignant de la classe.
    Retourne l'historique complet des modifications d'un élève.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["grades"],
        summary="Audit log timeline for a student",
    )
    def get(self, request):
        student_id = request.query_params.get("student_id")
        if not student_id:
            return Response(
                {"detail": "Le paramètre student_id est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = GradeAuditLog.objects.filter(
            student_id=student_id,
        ).select_related("performed_by")

        # Filters
        trimester = request.query_params.get("trimester")
        action_filter = request.query_params.get("action")
        if trimester:
            qs = qs.filter(trimester=int(trimester))
        if action_filter:
            qs = qs.filter(action=action_filter.upper())

        # Tenant isolation
        school = _resolve_school(request)
        if school:
            qs = qs.filter(student__current_class__section__school=school)

        # Permission: teacher can only see logs for students in their classes
        user = request.user
        if user.role == User.Role.TEACHER:
            teacher_class_ids = TeacherAssignment.objects.filter(
                teacher=user,
            ).values_list("assigned_class_id", flat=True)
            qs = qs.filter(student__current_class_id__in=teacher_class_ids)
        elif user.role not in (
            User.Role.ADMIN,
            User.Role.SECTION_ADMIN,
            User.Role.SUPER_ADMIN,
        ):
            return Response(
                {"detail": "Permission refusée."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = GradeAuditLogSerializer(qs[:200], many=True)
        return Response(serializer.data)
