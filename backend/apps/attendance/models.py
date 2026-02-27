"""
Attendance models: daily records and absence excuses.
"""

from django.db import models
from core.models import TenantModel


class AttendanceRecord(TenantModel):
    """Daily attendance record for a student."""

    class Status(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT = "absent", "Absent"
        LATE = "late", "Late"
        EXCUSED = "excused", "Excused"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="attendance_records",
        limit_choices_to={"role": "student"},
    )
    classroom = models.ForeignKey(
        "academics.Classroom",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    date = models.DateField()
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PRESENT
    )
    marked_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="marked_attendance",
    )
    note = models.TextField(blank=True)

    class Meta:
        db_table = "attendance_records"
        unique_together = ("student", "date")
        ordering = ["-date"]

    def __str__(self):
        return f"{self.student.full_name} — {self.date} — {self.status}"


class AbsenceExcuse(TenantModel):
    """Parent-submitted excuse for student absence."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="absence_excuses",
        limit_choices_to={"role": "student"},
    )
    submitted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="submitted_excuses",
        limit_choices_to={"role": "parent"},
    )
    date = models.DateField()
    reason = models.TextField()
    attachment = models.FileField(upload_to="excuses/", blank=True, null=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_excuses",
    )

    class Meta:
        db_table = "absence_excuses"
        ordering = ["-date"]

    def __str__(self):
        return f"Excuse: {self.student.full_name} — {self.date}"
