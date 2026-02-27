"""
Attendance views — teachers mark, admins review, parents/students view.
"""

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import Class, StudentProfile
from core.permissions import IsParent, IsSchoolAdmin, IsTeacher

from .models import AbsenceExcuse, AttendanceRecord
from .serializers import (
    AbsenceExcuseSerializer,
    AttendanceRecordSerializer,
    ExcuseReviewSerializer,
    ExcuseSubmitSerializer,
    MarkAttendanceSerializer,
)

# Reusable inline schemas
_AttendanceBulkResponseSchema = inline_serializer(
    "AttendanceBulkResponse",
    fields={
        "created": serializers.IntegerField(),
        "updated": serializers.IntegerField(),
        "errors": serializers.ListField(child=serializers.DictField()),
    },
)


# ---------------------------------------------------------------------------
# 1. MarkAttendanceView — teacher bulk-creates attendance records
# ---------------------------------------------------------------------------


class MarkAttendanceView(APIView):
    """
    POST /api/v1/attendance/mark/
    Teacher submits attendance for a class on a given date.
    Triggers parent notification for ABSENT students via Celery.
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    @extend_schema(
        tags=["attendance"],
        summary="Mark attendance (teacher)",
        description=(
            "Teacher submits attendance records for a class on a given date. "
            "Parents of absent students are notified via push notifications."
        ),
        request=MarkAttendanceSerializer,
        responses={
            200: _AttendanceBulkResponseSchema,
            403: OpenApiResponse(description="Not a teacher or wrong school."),
            404: OpenApiResponse(description="Class not found."),
        },
    )
    def post(self, request):
        serializer = MarkAttendanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        data = serializer.validated_data

        # Resolve class
        try:
            klass = Class.objects.select_related("section").get(pk=data["class_id"])
        except Class.DoesNotExist:
            return Response(
                {"detail": "Class not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Verify class belongs to the teacher's school
        if klass.section.school_id != user.school_id:
            return Response(
                {"detail": "Class does not belong to your school."},
                status=status.HTTP_403_FORBIDDEN,
            )

        created = 0
        updated = 0
        errors = []
        absent_records = []

        for idx, item in enumerate(data["records"]):
            try:
                student = StudentProfile.objects.get(
                    pk=item["student_id"],
                    current_class=klass,
                )
            except StudentProfile.DoesNotExist:
                errors.append(
                    {"index": idx, "error": "Student not found in this class."}
                )
                continue

            record, was_created = AttendanceRecord.objects.update_or_create(
                student=student,
                date=data["date"],
                defaults={
                    "class_obj": klass,
                    "status": item["status"],
                    "note": item.get("note", ""),
                    "marked_by": user,
                    "school": user.school,
                },
            )
            if was_created:
                created += 1
            else:
                updated += 1

            if item["status"] == AttendanceRecord.Status.ABSENT:
                absent_records.append(record)

        # Trigger Celery notifications for absent students
        for record in absent_records:
            _notify_parents_absence(record)

        return Response(
            {"created": created, "updated": updated, "errors": errors},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# 2. AttendanceListView — admin filterable list
# ---------------------------------------------------------------------------


class AttendanceListView(APIView):
    """
    GET /api/v1/attendance/
    Admin views attendance records, filterable by class, date, section.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    @extend_schema(
        tags=["attendance"],
        summary="List attendance records (admin)",
        description=(
            "List attendance records for the admin's school. "
            "Filterable by **class_id**, **date**, and **section_id** query params."
        ),
        responses={200: AttendanceRecordSerializer(many=True)},
    )
    def get(self, request):
        qs = AttendanceRecord.objects.filter(school=request.user.school)

        # Filters
        class_id = request.query_params.get("class_id")
        if class_id:
            qs = qs.filter(class_obj_id=class_id)

        date_param = request.query_params.get("date")
        if date_param:
            qs = qs.filter(date=date_param)

        section_id = request.query_params.get("section_id")
        if section_id:
            qs = qs.filter(class_obj__section_id=section_id)

        qs = qs.select_related("student__user", "class_obj", "marked_by")
        serializer = AttendanceRecordSerializer(qs, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# 3. StudentAttendanceView — parent/student view
# ---------------------------------------------------------------------------


class StudentAttendanceView(APIView):
    """
    GET /api/v1/attendance/my/
    Parents see their children's attendance; students see their own.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["attendance"],
        summary="My attendance (student/parent)",
        description=(
            "Students see their own attendance history. "
            "Parents see attendance for all linked children. "
            "Optional **date** query param to filter by date."
        ),
        responses={
            200: AttendanceRecordSerializer(many=True),
            403: OpenApiResponse(description="Only students and parents can access."),
        },
    )
    def get(self, request):
        user = request.user

        if user.role == "STUDENT":
            profile = getattr(user, "student_profile", None)
            if not profile:
                return Response([])
            qs = AttendanceRecord.objects.filter(student=profile)

        elif user.role == "PARENT":
            parent_profile = getattr(user, "parent_profile", None)
            if not parent_profile:
                return Response([])
            children_ids = parent_profile.children.values_list("id", flat=True)
            qs = AttendanceRecord.objects.filter(student_id__in=children_ids)

        else:
            return Response(
                {"detail": "Not allowed."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Optional date filter
        date_param = request.query_params.get("date")
        if date_param:
            qs = qs.filter(date=date_param)

        qs = qs.select_related("student__user", "class_obj")
        serializer = AttendanceRecordSerializer(qs, many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# 4. ExcuseSubmitView — parent submits an excuse
# ---------------------------------------------------------------------------


class ExcuseSubmitView(APIView):
    """
    POST /api/v1/attendance/excuses/
    Parent submits a justification for a student absence.
    """

    permission_classes = [permissions.IsAuthenticated, IsParent]

    @extend_schema(
        tags=["attendance"],
        summary="Submit absence excuse (parent)",
        description=(
            "Parent submits a justification for a child's absence. "
            "The parent must be linked to the student."
        ),
        request=ExcuseSubmitSerializer,
        responses={
            201: AbsenceExcuseSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Not linked to this student."),
            404: OpenApiResponse(description="Attendance record not found."),
        },
    )
    def post(self, request):
        serializer = ExcuseSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        record = get_object_or_404(
            AttendanceRecord,
            pk=data["attendance_record_id"],
            status=AttendanceRecord.Status.ABSENT,
        )

        # Verify parent is linked to this student
        parent_profile = getattr(request.user, "parent_profile", None)
        if (
            not parent_profile
            or not parent_profile.children.filter(pk=record.student_id).exists()
        ):
            return Response(
                {"detail": "You are not linked to this student."},
                status=status.HTTP_403_FORBIDDEN,
            )

        excuse = AbsenceExcuse.objects.create(
            attendance_record=record,
            submitted_by=request.user,
            justification_text=data["justification_text"],
            attachment=data.get("attachment"),
        )

        return Response(
            AbsenceExcuseSerializer(excuse).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# 5. ExcuseReviewView — admin approves/rejects
# ---------------------------------------------------------------------------


class ExcuseReviewView(APIView):
    """
    PATCH /api/v1/attendance/excuses/<id>/review/
    Admin approves or rejects an absence excuse.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    @extend_schema(
        tags=["attendance"],
        summary="Review absence excuse (admin)",
        description=(
            "Admin approves or rejects a pending absence excuse. "
            "Notifies the parent of the result."
        ),
        request=ExcuseReviewSerializer,
        responses={
            200: AbsenceExcuseSerializer,
            400: OpenApiResponse(description="Excuse already reviewed."),
            403: OpenApiResponse(description="Not a school admin."),
            404: OpenApiResponse(description="Excuse not found."),
        },
    )
    def patch(self, request, pk):
        serializer = ExcuseReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        excuse = get_object_or_404(AbsenceExcuse, pk=pk)

        if excuse.status != AbsenceExcuse.Status.PENDING:
            return Response(
                {"detail": f"Excuse already {excuse.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        excuse.status = serializer.validated_data["status"]
        excuse.reviewed_by = request.user
        excuse.save(update_fields=["status", "reviewed_by"])

        # Notify parent of result
        _notify_parent_excuse_reviewed(excuse)

        return Response(AbsenceExcuseSerializer(excuse).data)


# ===========================================================================
# Notification helpers (thin wrappers — actual sending via Celery tasks)
# ===========================================================================


def _notify_parents_absence(record):
    """Notify parents when their child is marked absent."""
    try:
        from apps.notifications.tasks import send_notification

        for parent_profile in record.student.parents.all():
            send_notification.delay(
                user_id=str(parent_profile.user_id),
                title="Absence Alert",
                body=(
                    f"{record.student.user.full_name} was marked absent "
                    f"on {record.date}."
                ),
            )
    except Exception:
        pass  # notifications are best-effort


def _notify_parent_excuse_reviewed(excuse):
    """Notify parent about excuse review result."""
    try:
        from apps.notifications.tasks import send_notification

        send_notification.delay(
            user_id=str(excuse.submitted_by_id),
            title=f"Excuse {excuse.status.lower()}",
            body=(
                f"Your absence excuse for "
                f"{excuse.attendance_record.student.user.full_name} "
                f"on {excuse.attendance_record.date} has been "
                f"{excuse.status.lower()}."
            ),
        )
    except Exception:
        pass
