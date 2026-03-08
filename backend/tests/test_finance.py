"""
Tests for the Finance module — PROMPT 5.1.

Covers:
  - FeeStructure with section-level config
  - StudentPayment with auto-receipt_number & status
  - StudentFeeEnrollment tracking (PAID/PARTIAL/UNPAID/LATE)
  - PDF receipt generation
  - Celery tasks (check_expired_payments, send_payment_reminders, refresh_enrollment_statuses)
  - REST API endpoints (CRUD, stats, enrollments)
"""

import datetime
from decimal import Decimal
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient


# ─────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────


@pytest.fixture
def school(db):
    from apps.schools.models import School

    return School.objects.create(
        name="Finance Test School",
        subdomain="finance-test",
        address="1 Rue Test, Alger",
        phone="0551000000",
        wilaya="Alger",
        is_active=True,
    )


@pytest.fixture
def academic_year(db, school):
    from apps.schools.models import AcademicYear

    return AcademicYear.objects.create(
        school=school,
        name="2025-2026",
        start_date="2025-09-08",
        end_date="2026-06-30",
        is_current=True,
    )


@pytest.fixture
def section(db, school):
    from apps.schools.models import Section

    return Section.objects.create(
        school=school,
        section_type=Section.SectionType.MIDDLE,
        name="Moyen",
    )


@pytest.fixture
def admin_user(db, school):
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0559000001",
        password="Test@1234",
        school=school,
        role="ADMIN",
        first_name="Admin",
        last_name="Finance",
        is_staff=True,
    )


@pytest.fixture
def student_user(db, school):
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0559000002",
        password="Test@1234",
        school=school,
        role="STUDENT",
        first_name="Youssef",
        last_name="Boudjema",
    )


@pytest.fixture
def parent_user(db, school, student_user):
    from apps.accounts.models import User
    from apps.academics.models import ParentProfile

    parent = User.objects.create_user(
        phone_number="0559000003",
        password="Test@1234",
        school=school,
        role="PARENT",
        first_name="Nadia",
        last_name="Boudjema",
    )
    # Link parent to student
    sp = student_user.student_profile
    pp = parent.parent_profile
    pp.children.add(sp)
    return parent


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def fee_structure(db, school, academic_year, section):
    from apps.finance.models import FeeStructure

    return FeeStructure.objects.create(
        school=school,
        name="Frais de scolarité CEM 2025-2026",
        academic_year=academic_year,
        section=section,
        amount_monthly=Decimal("8000.00"),
        amount_trimester=Decimal("22000.00"),
        amount_annual=Decimal("60000.00"),
        due_date=datetime.date(2025, 10, 15),
        description="Frais annuels pour le cycle moyen",
    )


@pytest.fixture
def fee_structure_no_section(db, school, academic_year):
    from apps.finance.models import FeeStructure

    return FeeStructure.objects.create(
        school=school,
        name="Inscription générale 2025-2026",
        academic_year=academic_year,
        amount_annual=Decimal("5000.00"),
    )


@pytest.fixture
def payment(db, school, student_user, fee_structure, admin_user):
    from apps.finance.models import StudentPayment

    return StudentPayment.objects.create(
        school=school,
        student=student_user,
        fee_structure=fee_structure,
        payment_type="mensuel",
        amount_paid=Decimal("8000.00"),
        payment_date=datetime.date(2025, 10, 1),
        period_start=datetime.date(2025, 10, 1),
        period_end=datetime.date(2025, 10, 31),
        payment_method="especes",
        recorded_by=admin_user,
    )


@pytest.fixture
def enrollment(db, school, student_user, fee_structure):
    from apps.finance.models import StudentFeeEnrollment

    return StudentFeeEnrollment.objects.create(
        school=school,
        student=student_user,
        fee_structure=fee_structure,
        total_due=Decimal("60000.00"),
        due_date=datetime.date(2026, 6, 30),
    )


# ─────────────────────────────────────────────────────────────────────────
# 1. Model Tests
# ─────────────────────────────────────────────────────────────────────────


class TestFeeStructureModel:
    def test_section_fk_exists(self, fee_structure, section):
        """FeeStructure can be linked to a specific section."""
        assert fee_structure.section == section
        assert fee_structure.section.section_type == "MIDDLE"

    def test_section_nullable(self, fee_structure_no_section):
        """FeeStructure without section is valid (school-wide fee)."""
        assert fee_structure_no_section.section is None

    def test_due_date_field(self, fee_structure):
        """FeeStructure has a due_date field."""
        assert fee_structure.due_date == datetime.date(2025, 10, 15)

    def test_str_with_section(self, fee_structure):
        assert "Moyen" in str(fee_structure)

    def test_str_without_section(self, fee_structure_no_section):
        assert "Inscription générale" in str(fee_structure_no_section)


class TestStudentPaymentModel:
    def test_auto_receipt_number(self, payment):
        """Receipt number is auto-generated on save."""
        assert payment.receipt_number.startswith("PAY-2025-")

    def test_status_auto_computed(self, db, school, student_user, fee_structure, admin_user):
        """Status is 'expire' when period_end is in the past."""
        from apps.finance.models import StudentPayment

        p = StudentPayment.objects.create(
            school=school,
            student=student_user,
            fee_structure=fee_structure,
            payment_type="mensuel",
            amount_paid=Decimal("8000.00"),
            payment_date=datetime.date(2024, 1, 1),
            period_start=datetime.date(2024, 1, 1),
            period_end=datetime.date(2024, 1, 31),
            payment_method="cib",
            recorded_by=admin_user,
        )
        assert p.status == "expire"

    def test_sequential_receipt_numbers(self, db, school, student_user, fee_structure, admin_user):
        """Successive payments get sequential receipt numbers."""
        from apps.finance.models import StudentPayment

        p1 = StudentPayment.objects.create(
            school=school,
            student=student_user,
            fee_structure=fee_structure,
            payment_type="mensuel",
            amount_paid=Decimal("8000.00"),
            payment_date=datetime.date(2025, 11, 1),
            period_start=datetime.date(2025, 11, 1),
            period_end=datetime.date(2026, 11, 30),
            payment_method="especes",
        )
        p2 = StudentPayment.objects.create(
            school=school,
            student=student_user,
            fee_structure=fee_structure,
            payment_type="mensuel",
            amount_paid=Decimal("8000.00"),
            payment_date=datetime.date(2025, 12, 1),
            period_start=datetime.date(2025, 12, 1),
            period_end=datetime.date(2026, 12, 31),
            payment_method="especes",
        )
        seq1 = int(p1.receipt_number.split("-")[-1])
        seq2 = int(p2.receipt_number.split("-")[-1])
        assert seq2 == seq1 + 1


class TestStudentFeeEnrollmentModel:
    def test_creation(self, enrollment, student_user, fee_structure):
        """Enrollment tracks student + fee_structure + total_due."""
        assert enrollment.student == student_user
        assert enrollment.fee_structure == fee_structure
        assert enrollment.total_due == Decimal("60000.00")
        assert enrollment.total_paid == 0
        assert enrollment.status == "UNPAID"

    def test_status_paid(self, enrollment, payment):
        """After paying full amount, status becomes PAID."""
        from apps.finance.models import StudentPayment

        # Add more payments to reach total_due
        for i in range(7):
            StudentPayment.objects.create(
                school=enrollment.school,
                student=enrollment.student,
                fee_structure=enrollment.fee_structure,
                payment_type="mensuel",
                amount_paid=Decimal("8000.00"),
                payment_date=datetime.date(2025, 11, 1) + datetime.timedelta(days=30 * i),
                period_start=datetime.date(2025, 11, 1) + datetime.timedelta(days=30 * i),
                period_end=datetime.date(2025, 11, 30) + datetime.timedelta(days=30 * i),
                payment_method="especes",
            )
        # Now total_paid = 8 * 8000 = 64000 >= 60000
        enrollment.refresh_totals(commit=True)
        assert enrollment.total_paid >= enrollment.total_due
        assert enrollment.status == "PAID"

    def test_status_partial(self, enrollment, payment):
        """After partial payment, status is PARTIAL (if not yet overdue)."""
        enrollment.refresh_totals(commit=True)
        assert enrollment.total_paid == Decimal("8000.00")
        assert enrollment.status == "PARTIAL"

    def test_status_late(self, db, school, student_user, fee_structure):
        """Unpaid enrollment past due_date is LATE."""
        from apps.finance.models import StudentFeeEnrollment

        e = StudentFeeEnrollment.objects.create(
            school=school,
            student=student_user,
            fee_structure=fee_structure,
            total_due=Decimal("60000.00"),
            due_date=datetime.date(2024, 1, 1),  # Past due
        )
        e.refresh_totals(commit=True)
        assert e.status == "LATE"

    def test_unique_student_fee(self, enrollment, school, student_user, fee_structure):
        """Cannot create duplicate enrollment for same student + fee_structure."""
        from apps.finance.models import StudentFeeEnrollment
        from django.db import IntegrityError

        with pytest.raises(IntegrityError):
            StudentFeeEnrollment.objects.create(
                school=school,
                student=student_user,
                fee_structure=fee_structure,
                total_due=Decimal("50000.00"),
                due_date=datetime.date(2026, 6, 30),
            )


# ─────────────────────────────────────────────────────────────────────────
# 2. API Tests — FeeStructure
# ─────────────────────────────────────────────────────────────────────────


class TestFeeStructureAPI:
    def test_create_with_section(self, admin_client, academic_year, section):
        """POST /finance/fee-structures/ with section."""
        resp = admin_client.post(
            "/api/v1/finance/fee-structures/",
            {
                "name": "Frais primaire",
                "academic_year": str(academic_year.id),
                "section": str(section.id),
                "amount_annual": "45000.00",
            },
            format="json",
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["section"] == str(section.id)
        assert data["section_name"] == "Moyen"

    def test_list_with_section_filter(self, admin_client, fee_structure, section):
        """GET /finance/fee-structures/?section=... filters correctly."""
        resp = admin_client.get(
            f"/api/v1/finance/fee-structures/?section={section.id}"
        )
        assert resp.status_code == 200
        assert resp.json()["count"] == 1

    def test_list_with_academic_year_filter(self, admin_client, fee_structure, academic_year):
        """GET /finance/fee-structures/?academic_year=... filters correctly."""
        resp = admin_client.get(
            f"/api/v1/finance/fee-structures/?academic_year={academic_year.id}"
        )
        assert resp.status_code == 200
        assert resp.json()["count"] == 1

    def test_patch(self, admin_client, fee_structure):
        """PATCH /finance/fee-structures/<pk>/ updates fields."""
        resp = admin_client.patch(
            f"/api/v1/finance/fee-structures/{fee_structure.id}/",
            {"amount_annual": "65000.00"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.json()["amount_annual"] == "65000.00"

    def test_delete(self, admin_client, fee_structure):
        """DELETE /finance/fee-structures/<pk>/ soft-deletes."""
        resp = admin_client.delete(
            f"/api/v1/finance/fee-structures/{fee_structure.id}/"
        )
        assert resp.status_code == 204
        fee_structure.refresh_from_db()
        assert fee_structure.is_deleted is True


# ─────────────────────────────────────────────────────────────────────────
# 3. API Tests — Payments
# ─────────────────────────────────────────────────────────────────────────


class TestPaymentAPI:
    def test_create_payment(self, admin_client, student_user, fee_structure):
        """POST /finance/payments/ creates payment with auto receipt."""
        resp = admin_client.post(
            "/api/v1/finance/payments/",
            {
                "student": str(student_user.id),
                "fee_structure": str(fee_structure.id),
                "payment_type": "mensuel",
                "amount_paid": "8000.00",
                "payment_date": "2025-10-01",
                "period_start": "2025-10-01",
                "period_end": "2025-10-31",
                "payment_method": "baridimob",
            },
            format="json",
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["receipt_number"].startswith("PAY-")
        assert data["student_name"] == "Youssef Boudjema"

    def test_create_updates_enrollment(
        self, admin_client, student_user, fee_structure, enrollment
    ):
        """Creating a payment refreshes the enrollment totals."""
        resp = admin_client.post(
            "/api/v1/finance/payments/",
            {
                "student": str(student_user.id),
                "fee_structure": str(fee_structure.id),
                "payment_type": "mensuel",
                "amount_paid": "8000.00",
                "payment_date": "2025-10-01",
                "period_start": "2025-10-01",
                "period_end": "2025-10-31",
                "payment_method": "especes",
            },
            format="json",
        )
        assert resp.status_code == 201
        enrollment.refresh_from_db()
        assert enrollment.total_paid == Decimal("8000.00")
        assert enrollment.status == "PARTIAL"

    def test_list_with_filters(self, admin_client, payment):
        """GET /finance/payments/?status=actif returns filtered results."""
        resp = admin_client.get("/api/v1/finance/payments/?status=actif")
        assert resp.status_code == 200

    def test_payment_stats(self, admin_client, payment):
        """GET /finance/payments/stats/ returns aggregate data."""
        resp = admin_client.get("/api/v1/finance/payments/stats/")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_this_month" in data
        assert "expired_count" in data

    def test_send_reminder(self, admin_client, payment, parent_user):
        """POST /finance/payments/<pk>/send-reminder/ notifies parents."""
        resp = admin_client.post(
            f"/api/v1/finance/payments/{payment.id}/send-reminder/"
        )
        assert resp.status_code == 200
        assert resp.json()["parents_notified"] == 1


# ─────────────────────────────────────────────────────────────────────────
# 4. API Tests — Receipt PDF
# ─────────────────────────────────────────────────────────────────────────


class TestReceiptPDF:
    @patch("apps.finance.services.HTML")
    def test_receipt_endpoint(self, mock_html_class, admin_client, payment):
        """GET /finance/payments/<pk>/receipt/ returns PDF."""
        mock_html_class.return_value.write_pdf.return_value = b"%PDF-mock"
        resp = admin_client.get(
            f"/api/v1/finance/payments/{payment.id}/receipt/"
        )
        assert resp.status_code == 200
        assert resp["Content-Type"] == "application/pdf"
        assert b"%PDF-mock" in resp.content

    @patch("apps.finance.services.HTML")
    def test_receipt_filename(self, mock_html_class, admin_client, payment):
        """Receipt filename contains the receipt number."""
        mock_html_class.return_value.write_pdf.return_value = b"%PDF"
        resp = admin_client.get(
            f"/api/v1/finance/payments/{payment.id}/receipt/"
        )
        assert payment.receipt_number.replace(" ", "_") in resp["Content-Disposition"]

    def test_receipt_404(self, admin_client):
        """GET /finance/payments/<bad-uuid>/receipt/ returns 404."""
        import uuid

        resp = admin_client.get(
            f"/api/v1/finance/payments/{uuid.uuid4()}/receipt/"
        )
        assert resp.status_code == 404


# ─────────────────────────────────────────────────────────────────────────
# 5. API Tests — Enrollment CRUD
# ─────────────────────────────────────────────────────────────────────────


class TestEnrollmentAPI:
    def test_create_enrollment(self, admin_client, student_user, fee_structure):
        """POST /finance/enrollments/ creates an enrollment."""
        resp = admin_client.post(
            "/api/v1/finance/enrollments/",
            {
                "student": str(student_user.id),
                "fee_structure": str(fee_structure.id),
                "total_due": "60000.00",
                "due_date": "2026-06-30",
            },
            format="json",
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["status"] == "UNPAID"
        assert data["remaining"] == Decimal("60000.00")

    def test_list_enrollments(self, admin_client, enrollment):
        """GET /finance/enrollments/ lists enrollments."""
        resp = admin_client.get("/api/v1/finance/enrollments/")
        assert resp.status_code == 200
        assert resp.json()["count"] == 1

    def test_list_filter_by_status(self, admin_client, enrollment):
        """GET /finance/enrollments/?status=UNPAID filters correctly."""
        resp = admin_client.get("/api/v1/finance/enrollments/?status=UNPAID")
        assert resp.status_code == 200
        assert resp.json()["count"] == 1

    def test_detail(self, admin_client, enrollment):
        """GET /finance/enrollments/<pk>/ returns enrollment detail."""
        resp = admin_client.get(
            f"/api/v1/finance/enrollments/{enrollment.id}/"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["student_name"] == "Youssef Boudjema"
        assert data["fee_structure_name"] == "Frais de scolarité CEM 2025-2026"

    def test_patch_enrollment(self, admin_client, enrollment):
        """PATCH /finance/enrollments/<pk>/ updates total_due."""
        resp = admin_client.patch(
            f"/api/v1/finance/enrollments/{enrollment.id}/",
            {"total_due": "55000.00"},
            format="json",
        )
        assert resp.status_code == 200
        assert resp.json()["total_due"] == "55000.00"

    def test_delete_enrollment(self, admin_client, enrollment):
        """DELETE /finance/enrollments/<pk>/ soft-deletes."""
        resp = admin_client.delete(
            f"/api/v1/finance/enrollments/{enrollment.id}/"
        )
        assert resp.status_code == 204
        enrollment.refresh_from_db()
        assert enrollment.is_deleted is True

    def test_enrollment_stats(self, admin_client, enrollment):
        """GET /finance/enrollments/stats/ returns aggregate stats."""
        resp = admin_client.get("/api/v1/finance/enrollments/stats/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_enrollments"] == 1
        assert data["unpaid"] == 1
        assert data["total_due"] == Decimal("60000.00")
        assert data["collection_rate"] == 0


# ─────────────────────────────────────────────────────────────────────────
# 6. Celery Task Tests
# ─────────────────────────────────────────────────────────────────────────


class TestCeleryTasks:
    def test_check_expired_payments(self, db, school, student_user, fee_structure, admin_user):
        """check_expired_payments marks expired and notifies admins."""
        from apps.finance.models import StudentPayment
        from apps.finance.tasks import check_expired_payments
        from apps.notifications.models import Notification

        StudentPayment.objects.create(
            school=school,
            student=student_user,
            fee_structure=fee_structure,
            payment_type="mensuel",
            amount_paid=Decimal("8000.00"),
            payment_date=datetime.date(2024, 1, 1),
            period_start=datetime.date(2024, 1, 1),
            period_end=datetime.date(2024, 1, 31),
            payment_method="especes",
            status="actif",  # Force actif despite past date
        )
        # Force status back to actif for the test
        StudentPayment.objects.filter(school=school).update(status="actif")

        result = check_expired_payments()
        assert result["notifications"] >= 1
        notif = Notification.objects.filter(
            school=school, notification_type="PAYMENT"
        ).first()
        assert notif is not None
        assert "expiré" in notif.title

    def test_send_payment_reminders(
        self, db, school, student_user, fee_structure, parent_user
    ):
        """send_payment_reminders notifies parents for expiring payments."""
        from apps.finance.models import StudentPayment
        from apps.finance.tasks import send_payment_reminders
        from apps.notifications.models import Notification

        # Create a payment expiring in 5 days
        today = datetime.date.today()
        StudentPayment.objects.create(
            school=school,
            student=student_user,
            fee_structure=fee_structure,
            payment_type="mensuel",
            amount_paid=Decimal("8000.00"),
            payment_date=today,
            period_start=today,
            period_end=today + datetime.timedelta(days=5),
            payment_method="especes",
        )

        result = send_payment_reminders()
        assert result["reminders_sent"] >= 1
        notif = Notification.objects.filter(
            user=parent_user, notification_type="PAYMENT"
        ).first()
        assert notif is not None
        assert "Rappel" in notif.title

    def test_refresh_enrollment_statuses(self, enrollment):
        """refresh_enrollment_statuses updates UNPAID → LATE if overdue."""
        from apps.finance.models import StudentFeeEnrollment
        from apps.finance.tasks import refresh_enrollment_statuses

        # Set due_date to past so it becomes LATE
        enrollment.due_date = datetime.date(2024, 1, 1)
        enrollment.save(update_fields=["due_date"])

        result = refresh_enrollment_statuses()
        enrollment.refresh_from_db()
        assert enrollment.status == "LATE"
        assert result["updated"] >= 1

    def test_celery_beat_registered(self):
        """All finance tasks are in the celery beat schedule."""
        from ilmi.celery import app

        schedule = app.conf.beat_schedule
        task_names = [v["task"] for v in schedule.values()]
        assert "apps.finance.tasks.check_expired_payments" in task_names
        assert "apps.finance.tasks.send_payment_reminders" in task_names
        assert "apps.finance.tasks.refresh_enrollment_statuses" in task_names


# ─────────────────────────────────────────────────────────────────────────
# 7. CSV/Report Export Test
# ─────────────────────────────────────────────────────────────────────────


class TestReportExport:
    def test_csv_export(self, admin_client, payment):
        """GET /finance/payments/report/?export_format=csv returns CSV."""
        resp = admin_client.get("/api/v1/finance/payments/report/?export_format=csv")
        assert resp.status_code == 200
        assert "text/csv" in resp["Content-Type"]
        content = resp.content.decode("utf-8-sig")
        assert "Youssef" in content

    def test_pdf_export(self, admin_client, payment):
        """GET /finance/payments/report/?export_format=pdf returns HTML."""
        resp = admin_client.get("/api/v1/finance/payments/report/?export_format=pdf")
        assert resp.status_code == 200
        assert "text/html" in resp["Content-Type"]
