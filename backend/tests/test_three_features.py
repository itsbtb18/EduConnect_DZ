"""
Tests for the three major features:
1. StudentParentCreationService
2. Bulk Student Import (endpoint + Celery task + progress)
3. Student ID Card endpoint

Uses factory_boy + APITestCase, following the same patterns as
test_tenant_isolation.py.
"""

import datetime
import io
import uuid

import factory
from factory.django import DjangoModelFactory
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from apps.accounts.models import BulkImportJob, User
from apps.academics.models import (
    Class,
    Level,
    ParentProfile,
    StudentProfile,
)
from apps.schools.models import AcademicYear, School, Section


# ═══════════════════════════════════════════════════════════════════════════
# Factories
# ═══════════════════════════════════════════════════════════════════════════


class SchoolFactory(DjangoModelFactory):
    class Meta:
        model = School

    name = factory.Sequence(lambda n: f"School {n}")
    subdomain = factory.Sequence(lambda n: f"school-{n}")


class SectionFactory(DjangoModelFactory):
    class Meta:
        model = Section

    school = factory.SubFactory(SchoolFactory)
    section_type = "MIDDLE"
    name = factory.LazyAttribute(lambda o: f"{o.school.name} — Middle")


class AcademicYearFactory(DjangoModelFactory):
    class Meta:
        model = AcademicYear

    school = factory.SubFactory(SchoolFactory)
    section = factory.SubFactory(SectionFactory)
    name = factory.Sequence(lambda n: f"2024-{2025 + n}")
    start_date = datetime.date(2024, 9, 8)
    end_date = datetime.date(2025, 6, 30)
    is_current = True


class LevelFactory(DjangoModelFactory):
    class Meta:
        model = Level

    school = factory.SubFactory(SchoolFactory)
    section = factory.SubFactory(SectionFactory)
    name = "3ème Année Moyenne"
    code = factory.Sequence(lambda n: f"3MS-{n}")
    order = 3
    max_grade = 20
    passing_grade = 10


class ClassFactory(DjangoModelFactory):
    class Meta:
        model = Class

    school = factory.SubFactory(SchoolFactory)
    section = factory.SubFactory(SectionFactory)
    academic_year = factory.SubFactory(AcademicYearFactory)
    level = factory.SubFactory(LevelFactory)
    name = factory.Sequence(lambda n: f"Class-{n}")


class UserFactory(DjangoModelFactory):
    class Meta:
        model = User

    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    phone_number = factory.Sequence(lambda n: f"05{n:08d}")
    is_active = True
    role = User.Role.ADMIN
    password = factory.PostGenerationMethodCall("set_password", "Test@1234")


# ═══════════════════════════════════════════════════════════════════════════
# 1. StudentParentCreationService  Tests
# ═══════════════════════════════════════════════════════════════════════════


class StudentParentCreationServiceTest(APITestCase):
    """Test all cases for the StudentParentCreationService."""

    def setUp(self):
        self.school = SchoolFactory()
        self.section = SectionFactory(school=self.school)
        self.academic_year = AcademicYearFactory(
            school=self.school, section=self.section
        )
        self.level = LevelFactory(
            school=self.school, section=self.section
        )
        self.klass = ClassFactory(
            school=self.school,
            section=self.section,
            academic_year=self.academic_year,
            level=self.level,
            name="3AM-A",
        )
        self.admin = UserFactory(school=self.school, role=User.Role.ADMIN)

    def _get_service(self):
        from apps.accounts.services import StudentParentCreationService

        return StudentParentCreationService(
            school=self.school, created_by=self.admin
        )

    # ── Single parent ──────────────────────────────────────────────────

    def test_create_student_with_one_parent(self):
        """Creating a student with a parent phone creates both accounts."""
        svc = self._get_service()
        result = svc.create_student_with_parents(
            first_name="Ahmed",
            last_name="Benali",
            current_class=self.klass,
            parent_phone="0555111111",
            parent_first_name="Karim",
            parent_last_name="Benali",
            parent_relationship="FATHER",
        )

        self.assertTrue(result.ok)
        self.assertIsNotNone(result.student_user)
        self.assertEqual(result.student_user.role, User.Role.STUDENT)
        self.assertEqual(result.student_user.school, self.school)
        self.assertEqual(len(result.parent_results), 1)

        pr = result.parent_results[0]
        self.assertFalse(pr.was_existing)
        self.assertEqual(pr.user.phone_number, "0555111111")
        self.assertEqual(pr.user.role, User.Role.PARENT)
        self.assertEqual(pr.profile.relationship, "FATHER")
        self.assertIn(
            result.student_profile,
            pr.profile.children.all(),
        )

    # ── Two parents (father + mother) ──────────────────────────────────

    def test_create_student_with_two_parents(self):
        """Father and mother get separate accounts linked to the same child."""
        svc = self._get_service()
        result = svc.create_student_with_parents(
            first_name="Youssef",
            last_name="Khaled",
            current_class=self.klass,
            parent_phone="0555222222",
            parent_first_name="Omar",
            parent_last_name="Khaled",
            parent_relationship="FATHER",
            second_parent_phone="0555333333",
            second_parent_first_name="Fatima",
            second_parent_last_name="Khaled",
            second_parent_relationship="MOTHER",
        )

        self.assertTrue(result.ok)
        self.assertEqual(len(result.parent_results), 2)

        father = result.parent_results[0]
        mother = result.parent_results[1]

        self.assertEqual(father.profile.relationship, "FATHER")
        self.assertEqual(mother.profile.relationship, "MOTHER")
        self.assertNotEqual(father.user.pk, mother.user.pk)

        # Both linked to the student
        student_profile = result.student_profile
        self.assertIn(student_profile, father.profile.children.all())
        self.assertIn(student_profile, mother.profile.children.all())

    # ── Phone deduplication ────────────────────────────────────────────

    def test_phone_deduplication_links_existing_parent(self):
        """If a parent with the same phone exists, link instead of creating."""
        svc = self._get_service()

        # First student → creates parent
        r1 = svc.create_student_with_parents(
            first_name="Ali",
            last_name="Mansour",
            current_class=self.klass,
            parent_phone="0555444444",
            parent_first_name="Hassan",
            parent_last_name="Mansour",
            parent_relationship="FATHER",
        )
        parent_user_id = r1.parent_results[0].user.pk

        # Second student with same parent phone → should link, not create
        r2 = svc.create_student_with_parents(
            first_name="Sara",
            last_name="Mansour",
            current_class=self.klass,
            parent_phone="0555444444",
            parent_first_name="Hassan",
            parent_last_name="Mansour",
            parent_relationship="FATHER",
        )

        self.assertTrue(r2.ok)
        self.assertEqual(len(r2.parent_results), 1)
        pr2 = r2.parent_results[0]
        self.assertTrue(pr2.was_existing)
        self.assertEqual(pr2.user.pk, parent_user_id)

        # Parent should now have 2 children
        parent_profile = ParentProfile.objects.get(user_id=parent_user_id)
        self.assertEqual(parent_profile.children.count(), 2)

    # ── No parent phone → no parent created ────────────────────────────

    def test_create_student_without_parent(self):
        """If no parent phone → student is created alone."""
        svc = self._get_service()
        result = svc.create_student_with_parents(
            first_name="Nour",
            last_name="Amine",
            current_class=self.klass,
        )

        self.assertTrue(result.ok)
        self.assertEqual(len(result.parent_results), 0)

    # ── Student profile fields ─────────────────────────────────────────

    def test_student_profile_has_class_and_dob(self):
        """StudentProfile gets current_class and date_of_birth."""
        svc = self._get_service()
        result = svc.create_student_with_parents(
            first_name="Lina",
            last_name="Tazi",
            current_class=self.klass,
            date_of_birth=datetime.date(2012, 3, 15),
        )

        self.assertTrue(result.ok)
        profile = result.student_profile
        self.assertEqual(profile.current_class, self.klass)
        self.assertEqual(profile.date_of_birth, datetime.date(2012, 3, 15))

    # ── Idempotent linking ─────────────────────────────────────────────

    def test_link_parent_to_existing_student_is_idempotent(self):
        """Linking the same parent twice doesn't duplicate M2M entries."""
        svc = self._get_service()
        result = svc.create_student_with_parents(
            first_name="Amine",
            last_name="Saidi",
            current_class=self.klass,
            parent_phone="0555555555",
            parent_first_name="Rachid",
            parent_last_name="Saidi",
            parent_relationship="FATHER",
        )

        parent_profile = result.parent_results[0].profile
        student_profile = result.student_profile

        # Link again
        svc.link_parent_to_student(
            student_profile=student_profile,
            parent_phone="0555555555",
            parent_first_name="Rachid",
            parent_last_name="Saidi",
        )

        # Should still have exactly 1 child
        self.assertEqual(parent_profile.children.count(), 1)


# ═══════════════════════════════════════════════════════════════════════════
# 2. Bulk Import Endpoint Tests
# ═══════════════════════════════════════════════════════════════════════════


class BulkImportEndpointTest(APITestCase):
    """Test the upload, progress, and template download endpoints."""

    def setUp(self):
        self.school = SchoolFactory()
        self.section = SectionFactory(
            school=self.school,
            section_type=Section.SectionType.MIDDLE,
        )
        self.academic_year = AcademicYearFactory(
            school=self.school, section=self.section
        )
        self.level = LevelFactory(
            school=self.school, section=self.section
        )
        self.klass = ClassFactory(
            school=self.school,
            section=self.section,
            academic_year=self.academic_year,
            level=self.level,
            name="3AM-A",
        )
        self.admin = UserFactory(school=self.school, role=User.Role.ADMIN)

        self.client = APIClient()
        self.client.force_authenticate(user=self.admin)

    def _make_xlsx(self, rows):
        """Create an in-memory .xlsx file with the given rows."""
        import openpyxl

        wb = openpyxl.Workbook()
        ws = wb.active
        headers = [
            "student_first_name",
            "student_last_name",
            "date_of_birth",
            "class_name",
            "section_type",
            "parent_phone",
            "parent_first_name",
            "parent_last_name",
        ]
        ws.append(headers)
        for row in rows:
            ws.append(row)

        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)
        buf.name = "import.xlsx"
        return buf

    # ── Upload creates job ─────────────────────────────────────────────

    def test_upload_creates_job(self):
        """POST /api/v1/auth/students/bulk-import/ creates a BulkImportJob."""
        from unittest.mock import patch

        xlsx = self._make_xlsx([
            ["Ahmed", "Test", "2012-01-01", "3AM-A", "MIDDLE", "0555999999", "Parent", "Test"],
        ])

        with patch("apps.accounts.views_bulk_import.bulk_import_students") as mock_task:
            mock_task.delay.return_value.id = "fake-task-id"
            resp = self.client.post(
                "/api/v1/auth/students/bulk-import/",
                {"file": xlsx},
                format="multipart",
            )

        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        data = resp.json()
        self.assertIn("id", data)
        self.assertEqual(data["status"], "PENDING")

        # Job exists in DB
        self.assertTrue(BulkImportJob.objects.filter(pk=data["id"]).exists())
        mock_task.delay.assert_called_once_with(data["id"])

    # ── Reject non-xlsx ────────────────────────────────────────────────

    def test_reject_non_xlsx(self):
        """Non-xlsx files should be rejected."""
        buf = io.BytesIO(b"not an excel file")
        buf.name = "import.csv"

        resp = self.client.post(
            "/api/v1/auth/students/bulk-import/",
            {"file": buf},
            format="multipart",
        )

        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Template download ──────────────────────────────────────────────

    def test_template_download(self):
        """GET /api/v1/auth/students/bulk-import/template/ returns xlsx."""
        resp = self.client.get("/api/v1/auth/students/bulk-import/template/")

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn(
            "spreadsheetml",
            resp["Content-Type"],
        )
        self.assertIn(
            "attachment",
            resp["Content-Disposition"],
        )

    # ── Progress endpoint ──────────────────────────────────────────────

    def test_progress_returns_job_data(self):
        """GET /api/v1/auth/students/bulk-import/<id>/progress/ returns job."""
        job = BulkImportJob.objects.create(
            school=self.school,
            uploaded_by=self.admin,
            file="dummy.xlsx",
            total_rows=10,
            processed_rows=5,
            created_count=4,
            linked_count=1,
        )

        resp = self.client.get(
            f"/api/v1/auth/students/bulk-import/{job.pk}/progress/"
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()
        self.assertEqual(data["total_rows"], 10)
        self.assertEqual(data["processed_rows"], 5)
        self.assertEqual(data["created_count"], 4)
        self.assertEqual(data["progress_pct"], 50)

    # ── Cross-school denied ────────────────────────────────────────────

    def test_progress_cross_school_denied(self):
        """Admin from school B cannot see school A's import job."""
        other_school = SchoolFactory()
        other_admin = UserFactory(school=other_school, role=User.Role.ADMIN)

        job = BulkImportJob.objects.create(
            school=self.school,
            uploaded_by=self.admin,
            file="dummy.xlsx",
        )

        client_b = APIClient()
        client_b.force_authenticate(user=other_admin)

        resp = client_b.get(
            f"/api/v1/auth/students/bulk-import/{job.pk}/progress/"
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # ── Non-admin rejected ─────────────────────────────────────────────

    def test_student_cannot_upload(self):
        """STUDENT role should not access bulk import."""
        student = UserFactory(school=self.school, role=User.Role.STUDENT)
        client = APIClient()
        client.force_authenticate(user=student)

        resp = client.get("/api/v1/auth/students/bulk-import/template/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)


# ═══════════════════════════════════════════════════════════════════════════
# 3. Student ID Card Endpoint Tests
# ═══════════════════════════════════════════════════════════════════════════


class StudentCardEndpointTest(APITestCase):
    """Test GET /api/v1/academics/students/<uuid>/card/."""

    def setUp(self):
        self.school = SchoolFactory(
            motto="Savoir c'est pouvoir",
            address="123 Rue de Test, Alger",
        )
        self.section = SectionFactory(
            school=self.school,
            section_type=Section.SectionType.MIDDLE,
        )
        self.academic_year = AcademicYearFactory(
            school=self.school, section=self.section
        )
        self.level = LevelFactory(
            school=self.school, section=self.section
        )
        self.klass = ClassFactory(
            school=self.school,
            section=self.section,
            academic_year=self.academic_year,
            level=self.level,
            name="3AM-A",
        )
        self.admin = UserFactory(school=self.school, role=User.Role.ADMIN)
        self.student = UserFactory(
            school=self.school,
            role=User.Role.STUDENT,
            first_name="Ahmed",
            last_name="Benali",
        )
        # Ensure student profile exists and has a class
        profile, _ = StudentProfile.objects.get_or_create(user=self.student)
        profile.current_class = self.klass
        profile.student_id = "STU-001"
        profile.date_of_birth = datetime.date(2012, 5, 10)
        profile.save()
        self.student_profile = profile

    # ── Admin can fetch student card ───────────────────────────────────

    def test_admin_gets_student_card(self):
        """Admin from the same school can retrieve a student's card data."""
        client = APIClient()
        client.force_authenticate(user=self.admin)

        resp = client.get(
            f"/api/v1/academics/students/{self.student.pk}/card/"
        )

        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        data = resp.json()

        self.assertEqual(data["full_name"], "Ahmed Benali")
        self.assertEqual(data["student_id"], "STU-001")
        self.assertEqual(data["class_name"], "3AM-A")
        self.assertEqual(data["date_of_birth"], "2012-05-10")
        self.assertIn("qr_code_base64", data)
        self.assertTrue(data["qr_code_base64"].startswith("data:image/png;base64,"))
        self.assertEqual(data["school"]["name"], self.school.name)
        self.assertEqual(data["school"]["motto"], "Savoir c'est pouvoir")

    # ── Student can see own card ───────────────────────────────────────

    def test_student_gets_own_card(self):
        """Students can view their own card."""
        client = APIClient()
        client.force_authenticate(user=self.student)

        resp = client.get(
            f"/api/v1/academics/students/{self.student.pk}/card/"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    # ── Cross-school admin denied ──────────────────────────────────────

    def test_cross_school_admin_denied(self):
        """Admin from another school gets 404."""
        other_school = SchoolFactory()
        other_admin = UserFactory(school=other_school, role=User.Role.ADMIN)

        client = APIClient()
        client.force_authenticate(user=other_admin)

        resp = client.get(
            f"/api/v1/academics/students/{self.student.pk}/card/"
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # ── Non-existent student → 404 ─────────────────────────────────────

    def test_nonexistent_student_404(self):
        """Requesting a card for a UUID that doesn't exist → 404."""
        client = APIClient()
        client.force_authenticate(user=self.admin)

        fake_id = uuid.uuid4()
        resp = client.get(f"/api/v1/academics/students/{fake_id}/card/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # ── Card has QR data matching format ───────────────────────────────

    def test_qr_data_format(self):
        """QR data should match ILMI-STU-{student_id}-{subdomain}."""
        client = APIClient()
        client.force_authenticate(user=self.admin)

        resp = client.get(
            f"/api/v1/academics/students/{self.student.pk}/card/"
        )

        data = resp.json()
        expected_qr = f"ILMI-STU-STU-001-{self.school.subdomain}"
        self.assertEqual(data["qr_data"], expected_qr)

    # ── Unauthenticated → 401 ─────────────────────────────────────────

    def test_unauthenticated_denied(self):
        """No token → 401."""
        client = APIClient()
        resp = client.get(
            f"/api/v1/academics/students/{self.student.pk}/card/"
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
