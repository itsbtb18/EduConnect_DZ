"""
Homework views — full CRUD for teachers, read-only for students/parents.
"""

from django.db.models import Count
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.grades.models import Subject
from core.permissions import IsTeacher

from .models import HomeworkPost, HomeworkView
from .serializers import HomeworkCreateSerializer, HomeworkPostSerializer

# Reusable inline schema
_DetailSchema = inline_serializer(
    "HomeworkDetailResponse",
    fields={"detail": serializers.CharField()},
)


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
            "parents see their children's classes, admins see all."
        ),
        responses={200: HomeworkPostSerializer(many=True)},
    )
    def get(self, request):
        user = request.user
        qs = HomeworkPost.objects.filter(school=user.school, is_deleted=False)

        if user.role == "TEACHER":
            qs = qs.filter(teacher=user)

        elif user.role == "STUDENT":
            profile = getattr(user, "student_profile", None)
            if profile and profile.current_class:
                qs = qs.filter(class_obj=profile.current_class)
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
                qs = qs.filter(class_obj_id__in=class_ids)
            else:
                qs = qs.none()

        elif user.role not in ("ADMIN", "SECTION_ADMIN"):
            qs = qs.none()

        # Filters
        class_id = request.query_params.get("class_id")
        if class_id:
            qs = qs.filter(class_obj_id=class_id)

        subject_id = request.query_params.get("subject_id")
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        due_date = request.query_params.get("due_date")
        if due_date:
            qs = qs.filter(due_date__date=due_date)

        qs = (
            qs.annotate(view_count=Count("views"))
            .select_related("teacher", "subject", "class_obj")
            .prefetch_related("attachments")
        )

        serializer = HomeworkPostSerializer(qs, many=True)
        return Response(serializer.data)

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
            .select_related("teacher", "subject", "class_obj")
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
        for field in ("title", "description", "due_date"):
            if field in request.data:
                setattr(homework, field, request.data[field])

        homework.save()
        return Response(HomeworkPostSerializer(homework).data)

    @extend_schema(
        tags=["homework"],
        summary="Delete homework (teacher)",
        description="Soft-delete a homework post. Only the creating teacher can delete.",
        responses={
            204: None,
            403: OpenApiResponse(description="Not the homework creator."),
            404: OpenApiResponse(description="Not found."),
        },
    )
    def delete(self, request, pk):
        homework = get_object_or_404(HomeworkPost, pk=pk, is_deleted=False)

        if request.user.role != "TEACHER" or homework.teacher_id != request.user.pk:
            return Response(
                {"detail": "Only the homework creator can delete."},
                status=status.HTTP_403_FORBIDDEN,
            )

        homework.soft_delete()
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
        description="Teacher marks a homework post as corrected. Only the creating teacher can do this.",
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
