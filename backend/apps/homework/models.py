"""
Homework models: tasks, submissions, and grading.
"""

from django.db import models
from core.models import TenantModel


class HomeworkTask(TenantModel):
    """A homework task assigned by a teacher to a class."""

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="created_tasks",
        limit_choices_to={"role": "teacher"},
    )
    subject = models.ForeignKey(
        "academics.Subject", on_delete=models.CASCADE, related_name="homework_tasks"
    )
    classroom = models.ForeignKey(
        "academics.Classroom", on_delete=models.CASCADE, related_name="homework_tasks"
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    due_date = models.DateTimeField()
    attachment = models.FileField(upload_to="homework/tasks/", blank=True, null=True)

    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=20.0)
    is_published = models.BooleanField(default=True)

    class Meta:
        db_table = "homework_tasks"
        ordering = ["-due_date"]

    def __str__(self):
        return f"{self.title} — {self.classroom}"


class HomeworkSubmission(TenantModel):
    """A student's submission for a homework task."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUBMITTED = "submitted", "Submitted"
        LATE = "late", "Late Submission"
        GRADED = "graded", "Graded"

    task = models.ForeignKey(
        HomeworkTask, on_delete=models.CASCADE, related_name="submissions"
    )
    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="homework_submissions",
        limit_choices_to={"role": "student"},
    )
    file = models.FileField(upload_to="homework/submissions/", blank=True, null=True)
    text_response = models.TextField(blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    submitted_at = models.DateTimeField(null=True, blank=True)

    # Grading
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    feedback = models.TextField(blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "homework_submissions"
        unique_together = ("task", "student")
        ordering = ["-submitted_at"]

    def __str__(self):
        return f"{self.student.full_name} — {self.task.title}"
