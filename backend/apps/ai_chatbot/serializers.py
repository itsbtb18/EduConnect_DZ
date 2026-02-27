from rest_framework import serializers
from .models import ChatMessage, ChatSession, KnowledgeBase


class KnowledgeBaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = KnowledgeBase
        fields = "__all__"
        read_only_fields = ["id", "school", "vector_id", "created_at", "updated_at"]


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = "__all__"
        read_only_fields = [
            "id",
            "school",
            "session",
            "role",
            "created_at",
            "updated_at",
        ]


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = "__all__"
        read_only_fields = ["id", "school", "user", "created_at", "updated_at"]


class ChatQuerySerializer(serializers.Serializer):
    """Input serializer for chatbot queries."""

    message = serializers.CharField(max_length=1000)
    session_id = serializers.UUIDField(required=False, allow_null=True)
