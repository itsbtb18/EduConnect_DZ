"""
Chat models — Conversation-based messaging system.
Two-participant conversations with real-time WebSocket delivery.
Group/broadcast ChatRooms with typed salons.
Read receipts, message pinning, timed deletion, templates.
"""

import uuid
import os

from django.conf import settings
from django.db import models
from django.utils import timezone


# ---------------------------------------------------------------------------
# Conversation  (1-to-1 private chats)
# ---------------------------------------------------------------------------


class Conversation(models.Model):
    """A 1-to-1 conversation between two users."""

    class ParticipantRole(models.TextChoices):
        PARENT = "parent", "Parent"
        ENSEIGNANT = "enseignant", "Enseignant"
        ELEVE = "eleve", "Élève"
        ADMIN = "admin", "Admin"
        INFIRMIER = "infirmier", "Infirmier"

    class RoomType(models.TextChoices):
        DIRECT = "DIRECT", "Direct (legacy)"
        TEACHER_PARENT = "TEACHER_PARENT", "Teacher — Parent"
        TEACHER_STUDENT = "TEACHER_STUDENT", "Teacher — Student"
        ADMIN_PARENT = "ADMIN_PARENT", "Admin — Parent"
        ADMIN_TEACHER = "ADMIN_TEACHER", "Admin — Teacher"
        NURSE_PARENT = "NURSE_PARENT", "Nurse — Parent"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    room_type = models.CharField(
        max_length=20,
        choices=RoomType.choices,
        default=RoomType.DIRECT,
        help_text="Classification of this 1-to-1 conversation.",
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
    related_student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_conversations",
        help_text="Student this conversation concerns (for Teacher↔Parent chats).",
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
        VIDEO = "video", "Video"

    class Status(models.TextChoices):
        SENT = "SENT", "Sent"
        DELIVERED = "DELIVERED", "Delivered"
        READ = "READ", "Read"

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

    # Read receipts
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.SENT,
    )
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    # Pinning
    is_pinned = models.BooleanField(default=False)

    # Soft-delete (60-second window)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

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

    def can_delete(self):
        """Check if message can be deleted (within 60 seconds of creation)."""
        if self.is_deleted:
            return False
        return (timezone.now() - self.created_at).total_seconds() <= 60

    def soft_delete(self):
        """Soft-delete the message."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.content = ""
        if self.attachment:
            try:
                if os.path.isfile(self.attachment.path):
                    os.remove(self.attachment.path)
            except Exception:
                pass
            self.attachment = None
            self.attachment_type = None
            self.attachment_name = None
            self.attachment_size = None
        self.save(update_fields=[
            "is_deleted", "deleted_at", "content",
            "attachment", "attachment_type", "attachment_name", "attachment_size",
        ])


# ---------------------------------------------------------------------------
# ChatRoom  (group / broadcast salons)
# ---------------------------------------------------------------------------


def room_attachment_path(instance, filename):
    """Upload attachments to room_attachments/<room.school_id>/<filename>."""
    school_id = instance.room.school_id
    return f"room_attachments/{school_id}/{filename}"


class ChatRoom(models.Model):
    """
    A group conversation with N members.
    Covers typed salons: CLASS_BROADCAST, ADMIN_BROADCAST,
    TEACHER_PARENT_GROUP, TEACHER_STUDENT_GROUP, etc.
    """

    class RoomType(models.TextChoices):
        CLASS_BROADCAST = "CLASS_BROADCAST", "Class broadcast"
        ADMIN_BROADCAST = "ADMIN_BROADCAST", "Admin broadcast"
        ADMIN_ALL_BROADCAST = "ADMIN_ALL_BROADCAST", "Admin → All broadcast"
        TEACHER_PARENT_GROUP = "TEACHER_PARENT_GROUP", "Teacher — Parents group"
        TEACHER_STUDENT_GROUP = "TEACHER_STUDENT_GROUP", "Teacher — Students group"
        ADMIN_TEACHER_GROUP = "ADMIN_TEACHER_GROUP", "Admin — Teachers group"
        NURSE_PARENT_GROUP = "NURSE_PARENT_GROUP", "Nurse — Parents group"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="chat_rooms",
    )
    room_type = models.CharField(max_length=30, choices=RoomType.choices)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_rooms",
    )
    related_class = models.ForeignKey(
        "academics.Class",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_rooms",
        help_text="Linked class for CLASS_BROADCAST / teacher-group rooms.",
    )
    related_section = models.ForeignKey(
        "schools.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="chat_rooms",
        help_text="Linked section for section-level broadcasts.",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_rooms"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"[{self.get_room_type_display()}] {self.name}"


class ChatRoomMembership(models.Model):
    """Membership of a user in a ChatRoom."""

    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Admin"
        MEMBER = "MEMBER", "Member"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="room_memberships",
    )
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.MEMBER,
    )
    is_muted = models.BooleanField(default=False)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_room_memberships"
        unique_together = ("room", "user")

    def __str__(self):
        return f"{self.user.full_name} in {self.room.name}"


class ChatRoomMessage(models.Model):
    """A single message inside a ChatRoom."""

    class AttachmentType(models.TextChoices):
        IMAGE = "image", "Image"
        DOCUMENT = "document", "Document"
        VIDEO = "video", "Video"

    class Status(models.TextChoices):
        SENT = "SENT", "Sent"
        DELIVERED = "DELIVERED", "Delivered"
        READ = "READ", "Read"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="room_messages",
    )
    content = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to=room_attachment_path,
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

    # Read receipts
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.SENT,
    )

    # Pinning
    is_pinned = models.BooleanField(default=False)

    # Soft-delete (60-second window)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_room_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.full_name}: {self.content[:50] if self.content else '[attachment]'}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        if is_new:
            self.room.updated_at = timezone.now()
            self.room.save(update_fields=["updated_at"])

    def delete(self, *args, **kwargs):
        if self.attachment:
            try:
                if os.path.isfile(self.attachment.path):
                    os.remove(self.attachment.path)
            except Exception:
                pass
        super().delete(*args, **kwargs)

    def can_delete(self):
        if self.is_deleted:
            return False
        return (timezone.now() - self.created_at).total_seconds() <= 60

    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.content = ""
        if self.attachment:
            try:
                if os.path.isfile(self.attachment.path):
                    os.remove(self.attachment.path)
            except Exception:
                pass
            self.attachment = None
            self.attachment_type = None
            self.attachment_name = None
            self.attachment_size = None
        self.save(update_fields=[
            "is_deleted", "deleted_at", "content",
            "attachment", "attachment_type", "attachment_name", "attachment_size",
        ])


# ---------------------------------------------------------------------------
# MessageTemplate — pre-drafted message templates
# ---------------------------------------------------------------------------


class MessageTemplate(models.Model):
    """Pre-drafted message templates for quick replies."""

    class Category(models.TextChoices):
        GENERAL = "GENERAL", "General"
        ABSENCE = "ABSENCE", "Absence"
        GRADES = "GRADES", "Grades"
        DISCIPLINE = "DISCIPLINE", "Discipline"
        MEETING = "MEETING", "Meeting"
        HEALTH = "HEALTH", "Health"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="message_templates",
    )
    name = models.CharField(max_length=100)
    content = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.GENERAL,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_templates",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "message_templates"
        ordering = ["category", "name"]

    def __str__(self):
        return f"[{self.get_category_display()}] {self.name}"
