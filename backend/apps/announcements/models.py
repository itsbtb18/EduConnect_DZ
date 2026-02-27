"""
Announcements and school events models.
"""

from django.db import models
from core.models import TenantModel


class Announcement(TenantModel):
    """School announcements visible to targeted audiences."""

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        NORMAL = "normal", "Normal"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class TargetAudience(models.TextChoices):
        ALL = "all", "Everyone"
        TEACHERS = "teachers", "Teachers Only"
        PARENTS = "parents", "Parents Only"
        STUDENTS = "students", "Students Only"
        STAFF = "staff", "Staff Only"

    author = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="announcements"
    )
    title = models.CharField(max_length=255)
    content = models.TextField()
    target_audience = models.CharField(
        max_length=20, choices=TargetAudience.choices, default=TargetAudience.ALL
    )
    target_classrooms = models.ManyToManyField(
        "academics.Classroom", blank=True, related_name="announcements"
    )
    priority = models.CharField(
        max_length=10, choices=Priority.choices, default=Priority.NORMAL
    )
    attachment = models.FileField(upload_to="announcements/", blank=True, null=True)
    is_published = models.BooleanField(default=True)
    published_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "announcements"
        ordering = ["-published_at"]

    def __str__(self):
        return self.title


class Event(TenantModel):
    """School events displayed on calendars."""

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True)
    is_holiday = models.BooleanField(default=False)
    color = models.CharField(max_length=7, default="#4CAF50")

    class Meta:
        db_table = "events"
        ordering = ["start_date"]

    def __str__(self):
        return f"{self.title} ({self.start_date.date()})"
