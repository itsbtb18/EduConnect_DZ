"""
Academics models — Algerian private-school hierarchy.

╔═══════════════════════════════════════════════════════════════════╗
║  Hierarchy :  School → Section (cycle) → Level → Stream → Class ║
║  Subjects  :  Subject (catalog) → LevelSubject (config)         ║
║  People    :  StudentProfile · ParentProfile · TeacherProfile    ║
║  Assign    :  TeacherAssignment (teacher × class × subject)      ║
║  Schedule  :  ScheduleSlot · Lesson · Resource · Timetable       ║
╚═══════════════════════════════════════════════════════════════════╝

Algerian educational system:
  Primaire  : Préparatoire, 1AP–5AP          → /10, seuil 5/10
  Moyen     : 1AM–4AM                        → /20, seuil 10/20
  Lycée     : 1AS (tronc commun), 2AS, 3AS   → /20, seuil 10/20

  Filières (2AS/3AS):
    Sciences Expérimentales · Mathématiques · Technique Mathématiques
    Lettres et Philosophie · Langues Étrangères · Gestion et Économie
"""

from django.db import models

from core.models import AuditModel, TenantModel


# ═══════════════════════════════════════════════════════════════════════════
# 1. HIERARCHY — Level  →  Stream
# ═══════════════════════════════════════════════════════════════════════════


class Level(TenantModel):
    """
    A grade level within a section (cycle).

    Examples
    --------
    Primaire : Préparatoire (order=0), 1AP (1), 2AP (2), 3AP (3), 4AP (4), 5AP (5)
    Moyen    : 1AM (1), 2AM (2), 3AM (3), 4AM (4)
    Lycée    : 1AS (1), 2AS (2), 3AS (3)
    """

    section = models.ForeignKey(
        "schools.Section",
        on_delete=models.CASCADE,
        related_name="levels",
    )
    name = models.CharField(
        max_length=100,
        help_text="e.g. 1ère Année Primaire",
    )
    code = models.CharField(
        max_length=10,
        help_text="e.g. PREP, 1AP, 2AM, 3AS",
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Sort order within the section",
    )
    max_grade = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=20,
        help_text="Maximum grade: 10 for primaire, 20 for moyen/lycée",
    )
    passing_grade = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=10,
        help_text="Passing threshold: 5 for primaire, 10 for moyen/lycée",
    )
    has_streams = models.BooleanField(
        default=False,
        help_text="True for lycée levels that have filières",
    )

    class Meta:
        db_table = "levels"
        ordering = ["section", "order"]
        unique_together = ("school", "code")

    def __str__(self):
        return f"{self.code} — {self.name}"


class Stream(TenantModel):
    """
    A filière / stream within a lycée level.

    1AS troncs communs:
        Sciences et Technologies | Lettres

    2AS / 3AS filières:
        Sciences Expérimentales | Mathématiques | Technique Mathématiques
        Lettres et Philosophie  | Langues Étrangères | Gestion et Économie
    """

    level = models.ForeignKey(
        Level,
        on_delete=models.CASCADE,
        related_name="streams",
    )
    name = models.CharField(
        max_length=100,
        help_text="e.g. Sciences Expérimentales",
    )
    code = models.CharField(
        max_length=20,
        help_text="e.g. SCI, MATH, LPH",
    )
    short_name = models.CharField(
        max_length=30,
        blank=True,
        help_text="Abbreviated name for UI, e.g. Sciences",
    )
    is_tronc_commun = models.BooleanField(
        default=False,
        help_text="True for 1AS tronc commun streams",
    )
    is_custom = models.BooleanField(
        default=False,
        help_text="True for admin-created custom streams/groups",
    )
    color = models.CharField(
        max_length=7,
        default="#3b82f6",
        blank=True,
        help_text="Hex color for UI display",
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "streams"
        ordering = ["level", "order"]
        unique_together = ("school", "level", "code")

    def __str__(self):
        return f"{self.level.code} — {self.name}"


# ═══════════════════════════════════════════════════════════════════════════
# 2. SUBJECT CATALOG  &  PER-LEVEL CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════


class Subject(TenantModel):
    """
    School-scoped master catalog of subjects.

    This is the *template* — the actual coefficient per level / stream
    is defined in ``LevelSubject``.
    """

    name = models.CharField(max_length=100, help_text="e.g. Mathématiques")
    arabic_name = models.CharField(max_length=100, blank=True)
    code = models.CharField(max_length=20, blank=True, help_text="e.g. MATH")
    color = models.CharField(
        max_length=7,
        default="#2196F3",
        help_text="Hex color for UI",
    )
    icon = models.CharField(max_length=50, blank=True, help_text="Icon identifier")
    is_custom = models.BooleanField(
        default=False,
        help_text="True for admin-created subjects (not from MEN curriculum)",
    )

    class Meta:
        db_table = "subjects"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "code"],
                name="unique_subject_code_per_school",
            ),
        ]

    def __str__(self):
        return self.name


# Convenience alias
SubjectTemplate = Subject


class LevelSubject(TenantModel):
    """
    Configures which subjects apply at a given level (+optional stream)
    together with their coefficient and weekly hours.

    Rules
    -----
    • Primaire / Moyen : ``stream`` is NULL → applies to every classroom
      at this level.
    • Lycée : ``stream`` is set → subject + coefficient is filière-specific.

    The school admin configures this — it may differ between schools.
    """

    level = models.ForeignKey(
        Level,
        on_delete=models.CASCADE,
        related_name="level_subjects",
    )
    stream = models.ForeignKey(
        Stream,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="stream_subjects",
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="level_assignments",
    )
    coefficient = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1,
        help_text="Coefficient for weighted-average calculation",
    )
    is_mandatory = models.BooleanField(default=True)
    weekly_hours = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Hours per week",
    )

    class Meta:
        db_table = "level_subjects"
        ordering = ["level", "stream", "-coefficient"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "level", "stream", "subject"],
                name="unique_level_stream_subject",
                condition=models.Q(stream__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["school", "level", "subject"],
                name="unique_level_subject_no_stream",
                condition=models.Q(stream__isnull=True),
            ),
        ]

    def __str__(self):
        stream_str = ""
        if self.stream:
            stream_str = f" ({self.stream.short_name or self.stream.name})"
        return (
            f"{self.level.code}{stream_str} — {self.subject.name} (×{self.coefficient})"
        )


# ═══════════════════════════════════════════════════════════════════════════
# 3. CLASSROOM  (was flat Class w/ CharFields → now uses FK to Level/Stream)
# ═══════════════════════════════════════════════════════════════════════════


class Class(TenantModel):
    """
    A classroom group within a level, optional stream, and academic year.

    Example names: ``1AP-A``, ``3AM-B``, ``2AS-Sciences-A``.
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
    level = models.ForeignKey(
        Level,
        on_delete=models.CASCADE,
        related_name="classes",
    )
    stream = models.ForeignKey(
        Stream,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="classes",
    )
    name = models.CharField(max_length=50, help_text="e.g. 1AM-A")
    homeroom_teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="homeroom_classes",
    )
    capacity = models.PositiveIntegerField(default=35)

    class Meta:
        db_table = "classrooms"
        ordering = ["level__order", "name"]
        verbose_name_plural = "classes"

    def __str__(self):
        return self.name

    @property
    def max_students(self):
        """Backward-compat alias for ``capacity``."""
        return self.capacity


# Alias — conftest / external code may use "Classroom"
Classroom = Class


# ═══════════════════════════════════════════════════════════════════════════
# 4. PROFILES
# ═══════════════════════════════════════════════════════════════════════════


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


# ═══════════════════════════════════════════════════════════════════════════
# 5. TEACHER ASSIGNMENT
# ═══════════════════════════════════════════════════════════════════════════


class TeacherAssignment(TenantModel):
    """Assigns a teacher to teach a subject in a specific classroom."""

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="teaching_assignments",
        limit_choices_to={"role": "TEACHER"},
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="assignments",
    )
    assigned_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="teacher_assignments",
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


# ═══════════════════════════════════════════════════════════════════════════
# 6. SCHEDULE
# ═══════════════════════════════════════════════════════════════════════════


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
        Class,
        on_delete=models.CASCADE,
        related_name="schedule_slots",
    )
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="schedule_slots",
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
        max_length=50,
        blank=True,
        help_text="Physical room name",
    )

    class Meta:
        db_table = "schedule_slots"
        ordering = ["day_of_week", "start_time"]

    def __str__(self):
        return (
            f"{self.get_day_of_week_display()} "
            f"{self.start_time}-{self.end_time}: {self.subject.name}"
        )


# ═══════════════════════════════════════════════════════════════════════════
# 7. LESSONS & RESOURCES
# ═══════════════════════════════════════════════════════════════════════════


class Lesson(TenantModel):
    """A lesson/chapter in a subject for a specific class."""

    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="lessons",
    )
    assigned_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="lessons",
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
        Subject,
        on_delete=models.CASCADE,
        related_name="resources",
    )
    assigned_class = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="resources",
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


# ═══════════════════════════════════════════════════════════════════════════
# 8. TIMETABLE (image-based)
# ═══════════════════════════════════════════════════════════════════════════


def timetable_upload_path(instance, filename):
    """Upload timetable images to media/timetables/<school_id>/<filename>."""
    return f"timetables/{instance.school_id}/{filename}"


class Timetable(TenantModel):
    """
    A simple image-based timetable attached to a class.
    Admins upload a PNG/JPG/PDF image of the schedule.
    """

    class_group = models.ForeignKey(
        Class,
        on_delete=models.CASCADE,
        related_name="timetables",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="timetables",
    )
    title = models.CharField(
        max_length=255,
        help_text='e.g. "Emploi du temps — 1er Trimestre"',
    )
    image = models.ImageField(
        upload_to=timetable_upload_path,
        help_text="PNG, JPG, JPEG or PDF — max 10 MB",
    )
    uploaded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_timetables",
    )

    class Meta:
        db_table = "timetables"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.class_group.name})"
