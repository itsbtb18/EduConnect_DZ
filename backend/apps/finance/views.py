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

from core.permissions import IsSchoolAdmin, IsAdminOrTeacher, IsTeacher, require_module

from .models import (
    AnnualBudget,
    Deduction,
    Expense,
    ExpenseCategory,
    ExtraFee,
    FeeDiscount,
    FeeStructure,
    LatePenalty,
    LeaveRecord,
    OvertimeRecord,
    PaySlip,
    RegistrationDeposit,
    SalaryAdvance,
    SalaryConfig,
    StudentFeeEnrollment,
    StudentPayment,
)
from .serializers import (
    AnnualBudgetCreateSerializer,
    AnnualBudgetSerializer,
    DeductionCreateSerializer,
    DeductionSerializer,
    ExpenseCategoryCreateSerializer,
    ExpenseCategorySerializer,
    ExpenseCreateSerializer,
    ExpenseSerializer,
    ExtraFeeCreateSerializer,
    ExtraFeeSerializer,
    FeeDiscountCreateSerializer,
    FeeDiscountSerializer,
    FeeStructureCreateSerializer,
    FeeStructureSerializer,
    LatePenaltyCreateSerializer,
    LatePenaltySerializer,
    LeaveRecordCreateSerializer,
    LeaveRecordSerializer,
    OvertimeRecordCreateSerializer,
    OvertimeRecordSerializer,
    PaySlipGenerateSerializer,
    PaySlipSerializer,
    RegistrationDepositCreateSerializer,
    RegistrationDepositSerializer,
    SalaryAdvanceCreateSerializer,
    SalaryAdvanceSerializer,
    SalaryConfigCreateSerializer,
    SalaryConfigSerializer,
    StudentFeeEnrollmentCreateSerializer,
    StudentFeeEnrollmentSerializer,
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


@require_module("finance")
class FeeStructureListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = (
            FeeStructure.objects.filter(school=request.user.school, is_deleted=False)
            .select_related("academic_year", "section")
            .order_by("-created_at")
        )
        # Optional filters
        section_id = request.query_params.get("section")
        if section_id:
            qs = qs.filter(section_id=section_id)
        academic_year_id = request.query_params.get("academic_year")
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)

        serializer = FeeStructureSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = FeeStructureCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(
            FeeStructureSerializer(obj).data, status=status.HTTP_201_CREATED
        )


@require_module("finance")
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


@require_module("finance")
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
        # Refresh the related enrollment totals if one exists
        enrollment = StudentFeeEnrollment.objects.filter(
            student=obj.student,
            fee_structure=obj.fee_structure,
            is_deleted=False,
        ).first()
        if enrollment:
            enrollment.refresh_totals(commit=True)

        return Response(
            StudentPaymentSerializer(obj).data, status=status.HTTP_201_CREATED
        )


@require_module("finance")
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


@require_module("finance")
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


@require_module("finance")
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


@require_module("finance")
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


@require_module("finance")
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


@require_module("finance")
class PaymentReportView(APIView):
    """Export payments as CSV or PDF."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        _refresh_statuses(school)

        qs = _base_payments_qs(school)
        qs = _apply_filters(qs, request.query_params)

        fmt = request.query_params.get("export_format", "csv")

        if fmt == "csv":
            return self._csv_response(qs)
        elif fmt == "pdf":
            return self._pdf_response(qs)
        return Response(
            {
                "error": "Format not supported. Use ?export_format=csv or ?export_format=pdf"
            },
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


# =========================================================================
# PDF Receipt Download
# =========================================================================


@require_module("finance")
class PaymentReceiptView(APIView):
    """Download the PDF receipt for a single payment."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request, pk):
        try:
            payment = StudentPayment.objects.select_related(
                "student",
                "student__student_profile",
                "student__student_profile__current_class",
                "fee_structure",
                "fee_structure__academic_year",
                "fee_structure__section",
            ).get(pk=pk, school=request.user.school, is_deleted=False)
        except StudentPayment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        from .services import generate_receipt_pdf

        pdf_bytes = generate_receipt_pdf(payment)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        safe_name = payment.receipt_number.replace(" ", "_")
        response["Content-Disposition"] = f'attachment; filename="recu_{safe_name}.pdf"'
        return response


# =========================================================================
# Student Fee Enrollment CRUD
# =========================================================================


@require_module("finance")
class FeeEnrollmentListCreateView(APIView):
    """List / create fee enrollments for a school."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = (
            StudentFeeEnrollment.objects.filter(school=school, is_deleted=False)
            .select_related(
                "student",
                "student__student_profile",
                "student__student_profile__current_class",
                "fee_structure",
            )
            .order_by("-created_at")
        )

        # Filters
        status_filter = request.query_params.get("status")
        if status_filter and status_filter != "all":
            qs = qs.filter(status=status_filter)

        fee_id = request.query_params.get("fee_structure")
        if fee_id:
            qs = qs.filter(fee_structure_id=fee_id)

        student_q = request.query_params.get("student")
        if student_q:
            qs = qs.filter(
                Q(student__first_name__icontains=student_q)
                | Q(student__last_name__icontains=student_q)
            )

        class_id = request.query_params.get("class")
        if class_id:
            qs = qs.filter(student__student_profile__current_class_id=class_id)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total = qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        results = list(qs[start:end])

        serializer = StudentFeeEnrollmentSerializer(results, many=True)
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )

    def post(self, request):
        serializer = StudentFeeEnrollmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        # Refresh totals from any existing payments
        obj.refresh_totals(commit=True)
        return Response(
            StudentFeeEnrollmentSerializer(obj).data,
            status=status.HTTP_201_CREATED,
        )


@require_module("finance")
class FeeEnrollmentDetailView(APIView):
    """Retrieve / update / soft-delete a single fee enrollment."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return StudentFeeEnrollment.objects.select_related(
            "student",
            "student__student_profile",
            "student__student_profile__current_class",
            "fee_structure",
        ).get(pk=pk, school=request.user.school, is_deleted=False)

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except StudentFeeEnrollment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.refresh_totals(commit=True)
        return Response(StudentFeeEnrollmentSerializer(obj).data)

    def patch(self, request, pk):
        try:
            obj = self._get(request, pk)
        except StudentFeeEnrollment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = StudentFeeEnrollmentCreateSerializer(
            obj, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        obj.refresh_totals(commit=True)
        return Response(StudentFeeEnrollmentSerializer(obj).data)

    def delete(self, request, pk):
        try:
            obj = self._get(request, pk)
        except StudentFeeEnrollment.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# Fee Enrollment Stats
# =========================================================================


@require_module("finance")
class FeeEnrollmentStatsView(APIView):
    """Aggregate enrollment stats: how many paid/partial/unpaid/late."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = StudentFeeEnrollment.objects.filter(school=school, is_deleted=False)

        # Refresh statuses
        for e in qs:
            e.refresh_totals(commit=True)

        total = qs.count()
        paid = qs.filter(status="PAID").count()
        partial = qs.filter(status="PARTIAL").count()
        unpaid = qs.filter(status="UNPAID").count()
        late = qs.filter(status="LATE").count()

        total_due = qs.aggregate(s=Sum("total_due"))["s"] or 0
        total_collected = qs.aggregate(s=Sum("total_paid"))["s"] or 0

        return Response(
            {
                "total_enrollments": total,
                "paid": paid,
                "partial": partial,
                "unpaid": unpaid,
                "late": late,
                "total_due": total_due,
                "total_collected": total_collected,
                "collection_rate": (
                    round(float(total_collected) / float(total_due) * 100, 1)
                    if total_due
                    else 0
                ),
            }
        )


# =========================================================================
# PAYROLL — Salary Config CRUD
# =========================================================================


@require_module("finance")
class SalaryConfigListCreateView(APIView):
    """List / create salary configurations (admin only)."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        qs = (
            SalaryConfig.objects.filter(school=school, is_deleted=False)
            .select_related("teacher")
            .order_by("teacher__last_name")
        )
        q = request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(teacher__first_name__icontains=q) | Q(teacher__last_name__icontains=q)
            )
        qualification = request.query_params.get("qualification")
        if qualification:
            qs = qs.filter(qualification=qualification)
        serializer = SalaryConfigSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = SalaryConfigCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(
            SalaryConfigSerializer(obj).data, status=status.HTTP_201_CREATED
        )


@require_module("finance")
class SalaryConfigDetailView(APIView):
    """Retrieve / update / delete a salary configuration."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return SalaryConfig.objects.select_related("teacher").get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except SalaryConfig.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(SalaryConfigSerializer(obj).data)

    def patch(self, request, pk):
        try:
            obj = self._get(request, pk)
        except SalaryConfig.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = SalaryConfigCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(SalaryConfigSerializer(obj).data)

    def delete(self, request, pk):
        try:
            obj = self._get(request, pk)
        except SalaryConfig.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# PAYROLL — Deductions CRUD
# =========================================================================


@require_module("finance")
class DeductionListCreateView(APIView):
    """List / create reusable deduction types (admin only)."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = Deduction.objects.filter(
            school=request.user.school, is_deleted=False
        ).order_by("name")
        serializer = DeductionSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = DeductionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(DeductionSerializer(obj).data, status=status.HTTP_201_CREATED)


@require_module("finance")
class DeductionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return Deduction.objects.get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except Deduction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(DeductionSerializer(obj).data)

    def patch(self, request, pk):
        try:
            obj = self._get(request, pk)
        except Deduction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = DeductionCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(DeductionSerializer(obj).data)

    def delete(self, request, pk):
        try:
            obj = self._get(request, pk)
        except Deduction.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# PAYROLL — Leave Records
# =========================================================================


@require_module("finance")
class LeaveRecordListCreateView(APIView):
    """List / create leave records."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = (
            LeaveRecord.objects.filter(school=request.user.school, is_deleted=False)
            .select_related("teacher", "approved_by")
            .order_by("-start_date")
        )
        teacher_id = request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        leave_status = request.query_params.get("status")
        if leave_status:
            qs = qs.filter(status=leave_status)
        serializer = LeaveRecordSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = LeaveRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(LeaveRecordSerializer(obj).data, status=status.HTTP_201_CREATED)


@require_module("finance")
class LeaveRecordDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return LeaveRecord.objects.select_related("teacher", "approved_by").get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except LeaveRecord.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(LeaveRecordSerializer(obj).data)

    def patch(self, request, pk):
        try:
            obj = self._get(request, pk)
        except LeaveRecord.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = LeaveRecordCreateSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(LeaveRecordSerializer(obj).data)

    def delete(self, request, pk):
        try:
            obj = self._get(request, pk)
        except LeaveRecord.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@require_module("finance")
class LeaveApproveView(APIView):
    """Approve or reject a leave request."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        try:
            obj = LeaveRecord.objects.get(
                pk=pk, school=request.user.school, is_deleted=False
            )
        except LeaveRecord.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")  # "approve" or "reject"
        if action not in ("approve", "reject"):
            return Response(
                {"error": "action must be 'approve' or 'reject'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if obj.status != LeaveRecord.LeaveStatus.PENDING:
            return Response(
                {"error": "Leave is already reviewed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        obj.status = (
            LeaveRecord.LeaveStatus.APPROVED
            if action == "approve"
            else LeaveRecord.LeaveStatus.REJECTED
        )
        obj.approved_by = request.user
        obj.save(update_fields=["status", "approved_by", "updated_at"])
        return Response(LeaveRecordSerializer(obj).data)


# =========================================================================
# PAYROLL — Overtime Records
# =========================================================================


@require_module("finance")
class OvertimeRecordListCreateView(APIView):
    """List / create overtime records."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = (
            OvertimeRecord.objects.filter(school=request.user.school, is_deleted=False)
            .select_related("teacher", "approved_by")
            .order_by("-date")
        )
        teacher_id = request.query_params.get("teacher")
        if teacher_id:
            qs = qs.filter(teacher_id=teacher_id)
        serializer = OvertimeRecordSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        serializer = OvertimeRecordCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj = serializer.save(school=request.user.school)
        return Response(
            OvertimeRecordSerializer(obj).data, status=status.HTTP_201_CREATED
        )


@require_module("finance")
class OvertimeApproveView(APIView):
    """Approve an overtime record."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        try:
            obj = OvertimeRecord.objects.get(
                pk=pk, school=request.user.school, is_deleted=False
            )
        except OvertimeRecord.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.approved = True
        obj.approved_by = request.user
        obj.save(update_fields=["approved", "approved_by", "updated_at"])
        return Response(OvertimeRecordSerializer(obj).data)


# =========================================================================
# PAYROLL — PaySlip generation & management
# =========================================================================


@require_module("finance")
class PaySlipListView(APIView):
    """List payslips — admin sees all, teacher sees own."""

    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get(self, request):
        school = request.user.school
        qs = (
            PaySlip.objects.filter(school=school, is_deleted=False)
            .select_related("teacher")
            .order_by("-year", "-month")
        )

        # Teachers can only see their own
        if request.user.role == "TEACHER":
            qs = qs.filter(teacher=request.user)
        else:
            teacher_id = request.query_params.get("teacher")
            if teacher_id:
                qs = qs.filter(teacher_id=teacher_id)

        year = request.query_params.get("year")
        if year:
            qs = qs.filter(year=int(year))
        month = request.query_params.get("month")
        if month:
            qs = qs.filter(month=int(month))
        slip_status = request.query_params.get("status")
        if slip_status:
            qs = qs.filter(status=slip_status)

        # Pagination
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        total = qs.count()
        start = (page - 1) * page_size
        results = qs[start : start + page_size]

        serializer = PaySlipSerializer(results, many=True)
        return Response(
            {
                "count": total,
                "page": page,
                "page_size": page_size,
                "results": serializer.data,
            }
        )


@require_module("finance")
class PaySlipGenerateView(APIView):
    """Generate a payslip for a teacher + month + year."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        serializer = PaySlipGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        teacher_id = serializer.validated_data["teacher"]
        month = serializer.validated_data["month"]
        year = serializer.validated_data["year"]
        school = request.user.school

        # Check no duplicate
        if PaySlip.objects.filter(
            teacher_id=teacher_id, month=month, year=year, is_deleted=False
        ).exists():
            return Response(
                {"error": f"Fiche de paie déjà générée pour {month:02d}/{year}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get salary config
        try:
            config = SalaryConfig.objects.get(
                teacher_id=teacher_id, school=school, is_deleted=False
            )
        except SalaryConfig.DoesNotExist:
            return Response(
                {"error": "Configuration de salaire introuvable pour cet enseignant."},
                status=status.HTTP_404_NOT_FOUND,
            )

        from .payroll_service import compute_payslip

        payslip = compute_payslip(config, month, year, school)
        return Response(PaySlipSerializer(payslip).data, status=status.HTTP_201_CREATED)


@require_module("finance")
class PaySlipDetailView(APIView):
    """Retrieve / validate / mark paid a payslip."""

    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def _get(self, request, pk):
        qs = PaySlip.objects.select_related("teacher")
        if request.user.role == "TEACHER":
            return qs.get(
                pk=pk,
                teacher=request.user,
                school=request.user.school,
                is_deleted=False,
            )
        return qs.get(pk=pk, school=request.user.school, is_deleted=False)

    def get(self, request, pk):
        try:
            obj = self._get(request, pk)
        except PaySlip.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(PaySlipSerializer(obj).data)

    def patch(self, request, pk):
        """Admin can validate or mark as paid."""
        if request.user.role == "TEACHER":
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            obj = PaySlip.objects.get(
                pk=pk, school=request.user.school, is_deleted=False
            )
        except PaySlip.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status == "VALIDATED" and obj.status == "DRAFT":
            obj.status = PaySlip.PaySlipStatus.VALIDATED
        elif new_status == "PAID" and obj.status in ("DRAFT", "VALIDATED"):
            obj.status = PaySlip.PaySlipStatus.PAID
            obj.paid_on = datetime.date.today()
        else:
            return Response(
                {"error": f"Transition invalide: {obj.status} → {new_status}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notes = request.data.get("notes")
        if notes is not None:
            obj.notes = notes
        obj.save()
        return Response(PaySlipSerializer(obj).data)

    def delete(self, request, pk):
        if request.user.role == "TEACHER":
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            obj = PaySlip.objects.get(
                pk=pk, school=request.user.school, is_deleted=False
            )
        except PaySlip.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        obj.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@require_module("finance")
class PaySlipPDFView(APIView):
    """Download PDF version of a payslip."""

    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get(self, request, pk):
        try:
            if request.user.role == "TEACHER":
                payslip = PaySlip.objects.select_related("teacher").get(
                    pk=pk,
                    teacher=request.user,
                    school=request.user.school,
                    is_deleted=False,
                )
            else:
                payslip = PaySlip.objects.select_related("teacher").get(
                    pk=pk, school=request.user.school, is_deleted=False
                )
        except PaySlip.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        from .payroll_service import generate_payslip_pdf

        pdf_bytes = generate_payslip_pdf(payslip)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        safe_ref = payslip.reference.replace(" ", "_")
        response["Content-Disposition"] = (
            f'attachment; filename="fiche_paie_{safe_ref}.pdf"'
        )
        return response


@require_module("finance")
class PaySlipBulkGenerateView(APIView):
    """Generate payslips for all teachers in the school for a given month."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request):
        month = request.data.get("month")
        year = request.data.get("year")
        if not month or not year:
            return Response(
                {"error": "month and year are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        month, year = int(month), int(year)
        school = request.user.school

        from .payroll_service import compute_payslip

        configs = SalaryConfig.objects.filter(
            school=school, is_deleted=False
        ).select_related("teacher")

        created = []
        skipped = []
        for config in configs:
            if PaySlip.objects.filter(
                teacher=config.teacher, month=month, year=year, is_deleted=False
            ).exists():
                skipped.append(config.teacher.full_name)
                continue
            ps = compute_payslip(config, month, year, school)
            created.append(ps.reference)

        return Response(
            {
                "created_count": len(created),
                "created_references": created,
                "skipped_count": len(skipped),
                "skipped_teachers": skipped,
            },
            status=status.HTTP_201_CREATED,
        )


@require_module("finance")
class PayrollStatsView(APIView):
    """Payroll dashboard stats for a given month/year."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        year = int(request.query_params.get("year", datetime.date.today().year))
        month = int(request.query_params.get("month", datetime.date.today().month))

        qs = PaySlip.objects.filter(
            school=school, year=year, month=month, is_deleted=False
        )
        total_slips = qs.count()
        total_gross = qs.aggregate(s=Sum("gross_salary"))["s"] or 0
        total_net = qs.aggregate(s=Sum("net_salary"))["s"] or 0
        total_deductions = qs.aggregate(s=Sum("total_deductions"))["s"] or 0
        draft = qs.filter(status="DRAFT").count()
        validated = qs.filter(status="VALIDATED").count()
        paid = qs.filter(status="PAID").count()

        return Response(
            {
                "year": year,
                "month": month,
                "total_payslips": total_slips,
                "total_gross": total_gross,
                "total_net": total_net,
                "total_deductions": total_deductions,
                "draft": draft,
                "validated": validated,
                "paid": paid,
            }
        )


@require_module("finance")
class TeacherOwnPaySlipsView(APIView):
    """Teachers access their own payslips from the mobile app."""

    permission_classes = [permissions.IsAuthenticated, IsTeacher]

    def get(self, request):
        qs = PaySlip.objects.filter(
            teacher=request.user,
            school=request.user.school,
            is_deleted=False,
        ).order_by("-year", "-month")
        year = request.query_params.get("year")
        if year:
            qs = qs.filter(year=int(year))
        serializer = PaySlipSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})


# =========================================================================
# FEE DISCOUNTS
# =========================================================================


@require_module("finance")
class FeeDiscountListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = FeeDiscount.objects.filter(school=request.user.school, is_deleted=False)
        serializer = FeeDiscountSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        ser = FeeDiscountCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(school=request.user.school)
        return Response(ser.data, status=status.HTTP_201_CREATED)


@require_module("finance")
class FeeDiscountDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return FeeDiscount.objects.get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def get(self, request, pk):
        obj = self._get(request, pk)
        return Response(FeeDiscountSerializer(obj).data)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        ser = FeeDiscountCreateSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(FeeDiscountSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.is_deleted = True
        obj.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# LATE PENALTIES
# =========================================================================


@require_module("finance")
class LatePenaltyListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = LatePenalty.objects.filter(school=request.user.school, is_deleted=False)
        serializer = LatePenaltySerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        ser = LatePenaltyCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(school=request.user.school)
        return Response(ser.data, status=status.HTTP_201_CREATED)


@require_module("finance")
class LatePenaltyDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return LatePenalty.objects.get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        ser = LatePenaltyCreateSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(LatePenaltySerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.is_deleted = True
        obj.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# REGISTRATION DEPOSITS
# =========================================================================


@require_module("finance")
class RegistrationDepositListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = RegistrationDeposit.objects.filter(
            school=request.user.school, is_deleted=False
        ).select_related("student", "academic_year")
        academic_year = request.query_params.get("academic_year")
        if academic_year:
            qs = qs.filter(academic_year_id=academic_year)
        serializer = RegistrationDepositSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        ser = RegistrationDepositCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(school=request.user.school)
        return Response(ser.data, status=status.HTTP_201_CREATED)


@require_module("finance")
class RegistrationDepositDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return RegistrationDeposit.objects.get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        ser = RegistrationDepositCreateSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(RegistrationDepositSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.is_deleted = True
        obj.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# EXTRA FEES
# =========================================================================


@require_module("finance")
class ExtraFeeListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = ExtraFee.objects.filter(
            school=request.user.school, is_deleted=False
        ).select_related("academic_year")
        serializer = ExtraFeeSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        ser = ExtraFeeCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(school=request.user.school)
        return Response(ser.data, status=status.HTTP_201_CREATED)


@require_module("finance")
class ExtraFeeDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return ExtraFee.objects.get(pk=pk, school=request.user.school, is_deleted=False)

    def patch(self, request, pk):
        obj = self._get(request, pk)
        ser = ExtraFeeCreateSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ExtraFeeSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.is_deleted = True
        obj.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# EXPENSE CATEGORIES
# =========================================================================


@require_module("finance")
class ExpenseCategoryListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = ExpenseCategory.objects.filter(
            school=request.user.school, is_deleted=False
        )
        serializer = ExpenseCategorySerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        ser = ExpenseCategoryCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(school=request.user.school)
        return Response(ser.data, status=status.HTTP_201_CREATED)


@require_module("finance")
class ExpenseCategoryDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return ExpenseCategory.objects.get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        ser = ExpenseCategoryCreateSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(ExpenseCategorySerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.is_deleted = True
        obj.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# EXPENSES
# =========================================================================


@require_module("finance")
class ExpenseListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get(self, request):
        qs = Expense.objects.filter(
            school=request.user.school, is_deleted=False
        ).select_related("category", "submitted_by", "approved_by")
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        cat = request.query_params.get("category")
        if cat:
            qs = qs.filter(category_id=cat)
        serializer = ExpenseSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        ser = ExpenseCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        expense = ser.save(
            school=request.user.school,
            submitted_by=request.user,
        )
        # Check budget overspend
        cat = expense.category
        if cat.budget_annual > 0 and cat.budget_consumed > cat.budget_annual:
            logger.warning(
                "Budget overspend: %s consumed=%s / allocated=%s",
                cat.name,
                cat.budget_consumed,
                cat.budget_annual,
            )
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


@require_module("finance")
class ExpenseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def _get(self, request, pk):
        return Expense.objects.get(pk=pk, school=request.user.school, is_deleted=False)

    def get(self, request, pk):
        return Response(ExpenseSerializer(self._get(request, pk)).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.is_deleted = True
        obj.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


@require_module("finance")
class ExpenseApproveView(APIView):
    """Director approves or rejects an expense."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        expense = Expense.objects.get(
            pk=pk, school=request.user.school, is_deleted=False
        )
        action = request.data.get("action")  # "approve" or "reject"
        if action == "approve":
            expense.status = Expense.ExpenseStatus.APPROVED
            expense.approved_by = request.user
            expense.save(update_fields=["status", "approved_by", "updated_at"])
        elif action == "reject":
            expense.status = Expense.ExpenseStatus.REJECTED
            expense.approved_by = request.user
            expense.rejection_reason = request.data.get("reason", "")
            expense.save(
                update_fields=[
                    "status",
                    "approved_by",
                    "rejection_reason",
                    "updated_at",
                ]
            )
        else:
            return Response(
                {"error": "action must be 'approve' or 'reject'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(ExpenseSerializer(expense).data)


# =========================================================================
# ANNUAL BUDGETS
# =========================================================================


@require_module("finance")
class AnnualBudgetListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        qs = AnnualBudget.objects.filter(
            school=request.user.school, is_deleted=False
        ).select_related("category")
        year = request.query_params.get("year")
        if year:
            qs = qs.filter(year=int(year))
        serializer = AnnualBudgetSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        ser = AnnualBudgetCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(school=request.user.school)
        return Response(ser.data, status=status.HTTP_201_CREATED)


@require_module("finance")
class AnnualBudgetDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def _get(self, request, pk):
        return AnnualBudget.objects.get(
            pk=pk, school=request.user.school, is_deleted=False
        )

    def patch(self, request, pk):
        obj = self._get(request, pk)
        ser = AnnualBudgetCreateSerializer(obj, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return Response(AnnualBudgetSerializer(obj).data)

    def delete(self, request, pk):
        obj = self._get(request, pk)
        obj.is_deleted = True
        obj.save(update_fields=["is_deleted", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================================
# SALARY ADVANCES
# =========================================================================


@require_module("finance")
class SalaryAdvanceListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminOrTeacher]

    def get(self, request):
        qs = SalaryAdvance.objects.filter(
            school=request.user.school, is_deleted=False
        ).select_related("teacher", "approved_by")
        teacher = request.query_params.get("teacher")
        if teacher:
            qs = qs.filter(teacher_id=teacher)
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        serializer = SalaryAdvanceSerializer(qs, many=True)
        return Response({"results": serializer.data, "count": qs.count()})

    def post(self, request):
        ser = SalaryAdvanceCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(school=request.user.school)
        return Response(ser.data, status=status.HTTP_201_CREATED)


@require_module("finance")
class SalaryAdvanceApproveView(APIView):
    """Approve or reject a salary advance request."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def post(self, request, pk):
        advance = SalaryAdvance.objects.get(
            pk=pk, school=request.user.school, is_deleted=False
        )
        action = request.data.get("action")
        if action == "approve":
            advance.status = SalaryAdvance.AdvanceStatus.APPROVED
            advance.approved_by = request.user
            advance.save(update_fields=["status", "approved_by", "updated_at"])
        elif action == "reject":
            advance.status = SalaryAdvance.AdvanceStatus.REJECTED
            advance.approved_by = request.user
            advance.save(update_fields=["status", "approved_by", "updated_at"])
        else:
            return Response(
                {"error": "action must be 'approve' or 'reject'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(SalaryAdvanceSerializer(advance).data)


# =========================================================================
# FINANCIAL REPORTS
# =========================================================================


@require_module("finance")
class FinancialReportView(APIView):
    """Comprehensive financial reports: monthly/annual summaries."""

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get(self, request):
        school = request.user.school
        year = int(request.query_params.get("year", timezone.now().year))
        month = request.query_params.get("month")

        # Revenue — student payments
        revenue_qs = StudentPayment.objects.filter(
            school=school,
            is_deleted=False,
            payment_date__year=year,
        )
        if month:
            revenue_qs = revenue_qs.filter(payment_date__month=int(month))

        total_revenue = revenue_qs.aggregate(s=Sum("amount_paid"))["s"] or 0
        revenue_by_method = list(
            revenue_qs.values("payment_method")
            .annotate(total=Sum("amount_paid"), count=Count("id"))
            .order_by("-total")
        )

        # Registration deposits
        deposits_qs = RegistrationDeposit.objects.filter(
            school=school,
            is_deleted=False,
            status="PAID",
            payment_date__year=year,
        )
        if month:
            deposits_qs = deposits_qs.filter(payment_date__month=int(month))
        total_deposits = deposits_qs.aggregate(s=Sum("amount"))["s"] or 0

        # Expenses
        expenses_qs = Expense.objects.filter(
            school=school,
            is_deleted=False,
            status="APPROVED",
            expense_date__year=year,
        )
        if month:
            expenses_qs = expenses_qs.filter(expense_date__month=int(month))
        total_expenses = expenses_qs.aggregate(s=Sum("amount"))["s"] or 0
        expenses_by_category = list(
            expenses_qs.values("category__name")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )

        # Payroll
        payroll_qs = PaySlip.objects.filter(
            school=school,
            is_deleted=False,
            year=year,
        )
        if month:
            payroll_qs = payroll_qs.filter(month=int(month))
        total_payroll = payroll_qs.aggregate(s=Sum("net_salary"))["s"] or 0

        # Unpaid
        unpaid_count = StudentFeeEnrollment.objects.filter(
            school=school,
            is_deleted=False,
            status__in=["UNPAID", "LATE"],
        ).count()
        unpaid_amount = (
            StudentFeeEnrollment.objects.filter(
                school=school,
                is_deleted=False,
                status__in=["UNPAID", "LATE"],
            ).aggregate(s=Sum("total_due"))["s"]
            or 0
        )
        paid_amount = (
            StudentFeeEnrollment.objects.filter(
                school=school,
                is_deleted=False,
                status__in=["UNPAID", "LATE"],
            ).aggregate(s=Sum("total_paid"))["s"]
            or 0
        )

        # Monthly breakdown for the year
        monthly = []
        for m in range(1, 13):
            rev = (
                StudentPayment.objects.filter(
                    school=school,
                    is_deleted=False,
                    payment_date__year=year,
                    payment_date__month=m,
                ).aggregate(s=Sum("amount_paid"))["s"]
                or 0
            )
            exp = (
                Expense.objects.filter(
                    school=school,
                    is_deleted=False,
                    status="APPROVED",
                    expense_date__year=year,
                    expense_date__month=m,
                ).aggregate(s=Sum("amount"))["s"]
                or 0
            )
            pay = (
                PaySlip.objects.filter(
                    school=school,
                    is_deleted=False,
                    year=year,
                    month=m,
                ).aggregate(s=Sum("net_salary"))["s"]
                or 0
            )
            monthly.append(
                {
                    "month": m,
                    "revenue": rev,
                    "expenses": exp,
                    "payroll": pay,
                    "net": rev - exp - pay,
                }
            )

        return Response(
            {
                "year": year,
                "month": int(month) if month else None,
                "total_revenue": total_revenue,
                "total_deposits": total_deposits,
                "total_expenses": total_expenses,
                "total_payroll": total_payroll,
                "net_cashflow": total_revenue
                + total_deposits
                - total_expenses
                - total_payroll,
                "revenue_by_method": revenue_by_method,
                "expenses_by_category": expenses_by_category,
                "unpaid_students": unpaid_count,
                "unpaid_amount": unpaid_amount - paid_amount,
                "monthly_breakdown": monthly,
            }
        )
