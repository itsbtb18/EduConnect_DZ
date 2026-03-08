"""
Notification and DeviceToken models — with priority hierarchy & user preferences.
"""

import uuid

from django.db import models


# ---------------------------------------------------------------------------
# Notification — with priority hierarchy
# ---------------------------------------------------------------------------


class Notification(models.Model):
    """In-app notification record with priority levels."""

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
        LIBRARY = "LIBRARY", "Library"
        TRANSPORT = "TRANSPORT", "Transport"
        CANTEEN = "CANTEEN", "Canteen"
        INFIRMERIE = "INFIRMERIE", "Infirmerie"
        SMS = "SMS", "SMS"
        SYSTEM = "SYSTEM", "System"

    class Priority(models.TextChoices):
        URGENT = "URGENT", "Urgente (push + SMS)"
        IMPORTANT = "IMPORTANT", "Importante (push)"
        INFO = "INFO", "Information (in-app)"

    class Category(models.TextChoices):
        ACADEMIC = "ACADEMIC", "Académique"
        ATTENDANCE_CAT = "ATTENDANCE", "Présences"
        FINANCE = "FINANCE", "Finances"
        LIBRARY_CAT = "LIBRARY", "Bibliothèque"
        TRANSPORT_CAT = "TRANSPORT", "Transport"
        CANTEEN_CAT = "CANTEEN", "Cantine"
        MESSAGE_CAT = "MESSAGE", "Messages"
        SYSTEM_CAT = "SYSTEM", "Système"

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
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.INFO,
    )
    category = models.CharField(
        max_length=15,
        choices=Category.choices,
        default=Category.SYSTEM_CAT,
    )
    related_object_id = models.UUIDField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, blank=True, null=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    push_sent = models.BooleanField(default=False)
    sms_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.full_name}: {self.title}"


# ---------------------------------------------------------------------------
# NotificationPreference — per-user notification settings
# ---------------------------------------------------------------------------


class NotificationPreference(models.Model):
    """User notification preferences by category + silent mode."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notification_preferences",
    )

    # Per-category toggles (push notifications)
    push_academic = models.BooleanField(default=True)
    push_attendance = models.BooleanField(default=True)
    push_finance = models.BooleanField(default=True)
    push_library = models.BooleanField(default=True)
    push_transport = models.BooleanField(default=True)
    push_canteen = models.BooleanField(default=True)
    push_messages = models.BooleanField(default=True)
    push_system = models.BooleanField(default=True)

    # SMS preferences
    sms_academic = models.BooleanField(default=False)
    sms_attendance = models.BooleanField(default=True)
    sms_finance = models.BooleanField(default=True)
    sms_library = models.BooleanField(default=False)
    sms_transport = models.BooleanField(default=False)
    sms_canteen = models.BooleanField(default=False)
    sms_messages = models.BooleanField(default=False)

    # Silent mode
    silent_mode_enabled = models.BooleanField(default=False)
    silent_start_time = models.TimeField(null=True, blank=True, help_text="HH:MM")
    silent_end_time = models.TimeField(null=True, blank=True, help_text="HH:MM")

    # Weekly summary
    weekly_summary_enabled = models.BooleanField(default=False)

    class Meta:
        db_table = "notification_preferences"

    def __str__(self):
        return f"Préférences de {self.user.full_name}"

    def is_push_enabled(self, category: str) -> bool:
        field = f"push_{category.lower()}"
        return getattr(self, field, True)

    def is_sms_enabled(self, category: str) -> bool:
        field = f"sms_{category.lower()}"
        return getattr(self, field, False)

    def is_in_silent_mode(self) -> bool:
        if not self.silent_mode_enabled:
            return False
        if not self.silent_start_time or not self.silent_end_time:
            return False
        from django.utils import timezone

        now = timezone.localtime().time()
        if self.silent_start_time <= self.silent_end_time:
            return self.silent_start_time <= now <= self.silent_end_time
        # Overnight range (e.g., 22:00 → 07:00)
        return now >= self.silent_start_time or now <= self.silent_end_time


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
