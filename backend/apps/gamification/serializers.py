from rest_framework import serializers

from .models import (
    Achievement,
    BadgeDefinition,
    ChallengeParticipation,
    GamificationProfile,
    PointTransaction,
    WeeklyChallenge,
)


class BadgeDefinitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BadgeDefinition
        fields = [
            "id",
            "name",
            "name_ar",
            "description",
            "icon",
            "category",
            "points_reward",
            "criteria_type",
            "criteria_value",
            "is_active",
        ]


class AchievementSerializer(serializers.ModelSerializer):
    badge_name = serializers.CharField(source="badge.name", read_only=True)
    badge_icon = serializers.CharField(source="badge.icon", read_only=True)
    badge_category = serializers.CharField(source="badge.category", read_only=True)
    badge_description = serializers.CharField(
        source="badge.description", read_only=True
    )
    points_reward = serializers.IntegerField(
        source="badge.points_reward", read_only=True
    )

    class Meta:
        model = Achievement
        fields = [
            "id",
            "badge",
            "badge_name",
            "badge_icon",
            "badge_category",
            "badge_description",
            "points_reward",
            "earned_at",
        ]


class PointTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointTransaction
        fields = ["id", "amount", "reason", "created_at"]


class GamificationProfileSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.get_full_name", read_only=True)
    achievements = AchievementSerializer(many=True, read_only=True)
    level_label = serializers.SerializerMethodField()
    next_level = serializers.SerializerMethodField()
    points_to_next = serializers.SerializerMethodField()

    class Meta:
        model = GamificationProfile
        fields = [
            "id",
            "student",
            "student_name",
            "total_points",
            "level",
            "level_label",
            "next_level",
            "points_to_next",
            "streak_days",
            "last_activity_date",
            "achievements",
        ]

    def get_level_label(self, obj):
        return obj.get_level_display()

    def get_next_level(self, obj):
        ordered = ["DEBUTANT", "EXPLORATEUR", "CHAMPION", "MAITRE", "LEGENDE"]
        idx = ordered.index(obj.level)
        if idx < len(ordered) - 1:
            return ordered[idx + 1]
        return None

    def get_points_to_next(self, obj):
        ordered = ["DEBUTANT", "EXPLORATEUR", "CHAMPION", "MAITRE", "LEGENDE"]
        idx = ordered.index(obj.level)
        if idx < len(ordered) - 1:
            next_threshold = GamificationProfile.LEVEL_THRESHOLDS[ordered[idx + 1]]
            return max(0, next_threshold - obj.total_points)
        return 0


class WeeklyChallengeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeeklyChallenge
        fields = [
            "id",
            "title",
            "description",
            "start_date",
            "end_date",
            "goal_type",
            "goal_value",
            "points_reward",
            "is_active",
        ]


class ChallengeParticipationSerializer(serializers.ModelSerializer):
    challenge = WeeklyChallengeSerializer(read_only=True)
    progress_percentage = serializers.SerializerMethodField()

    class Meta:
        model = ChallengeParticipation
        fields = [
            "id",
            "challenge",
            "current_progress",
            "is_completed",
            "completed_at",
            "progress_percentage",
        ]

    def get_progress_percentage(self, obj):
        if obj.challenge.goal_value == 0:
            return 100
        return min(100, int(obj.current_progress / obj.challenge.goal_value * 100))


class LeaderboardEntrySerializer(serializers.Serializer):
    """Serializer for leaderboard entries (not model-bound)."""

    rank = serializers.IntegerField()
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    total_points = serializers.IntegerField()
    level = serializers.CharField()
    badge_count = serializers.IntegerField()
