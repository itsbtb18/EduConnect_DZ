from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSchoolAdmin

from .models import ChatMessage, ChatSession, KnowledgeBase
from .serializers import (
    ChatQuerySerializer,
    ChatSessionSerializer,
    KnowledgeBaseSerializer,
)


class KnowledgeBaseViewSet(viewsets.ModelViewSet):
    """Manage school knowledge base entries (admin only)."""

    serializer_class = KnowledgeBaseSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return KnowledgeBase.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        instance = serializer.save(school=self.request.user.school)
        # TODO: Embed content and store in Pinecone vector DB
        # from .services import embed_and_store
        # embed_and_store(instance)
        return instance


class ChatSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """View user's chatbot sessions."""

    serializer_class = ChatSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)


class ChatQueryView(APIView):
    """
    POST /api/v1/ai/chat/
    Send a message to the AI chatbot and get a response.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChatQuerySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user_message = serializer.validated_data["message"]
        session_id = serializer.validated_data.get("session_id")

        # Get or create session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                session = ChatSession.objects.create(
                    school=request.user.school, user=request.user
                )
        else:
            session = ChatSession.objects.create(
                school=request.user.school, user=request.user
            )

        # Save user message
        ChatMessage.objects.create(
            school=request.user.school,
            session=session,
            role="user",
            content=user_message,
        )

        # TODO: Implement RAG pipeline:
        # 1. Embed user query
        # 2. Search Pinecone for relevant knowledge
        # 3. Check if query needs dynamic data (grades, homework, etc.)
        # 4. Build prompt with context
        # 5. Call OpenAI GPT
        # 6. Return response

        assistant_response = (
            "I'm the EduConnect AI assistant. This feature is coming soon! "
            "I'll be able to answer questions about your school, grades, homework, and more."
        )

        # Save assistant message
        ChatMessage.objects.create(
            school=request.user.school,
            session=session,
            role="assistant",
            content=assistant_response,
        )

        return Response(
            {
                "session_id": str(session.id),
                "response": assistant_response,
            }
        )
