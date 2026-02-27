"""
Chat views — room listing/creation and message history/sending.
"""

from django.shortcuts import get_object_or_404
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User

from .models import ChatRoom, Message
from .serializers import (
    ChatRoomCreateSerializer,
    ChatRoomSerializer,
    MessageSerializer,
    SendMessageSerializer,
)

# Reusable inline schema for paginated messages
_PaginatedMessageSchema = inline_serializer(
    "PaginatedMessageResponse",
    fields={
        "count": serializers.IntegerField(),
        "limit": serializers.IntegerField(),
        "offset": serializers.IntegerField(),
        "results": MessageSerializer(many=True),
    },
)


# ---------------------------------------------------------------------------
# 1. ChatRoomListCreateView
# ---------------------------------------------------------------------------


class ChatRoomListCreateView(APIView):
    """
    GET  /api/v1/chat/rooms/
    POST /api/v1/chat/rooms/
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["chat"],
        summary="List chat rooms",
        description="List all chat rooms where the current user is a participant.",
        responses={200: ChatRoomSerializer(many=True)},
    )
    def get(self, request):
        rooms = (
            ChatRoom.objects.filter(participants=request.user)
            .prefetch_related("participants", "messages")
            .order_by("-created_at")
        )
        serializer = ChatRoomSerializer(rooms, many=True, context={"request": request})
        return Response(serializer.data)

    @extend_schema(
        tags=["chat"],
        summary="Create a chat room",
        description=(
            "Create a new chat room with specified participants. "
            "Teacher-parent rooms require a **related_student_id**. "
            "All participants must belong to the same school."
        ),
        request=ChatRoomCreateSerializer,
        responses={
            201: ChatRoomSerializer,
            400: OpenApiResponse(
                description="Missing related student for teacher-parent room."
            ),
        },
    )
    def post(self, request):
        serializer = ChatRoomCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        room_type = data["room_type"]
        related_student_id = data.get("related_student_id")
        related_class_id = data.get("related_class_id")

        # Teacher-parent room requires a related student
        if room_type == ChatRoom.RoomType.TEACHER_PARENT:
            if not related_student_id:
                return Response(
                    {"detail": ("Teacher-parent rooms require a related student.")},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        room = ChatRoom.objects.create(
            school=request.user.school,
            room_type=room_type,
            related_student_id=related_student_id,
            related_class_id=related_class_id,
        )

        # Always include the creator as a participant
        participant_ids = set(data["participant_ids"])
        participant_ids.add(request.user.pk)

        # Validate all participants exist and belong to same school
        participants = User.objects.filter(
            pk__in=participant_ids,
            school=request.user.school,
            is_active=True,
        )
        room.participants.set(participants)

        return Response(
            ChatRoomSerializer(room, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# 2. MessageListCreateView — paginated history + REST message send
# ---------------------------------------------------------------------------


class MessageListCreateView(APIView):
    """
    GET  /api/v1/chat/rooms/<id>/messages/
    POST /api/v1/chat/rooms/<id>/messages/
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["chat"],
        summary="List messages in a room",
        description=(
            "Paginated message history for a chat room. "
            "Use **offset** and **limit** query params. Default: offset=0, limit=50."
        ),
        responses={
            200: _PaginatedMessageSchema,
            404: OpenApiResponse(description="Room not found."),
        },
    )
    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, pk=room_id, participants=request.user)

        messages = (
            room.messages.filter(is_deleted=False)
            .select_related("sender")
            .order_by("-sent_at")
        )

        # Simple offset/limit pagination
        limit = int(request.query_params.get("limit", 50))
        offset = int(request.query_params.get("offset", 0))
        page = messages[offset : offset + limit]

        serializer = MessageSerializer(page, many=True)
        return Response(
            {
                "count": messages.count(),
                "limit": limit,
                "offset": offset,
                "results": serializer.data,
            }
        )

    @extend_schema(
        tags=["chat"],
        summary="Send a message (REST fallback)",
        description=(
            "Send a message to a chat room via REST. "
            "Primarily for offline fallback — prefer WebSocket in production."
        ),
        request=SendMessageSerializer,
        responses={
            201: MessageSerializer,
            404: OpenApiResponse(description="Room not found or not a participant."),
        },
    )
    def post(self, request, room_id):
        """Fallback REST endpoint for sending a message when offline."""
        room = get_object_or_404(ChatRoom, pk=room_id, participants=request.user)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        message = Message.objects.create(
            room=room,
            sender=request.user,
            content=data.get("content", ""),
            attachment=data.get("attachment"),
            attachment_type=data.get("attachment_type"),
        )

        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED,
        )
