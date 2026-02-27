from rest_framework import serializers

from .models import ChatRoom, Message


# ---------------------------------------------------------------------------
# Read serializers
# ---------------------------------------------------------------------------


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)

    class Meta:
        model = Message
        fields = [
            "id",
            "room",
            "sender",
            "sender_name",
            "content",
            "attachment",
            "attachment_type",
            "sent_at",
            "is_deleted",
        ]
        read_only_fields = ["id", "sender", "sent_at", "is_deleted"]


class ChatRoomSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    participant_names = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            "id",
            "school",
            "room_type",
            "related_student",
            "related_class",
            "participants",
            "created_at",
            "last_message",
            "unread_count",
            "participant_names",
        ]
        read_only_fields = ["id", "school", "created_at"]

    def get_last_message(self, obj):
        msg = obj.messages.filter(is_deleted=False).order_by("-sent_at").first()
        return MessageSerializer(msg).data if msg else None

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user:
            return 0
        user = request.user
        # Count messages in this room not sent by the user that have no read
        return (
            obj.messages.filter(is_deleted=False)
            .exclude(sender=user)
            .exclude(reads__user=user)
            .count()
        )

    def get_participant_names(self, obj):
        return list(obj.participants.values_list("full_name", flat=True))


# ---------------------------------------------------------------------------
# Write serializers
# ---------------------------------------------------------------------------


class ChatRoomCreateSerializer(serializers.Serializer):
    """Create a chat room."""

    room_type = serializers.ChoiceField(choices=ChatRoom.RoomType.choices)
    related_student_id = serializers.UUIDField(required=False, allow_null=True)
    related_class_id = serializers.UUIDField(required=False, allow_null=True)
    participant_ids = serializers.ListField(child=serializers.UUIDField(), min_length=1)


class SendMessageSerializer(serializers.Serializer):
    """Send a message via REST (fallback for offline)."""

    content = serializers.CharField(required=False, allow_blank=True, default="")
    attachment = serializers.FileField(required=False, allow_null=True)
    attachment_type = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
