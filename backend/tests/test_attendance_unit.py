"""
Tests for the attendance app — models, endpoints, excuse workflow.
"""
import pytest
from datetime import date
from django.urls import reverse
from rest_framework import status


# ════════════════════════════════════════════════════════════════
# MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestAttendanceRecordModel:
    """Tests for AttendanceRecord model."""

    def test_create_record(self, school, student_user, classroom, academic_year):
        from apps.attendance.models import AttendanceRecord

        record = AttendanceRecord.objects.create(
            school=school,
            student=student_user.student_profile,
            class_obj=classroom,
            academic_year=academic_year,
            date=date.today(),
            period="MORNING",
            status="PRESENT",
        )
        assert record.pk is not None
        assert record.status == "PRESENT"
        assert not record.is_justified

    def test_mark_absent(self, school, student_user, classroom, academic_year):
        from apps.attendance.models import AttendanceRecord

        record = AttendanceRecord.objects.create(
            school=school,
            student=student_user.student_profile,
            class_obj=classroom,
            academic_year=academic_year,
            date=date.today(),
            period="AFTERNOON",
            status="ABSENT",
        )
        assert record.status == "ABSENT"
        assert not record.is_justified

    def test_justify_absence(
        self, school, student_user, classroom, academic_year, admin_user
    ):
        from apps.attendance.models import AttendanceRecord

        record = AttendanceRecord.objects.create(
            school=school,
            student=student_user.student_profile,
            class_obj=classroom,
            academic_year=academic_year,
            date=date.today(),
            period="MORNING",
            status="ABSENT",
        )
        record.justify(by=admin_user, note="Medical certificate")
        record.refresh_from_db()
        assert record.is_justified
        assert record.justified_by == admin_user


@pytest.mark.django_db
class TestAbsenceExcuseModel:
    """Tests for the AbsenceExcuse workflow."""

    def test_create_excuse(
        self, school, student_user, classroom, academic_year, parent_user
    ):
        from apps.attendance.models import AttendanceRecord, AbsenceExcuse

        rec = AttendanceRecord.objects.create(
            school=school,
            student=student_user.student_profile,
            class_obj=classroom,
            academic_year=academic_year,
            date=date.today(),
            period="MORNING",
            status="ABSENT",
        )
        excuse = AbsenceExcuse.objects.create(
            attendance_record=rec,
            submitted_by=parent_user,
            justification_text="Child was sick",
        )
        assert excuse.status == "PENDING"

    def test_approve_excuse(
        self, school, student_user, classroom, academic_year, parent_user, admin_user
    ):
        from apps.attendance.models import AttendanceRecord, AbsenceExcuse

        rec = AttendanceRecord.objects.create(
            school=school,
            student=student_user.student_profile,
            class_obj=classroom,
            academic_year=academic_year,
            date=date.today(),
            period="MORNING",
            status="ABSENT",
        )
        excuse = AbsenceExcuse.objects.create(
            attendance_record=rec,
            submitted_by=parent_user,
            justification_text="Sick",
        )
        excuse.status = "APPROVED"
        excuse.reviewed_by = admin_user
        excuse.save()
        assert excuse.status == "APPROVED"


# ════════════════════════════════════════════════════════════════
# ENDPOINT TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestAttendanceEndpoints:
    """Tests for attendance REST endpoints."""

    def test_mark_attendance_as_teacher(
        self, teacher_client, classroom, student_user, academic_year, teacher_assignment
    ):
        url = reverse("attendance-mark")
        resp = teacher_client.post(
            url,
            {
                "classroom": str(classroom.pk),
                "date": str(date.today()),
                "period": "MORNING",
                "records": [
                    {
                        "student": str(student_user.student_profile.pk),
                        "status": "PRESENT",
                    }
                ],
            },
            format="json",
        )
        assert resp.status_code in (
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
        )

    def test_mark_attendance_as_student_forbidden(
        self, student_client, classroom
    ):
        url = reverse("attendance-mark")
        resp = student_client.post(
            url,
            {
                "classroom": str(classroom.pk),
                "date": str(date.today()),
                "period": "MORNING",
                "records": [],
            },
            format="json",
        )
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )

    def test_list_attendance_unauthenticated(self, api_client):
        url = reverse("attendance-list")
        resp = api_client.get(url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_student_views_own_attendance(self, student_client):
        url = reverse("student-attendance")
        resp = student_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
