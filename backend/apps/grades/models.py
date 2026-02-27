"""
Grades models: Subject (per-school), TrimesterConfig, Grade with full
draft → submitted → published/returned workflow.
"""

import uuid

from django.core.exceptions import ValidationError
from django.db import models


# ---------------------------------------------------------------------------
# Subject (school-scoped)
# ---------------------------------------------------------------------------


class Subject(models.Model):
    """A subject offered by a school within a specific section and class."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="subjects",
    )
    section = models.ForeignKey(
        "schools.Section",
        on_delete=models.CASCADE,
        related_name="subjects",
    )
    class_obj = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="subjects",
        db_column="class_id",
    )
    name = models.CharField(max_length=100)
    coefficient = models.DecimalField(max_digits=4, decimal_places=2, default=1)
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="taught_subjects",
        limit_choices_to={"role": "TEACHER"},
    )
    is_mandatory = models.BooleanField(default=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # Audit
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_subjects",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subjects"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.class_obj.name})"

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


# ---------------------------------------------------------------------------
# TrimesterConfig (weight distribution per school/section)
# ---------------------------------------------------------------------------


class TrimesterConfig(models.Model):
    """
    Defines the weight distribution for a school-section pair.
    Constraint: continuous + test1 + test2 + final = 1.00
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="trimester_configs",
    )
    section = models.ForeignKey(
        "schools.Section",
        on_delete=models.CASCADE,
        related_name="trimester_configs",
    )

    continuous_weight = models.DecimalField(
        max_digits=4, decimal_places=2, default="0.20"
    )
    test1_weight = models.DecimalField(max_digits=4, decimal_places=2, default="0.20")
    test2_weight = models.DecimalField(max_digits=4, decimal_places=2, default="0.20")
    final_weight = models.DecimalField(max_digits=4, decimal_places=2, default="0.40")

    class Meta:
        db_table = "trimester_configs"
        unique_together = ("school", "section")

    def __str__(self):
        return f"TrimesterConfig: {self.school.name} — {self.section.name}"

    def clean(self):
        total = (
            self.continuous_weight
            + self.test1_weight
            + self.test2_weight
            + self.final_weight
        )
        from decimal import Decimal

        if total != Decimal("1.00"):
            raise ValidationError(f"Weights must sum to 1.00 (currently {total}).")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# Grade
# ---------------------------------------------------------------------------


class Grade(models.Model):
    """
    A single grade for a student in a subject.
    Immutable once PUBLISHED — save() raises ValidationError if the value
    is changed after publish.
    """

    class ExamType(models.TextChoices):
        CONTINUOUS = "CONTINUOUS", "Continuous Assessment"
        TEST_1 = "TEST_1", "Test 1"
        TEST_2 = "TEST_2", "Test 2"
        FINAL = "FINAL", "Final Exam"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted for Review"
        PUBLISHED = "PUBLISHED", "Published"
        RETURNED = "RETURNED", "Returned"

    TRIMESTER_CHOICES = [
        (1, "Trimester 1"),
        (2, "Trimester 2"),
        (3, "Trimester 3"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="grades",
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="grades",
    )
    trimester = models.IntegerField(choices=TRIMESTER_CHOICES)
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="grades",
    )
    exam_type = models.CharField(max_length=12, choices=ExamType.choices)

    # Score
    value = models.DecimalField(max_digits=4, decimal_places=2)
    max_value = models.DecimalField(max_digits=4, decimal_places=2, default="20.00")

    # Workflow
    status = models.CharField(
        max_length=12, choices=Status.choices, default=Status.DRAFT
    )
    submitted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="submitted_grades",
    )
    submitted_at = models.DateTimeField(blank=True, null=True)
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_grades",
    )
    published_at = models.DateTimeField(blank=True, null=True)
    admin_comment = models.TextField(blank=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)

    # Audit
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_grades",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "grades"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.student.user.full_name} — {self.subject.name} "
            f"T{self.trimester} {self.exam_type}: {self.value}/{self.max_value}"
        )

    def save(self, *args, **kwargs):
        """Prevent value changes once grade is PUBLISHED."""
        if self.pk:
            try:
                old = Grade.objects.get(pk=self.pk)
            except Grade.DoesNotExist:
                old = None
            if old and old.status == self.Status.PUBLISHED and old.value != self.value:
                raise ValidationError("Cannot change the value of a published grade.")
        super().save(*args, **kwargs)

    def soft_delete(self):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=["is_deleted", "deleted_at", "updated_at"])


# ---------------------------------------------------------------------------
# ReportCard — stores a generated PDF bulletin for one student/trimester
# ---------------------------------------------------------------------------


class ReportCard(models.Model):
    """
    Stores a generated PDF report card (bulletin scolaire) for one student
    in a given trimester of an academic year.

    The PDF is generated via a Celery task (WeasyPrint), uploaded to S3/R2,
    and the signed URL stored here.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="report_cards",
    )
    class_obj = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="report_cards",
        db_column="class_id",
        help_text="Class at the time the report was generated (historical record).",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="report_cards",
    )
    trimester = models.IntegerField(
        choices=Grade.TRIMESTER_CHOICES,
    )

    # Computed aggregates (snapshot)
    general_average = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    rank = models.PositiveIntegerField(null=True, blank=True)
    total_students = models.PositiveIntegerField(null=True, blank=True)

    # Comments
    admin_comment = models.TextField(blank=True)
    teacher_comment = models.TextField(blank=True)

    # PDF artefact
    pdf_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="Signed URL of the generated PDF on S3 / R2.",
    )

    is_published = models.BooleanField(default=False)

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "report_cards"
        unique_together = ("student", "academic_year", "trimester")
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"ReportCard: {self.student.user.full_name} — "
            f"T{self.trimester} ({self.academic_year.name})"
        )
