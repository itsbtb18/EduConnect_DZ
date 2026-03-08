"""
Tests for multi-tenant isolation, role-based permissions, and Celery tasks.
"""
import pytest
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch
from django.urls import reverse
from rest_framework import status


# ════════════════════════════════════════════════════════════════
# MULTI-TENANT ISOLATION TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestTenantIsolation:
    """Ensure data from school A is invisible to school B."""

    @pytest.fixture
    def school_b(self, db):
        from apps.schools.models import School

        return School.objects.create(
            name="School B",
            subdomain="school-b",
            address="456 Other Street",
            phone="0559876543",
            wilaya="Oran",
            is_active=True,
        )

    @pytest.fixture
    def admin_b(self, db, school_b):
        from apps.accounts.models import User

        return User.objects.create_user(
            phone_number="0556660001",
            password="Test@1234",
            school=school_b,
            role="ADMIN",
            first_name="Admin",
            last_name="SchoolB",
            is_staff=True,
        )

    @pytest.fixture
    def admin_b_client(self, api_client, admin_b):
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=admin_b)
        return client

    def test_fee_structure_isolation(
        self, admin_client, admin_b_client, school, school_b, section, academic_year
    ):
        """Admin of school A cannot see fee structures of school B."""
        from apps.finance.models import FeeStructure
        from apps.schools.models import AcademicYear, Section

        # Create section and year for school B
        section_b = Section.objects.create(
            school=school_b,
            section_type="MIDDLE",
            name="Moyen B",
        )
        year_b = AcademicYear.objects.create(
            school=school_b,
            name="2024-2025",
            start_date="2024-09-08",
            end_date="2025-06-30",
            is_current=True,
        )

        # Create fee in school A
        FeeStructure.objects.create(
            school=school,
            name="School A Fee",
            academic_year=academic_year,
            section=section,
            amount_monthly=Decimal("5000"),
        )
        # Create fee in school B
        FeeStructure.objects.create(
            school=school_b,
            name="School B Fee",
            academic_year=year_b,
            section=section_b,
            amount_monthly=Decimal("7000"),
        )

        # Admin A should only see School A's fee
        url = reverse("fee-structure-list")
        resp_a = admin_client.get(url)
        assert resp_a.status_code == status.HTTP_200_OK
        data_a = resp_a.json()
        results_a = data_a.get("results", data_a) if isinstance(data_a, dict) else data_a
        if isinstance(results_a, list):
            for item in results_a:
                assert "School B Fee" not in str(item.get("name", ""))

    def test_students_not_visible_across_schools(
        self, admin_client, admin_b_client, school, school_b
    ):
        """Admin B cannot access School A's students via user list."""
        url = reverse("user-list-create")
        resp = admin_b_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        results = data.get("results", data) if isinstance(data, dict) else data
        # None of the results should be from school A
        if isinstance(results, list):
            for user_data in results:
                if "school" in user_data:
                    assert str(user_data["school"]) != str(school.pk)


# ════════════════════════════════════════════════════════════════
# ROLE-BASED PERMISSION TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestRolePermissions:
    """Test that each role has appropriate access."""

    def test_student_cannot_manage_users(self, student_client):
        url = reverse("user-list-create")
        resp = student_client.get(url)
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_parent_cannot_mark_attendance(self, school, parent_user, classroom):
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=parent_user)
        url = reverse("attendance-mark")
        resp = client.post(
            url,
            {
                "classroom": str(classroom.pk),
                "date": str(date.today()),
                "period": "MORNING",
                "records": [],
            },
            format="json",
        )
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_teacher_cannot_manage_finance(self, teacher_client):
        url = reverse("fee-structure-list")
        resp = teacher_client.get(url)
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)

    def test_admin_can_access_all_modules(self, admin_client):
        """Admin has broad access."""
        endpoints = [
            reverse("user-list-create"),
            reverse("fee-structure-list"),
            reverse("exam-type-list"),
        ]
        for url in endpoints:
            resp = admin_client.get(url)
            assert resp.status_code == status.HTTP_200_OK, f"Failed for {url}"

    def test_student_can_view_own_attendance(self, student_client):
        url = reverse("student-attendance")
        resp = student_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_unauthenticated_blocked_everywhere(self, api_client):
        protected = [
            reverse("me"),
            reverse("user-list-create"),
            reverse("fee-structure-list"),
            reverse("exam-type-list"),
        ]
        for url in protected:
            resp = api_client.get(url)
            assert resp.status_code == status.HTTP_401_UNAUTHORIZED, f"Open: {url}"


# ════════════════════════════════════════════════════════════════
# CELERY TASK TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
@pytest.mark.celery
class TestCeleryTasks:
    """Test Celery tasks run without errors (mocking external I/O)."""

    @patch("apps.finance.tasks._send_fcm_for_users")
    @patch("apps.finance.tasks._send_fcm_for_user")
    def test_check_expired_payments(self, mock_fcm_user, mock_fcm_users):
        from apps.finance.tasks import check_expired_payments

        result = check_expired_payments()
        # Should complete without error, returns None or info string
        assert result is None or isinstance(result, (str, dict, int))

    @patch("apps.finance.tasks._send_fcm_for_user")
    def test_send_payment_reminders(self, mock_fcm):
        from apps.finance.tasks import send_payment_reminders

        result = send_payment_reminders()
        assert result is None or isinstance(result, (str, dict, int))

    def test_refresh_enrollment_statuses(self):
        from apps.finance.tasks import refresh_enrollment_statuses

        result = refresh_enrollment_statuses()
        assert result is None or isinstance(result, (str, dict, int))

    @patch("apps.attendance.tasks._send_fcm_for_user")
    @patch("apps.attendance.tasks._send_fcm_for_users")
    @patch("apps.attendance.tasks._push_ws_notification")
    def test_detect_chronic_absenteeism(
        self, mock_ws, mock_fcm_users, mock_fcm_user
    ):
        from apps.attendance.tasks import detect_chronic_absenteeism

        result = detect_chronic_absenteeism()
        assert result is None or isinstance(result, (str, dict, int))

    @patch("apps.attendance.tasks._send_fcm_for_users")
    def test_daily_absence_summary(self, mock_fcm):
        from apps.attendance.tasks import daily_absence_summary

        result = daily_absence_summary()
        assert result is None or isinstance(result, (str, dict, int))

    @patch("apps.finance.tasks._send_fcm_for_user")
    def test_generate_monthly_payslips(self, mock_fcm):
        from apps.finance.tasks import generate_monthly_payslips

        result = generate_monthly_payslips()
        assert result is None or isinstance(result, (str, dict, int))

    # ── Chat / Announcements tasks ──

    def test_publish_scheduled_announcements(self):
        from apps.chat.tasks import publish_scheduled_announcements

        result = publish_scheduled_announcements()
        assert result is None or isinstance(result, (str, dict, int))

    @patch("apps.chat.tasks.send_offline_fcm_push.delay")
    def test_send_announcement_notification(self, mock_push, school, admin_user):
        from apps.announcements.models import Announcement
        from apps.chat.tasks import send_announcement_notification

        ann = Announcement.objects.create(
            school=school, author=admin_user,
            title="Celery Test", body="Testing task.", target_audience="ALL",
        )
        result = send_announcement_notification(str(ann.pk))
        assert result is None or isinstance(result, (str, dict, int))

    def test_send_event_reminders(self):
        from apps.announcements.tasks import send_event_reminders

        result = send_event_reminders()
        assert result is None or isinstance(result, (str, dict, int))
