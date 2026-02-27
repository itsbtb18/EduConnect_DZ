"""
Notification and DeviceToken models.
"""

import uuid

from django.db import models


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------


class Notification(models.Model):
    """In-app notification record."""

    class NotificationType(models.TextChoices):
        GRADE = "GRADE", "Grade"
        HOMEWORK = "HOMEWORK", "Homework"
        ATTENDANCE = "ATTENDANCE", "Attendance"
        ANNOUNCEMENT = "ANNOUNCEMENT", "Announcement"
        MESSAGE = "MESSAGE", "Message"
        REPORT_CARD = "REPORT_CARD", "Report Card"
        PAYMENT = "PAYMENT", "Payment"
        EVENT = "EVENT", "Event"
        DISCIPLINE = "DISCIPLINE", "Discipline"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
    )
    related_object_id = models.UUIDField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.full_name}: {self.title}"


# ---------------------------------------------------------------------------
# DeviceToken
# ---------------------------------------------------------------------------


class DeviceToken(models.Model):
    """FCM device token for push notifications."""

    class Platform(models.TextChoices):
        IOS = "IOS", "iOS"
        ANDROID = "ANDROID", "Android"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="device_tokens",
    )
    token = models.CharField(max_length=255, unique=True)
    platform = models.CharField(max_length=10, choices=Platform.choices)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "device_tokens"

    def __str__(self):
        return f"{self.user.full_name} — {self.platform} token"
