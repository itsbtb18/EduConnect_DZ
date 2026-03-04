"""
Homework models: posts, attachments, and view tracking.
"""

import uuid

from django.db import models


# ---------------------------------------------------------------------------
# HomeworkPost
# ---------------------------------------------------------------------------


class HomeworkPost(models.Model):
    """A homework task assigned by a teacher to a class."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="homework_posts",
    )
    class_obj = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="homework_posts",
        db_column="class_id",
    )
    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.CASCADE,
        related_name="homework_posts",
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="homework_posts",
        limit_choices_to={"role": "TEACHER"},
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="homework_posts",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    assigned_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date the homework was assigned (auto-set to creation date).",
    )
    due_date = models.DateField(
        help_text="Deadline date for the homework.",
    )
    estimated_duration_minutes = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Estimated time to complete (in minutes).",
    )
    is_published = models.BooleanField(default=True)
    is_corrected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Soft delete
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(blank=True, null=True)
    delete_reason = models.TextField(blank=True, default="")

    class Meta:
        db_table = "homework_posts"
        ordering = ["-due_date"]

    def __str__(self):
        return f"{self.title} — {self.class_obj.name}"

    def save(self, *args, **kwargs):
        if not self.assigned_date:
            from django.utils import timezone

            self.assigned_date = timezone.localdate()
        super().save(*args, **kwargs)

    def soft_delete(self, reason=""):
        from django.utils import timezone

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.delete_reason = reason or ""
        self.save(
            update_fields=["is_deleted", "deleted_at", "delete_reason", "updated_at"]
        )


# ---------------------------------------------------------------------------
# HomeworkAttachment
# ---------------------------------------------------------------------------


class HomeworkAttachment(models.Model):
    """File attachment for a homework post."""

    class FileType(models.TextChoices):
        PDF = "PDF", "PDF"
        IMAGE = "IMAGE", "Image"
        DOCUMENT = "DOCUMENT", "Document"
        VIDEO_LINK = "VIDEO_LINK", "Video Link"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    homework = models.ForeignKey(
        HomeworkPost,
        on_delete=models.CASCADE,
        related_name="attachments",
    )
    file = models.FileField(upload_to="homework/attachments/")
    file_type = models.CharField(max_length=12, choices=FileType.choices)
    file_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "homework_attachments"

    def __str__(self):
        return self.file_name


# ---------------------------------------------------------------------------
# HomeworkView (tracks which students viewed the homework)
# ---------------------------------------------------------------------------


class HomeworkView(models.Model):
    """Tracks which students have viewed a homework post."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="homework_views",
    )
    homework = models.ForeignKey(
        HomeworkPost,
        on_delete=models.CASCADE,
        related_name="views",
    )
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "homework_views"
        unique_together = ("student", "homework")

    def __str__(self):
        return f"{self.student.user.full_name} viewed {self.homework.title}"
