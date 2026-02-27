"""
AI Chatbot models: knowledge base and chat history.
Uses RAG (Retrieval-Augmented Generation) with LangChain + Pinecone + GPT.
"""

from django.db import models
from core.models import TenantModel


class KnowledgeBase(TenantModel):
    """School-specific knowledge base entries for RAG retrieval."""

    class Category(models.TextChoices):
        FAQ = "faq", "Frequently Asked Questions"
        POLICY = "policy", "School Policy"
        SCHEDULE = "schedule", "Schedule Information"
        CONTACT = "contact", "Contact Information"
        GENERAL = "general", "General Information"
        ACADEMIC = "academic", "Academic Information"

    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.GENERAL
    )
    is_active = models.BooleanField(default=True)
    vector_id = models.CharField(
        max_length=255, blank=True, help_text="ID in vector database (Pinecone)"
    )

    class Meta:
        db_table = "knowledge_base"
        ordering = ["category", "title"]

    def __str__(self):
        return f"[{self.category}] {self.title}"


class ChatSession(TenantModel):
    """A chatbot conversation session."""

    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="chat_sessions"
    )

    class Meta:
        db_table = "chat_sessions"
        ordering = ["-created_at"]


class ChatMessage(TenantModel):
    """A single message in a chatbot session."""

    class Role(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"

    session = models.ForeignKey(
        ChatSession, on_delete=models.CASCADE, related_name="messages"
    )
    role = models.CharField(max_length=10, choices=Role.choices)
    content = models.TextField()

    class Meta:
        db_table = "chat_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:80]}"
