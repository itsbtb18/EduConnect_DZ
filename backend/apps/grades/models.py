"""
╔══════════════════════════════════════════════════════════════════════════╗
║  Grades — Complete grade management system for Algerian schools (ILMI) ║
║                                                                        ║
║  Models:                                                               ║
║    ExamType              Type d'examen par matière/classe/trimestre    ║
║    Grade                 Note d'un élève à un examen                   ║
║    SubjectAverage        Moyenne matière par trimestre                  ║
║    TrimesterAverage      Moyenne générale du trimestre + classements   ║
║    AnnualAverage         Moyenne annuelle                              ║
║    GradeAppeal           Recours d'un élève                            ║
║    ReportCardTemplate    Modèle de bulletin personnalisable            ║
║    ReportCard            Bulletin PDF généré                            ║
║                                                                        ║
║  Calcul:                                                               ║
║    moyenne_matière = Σ(score × percentage) / 100                       ║
║    moyenne_trimestre = Σ(moyenne_matière × coeff) / Σ(coeffs)          ║
║    moyenne_annuelle = (T1 + T2 + T3) / 3                              ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

import uuid

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models


# ═══════════════════════════════════════════════════════════════════════════
# 1. EXAM TYPE — defines exam structure per subject/class/trimester
# ═══════════════════════════════════════════════════════════════════════════


class ExamType(models.Model):
    """
    Définit les types d'examens pour une matière dans une classe.
    Ex: Examen 1 (60%), Examen 2 (20%), Contrôle Continu (20%)

    La somme des percentages pour un même (subject, classroom, academic_year,
    trimester) doit être exactement 100.  Vérifié dans clean() et serializer.
    """

    TRIMESTER_CHOICES = [
        (1, "Trimestre 1"),
        (2, "Trimestre 2"),
        (3, "Trimestre 3"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.CASCADE,
        related_name="exam_types",
    )
    classroom = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="exam_types",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="exam_types",
    )
    trimester = models.IntegerField(choices=TRIMESTER_CHOICES)

    name = models.CharField(
        max_length=100,
        help_text='Ex: "Examen 1", "Contrôle Continu", "Devoir Surveillé"',
    )
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Pourcentage de cet examen dans la moyenne (ex: 60.00)",
    )
    max_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=20,
        help_text="Barème de l'examen (/20, /10, etc.)",
    )

    # Audit
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_exam_types",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_types"
        ordering = ["trimester", "name"]
        verbose_name = "Type d'examen"
        verbose_name_plural = "Types d'examens"

    def __str__(self):
        return (
            f"{self.name} ({self.percentage}%) - {self.subject.name} T{self.trimester}"
        )

    def clean(self):
        """Validate that percentage is between 0 and 100 and max_score > 0."""
        if self.percentage is not None and (
            self.percentage < 0 or self.percentage > 100
        ):
            raise ValidationError(
                {"percentage": "Le pourcentage doit être entre 0 et 100."}
            )
        if self.max_score is not None and self.max_score <= 0:
            raise ValidationError({"max_score": "Le barème doit être supérieur à 0."})


# ═══════════════════════════════════════════════════════════════════════════
# 2. GRADE — individual exam score for a student
# ═══════════════════════════════════════════════════════════════════════════


class Grade(models.Model):
    """
    Note d'un élève pour un type d'examen spécifique.
    Si is_absent=True, le score est considéré comme 0 pour le calcul.

    Workflow: DRAFT → SUBMITTED → PUBLISHED / RETURNED
      - DRAFT: enseignant saisit la note (défaut)
      - SUBMITTED: enseignant soumet pour révision admin
      - PUBLISHED: admin approuve → visible aux élèves/parents + notification
      - RETURNED: admin rejette avec commentaire → renvoyé à l'enseignant
    """

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        SUBMITTED = "SUBMITTED", "Soumis"
        PUBLISHED = "PUBLISHED", "Publié"
        RETURNED = "RETURNED", "Retourné"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="grades",
    )
    exam_type = models.ForeignKey(
        ExamType,
        on_delete=models.CASCADE,
        related_name="grades",
    )

    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Note obtenue (null = pas encore saisie)",
    )
    is_absent = models.BooleanField(
        default=False,
        help_text="Absent = note comptée comme 0",
    )

    # ── Workflow status ─────────────────────────────────────────────────
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
        help_text="État du workflow (DRAFT → SUBMITTED → PUBLISHED / RETURNED)",
    )

    # Publication control (kept for backward compat, now derived from status)
    is_published = models.BooleanField(
        default=False,
        help_text="Publié aux élèves/parents",
    )
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="published_grades",
    )

    # ── Submission tracking ─────────────────────────────────────────────
    submitted_at = models.DateTimeField(null=True, blank=True)
    submitted_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="submitted_grades",
    )

    # ── Return (rejection) tracking ─────────────────────────────────────
    returned_at = models.DateTimeField(null=True, blank=True)
    returned_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="returned_grades",
    )
    admin_comment = models.TextField(
        blank=True,
        default="",
        help_text="Commentaire de l'admin lors du rejet",
    )

    # Audit
    entered_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="entered_grades",
        help_text="Enseignant ou admin ayant saisi la note",
    )
    entered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "student_grades"
        unique_together = ["student", "exam_type"]
        ordering = ["exam_type__trimester", "exam_type__name"]
        verbose_name = "Note"
        verbose_name_plural = "Notes"

    def __str__(self):
        val = "ABS" if self.is_absent else (self.score or "—")
        return (
            f"{self.student} — {self.exam_type.subject.name} "
            f"{self.exam_type.name}: {val}/{self.exam_type.max_score}"
        )

    def clean(self):
        """Validate score is within bounds."""
        if self.score is not None and self.exam_type_id:
            if self.score < 0:
                raise ValidationError({"score": "La note ne peut pas être négative."})
            if self.score > self.exam_type.max_score:
                raise ValidationError(
                    {
                        "score": f"La note ne peut pas dépasser {self.exam_type.max_score}."
                    }
                )

    @property
    def effective_score(self):
        """Return 0 if absent, else the score (or None if not entered)."""
        if self.is_absent:
            return 0
        return self.score


# ═══════════════════════════════════════════════════════════════════════════
# 3. SUBJECT AVERAGE — per student/subject/trimester
# ═══════════════════════════════════════════════════════════════════════════


class SubjectAverage(models.Model):
    """
    Moyenne calculée d'un élève pour une matière sur un trimestre.

    Formule: Σ(score_examen × percentage_examen) / 100
    Le résultat est ramené sur le barème du niveau (max_grade).

    Si manual_override est défini, il remplace calculated_average.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="subject_averages",
    )
    subject = models.ForeignKey(
        "academics.Subject",
        on_delete=models.CASCADE,
        related_name="subject_averages",
    )
    classroom = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="subject_averages",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="subject_averages",
    )
    trimester = models.IntegerField(
        choices=ExamType.TRIMESTER_CHOICES,
    )

    calculated_average = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Moyenne calculée automatiquement",
    )
    manual_override = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Moyenne saisie manuellement (remplace la calculée)",
    )

    # Publication (admin only)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="published_subject_avgs",
    )

    # Lock (prevents further edits)
    is_locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)
    locked_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="locked_subject_avgs",
    )

    last_calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subject_averages"
        unique_together = [
            "student",
            "subject",
            "classroom",
            "academic_year",
            "trimester",
        ]
        ordering = ["trimester", "subject__name"]
        verbose_name = "Moyenne matière"
        verbose_name_plural = "Moyennes matières"

    def __str__(self):
        avg = self.effective_average
        return f"{self.student} — {self.subject.name} T{self.trimester}: {avg or '—'}"

    @property
    def effective_average(self):
        """Return manual_override if set, else calculated_average."""
        if self.manual_override is not None:
            return self.manual_override
        return self.calculated_average


# ═══════════════════════════════════════════════════════════════════════════
# 4. TRIMESTER AVERAGE — general average + rankings
# ═══════════════════════════════════════════════════════════════════════════


class TrimesterAverage(models.Model):
    """
    Moyenne générale d'un élève sur un trimestre.

    Formule: Σ(moyenne_matière × coefficient) / Σ(coefficients)
    Classements calculés automatiquement par rang dans classe/filière/niveau/section.

    Appréciations:
        ≥16 Excellent | ≥14 Très Bien | ≥12 Bien |
        ≥10 Assez Bien | ≥8 Passable | <8 Insuffisant
    """

    APPRECIATION_THRESHOLDS = [
        (16, "Excellent"),
        (14, "Très Bien"),
        (12, "Bien"),
        (10, "Assez Bien"),
        (8, "Passable"),
        (0, "Insuffisant"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="trimester_averages",
    )
    classroom = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="trimester_averages",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="trimester_averages",
    )
    trimester = models.IntegerField(
        choices=ExamType.TRIMESTER_CHOICES,
    )

    calculated_average = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    manual_override = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Rankings (calculated automatically)
    rank_in_class = models.IntegerField(null=True, blank=True)
    rank_in_stream = models.IntegerField(
        null=True,
        blank=True,
        help_text="Rang dans la filière (lycée uniquement)",
    )
    rank_in_level = models.IntegerField(
        null=True,
        blank=True,
        help_text="Rang dans le niveau (ex: tous les 1AM)",
    )
    rank_in_section = models.IntegerField(
        null=True,
        blank=True,
        help_text="Rang dans la section (Primaire/CEM/Lycée)",
    )

    appreciation = models.CharField(max_length=20, blank=True)

    # Publication (admin only)
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="published_trim_avgs",
    )

    # Lock (directeur)
    is_locked = models.BooleanField(default=False)
    locked_at = models.DateTimeField(null=True, blank=True)
    locked_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="locked_trim_avgs",
    )

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "trimester_averages"
        unique_together = ["student", "classroom", "academic_year", "trimester"]
        ordering = ["trimester", "rank_in_class"]
        verbose_name = "Moyenne trimestrielle"
        verbose_name_plural = "Moyennes trimestrielles"

    def __str__(self):
        avg = self.effective_average
        return f"{self.student} — T{self.trimester}: {avg or '—'} (#{self.rank_in_class or '?'})"

    @property
    def effective_average(self):
        if self.manual_override is not None:
            return self.manual_override
        return self.calculated_average

    def compute_appreciation(self):
        """Calculate appreciation based on effective_average and /20 scale."""
        avg = self.effective_average
        if avg is None:
            self.appreciation = ""
            return
        from decimal import Decimal

        for threshold, label in self.APPRECIATION_THRESHOLDS:
            if avg >= Decimal(str(threshold)):
                self.appreciation = label
                return
        self.appreciation = "Insuffisant"


# ═══════════════════════════════════════════════════════════════════════════
# 5. ANNUAL AVERAGE — yearly average across 3 trimesters
# ═══════════════════════════════════════════════════════════════════════════


class AnnualAverage(models.Model):
    """
    Moyenne annuelle d'un élève = (T1 + T2 + T3) / 3

    Calculée automatiquement à partir des TrimesterAverage.
    """

    APPRECIATION_THRESHOLDS = TrimesterAverage.APPRECIATION_THRESHOLDS

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="annual_averages",
    )
    classroom = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="annual_averages",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="annual_averages",
    )

    calculated_average = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    manual_override = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    rank_in_class = models.IntegerField(null=True, blank=True)
    rank_in_level = models.IntegerField(null=True, blank=True)
    appreciation = models.CharField(max_length=20, blank=True)

    is_published = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "annual_averages"
        unique_together = ["student", "classroom", "academic_year"]
        ordering = ["rank_in_class"]
        verbose_name = "Moyenne annuelle"
        verbose_name_plural = "Moyennes annuelles"

    def __str__(self):
        avg = self.effective_average
        return f"{self.student} — Annuel: {avg or '—'} (#{self.rank_in_class or '?'})"

    @property
    def effective_average(self):
        if self.manual_override is not None:
            return self.manual_override
        return self.calculated_average

    def compute_appreciation(self):
        avg = self.effective_average
        if avg is None:
            self.appreciation = ""
            return
        from decimal import Decimal

        for threshold, label in self.APPRECIATION_THRESHOLDS:
            if avg >= Decimal(str(threshold)):
                self.appreciation = label
                return
        self.appreciation = "Insuffisant"


# ═══════════════════════════════════════════════════════════════════════════
# 6. GRADE APPEAL — student/parent recours
# ═══════════════════════════════════════════════════════════════════════════


class GradeAppeal(models.Model):
    """
    Recours d'un élève/parent sur une note ou une moyenne.
    Peut cibler :
      - une note d'examen (Grade)
      - une moyenne de matière (SubjectAverage)
      - une moyenne de trimestre (TrimesterAverage)
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        UNDER_REVIEW = "UNDER_REVIEW", "En cours de traitement"
        ACCEPTED = "ACCEPTED", "Accepté"
        REJECTED = "REJECTED", "Rejeté"

    class AppealType(models.TextChoices):
        EXAM_GRADE = "EXAM_GRADE", "Note d'examen"
        SUBJECT_AVERAGE = "SUBJECT_AVERAGE", "Moyenne de matière"
        TRIMESTER_AVERAGE = "TRIMESTER_AVERAGE", "Moyenne de trimestre"
        ANNUAL_AVERAGE = "ANNUAL_AVERAGE", "Moyenne annuelle"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="grade_appeals",
    )
    appeal_type = models.CharField(
        max_length=20,
        choices=AppealType.choices,
    )

    # Flexible reference depending on appeal_type
    grade = models.ForeignKey(
        Grade,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appeals",
    )
    subject_average = models.ForeignKey(
        SubjectAverage,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appeals",
    )
    trimester_average = models.ForeignKey(
        TrimesterAverage,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appeals",
    )

    reason = models.TextField(
        help_text="Raison du recours saisie par l'élève/parent",
    )
    student_comment = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )

    # Assignment
    assigned_to_teacher = models.ForeignKey(
        "academics.TeacherProfile",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="assigned_appeals",
        help_text="Pour notes/moyennes matière",
    )
    assigned_to_admin = models.BooleanField(
        default=False,
        help_text="Pour moyennes générales",
    )

    # Response
    response = models.TextField(blank=True)
    responded_by = models.ForeignKey(
        "accounts.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="appeal_responses",
    )
    responded_at = models.DateTimeField(null=True, blank=True)

    # Correction
    original_value = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    corrected_value = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "grade_appeals"
        ordering = ["-created_at"]
        verbose_name = "Recours"
        verbose_name_plural = "Recours"

    def __str__(self):
        return f"Recours {self.get_appeal_type_display()} — {self.student} ({self.get_status_display()})"


# ═══════════════════════════════════════════════════════════════════════════
# 7a. REPORT CARD TEMPLATE — customizable per-school bulletin layout
# ═══════════════════════════════════════════════════════════════════════════


class ReportCardTemplate(models.Model):
    """
    Modèle de bulletin personnalisable par école.
    Stocke la configuration visuelle (couleurs, logo, texte) et la structure
    des sections du bulletin en JSONField.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="report_card_templates",
    )
    name = models.CharField(
        max_length=200,
        help_text='Nom du modèle (ex: "Bulletin officiel 2024")',
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Modèle par défaut utilisé pour la génération automatique.",
    )

    # Visual customization
    logo_url = models.URLField(max_length=500, blank=True)
    primary_color = models.CharField(
        max_length=7,
        default="#1a5276",
        help_text="Couleur principale HEX (ex: #1a5276)",
    )
    secondary_color = models.CharField(
        max_length=7,
        default="#2ecc71",
        help_text="Couleur secondaire HEX",
    )
    header_text = models.TextField(
        blank=True,
        help_text="Texte d'en-tête (République Algérienne, etc.)",
    )
    footer_text = models.TextField(
        blank=True,
        help_text="Texte de pied de page",
    )
    show_school_logo = models.BooleanField(default=True)
    show_student_photo = models.BooleanField(default=True)
    show_appreciation = models.BooleanField(default=True)
    show_ranking = models.BooleanField(default=True)
    show_absence_count = models.BooleanField(default=True)

    # Signatures
    signatures = models.JSONField(
        default=list,
        blank=True,
        help_text='Liste des signatures: [{"title": "Le Directeur", "name": "M. X"}]',
    )

    # Section configuration — controls what appears and in what order
    sections_config = models.JSONField(
        default=list,
        blank=True,
        help_text=(
            'Configuration des sections: '
            '[{"key": "grades_table", "label": "Notes", "visible": true, "order": 1}, ...]'
        ),
    )

    # Grading display options
    show_coefficient = models.BooleanField(default=True)
    show_class_average = models.BooleanField(default=True)
    show_min_max = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "report_card_templates"
        ordering = ["-is_default", "-created_at"]
        verbose_name = "Modèle de bulletin"
        verbose_name_plural = "Modèles de bulletin"

    def __str__(self):
        return f"{self.name} — {self.school.name}"

    def save(self, *args, **kwargs):
        # Ensure only one default template per school
        if self.is_default:
            ReportCardTemplate.objects.filter(
                school=self.school, is_default=True
            ).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)


# ═══════════════════════════════════════════════════════════════════════════
# 7b. REPORT CARD — generated PDF bulletin
# ═══════════════════════════════════════════════════════════════════════════


class ReportCard(models.Model):
    """
    Stores a generated PDF report card (bulletin scolaire) for one student
    in a given trimester of an academic year.
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
        help_text="Class at the time the report was generated.",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="report_cards",
    )
    trimester = models.IntegerField(
        choices=ExamType.TRIMESTER_CHOICES,
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

    # Link to template used for generation
    template = models.ForeignKey(
        ReportCardTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="report_cards",
        help_text="Modèle de bulletin utilisé pour la génération.",
    )

    # Sent to parents flag
    sent_to_parents = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)

    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "report_cards"
        unique_together = ("student", "academic_year", "trimester")
        ordering = ["-created_at"]
        verbose_name = "Bulletin scolaire"
        verbose_name_plural = "Bulletins scolaires"

    def __str__(self):
        return (
            f"Bulletin: {self.student} — T{self.trimester} ({self.academic_year.name})"
        )


# ═══════════════════════════════════════════════════════════════════════════
# 8. GRADE AUDIT LOG — full history of every grade-related modification
# ═══════════════════════════════════════════════════════════════════════════


class GradeAuditLog(models.Model):
    """
    Journal d'audit pour toutes les opérations liées aux notes.
    Utilisé dans le panel recours pour voir l'historique complet.
    """

    class Action(models.TextChoices):
        GRADE_ENTERED = "GRADE_ENTERED", "Note saisie"
        GRADE_CORRECTED = "GRADE_CORRECTED", "Note corrigée"
        GRADE_SUBMITTED = "GRADE_SUBMITTED", "Notes soumises"
        GRADE_PUBLISHED = "GRADE_PUBLISHED", "Notes publiées"
        GRADE_RETURNED = "GRADE_RETURNED", "Notes retournées"
        GRADE_CSV_IMPORTED = "GRADE_CSV_IMPORTED", "Notes importées par CSV"
        AVERAGE_CALCULATED = "AVERAGE_CALCULATED", "Moyenne calculée"
        AVERAGE_OVERRIDDEN = "AVERAGE_OVERRIDDEN", "Moyenne modifiée manuellement"
        AVERAGE_PUBLISHED = "AVERAGE_PUBLISHED", "Moyenne publiée"
        TRIMESTER_LOCKED = "TRIMESTER_LOCKED", "Trimestre verrouillé"
        TRIMESTER_UNLOCKED = "TRIMESTER_UNLOCKED", "Trimestre déverrouillé"
        APPEAL_CREATED = "APPEAL_CREATED", "Recours créé"
        APPEAL_ACCEPTED = "APPEAL_ACCEPTED", "Recours accepté"
        APPEAL_REJECTED = "APPEAL_REJECTED", "Recours rejeté"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    action = models.CharField(max_length=30, choices=Action.choices)
    performed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="grade_audit_logs",
    )

    # Generic FK — points to any model (Grade, SubjectAverage, …)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        related_name="grade_audit_logs",
    )
    object_id = models.UUIDField()
    content_object = GenericForeignKey("content_type", "object_id")

    # Student for easy filtering
    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="grade_audit_logs",
    )

    # Snapshot values
    old_value = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    new_value = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    reason = models.TextField(blank=True)

    # Context fields
    subject_name = models.CharField(max_length=200, blank=True)
    exam_name = models.CharField(max_length=200, blank=True)
    trimester = models.IntegerField(null=True, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "grade_audit_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["student", "-created_at"]),
            models.Index(fields=["content_type", "object_id"]),
        ]
        verbose_name = "Journal d'audit notes"
        verbose_name_plural = "Journaux d'audit notes"

    def __str__(self):
        return f"{self.get_action_display()} — {self.performed_by} — {self.created_at:%d/%m/%Y %H:%M}"


# ═══════════════════════════════════════════════════════════════════════════
# 9. TRIMESTER CONFIG — per-school configurable weighting & rounding
# ═══════════════════════════════════════════════════════════════════════════


class TrimesterConfig(models.Model):
    """
    Configuration par école pour le calcul des moyennes trimestrielles.

    Permet de personnaliser :
    - La pondération des trimestres pour la moyenne annuelle
    - La précision des décimales
    - Le seuil de passage

    Si aucune config n'existe pour l'école, les valeurs par défaut
    s'appliquent (pondération égale 1/1/1, 2 décimales, seuil 10).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    school = models.OneToOneField(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="trimester_config",
    )

    # Trimester weights for annual average (default: equal 1/1/1)
    weight_t1 = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1,
        help_text="Pondération du trimestre 1",
    )
    weight_t2 = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1,
        help_text="Pondération du trimestre 2",
    )
    weight_t3 = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=1,
        help_text="Pondération du trimestre 3",
    )

    # Calculation precision
    decimal_places = models.PositiveSmallIntegerField(
        default=2,
        help_text="Nombre de décimales pour les moyennes (1 ou 2)",
    )

    # Pass threshold
    pass_threshold = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=10,
        help_text="Seuil de passage (défaut: 10/20)",
    )

    # Whether coefficient weighting uses LevelSubject.coefficient or custom
    use_level_subject_coefficients = models.BooleanField(
        default=True,
        help_text="Utiliser les coefficients de LevelSubject (défaut: oui)",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "trimester_configs"
        verbose_name = "Configuration trimestrielle"
        verbose_name_plural = "Configurations trimestrielles"

    def __str__(self):
        return f"TrimesterConfig — {self.school.name}"

    def get_weight(self, trimester: int):
        """Return the weight for a given trimester number (1-3)."""
        return {1: self.weight_t1, 2: self.weight_t2, 3: self.weight_t3}.get(
            trimester, 1
        )
