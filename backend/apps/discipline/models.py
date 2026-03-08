"""
Discipline models — incidents, sanctions, behavior reports, conduct grades.
"""

from django.db import models
from django.utils import timezone

from core.models import TenantModel


class Incident(TenantModel):
    """A disciplinary incident involving a student."""

    class Severity(models.TextChoices):
        POSITIVE = "POSITIVE", "Bon comportement"
        WARNING = "WARNING", "Avertissement"
        SERIOUS = "SERIOUS", "Grave"

    class Status(models.TextChoices):
        REPORTED = "REPORTED", "Signalé"
        UNDER_REVIEW = "UNDER_REVIEW", "En cours"
        VALIDATED = "VALIDATED", "Validé"
        RESOLVED = "RESOLVED", "Résolu"
        DISMISSED = "DISMISSED", "Classé"

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="discipline_incidents",
    )
    reported_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="reported_incidents",
    )
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    severity = models.CharField(
        max_length=10, choices=Severity.choices, default=Severity.WARNING
    )
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.REPORTED
    )
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    location = models.CharField(max_length=200, blank=True)
    witnesses = models.TextField(blank=True, help_text="Noms séparés par des virgules")
    immediate_action = models.TextField(
        blank=True, help_text="Action immédiate prise sur place"
    )

    # Workflow
    validated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validated_incidents",
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    parent_notified = models.BooleanField(default=False)
    parent_notified_at = models.DateTimeField(null=True, blank=True)
    resolution_note = models.TextField(blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "discipline_incidents"
        ordering = ["-date", "-time"]

    def __str__(self):
        return f"{self.student} — {self.title}"


class Sanction(TenantModel):
    """A sanction applied to a student following an incident."""

    class SanctionType(models.TextChoices):
        VERBAL_WARNING = "VERBAL_WARNING", "Avertissement oral"
        WRITTEN_WARNING = "WRITTEN_WARNING", "Avertissement écrit"
        DETENTION = "DETENTION", "Retenue"
        SUSPENSION = "SUSPENSION", "Exclusion temporaire"
        EXPULSION = "EXPULSION", "Exclusion définitive"
        COMMUNITY_SERVICE = "COMMUNITY_SERVICE", "Travail d'intérêt général"
        OTHER = "OTHER", "Autre"

    incident = models.ForeignKey(
        Incident, on_delete=models.CASCADE, related_name="sanctions"
    )
    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="discipline_sanctions",
    )
    sanction_type = models.CharField(
        max_length=20, choices=SanctionType.choices, default=SanctionType.VERBAL_WARNING
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    decision = models.TextField(blank=True)
    decided_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="decided_sanctions",
    )
    parent_notified = models.BooleanField(default=False)

    class Meta:
        db_table = "discipline_sanctions"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.student} — {self.get_sanction_type_display()}"


class BehaviorReport(TenantModel):
    """Periodic behavior assessment for a student (trimester conduct grade)."""

    class Rating(models.TextChoices):
        EXCELLENT = "EXCELLENT", "Excellent"
        GOOD = "GOOD", "Bien"
        AVERAGE = "AVERAGE", "Moyen"
        POOR = "POOR", "Insuffisant"

    student = models.ForeignKey(
        "academics.StudentProfile",
        on_delete=models.CASCADE,
        related_name="behavior_reports",
    )
    period = models.CharField(max_length=50, help_text="ex: Trimestre 1")
    rating = models.CharField(
        max_length=10, choices=Rating.choices, default=Rating.GOOD
    )
    conduct_score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
        help_text="Note de conduite optionnelle sur 5",
    )
    comments = models.TextField(blank=True)
    reported_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="authored_behavior_reports",
    )

    class Meta:
        db_table = "discipline_behavior_reports"
        ordering = ["-created_at"]
        unique_together = ["student", "period", "school"]

    def __str__(self):
        return f"{self.student} — {self.period} — {self.get_rating_display()}"


class WarningThreshold(TenantModel):
    """Per-school configurable warning threshold for alerts."""

    trimester = models.CharField(max_length=50, help_text="ex: Trimestre 1")
    max_warnings = models.PositiveIntegerField(
        default=3, help_text="Nombre max d'avertissements avant alerte"
    )

    class Meta:
        db_table = "discipline_warning_thresholds"
        unique_together = ["school", "trimester"]

    def __str__(self):
        return f"{self.school} — {self.trimester} — max {self.max_warnings}"
