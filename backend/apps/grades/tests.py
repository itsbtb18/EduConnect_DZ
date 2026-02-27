"""
Unit tests for grade calculation services.

Covers:
  - calculate_subject_trimester_average (normal, missing grade)
  - calculate_overall_trimester_average (normal, single subject, zero coeff)
  - calculate_class_rank (normal, ties)
"""

import uuid
from datetime import date
from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User
from apps.academics.models import Class, StudentProfile
from apps.grades.models import Grade, Subject, TrimesterConfig
from apps.grades.services import (
    calculate_class_rank,
    calculate_overall_trimester_average,
    calculate_subject_trimester_average,
)
from apps.schools.models import AcademicYear, School, Section


class GradeServicesBaseTestCase(TestCase):
    """Shared fixtures for all service tests."""

    @classmethod
    def setUpTestData(cls):
        cls.school = School.objects.create(
            name="Test School",
            subdomain="test-school",
        )
        cls.section = Section.objects.create(
            school=cls.school,
            section_type=Section.SectionType.MIDDLE,
            name="Middle",
        )
        cls.academic_year = AcademicYear.objects.create(
            school=cls.school,
            section=cls.section,
            name="2025-2026",
            start_date=date(2025, 9, 1),
            end_date=date(2026, 6, 30),
        )
        cls.klass = Class.objects.create(
            section=cls.section,
            academic_year=cls.academic_year,
            name="1MS-A",
            level="1MS",
        )

        # Teacher
        cls.teacher = User.objects.create_user(
            phone_number="0550000001",
            password="pass1234",
            first_name="Ali",
            last_name="Teacher",
            role=User.Role.TEACHER,
            school=cls.school,
        )

        # Student 1
        cls.student_user = User.objects.create_user(
            phone_number="0550000002",
            password="pass1234",
            first_name="Yacine",
            last_name="Student",
            role=User.Role.STUDENT,
            school=cls.school,
        )
        cls.student = StudentProfile.objects.create(
            user=cls.student_user,
            current_class=cls.klass,
        )

        # Student 2
        cls.student_user2 = User.objects.create_user(
            phone_number="0550000003",
            password="pass1234",
            first_name="Amira",
            last_name="Student2",
            role=User.Role.STUDENT,
            school=cls.school,
        )
        cls.student2 = StudentProfile.objects.create(
            user=cls.student_user2,
            current_class=cls.klass,
        )

        # TrimesterConfig
        cls.config = TrimesterConfig(
            school=cls.school,
            section=cls.section,
            continuous_weight=Decimal("0.20"),
            test1_weight=Decimal("0.20"),
            test2_weight=Decimal("0.20"),
            final_weight=Decimal("0.40"),
        )
        cls.config.save()

        # Subjects
        cls.math = Subject.objects.create(
            school=cls.school,
            section=cls.section,
            class_obj=cls.klass,
            name="Mathematics",
            coefficient=Decimal("3.00"),
            teacher=cls.teacher,
        )
        cls.arabic = Subject.objects.create(
            school=cls.school,
            section=cls.section,
            class_obj=cls.klass,
            name="Arabic",
            coefficient=Decimal("2.00"),
            teacher=cls.teacher,
        )

    # -----------------------------------------------------------------------
    # Helper to quickly create a published grade
    # -----------------------------------------------------------------------
    def _grade(self, student, subject, exam_type, value, max_value=Decimal("20")):
        return Grade.objects.create(
            student=student,
            subject=subject,
            trimester=1,
            academic_year=self.academic_year,
            exam_type=exam_type,
            value=value,
            max_value=max_value,
            status=Grade.Status.PUBLISHED,
            submitted_by=self.teacher,
        )


# ===========================================================================
# 1. calculate_subject_trimester_average
# ===========================================================================


class SubjectTrimesterAverageTests(GradeServicesBaseTestCase):
    def test_normal_case(self):
        """All four exam types present → weighted average."""
        self._grade(self.student, self.math, Grade.ExamType.CONTINUOUS, Decimal("16"))
        self._grade(self.student, self.math, Grade.ExamType.TEST_1, Decimal("14"))
        self._grade(self.student, self.math, Grade.ExamType.TEST_2, Decimal("12"))
        self._grade(self.student, self.math, Grade.ExamType.FINAL, Decimal("18"))

        result = calculate_subject_trimester_average(
            self.student, self.math, 1, self.academic_year
        )
        # Expected: 16*0.20 + 14*0.20 + 12*0.20 + 18*0.40
        #         = 3.20 + 2.80 + 2.40 + 7.20 = 15.60
        self.assertEqual(result, Decimal("15.60"))

    def test_missing_grade_returns_none(self):
        """If any exam type is missing, return None."""
        self._grade(self.student, self.math, Grade.ExamType.CONTINUOUS, Decimal("16"))
        self._grade(self.student, self.math, Grade.ExamType.TEST_1, Decimal("14"))
        # TEST_2 and FINAL missing

        result = calculate_subject_trimester_average(
            self.student, self.math, 1, self.academic_year
        )
        self.assertIsNone(result)

    def test_normalises_to_20(self):
        """Grades with max_value != 20 are normalised."""
        self._grade(
            self.student,
            self.math,
            Grade.ExamType.CONTINUOUS,
            Decimal("8"),
            Decimal("10"),
        )  # → 16/20
        self._grade(self.student, self.math, Grade.ExamType.TEST_1, Decimal("14"))
        self._grade(self.student, self.math, Grade.ExamType.TEST_2, Decimal("12"))
        self._grade(self.student, self.math, Grade.ExamType.FINAL, Decimal("18"))

        result = calculate_subject_trimester_average(
            self.student, self.math, 1, self.academic_year
        )
        # continuous normalised to 16: same as test_normal_case
        self.assertEqual(result, Decimal("15.60"))


# ===========================================================================
# 2. calculate_overall_trimester_average
# ===========================================================================


class OverallTrimesterAverageTests(GradeServicesBaseTestCase):
    def _fill_subject(self, student, subject, scores):
        """Create all 4 grades for a subject with given scores dict."""
        for exam_type, value in scores.items():
            self._grade(student, subject, exam_type, value)

    def test_normal_case(self):
        """Two subjects → coefficient-weighted overall average."""
        self._fill_subject(
            self.student,
            self.math,
            {
                Grade.ExamType.CONTINUOUS: Decimal("16"),
                Grade.ExamType.TEST_1: Decimal("14"),
                Grade.ExamType.TEST_2: Decimal("12"),
                Grade.ExamType.FINAL: Decimal("18"),
            },
        )  # math avg = 15.60
        self._fill_subject(
            self.student,
            self.arabic,
            {
                Grade.ExamType.CONTINUOUS: Decimal("10"),
                Grade.ExamType.TEST_1: Decimal("10"),
                Grade.ExamType.TEST_2: Decimal("10"),
                Grade.ExamType.FINAL: Decimal("10"),
            },
        )  # arabic avg = 10.00

        result = calculate_overall_trimester_average(
            self.student, 1, self.academic_year
        )
        # (15.60 × 3 + 10.00 × 2) / (3 + 2) = (46.80 + 20.00) / 5 = 13.36
        self.assertEqual(result, Decimal("13.36"))

    def test_single_subject(self):
        """Only one subject has grades → equals that subject's average."""
        self._fill_subject(
            self.student,
            self.math,
            {
                Grade.ExamType.CONTINUOUS: Decimal("16"),
                Grade.ExamType.TEST_1: Decimal("14"),
                Grade.ExamType.TEST_2: Decimal("12"),
                Grade.ExamType.FINAL: Decimal("18"),
            },
        )
        # arabic has no grades → skipped (not None propagated)
        result = calculate_overall_trimester_average(
            self.student, 1, self.academic_year
        )
        self.assertEqual(result, Decimal("15.60"))

    def test_no_class_returns_none(self):
        """Student with no current_class → None."""
        orphan_user = User.objects.create_user(
            phone_number="0550000099",
            password="pass1234",
            first_name="Orphan",
            last_name="Student",
            role=User.Role.STUDENT,
            school=self.school,
        )
        orphan = StudentProfile.objects.create(user=orphan_user, current_class=None)
        result = calculate_overall_trimester_average(orphan, 1, self.academic_year)
        self.assertIsNone(result)


# ===========================================================================
# 3. calculate_class_rank
# ===========================================================================


class ClassRankTests(GradeServicesBaseTestCase):
    def _fill_all(self, student, math_final, arabic_final):
        """Quick helper — gives identical continuous/test grades, varies final."""
        base = {
            Grade.ExamType.CONTINUOUS: Decimal("10"),
            Grade.ExamType.TEST_1: Decimal("10"),
            Grade.ExamType.TEST_2: Decimal("10"),
        }
        for exam_type, val in base.items():
            self._grade(student, self.math, exam_type, val)
            self._grade(student, self.arabic, exam_type, val)
        self._grade(student, self.math, Grade.ExamType.FINAL, math_final)
        self._grade(student, self.arabic, Grade.ExamType.FINAL, arabic_final)

    def test_rank_first(self):
        """Higher average → rank 1."""
        self._fill_all(self.student, Decimal("18"), Decimal("18"))
        self._fill_all(self.student2, Decimal("10"), Decimal("10"))

        rank = calculate_class_rank(self.student, 1, self.academic_year)
        self.assertEqual(rank, 1)

    def test_rank_second(self):
        """Lower average → rank 2."""
        self._fill_all(self.student, Decimal("18"), Decimal("18"))
        self._fill_all(self.student2, Decimal("10"), Decimal("10"))

        rank = calculate_class_rank(self.student2, 1, self.academic_year)
        self.assertEqual(rank, 2)

    def test_tied_ranks(self):
        """Equal averages → same rank."""
        self._fill_all(self.student, Decimal("15"), Decimal("15"))
        self._fill_all(self.student2, Decimal("15"), Decimal("15"))

        rank1 = calculate_class_rank(self.student, 1, self.academic_year)
        rank2 = calculate_class_rank(self.student2, 1, self.academic_year)
        self.assertEqual(rank1, 1)
        self.assertEqual(rank2, 1)
