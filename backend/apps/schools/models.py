"""
Models for the Schools app.
All models include soft delete (is_deleted, deleted_at) and audit fields (created_by, created_at, updated_at).
"""

import uuid

from django.db import models


class School(models.Model):
    """Represents a school (tenant) in the multi-tenant system."""

    class SubscriptionPlan(models.TextChoices):
        STARTER = "STARTER", "Starter"
        PRO = "PRO", "Pro"
        PRO_AI = "PRO_AI", "Pro + AI"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    logo = models.ImageField(upload_to="schools/logos/", blank=True, null=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    subdomain = models.CharField(max_length=63, unique=True)

    # Subscription
    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.STARTER,
    )
    subscription_active = models.BooleanField(default=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # Audit
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_schools",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "schools"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


class Section(models.Model):
    """Represents a section (Primary / Middle / High) within a school."""

    class SectionType(models.TextChoices):
        PRIMARY = "PRIMARY", "Primary"
        MIDDLE = "MIDDLE", "Middle"
        HIGH = "HIGH", "High"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="sections"
    )
    section_type = models.CharField(max_length=10, choices=SectionType.choices)
    name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # Audit
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_sections",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "sections"
        unique_together = ["school", "section_type"]
        ordering = ["school", "section_type"]

    def __str__(self):
        return f"{self.school.name} — {self.name}"

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


class AcademicYear(models.Model):
    """Represents an academic year for a school section."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="academic_years"
    )
    section = models.ForeignKey(
        Section, on_delete=models.CASCADE, related_name="academic_years"
    )
    name = models.CharField(max_length=20, help_text="e.g. 2025-2026")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # Audit
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_academic_years",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "academic_years"
        unique_together = ("school", "section", "name")
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.school.name} — {self.section.name} — {self.name}"

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
