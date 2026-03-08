"""
Staff management views — CRUD, attendance, leave management.
"""

from datetime import date

from django.db.models import Count, Q, Sum
from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.viewsets import TenantAwareViewSet

from .models import StaffAttendance, StaffDocument, StaffLeave, StaffMember
from .serializers import (
    StaffAttendanceSerializer,
    StaffDocumentSerializer,
    StaffLeaveSerializer,
    StaffMemberCreateSerializer,
    StaffMemberSerializer,
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


class StaffMemberViewSet(TenantAwareViewSet):
    queryset = StaffMember.objects.select_related("user").all()
    serializer_class = StaffMemberSerializer

    def get_serializer_class(self):
        if self.action == "create":
            return StaffMemberCreateSerializer
        return StaffMemberSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("position"):
            qs = qs.filter(position=params["position"])
        if params.get("contract_type"):
            qs = qs.filter(contract_type=params["contract_type"])
        if params.get("is_active"):
            qs = qs.filter(is_active=params["is_active"].lower() == "true")
        if params.get("search"):
            q = params["search"]
            qs = qs.filter(
                Q(user__first_name__icontains=q)
                | Q(user__last_name__icontains=q)
                | Q(user__phone_number__icontains=q)
            )
        return qs


class StaffDocumentViewSet(TenantAwareViewSet):
    queryset = StaffDocument.objects.select_related("staff__user").all()
    serializer_class = StaffDocumentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        qs = super().get_queryset()
        staff_id = self.request.query_params.get("staff_id")
        if staff_id:
            qs = qs.filter(staff_id=staff_id)
        return qs


class StaffAttendanceViewSet(TenantAwareViewSet):
    queryset = StaffAttendance.objects.select_related("staff__user").all()
    serializer_class = StaffAttendanceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("staff_id"):
            qs = qs.filter(staff_id=params["staff_id"])
        if params.get("date_from"):
            qs = qs.filter(date__gte=params["date_from"])
        if params.get("date_to"):
            qs = qs.filter(date__lte=params["date_to"])
        if params.get("status"):
            qs = qs.filter(status=params["status"])
        return qs


class StaffLeaveViewSet(TenantAwareViewSet):
    queryset = StaffLeave.objects.select_related("staff__user", "approved_by").all()
    serializer_class = StaffLeaveSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if params.get("staff_id"):
            qs = qs.filter(staff_id=params["staff_id"])
        if params.get("status"):
            qs = qs.filter(status=params["status"])
        return qs


# ---------------------------------------------------------------------------
# Leave approval
# ---------------------------------------------------------------------------


class StaffLeaveApprovalView(APIView):
    """POST /staff/leaves/<pk>/approve/  or /reject/"""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk, action):
        user = request.user
        if not _is_admin(user):
            return Response(
                {"detail": "Permission refusée."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            leave = _school_qs(StaffLeave, user).get(pk=pk)
        except StaffLeave.DoesNotExist:
            return Response(
                {"detail": "Congé introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if action == "approve":
            leave.status = StaffLeave.LeaveStatus.APPROVED
            leave.approved_by = user
        elif action == "reject":
            leave.status = StaffLeave.LeaveStatus.REJECTED
            leave.approved_by = user
        else:
            return Response(
                {"detail": "Action inconnue."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        leave.save()
        return Response(StaffLeaveSerializer(leave).data)


# ---------------------------------------------------------------------------
# Dashboard stats
# ---------------------------------------------------------------------------


class StaffStatsView(APIView):
    """GET /staff/stats/ — summary statistics."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        members = _school_qs(StaffMember, user)

        total = members.count()
        active = members.filter(is_active=True).count()

        by_position = dict(
            members.values_list("position")
            .annotate(c=Count("id"))
            .values_list("position", "c")
        )

        today = date.today()
        att_today = _school_qs(StaffAttendance, user).filter(date=today)
        present_today = att_today.filter(
            status__in=[
                StaffAttendance.AttendanceStatus.PRESENT,
                StaffAttendance.AttendanceStatus.LATE,
            ]
        ).count()

        pending_leaves = (
            _school_qs(StaffLeave, user)
            .filter(status=StaffLeave.LeaveStatus.PENDING)
            .count()
        )

        return Response(
            {
                "total_staff": total,
                "active_staff": active,
                "by_position": by_position,
                "present_today": present_today,
                "pending_leaves": pending_leaves,
            }
        )
