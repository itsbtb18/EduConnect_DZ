"""
Notification views — list, mark read, device token management.
"""

from django.utils import timezone
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import DeviceToken, Notification
from .serializers import DeviceTokenSerializer, NotificationSerializer

# Reusable inline schemas
_DetailSchema = inline_serializer(
    "NotificationDetailResponse",
    fields={"detail": serializers.CharField()},
)

_UnreadCountSchema = inline_serializer(
    "UnreadCountResponse",
    fields={"unread_count": serializers.IntegerField()},
)


# ---------------------------------------------------------------------------
# NotificationListView
# ---------------------------------------------------------------------------


class NotificationListView(APIView):
    """
    GET /api/v1/notifications/
    List notifications for the current user.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["notifications"],
        summary="List notifications",
        description=(
            "List notifications for the current user. "
            "Filterable by **is_read** (true/false) and **type** query params."
        ),
        responses={200: NotificationSerializer(many=True)},
    )
    def get(self, request):
        qs = Notification.objects.filter(user=request.user).order_by("-created_at")

        # Optional filters
        is_read = request.query_params.get("is_read")
        if is_read is not None:
            qs = qs.filter(is_read=is_read.lower() == "true")

        notification_type = request.query_params.get("type")
        if notification_type:
            qs = qs.filter(notification_type=notification_type.upper())

        serializer = NotificationSerializer(qs[:100], many=True)
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# NotificationMarkReadView
# ---------------------------------------------------------------------------


class NotificationMarkReadView(APIView):
    """
    POST /api/v1/notifications/<id>/read/
    Mark a notification as read.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["notifications"],
        summary="Mark notification as read",
        description="Mark a single notification as read for the current user.",
        request=None,
        responses={
            200: _DetailSchema,
            404: OpenApiResponse(description="Notification not found."),
        },
    )
    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at"])
        return Response({"detail": "Marked as read."})


# ---------------------------------------------------------------------------
# NotificationMarkAllReadView
# ---------------------------------------------------------------------------


class NotificationMarkAllReadView(APIView):
    """
    POST /api/v1/notifications/read-all/
    Mark all notifications as read.
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["notifications"],
        summary="Mark all notifications as read",
        description="Mark all unread notifications as read for the current user.",
        request=None,
        responses={200: _DetailSchema},
    )
    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({"detail": "All notifications marked as read."})


# ---------------------------------------------------------------------------
# UnreadCountView
# ---------------------------------------------------------------------------


class UnreadCountView(APIView):
    """
    GET /api/v1/notifications/unread-count/
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["notifications"],
        summary="Get unread notification count",
        description="Return the count of unread notifications for the current user.",
        responses={200: _UnreadCountSchema},
    )
    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({"unread_count": count})


# ---------------------------------------------------------------------------
# DeviceTokenView — register/remove device tokens
# ---------------------------------------------------------------------------


class DeviceTokenView(APIView):
    """
    POST   /api/v1/notifications/devices/  — register token
    DELETE /api/v1/notifications/devices/  — remove token
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["notifications"],
        summary="Register device token",
        description="Register or update a device push-notification token (FCM).",
        request=DeviceTokenSerializer,
        responses={201: DeviceTokenSerializer},
    )
    def post(self, request):
        serializer = DeviceTokenSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token, _ = DeviceToken.objects.update_or_create(
            token=serializer.validated_data["token"],
            defaults={
                "user": request.user,
                "platform": serializer.validated_data["platform"],
            },
        )
        return Response(
            DeviceTokenSerializer(token).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        tags=["notifications"],
        summary="Remove device token",
        description="Remove a device push-notification token.",
        request=inline_serializer(
            "DeviceTokenDeleteRequest",
            fields={"token": serializers.CharField()},
        ),
        responses={
            204: None,
            400: OpenApiResponse(description="Token is required."),
        },
    )
    def delete(self, request):
        token_value = request.data.get("token")
        if not token_value:
            return Response(
                {"detail": "Token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        DeviceToken.objects.filter(user=request.user, token=token_value).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
