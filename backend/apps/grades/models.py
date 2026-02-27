"""
Grades models: marks, exam types, report cards with draft/submit/publish workflow.
"""

from django.db import models

from core.models import TenantModel


class ExamType(TenantModel):
    """Types of exams/assessments (quiz, midterm, final, oral, homework, activity)."""

    name = models.CharField(max_length=100)
    arabic_name = models.CharField(max_length=100, blank=True)
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        help_text="Weight in final average calculation",
    )
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=20.0)

    class Meta:
        db_table = "exam_types"
        unique_together = ("school", "name")

    def __str__(self):
        return self.name


class Grade(TenantModel):
    """A single grade/mark for a student in a subject."""

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted for Review"
        PUBLISHED = "published", "Published"
        REJECTED = "rejected", "Rejected"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="grades",
        limit_choices_to={"role": "student"},
    )
    subject = models.ForeignKey(
        "academics.Subject", on_delete=models.CASCADE, related_name="grades"
    )
    classroom = models.ForeignKey(
        "academics.Classroom", on_delete=models.CASCADE, related_name="grades"
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="given_grades",
        limit_choices_to={"role": "teacher"},
    )
    semester = models.ForeignKey(
        "schools.Semester", on_delete=models.CASCADE, related_name="grades"
    )
    exam_type = models.ForeignKey(
        ExamType, on_delete=models.CASCADE, related_name="grades"
    )

    score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=20.0)
    comment = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )

    # Admin review
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_grades",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = "grades"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student.full_name} — {self.subject.name}: {self.score}/{self.max_score}"


class ReportCard(TenantModel):
    """Generated report card for a student per semester."""

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="report_cards",
        limit_choices_to={"role": "student"},
    )
    classroom = models.ForeignKey(
        "academics.Classroom", on_delete=models.CASCADE, related_name="report_cards"
    )
    semester = models.ForeignKey(
        "schools.Semester", on_delete=models.CASCADE, related_name="report_cards"
    )
    general_average = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    rank = models.PositiveIntegerField(null=True, blank=True)
    teacher_comment = models.TextField(blank=True)
    admin_comment = models.TextField(blank=True)
    pdf_file = models.FileField(upload_to="report_cards/", blank=True, null=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        db_table = "report_cards"
        unique_together = ("student", "semester")
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report: {self.student.full_name} — {self.semester}"
