from django.db.models import Sum, Count, Q
from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSchoolAdmin
from .models import FeeStructure, Payment
from .serializers import FeeStructureSerializer, PaymentSerializer


class FeeStructureViewSet(viewsets.ModelViewSet):
    serializer_class = FeeStructureSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return FeeStructure.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Payment.objects.filter(school=self.request.user.school)
        if self.request.user.role == "parent":
            children = self.request.user.parent_profile.children.all()
            qs = qs.filter(student__in=children)
        return qs

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class FinanceStatsView(APIView):
    """Aggregate financial statistics for the current school."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = Payment.objects.filter(school=request.user.school)
        agg = qs.aggregate(
            total_revenue=Sum("amount", filter=Q(status="Completed")) or 0,
            total_pending=Sum("amount", filter=Q(status="Pending")) or 0,
            total_payments=Count("id"),
            completed_count=Count("id", filter=Q(status="Completed")),
            pending_count=Count("id", filter=Q(status="Pending")),
            failed_count=Count("id", filter=Q(status="Failed")),
        )
        return Response(
            {
                "total_revenue": agg["total_revenue"] or 0,
                "total_pending": agg["total_pending"] or 0,
                "total_payments": agg["total_payments"],
                "completed_count": agg["completed_count"],
                "pending_count": agg["pending_count"],
                "failed_count": agg["failed_count"],
            }
        )
