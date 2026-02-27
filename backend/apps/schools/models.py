"""
Models for the Schools app — each school is a tenant.
"""

from django.db import models

from core.models import TimeStampedModel


class School(TimeStampedModel):
    """
    Represents a school (tenant) in the multi-tenant system.
    Each school has its own isolated data.
    """

    name = models.CharField(max_length=255)
    arabic_name = models.CharField(max_length=255, blank=True)
    code = models.CharField(
        max_length=20, unique=True, help_text="Unique school code (e.g., SCH-001)"
    )
    logo = models.ImageField(upload_to="schools/logos/", blank=True, null=True)

    # Contact
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    wilaya = models.CharField(max_length=100, blank=True, help_text="Algerian province")

    # Details
    school_type = models.CharField(
        max_length=20,
        choices=[
            ("primary", "Primary School"),
            ("middle", "Middle School"),
            ("secondary", "Secondary School"),
            ("combined", "Combined Levels"),
        ],
        default="combined",
    )
    motto = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)

    # Subscription
    subscription_plan = models.CharField(
        max_length=20,
        choices=[
            ("free", "Free Trial"),
            ("basic", "Basic"),
            ("premium", "Premium"),
            ("enterprise", "Enterprise"),
        ],
        default="free",
    )
    subscription_expires = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    max_students = models.PositiveIntegerField(default=100)

    class Meta:
        db_table = "schools"
        ordering = ["name"]

    def __str__(self):
        return self.name


class AcademicYear(TimeStampedModel):
    """Represents an academic year for a school."""

    school = models.ForeignKey(
        School, on_delete=models.CASCADE, related_name="academic_years"
    )
    name = models.CharField(max_length=20, help_text="e.g., 2025-2026")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = "academic_years"
        unique_together = ("school", "name")
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.school.name} — {self.name}"


class Semester(TimeStampedModel):
    """Semesters (trimesters) within an academic year."""

    academic_year = models.ForeignKey(
        AcademicYear, on_delete=models.CASCADE, related_name="semesters"
    )
    name = models.CharField(max_length=50, help_text="e.g., Trimester 1")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)

    class Meta:
        db_table = "semesters"
        ordering = ["start_date"]

    def __str__(self):
        return f"{self.name} — {self.academic_year.name}"
