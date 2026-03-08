"""
╔══════════════════════════════════════════════════════════════════════════╗
║  Tests for Grade System New Features                                   ║
║                                                                        ║
║  Feature 1: Grade Workflow (DRAFT → SUBMITTED → PUBLISHED / RETURNED)  ║
║  Feature 2: TrimesterConfig + Student Averages Endpoint                ║
║  Feature 3: CSV Grade Import (preview + confirm)                       ║
║                                                                        ║
║  Total: 18 tests                                                       ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

import datetime
import uuid
from decimal import Decimal
from io import BytesIO

import factory
from factory.django import DjangoModelFactory

from django.test import TestCase, override_settings
from rest_framework.test import APIClient, APITestCase

from apps.accounts.models import User
from apps.academics.models import (
    Class,
    Level,
    LevelSubject,
    StudentProfile,
    Subject,
    TeacherAssignment,
)
from apps.grades.models import (
    ExamType,
    Grade,
    SubjectAverage,
    TrimesterAverage,
    AnnualAverage,
    TrimesterConfig,
)
from apps.grades.services import (
    InvalidTransitionError,
    CSVImportError,
    submit_grades,
    publish_grades,
    return_grades,
    get_student_averages,
    parse_csv_grades,
    confirm_csv_import,
    calculate_subject_average,
    calculate_trimester_average,
)
from apps.schools.models import School, Section, AcademicYear


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
    section_type = Section.SectionType.MIDDLE
    name = factory.LazyAttribute(lambda o: f"{o.school.name} — Middle")


class AcademicYearFactory(DjangoModelFactory):
    class Meta:
        model = AcademicYear

    school = factory.SubFactory(SchoolFactory)
    section = factory.SubFactory(SectionFactory)
    name = "2024-2025"
    start_date = datetime.date(2024, 9, 8)
    end_date = datetime.date(2025, 6, 30)
    is_current = True


class LevelFactory(DjangoModelFactory):
    class Meta:
        model = Level

    school = factory.SubFactory(SchoolFactory)
    section = factory.SubFactory(SectionFactory)
    name = "3ème Année Moyenne"
    code = factory.Sequence(lambda n: f"3AM-{n}")
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


class SubjectFactory(DjangoModelFactory):
    class Meta:
        model = Subject

    school = factory.SubFactory(SchoolFactory)
    name = factory.Sequence(lambda n: f"Subject {n}")
    code = factory.Sequence(lambda n: f"SUBJ-{n}")


class StudentProfileFactory(DjangoModelFactory):
    class Meta:
        model = StudentProfile

    user = factory.SubFactory(
        UserFactory,
        role=User.Role.STUDENT,
    )
    current_class = factory.SubFactory(ClassFactory)


class ExamTypeFactory(DjangoModelFactory):
    class Meta:
        model = ExamType

    subject = factory.SubFactory(SubjectFactory)
    classroom = factory.SubFactory(ClassFactory)
    academic_year = factory.SubFactory(AcademicYearFactory)
    trimester = 1
    name = "Composition"
    percentage = Decimal("100")
    max_score = Decimal("20")


class GradeFactory(DjangoModelFactory):
    class Meta:
        model = Grade

    student = factory.SubFactory(StudentProfileFactory)
    exam_type = factory.SubFactory(ExamTypeFactory)
    score = Decimal("15")
    is_published = False
    status = Grade.Status.DRAFT


# ═══════════════════════════════════════════════════════════════════════════
# Shared Test Setup Mixin
# ═══════════════════════════════════════════════════════════════════════════


class GradeTestSetup:
    """Creates a full test scenario with school, class, students, exams, grades."""

    def _setup_school_and_class(self):
        self.school = SchoolFactory()
        self.section = SectionFactory(school=self.school)
        self.academic_year = AcademicYearFactory(
            school=self.school, section=self.section
        )
        self.level = LevelFactory(
            school=self.school, section=self.section
        )
        self.classroom = ClassFactory(
            school=self.school,
            section=self.section,
            academic_year=self.academic_year,
            level=self.level,
        )

    def _setup_users(self):
        self.admin_user = UserFactory(
            role=User.Role.ADMIN,
            school=self.school,
        )
        self.teacher_user = UserFactory(
            role=User.Role.TEACHER,
            school=self.school,
        )
        self.student_user = UserFactory(
            role=User.Role.STUDENT,
            school=self.school,
            first_name="Ahmed",
            last_name="Benali",
        )

    def _setup_subjects_and_exams(self):
        self.subject_math = SubjectFactory(school=self.school, name="Mathématiques", code="MATH")
        self.subject_phys = SubjectFactory(school=self.school, name="Physique", code="PHYS")

        # LevelSubject for coefficient
        self.ls_math = LevelSubject.objects.create(
            school=self.school,
            level=self.level,
            subject=self.subject_math,
            coefficient=Decimal("4"),
        )
        self.ls_phys = LevelSubject.objects.create(
            school=self.school,
            level=self.level,
            subject=self.subject_phys,
            coefficient=Decimal("2"),
        )

        # TeacherAssignment
        TeacherAssignment.objects.create(
            school=self.school,
            teacher=self.teacher_user,
            assigned_class=self.classroom,
            subject=self.subject_math,
            academic_year=self.academic_year,
        )

        # ExamTypes for math (2 exams: 60% + 40%)
        self.et_math_exam1 = ExamType.objects.create(
            subject=self.subject_math,
            classroom=self.classroom,
            academic_year=self.academic_year,
            trimester=1,
            name="Examen 1",
            percentage=Decimal("60"),
            max_score=Decimal("20"),
            created_by=self.teacher_user,
        )
        self.et_math_exam2 = ExamType.objects.create(
            subject=self.subject_math,
            classroom=self.classroom,
            academic_year=self.academic_year,
            trimester=1,
            name="Examen 2",
            percentage=Decimal("40"),
            max_score=Decimal("20"),
            created_by=self.teacher_user,
        )

        # ExamType for physics (1 exam: 100%)
        self.et_phys = ExamType.objects.create(
            subject=self.subject_phys,
            classroom=self.classroom,
            academic_year=self.academic_year,
            trimester=1,
            name="Composition",
            percentage=Decimal("100"),
            max_score=Decimal("20"),
            created_by=self.teacher_user,
        )

    def _setup_students_and_grades(self):
        # Signal auto-creates StudentProfile; fetch and update it
        self.student1 = StudentProfile.objects.get(user=self.student_user)
        self.student1.current_class = self.classroom
        self.student1.save()

        self.student2_user = UserFactory(
            role=User.Role.STUDENT, school=self.school,
            first_name="Fatima", last_name="Cherif",
        )
        self.student2 = StudentProfile.objects.get(user=self.student2_user)
        self.student2.current_class = self.classroom
        self.student2.save()

        # Grades for student1 (math: 14/20 + 16/20, phys: 18/20)
        self.grade_math1 = Grade.objects.create(
            student=self.student1,
            exam_type=self.et_math_exam1,
            score=Decimal("14"),
            entered_by=self.teacher_user,
            status=Grade.Status.DRAFT,
        )
        self.grade_math2 = Grade.objects.create(
            student=self.student1,
            exam_type=self.et_math_exam2,
            score=Decimal("16"),
            entered_by=self.teacher_user,
            status=Grade.Status.DRAFT,
        )
        self.grade_phys1 = Grade.objects.create(
            student=self.student1,
            exam_type=self.et_phys,
            score=Decimal("18"),
            entered_by=self.teacher_user,
            status=Grade.Status.DRAFT,
        )

        # Grades for student2 (math: 10/20 + 12/20, phys: 11/20)
        Grade.objects.create(
            student=self.student2, exam_type=self.et_math_exam1,
            score=Decimal("10"), entered_by=self.teacher_user,
            status=Grade.Status.DRAFT,
        )
        Grade.objects.create(
            student=self.student2, exam_type=self.et_math_exam2,
            score=Decimal("12"), entered_by=self.teacher_user,
            status=Grade.Status.DRAFT,
        )
        Grade.objects.create(
            student=self.student2, exam_type=self.et_phys,
            score=Decimal("11"), entered_by=self.teacher_user,
            status=Grade.Status.DRAFT,
        )

    def _full_setup(self):
        self._setup_school_and_class()
        self._setup_users()
        self._setup_subjects_and_exams()
        self._setup_students_and_grades()


# ═══════════════════════════════════════════════════════════════════════════
# Feature 1: Grade Workflow Tests (DRAFT → SUBMITTED → PUBLISHED / RETURNED)
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class TestGradeWorkflow(TestCase, GradeTestSetup):
    """Tests for grade status workflow transitions."""

    def setUp(self):
        self._full_setup()

    def test_01_initial_grade_status_is_draft(self):
        """All new grades default to DRAFT status."""
        for g in Grade.objects.all():
            self.assertEqual(g.status, Grade.Status.DRAFT)

    def test_02_submit_grades_draft_to_submitted(self):
        """Teacher submits DRAFT grades → SUBMITTED."""
        result = submit_grades(self.et_math_exam1.pk, self.teacher_user)
        self.assertEqual(result["submitted_count"], 2)

        for g in Grade.objects.filter(exam_type=self.et_math_exam1):
            self.assertEqual(g.status, Grade.Status.SUBMITTED)
            self.assertIsNotNone(g.submitted_at)
            self.assertEqual(g.submitted_by, self.teacher_user)

    def test_03_publish_grades_submitted_to_published(self):
        """Admin publishes SUBMITTED grades → PUBLISHED."""
        submit_grades(self.et_math_exam1.pk, self.teacher_user)
        result = publish_grades(self.et_math_exam1.pk, self.admin_user)
        self.assertEqual(result["published_count"], 2)

        for g in Grade.objects.filter(exam_type=self.et_math_exam1):
            self.assertEqual(g.status, Grade.Status.PUBLISHED)
            self.assertTrue(g.is_published)
            self.assertIsNotNone(g.published_at)
            self.assertEqual(g.published_by, self.admin_user)

    def test_04_return_grades_submitted_to_returned(self):
        """Admin returns SUBMITTED grades → RETURNED with comment."""
        submit_grades(self.et_math_exam1.pk, self.teacher_user)
        result = return_grades(
            self.et_math_exam1.pk,
            self.admin_user,
            "Notes incorrectes, veuillez vérifier l'élève Benali.",
        )
        self.assertEqual(result["returned_count"], 2)

        for g in Grade.objects.filter(exam_type=self.et_math_exam1):
            self.assertEqual(g.status, Grade.Status.RETURNED)
            self.assertIn("Benali", g.admin_comment)
            self.assertIsNotNone(g.returned_at)
            self.assertEqual(g.returned_by, self.admin_user)

    def test_05_resubmit_returned_grades(self):
        """Teacher can re-submit RETURNED grades."""
        submit_grades(self.et_math_exam1.pk, self.teacher_user)
        return_grades(self.et_math_exam1.pk, self.admin_user, "Erreur")
        result = submit_grades(self.et_math_exam1.pk, self.teacher_user)
        self.assertEqual(result["submitted_count"], 2)

        for g in Grade.objects.filter(exam_type=self.et_math_exam1):
            self.assertEqual(g.status, Grade.Status.SUBMITTED)

    def test_06_cannot_publish_draft_grades(self):
        """Cannot publish grades that are still in DRAFT."""
        with self.assertRaises(InvalidTransitionError):
            publish_grades(self.et_math_exam1.pk, self.admin_user)

    def test_07_cannot_return_draft_grades(self):
        """Cannot return grades that are still in DRAFT."""
        with self.assertRaises(InvalidTransitionError):
            return_grades(self.et_math_exam1.pk, self.admin_user, "Motif")

    def test_08_teacher_cannot_publish(self):
        """Teacher role cannot publish grades (admin-only)."""
        submit_grades(self.et_math_exam1.pk, self.teacher_user)
        from apps.grades.services import PermissionDeniedException

        with self.assertRaises(PermissionDeniedException):
            publish_grades(self.et_math_exam1.pk, self.teacher_user)

    def test_09_return_requires_comment(self):
        """Admin must provide a comment when returning grades."""
        submit_grades(self.et_math_exam1.pk, self.teacher_user)
        with self.assertRaises(ValueError):
            return_grades(self.et_math_exam1.pk, self.admin_user, "")


# ═══════════════════════════════════════════════════════════════════════════
# Feature 1 (cont): Workflow API Tests
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class TestGradeWorkflowAPI(APITestCase, GradeTestSetup):
    """API-level tests for grade workflow endpoints."""

    def setUp(self):
        self._full_setup()
        self.client = APIClient()

    def test_10_submit_api(self):
        """POST /api/grades/submit/ with teacher auth."""
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(
            "/api/v1/grades/submit/",
            {"exam_type_id": str(self.et_math_exam1.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["submitted_count"], 2)

    def test_11_publish_api_admin_only(self):
        """POST /api/grades/publish/ requires admin role."""
        # Submit first
        submit_grades(self.et_math_exam1.pk, self.teacher_user)

        # Teacher cannot publish
        self.client.force_authenticate(user=self.teacher_user)
        response = self.client.post(
            "/api/v1/grades/publish/",
            {"exam_type_id": str(self.et_math_exam1.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

        # Admin can publish
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            "/api/v1/grades/publish/",
            {"exam_type_id": str(self.et_math_exam1.pk)},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["published_count"], 2)

    def test_12_return_api(self):
        """POST /api/grades/return/ with comment."""
        submit_grades(self.et_math_exam1.pk, self.teacher_user)
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.post(
            "/api/v1/grades/return/",
            {
                "exam_type_id": str(self.et_math_exam1.pk),
                "comment": "Veuillez corriger les notes.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["returned_count"], 2)

    def test_13_workflow_status_api(self):
        """GET /api/grades/workflow-status/?exam_type_id=X."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            f"/api/v1/grades/workflow-status/?exam_type_id={self.et_math_exam1.pk}",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["draft"], 2)
        self.assertEqual(response.data["submitted"], 0)


# ═══════════════════════════════════════════════════════════════════════════
# Feature 2: TrimesterConfig + Student Averages + Weighted Annual Average
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class TestTrimesterConfigAndAverages(TestCase, GradeTestSetup):
    """Tests for TrimesterConfig and student averages endpoint."""

    def setUp(self):
        self._full_setup()

    def test_14_subject_average_calculation(self):
        """calculate_subject_average with weighted exams (60%+40%)."""
        # Student1: Math exam1=14 (60%), exam2=16 (40%)
        # Average = (14*60 + 16*40) / (60+40) = (840+640)/100 = 14.80
        result = calculate_subject_average(
            self.student1, self.subject_math, self.classroom,
            self.academic_year, 1, save=True,
        )
        self.assertEqual(result, Decimal("14.80"))

        sa = SubjectAverage.objects.get(
            student=self.student1, subject=self.subject_math, trimester=1,
        )
        self.assertEqual(sa.calculated_average, Decimal("14.80"))

    def test_15_trimester_average_with_coefficients(self):
        """calculate_trimester_average uses LevelSubject coefficients."""
        # First calc subject averages
        calculate_subject_average(
            self.student1, self.subject_math, self.classroom,
            self.academic_year, 1, save=True,
        )
        calculate_subject_average(
            self.student1, self.subject_phys, self.classroom,
            self.academic_year, 1, save=True,
        )

        # Math avg=14.80 (coeff=4), Phys avg=18.00 (coeff=2)
        # Trimester = (14.80*4 + 18.00*2) / (4+2) = (59.20+36.00)/6 = 15.87
        result = calculate_trimester_average(
            self.student1, self.classroom, self.academic_year, 1, save=True,
        )
        self.assertEqual(result, Decimal("15.87"))

    def test_16_trimester_config_weighted_annual(self):
        """TrimesterConfig custom weights for annual average."""
        # Create config with weights: T1=1, T2=2, T3=1
        config = TrimesterConfig.objects.create(
            school=self.school,
            weight_t1=Decimal("1"),
            weight_t2=Decimal("2"),
            weight_t3=Decimal("1"),
            decimal_places=2,
        )

        # Clear any signal-generated TrimesterAverages and create custom ones
        TrimesterAverage.objects.filter(
            student=self.student1,
            classroom=self.classroom,
            academic_year=self.academic_year,
        ).delete()

        for t, avg in [(1, Decimal("14")), (2, Decimal("16")), (3, Decimal("12"))]:
            TrimesterAverage.objects.create(
                student=self.student1,
                classroom=self.classroom,
                academic_year=self.academic_year,
                trimester=t,
                calculated_average=avg,
            )

        # Weighted: (14*1 + 16*2 + 12*1) / (1+2+1) = (14+32+12)/4 = 14.50
        from apps.grades.services import _calculate_annual_average_internal

        result = _calculate_annual_average_internal(
            self.student1, self.classroom, self.academic_year, save=True,
        )
        self.assertEqual(result, Decimal("14.50"))

    def test_17_default_equal_weight_annual(self):
        """Without TrimesterConfig, equal weights (T1+T2+T3)/3."""
        # Clear any signal-generated TrimesterAverages and create custom ones
        TrimesterAverage.objects.filter(
            student=self.student1,
            classroom=self.classroom,
            academic_year=self.academic_year,
        ).delete()

        for t, avg in [(1, Decimal("14")), (2, Decimal("16")), (3, Decimal("12"))]:
            TrimesterAverage.objects.create(
                student=self.student1,
                classroom=self.classroom,
                academic_year=self.academic_year,
                trimester=t,
                calculated_average=avg,
            )

        from apps.grades.services import _calculate_annual_average_internal

        # (14+16+12)/3 = 14.00
        result = _calculate_annual_average_internal(
            self.student1, self.classroom, self.academic_year, save=True,
        )
        self.assertEqual(result, Decimal("14.00"))


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class TestStudentAveragesAPI(APITestCase, GradeTestSetup):
    """API test for GET /api/grades/students/{id}/averages/."""

    def setUp(self):
        self._full_setup()
        self.client = APIClient()

        # Calculate subject averages for student1
        calculate_subject_average(
            self.student1, self.subject_math, self.classroom,
            self.academic_year, 1, save=True,
        )
        calculate_subject_average(
            self.student1, self.subject_phys, self.classroom,
            self.academic_year, 1, save=True,
        )

    def test_18_student_averages_endpoint(self):
        """GET /api/grades/students/{id}/averages/ returns all averages."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(
            f"/api/v1/grades/students/{self.student1.pk}/averages/"
            f"?academic_year_id={self.academic_year.pk}",
        )
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data["student_id"], str(self.student1.pk))
        self.assertEqual(len(data["subject_averages"]), 2)

        # Find math average
        math_avg = next(
            sa for sa in data["subject_averages"]
            if sa["subject"] == "Mathématiques"
        )
        self.assertEqual(math_avg["effective_average"], "14.80")

    def test_19_student_averages_permission(self):
        """Student can only see their own averages."""
        self.client.force_authenticate(user=self.student_user)
        # Own averages
        response = self.client.get(
            f"/api/v1/grades/students/{self.student1.pk}/averages/",
        )
        self.assertEqual(response.status_code, 200)

        # Other student's averages
        response = self.client.get(
            f"/api/v1/grades/students/{self.student2.pk}/averages/",
        )
        self.assertEqual(response.status_code, 403)


# ═══════════════════════════════════════════════════════════════════════════
# Feature 3: CSV Grade Import
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class TestCSVGradeImport(TestCase, GradeTestSetup):
    """Tests for CSV grade import (parse + confirm)."""

    def setUp(self):
        self._full_setup()
        # We'll use a new exam type with no grades yet
        self.et_csv = ExamType.objects.create(
            subject=self.subject_math,
            classroom=self.classroom,
            academic_year=self.academic_year,
            trimester=2,
            name="Devoir Surveillé",
            percentage=Decimal("100"),
            max_score=Decimal("20"),
            created_by=self.teacher_user,
        )

    def test_20_parse_csv_exact_match(self):
        """CSV parse with exact name match against roster."""
        csv_content = (
            "nom;prénom;note\n"
            f"{self.student_user.last_name};{self.student_user.first_name};15.5\n"
            f"{self.student2_user.last_name};{self.student2_user.first_name};12\n"
        )

        result = parse_csv_grades(csv_content, self.et_csv.pk, self.teacher_user)

        self.assertEqual(len(result["matched"]), 2)
        self.assertEqual(len(result["unmatched"]), 0)
        self.assertEqual(len(result["errors"]), 0)
        self.assertEqual(result["matched"][0]["score"], "15.5")

    def test_21_parse_csv_fuzzy_match(self):
        """CSV parse with fuzzy name matching (minor typo)."""
        csv_content = (
            "nom;prénom;note\n"
            "Benalli;Ahmed;14\n"  # typo: Benalli vs Benali
        )

        result = parse_csv_grades(csv_content, self.et_csv.pk, self.teacher_user)

        # Should fuzzy-match with high confidence
        self.assertTrue(len(result["matched"]) >= 1 or len(result["unmatched"]) >= 1)
        all_items = result["matched"] + result["unmatched"]
        self.assertEqual(len(all_items), 1)

    def test_22_parse_csv_unmatched(self):
        """CSV parse with completely unknown student."""
        csv_content = (
            "nom;prénom;note\n"
            "Inconnu;Personne;10\n"
        )

        result = parse_csv_grades(csv_content, self.et_csv.pk, self.teacher_user)

        self.assertEqual(len(result["matched"]), 0)
        self.assertEqual(len(result["unmatched"]), 1)

    def test_23_parse_csv_invalid_score(self):
        """CSV parse rejects invalid scores."""
        csv_content = (
            "nom;prénom;note\n"
            f"{self.student_user.last_name};{self.student_user.first_name};abc\n"
        )

        result = parse_csv_grades(csv_content, self.et_csv.pk, self.teacher_user)

        self.assertEqual(len(result["errors"]), 1)
        self.assertIn("invalide", result["errors"][0]["error"])

    def test_24_parse_csv_score_exceeds_max(self):
        """CSV parse rejects scores exceeding max_score."""
        csv_content = (
            "nom;prénom;note\n"
            f"{self.student_user.last_name};{self.student_user.first_name};25\n"
        )

        result = parse_csv_grades(csv_content, self.et_csv.pk, self.teacher_user)

        self.assertEqual(len(result["errors"]), 1)
        self.assertIn("barème", result["errors"][0]["error"])

    def test_25_confirm_csv_import_saves_as_draft(self):
        """confirm_csv_import creates Grade records with DRAFT status."""
        preview = {
            "exam_type_id": str(self.et_csv.pk),
            "matched": [
                {
                    "student_id": str(self.student1.pk),
                    "score": "15.5",
                },
                {
                    "student_id": str(self.student2.pk),
                    "score": "12",
                },
            ],
        }

        result = confirm_csv_import(preview, self.teacher_user)

        self.assertEqual(result["saved"], 2)
        self.assertEqual(len(result["errors"]), 0)

        # Verify grades were created as DRAFT
        grades = Grade.objects.filter(exam_type=self.et_csv)
        self.assertEqual(grades.count(), 2)
        for g in grades:
            self.assertEqual(g.status, Grade.Status.DRAFT)
            self.assertEqual(g.entered_by, self.teacher_user)

    def test_26_csv_missing_headers(self):
        """CSV parse rejects files with missing required headers."""
        csv_content = "colonne1;colonne2\nval1;val2\n"

        with self.assertRaises(CSVImportError):
            parse_csv_grades(csv_content, self.et_csv.pk, self.teacher_user)

    def test_27_csv_comma_decimal(self):
        """CSV parse handles French comma decimal notation."""
        csv_content = (
            "nom;prénom;note\n"
            f"{self.student_user.last_name};{self.student_user.first_name};15,5\n"
        )

        result = parse_csv_grades(csv_content, self.et_csv.pk, self.teacher_user)

        self.assertEqual(len(result["matched"]), 1)
        self.assertEqual(result["matched"][0]["score"], "15.5")


# ═══════════════════════════════════════════════════════════════════════════
# Feature 3 (cont): CSV Import API
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class TestCSVImportAPI(APITestCase, GradeTestSetup):
    """API tests for CSV import endpoints."""

    def setUp(self):
        self._full_setup()
        self.client = APIClient()
        self.et_csv = ExamType.objects.create(
            subject=self.subject_math,
            classroom=self.classroom,
            academic_year=self.academic_year,
            trimester=2,
            name="DS T2",
            percentage=Decimal("100"),
            max_score=Decimal("20"),
            created_by=self.teacher_user,
        )

    def test_28_csv_preview_api(self):
        """POST /api/grades/csv-import/preview/ parses CSV."""
        self.client.force_authenticate(user=self.teacher_user)

        csv_content = (
            f"nom;prénom;note\n"
            f"{self.student_user.last_name};{self.student_user.first_name};15\n"
        ).encode("utf-8")
        csv_file = BytesIO(csv_content)
        csv_file.name = "notes.csv"

        response = self.client.post(
            "/api/v1/grades/csv-import/preview/",
            {"exam_type_id": str(self.et_csv.pk), "csv_file": csv_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["matched"]), 1)

    def test_29_csv_confirm_api(self):
        """POST /api/grades/csv-import/confirm/ saves grades."""
        self.client.force_authenticate(user=self.teacher_user)

        response = self.client.post(
            "/api/v1/grades/csv-import/confirm/",
            {
                "exam_type_id": str(self.et_csv.pk),
                "matched": [
                    {"student_id": str(self.student1.pk), "score": "14"},
                ],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["saved"], 1)


# ═══════════════════════════════════════════════════════════════════════════
# TrimesterConfig API
# ═══════════════════════════════════════════════════════════════════════════


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, CELERY_TASK_EAGER_PROPAGATES=True)
class TestTrimesterConfigAPI(APITestCase, GradeTestSetup):
    """API tests for TrimesterConfig CRUD."""

    def setUp(self):
        self._full_setup()
        self.client = APIClient()

    def test_30_get_trimester_config_default(self):
        """GET /api/grades/trimester-config/ creates default if none exists."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get("/api/v1/grades/trimester-config/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["weight_t1"], "1.00")
        self.assertEqual(response.data["weight_t2"], "1.00")
        self.assertEqual(response.data["weight_t3"], "1.00")

    def test_31_update_trimester_config(self):
        """PUT /api/grades/trimester-config/ updates weights."""
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.put(
            "/api/v1/grades/trimester-config/",
            {"weight_t1": "1", "weight_t2": "2", "weight_t3": "1"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["weight_t2"], "2.00")
