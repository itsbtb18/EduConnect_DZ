"""
E-Learning models — digital resources, exam bank, quizzes, and student progress.
"""

import uuid

from django.db import models
from django.utils import timezone

from core.models import TenantModel


# ── Digital Resource ──────────────────────────────────────────────────────────


class DigitalResource(TenantModel):
    """Uploaded or linked educational resource (PDF, video, summary, etc.)."""

    class ResourceType(models.TextChoices):
        PDF = "PDF", "PDF"
        VIDEO = "VIDEO", "Vidéo"
        COURSE = "COURSE", "Cours"
        SUMMARY = "SUMMARY", "Résumé"
        EXERCISE = "EXERCISE", "Exercice"
        OTHER = "OTHER", "Autre"

    class Scope(models.TextChoices):
        GLOBAL = "GLOBAL", "ILMI Global"
        SCHOOL = "SCHOOL", "École"

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    resource_type = models.CharField(
        max_length=10, choices=ResourceType.choices, default=ResourceType.PDF
    )
    scope = models.CharField(max_length=10, choices=Scope.choices, default=Scope.SCHOOL)

    # Academic placement
    section = models.ForeignKey(
        "schools.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="elearning_resources",
    )
    level = models.ForeignKey(
        "academics.Level",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="elearning_resources",
    )
    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="elearning_resources",
    )
    chapter = models.CharField(max_length=255, blank=True, default="")

    # Content
    file = models.FileField(upload_to="elearning/resources/", blank=True, null=True)
    external_url = models.URLField(blank=True, default="")
    tags = models.JSONField(default=list, blank=True)

    # Statistics
    download_count = models.PositiveIntegerField(default=0)
    view_count = models.PositiveIntegerField(default=0)

    # Favourites (students)
    favourited_by = models.ManyToManyField(
        "accounts.User",
        blank=True,
        related_name="favourite_resources",
    )

    class Meta:
        db_table = "elearning_resources"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


# ── Exam Bank ─────────────────────────────────────────────────────────────────


class ExamBank(TenantModel):
    """Past exams, exercises, and model answers for download."""

    class ExamType(models.TextChoices):
        BEP = "BEP", "BEP"
        BEM = "BEM", "BEM"
        BAC = "BAC", "BAC"
        EXERCISE = "EXERCISE", "Exercice"
        HOMEWORK = "HOMEWORK", "Devoir"
        MOCK_EXAM = "MOCK_EXAM", "Examen blanc"

    title = models.CharField(max_length=255)
    exam_type = models.CharField(
        max_length=12, choices=ExamType.choices, default=ExamType.EXERCISE
    )
    level = models.ForeignKey(
        "academics.Level",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_bank_items",
    )
    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_bank_items",
    )
    year = models.PositiveIntegerField(
        null=True, blank=True, help_text="Année de l'examen"
    )
    description = models.TextField(blank=True, default="")

    # Files
    file = models.FileField(upload_to="elearning/exams/")
    solution_file = models.FileField(
        upload_to="elearning/exams/solutions/", blank=True, null=True
    )
    solution_visible = models.BooleanField(
        default=False, help_text="Solution visible directement (sinon après tentative)"
    )

    download_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "elearning_exam_bank"
        ordering = ["-year", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.get_exam_type_display()})"


# ── Quiz ──────────────────────────────────────────────────────────────────────


class Quiz(TenantModel):
    """A quiz created by a teacher, assignable to one or more classrooms."""

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes",
    )
    level = models.ForeignKey(
        "academics.Level",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="quizzes",
    )
    chapter = models.CharField(max_length=255, blank=True, default="")
    duration_minutes = models.PositiveIntegerField(
        default=30, help_text="Durée en minutes (compte à rebours)"
    )

    # Authoring
    created_by_teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_quizzes",
        limit_choices_to={"role": "TEACHER"},
    )

    # Assignment
    assigned_classrooms = models.ManyToManyField(
        "academics.Class",
        blank=True,
        related_name="assigned_quizzes",
    )

    # Options
    allow_retake = models.BooleanField(default=False)
    show_correction_immediately = models.BooleanField(
        default=True,
        help_text="Afficher les corrections immédiatement ou après clôture",
    )
    is_published = models.BooleanField(default=False)
    closes_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "elearning_quizzes"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    @property
    def total_points(self):
        return self.questions.aggregate(s=models.Sum("points"))["s"] or 0

    @property
    def question_count(self):
        return self.questions.count()

    @property
    def is_closed(self):
        if self.closes_at and timezone.now() > self.closes_at:
            return True
        return False


class QuizQuestion(TenantModel):
    """A question inside a quiz."""

    class QuestionType(models.TextChoices):
        MCQ = "MCQ", "QCM"
        TRUE_FALSE = "TRUE_FALSE", "Vrai / Faux"
        FREE_TEXT = "FREE_TEXT", "Texte libre"

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    order = models.PositiveIntegerField(default=0)
    question_type = models.CharField(
        max_length=12, choices=QuestionType.choices, default=QuestionType.MCQ
    )
    text = models.TextField(help_text="Énoncé de la question")
    options = models.JSONField(
        default=list,
        blank=True,
        help_text='Liste d\'options pour QCM, ex: ["opt A","opt B","opt C","opt D"]',
    )
    correct_answer = models.JSONField(
        help_text="Réponse correcte (index pour QCM, true/false, ou texte)"
    )
    points = models.PositiveIntegerField(default=1)
    explanation = models.TextField(
        blank=True, default="", help_text="Explication affichée après correction"
    )

    class Meta:
        db_table = "elearning_quiz_questions"
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"Q{self.order} – {self.quiz.title}"


# ── Quiz Attempt ──────────────────────────────────────────────────────────────


class QuizAttempt(TenantModel):
    """A student's attempt at a quiz."""

    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="quiz_attempts",
        limit_choices_to={"role": "STUDENT"},
    )
    started_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True, blank=True)
    score = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_points = models.PositiveIntegerField(default=0)
    answers = models.JSONField(
        default=dict,
        help_text='{"question_id": {"answer": ..., "is_correct": bool, "points_earned": int}}',
    )
    passed = models.BooleanField(default=False)

    class Meta:
        db_table = "elearning_quiz_attempts"
        ordering = ["-started_at"]

    def __str__(self):
        return f"{self.student} – {self.quiz.title} ({self.score}/{self.total_points})"


# ── Student Progress ──────────────────────────────────────────────────────────


class StudentProgress(TenantModel):
    """Tracks a student's overall progression per subject."""

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="elearning_progress",
        limit_choices_to={"role": "STUDENT"},
    )
    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.CASCADE,
        related_name="student_progress",
    )
    completion_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Pourcentage du programme couvert",
    )
    strengths = models.JSONField(
        default=list, blank=True, help_text="Chapitres/domaines maîtrisés"
    )
    weaknesses = models.JSONField(
        default=list, blank=True, help_text="Chapitres/domaines à travailler"
    )
    recommended_resources = models.ManyToManyField(
        DigitalResource, blank=True, related_name="recommended_for"
    )
    quiz_average = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Moyenne des quiz pour cette matière",
    )
    total_resources_viewed = models.PositiveIntegerField(default=0)
    total_quizzes_taken = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "elearning_student_progress"
        unique_together = ("student", "subject", "school")
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.student} – {self.subject} ({self.completion_percentage}%)"
