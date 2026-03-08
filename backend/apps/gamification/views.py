from django.db.models import Count
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from core.permissions import IsStudent, IsSchoolAdmin

from .models import (
    Achievement,
    BadgeDefinition,
    ChallengeParticipation,
    GamificationProfile,
    PointTransaction,
    WeeklyChallenge,
)
from .serializers import (
    AchievementSerializer,
    BadgeDefinitionSerializer,
    ChallengeParticipationSerializer,
    GamificationProfileSerializer,
    LeaderboardEntrySerializer,
    PointTransactionSerializer,
    WeeklyChallengeSerializer,
)


class GamificationViewSet(GenericViewSet):
    """Student-facing gamification endpoints."""

    permission_classes = [IsAuthenticated, IsStudent]

    def get_profile(self):
        profile, _ = GamificationProfile.objects.get_or_create(
            student=self.request.user,
            defaults={"school": self.request.user.school},
        )
        return profile

    @action(detail=False, methods=["get"], url_path="my-profile")
    def my_profile(self, request):
        """GET /gamification/my-profile/ — student's gamification state."""
        profile = self.get_profile()
        serializer = GamificationProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my-points")
    def my_points(self, request):
        """GET /gamification/my-points/ — point transaction history."""
        profile = self.get_profile()
        txns = PointTransaction.objects.filter(profile=profile)[:50]
        serializer = PointTransactionSerializer(txns, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="badges")
    def badges(self, request):
        """GET /gamification/badges/ — all available badge definitions."""
        qs = BadgeDefinition.objects.filter(school=request.user.school, is_active=True)
        serializer = BadgeDefinitionSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my-badges")
    def my_badges(self, request):
        """GET /gamification/my-badges/ — badges earned by student."""
        profile = self.get_profile()
        achievements = Achievement.objects.filter(profile=profile).select_related(
            "badge"
        )
        serializer = AchievementSerializer(achievements, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="challenges")
    def challenges(self, request):
        """GET /gamification/challenges/ — active weekly challenges."""
        from django.utils import timezone

        today = timezone.now().date()
        qs = WeeklyChallenge.objects.filter(
            school=request.user.school,
            is_active=True,
            start_date__lte=today,
            end_date__gte=today,
        )
        serializer = WeeklyChallengeSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my-challenges")
    def my_challenges(self, request):
        """GET /gamification/my-challenges/ — student's challenge participations."""
        profile = self.get_profile()
        participations = ChallengeParticipation.objects.filter(
            profile=profile
        ).select_related("challenge")
        serializer = ChallengeParticipationSerializer(participations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="join-challenge")
    def join_challenge(self, request):
        """POST /gamification/join-challenge/ — join an active challenge."""
        challenge_id = request.data.get("challenge_id")
        if not challenge_id:
            return Response(
                {"error": "challenge_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            challenge = WeeklyChallenge.objects.get(
                id=challenge_id, school=request.user.school, is_active=True
            )
        except WeeklyChallenge.DoesNotExist:
            return Response(
                {"error": "Challenge not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        profile = self.get_profile()
        participation, created = ChallengeParticipation.objects.get_or_create(
            profile=profile,
            challenge=challenge,
            defaults={"school": request.user.school},
        )
        if not created:
            return Response(
                {"error": "Already joined"},
                status=status.HTTP_409_CONFLICT,
            )
        serializer = ChallengeParticipationSerializer(participation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="leaderboard")
    def leaderboard(self, request):
        """GET /gamification/leaderboard/ — class leaderboard."""
        try:
            student_profile = request.user.student_profile
            classroom = student_profile.current_class
        except Exception:
            return Response([])

        if not classroom:
            return Response([])

        profiles = (
            GamificationProfile.objects.filter(
                school=request.user.school,
                student__student_profile__current_class=classroom,
            )
            .annotate(badge_count=Count("achievements"))
            .order_by("-total_points")[:20]
        )

        entries = []
        for rank, p in enumerate(profiles, 1):
            entries.append(
                {
                    "rank": rank,
                    "student_id": p.student_id,
                    "student_name": p.student.get_full_name(),
                    "total_points": p.total_points,
                    "level": p.level,
                    "badge_count": p.badge_count,
                }
            )

        serializer = LeaderboardEntrySerializer(entries, many=True)
        return Response(serializer.data)


class BadgeAdminViewSet(GenericViewSet):
    """Admin-facing badge/challenge management."""

    permission_classes = [IsAuthenticated, IsSchoolAdmin]
    serializer_class = BadgeDefinitionSerializer
    queryset = BadgeDefinition.objects.all()

    def list(self, request):
        qs = self.queryset.filter(school=request.user.school)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(school=request.user.school)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
