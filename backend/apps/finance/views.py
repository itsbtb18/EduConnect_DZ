"""
Finance (Payments) views — school-scoped.
"""

import csv
import datetime
import io
import logging

from django.db.models import Count, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsSchoolAdmin

from .models import FeeStructure, StudentPayment
from .serializers import (
    FeeStructureCreateSerializer,
    FeeStructureSerializer,
    StudentPaymentCreateSerializer,
    StudentPaymentSerializer,
)

logger = logging.getLogger(__name__)


# ── helpers ──────────────────────────────────────────────────────────────


def _refresh_statuses(school):
    """Bulk-refresh expired statuses for a school."""
    today = datetime.date.today()
    StudentPayment.objects.filter(
        school=school,
        period_end__lt=today,
        status=StudentPayment.Status.ACTIF,
    ).update(status=StudentPayment.Status.EXPIRE, updated_at=timezone.now())
    StudentPayment.objects.filter(
        school=school,
        period_end__gte=today,
        status=StudentPayment.Status.EXPIRE,
    ).update(status=StudentPayment.Status.ACTIF, updated_at=timezone.now())


def _base_payments_qs(school):
    return StudentPayment.objects.filter(
        school=school, is_deleted=False
    ).select_related(
        "student",
        "student__student_profile",
        "student__student_profile__current_class",
        "fee_structure",
        "recorded_by",
    )


def _apply_filters(qs, params):
    """Apply query-param filters to a payments queryset."""
    student = params.get("student")
    if student:
        qs = qs.filter(
            Q(student__first_name__icontains=student)
            | Q(student__last_name__icontains=student)
        )

    status_filter = params.get("status")
    if status_filter and status_filter != "all":
        qs = qs.filter(status=status_filter)

    payment_type = params.get("payment_type")
    if payment_type and payment_type != "all":
        qs = qs.filter(payment_type=payment_type)

    date_from = params.get("date_from")
    if date_from:
        qs = qs.filter(payment_date__gte=date_from)

    date_to = params.get("date_to")
    if date_to:
        qs = qs.filter(payment_date__lte=date_to)

    class_id = params.get("class")
    if class_id:
        qs = qs.filter(student__student_profile__current_class_id=class_id)

    return qs


# =========================================================================
# Fee Structure CRUD
# =========================================================================


class FeeStructureListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = (
            FeeStructure.objects.filter(school=request.user.school, is_deleted=False)
            .select_related("academic_year")
            .order_by("-created_at")
        )
        serializer = FeeStructureSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = FeeStructureCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(
            FeeStructureSerializer(obj).data, status=status.HTTP_201_CREATED
        )


class FeeStructureDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return FeeStructure.objects.get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except FeeStructure.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(FeeStructureSerializer(obj).data)

    def patch(self, request, pk):
        try:
            obj = self._get(request, pk)
        except FeeStructure.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = FeeStructureCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(FeeStructureSerializer(obj).data)

    def delete(self, request, pk):
        try:
            obj = self._get(request, pk)
        except FeeStructure.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# Student Payment CRUD
# =========================================================================


class PaymentListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        _refresh_statuses(school)

        qs = _base_payments_qs(school)
        qs = _apply_filters(qs, request.query_params)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        results = qs[start:end]

        serializer = StudentPaymentSerializer(results, many=True)
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )

    def post(self, request):
        serializer = StudentPaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(
            school=request.user.school,
            recorded_by=request.user,
        )
        return Response(
            StudentPaymentSerializer(obj).data, status=status.HTTP_201_CREATED
        )


class PaymentDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return StudentPayment.objects.select_related(
            "student",
            "student__student_profile",
            "student__student_profile__current_class",
            "fee_structure",
            "recorded_by",
        ).get(pk=pk, school=request.user.school, is_deleted=False)

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except StudentPayment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(StudentPaymentSerializer(obj).data)

    def patch(self, request, pk):
        try:
            obj = self._get(request, pk)
        except StudentPayment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = StudentPaymentCreateSerializer(
            obj, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        obj.refresh_from_db()
        return Response(StudentPaymentSerializer(obj).data)

    def delete(self, request, pk):
        try:
            obj = self._get(request, pk)
        except StudentPayment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# Stats
# =========================================================================


class PaymentStatsView(APIView):
    """Aggregate stats for the payments dashboard."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        _refresh_statuses(school)
        qs = StudentPayment.objects.filter(school=school, is_deleted=False)

        today = datetime.date.today()
        first_of_month = today.replace(day=1)
        first_of_year = today.replace(month=1, day=1)

        total_this_month = (
            qs.filter(payment_date__gte=first_of_month).aggregate(
                total=Sum("amount_paid")
            )["total"]
            or 0
        )
        total_this_year = (
            qs.filter(payment_date__gte=first_of_year).aggregate(
                total=Sum("amount_paid")
            )["total"]
            or 0
        )
        active_count = qs.filter(status="actif").count()
        expired_count = qs.filter(status="expire").count()

        # Students who have never paid: students in the school with no payment records
        from apps.accounts.models import User

        all_students_count = User.objects.filter(
            school=school, role="STUDENT", is_active=True
        ).count()
        students_with_payments = qs.values("student").distinct().count()
        never_paid_count = max(0, all_students_count - students_with_payments)

        # Expired students detail
        expired_payments = (
            qs.filter(status="expire")
            .select_related(
                "student",
                "student__student_profile",
                "student__student_profile__current_class",
            )
            .order_by("period_end")[:50]
        )
        expired_students = []
        for p in expired_payments:
            profile = getattr(p.student, "student_profile", None)
            cls = profile.current_class if profile else None
            expired_students.append(
                {
                    "student_id": str(p.student.id),
                    "student_name": p.student.full_name,
                    "class_name": cls.name if cls else None,
                    "period_end": p.period_end.isoformat(),
                    "days_overdue": (today - p.period_end).days,
                    "receipt_number": p.receipt_number,
                }
            )

        return Response(
            {
                "total_this_month": total_this_month,
                "total_this_year": total_this_year,
                "active_count": active_count,
                "expired_count": expired_count,
                "never_paid_count": never_paid_count,
                "expired_students": expired_students,
            }
        )


# =========================================================================
# Expiring Soon
# =========================================================================


class PaymentExpiringSoonView(APIView):
    """Students whose payment expires in the next 7 days."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        _refresh_statuses(school)

        today = datetime.date.today()
        cutoff = today + datetime.timedelta(days=7)

        qs = (
            _base_payments_qs(school)
            .filter(
                status="actif",
                period_end__gte=today,
                period_end__lte=cutoff,
            )
            .order_by("period_end")
        )

        data = []
        for p in qs:
            profile = getattr(p.student, "student_profile", None)
            cls = profile.current_class if profile else None
            data.append(
                {
                    "id": str(p.id),
                    "student_id": str(p.student.id),
                    "student_name": p.student.full_name,
                    "class_name": cls.name if cls else None,
                    "period_end": p.period_end.isoformat(),
                    "days_remaining": (p.period_end - today).days,
                    "receipt_number": p.receipt_number,
                }
            )

        return Response({"count": len(data), "results": data})


# =========================================================================
# Send Reminder
# =========================================================================


class PaymentSendReminderView(APIView):
    """Send a payment reminder notification to the parents of a student."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        try:
            payment = StudentPayment.objects.select_related("student").get(
                pk=pk, school=request.user.school, is_deleted=False
            )
        except StudentPayment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        student = payment.student
        # Create in-app notification for all parents
        from apps.notifications.models import Notification

        parent_profile = getattr(student, "student_profile", None)
        parents_notified = 0
        if parent_profile:
            # Find parents linked to this student
            from apps.academics.models import ParentProfile

            parent_profiles = ParentProfile.objects.filter(
                children=parent_profile
            ).select_related("user")
            for pp in parent_profiles:
                Notification.objects.create(
                    user=pp.user,
                    school=request.user.school,
                    title="Rappel de paiement",
                    body=(
                        f"Le paiement de {student.full_name} arrive à expiration "
                        f"le {payment.period_end.strftime('%d/%m/%Y')}. "
                        f"Montant: {payment.amount_paid} DA. "
                        f"Reçu N° {payment.receipt_number}."
                    ),
                    notification_type="PAYMENT",
                    related_object_id=payment.id,
                    related_object_type="StudentPayment",
                )
                parents_notified += 1

        # Also create notification for admin
        Notification.objects.create(
            user=request.user,
            school=request.user.school,
            title="Rappel envoyé",
            body=f"Rappel de paiement envoyé aux parents de {student.full_name}.",
            notification_type="PAYMENT",
            related_object_id=payment.id,
            related_object_type="StudentPayment",
        )

        return Response(
            {
                "message": f"Notification envoyée aux parents de {student.full_name}",
                "parents_notified": parents_notified,
            }
        )


# =========================================================================
# Bulk Send Reminders (expiring soon)
# =========================================================================


class PaymentBulkReminderView(APIView):
    """Send reminders to all students with expiring-soon payments."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        school = request.user.school
        today = datetime.date.today()
        cutoff = today + datetime.timedelta(days=7)

        payments = StudentPayment.objects.filter(
            school=school,
            is_deleted=False,
            status="actif",
            period_end__gte=today,
            period_end__lte=cutoff,
        ).select_related("student")

        from apps.academics.models import ParentProfile
        from apps.notifications.models import Notification

        total_notified = 0
        for payment in payments:
            student = payment.student
            parent_profile = getattr(student, "student_profile", None)
            if parent_profile:
                parent_profiles = ParentProfile.objects.filter(
                    children=parent_profile
                ).select_related("user")
                for pp in parent_profiles:
                    Notification.objects.create(
                        user=pp.user,
                        school=school,
                        title="Rappel de paiement",
                        body=(
                            f"Le paiement de {student.full_name} expire "
                            f"le {payment.period_end.strftime('%d/%m/%Y')}. "
                            f"Montant: {payment.amount_paid} DA."
                        ),
                        notification_type="PAYMENT",
                        related_object_id=payment.id,
                        related_object_type="StudentPayment",
                    )
                    total_notified += 1

        return Response(
            {
                "message": f"Rappels envoyés pour {payments.count()} paiements",
                "parents_notified": total_notified,
            }
        )


# =========================================================================
# Report (CSV / PDF export)
# =========================================================================


class PaymentReportView(APIView):
    """Export payments as CSV or PDF."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        _refresh_statuses(school)

        qs = _base_payments_qs(school)
        qs = _apply_filters(qs, request.query_params)

        fmt = request.query_params.get("format", "csv")

        if fmt == "csv":
            return self._csv_response(qs)
        elif fmt == "pdf":
            return self._pdf_response(qs)
        return Response(
            {"error": "Format not supported. Use ?format=csv or ?format=pdf"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def _csv_response(self, qs):
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="paiements.csv"'
        response.write("\ufeff")  # BOM for Excel

        writer = csv.writer(response)
        writer.writerow(
            [
                "Élève",
                "Classe",
                "Type",
                "Montant (DA)",
                "Méthode",
                "Date de paiement",
                "Période début",
                "Période fin",
                "Statut",
                "N° Reçu",
            ]
        )
        for p in qs:
            profile = getattr(p.student, "student_profile", None)
            cls = (
                profile.current_class.name if profile and profile.current_class else ""
            )
            writer.writerow(
                [
                    p.student.full_name,
                    cls,
                    p.get_payment_type_display(),
                    str(p.amount_paid),
                    p.get_payment_method_display(),
                    p.payment_date.strftime("%d/%m/%Y") if p.payment_date else "",
                    p.period_start.strftime("%d/%m/%Y") if p.period_start else "",
                    p.period_end.strftime("%d/%m/%Y") if p.period_end else "",
                    p.get_status_display(),
                    p.receipt_number,
                ]
            )
        return response

    def _pdf_response(self, qs):
        # Simple HTML table rendered as PDF via browser print
        html = (
            """<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Rapport de paiements</title><style>
body{font-family:sans-serif;padding:20px}
h1{font-size:18px} .meta{color:#666;font-size:12px;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:11px}
th{background:#f3f4f6;text-transform:uppercase;font-size:10px;color:#6b7280}
th,td{padding:6px 10px;border:1px solid #e5e7eb;text-align:left}
tr:nth-child(even){background:#f9fafb}
</style></head><body>
<h1>Rapport de paiements</h1>
<p class="meta">Généré le """
            + datetime.date.today().strftime("%d/%m/%Y")
            + """</p>
<table><thead><tr>
<th>Élève</th><th>Type</th><th>Montant</th><th>Méthode</th>
<th>Date</th><th>Période</th><th>Statut</th><th>N° Reçu</th>
</tr></thead><tbody>"""
        )
        for p in qs:
            period = ""
            if p.period_start and p.period_end:
                period = f"{p.period_start.strftime('%d/%m/%Y')} → {p.period_end.strftime('%d/%m/%Y')}"
            html += f"""<tr>
<td>{p.student.full_name}</td>
<td>{p.get_payment_type_display()}</td>
<td>{p.amount_paid} DA</td>
<td>{p.get_payment_method_display()}</td>
<td>{p.payment_date.strftime("%d/%m/%Y") if p.payment_date else ""}</td>
<td>{period}</td>
<td>{p.get_status_display()}</td>
<td>{p.receipt_number}</td>
</tr>"""
        html += "</tbody></table></body></html>"
        response = HttpResponse(html, content_type="text/html; charset=utf-8")
        response["Content-Disposition"] = 'inline; filename="paiements.html"'
        return response
