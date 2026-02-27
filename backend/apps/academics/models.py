"""
Models for Academics: Levels, Classrooms, Subjects, Schedules.
"""

from django.db import models

from core.models import TenantModel


class Level(TenantModel):
    """School level/grade (e.g., 1st Year Primary, 3rd Year Middle)."""

    name = models.CharField(max_length=100)
    arabic_name = models.CharField(max_length=100, blank=True)
    order = models.PositiveIntegerField(default=0, help_text="Sort order")
    school_stage = models.CharField(
        max_length=20,
        choices=[
            ("primary", "Primary"),
            ("middle", "Middle"),
            ("secondary", "Secondary"),
        ],
    )

    class Meta:
        db_table = "levels"
        ordering = ["order"]
        unique_together = ("school", "name")

    def __str__(self):
        return f"{self.name} ({self.school.name})"


class Classroom(TenantModel):
    """A specific classroom/section (e.g., 3rd Year A, 3rd Year B)."""

    level = models.ForeignKey(
        Level, on_delete=models.CASCADE, related_name="classrooms"
    )
    name = models.CharField(max_length=100, help_text="e.g., 3A, 3B")
    academic_year = models.ForeignKey(
        "schools.AcademicYear", on_delete=models.CASCADE, related_name="classrooms"
    )
    capacity = models.PositiveIntegerField(default=30)

    class Meta:
        db_table = "classrooms"
        ordering = ["level__order", "name"]
        unique_together = ("school", "level", "name", "academic_year")

    def __str__(self):
        return f"{self.level.name} - {self.name}"


class Subject(TenantModel):
    """A subject/course (e.g., Mathematics, Arabic, Physics)."""

    name = models.CharField(max_length=100)
    arabic_name = models.CharField(max_length=100, blank=True)
    code = models.CharField(max_length=20, blank=True)
    coefficient = models.DecimalField(max_digits=3, decimal_places=1, default=1.0)
    color = models.CharField(
        max_length=7, default="#2196F3", help_text="Hex color for UI"
    )
    icon = models.CharField(max_length=50, blank=True, help_text="Icon identifier")
    levels = models.ManyToManyField(Level, related_name="subjects", blank=True)

    class Meta:
        db_table = "subjects"
        ordering = ["name"]

    def __str__(self):
        return self.name


class TeacherAssignment(TenantModel):
    """Assigns a teacher to a subject in a classroom."""

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="teaching_assignments",
        limit_choices_to={"role": "teacher"},
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="assignments"
    )
    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name="teacher_assignments"
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="teacher_assignments",
    )

    class Meta:
        db_table = "teacher_assignments"
        unique_together = ("teacher", "subject", "classroom", "academic_year")

    def __str__(self):
        return f"{self.teacher.full_name} → {self.subject.name} ({self.classroom.name})"


class ScheduleSlot(TenantModel):
    """A specific time slot in the weekly schedule."""

    DAY_CHOICES = [
        (0, "Sunday"),
        (1, "Monday"),
        (2, "Tuesday"),
        (3, "Wednesday"),
        (4, "Thursday"),
    ]

    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name="schedule_slots"
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="schedule_slots"
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="schedule_slots",
        limit_choices_to={"role": "teacher"},
    )
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_name = models.CharField(
        max_length=50, blank=True, help_text="Physical room name"
    )

    class Meta:
        db_table = "schedule_slots"
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return f"{self.get_day_of_week_display()} {self.start_time}-{self.end_time}: {self.subject.name}"


class Lesson(TenantModel):
    """A lesson/chapter in a subject for a specific classroom."""

    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="lessons"
    )
    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name="lessons"
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="lessons",
        limit_choices_to={"role": "teacher"},
    )
    title = models.CharField(max_length=255)
    content = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "lessons"
        ordering = ["order"]

    def __str__(self):
        return self.title


class Resource(TenantModel):
    """Educational resource (PDF, video link, document) attached to a lesson or subject."""

    class ResourceType(models.TextChoices):
        PDF = "pdf", "PDF Document"
        VIDEO = "video", "Video Link"
        DOCUMENT = "document", "Document"
        LINK = "link", "External Link"

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name="resources",
        null=True,
        blank=True,
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="resources"
    )
    classroom = models.ForeignKey(
        Classroom, on_delete=models.CASCADE, related_name="resources"
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="uploaded_resources",
        limit_choices_to={"role": "teacher"},
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    resource_type = models.CharField(max_length=20, choices=ResourceType.choices)
    file = models.FileField(upload_to="resources/", blank=True, null=True)
    url = models.URLField(blank=True, help_text="For video links or external URLs")

    class Meta:
        db_table = "resources"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title
