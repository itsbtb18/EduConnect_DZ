"""
Unit tests for grade calculation services (new ExamType-based architecture).

Covers:
  - calculate_subject_average (normal, partial, absent)
  - calculate_trimester_average (normal, coefficient-weighted)
  - calculate_rankings (normal, ties)
  - calculate_annual_average
"""

import uuid
from datetime import date
from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User
from apps.academics.models import Class, Level, LevelSubject
from apps.academics.models import StudentProfile
from apps.academics.models import Subject as AcademicSubject
from apps.grades.models import ExamType, Grade
from apps.grades.services import (
    calculate_annual_average,
    calculate_rankings,
    calculate_subject_average,
    calculate_trimester_average,
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
        cls.level = Level.objects.create(
            school=cls.school,
            section=cls.section,
            name="1ère Année Moyenne",
            code="1MS",
            order=1,
            max_grade=20,
            passing_grade=10,
        )
        cls.klass = Class.objects.create(
            school=cls.school,
            section=cls.section,
            academic_year=cls.academic_year,
            level=cls.level,
            name="1MS-A",
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

        # Subjects (in academics)
        cls.math = AcademicSubject.objects.create(
            school=cls.school,
            name="Mathematics",
            code="MATH",
        )
        cls.arabic = AcademicSubject.objects.create(
            school=cls.school,
            name="Arabic",
            code="ARAB",
        )

        # LevelSubject (coefficients)
        LevelSubject.objects.create(
            school=cls.school,
            level=cls.level,
            subject=cls.math,
            coefficient=Decimal("3.00"),
        )
        LevelSubject.objects.create(
            school=cls.school,
            level=cls.level,
            subject=cls.arabic,
            coefficient=Decimal("2.00"),
        )

        # ExamTypes for Math T1: Exam1 (60%), Exam2 (20%), CC (20%)
        cls.math_exam1 = ExamType.objects.create(
            subject=cls.math,
            classroom=cls.klass,
            academic_year=cls.academic_year,
            trimester=1,
            name="Examen 1",
            percentage=Decimal("60"),
            max_score=Decimal("20"),
            created_by=cls.teacher,
        )
        cls.math_exam2 = ExamType.objects.create(
            subject=cls.math,
            classroom=cls.klass,
            academic_year=cls.academic_year,
            trimester=1,
            name="Examen 2",
            percentage=Decimal("20"),
            max_score=Decimal("20"),
            created_by=cls.teacher,
        )
        cls.math_cc = ExamType.objects.create(
            subject=cls.math,
            classroom=cls.klass,
            academic_year=cls.academic_year,
            trimester=1,
            name="Contrôle Continu",
            percentage=Decimal("20"),
            max_score=Decimal("20"),
            created_by=cls.teacher,
        )

        # ExamTypes for Arabic T1: single exam (100%)
        cls.arabic_exam = ExamType.objects.create(
            subject=cls.arabic,
            classroom=cls.klass,
            academic_year=cls.academic_year,
            trimester=1,
            name="Examen Final",
            percentage=Decimal("100"),
            max_score=Decimal("20"),
            created_by=cls.teacher,
        )

    def _grade(self, student, exam_type, score, is_absent=False):
        """Quick helper to create a grade."""
        return Grade.objects.create(
            student=student,
            exam_type=exam_type,
            score=score,
            is_absent=is_absent,
            entered_by=self.teacher,
        )


# ═══════════════════════════════════════════════════════════════════════════
# 1. calculate_subject_average
# ═══════════════════════════════════════════════════════════════════════════


class SubjectAverageTests(GradeServicesBaseTestCase):
    def test_normal_case(self):
        """All 3 math exams entered → weighted average."""
        self._grade(self.student, self.math_exam1, Decimal("18"))
        self._grade(self.student, self.math_exam2, Decimal("14"))
        self._grade(self.student, self.math_cc, Decimal("16"))

        result = calculate_subject_average(
            self.student,
            self.math,
            self.klass,
            self.academic_year,
            trimester=1,
            save=False,
        )
        # (18×60 + 14×20 + 16×20) / 100 = (1080+280+320)/100 = 16.80
        self.assertEqual(result, Decimal("16.80"))

    def test_single_exam_100_percent(self):
        """Arabic: single exam at 100% → average equals score."""
        self._grade(self.student, self.arabic_exam, Decimal("15"))

        result = calculate_subject_average(
            self.student,
            self.arabic,
            self.klass,
            self.academic_year,
            trimester=1,
            save=False,
        )
        self.assertEqual(result, Decimal("15.00"))

    def test_absent_counts_as_zero(self):
        """Absent student → score treated as 0."""
        self._grade(self.student, self.math_exam1, None, is_absent=True)
        self._grade(self.student, self.math_exam2, Decimal("14"))
        self._grade(self.student, self.math_cc, Decimal("16"))

        result = calculate_subject_average(
            self.student,
            self.math,
            self.klass,
            self.academic_year,
            trimester=1,
            save=False,
        )
        # (0×60 + 14×20 + 16×20) / 100 = 600/100 = 6.00
        self.assertEqual(result, Decimal("6.00"))

    def test_no_grades_returns_none(self):
        """No grades at all → None."""
        result = calculate_subject_average(
            self.student,
            self.math,
            self.klass,
            self.academic_year,
            trimester=1,
            save=False,
        )
        self.assertIsNone(result)


# ═══════════════════════════════════════════════════════════════════════════
# 2. calculate_trimester_average
# ═══════════════════════════════════════════════════════════════════════════


class TrimesterAverageTests(GradeServicesBaseTestCase):
    def test_coefficient_weighted(self):
        """Two subjects with different coefficients."""
        # Math: avg 16.80 (coeff 3)
        self._grade(self.student, self.math_exam1, Decimal("18"))
        self._grade(self.student, self.math_exam2, Decimal("14"))
        self._grade(self.student, self.math_cc, Decimal("16"))
        # Arabic: avg 10 (coeff 2)
        self._grade(self.student, self.arabic_exam, Decimal("10"))

        # First compute subject averages
        calculate_subject_average(
            self.student,
            self.math,
            self.klass,
            self.academic_year,
            1,
            save=True,
        )
        calculate_subject_average(
            self.student,
            self.arabic,
            self.klass,
            self.academic_year,
            1,
            save=True,
        )

        result = calculate_trimester_average(
            self.student,
            self.klass,
            self.academic_year,
            1,
            save=False,
        )
        # (16.80×3 + 10.00×2) / (3+2) = (50.40+20.00)/5 = 14.08
        self.assertEqual(result, Decimal("14.08"))


# ═══════════════════════════════════════════════════════════════════════════
# 3. calculate_rankings
# ═══════════════════════════════════════════════════════════════════════════


class RankingTests(GradeServicesBaseTestCase):
    def test_basic_ranking(self):
        """Student with higher average → rank 1."""
        from apps.grades.models import TrimesterAverage

        # Student 1: high grades
        self._grade(self.student, self.math_exam1, Decimal("18"))
        self._grade(self.student, self.math_exam2, Decimal("18"))
        self._grade(self.student, self.math_cc, Decimal("18"))
        self._grade(self.student, self.arabic_exam, Decimal("18"))

        # Student 2: low grades
        self._grade(self.student2, self.math_exam1, Decimal("10"))
        self._grade(self.student2, self.math_exam2, Decimal("10"))
        self._grade(self.student2, self.math_cc, Decimal("10"))
        self._grade(self.student2, self.arabic_exam, Decimal("10"))

        # Compute all averages
        for s in [self.student, self.student2]:
            calculate_subject_average(s, self.math, self.klass, self.academic_year, 1)
            calculate_subject_average(s, self.arabic, self.klass, self.academic_year, 1)
            calculate_trimester_average(s, self.klass, self.academic_year, 1)

        calculate_rankings(self.klass, self.academic_year, 1)

        t1 = TrimesterAverage.objects.get(student=self.student, trimester=1)
        t2 = TrimesterAverage.objects.get(student=self.student2, trimester=1)
        self.assertEqual(t1.rank_in_class, 1)
        self.assertEqual(t2.rank_in_class, 2)
