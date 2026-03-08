"""
Chat serializers — Conversation, Message, ChatRoom, MessageTemplate.
"""

from rest_framework import serializers

from .models import (
    ChatRoom,
    ChatRoomMembership,
    ChatRoomMessage,
    Conversation,
    Message,
    MessageTemplate,
)


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
            "status",
            "delivered_at",
            "read_at",
            "is_pinned",
            "is_deleted",
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
            "room_type",
            "participant_other",
            "participant_other_name",
            "participant_other_role",
            "participant_other_initials",
            "last_message_preview",
            "last_message_at",
            "unread_count_admin",
            "related_student",
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
        last_msg = obj.messages.filter(is_deleted=False).order_by("-created_at").first()
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
    room_type = serializers.ChoiceField(
        choices=Conversation.RoomType.choices,
        required=False,
        default=Conversation.RoomType.DIRECT,
    )
    related_student_id = serializers.UUIDField(required=False, allow_null=True)


# ---------------------------------------------------------------------------
# ChatRoom — group / broadcast salons
# ---------------------------------------------------------------------------


class ChatRoomMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_id = serializers.UUIDField(source="user.id", read_only=True)

    class Meta:
        model = ChatRoomMembership
        fields = ["id", "user_id", "user_name", "role", "is_muted", "joined_at"]
        read_only_fields = fields


class ChatRoomMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoomMessage
        fields = [
            "id",
            "sender",
            "sender_name",
            "content",
            "attachment_url",
            "attachment_type",
            "attachment_name",
            "attachment_size",
            "status",
            "is_pinned",
            "is_deleted",
            "created_at",
        ]
        read_only_fields = fields

    def get_sender_name(self, obj):
        return obj.sender.full_name if obj.sender else ""

    def get_attachment_url(self, obj):
        if not obj.attachment:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.attachment.url)
        return obj.attachment.url


class ChatRoomListSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            "id",
            "room_type",
            "name",
            "description",
            "related_class",
            "related_section",
            "member_count",
            "last_message_preview",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_member_count(self, obj):
        return obj.memberships.count()

    def get_last_message_preview(self, obj):
        last = obj.messages.filter(is_deleted=False).order_by("-created_at").first()
        if not last:
            return ""
        if last.content:
            return last.content[:60]
        return "Pièce jointe"


class ChatRoomCreateSerializer(serializers.Serializer):
    room_type = serializers.ChoiceField(choices=ChatRoom.RoomType.choices)
    name = serializers.CharField(max_length=200)
    description = serializers.CharField(required=False, default="")
    related_class_id = serializers.UUIDField(required=False, allow_null=True)
    related_section_id = serializers.UUIDField(required=False, allow_null=True)
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        default=list,
        help_text="Extra member user-IDs to add (creator is added automatically).",
    )


# ---------------------------------------------------------------------------
# MessageTemplate
# ---------------------------------------------------------------------------


class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = ["id", "name", "content", "category", "created_at"]
        read_only_fields = ["id", "created_at"]


class MessageTemplateCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    content = serializers.CharField()
    category = serializers.ChoiceField(
        choices=MessageTemplate.Category.choices,
        default=MessageTemplate.Category.GENERAL,
    )
