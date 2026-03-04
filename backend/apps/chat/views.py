"""
Chat views — Conversations, messages, file uploads, contacts.
"""

import os

from django.db import models
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User

from .models import Conversation, Message
from .serializers import (
    ConversationCreateSerializer,
    ConversationListSerializer,
    MessageSerializer,
)


ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB


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
                {"detail": "Le fichier ne doit pas dépasser 10 Mo."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate extension
        ext = (
            attachment.name.rsplit(".", 1)[-1].lower() if "." in attachment.name else ""
        )
        if ext not in ALLOWED_EXTENSIONS:
            return Response(
                {
                    "detail": f"Extension non autorisée. Accepté: {', '.join(ALLOWED_EXTENSIONS)}"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Determine attachment type
        att_type = "image" if ext in {"png", "jpg", "jpeg"} else "document"

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
