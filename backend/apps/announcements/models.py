"""
Announcement models: posts, attachments, and read tracking.
"""

import uuid

from django.db import models


# ---------------------------------------------------------------------------
# Announcement
# ---------------------------------------------------------------------------


class Announcement(models.Model):
    """School announcements visible to targeted audiences."""

    class TargetAudience(models.TextChoices):
        ALL = "ALL", "Everyone"
        PARENTS = "PARENTS", "Parents Only"
        STUDENTS = "STUDENTS", "Students Only"
        TEACHERS = "TEACHERS", "Teachers Only"
        SPECIFIC_SECTION = "SPECIFIC_SECTION", "Specific Section"
        SPECIFIC_CLASS = "SPECIFIC_CLASS", "Specific Class"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="announcements",
    )
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="authored_announcements",
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    target_audience = models.CharField(
        max_length=20,
        choices=TargetAudience.choices,
        default=TargetAudience.ALL,
    )
    target_section = models.ForeignKey(
        "schools.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements",
    )
    target_class = models.ForeignKey(
        "academics.Class",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="announcements",
        db_column="target_class_id",
    )
    is_pinned = models.BooleanField(default=False)
    publish_at = models.DateTimeField(
        null=True, blank=True, help_text="Scheduled publication time"
    )
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "announcements"
        ordering = ["-is_pinned", "-published_at"]

    def __str__(self):
        return self.title

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at"])


# ---------------------------------------------------------------------------
# AnnouncementAttachment
# ---------------------------------------------------------------------------


class AnnouncementAttachment(models.Model):
    """File attachment for an announcement."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    announcement = models.ForeignKey(
        Announcement,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to="announcements/")
    file_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "announcement_attachments"

    def __str__(self):
        return self.file_name


# ---------------------------------------------------------------------------
# AnnouncementRead
# ---------------------------------------------------------------------------


class AnnouncementRead(models.Model):
    """Tracks which users have read an announcement."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    announcement = models.ForeignKey(
        Announcement,
        on_delete=models.CASCADE,
        related_name="reads",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="announcement_reads",
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "announcement_reads"
        unique_together = ("announcement", "user")

    def __str__(self):
        return f"{self.user.full_name} read {self.announcement.title}"
