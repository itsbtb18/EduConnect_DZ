"""
Homework views — full CRUD for teachers, read-only for students/parents,
plus admin-level stats, calendar, and overload detection.
"""

from collections import defaultdict
from datetime import timedelta

from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import Subject
from core.permissions import IsSchoolAdmin, IsTeacher

from .models import HomeworkPost, HomeworkView
from .serializers import (
    HomeworkCalendarDaySerializer,
    HomeworkCreateSerializer,
    HomeworkOverloadSerializer,
    HomeworkPostSerializer,
    HomeworkStatsSerializer,
)

# Reusable inline schema
_DetailSchema = inline_serializer(
    "HomeworkDetailResponse",
    fields={"detail": serializers.CharField()},
)

OVERLOAD_THRESHOLD = 3  # 3+ devoirs on the same day for a class = overload


def _base_qs(school):
    """Non-deleted homework for a school with common joins."""
    return (
        HomeworkPost.objects.filter(school=school, is_deleted=False)
        .select_related("teacher", "subject", "class_obj", "academic_year")
        .prefetch_related("attachments")
    )


def _apply_admin_filters(qs, params):
    """Apply admin-level query-param filters."""
    class_id = params.get("class_id")
    if class_id:
        qs = qs.filter(class_obj_id=class_id)

    teacher_id = params.get("teacher_id")
    if teacher_id:
        qs = qs.filter(teacher_id=teacher_id)

    subject_id = params.get("subject_id")
    if subject_id:
        qs = qs.filter(subject_id=subject_id)

    search = params.get("search")
    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))

    due_date = params.get("due_date")
    if due_date:
        qs = qs.filter(due_date=due_date)

    due_date_from = params.get("due_date_from")
    if due_date_from:
        qs = qs.filter(due_date__gte=due_date_from)

    due_date_to = params.get("due_date_to")
    if due_date_to:
        qs = qs.filter(due_date__lte=due_date_to)

    is_corrected = params.get("is_corrected")
    if is_corrected is not None and is_corrected != "":
        qs = qs.filter(is_corrected=is_corrected in ("true", "True", "1"))

    is_published = params.get("is_published")
    if is_published is not None and is_published != "":
        qs = qs.filter(is_published=is_published in ("true", "True", "1"))

    return qs


# ---------------------------------------------------------------------------
# 1. HomeworkListCreateView — list + create
# ---------------------------------------------------------------------------


class HomeworkListCreateView(APIView):
    """
    GET  /api/v1/homework/
    POST /api/v1/homework/
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["homework"],
        summary="List homework",
        description=(
            "List homework filtered by the user's role: "
            "teachers see their own, students see their class, "
            "parents see their children's classes, admins see all. "
            "Admins get enhanced filters: class_id, teacher_id, subject_id, "
            "search, due_date, due_date_from, due_date_to, is_corrected, is_published."
        ),
        responses={200: HomeworkPostSerializer(many=True)},
    )
    def get(self, request):
        user = request.user
        qs = _base_qs(user.school)

        if user.role == "TEACHER":
            qs = qs.filter(teacher=user)

        elif user.role == "STUDENT":
            profile = getattr(user, "student_profile", None)
            if profile and profile.current_class:
                qs = qs.filter(class_obj=profile.current_class, is_published=True)
                # Auto-track view
                for hw in qs:
                    HomeworkView.objects.get_or_create(student=profile, homework=hw)
            else:
                qs = qs.none()

        elif user.role == "PARENT":
            parent_profile = getattr(user, "parent_profile", None)
            if parent_profile:
                class_ids = parent_profile.children.exclude(
                    current_class__isnull=True
                ).values_list("current_class_id", flat=True)
                qs = qs.filter(class_obj_id__in=class_ids, is_published=True)
            else:
                qs = qs.none()

        elif user.role not in ("ADMIN", "SECTION_ADMIN"):
            qs = qs.none()

        # Apply admin-level filters
        qs = _apply_admin_filters(qs, request.query_params)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = min(int(request.query_params.get("page_size", 50)), 200)
        total = qs.count()
        offset = (page - 1) * page_size

        qs = qs.annotate(view_count=Count("views"))[offset : offset + page_size]

        serializer = HomeworkPostSerializer(qs, many=True)
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )

    @extend_schema(
        tags=["homework"],
        summary="Create homework (teacher)",
        description=(
            "Create a new homework post. Only teachers can create homework, "
            "and the subject must be assigned to the requesting teacher."
        ),
        request=HomeworkCreateSerializer,
        responses={
            201: HomeworkPostSerializer,
            400: OpenApiResponse(description="Validation error or class mismatch."),
            403: OpenApiResponse(
                description="Not a teacher or not assigned to subject."
            ),
            404: OpenApiResponse(description="Subject not found."),
        },
    )
    def post(self, request):
        if request.user.role != "TEACHER":
            return Response(
                {"detail": "Only teachers can create homework."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = HomeworkCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Verify subject exists and teacher is assigned
        try:
            subject = Subject.objects.get(
                pk=data["subject_id"],
                school=request.user.school,
                is_deleted=False,
            )
        except Subject.DoesNotExist:
            return Response(
                {"detail": "Subject not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if subject.teacher_id != request.user.pk:
            return Response(
                {"detail": "You are not assigned to this subject."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Verify class matches subject's class
        if str(subject.class_obj_id) != str(data["class_id"]):
            return Response(
                {"detail": "Class does not match the subject's class."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        homework = HomeworkPost.objects.create(
            school=request.user.school,
            class_obj=subject.class_obj,
            subject=subject,
            teacher=request.user,
            title=data["title"],
            description=data["description"],
            due_date=data["due_date"],
            assigned_date=data.get("assigned_date"),
            estimated_duration_minutes=data.get("estimated_duration_minutes"),
            is_published=data.get("is_published", True),
        )

        return Response(
            HomeworkPostSerializer(homework).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# 2. HomeworkDetailView — retrieve, update, delete
# ---------------------------------------------------------------------------


class HomeworkDetailView(APIView):
    """
    GET    /api/v1/homework/<id>/
    PATCH  /api/v1/homework/<id>/
    DELETE /api/v1/homework/<id>/
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["homework"],
        summary="Get homework detail",
        description="Retrieve a homework post by ID. Students auto-track views.",
        responses={
            200: HomeworkPostSerializer,
            404: OpenApiResponse(description="Not found."),
        },
    )
    def get(self, request, pk):
        homework = get_object_or_404(
            HomeworkPost.objects.annotate(view_count=Count("views"))
            .select_related("teacher", "subject", "class_obj", "academic_year")
            .prefetch_related("attachments"),
            pk=pk,
            is_deleted=False,
        )

        # Students auto-track view
        if request.user.role == "STUDENT":
            profile = getattr(request.user, "student_profile", None)
            if profile:
                HomeworkView.objects.get_or_create(student=profile, homework=homework)

        serializer = HomeworkPostSerializer(homework)
        return Response(serializer.data)

    @extend_schema(
        tags=["homework"],
        summary="Update homework (teacher)",
        description=(
            "Partially update a homework post. Only the creating teacher can edit, "
            "and only before any student has viewed it."
        ),
        request=HomeworkCreateSerializer,
        responses={
            200: HomeworkPostSerializer,
            400: OpenApiResponse(description="Already viewed by students."),
            403: OpenApiResponse(description="Not the homework creator."),
            404: OpenApiResponse(description="Not found."),
        },
    )
    def patch(self, request, pk):
        homework = get_object_or_404(HomeworkPost, pk=pk, is_deleted=False)

        # Only the creating teacher can edit
        if request.user.role != "TEACHER" or homework.teacher_id != request.user.pk:
            return Response(
                {"detail": "Only the homework creator can edit."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Cannot edit if any student has viewed it
        if homework.views.exists():
            return Response(
                {
                    "detail": (
                        "Cannot edit — students have already viewed this homework."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Update allowed fields
        for field in (
            "title",
            "description",
            "due_date",
            "assigned_date",
            "estimated_duration_minutes",
            "is_published",
        ):
            if field in request.data:
                setattr(homework, field, request.data[field])

        homework.save()
        return Response(HomeworkPostSerializer(homework).data)

    @extend_schema(
        tags=["homework"],
        summary="Delete homework (teacher/admin)",
        description="Soft-delete a homework post with an optional reason.",
        responses={
            204: None,
            403: OpenApiResponse(description="Not authorized."),
            404: OpenApiResponse(description="Not found."),
        },
    )
    def delete(self, request, pk):
        homework = get_object_or_404(HomeworkPost, pk=pk, is_deleted=False)

        # Teachers can only delete their own; admins can delete any
        is_teacher_owner = (
            request.user.role == "TEACHER" and homework.teacher_id == request.user.pk
        )
        is_admin = request.user.role in ("ADMIN", "SECTION_ADMIN")

        if not is_teacher_owner and not is_admin:
            return Response(
                {"detail": "Not authorized to delete this homework."},
                status=status.HTTP_403_FORBIDDEN,
            )

        reason = request.data.get("reason", "") if request.data else ""
        homework.soft_delete(reason=reason)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 3. HomeworkMarkCorrectedView — teacher marks homework as corrected
# ---------------------------------------------------------------------------


class HomeworkMarkCorrectedView(APIView):
    """
    PATCH /api/v1/homework/<id>/corrected/
    Teacher marks homework as corrected.
    """

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    @extend_schema(
        tags=["homework"],
        summary="Mark homework as corrected",
        description="Teacher marks a homework post as corrected.",
        request=None,
        responses={
            200: _DetailSchema,
            403: OpenApiResponse(description="Not the homework creator."),
            404: OpenApiResponse(description="Not found."),
        },
    )
    def patch(self, request, pk):
        homework = get_object_or_404(HomeworkPost, pk=pk, is_deleted=False)

        if homework.teacher_id != request.user.pk:
            return Response(
                {"detail": "You can only mark your own homework as corrected."},
                status=status.HTTP_403_FORBIDDEN,
            )

        homework.is_corrected = True
        homework.save(update_fields=["is_corrected", "updated_at"])
        return Response({"detail": "Homework marked as corrected."})


# ---------------------------------------------------------------------------
# 4. HomeworkStatsView — admin dashboard stats
# ---------------------------------------------------------------------------


class HomeworkStatsView(APIView):
    """
    GET /api/v1/homework/stats/
    Dashboard statistics for the admin panel.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    @extend_schema(
        tags=["homework"],
        summary="Homework stats (admin)",
        responses={200: HomeworkStatsSerializer},
    )
    def get(self, request):
        school = request.user.school
        today = timezone.localdate()
        week_start = today - timedelta(days=today.weekday())  # Monday
        month_start = today.replace(day=1)

        base = HomeworkPost.objects.filter(school=school, is_deleted=False)

        total = base.count()
        this_week = base.filter(
            due_date__gte=week_start,
            due_date__lte=today + timedelta(days=6 - today.weekday()),
        ).count()
        this_month = base.filter(due_date__gte=month_start).count()
        overdue_count = base.filter(due_date__lt=today, is_corrected=False).count()
        corrected_count = base.filter(is_corrected=True).count()

        # Most active teacher (most homework this month)
        top_teacher = (
            base.filter(created_at__date__gte=month_start)
            .values("teacher__first_name", "teacher__last_name")
            .annotate(cnt=Count("id"))
            .order_by("-cnt")
            .first()
        )
        most_active_teacher = ""
        if top_teacher:
            most_active_teacher = f"{top_teacher['teacher__first_name']} {top_teacher['teacher__last_name']}".strip()

        # Busiest class (most homework this month)
        top_class = (
            base.filter(due_date__gte=month_start)
            .values("class_obj__name")
            .annotate(cnt=Count("id"))
            .order_by("-cnt")
            .first()
        )
        busiest_class = top_class["class_obj__name"] if top_class else ""

        # Overload alerts: count of (class, date) combos with >= OVERLOAD_THRESHOLD
        future_base = base.filter(due_date__gte=today)
        overload_qs = (
            future_base.values("class_obj", "due_date")
            .annotate(cnt=Count("id"))
            .filter(cnt__gte=OVERLOAD_THRESHOLD)
        )
        overload_alerts = overload_qs.count()

        return Response(
            {
                "total": total,
                "this_week": this_week,
                "this_month": this_month,
                "overdue_count": overdue_count,
                "corrected_count": corrected_count,
                "most_active_teacher": most_active_teacher,
                "busiest_class": busiest_class,
                "overload_alerts": overload_alerts,
            }
        )


# ---------------------------------------------------------------------------
# 5. HomeworkCalendarView — homework grouped by due_date for a month
# ---------------------------------------------------------------------------


class HomeworkCalendarView(APIView):
    """
    GET /api/v1/homework/calendar/?month=2025-06
    Returns homework grouped by due_date for a given month.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    @extend_schema(
        tags=["homework"],
        summary="Homework calendar (admin)",
        responses={200: HomeworkCalendarDaySerializer(many=True)},
    )
    def get(self, request):
        school = request.user.school
        month_param = request.query_params.get("month")  # YYYY-MM

        if month_param:
            try:
                parts = month_param.split("-")
                year, month = int(parts[0]), int(parts[1])
            except (ValueError, IndexError):
                return Response(
                    {"detail": "Invalid month format. Use YYYY-MM."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            today = timezone.localdate()
            year, month = today.year, today.month

        from calendar import monthrange

        _, days_in_month = monthrange(year, month)
        start_date = timezone.datetime(year, month, 1).date()
        end_date = timezone.datetime(year, month, days_in_month).date()

        qs = (
            _base_qs(school)
            .filter(due_date__gte=start_date, due_date__lte=end_date)
            .annotate(view_count=Count("views"))
            .order_by("due_date", "class_obj__name")
        )

        # Apply optional filters
        qs = _apply_admin_filters(qs, request.query_params)

        # Group by date
        grouped = defaultdict(list)
        for hw in qs:
            grouped[hw.due_date].append(hw)

        result = []
        for date, items in sorted(grouped.items()):
            result.append(
                {
                    "date": date.isoformat(),
                    "count": len(items),
                    "items": HomeworkPostSerializer(items, many=True).data,
                }
            )

        return Response(result)


# ---------------------------------------------------------------------------
# 6. HomeworkOverloadView — detect days with >= 3 devoirs for a class
# ---------------------------------------------------------------------------


class HomeworkOverloadView(APIView):
    """
    GET /api/v1/homework/overload/?month=2025-06
    Returns (class, date) combinations where devoirs >= OVERLOAD_THRESHOLD.
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    @extend_schema(
        tags=["homework"],
        summary="Homework overload detection (admin)",
        responses={200: HomeworkOverloadSerializer(many=True)},
    )
    def get(self, request):
        school = request.user.school
        month_param = request.query_params.get("month")

        base = HomeworkPost.objects.filter(school=school, is_deleted=False)

        if month_param:
            try:
                parts = month_param.split("-")
                year, month = int(parts[0]), int(parts[1])
                from calendar import monthrange

                _, days_in_month = monthrange(year, month)
                start_date = timezone.datetime(year, month, 1).date()
                end_date = timezone.datetime(year, month, days_in_month).date()
                base = base.filter(due_date__gte=start_date, due_date__lte=end_date)
            except (ValueError, IndexError):
                pass
        else:
            # Default: upcoming 30 days
            today = timezone.localdate()
            base = base.filter(
                due_date__gte=today, due_date__lte=today + timedelta(days=30)
            )

        overload_qs = (
            base.values("class_obj__id", "class_obj__name", "due_date")
            .annotate(cnt=Count("id"))
            .filter(cnt__gte=OVERLOAD_THRESHOLD)
            .order_by("due_date", "class_obj__name")
        )

        results = []
        for row in overload_qs:
            # Fetch titles for this class+date
            titles = list(
                base.filter(
                    class_obj_id=row["class_obj__id"], due_date=row["due_date"]
                ).values_list("title", flat=True)
            )
            results.append(
                {
                    "date": row["due_date"].isoformat(),
                    "class_name": row["class_obj__name"],
                    "class_id": str(row["class_obj__id"]),
                    "count": row["cnt"],
                    "titles": titles,
                }
            )

        return Response(results)
