from rest_framework import permissions, viewsets
from .models import Conversation, Message, MessageTemplate
from .serializers import (
    ConversationSerializer,
    MessageSerializer,
    MessageTemplateSerializer,
)


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(
            school=self.request.user.school,
            participants=self.request.user,
        )

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs.get("conversation_pk")
        return Message.objects.filter(
            school=self.request.user.school,
            conversation_id=conversation_id,
        )

    def perform_create(self, serializer):
        serializer.save(
            school=self.request.user.school,
            sender=self.request.user,
            conversation_id=self.kwargs.get("conversation_pk"),
        )


class MessageTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = MessageTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MessageTemplate.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)
