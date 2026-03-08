"""
Tests for the finance app — models, payment endpoints, payroll.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from django.urls import reverse
from rest_framework import status


# ════════════════════════════════════════════════════════════════
# MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestFeeStructureModel:
    """Tests for FeeStructure model."""

    def test_create_fee_structure(self, school, section, academic_year):
        from apps.finance.models import FeeStructure

        fee = FeeStructure.objects.create(
            school=school,
            name="Scolarité mensuelle",
            academic_year=academic_year,
            section=section,
            amount_monthly=Decimal("5000.00"),
            amount_trimester=Decimal("14000.00"),
            amount_annual=Decimal("40000.00"),
        )
        assert fee.pk is not None
        assert fee.amount_monthly == Decimal("5000.00")


@pytest.mark.django_db
class TestStudentPaymentModel:
    """Tests for StudentPayment model."""

    def test_create_payment(self, school, student_user, section, academic_year):
        from apps.finance.models import FeeStructure, StudentPayment

        fee = FeeStructure.objects.create(
            school=school,
            name="Tuition",
            academic_year=academic_year,
            section=section,
            amount_monthly=Decimal("5000.00"),
        )
        payment = StudentPayment.objects.create(
            school=school,
            student=student_user,
            fee_structure=fee,
            payment_type="mensuel",
            amount_paid=Decimal("5000.00"),
            payment_date=date.today(),
            period_start=date.today(),
            period_end=date.today() + timedelta(days=30),
            payment_method="especes",
            receipt_number="PAY-2025-00001",
        )
        assert payment.pk is not None
        assert payment.receipt_number == "PAY-2025-00001"
        assert payment.amount_paid == Decimal("5000.00")

    def test_receipt_number_unique(
        self, school, student_user, section, academic_year
    ):
        from apps.finance.models import FeeStructure, StudentPayment

        fee = FeeStructure.objects.create(
            school=school,
            name="Tuition",
            academic_year=academic_year,
            section=section,
            amount_monthly=Decimal("5000"),
        )
        StudentPayment.objects.create(
            school=school,
            student=student_user,
            fee_structure=fee,
            payment_type="mensuel",
            amount_paid=Decimal("5000"),
            payment_date=date.today(),
            period_start=date.today(),
            period_end=date.today() + timedelta(days=30),
            payment_method="especes",
            receipt_number="PAY-UNIQ-001",
        )
        with pytest.raises(Exception):
            StudentPayment.objects.create(
                school=school,
                student=student_user,
                fee_structure=fee,
                payment_type="mensuel",
                amount_paid=Decimal("5000"),
                payment_date=date.today(),
                period_start=date.today(),
                period_end=date.today() + timedelta(days=30),
                payment_method="especes",
                receipt_number="PAY-UNIQ-001",
            )


@pytest.mark.django_db
class TestSalaryAndDeductionModels:
    """Tests for SalaryConfig and Deduction models."""

    def test_create_salary_config(self, school, teacher_user):
        from apps.finance.models import SalaryConfig

        config = SalaryConfig.objects.create(
            school=school,
            teacher=teacher_user,
            base_salary=Decimal("45000.00"),
            hourly_rate=Decimal("500.00"),
            qualification="MASTER",
            weekly_hours=18,
        )
        assert config.base_salary == Decimal("45000.00")

    def test_deduction_compute_fixed(self, school):
        from apps.finance.models import Deduction

        d = Deduction.objects.create(
            school=school,
            name="CNAS",
            deduction_type="FIXED",
            value=Decimal("3000.00"),
        )
        assert d.compute(Decimal("50000")) == Decimal("3000.00")

    def test_deduction_compute_percentage(self, school):
        from apps.finance.models import Deduction

        d = Deduction.objects.create(
            school=school,
            name="IRG",
            deduction_type="PERCENTAGE",
            value=Decimal("10.00"),
        )
        assert d.compute(Decimal("50000")) == Decimal("5000.00")


@pytest.mark.django_db
class TestLeaveRecordModel:
    """Tests for LeaveRecord model."""

    def test_leave_days_count(self, school, teacher_user):
        from apps.finance.models import LeaveRecord

        leave = LeaveRecord.objects.create(
            school=school,
            teacher=teacher_user,
            leave_type="SICK",
            start_date=date(2025, 3, 1),
            end_date=date(2025, 3, 5),
            reason="Flu",
        )
        assert leave.days == 5  # inclusive
        assert leave.status == "PENDING"


# ════════════════════════════════════════════════════════════════
# ENDPOINT TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestFinanceEndpoints:
    """Tests for finance REST endpoints."""

    def test_fee_structure_list_as_admin(self, admin_client):
        url = reverse("fee-structure-list")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_payment_list_as_admin(self, admin_client):
        url = reverse("payment-list")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_payment_stats_as_admin(self, admin_client):
        url = reverse("payment-stats")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_finance_forbidden_for_student(self, student_client):
        url = reverse("fee-structure-list")
        resp = student_client.get(url)
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )

    def test_finance_forbidden_unauthenticated(self, api_client):
        url = reverse("payment-list")
        resp = api_client.get(url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
