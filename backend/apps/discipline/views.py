"""
Discipline views — CRUD ViewSets + stats, workflow, warning counter.
"""

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import require_module
from core.viewsets import TenantAwareViewSet

from .models import BehaviorReport, Incident, Sanction, WarningThreshold
from .serializers import (
    BehaviorReportSerializer,
    ClassComparisonSerializer,
    IncidentCreateSerializer,
    IncidentSerializer,
    IncidentWorkflowSerializer,
    SanctionSerializer,
    WarningCountSerializer,
    WarningThresholdSerializer,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _school_qs(model, user, include_deleted=False):
    qs = model.objects.all()
    if not include_deleted and hasattr(model, "is_deleted"):
        qs = qs.filter(is_deleted=False)
    if user.role != "SUPER_ADMIN":
        qs = qs.filter(school=user.school)
    return qs


def _is_admin(user):
    return user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN")


# ---------------------------------------------------------------------------
# CRUD ViewSets
# ---------------------------------------------------------------------------


@require_module("pedagogique")
class IncidentViewSet(TenantAwareViewSet):
    queryset = Incident.objects.select_related(
        "student__user", "student__current_class", "reported_by"
    ).all()
    serializer_class = IncidentSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return IncidentCreateSerializer
        return IncidentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("severity"):
            qs = qs.filter(severity=params["severity"])
        if params.get("status"):
            qs = qs.filter(status=params["status"])
        if params.get("class_id"):
            qs = qs.filter(student__current_class_id=params["class_id"])
        if params.get("date_from"):
            qs = qs.filter(date__gte=params["date_from"])
        if params.get("date_to"):
            qs = qs.filter(date__lte=params["date_to"])
        if params.get("student_id"):
            qs = qs.filter(student_id=params["student_id"])
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        kwargs = {"reported_by": user}
        if user.role != "SUPER_ADMIN":
            kwargs["school"] = user.school
        kwargs["created_by"] = user
        serializer.save(**kwargs)


@require_module("pedagogique")
class SanctionViewSet(TenantAwareViewSet):
    queryset = Sanction.objects.select_related("student__user", "incident").all()
    serializer_class = SanctionSerializer


@require_module("pedagogique")
class BehaviorReportViewSet(TenantAwareViewSet):
    queryset = BehaviorReport.objects.select_related(
        "student__user", "reported_by"
    ).all()
    serializer_class = BehaviorReportSerializer


@require_module("pedagogique")
class WarningThresholdViewSet(TenantAwareViewSet):
    queryset = WarningThreshold.objects.all()
    serializer_class = WarningThresholdSerializer


# ---------------------------------------------------------------------------
# Incident workflow
# ---------------------------------------------------------------------------


class IncidentWorkflowView(APIView):
    """POST /discipline/incidents/<pk>/workflow/  {action, resolution_note?}"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        try:
            incident = _school_qs(Incident, user).get(pk=pk)
        except Incident.DoesNotExist:
            return Response(
                {"detail": "Incident introuvable."}, status=status.HTTP_404_NOT_FOUND
            )

        ser = IncidentWorkflowSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        action = ser.validated_data["action"]
        now = timezone.now()

        if action == "validate":
            if not _is_admin(user):
                return Response(
                    {"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN
                )
            incident.status = Incident.Status.VALIDATED
            incident.validated_by = user
            incident.validated_at = now
        elif action == "resolve":
            if not _is_admin(user):
                return Response(
                    {"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN
                )
            incident.status = Incident.Status.RESOLVED
            incident.resolution_note = ser.validated_data.get("resolution_note", "")
            incident.resolved_at = now
        elif action == "dismiss":
            if not _is_admin(user):
                return Response(
                    {"detail": "Permission refusée."}, status=status.HTTP_403_FORBIDDEN
                )
            incident.status = Incident.Status.DISMISSED
            incident.resolution_note = ser.validated_data.get("resolution_note", "")
            incident.resolved_at = now
        elif action == "notify_parent":
            incident.parent_notified = True
            incident.parent_notified_at = now
        else:
            return Response(
                {"detail": "Action inconnue."}, status=status.HTTP_400_BAD_REQUEST
            )

        incident.save()
        return Response(IncidentSerializer(incident).data)


# ---------------------------------------------------------------------------
# Dashboard stats
# ---------------------------------------------------------------------------


class DisciplineStatsView(APIView):
    """GET /discipline/stats/  — summary statistics."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = _school_qs(Incident, user)

        # Filters
        params = request.query_params
        if params.get("date_from"):
            qs = qs.filter(date__gte=params["date_from"])
        if params.get("date_to"):
            qs = qs.filter(date__lte=params["date_to"])

        total = qs.count()
        by_severity = dict(
            qs.values_list("severity")
            .annotate(c=Count("id"))
            .values_list("severity", "c")
        )
        by_status = dict(
            qs.values_list("status").annotate(c=Count("id")).values_list("status", "c")
        )
        pending = qs.filter(
            status__in=[Incident.Status.REPORTED, Incident.Status.UNDER_REVIEW]
        ).count()
        sanctions_total = _school_qs(Sanction, user).count()

        return Response(
            {
                "total_incidents": total,
                "by_severity": by_severity,
                "by_status": by_status,
                "pending": pending,
                "sanctions_total": sanctions_total,
            }
        )


# ---------------------------------------------------------------------------
# Warning counter
# ---------------------------------------------------------------------------


class WarningCounterView(APIView):
    """GET /discipline/warnings/?trimester=Trimestre+1"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        trimester = request.query_params.get("trimester", "")

        qs = _school_qs(Incident, user).filter(
            severity__in=[Incident.Severity.WARNING, Incident.Severity.SERIOUS],
        )
        if trimester:
            qs = qs.filter(
                date__gte=request.query_params.get("date_from", "2000-01-01")
            )

        counts = (
            qs.values(
                "student_id",
                "student__user__last_name",
                "student__user__first_name",
                "student__current_class__name",
            )
            .annotate(warning_count=Count("id"))
            .order_by("-warning_count")
        )

        # Threshold
        threshold_val = 3
        if user.school:
            th = WarningThreshold.objects.filter(
                school=user.school, trimester=trimester
            ).first()
            if th:
                threshold_val = th.max_warnings

        data = []
        for row in counts:
            wc = row["warning_count"]
            data.append(
                {
                    "student_id": row["student_id"],
                    "student_name": f"{row['student__user__last_name']} {row['student__user__first_name']}",
                    "class_name": row.get("student__current_class__name", ""),
                    "warning_count": wc,
                    "threshold": threshold_val,
                    "exceeded": wc >= threshold_val,
                }
            )

        return Response(data)


# ---------------------------------------------------------------------------
# Class comparison
# ---------------------------------------------------------------------------


class ClassComparisonView(APIView):
    """GET /discipline/class-comparison/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = _school_qs(Incident, user)
        params = request.query_params
        if params.get("date_from"):
            qs = qs.filter(date__gte=params["date_from"])
        if params.get("date_to"):
            qs = qs.filter(date__lte=params["date_to"])

        rows = (
            qs.values("student__current_class_id", "student__current_class__name")
            .annotate(
                total_incidents=Count("id"),
                positive=Count("id", filter=Q(severity=Incident.Severity.POSITIVE)),
                warnings=Count("id", filter=Q(severity=Incident.Severity.WARNING)),
                serious=Count("id", filter=Q(severity=Incident.Severity.SERIOUS)),
            )
            .order_by("-total_incidents")
        )

        data = [
            {
                "class_id": r["student__current_class_id"],
                "class_name": r["student__current_class__name"] or "",
                "total_incidents": r["total_incidents"],
                "positive": r["positive"],
                "warnings": r["warnings"],
                "serious": r["serious"],
            }
            for r in rows
        ]

        ser = ClassComparisonSerializer(data, many=True)
        return Response(ser.data)
