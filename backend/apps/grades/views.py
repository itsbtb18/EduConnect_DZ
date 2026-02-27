"""
Grades views — teacher submits, admin reviews / publishes / returns.
"""

from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import StudentProfile
from core.permissions import IsSchoolAdmin, IsTeacher

from .models import Grade, Subject
from .serializers import GradeBulkSubmitSerializer, GradeReturnSerializer

# Reusable inline schemas
_GradeSubmitResponseSchema = inline_serializer(
    "GradeSubmitResponse",
    fields={
        "created": serializers.IntegerField(),
        "updated": serializers.IntegerField(),
        "errors": serializers.ListField(child=serializers.DictField()),
    },
)

_DetailSchema = inline_serializer(
    "GradeDetailResponse",
    fields={"detail": serializers.CharField()},
)


# ---------------------------------------------------------------------------
# 1. GradeSubmitView — teacher bulk-creates / updates DRAFT grades
# ---------------------------------------------------------------------------


class GradeSubmitView(APIView):
    """
    POST /api/v1/grades/submit/
    Accepts a list of grade items from a teacher.
    Creates or updates Grade records with status=DRAFT.
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    @extend_schema(
        tags=["grades"],
        summary="Bulk submit grades (teacher)",
        description=(
            "Teacher submits a list of grade items. Each item creates or updates "
            "a DRAFT grade record. Returns counts of created/updated and any errors."
        ),
        request=GradeBulkSubmitSerializer,
        responses={
            200: _GradeSubmitResponseSchema,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Not a teacher."),
        },
    )
    def post(self, request):
        serializer = GradeBulkSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        created = 0
        updated = 0
        errors = []

        for idx, item in enumerate(serializer.validated_data["grades"]):
            # ---- Resolve subject ----
            try:
                subject = Subject.objects.get(
                    pk=item["subject_id"],
                    school=user.school,
                    is_deleted=False,
                )
            except Subject.DoesNotExist:
                errors.append({"index": idx, "error": "Subject not found."})
                continue

            # ---- Teacher must be assigned to this subject ----
            if subject.teacher_id != user.pk:
                errors.append(
                    {"index": idx, "error": "You are not assigned to this subject."}
                )
                continue

            # ---- Resolve student ----
            try:
                student = StudentProfile.objects.get(
                    pk=item["student_id"],
                    is_deleted=False,
                )
            except StudentProfile.DoesNotExist:
                errors.append({"index": idx, "error": "Student not found."})
                continue

            # ---- Validate value range ----
            value = item["value"]
            if value < 0:
                errors.append({"index": idx, "error": "Value cannot be negative."})
                continue
            # max_value defaults to 20 on the model; compare to subject default
            if value > 20:
                errors.append(
                    {"index": idx, "error": "Value exceeds max allowed (20)."}
                )
                continue

            # ---- Resolve academic year from student's class ----
            current_class = student.current_class
            if current_class is None:
                errors.append({"index": idx, "error": "Student has no current class."})
                continue
            academic_year = current_class.academic_year

            # ---- Create or update ----
            grade, was_created = Grade.objects.update_or_create(
                student=student,
                subject=subject,
                trimester=item["trimester"],
                academic_year=academic_year,
                exam_type=item["exam_type"],
                defaults={
                    "value": value,
                    "status": Grade.Status.DRAFT,
                    "submitted_by": user,
                    "created_by": user,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

        return Response(
            {"created": created, "updated": updated, "errors": errors},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# 2. GradeSubmitToAdminView — DRAFT → SUBMITTED
# ---------------------------------------------------------------------------


class GradeSubmitToAdminView(APIView):
    """
    POST /api/v1/grades/<id>/submit-to-admin/
    Teacher submits a DRAFT grade for admin review.
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    @extend_schema(
        tags=["grades"],
        summary="Submit grade for admin review",
        description=(
            "Transition a grade from DRAFT → SUBMITTED. "
            "Only the teacher who created the grade can perform this action."
        ),
        request=None,
        responses={
            200: _DetailSchema,
            400: OpenApiResponse(description="Grade is not in DRAFT status."),
            403: OpenApiResponse(description="Not the submitting teacher."),
            404: OpenApiResponse(description="Grade not found."),
        },
    )
    def post(self, request, pk):
        grade = get_object_or_404(Grade, pk=pk, is_deleted=False)

        # Only the submitting teacher can advance
        if grade.submitted_by_id != request.user.pk:
            return Response(
                {"detail": "You can only submit your own grades."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if grade.status != Grade.Status.DRAFT:
            return Response(
                {"detail": f"Cannot submit a grade with status '{grade.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grade.status = Grade.Status.SUBMITTED
        grade.submitted_at = timezone.now()
        grade.save(update_fields=["status", "submitted_at", "updated_at"])

        # In-app notification to school admins (best-effort)
        _notify_admins_grade_submitted(grade)

        return Response({"detail": "Grade submitted for review."})


# ---------------------------------------------------------------------------
# 3. GradePublishView — SUBMITTED → PUBLISHED
# ---------------------------------------------------------------------------


class GradePublishView(APIView):
    """
    PATCH /api/v1/grades/<id>/publish/
    Admin publishes a submitted grade.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    @extend_schema(
        tags=["grades"],
        summary="Publish a grade",
        description=(
            "Transition a grade from SUBMITTED → PUBLISHED. "
            "Triggers push notifications to the student and linked parents. "
            "Requires **ADMIN** or **SECTION_ADMIN** role."
        ),
        request=None,
        responses={
            200: _DetailSchema,
            400: OpenApiResponse(description="Grade is not in SUBMITTED status."),
            403: OpenApiResponse(description="Not a school admin."),
            404: OpenApiResponse(description="Grade not found."),
        },
    )
    def patch(self, request, pk):
        grade = get_object_or_404(Grade, pk=pk, is_deleted=False)

        if grade.status != Grade.Status.SUBMITTED:
            return Response(
                {"detail": f"Cannot publish a grade with status '{grade.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grade.status = Grade.Status.PUBLISHED
        grade.published_at = timezone.now()
        grade.reviewed_by = request.user
        grade.save(
            update_fields=[
                "status",
                "published_at",
                "reviewed_by",
                "updated_at",
            ]
        )

        # Trigger async push notifications
        _trigger_publish_notifications(grade)

        return Response({"detail": "Grade published."})


# ---------------------------------------------------------------------------
# 4. GradeReturnView — SUBMITTED → DRAFT (with comment)
# ---------------------------------------------------------------------------


class GradeReturnView(APIView):
    """
    PATCH /api/v1/grades/<id>/return/
    Admin returns a grade to the teacher with a mandatory comment.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    @extend_schema(
        tags=["grades"],
        summary="Return a grade to teacher",
        description=(
            "Transition a grade from SUBMITTED → DRAFT with a mandatory admin comment. "
            "Notifies the teacher. Requires **ADMIN** or **SECTION_ADMIN** role."
        ),
        request=GradeReturnSerializer,
        responses={
            200: _DetailSchema,
            400: OpenApiResponse(description="Grade is not in SUBMITTED status."),
            403: OpenApiResponse(description="Not a school admin."),
            404: OpenApiResponse(description="Grade not found."),
        },
    )
    def patch(self, request, pk):
        serializer = GradeReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        grade = get_object_or_404(Grade, pk=pk, is_deleted=False)

        if grade.status != Grade.Status.SUBMITTED:
            return Response(
                {"detail": f"Cannot return a grade with status '{grade.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        grade.status = Grade.Status.DRAFT
        grade.admin_comment = serializer.validated_data["admin_comment"]
        grade.reviewed_by = request.user
        grade.save(
            update_fields=[
                "status",
                "admin_comment",
                "reviewed_by",
                "updated_at",
            ]
        )

        _notify_teacher_grade_returned(grade)

        return Response({"detail": "Grade returned to teacher."})


# ===========================================================================
# Notification helpers (thin wrappers — actual sending via Celery tasks)
# ===========================================================================


def _notify_admins_grade_submitted(grade):
    """Send in-app notification to all school admins about a submitted grade."""
    try:
        from apps.notifications.tasks import send_notification

        from apps.accounts.models import User

        admin_ids = list(
            User.objects.filter(
                school=grade.subject.school,
                role__in=[User.Role.ADMIN, User.Role.SECTION_ADMIN],
                is_active=True,
            ).values_list("id", flat=True)
        )
        for uid in admin_ids:
            send_notification.delay(
                user_id=str(uid),
                title="Grade submitted for review",
                body=(
                    f"{grade.submitted_by.full_name} submitted "
                    f"{grade.subject.name} grades."
                ),
            )
    except Exception:
        pass  # notifications are best-effort


def _trigger_publish_notifications(grade):
    """Celery task: push notification to student + linked parents."""
    try:
        from apps.notifications.tasks import send_notification

        student_user_id = str(grade.student.user_id)
        send_notification.delay(
            user_id=student_user_id,
            title="New grade published",
            body=f"Your {grade.subject.name} grade has been published.",
        )

        # Parents linked to this student profile
        for parent_profile in grade.student.parents.all():
            send_notification.delay(
                user_id=str(parent_profile.user_id),
                title="Grade published",
                body=(
                    f"{grade.student.user.full_name}'s "
                    f"{grade.subject.name} grade has been published."
                ),
            )
    except Exception:
        pass


def _notify_teacher_grade_returned(grade):
    """Notify teacher that their grade was returned with a comment."""
    try:
        from apps.notifications.tasks import send_notification

        send_notification.delay(
            user_id=str(grade.submitted_by_id),
            title="Grade returned",
            body=f"Admin returned your {grade.subject.name} grade: {grade.admin_comment}",
        )
    except Exception:
        pass
