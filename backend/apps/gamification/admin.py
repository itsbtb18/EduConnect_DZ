from django.contrib import admin

from .models import (
    Achievement,
    BadgeDefinition,
    ChallengeParticipation,
    GamificationProfile,
    PointTransaction,
    WeeklyChallenge,
    ClassLeaderboard,
)


@admin.register(GamificationProfile)
class GamificationProfileAdmin(admin.ModelAdmin):
    list_display = ("student", "total_points", "level", "streak_days", "school")
    list_filter = ("level", "school")
    search_fields = ("student__first_name", "student__last_name")


@admin.register(BadgeDefinition)
class BadgeDefinitionAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "points_reward", "criteria_type", "is_active")
    list_filter = ("category", "is_active", "school")


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ("profile", "badge", "earned_at")
    list_filter = ("badge__category",)


@admin.register(PointTransaction)
class PointTransactionAdmin(admin.ModelAdmin):
    list_display = ("profile", "amount", "reason", "created_at")


@admin.register(WeeklyChallenge)
class WeeklyChallengeAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "goal_type",
        "goal_value",
        "start_date",
        "end_date",
        "is_active",
    )
    list_filter = ("goal_type", "is_active")


@admin.register(ChallengeParticipation)
class ChallengeParticipationAdmin(admin.ModelAdmin):
    list_display = ("profile", "challenge", "current_progress", "is_completed")
    list_filter = ("is_completed",)


@admin.register(ClassLeaderboard)
class ClassLeaderboardAdmin(admin.ModelAdmin):
    list_display = ("classroom", "is_enabled", "last_refreshed")
