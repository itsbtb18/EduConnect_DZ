"""
Tests for the Payroll module — PROMPT 5.2.

Covers:
  - SalaryConfig model & CRUD API
  - Deduction model & CRUD API (FIXED / PERCENTAGE)
  - LeaveRecord CRUD + approve/reject workflow
  - OvertimeRecord CRUD + approve
  - PaySlip generation (compute_payslip service)
  - PaySlip status transitions (DRAFT → VALIDATED → PAID)
  - PaySlip PDF download
  - PaySlip bulk generation
  - Payroll stats endpoint
  - Teacher self-service (own payslips)
  - Permission checks (teacher cannot modify payslips)
  - Celery task generate_monthly_payslips
"""

import datetime
from decimal import Decimal
from unittest.mock import patch

import pytest
from rest_framework import status

URL_PREFIX = "/api/v1/finance"

# ─────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────


@pytest.fixture
def salary_config(db, school, teacher_user):
    from apps.finance.models import SalaryConfig

    return SalaryConfig.objects.create(
        school=school,
        teacher=teacher_user,
        base_salary=Decimal("60000.00"),
        hourly_rate=Decimal("1500.00"),
        qualification="MASTER",
        weekly_hours=18,
        bank_account="CCP-123456",
        hire_date=datetime.date(2022, 9, 1),
    )


@pytest.fixture
def deduction_cnas(db, school):
    from apps.finance.models import Deduction

    return Deduction.objects.create(
        school=school,
        name="CNAS",
        deduction_type="PERCENTAGE",
        value=Decimal("9.00"),
        is_active=True,
    )


@pytest.fixture
def deduction_irg(db, school):
    from apps.finance.models import Deduction

    return Deduction.objects.create(
        school=school,
        name="IRG",
        deduction_type="FIXED",
        value=Decimal("3000.00"),
        is_active=True,
    )


@pytest.fixture
def second_teacher(db, school):
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0550000099",
        password="Test@1234",
        school=school,
        role="TEACHER",
        first_name="Fatima",
        last_name="Zahra",
    )


@pytest.fixture
def second_salary_config(db, school, second_teacher):
    from apps.finance.models import SalaryConfig

    return SalaryConfig.objects.create(
        school=school,
        teacher=second_teacher,
        base_salary=Decimal("50000.00"),
        hourly_rate=Decimal("1200.00"),
        qualification="LICENCE",
        weekly_hours=20,
    )


# ─────────────────────────────────────────────────────────
# MODEL TESTS
# ─────────────────────────────────────────────────────────


class TestSalaryConfigModel:
    def test_01_salary_config_creation(self, salary_config, teacher_user):
        assert salary_config.teacher == teacher_user
        assert salary_config.base_salary == Decimal("60000.00")
        assert salary_config.qualification == "MASTER"
        assert str(salary_config) == f"{teacher_user.full_name} — 60000.00 DA/mois"

    def test_02_deduction_percentage_compute(self, deduction_cnas):
        amount = deduction_cnas.compute(Decimal("60000.00"))
        assert amount == Decimal("5400.00")  # 9% of 60000

    def test_03_deduction_fixed_compute(self, deduction_irg):
        amount = deduction_irg.compute(Decimal("60000.00"))
        assert amount == Decimal("3000.00")  # fixed

    def test_04_leave_record_days(self, db, school, teacher_user):
        from apps.finance.models import LeaveRecord

        leave = LeaveRecord.objects.create(
            school=school,
            teacher=teacher_user,
            leave_type="UNPAID",
            start_date=datetime.date(2025, 3, 10),
            end_date=datetime.date(2025, 3, 14),
        )
        assert leave.days == 5  # inclusive

    def test_05_payslip_auto_reference(self, db, school, teacher_user):
        from apps.finance.models import PaySlip

        ps = PaySlip.objects.create(
            school=school,
            teacher=teacher_user,
            month=3,
            year=2025,
            base_salary=60000,
            gross_salary=60000,
            total_deductions=0,
            net_salary=60000,
        )
        assert ps.reference.startswith("FDP-2025-03-")
        assert len(ps.reference) == len("FDP-2025-03-00001")


# ─────────────────────────────────────────────────────────
# COMPUTE PAYSLIP SERVICE
# ─────────────────────────────────────────────────────────


class TestComputePayslip:
    def test_06_basic_payslip_no_extras(self, salary_config, school):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 3, 2025, school)
        assert ps.base_salary == Decimal("60000.00")
        assert ps.overtime_hours == 0
        assert ps.overtime_amount == 0
        assert ps.leave_days_unpaid == 0
        assert ps.gross_salary == Decimal("60000.00")
        assert ps.net_salary == Decimal("60000.00")
        assert ps.status == "DRAFT"

    def test_07_payslip_with_overtime(self, salary_config, school, teacher_user):
        from apps.finance.models import OvertimeRecord
        from apps.finance.payroll_service import compute_payslip

        OvertimeRecord.objects.create(
            school=school,
            teacher=teacher_user,
            date=datetime.date(2025, 4, 5),
            hours=Decimal("4.00"),
            approved=True,
        )
        OvertimeRecord.objects.create(
            school=school,
            teacher=teacher_user,
            date=datetime.date(2025, 4, 12),
            hours=Decimal("2.00"),
            approved=True,
        )
        ps = compute_payslip(salary_config, 4, 2025, school)
        assert ps.overtime_hours == Decimal("6.00")
        # 6h × 1500 = 9000
        assert ps.overtime_amount == Decimal("9000.00")
        assert ps.gross_salary == Decimal("69000.00")

    def test_08_payslip_with_unpaid_leave(self, salary_config, school, teacher_user):
        from apps.finance.models import LeaveRecord
        from apps.finance.payroll_service import compute_payslip

        LeaveRecord.objects.create(
            school=school,
            teacher=teacher_user,
            leave_type="UNPAID",
            start_date=datetime.date(2025, 5, 5),
            end_date=datetime.date(2025, 5, 9),
            status="APPROVED",
        )
        ps = compute_payslip(salary_config, 5, 2025, school)
        assert ps.leave_days_unpaid == 5
        # daily rate = 60000 / 22 ≈ 2727.27
        expected_deduction = round(Decimal("60000") / Decimal("22") * 5, 2)
        assert ps.leave_deduction == expected_deduction
        assert ps.gross_salary == Decimal("60000.00") - expected_deduction

    def test_09_payslip_with_deductions(
        self, salary_config, school, deduction_cnas, deduction_irg
    ):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 6, 2025, school)
        # Gross = 60000 (no overtime/leave)
        # CNAS: 9% of 60000 = 5400
        # IRG: 3000 fixed
        assert ps.total_deductions == Decimal("8400.00")
        assert ps.net_salary == Decimal("51600.00")
        assert len(ps.deductions_detail) == 2

    def test_10_unapproved_overtime_ignored(self, salary_config, school, teacher_user):
        from apps.finance.models import OvertimeRecord
        from apps.finance.payroll_service import compute_payslip

        OvertimeRecord.objects.create(
            school=school,
            teacher=teacher_user,
            date=datetime.date(2025, 7, 1),
            hours=Decimal("10.00"),
            approved=False,  # not approved
        )
        ps = compute_payslip(salary_config, 7, 2025, school)
        assert ps.overtime_hours == 0  # ignored


# ─────────────────────────────────────────────────────────
# SALARY CONFIG API
# ─────────────────────────────────────────────────────────


class TestSalaryConfigAPI:
    def test_11_create_salary_config(self, admin_client, teacher_user):
        resp = admin_client.post(
            f"{URL_PREFIX}/salary-configs/",
            {
                "teacher": str(teacher_user.id),
                "base_salary": "55000.00",
                "hourly_rate": "1200.00",
                "qualification": "DOCTORAT",
                "weekly_hours": 16,
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["qualification_display"] == "Doctorat"

    def test_12_list_salary_configs(self, admin_client, salary_config):
        resp = admin_client.get(f"{URL_PREFIX}/salary-configs/")
        assert resp.status_code == 200
        assert resp.data["count"] >= 1

    def test_13_update_salary_config(self, admin_client, salary_config):
        resp = admin_client.patch(
            f"{URL_PREFIX}/salary-configs/{salary_config.pk}/",
            {"base_salary": "65000.00"},
            format="json",
        )
        assert resp.status_code == 200

    def test_14_delete_salary_config(self, admin_client, salary_config):
        resp = admin_client.delete(
            f"{URL_PREFIX}/salary-configs/{salary_config.pk}/"
        )
        assert resp.status_code == status.HTTP_204_NO_CONTENT

    def test_15_teacher_cannot_create_salary_config(
        self, teacher_client, teacher_user
    ):
        resp = teacher_client.post(
            f"{URL_PREFIX}/salary-configs/",
            {"teacher": str(teacher_user.id), "base_salary": "50000"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ─────────────────────────────────────────────────────────
# DEDUCTION API
# ─────────────────────────────────────────────────────────


class TestDeductionAPI:
    def test_16_create_deduction(self, admin_client):
        resp = admin_client.post(
            f"{URL_PREFIX}/deductions/",
            {
                "name": "Mutuelle",
                "deduction_type": "FIXED",
                "value": "2500.00",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["name"] == "Mutuelle"

    def test_17_list_deductions(self, admin_client, deduction_cnas, deduction_irg):
        resp = admin_client.get(f"{URL_PREFIX}/deductions/")
        assert resp.status_code == 200
        assert resp.data["count"] == 2


# ─────────────────────────────────────────────────────────
# LEAVE RECORD API + WORKFLOW
# ─────────────────────────────────────────────────────────


class TestLeaveAPI:
    def test_18_create_leave(self, admin_client, teacher_user, school):
        resp = admin_client.post(
            f"{URL_PREFIX}/leaves/",
            {
                "teacher": str(teacher_user.id),
                "leave_type": "SICK",
                "start_date": "2025-04-01",
                "end_date": "2025-04-03",
                "reason": "Grippe",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["status"] == "PENDING"
        assert resp.data["days"] == 3

    def test_19_approve_leave(self, admin_client, school, teacher_user):
        from apps.finance.models import LeaveRecord

        leave = LeaveRecord.objects.create(
            school=school,
            teacher=teacher_user,
            leave_type="ANNUAL",
            start_date=datetime.date(2025, 8, 1),
            end_date=datetime.date(2025, 8, 15),
        )
        resp = admin_client.post(
            f"{URL_PREFIX}/leaves/{leave.pk}/approve/",
            {"action": "approve"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["status"] == "APPROVED"

    def test_20_reject_leave(self, admin_client, school, teacher_user):
        from apps.finance.models import LeaveRecord

        leave = LeaveRecord.objects.create(
            school=school,
            teacher=teacher_user,
            leave_type="UNPAID",
            start_date=datetime.date(2025, 9, 1),
            end_date=datetime.date(2025, 9, 5),
        )
        resp = admin_client.post(
            f"{URL_PREFIX}/leaves/{leave.pk}/approve/",
            {"action": "reject"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["status"] == "REJECTED"

    def test_21_cannot_review_already_approved(
        self, admin_client, school, teacher_user
    ):
        from apps.finance.models import LeaveRecord

        leave = LeaveRecord.objects.create(
            school=school,
            teacher=teacher_user,
            leave_type="SICK",
            start_date=datetime.date(2025, 10, 1),
            end_date=datetime.date(2025, 10, 2),
            status="APPROVED",
        )
        resp = admin_client.post(
            f"{URL_PREFIX}/leaves/{leave.pk}/approve/",
            {"action": "reject"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ─────────────────────────────────────────────────────────
# OVERTIME API
# ─────────────────────────────────────────────────────────


class TestOvertimeAPI:
    def test_22_create_overtime(self, admin_client, teacher_user):
        resp = admin_client.post(
            f"{URL_PREFIX}/overtime/",
            {
                "teacher": str(teacher_user.id),
                "date": "2025-04-10",
                "hours": "3.50",
                "description": "Cours de rattrapage",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["approved"] is False

    def test_23_approve_overtime(self, admin_client, school, teacher_user):
        from apps.finance.models import OvertimeRecord

        ot = OvertimeRecord.objects.create(
            school=school,
            teacher=teacher_user,
            date=datetime.date(2025, 4, 15),
            hours=Decimal("2.00"),
        )
        resp = admin_client.post(
            f"{URL_PREFIX}/overtime/{ot.pk}/approve/",
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["approved"] is True


# ─────────────────────────────────────────────────────────
# PAYSLIP GENERATION API
# ─────────────────────────────────────────────────────────


class TestPaySlipAPI:
    def test_24_generate_payslip(self, admin_client, salary_config, teacher_user):
        resp = admin_client.post(
            f"{URL_PREFIX}/payslips/generate/",
            {
                "teacher": str(teacher_user.id),
                "month": 3,
                "year": 2025,
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["status"] == "DRAFT"
        assert resp.data["reference"].startswith("FDP-2025-03")
        assert Decimal(resp.data["base_salary"]) == Decimal("60000.00")

    def test_25_duplicate_payslip_rejected(
        self, admin_client, salary_config, teacher_user, school
    ):
        from apps.finance.payroll_service import compute_payslip

        compute_payslip(salary_config, 2, 2025, school)
        resp = admin_client.post(
            f"{URL_PREFIX}/payslips/generate/",
            {"teacher": str(teacher_user.id), "month": 2, "year": 2025},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_26_payslip_validate_transition(
        self, admin_client, salary_config, school
    ):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 1, 2025, school)
        resp = admin_client.patch(
            f"{URL_PREFIX}/payslips/{ps.pk}/",
            {"status": "VALIDATED"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["status"] == "VALIDATED"

    def test_27_payslip_paid_transition(self, admin_client, salary_config, school):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 12, 2024, school)
        ps.status = "VALIDATED"
        ps.save()
        resp = admin_client.patch(
            f"{URL_PREFIX}/payslips/{ps.pk}/",
            {"status": "PAID"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.data["status"] == "PAID"
        assert resp.data["paid_on"] is not None

    def test_28_invalid_transition_rejected(
        self, admin_client, salary_config, school
    ):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 11, 2024, school)
        ps.status = "PAID"
        ps.save()
        resp = admin_client.patch(
            f"{URL_PREFIX}/payslips/{ps.pk}/",
            {"status": "DRAFT"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_29_soft_delete_payslip(self, admin_client, salary_config, school):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 10, 2024, school)
        resp = admin_client.delete(f"{URL_PREFIX}/payslips/{ps.pk}/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT


# ─────────────────────────────────────────────────────────
# PDF DOWNLOAD
# ─────────────────────────────────────────────────────────


class TestPaySlipPDF:
    @patch("apps.finance.payroll_service.HTML")
    def test_30_download_pdf(
        self, mock_html_cls, admin_client, salary_config, school
    ):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 9, 2024, school)
        mock_html_cls.return_value.write_pdf.return_value = b"%PDF-fake"
        resp = admin_client.get(f"{URL_PREFIX}/payslips/{ps.pk}/pdf/")
        assert resp.status_code == 200
        assert resp["Content-Type"] == "application/pdf"
        assert "fiche_paie_" in resp["Content-Disposition"]


# ─────────────────────────────────────────────────────────
# BULK GENERATION
# ─────────────────────────────────────────────────────────


class TestBulkGenerate:
    def test_31_bulk_generate(
        self,
        admin_client,
        salary_config,
        second_salary_config,
    ):
        resp = admin_client.post(
            f"{URL_PREFIX}/payslips/bulk-generate/",
            {"month": 8, "year": 2024},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["created_count"] == 2
        assert resp.data["skipped_count"] == 0

    def test_32_bulk_generate_skips_existing(
        self, admin_client, salary_config, school
    ):
        from apps.finance.payroll_service import compute_payslip

        compute_payslip(salary_config, 7, 2024, school)
        resp = admin_client.post(
            f"{URL_PREFIX}/payslips/bulk-generate/",
            {"month": 7, "year": 2024},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["skipped_count"] >= 1


# ─────────────────────────────────────────────────────────
# STATS
# ─────────────────────────────────────────────────────────


class TestPayrollStats:
    def test_33_payroll_stats(self, admin_client, salary_config, school):
        from apps.finance.payroll_service import compute_payslip

        compute_payslip(salary_config, 6, 2024, school)
        resp = admin_client.get(
            f"{URL_PREFIX}/payslips/stats/?year=2024&month=6"
        )
        assert resp.status_code == 200
        assert resp.data["total_payslips"] == 1
        assert Decimal(str(resp.data["total_gross"])) == Decimal("60000.00")


# ─────────────────────────────────────────────────────────
# TEACHER SELF-SERVICE
# ─────────────────────────────────────────────────────────


class TestTeacherSelfService:
    def test_34_teacher_own_payslips(
        self, teacher_client, salary_config, school
    ):
        from apps.finance.payroll_service import compute_payslip

        compute_payslip(salary_config, 5, 2024, school)
        resp = teacher_client.get(f"{URL_PREFIX}/payslips/my/")
        assert resp.status_code == 200
        assert resp.data["count"] == 1

    def test_35_teacher_view_payslip_detail(
        self, teacher_client, salary_config, school
    ):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 4, 2024, school)
        resp = teacher_client.get(f"{URL_PREFIX}/payslips/{ps.pk}/")
        assert resp.status_code == 200
        assert resp.data["reference"] == ps.reference

    def test_36_teacher_cannot_patch_payslip(
        self, teacher_client, salary_config, school
    ):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 3, 2024, school)
        resp = teacher_client.patch(
            f"{URL_PREFIX}/payslips/{ps.pk}/",
            {"status": "VALIDATED"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_37_teacher_cannot_delete_payslip(
        self, teacher_client, salary_config, school
    ):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 2, 2024, school)
        resp = teacher_client.delete(f"{URL_PREFIX}/payslips/{ps.pk}/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    @patch("apps.finance.payroll_service.HTML")
    def test_38_teacher_can_download_own_pdf(
        self, mock_html_cls, teacher_client, salary_config, school
    ):
        from apps.finance.payroll_service import compute_payslip

        ps = compute_payslip(salary_config, 1, 2024, school)
        mock_html_cls.return_value.write_pdf.return_value = b"%PDF-fake"
        resp = teacher_client.get(f"{URL_PREFIX}/payslips/{ps.pk}/pdf/")
        assert resp.status_code == 200


# ─────────────────────────────────────────────────────────
# CELERY TASK
# ─────────────────────────────────────────────────────────


class TestCeleryTask:
    @patch("apps.finance.tasks.datetime")
    def test_39_generate_monthly_payslips_task(
        self,
        mock_dt,
        salary_config,
        second_salary_config,
    ):
        from apps.finance.tasks import generate_monthly_payslips

        # Simulate running on April 1st → generates for March
        mock_dt.date.today.return_value = datetime.date(2025, 4, 1)
        mock_dt.timedelta = datetime.timedelta
        result = generate_monthly_payslips()
        assert result["created"] == 2
        assert result["skipped"] == 0
        assert result["errors"] == 0
