"""
Extracurricular models — activities, sessions, enrollment.
"""

from django.db import models

from core.models import TenantModel


class Activity(TenantModel):
    """An extracurricular activity (club, workshop, sport, etc.)."""

    class Category(models.TextChoices):
        SPORT = "SPORT", "Sport"
        ART = "ART", "Art"
        SCIENCE = "SCIENCE", "Science"
        LANGUAGE = "LANGUAGE", "Language"
        CULTURAL = "CULTURAL", "Cultural"
        OTHER = "OTHER", "Other"

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.OTHER
    )
    supervisor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="supervised_activities",
    )
    max_participants = models.PositiveIntegerField(default=30)
    day_of_week = models.CharField(max_length=10, blank=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "extracurricular_activities"
        verbose_name_plural = "Activities"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Enrollment(TenantModel):
    """A student's enrollment in an activity."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"

    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="enrollments"
    )
    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="activity_enrollments",
    )
    enrolled_date = models.DateField(auto_now_add=True)
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.ACTIVE
    )

    class Meta:
        db_table = "extracurricular_enrollments"
        unique_together = ["activity", "student"]
        ordering = ["-enrolled_date"]

    def __str__(self):
        return f"{self.student} — {self.activity.name}"


class Session(TenantModel):
    """A single session/occurrence of an activity."""

    activity = models.ForeignKey(
        Activity, on_delete=models.CASCADE, related_name="sessions"
    )
    date = models.DateField()
    notes = models.TextField(blank=True)
    cancelled = models.BooleanField(default=False)

    class Meta:
        db_table = "extracurricular_sessions"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.activity.name} — {self.date}"
