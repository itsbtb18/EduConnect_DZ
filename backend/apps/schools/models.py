"""
Models for the Schools app.
All models include soft delete (is_deleted, deleted_at) and audit fields (created_by, created_at, updated_at).
"""

import uuid

from django.core.exceptions import ValidationError
from django.db import models


def validate_school_logo(image):
    """Validate that the school logo is PNG, JPG or JPEG and under 2MB."""
    if image.size > 2 * 1024 * 1024:
        raise ValidationError("Logo must be under 2MB.")
    allowed_extensions = (".png", ".jpg", ".jpeg")
    if not image.name.lower().endswith(allowed_extensions):
        raise ValidationError("Logo must be a PNG, JPG or JPEG file.")


class School(models.Model):
    """Represents a school (tenant) in the multi-tenant system."""

    class SubscriptionPlan(models.TextChoices):
        STARTER = "STARTER", "Starter"
        PRO = "PRO", "Pro"
        PRO_AI = "PRO_AI", "Pro + AI"

    class SchoolCategory(models.TextChoices):
        PRIVATE_SCHOOL = "PRIVATE_SCHOOL", "École Privée"
        TRAINING_CENTER = "TRAINING_CENTER", "Centre de Formation"

    class TrainingType(models.TextChoices):
        SUPPORT_COURSES = "SUPPORT_COURSES", "Cours de Soutien Scolaire"
        LANGUAGES = "LANGUAGES", "École de Langues"
        PROFESSIONAL = "PROFESSIONAL", "Formation Professionnelle"
        EXAM_PREP = "EXAM_PREP", "Préparation aux Examens (BEM/BAC)"
        COMPUTING = "COMPUTING", "Informatique & Bureautique"
        OTHER = "OTHER", "Autre"

    # ── Identity ──
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    logo = models.ImageField(
        upload_to="schools/logos/",
        blank=True,
        null=True,
        validators=[validate_school_logo],
    )
    address = models.TextField(blank=True)
    wilaya = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.CharField(max_length=200, blank=True)
    motto = models.CharField(max_length=300, blank=True)
    subdomain = models.CharField(max_length=63, unique=True)

    # ── School Category ──
    school_category = models.CharField(
        max_length=20,
        choices=SchoolCategory.choices,
        default=SchoolCategory.PRIVATE_SCHOOL,
    )

    # Sections (only for PRIVATE_SCHOOL)
    has_primary = models.BooleanField(default=False)
    has_middle = models.BooleanField(default=False)
    has_high = models.BooleanField(default=False)

    # Lycée streams / filières (only relevant when has_high=True)
    available_streams = models.JSONField(
        default=list,
        blank=True,
        help_text="List of stream codes available at this school, e.g. ['TC_SCI','SE','MATH']",
    )

    # Training type (only for TRAINING_CENTER)
    training_type = models.CharField(
        max_length=30,
        choices=TrainingType.choices,
        blank=True,
        null=True,
    )

    # ── Subscription ──
    subscription_plan = models.CharField(
        max_length=20,
        choices=SubscriptionPlan.choices,
        default=SubscriptionPlan.STARTER,
    )
    subscription_active = models.BooleanField(default=True)
    subscription_start = models.DateField(blank=True, null=True)
    subscription_end = models.DateField(blank=True, null=True)
    max_students = models.IntegerField(default=500)

    # ── Status ──
    is_active = models.BooleanField(default=True)
    setup_completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    # ── Soft delete ──
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # ── Audit ──
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

    def clean(self):
        """Category-driven validation."""
        if self.school_category == self.SchoolCategory.PRIVATE_SCHOOL:
            if not any([self.has_primary, self.has_middle, self.has_high]):
                raise ValidationError(
                    "A private school must have at least one section enabled "
                    "(Primary, Middle, or High School)."
                )
        if self.school_category == self.SchoolCategory.TRAINING_CENTER:
            # Clear section flags for training centers
            self.has_primary = False
            self.has_middle = False
            self.has_high = False
            if not self.training_type:
                raise ValidationError("Please specify the type of training center.")

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
        Section,
        on_delete=models.CASCADE,
        related_name="academic_years",
        null=True,
        blank=True,
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
        ordering = ["-start_date"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "section", "name"],
                name="unique_school_section_year",
                condition=models.Q(section__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["school", "name"],
                name="unique_school_year_no_section",
                condition=models.Q(section__isnull=True),
            ),
        ]

    def __str__(self):
        section_name = self.section.name if self.section else "Global"
        return f"{self.school.name} — {section_name} — {self.name}"

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])
