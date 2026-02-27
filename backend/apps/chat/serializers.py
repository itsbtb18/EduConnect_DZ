from rest_framework import serializers
from .models import Conversation, Message, MessageTemplate


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)

    class Meta:
        model = Message
        fields = "__all__"
        read_only_fields = [
            "id",
            "school",
            "sender",
            "is_read",
            "read_at",
            "created_at",
            "updated_at",
        ]


class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        return MessageSerializer(msg).data if msg else None

    def get_unread_count(self, obj):
        user = self.context.get("request", {})
        if hasattr(user, "user"):
            user = user.user
            return obj.messages.filter(is_read=False).exclude(sender=user).count()
        return 0


class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]
