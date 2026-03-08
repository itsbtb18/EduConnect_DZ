"""
Chat views — Conversations, messages, file uploads, contacts, chat rooms,
message search, pinning, deletion, templates.
"""

import os

from django.db import models
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User

from .models import (
    ChatRoom, ChatRoomMembership, ChatRoomMessage,
    Conversation, Message, MessageTemplate,
)
from .serializers import (
    ChatRoomCreateSerializer,
    ChatRoomListSerializer,
    ChatRoomMemberSerializer,
    ChatRoomMessageSerializer,
    ConversationCreateSerializer,
    ConversationListSerializer,
    MessageSerializer,
    MessageTemplateCreateSerializer,
    MessageTemplateSerializer,
)


ALLOWED_EXTENSIONS = {
    "png", "jpg", "jpeg", "gif", "webp",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "mp4", "mov", "webm", "avi",
}
IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp"}
VIDEO_EXTENSIONS = {"mp4", "mov", "webm", "avi"}
MAX_UPLOAD_SIZE = 25 * 1024 * 1024  # 25 MB


def _classify_attachment(ext):
    """Return attachment type string from file extension."""
    if ext in IMAGE_EXTENSIONS:
        return "image"
    if ext in VIDEO_EXTENSIONS:
        return "video"
    return "document"


def _role_from_user(user):
    """Map User.Role to Conversation participant_other_role."""
    role_map = {
        User.Role.PARENT: "parent",
        User.Role.TEACHER: "enseignant",
        User.Role.STUDENT: "eleve",
    }
    return role_map.get(user.role, "admin")


# ---------------------------------------------------------------------------
# 1. ConversationListCreateView
# ---------------------------------------------------------------------------


class ConversationListCreateView(APIView):
    """
    GET  /api/v1/chat/conversations/
    POST /api/v1/chat/conversations/
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List all conversations for the authenticated admin."""
        convos = (
            Conversation.objects.filter(
                models.Q(participant_admin=request.user)
                | models.Q(participant_other=request.user),
                school=request.user.school,
            )
            .select_related("participant_admin", "participant_other")
            .prefetch_related("messages")
            .order_by(
                models.F("last_message_at").desc(nulls_last=True),
                "-created_at",
            )
        )
        serializer = ConversationListSerializer(
            convos, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
        """Create a new conversation or return existing one."""
        serializer = ConversationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        other_user = get_object_or_404(
            User,
            pk=data["participant_other_id"],
            school=request.user.school,
            is_active=True,
        )

        # Check for existing conversation (either direction)
        existing = Conversation.objects.filter(
            models.Q(
                participant_admin=request.user,
                participant_other=other_user,
            )
            | models.Q(
                participant_admin=other_user,
                participant_other=request.user,
            )
        ).first()

        if existing:
            return Response(
                ConversationListSerializer(existing, context={"request": request}).data,
                status=status.HTTP_200_OK,
            )

        conv = Conversation.objects.create(
            school=request.user.school,
            created_by=request.user,
            participant_admin=request.user,
            participant_other=other_user,
            participant_other_role=data["participant_other_role"],
            room_type=data.get("room_type", Conversation.RoomType.DIRECT),
            related_student_id=data.get("related_student_id"),
        )
        return Response(
            ConversationListSerializer(conv, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# 2. ConversationDeleteView
# ---------------------------------------------------------------------------


class ConversationDeleteView(APIView):
    """DELETE /api/v1/chat/conversations/<id>/"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, conversation_id):
        conv = get_object_or_404(
            Conversation,
            pk=conversation_id,
            school=request.user.school,
        )
        # Verify participant
        if request.user not in (conv.participant_admin, conv.participant_other):
            return Response(status=status.HTTP_403_FORBIDDEN)

        # Delete all attachment files
        for msg in conv.messages.exclude(attachment="").exclude(
            attachment__isnull=True
        ):
            try:
                if msg.attachment and os.path.isfile(msg.attachment.path):
                    os.remove(msg.attachment.path)
            except Exception:
                pass

        conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 3. MessageListView
# ---------------------------------------------------------------------------


class MessageListView(APIView):
    """GET /api/v1/chat/conversations/<id>/messages/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id):
        conv = get_object_or_404(
            Conversation,
            pk=conversation_id,
            school=request.user.school,
        )
        # Verify participant
        if request.user not in (conv.participant_admin, conv.participant_other):
            return Response(status=status.HTTP_403_FORBIDDEN)

        # Mark as read for admin
        if request.user == conv.participant_admin:
            Conversation.objects.filter(pk=conv.pk).update(
                unread_count_admin=0,
                is_read_by_admin=True,
            )

        messages = conv.messages.select_related(
            "sender", "conversation__participant_admin"
        ).order_by("created_at")
        serializer = MessageSerializer(
            messages, many=True, context={"request": request}
        )
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# 4. MessageUploadView
# ---------------------------------------------------------------------------


class MessageUploadView(APIView):
    """POST /api/v1/chat/conversations/<id>/messages/upload/"""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, conversation_id):
        conv = get_object_or_404(
            Conversation,
            pk=conversation_id,
            school=request.user.school,
        )
        if request.user not in (conv.participant_admin, conv.participant_other):
            return Response(status=status.HTTP_403_FORBIDDEN)

        attachment = request.FILES.get("attachment")
        if not attachment:
            return Response(
                {"detail": "Aucun fichier fourni."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate size
        if attachment.size > MAX_UPLOAD_SIZE:
            return Response(
                {"detail": "Le fichier ne doit pas dépasser 25 Mo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate extension
        ext = (
            attachment.name.rsplit(".", 1)[-1].lower() if "." in attachment.name else ""
        )
        if ext not in ALLOWED_EXTENSIONS:
            return Response(
                {
                    "detail": f"Extension non autorisée. Accepté: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine attachment type
        att_type = _classify_attachment(ext)

        content = request.data.get("content", "").strip()

        message = Message.objects.create(
            conversation=conv,
            sender=request.user,
            content=content,
            attachment=attachment,
            attachment_type=att_type,
            attachment_name=attachment.name,
            attachment_size=attachment.size,
        )

        # Broadcast via WebSocket channel layer
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync

            channel_layer = get_channel_layer()
            other = (
                conv.participant_other
                if conv.participant_admin == request.user
                else conv.participant_admin
            )

            msg_data = {
                "id": str(message.id),
                "conversation_id": str(conv.id),
                "sender_id": str(request.user.id),
                "sender_name": request.user.full_name,
                "sender_is_admin": request.user == conv.participant_admin,
                "content": content,
                "attachment_url": request.build_absolute_uri(message.attachment.url),
                "attachment_type": att_type,
                "attachment_name": attachment.name,
                "attachment_size": attachment.size,
                "is_read": False,
                "created_at": message.created_at.isoformat(),
            }

            # Broadcast to chat group
            async_to_sync(channel_layer.group_send)(
                f"chat_{conv.id}",
                {"type": "chat_message", "message": msg_data},
            )

            # Notify the other participant
            async_to_sync(channel_layer.group_send)(
                f"notifications_{other.id}",
                {
                    "type": "new_message_notification",
                    "conversation_id": str(conv.id),
                    "sender_name": request.user.full_name,
                    "preview": content[:60] if content else "Pièce jointe",
                },
            )
        except Exception:
            pass  # WebSocket broadcast is best-effort

        serializer = MessageSerializer(message, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# 5. ContactListView
# ---------------------------------------------------------------------------


class ContactListView(APIView):
    """GET /api/v1/chat/conversations/contacts/"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        school = request.user.school
        if not school:
            return Response(
                {"enseignants": [], "parents": [], "eleves": [], "admins": []}
            )

        users = (
            User.objects.filter(school=school, is_active=True)
            .exclude(pk=request.user.pk)
            .order_by("first_name", "last_name")
        )

        # Get existing conversation partner IDs for this admin
        existing_partner_ids = set(
            Conversation.objects.filter(
                models.Q(participant_admin=request.user)
                | models.Q(participant_other=request.user),
            )
            .values_list("participant_admin_id", "participant_other_id")
            .distinct()
        )
        # Flatten and remove self
        existing_ids = set()
        for admin_id, other_id in existing_partner_ids:
            existing_ids.add(str(admin_id))
            existing_ids.add(str(other_id))
        existing_ids.discard(str(request.user.pk))

        def serialize_user(u):
            first = u.first_name[:1].upper() if u.first_name else ""
            last = u.last_name[:1].upper() if u.last_name else ""
            return {
                "id": str(u.id),
                "full_name": u.full_name,
                "initials": f"{first}{last}",
                "has_conversation": str(u.id) in existing_ids,
            }

        result = {
            "enseignants": [],
            "parents": [],
            "eleves": [],
            "admins": [],
        }

        for u in users:
            data = serialize_user(u)
            if u.role == User.Role.TEACHER:
                result["enseignants"].append(data)
            elif u.role == User.Role.PARENT:
                result["parents"].append(data)
            elif u.role == User.Role.STUDENT:
                result["eleves"].append(data)
            elif u.role in (
                User.Role.ADMIN,
                User.Role.SECTION_ADMIN,
                User.Role.SUPER_ADMIN,
            ):
                result["admins"].append(data)

        return Response(result)


# ═══════════════════════════════════════════════════════════════════════════
# ChatRoom — group / broadcast salons
# ═══════════════════════════════════════════════════════════════════════════


def _auto_populate_class_members(room):
    """
    For CLASS_BROADCAST / teacher-group rooms, add all students + parents +
    class teachers as MEMBER; the creator is already ADMIN.
    """
    from apps.academics.models import Class, StudentProfile, TeacherAssignment

    if not room.related_class_id:
        return

    klass = Class.objects.get(pk=room.related_class_id)

    # Students in this class
    student_profiles = StudentProfile.objects.filter(
        current_class=klass
    ).select_related("user")
    for sp in student_profiles:
        ChatRoomMembership.objects.get_or_create(
            room=room, user=sp.user, defaults={"role": ChatRoomMembership.Role.MEMBER}
        )
        # Their parents
        for parent in sp.parents.all():
            ChatRoomMembership.objects.get_or_create(
                room=room,
                user=parent.user,
                defaults={"role": ChatRoomMembership.Role.MEMBER},
            )

    # Teachers assigned to this class (via TeacherAssignment)
    teacher_user_ids = TeacherAssignment.objects.filter(
        assigned_class=klass
    ).values_list("teacher_id", flat=True).distinct()
    for uid in teacher_user_ids:
        ChatRoomMembership.objects.get_or_create(
            room=room,
            user_id=uid,
            defaults={"role": ChatRoomMembership.Role.MEMBER},
        )


def _auto_populate_all_school_members(room):
    """Add all active users in the school as MEMBER for all-broadcast rooms."""
    users = User.objects.filter(
        school=room.school, is_active=True
    ).exclude(pk=room.created_by_id)
    for u in users:
        ChatRoomMembership.objects.get_or_create(
            room=room,
            user=u,
            defaults={"role": ChatRoomMembership.Role.MEMBER},
        )


# ---------------------------------------------------------------------------
# 6. ChatRoomListCreateView
# ---------------------------------------------------------------------------


class ChatRoomListCreateView(APIView):
    """
    GET  /api/v1/chat/rooms/          — list rooms the user belongs to
    POST /api/v1/chat/rooms/          — create a new room
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rooms = (
            ChatRoom.objects.filter(
                school=request.user.school,
                memberships__user=request.user,
                is_active=True,
            )
            .distinct()
            .prefetch_related("memberships", "messages")
        )
        serializer = ChatRoomListSerializer(
            rooms, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = ChatRoomCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        room = ChatRoom.objects.create(
            school=request.user.school,
            room_type=data["room_type"],
            name=data["name"],
            description=data.get("description", ""),
            created_by=request.user,
            related_class_id=data.get("related_class_id"),
            related_section_id=data.get("related_section_id"),
        )

        # Creator is ADMIN
        ChatRoomMembership.objects.create(
            room=room, user=request.user, role=ChatRoomMembership.Role.ADMIN
        )

        # Add explicit members
        for uid in data.get("member_ids", []):
            try:
                u = User.objects.get(pk=uid, school=request.user.school, is_active=True)
                ChatRoomMembership.objects.get_or_create(
                    room=room,
                    user=u,
                    defaults={"role": ChatRoomMembership.Role.MEMBER},
                )
            except User.DoesNotExist:
                pass

        # Auto-populate from class if applicable
        if data["room_type"] in (
            ChatRoom.RoomType.CLASS_BROADCAST,
            ChatRoom.RoomType.TEACHER_STUDENT_GROUP,
            ChatRoom.RoomType.TEACHER_PARENT_GROUP,
        ):
            _auto_populate_class_members(room)

        # For ADMIN_ALL_BROADCAST, add all school users
        if data["room_type"] == ChatRoom.RoomType.ADMIN_ALL_BROADCAST:
            _auto_populate_all_school_members(room)

        return Response(
            ChatRoomListSerializer(room, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# 7. ChatRoomDetailView
# ---------------------------------------------------------------------------


class ChatRoomDetailView(APIView):
    """
    GET    /api/v1/chat/rooms/<id>/    — room detail + members
    DELETE /api/v1/chat/rooms/<id>/    — deactivate room (admin only)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(
            ChatRoom,
            pk=room_id,
            school=request.user.school,
            is_active=True,
        )
        if not room.memberships.filter(user=request.user).exists():
            return Response(status=status.HTTP_403_FORBIDDEN)

        data = ChatRoomListSerializer(room, context={"request": request}).data
        data["members"] = ChatRoomMemberSerializer(
            room.memberships.select_related("user"), many=True
        ).data
        return Response(data)

    def delete(self, request, room_id):
        room = get_object_or_404(
            ChatRoom,
            pk=room_id,
            school=request.user.school,
        )
        # Only room creator or school admin can deactivate
        is_room_admin = room.memberships.filter(
            user=request.user, role=ChatRoomMembership.Role.ADMIN
        ).exists()
        if not is_room_admin:
            return Response(status=status.HTTP_403_FORBIDDEN)

        room.is_active = False
        room.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# 8. ChatRoomMessageListView
# ---------------------------------------------------------------------------


class ChatRoomMessageListView(APIView):
    """
    GET  /api/v1/chat/rooms/<id>/messages/   — room message history
    POST /api/v1/chat/rooms/<id>/messages/   — send text message to room
    """

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request, room_id):
        room = get_object_or_404(
            ChatRoom,
            pk=room_id,
            school=request.user.school,
            is_active=True,
        )
        if not room.memberships.filter(user=request.user).exists():
            return Response(status=status.HTTP_403_FORBIDDEN)

        messages = room.messages.select_related("sender").order_by("created_at")
        serializer = ChatRoomMessageSerializer(
            messages, many=True, context={"request": request}
        )
        return Response(serializer.data)

    def post(self, request, room_id):
        room = get_object_or_404(
            ChatRoom,
            pk=room_id,
            school=request.user.school,
            is_active=True,
        )
        membership = room.memberships.filter(user=request.user).first()
        if not membership:
            return Response(status=status.HTTP_403_FORBIDDEN)

        # Check write permission for broadcast rooms
        if room.room_type in (
            ChatRoom.RoomType.CLASS_BROADCAST,
            ChatRoom.RoomType.ADMIN_BROADCAST,
            ChatRoom.RoomType.ADMIN_ALL_BROADCAST,
        ):
            if membership.role != ChatRoomMembership.Role.ADMIN:
                return Response(
                    {"detail": "Seuls les administrateurs peuvent écrire dans ce salon."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        content = request.data.get("content", "").strip()
        attachment = request.FILES.get("attachment")

        if not content and not attachment:
            return Response(
                {"detail": "Contenu ou pièce jointe requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        att_type = None
        if attachment:
            if attachment.size > MAX_UPLOAD_SIZE:
                return Response(
                    {"detail": "Le fichier ne doit pas dépasser 25 Mo."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            ext = (
                attachment.name.rsplit(".", 1)[-1].lower()
                if "." in attachment.name
                else ""
            )
            if ext not in ALLOWED_EXTENSIONS:
                return Response(
                    {"detail": f"Extension non autorisée. Accepté: {', '.join(sorted(ALLOWED_EXTENSIONS))}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            att_type = _classify_attachment(ext)

        msg = ChatRoomMessage.objects.create(
            room=room,
            sender=request.user,
            content=content,
            attachment=attachment,
            attachment_type=att_type,
            attachment_name=attachment.name if attachment else None,
            attachment_size=attachment.size if attachment else None,
        )

        # Broadcast via WebSocket
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer

            channel_layer = get_channel_layer()
            msg_data = ChatRoomMessageSerializer(
                msg, context={"request": request}
            ).data
            async_to_sync(channel_layer.group_send)(
                f"room_{room.id}",
                {"type": "room_chat_message", "message": msg_data},
            )

            # Notify other members
            other_ids = list(
                room.memberships.filter(is_muted=False)
                .exclude(user=request.user)
                .values_list("user_id", flat=True)
            )
            for uid in other_ids:
                async_to_sync(channel_layer.group_send)(
                    f"notifications_{uid}",
                    {
                        "type": "room_message_notification",
                        "room_id": str(room.id),
                        "room_name": room.name,
                        "sender_name": request.user.full_name,
                        "preview": content[:60] if content else "Pièce jointe",
                    },
                )

            # FCM push for offline members
            from apps.notifications.models import DeviceToken
            from core.firebase import send_push_to_multiple

            tokens = list(
                DeviceToken.objects.filter(user_id__in=other_ids).values_list(
                    "token", flat=True
                )
            )
            if tokens:
                send_push_to_multiple(
                    tokens,
                    f"{room.name}: {request.user.full_name}",
                    content[:120] if content else "Pièce jointe",
                    {"room_id": str(room.id)},
                )
        except Exception:
            pass  # WebSocket / FCM is best-effort

        serializer = ChatRoomMessageSerializer(msg, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════════════════════
# New endpoints: search, delete, pin, read receipts, templates
# ═══════════════════════════════════════════════════════════════════════════


# ---------------------------------------------------------------------------
# 9. MessageSearchView — search message history
# ---------------------------------------------------------------------------


class MessageSearchView(APIView):
    """GET /api/v1/chat/messages/search/?q=term"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response(
                {"detail": "Le terme de recherche doit contenir au moins 2 caractères."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        school = request.user.school
        user = request.user

        # Search in 1-to-1 conversations
        conv_messages = Message.objects.filter(
            conversation__school=school,
            is_deleted=False,
            content__icontains=q,
        ).filter(
            Q(conversation__participant_admin=user) |
            Q(conversation__participant_other=user)
        ).select_related(
            "sender", "conversation__participant_admin"
        ).order_by("-created_at")[:50]

        # Search in rooms
        room_messages = ChatRoomMessage.objects.filter(
            room__school=school,
            room__memberships__user=user,
            is_deleted=False,
            content__icontains=q,
        ).select_related("sender", "room").order_by("-created_at")[:50]

        results = []
        for msg in conv_messages:
            results.append({
                "id": str(msg.id),
                "type": "conversation",
                "conversation_id": str(msg.conversation_id),
                "sender_name": msg.sender.full_name,
                "content": msg.content[:120],
                "created_at": msg.created_at.isoformat(),
            })
        for msg in room_messages:
            results.append({
                "id": str(msg.id),
                "type": "room",
                "room_id": str(msg.room_id),
                "room_name": msg.room.name,
                "sender_name": msg.sender.full_name,
                "content": msg.content[:120],
                "created_at": msg.created_at.isoformat(),
            })

        results.sort(key=lambda x: x["created_at"], reverse=True)
        return Response(results[:50])


# ---------------------------------------------------------------------------
# 10. MessageDeleteView — soft-delete within 60 seconds
# ---------------------------------------------------------------------------


class MessageDeleteView(APIView):
    """DELETE /api/v1/chat/conversations/<id>/messages/<msg_id>/"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, conversation_id, message_id):
        msg = get_object_or_404(
            Message,
            pk=message_id,
            conversation_id=conversation_id,
            conversation__school=request.user.school,
            sender=request.user,
        )

        if not msg.can_delete():
            return Response(
                {"detail": "Le message ne peut plus être supprimé (délai de 60 secondes dépassé)."},
                status=status.HTTP_403_FORBIDDEN,
            )

        msg.soft_delete()

        # Broadcast deletion via WebSocket
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"chat_{conversation_id}",
                {
                    "type": "chat_message",
                    "message": {
                        "id": str(msg.id),
                        "conversation_id": str(conversation_id),
                        "is_deleted": True,
                        "event": "message_deleted",
                    },
                },
            )
        except Exception:
            pass

        return Response({"detail": "Message supprimé."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# 11. MessagePinView — pin/unpin a message
# ---------------------------------------------------------------------------


class MessagePinView(APIView):
    """POST /api/v1/chat/conversations/<id>/messages/<msg_id>/pin/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id, message_id):
        msg = get_object_or_404(
            Message,
            pk=message_id,
            conversation_id=conversation_id,
            conversation__school=request.user.school,
            is_deleted=False,
        )
        # Verify participant
        conv = msg.conversation
        if request.user not in (conv.participant_admin, conv.participant_other):
            return Response(status=status.HTTP_403_FORBIDDEN)

        msg.is_pinned = not msg.is_pinned
        msg.save(update_fields=["is_pinned"])

        action = "épinglé" if msg.is_pinned else "désépinglé"
        return Response({"detail": f"Message {action}.", "is_pinned": msg.is_pinned})


# ---------------------------------------------------------------------------
# 12. MessageReadReceiptView — mark messages as read
# ---------------------------------------------------------------------------


class MessageReadReceiptView(APIView):
    """POST /api/v1/chat/conversations/<id>/messages/read/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, conversation_id):
        conv = get_object_or_404(
            Conversation,
            pk=conversation_id,
            school=request.user.school,
        )
        if request.user not in (conv.participant_admin, conv.participant_other):
            return Response(status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()

        # Mark all unread messages from the other user as READ
        updated = Message.objects.filter(
            conversation=conv,
            is_deleted=False,
        ).exclude(
            sender=request.user
        ).exclude(
            status=Message.Status.READ
        ).update(
            is_read=True,
            status=Message.Status.READ,
            read_at=now,
        )

        # Reset unread counter if admin
        if request.user == conv.participant_admin:
            Conversation.objects.filter(pk=conv.pk).update(
                unread_count_admin=0,
                is_read_by_admin=True,
            )

        # Broadcast read receipt via WebSocket
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"chat_{conversation_id}",
                {
                    "type": "chat_message",
                    "message": {
                        "event": "messages_read",
                        "conversation_id": str(conversation_id),
                        "reader_id": str(request.user.id),
                        "read_at": now.isoformat(),
                    },
                },
            )
        except Exception:
            pass

        return Response({"detail": f"{updated} messages marqués comme lus."})


# ---------------------------------------------------------------------------
# 13. RoomMessageDeleteView
# ---------------------------------------------------------------------------


class RoomMessageDeleteView(APIView):
    """DELETE /api/v1/chat/rooms/<id>/messages/<msg_id>/"""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, room_id, message_id):
        msg = get_object_or_404(
            ChatRoomMessage,
            pk=message_id,
            room_id=room_id,
            room__school=request.user.school,
            sender=request.user,
        )

        if not msg.can_delete():
            return Response(
                {"detail": "Le message ne peut plus être supprimé (délai de 60 secondes dépassé)."},
                status=status.HTTP_403_FORBIDDEN,
            )

        msg.soft_delete()

        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"room_{room_id}",
                {
                    "type": "room_chat_message",
                    "message": {
                        "id": str(msg.id),
                        "room_id": str(room_id),
                        "is_deleted": True,
                        "event": "message_deleted",
                    },
                },
            )
        except Exception:
            pass

        return Response({"detail": "Message supprimé."})


# ---------------------------------------------------------------------------
# 14. RoomMessagePinView
# ---------------------------------------------------------------------------


class RoomMessagePinView(APIView):
    """POST /api/v1/chat/rooms/<id>/messages/<msg_id>/pin/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, room_id, message_id):
        msg = get_object_or_404(
            ChatRoomMessage,
            pk=message_id,
            room_id=room_id,
            room__school=request.user.school,
            is_deleted=False,
        )
        if not msg.room.memberships.filter(user=request.user).exists():
            return Response(status=status.HTTP_403_FORBIDDEN)

        msg.is_pinned = not msg.is_pinned
        msg.save(update_fields=["is_pinned"])

        action = "épinglé" if msg.is_pinned else "désépinglé"
        return Response({"detail": f"Message {action}.", "is_pinned": msg.is_pinned})


# ---------------------------------------------------------------------------
# 15. MessageTemplateListCreateView
# ---------------------------------------------------------------------------


class MessageTemplateListCreateView(APIView):
    """
    GET  /api/v1/chat/templates/     — list templates for the school
    POST /api/v1/chat/templates/     — create a template (admin)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        templates = MessageTemplate.objects.filter(school=request.user.school)
        category = request.query_params.get("category")
        if category:
            templates = templates.filter(category=category)
        serializer = MessageTemplateSerializer(templates, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role not in ("ADMIN", "SECTION_ADMIN"):
            return Response(
                {"detail": "Seuls les administrateurs peuvent créer des modèles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MessageTemplateCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        template = MessageTemplate.objects.create(
            school=request.user.school,
            created_by=request.user,
            **data,
        )
        return Response(
            MessageTemplateSerializer(template).data,
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# 16. MessageTemplateDetailView
# ---------------------------------------------------------------------------


class MessageTemplateDetailView(APIView):
    """
    PATCH  /api/v1/chat/templates/<id>/
    DELETE /api/v1/chat/templates/<id>/
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, template_id):
        template = get_object_or_404(
            MessageTemplate,
            pk=template_id,
            school=request.user.school,
        )
        for field in ("name", "content", "category"):
            if field in request.data:
                setattr(template, field, request.data[field])
        template.save()
        return Response(MessageTemplateSerializer(template).data)

    def delete(self, request, template_id):
        template = get_object_or_404(
            MessageTemplate,
            pk=template_id,
            school=request.user.school,
        )
        template.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
