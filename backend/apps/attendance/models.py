"""
Attendance models: daily attendance records and absence excuses.
"""

import uuid

from django.db import models
from django.utils import timezone


# ---------------------------------------------------------------------------
# AttendanceRecord
# ---------------------------------------------------------------------------


class AttendanceRecord(models.Model):
    """Daily attendance record for a student in a class."""

    class Status(models.TextChoices):
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "Late"

    class Period(models.TextChoices):
        MORNING = "MORNING", "Morning"
        AFTERNOON = "AFTERNOON", "Afternoon"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )
    class_obj = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="attendance_records",
        db_column="class_id",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="attendance_records",
    )
    date = models.DateField()
    period = models.CharField(
        max_length=20,
        choices=Period.choices,
        default=Period.MORNING,
        blank=True,
    )
    subject_name = models.CharField(max_length=120, blank=True, default="")
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PRESENT
    )
    note = models.TextField(blank=True)
    marked_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="marked_attendance",
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="attendance_records",
    )

    # Justification fields (admin can justify directly)
    is_justified = models.BooleanField(default=False)
    justification_note = models.TextField(blank=True, default="")
    justified_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="justified_attendance",
    )
    justified_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "attendance_records"
        unique_together = ("student", "date", "period")
        ordering = ["-date"]

    def __str__(self):
        return f"{self.student.user.full_name} — {self.date} — {self.status}"

    def justify(self, user, note=""):
        """Mark this absence as justified by an admin."""
        self.is_justified = True
        self.justification_note = note
        self.justified_by = user
        self.justified_at = timezone.now()
        self.save(
            update_fields=[
                "is_justified",
                "justification_note",
                "justified_by",
                "justified_at",
                "updated_at",
            ]
        )


# ---------------------------------------------------------------------------
# AbsenceExcuse
# ---------------------------------------------------------------------------


class AbsenceExcuse(models.Model):
    """Parent-submitted excuse for a student absence."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendance_record = models.ForeignKey(
        AttendanceRecord,
        on_delete=models.CASCADE,
        related_name="excuses",
    )
    submitted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="submitted_excuses",
        limit_choices_to={"role": "PARENT"},
    )
    justification_text = models.TextField()
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
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "absence_excuses"
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"Excuse: {self.attendance_record.student.user.full_name} "
            f"— {self.attendance_record.date}"
        )
