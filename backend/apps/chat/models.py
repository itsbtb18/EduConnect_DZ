"""
Chat models: rooms, messages, and read tracking.
"""

import uuid

from django.db import models


# ---------------------------------------------------------------------------
# ChatRoom
# ---------------------------------------------------------------------------


class ChatRoom(models.Model):
    """A chat room with typed context."""

    class RoomType(models.TextChoices):
        TEACHER_PARENT = "TEACHER_PARENT", "Teacher-Parent"
        TEACHER_STUDENT = "TEACHER_STUDENT", "Teacher-Student"
        CLASS_BROADCAST = "CLASS_BROADCAST", "Class Broadcast"
        ADMIN_PARENT = "ADMIN_PARENT", "Admin-Parent"
        ADMIN_BROADCAST = "ADMIN_BROADCAST", "Admin Broadcast"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="chat_rooms",
    )
    room_type = models.CharField(max_length=20, choices=RoomType.choices)
    related_student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_rooms",
    )
    related_class = models.ForeignKey(
        "academics.Class",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_rooms",
        db_column="related_class_id",
    )
    participants = models.ManyToManyField(
        "accounts.User", related_name="chat_rooms", blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_rooms"
        ordering = ["-created_at"]

    def __str__(self):
        return f"ChatRoom {self.id} ({self.room_type})"


# ---------------------------------------------------------------------------
# Message
# ---------------------------------------------------------------------------


class Message(models.Model):
    """A single message in a chat room."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        ChatRoom, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="sent_messages"
    )
    content = models.TextField(blank=True)
    attachment = models.FileField(upload_to="chat/attachments/", blank=True, null=True)
    attachment_type = models.CharField(max_length=50, blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        db_table = "messages"
        ordering = ["sent_at"]

    def __str__(self):
        return f"{self.sender.full_name}: {self.content[:50]}"


# ---------------------------------------------------------------------------
# MessageRead
# ---------------------------------------------------------------------------


class MessageRead(models.Model):
    """Tracks which users have read a message."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name="reads")
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="message_reads"
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "message_reads"
        unique_together = ("message", "user")

    def __str__(self):
        return f"{self.user.full_name} read message {self.message_id}"
