"""
Announcements views — admin CRUD, role-filtered reads, read tracking.
"""

from django.db import models
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Announcement, AnnouncementAttachment, AnnouncementRead
from .serializers import AnnouncementCreateSerializer, AnnouncementSerializer

# Reusable inline schema
_DetailSchema = inline_serializer(
    "AnnouncementDetailResponse",
    fields={"detail": serializers.CharField()},
)


# ---------------------------------------------------------------------------
# 1. AnnouncementListCreateView — admin creates; all roles read (filtered)
# ---------------------------------------------------------------------------


class AnnouncementListCreateView(APIView):
    """
    GET  /api/v1/announcements/
    POST /api/v1/announcements/
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["announcements"],
        summary="List announcements",
        description=(
            "List announcements filtered by the user's role and target audience. "
            "Admins see all; teachers, parents, and students see only relevant ones."
        ),
        responses={200: AnnouncementSerializer(many=True)},
    )
    def get(self, request):
        user = request.user
        now = timezone.now()

        qs = Announcement.objects.filter(
            school=user.school,
            is_deleted=False,
        ).filter(Q(publish_at__isnull=True) | Q(publish_at__lte=now))

        # Role-based filtering for non-admin users
        if user.role in ("ADMIN", "SECTION_ADMIN"):
            pass  # admin sees all

        elif user.role == "TEACHER":
            teacher_profile = getattr(user, "teacher_profile", None)
            teacher_section_id = teacher_profile.section_id if teacher_profile else None
            qs = qs.filter(
                Q(target_audience__in=["ALL", "TEACHERS"])
                | Q(
                    target_audience="SPECIFIC_SECTION",
                    target_section_id=teacher_section_id,
                )
            )

        elif user.role == "PARENT":
            parent_profile = getattr(user, "parent_profile", None)
            if parent_profile:
                children = parent_profile.children.select_related(
                    "current_class__section"
                )
                section_ids = set()
                class_ids = set()
                for child in children:
                    if child.current_class:
                        class_ids.add(child.current_class_id)
                        section_ids.add(child.current_class.section_id)
                qs = qs.filter(
                    Q(target_audience__in=["ALL", "PARENTS"])
                    | Q(
                        target_audience="SPECIFIC_SECTION",
                        target_section_id__in=section_ids,
                    )
                    | Q(
                        target_audience="SPECIFIC_CLASS",
                        target_class_id__in=class_ids,
                    )
                )
            else:
                qs = qs.filter(target_audience="ALL")

        elif user.role == "STUDENT":
            profile = getattr(user, "student_profile", None)
            if profile and profile.current_class:
                qs = qs.filter(
                    Q(target_audience__in=["ALL", "STUDENTS"])
                    | Q(
                        target_audience="SPECIFIC_SECTION",
                        target_section_id=profile.current_class.section_id,
                    )
                    | Q(
                        target_audience="SPECIFIC_CLASS",
                        target_class_id=profile.current_class_id,
                    )
                )
            else:
                qs = qs.filter(target_audience__in=["ALL", "STUDENTS"])

        else:
            qs = qs.none()

        qs = (
            qs.annotate(read_count=Count("reads"))
            .select_related("author", "target_section", "target_class")
            .prefetch_related("attachments")
        )

        serializer = AnnouncementSerializer(
            qs, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @extend_schema(
        tags=["announcements"],
        summary="Create announcement (admin)",
        description=(
            "Create a new announcement. Only **ADMIN** and **SECTION_ADMIN** "
            "users can create announcements."
        ),
        request=AnnouncementCreateSerializer,
        responses={
            201: AnnouncementSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Not a school admin."),
        },
    )
    def post(self, request):
        # Only admin can create
        if request.user.role not in ("ADMIN", "SECTION_ADMIN"):
            return Response(
                {"detail": "Only admins can create announcements."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AnnouncementCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        announcement = Announcement.objects.create(
            school=request.user.school,
            author=request.user,
            title=data["title"],
            body=data["body"],
            target_audience=data["target_audience"],
            target_section_id=data.get("target_section_id"),
            target_class_id=data.get("target_class_id"),
            is_pinned=data.get("is_pinned", False),
            is_urgent=data.get("is_urgent", False),
            publish_at=data.get("publish_at"),
            published_at=timezone.now() if not data.get("publish_at") else None,
        )

        # Send FCM push notification via Celery task
        if not data.get("publish_at"):
            try:
                from apps.chat.tasks import send_announcement_notification
                send_announcement_notification.delay(str(announcement.id))
            except Exception:
                pass

        return Response(
            AnnouncementSerializer(
                announcement, context={"request": request}
            ).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# 2. AnnouncementDetailView — retrieve, update, delete (admin)
# ---------------------------------------------------------------------------


class AnnouncementDetailView(APIView):
    """
    GET    /api/v1/announcements/<id>/
    PATCH  /api/v1/announcements/<id>/
    DELETE /api/v1/announcements/<id>/
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["announcements"],
        summary="Get announcement detail",
        description="Retrieve a single announcement by ID (scoped to the user's school).",
        responses={
            200: AnnouncementSerializer,
            404: OpenApiResponse(description="Not found."),
        },
    )
    def get(self, request, pk):
        announcement = get_object_or_404(
            Announcement.objects.annotate(read_count=Count("reads"))
            .select_related("author", "target_section", "target_class")
            .prefetch_related("attachments"),
            pk=pk,
            school=request.user.school,
            is_deleted=False,
        )

        # Increment views count
        Announcement.objects.filter(pk=pk).update(
            views_count=models.F("views_count") + 1
        )

        serializer = AnnouncementSerializer(
            announcement, context={"request": request}
        )
        return Response(serializer.data)

    @extend_schema(
        tags=["announcements"],
        summary="Update announcement (admin)",
        description="Partially update an announcement. Requires **ADMIN** or **SECTION_ADMIN** role.",
        request=AnnouncementCreateSerializer,
        responses={
            200: AnnouncementSerializer,
            403: OpenApiResponse(description="Not a school admin."),
            404: OpenApiResponse(description="Not found."),
        },
    )
    def patch(self, request, pk):
        if request.user.role not in ("ADMIN", "SECTION_ADMIN"):
            return Response(
                {"detail": "Only admins can update announcements."},
                status=status.HTTP_403_FORBIDDEN,
            )

        announcement = get_object_or_404(
            Announcement,
            pk=pk,
            school=request.user.school,
            is_deleted=False,
        )

        allowed_fields = [
            "title",
            "body",
            "target_audience",
            "target_section_id",
            "target_class_id",
            "is_pinned",
            "is_urgent",
            "publish_at",
        ]
        for field in allowed_fields:
            if field in request.data:
                if field == "target_section_id":
                    announcement.target_section_id = request.data[field]
                elif field == "target_class_id":
                    announcement.target_class_id = request.data[field]
                else:
                    setattr(announcement, field, request.data[field])

        announcement.save()
        return Response(
            AnnouncementSerializer(
                announcement, context={"request": request}
            ).data
        )

    @extend_schema(
        tags=["announcements"],
        summary="Delete announcement (admin)",
        description="Soft-delete an announcement. Requires **ADMIN** or **SECTION_ADMIN** role.",
        responses={
            204: None,
            403: OpenApiResponse(description="Not a school admin."),
            404: OpenApiResponse(description="Not found."),
        },
    )
    def delete(self, request, pk):
        if request.user.role not in ("ADMIN", "SECTION_ADMIN"):
            return Response(
                {"detail": "Only admins can delete announcements."},
                status=status.HTTP_403_FORBIDDEN,
            )

        announcement = get_object_or_404(
            Announcement,
            pk=pk,
            school=request.user.school,
            is_deleted=False,
        )
        announcement.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 3. AnnouncementMarkReadView — mark as read
# ---------------------------------------------------------------------------


class AnnouncementMarkReadView(APIView):
    """
    POST /api/v1/announcements/<id>/read/
    Marks the announcement as read by the current user.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["announcements"],
        summary="Mark announcement as read",
        description="Mark the specified announcement as read by the current user.",
        request=None,
        responses={
            200: _DetailSchema,
            404: OpenApiResponse(description="Announcement not found."),
        },
    )
    def post(self, request, pk):
        announcement = get_object_or_404(
            Announcement,
            pk=pk,
            school=request.user.school,
            is_deleted=False,
        )

        AnnouncementRead.objects.get_or_create(
            announcement=announcement,
            user=request.user,
        )

        return Response({"detail": "Marked as read."})


# ---------------------------------------------------------------------------
# 4. AnnouncementImageUploadView — upload image for an announcement
# ---------------------------------------------------------------------------


class AnnouncementImageUploadView(APIView):
    """
    POST /api/v1/announcements/<id>/upload-image/
    Upload an image for an existing announcement.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["announcements"],
        summary="Upload announcement image",
        description="Upload an image for an announcement. Requires ADMIN or SECTION_ADMIN role.",
        request={"multipart/form-data": {"type": "object", "properties": {"image": {"type": "string", "format": "binary"}}}},
        responses={
            200: AnnouncementSerializer,
            400: OpenApiResponse(description="No image file provided."),
            403: OpenApiResponse(description="Not a school admin."),
            404: OpenApiResponse(description="Not found."),
        },
    )
    def post(self, request, pk):
        if request.user.role not in ("ADMIN", "SECTION_ADMIN"):
            return Response(
                {"detail": "Only admins can upload images."},
                status=status.HTTP_403_FORBIDDEN,
            )

        announcement = get_object_or_404(
            Announcement,
            pk=pk,
            school=request.user.school,
            is_deleted=False,
        )

        image = request.FILES.get("image")
        if not image:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file type
        ext = image.name.rsplit(".", 1)[-1].lower() if "." in image.name else ""
        if ext not in {"png", "jpg", "jpeg", "gif", "webp"}:
            return Response(
                {"detail": "Only image files (png, jpg, jpeg, gif, webp) are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate size (5MB max for images)
        if image.size > 5 * 1024 * 1024:
            return Response(
                {"detail": "Image too large. Max 5 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        announcement.image = image
        announcement.save(update_fields=["image"])

        return Response(
            AnnouncementSerializer(
                announcement, context={"request": request}
            ).data
        )


# ---------------------------------------------------------------------------
# 4b. AnnouncementAttachmentUploadView — upload files for announcement
# ---------------------------------------------------------------------------

ANNOUNCEMENT_ALLOWED_EXTENSIONS = {
    "png", "jpg", "jpeg", "gif", "webp",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "mp4", "mov",
}


class AnnouncementAttachmentUploadView(APIView):
    """POST /api/v1/announcements/<id>/upload-attachment/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ("ADMIN", "SECTION_ADMIN"):
            return Response(
                {"detail": "Only admins can upload attachments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        announcement = get_object_or_404(
            Announcement,
            pk=pk,
            school=request.user.school,
            is_deleted=False,
        )

        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response(
                {"detail": "No file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if uploaded_file.size > 25 * 1024 * 1024:
            return Response(
                {"detail": "File too large. Max 25 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext = (
            uploaded_file.name.rsplit(".", 1)[-1].lower()
            if "." in uploaded_file.name
            else ""
        )
        if ext not in ANNOUNCEMENT_ALLOWED_EXTENSIONS:
            return Response(
                {"detail": f"Extension not allowed. Accepted: {', '.join(sorted(ANNOUNCEMENT_ALLOWED_EXTENSIONS))}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attachment = AnnouncementAttachment.objects.create(
            announcement=announcement,
            file=uploaded_file,
            file_name=uploaded_file.name,
        )

        return Response(
            {
                "id": str(attachment.id),
                "file": request.build_absolute_uri(attachment.file.url),
                "file_name": attachment.file_name,
                "created_at": attachment.created_at.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# 5. AnnouncementReadReceiptsView — list who read an announcement
# ---------------------------------------------------------------------------


class AnnouncementReadReceiptsView(APIView):
    """
    GET /api/v1/announcements/<id>/readers/
    List users who have read the announcement (admin only).
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["announcements"],
        summary="List announcement readers",
        description="List all users who have read this announcement. Requires ADMIN or SECTION_ADMIN role.",
        responses={200: inline_serializer(
            "AnnouncementReadersResponse",
            fields={
                "total_reads": serializers.IntegerField(),
                "readers": serializers.ListField(child=serializers.DictField()),
            },
        )},
    )
    def get(self, request, pk):
        if request.user.role not in ("ADMIN", "SECTION_ADMIN"):
            return Response(
                {"detail": "Only admins can view read receipts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        announcement = get_object_or_404(
            Announcement,
            pk=pk,
            school=request.user.school,
            is_deleted=False,
        )

        reads = AnnouncementRead.objects.filter(
            announcement=announcement,
        ).select_related("user").order_by("-read_at")

        readers = [
            {
                "user_id": str(r.user_id),
                "name": f"{r.user.first_name} {r.user.last_name}".strip(),
                "role": r.user.role,
                "read_at": r.read_at.isoformat() if r.read_at else None,
            }
            for r in reads
        ]

        return Response({
            "total_reads": len(readers),
            "readers": readers,
        })
