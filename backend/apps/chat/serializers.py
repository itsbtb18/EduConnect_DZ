"""
Chat serializers — Conversation & Message.
"""

from rest_framework import serializers

from .models import Conversation, Message


# ---------------------------------------------------------------------------
# Message
# ---------------------------------------------------------------------------


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_is_admin = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "sender",
            "sender_name",
            "sender_is_admin",
            "content",
            "attachment_url",
            "attachment_type",
            "attachment_name",
            "attachment_size",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields

    def get_sender_name(self, obj):
        return obj.sender.full_name if obj.sender else ""

    def get_sender_is_admin(self, obj):
        return obj.sender_id == obj.conversation.participant_admin_id

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.attachment.url)
        return obj.attachment.url


# ---------------------------------------------------------------------------
# Conversation list
# ---------------------------------------------------------------------------


class ConversationListSerializer(serializers.ModelSerializer):
    participant_other_name = serializers.SerializerMethodField()
    participant_other_initials = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "participant_other",
            "participant_other_name",
            "participant_other_role",
            "participant_other_initials",
            "last_message_preview",
            "last_message_at",
            "unread_count_admin",
        ]
        read_only_fields = fields

    def get_participant_other_name(self, obj):
        return obj.participant_other.full_name if obj.participant_other else ""

    def get_participant_other_initials(self, obj):
        u = obj.participant_other
        if not u:
            return ""
        first = u.first_name[:1].upper() if u.first_name else ""
        last = u.last_name[:1].upper() if u.last_name else ""
        return f"{first}{last}"

    def get_last_message_preview(self, obj):
        last_msg = obj.messages.order_by("-created_at").first()
        if not last_msg:
            return ""
        if last_msg.content:
            return last_msg.content[:60]
        if last_msg.attachment:
            return "Pièce jointe"
        return ""


# ---------------------------------------------------------------------------
# Conversation create
# ---------------------------------------------------------------------------


class ConversationCreateSerializer(serializers.Serializer):
    participant_other_id = serializers.UUIDField()
    participant_other_role = serializers.ChoiceField(
        choices=Conversation.ParticipantRole.choices
    )
