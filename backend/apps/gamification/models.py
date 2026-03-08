"""
Gamification models – points, badges, levels, weekly challenges.
Designed for primary school students (cycle PRIMARY).
"""

from django.db import models
from core.models import TenantModel


class GamificationProfile(TenantModel):
    """Per-student gamification state."""

    student = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="gamification_profile",
    )
    total_points = models.PositiveIntegerField(default=0)
    level = models.CharField(
        max_length=20,
        choices=[
            ("DEBUTANT", "Débutant"),
            ("EXPLORATEUR", "Explorateur"),
            ("CHAMPION", "Champion"),
            ("MAITRE", "Maître"),
            ("LEGENDE", "Légende"),
        ],
        default="DEBUTANT",
    )
    streak_days = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    LEVEL_THRESHOLDS = {
        "DEBUTANT": 0,
        "EXPLORATEUR": 200,
        "CHAMPION": 600,
        "MAITRE": 1500,
        "LEGENDE": 3000,
    }

    class Meta:
        ordering = ["-total_points"]

    def __str__(self):
        return f"{self.student.get_full_name()} — {self.total_points} pts"

    def add_points(self, amount, reason=""):
        """Add points and recalculate level."""
        self.total_points += amount
        # Determine new level
        new_level = "DEBUTANT"
        for lvl, threshold in sorted(
            self.LEVEL_THRESHOLDS.items(), key=lambda x: x[1], reverse=True
        ):
            if self.total_points >= threshold:
                new_level = lvl
                break
        self.level = new_level
        self.save(update_fields=["total_points", "level", "updated_at"])

        # Log the transaction
        PointTransaction.objects.create(
            school=self.school,
            profile=self,
            amount=amount,
            reason=reason,
        )


class PointTransaction(TenantModel):
    """Audit log of points earned/spent."""

    profile = models.ForeignKey(
        GamificationProfile,
        on_delete=models.CASCADE,
        related_name="transactions",
    )
    amount = models.IntegerField()  # positive = earned, negative = spent
    reason = models.CharField(max_length=200)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.profile.student}: {self.amount:+d} pts — {self.reason}"


class BadgeDefinition(TenantModel):
    """Template for a badge that students can earn."""

    class Category(models.TextChoices):
        ACADEMIC = "ACADEMIC", "Académique"
        ATTENDANCE = "ATTENDANCE", "Assiduité"
        BEHAVIOUR = "BEHAVIOUR", "Comportement"
        READING = "READING", "Lecture"
        QUIZ = "QUIZ", "Quiz"
        SPECIAL = "SPECIAL", "Spécial"

    name = models.CharField(max_length=100)
    name_ar = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default="star")  # emoji or icon name
    category = models.CharField(
        max_length=20, choices=Category.choices, default=Category.ACADEMIC
    )
    points_reward = models.PositiveIntegerField(default=50)
    criteria_type = models.CharField(
        max_length=30,
        choices=[
            ("ATTENDANCE_STREAK", "Jours consécutifs présent"),
            ("GRADE_ABOVE", "Note au-dessus d'un seuil"),
            ("HOMEWORK_ON_TIME", "Devoirs rendus à temps"),
            ("QUIZ_SCORE", "Score quiz au-dessus d'un seuil"),
            ("READING_COUNT", "Livres empruntés"),
            ("MANUAL", "Attribution manuelle"),
        ],
        default="MANUAL",
    )
    criteria_value = models.PositiveIntegerField(
        default=0, help_text="Threshold value for the criteria"
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return self.name


class Achievement(TenantModel):
    """A badge earned by a student."""

    profile = models.ForeignKey(
        GamificationProfile,
        on_delete=models.CASCADE,
        related_name="achievements",
    )
    badge = models.ForeignKey(
        BadgeDefinition,
        on_delete=models.CASCADE,
        related_name="achievements",
    )
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("profile", "badge")
        ordering = ["-earned_at"]

    def __str__(self):
        return f"{self.profile.student}: {self.badge.name}"


class WeeklyChallenge(TenantModel):
    """Weekly challenge for students to complete."""

    title = models.CharField(max_length=200)
    description = models.TextField()
    start_date = models.DateField()
    end_date = models.DateField()
    goal_type = models.CharField(
        max_length=30,
        choices=[
            ("ATTENDANCE", "Être présent X jours"),
            ("HOMEWORK", "Rendre X devoirs"),
            ("QUIZ", "Compléter X quiz"),
            ("READING", "Lire X pages/livres"),
            ("GRADE", "Obtenir une note >= X"),
        ],
    )
    goal_value = models.PositiveIntegerField()
    points_reward = models.PositiveIntegerField(default=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["-start_date"]

    def __str__(self):
        return self.title


class ChallengeParticipation(TenantModel):
    """Tracks student progress on a weekly challenge."""

    profile = models.ForeignKey(
        GamificationProfile,
        on_delete=models.CASCADE,
        related_name="challenge_participations",
    )
    challenge = models.ForeignKey(
        WeeklyChallenge,
        on_delete=models.CASCADE,
        related_name="participations",
    )
    current_progress = models.PositiveIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("profile", "challenge")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.profile.student}: {self.challenge.title} ({self.current_progress}/{self.challenge.goal_value})"


class ClassLeaderboard(TenantModel):
    """Cached leaderboard for a classroom (refreshed periodically)."""

    classroom = models.ForeignKey(
        "academics.Class",
        on_delete=models.CASCADE,
        related_name="leaderboards",
    )
    is_enabled = models.BooleanField(default=True)
    last_refreshed = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-last_refreshed"]

    def __str__(self):
        return f"Leaderboard: {self.classroom}"
