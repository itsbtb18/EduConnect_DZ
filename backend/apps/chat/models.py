"""
Chat models: conversations and messages.
Supports teacher-student and teacher-parent messaging.
"""

from django.db import models
from core.models import TenantModel


class Conversation(TenantModel):
    """A chat conversation between two users."""

    class ConversationType(models.TextChoices):
        TEACHER_STUDENT = "teacher_student", "Teacher-Student"
        TEACHER_PARENT = "teacher_parent", "Teacher-Parent"
        BROADCAST = "broadcast", "Class Broadcast"

    conversation_type = models.CharField(
        max_length=20, choices=ConversationType.choices
    )
    participants = models.ManyToManyField("accounts.User", related_name="conversations")
    classroom = models.ForeignKey(
        "academics.Classroom",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversations",
        help_text="For broadcast conversations",
    )
    last_message_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "conversations"
        ordering = ["-last_message_at"]

    def __str__(self):
        return f"Conversation {self.id} ({self.conversation_type})"


class Message(TenantModel):
    """A single message in a conversation."""

    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="sent_messages"
    )
    content = models.TextField()
    attachment = models.FileField(upload_to="chat/attachments/", blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.full_name}: {self.content[:50]}"


class MessageTemplate(TenantModel):
    """Pre-written message templates for teachers."""

    title = models.CharField(max_length=100)
    content = models.TextField()
    category = models.CharField(
        max_length=50, blank=True, help_text="e.g., behavior, homework, meeting"
    )

    class Meta:
        db_table = "message_templates"

    def __str__(self):
        return self.title
