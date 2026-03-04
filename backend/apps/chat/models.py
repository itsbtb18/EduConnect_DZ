"""
Chat models — Conversation-based messaging system.
Two-participant conversations with real-time WebSocket delivery.
"""

import uuid
import os

from django.conf import settings
from django.db import models
from django.utils import timezone


# ---------------------------------------------------------------------------
# Conversation
# ---------------------------------------------------------------------------


class Conversation(models.Model):
    """A 1-to-1 conversation between an admin and another user."""

    class ParticipantRole(models.TextChoices):
        PARENT = "parent", "Parent"
        ENSEIGNANT = "enseignant", "Enseignant"
        ELEVE = "eleve", "Élève"
        ADMIN = "admin", "Admin"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_conversations",
    )
    participant_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_conversations",
    )
    participant_other = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="other_conversations",
    )
    participant_other_role = models.CharField(
        max_length=20,
        choices=ParticipantRole.choices,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    is_read_by_admin = models.BooleanField(default=True)
    unread_count_admin = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "conversations"
        ordering = ["-last_message_at", "-created_at"]
        unique_together = ("participant_admin", "participant_other")

    def __str__(self):
        return (
            f"Conversation {self.id}: "
            f"{self.participant_admin.full_name} ↔ {self.participant_other.full_name}"
        )


# ---------------------------------------------------------------------------
# Message
# ---------------------------------------------------------------------------


def chat_attachment_path(instance, filename):
    """Upload attachments to chat_attachments/<school_id>/<filename>."""
    school_id = instance.conversation.school_id
    return f"chat_attachments/{school_id}/{filename}"


class Message(models.Model):
    """A single message in a conversation."""

    class AttachmentType(models.TextChoices):
        IMAGE = "image", "Image"
        DOCUMENT = "document", "Document"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    content = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to=chat_attachment_path,
        null=True,
        blank=True,
    )
    attachment_type = models.CharField(
        max_length=20,
        choices=AttachmentType.choices,
        null=True,
        blank=True,
    )
    attachment_name = models.CharField(max_length=255, null=True, blank=True)
    attachment_size = models.PositiveIntegerField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "conversation_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.full_name}: {self.content[:50] if self.content else '[attachment]'}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)

        if is_new:
            conv = self.conversation
            conv.last_message_at = timezone.now()

            # If sender is NOT the admin, increment unread for admin
            if self.sender_id != conv.participant_admin_id:
                conv.unread_count_admin = models.F("unread_count_admin") + 1
                conv.is_read_by_admin = False

            conv.save(
                update_fields=[
                    "last_message_at",
                    "unread_count_admin",
                    "is_read_by_admin",
                ]
            )

    def delete(self, *args, **kwargs):
        # Remove physical file on delete
        if self.attachment:
            try:
                if os.path.isfile(self.attachment.path):
                    os.remove(self.attachment.path)
            except Exception:
                pass
        super().delete(*args, **kwargs)
