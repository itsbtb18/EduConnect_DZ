"""
Models for Academics: Classes, Profiles, Subjects, Schedules, Resources.
"""

from django.db import models

from core.models import AuditModel, TenantModel


# ---------------------------------------------------------------------------
# Class (replaces the old Level + Classroom pair)
# ---------------------------------------------------------------------------


class Class(AuditModel):
    """
    A class/group within a section and academic year.
    Example names: '3AP-A', '1MS-B', '2AS-Sciences-A'.
    """

    section = models.ForeignKey(
        "schools.Section",
        on_delete=models.CASCADE,
        related_name="classes",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="classes",
    )
    name = models.CharField(max_length=50, help_text="e.g. 3AP-A")
    level = models.CharField(max_length=20, help_text="e.g. 3AP")
    stream = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="For high-school streams (e.g. Sciences, Letters)",
    )
    homeroom_teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="homeroom_classes",
    )
    max_students = models.PositiveIntegerField(default=35)

    class Meta:
        db_table = "classes"
        ordering = ["level", "name"]
        verbose_name_plural = "classes"

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------


class StudentProfile(AuditModel):
    """Extended profile for student users."""

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="student_profile",
    )
    current_class = models.ForeignKey(
        Class,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    student_id = models.CharField(
        max_length=50,
        blank=True,
        help_text="School's internal student ID",
    )
    date_of_birth = models.DateField(blank=True, null=True)
    enrollment_date = models.DateField(blank=True, null=True)
    pin_hash = models.CharField(
        max_length=64,
        blank=True,
        help_text="SHA-256 hash of the student's 4-6 digit PIN",
    )

    class Meta:
        db_table = "student_profiles"

    def __str__(self):
        return f"Student: {self.user.full_name}"


class ParentProfile(AuditModel):
    """Extended profile for parent users — supports multiple children."""

    class Relationship(models.TextChoices):
        FATHER = "FATHER", "Father"
        MOTHER = "MOTHER", "Mother"
        GUARDIAN = "GUARDIAN", "Guardian"

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="parent_profile",
    )
    children = models.ManyToManyField(
        StudentProfile,
        related_name="parents",
        blank=True,
    )
    relationship = models.CharField(
        max_length=10,
        choices=Relationship.choices,
        blank=True,
    )

    class Meta:
        db_table = "parent_profiles"

    def __str__(self):
        return f"Parent: {self.user.full_name}"


class TeacherProfile(AuditModel):
    """Extended profile for teacher users."""

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="teacher_profile",
    )
    section = models.ForeignKey(
        "schools.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="teachers",
    )
    specialization = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "teacher_profiles"

    def __str__(self):
        return f"Teacher: {self.user.full_name}"


# ---------------------------------------------------------------------------
# Subjects & Assignments
# ---------------------------------------------------------------------------


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

    class Meta:
        db_table = "subjects"
        ordering = ["name"]

    def __str__(self):
        return self.name


class TeacherAssignment(TenantModel):
    """Assigns a teacher to a subject in a class."""

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="teaching_assignments",
        limit_choices_to={"role": "TEACHER"},
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="assignments"
    )
    assigned_class = models.ForeignKey(
        Class, on_delete=models.CASCADE, related_name="teacher_assignments"
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="teacher_assignments",
    )

    class Meta:
        db_table = "teacher_assignments"
        unique_together = ("teacher", "subject", "assigned_class", "academic_year")

    def __str__(self):
        return (
            f"{self.teacher.full_name} → {self.subject.name} "
            f"({self.assigned_class.name})"
        )


# ---------------------------------------------------------------------------
# Schedule
# ---------------------------------------------------------------------------


class ScheduleSlot(TenantModel):
    """A specific time slot in the weekly schedule."""

    DAY_CHOICES = [
        (0, "Sunday"),
        (1, "Monday"),
        (2, "Tuesday"),
        (3, "Wednesday"),
        (4, "Thursday"),
    ]

    assigned_class = models.ForeignKey(
        Class, on_delete=models.CASCADE, related_name="schedule_slots"
    )
    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="schedule_slots"
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="schedule_slots",
        limit_choices_to={"role": "TEACHER"},
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
        return (
            f"{self.get_day_of_week_display()} "
            f"{self.start_time}-{self.end_time}: {self.subject.name}"
        )


# ---------------------------------------------------------------------------
# Lessons & Resources
# ---------------------------------------------------------------------------


class Lesson(TenantModel):
    """A lesson/chapter in a subject for a specific class."""

    subject = models.ForeignKey(
        Subject, on_delete=models.CASCADE, related_name="lessons"
    )
    assigned_class = models.ForeignKey(
        Class, on_delete=models.CASCADE, related_name="lessons"
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="lessons",
        limit_choices_to={"role": "TEACHER"},
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
    """Educational resource (PDF, video link, document) attached to a lesson."""

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
    assigned_class = models.ForeignKey(
        Class, on_delete=models.CASCADE, related_name="resources"
    )
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="uploaded_resources",
        limit_choices_to={"role": "TEACHER"},
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
