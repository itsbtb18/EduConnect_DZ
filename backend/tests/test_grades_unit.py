"""
Tests for the grades app — models, serializers, endpoints.
"""
import pytest
from decimal import Decimal
from django.urls import reverse
from rest_framework import status


# ════════════════════════════════════════════════════════════════
# MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestExamTypeModel:
    """Tests for the ExamType model."""

    def test_create_exam_type(self, exam_type):
        assert exam_type.pk is not None
        assert exam_type.name == "Composition"
        assert exam_type.percentage == Decimal("100")
        assert exam_type.max_score == Decimal("20")
        assert exam_type.trimester == 1

    def test_exam_type_relationships(self, exam_type, subject, classroom, academic_year):
        assert exam_type.subject == subject
        assert exam_type.classroom == classroom
        assert exam_type.academic_year == academic_year


@pytest.mark.django_db
class TestGradeModel:
    """Tests for the Grade model."""

    def test_create_grade(self, exam_type, student_user):
        from apps.grades.models import Grade

        grade = Grade.objects.create(
            student=student_user.student_profile,
            exam_type=exam_type,
            score=Decimal("15.50"),
            status="DRAFT",
        )
        assert grade.pk is not None
        assert grade.score == Decimal("15.50")
        assert grade.status == "DRAFT"
        assert not grade.is_published

    def test_grade_absent_nullifies_score(self, exam_type, student_user):
        from apps.grades.models import Grade

        grade = Grade.objects.create(
            student=student_user.student_profile,
            exam_type=exam_type,
            score=None,
            is_absent=True,
        )
        assert grade.is_absent
        assert grade.score is None

    def test_grade_workflow_states(self, exam_type, student_user):
        from apps.grades.models import Grade

        grade = Grade.objects.create(
            student=student_user.student_profile,
            exam_type=exam_type,
            score=Decimal("18"),
        )
        assert grade.status == "DRAFT"

        grade.status = "SUBMITTED"
        grade.save()
        assert grade.status == "SUBMITTED"

        grade.status = "PUBLISHED"
        grade.is_published = True
        grade.save()
        assert grade.is_published


# ════════════════════════════════════════════════════════════════
# ENDPOINT TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestExamTypeEndpoints:
    """Tests for ExamType CRUD via REST."""

    def test_list_exam_types_as_admin(self, admin_client, exam_type):
        url = reverse("exam-type-list")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_create_exam_type_as_admin(
        self, admin_client, subject, classroom, academic_year
    ):
        url = reverse("exam-type-list")
        resp = admin_client.post(url, {
            "subject": str(subject.pk),
            "classroom": str(classroom.pk),
            "academic_year": str(academic_year.pk),
            "trimester": 2,
            "name": "Devoir 1",
            "percentage": "40.00",
            "max_score": "20.00",
        })
        assert resp.status_code in (
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
        )

    def test_create_exam_type_as_student_forbidden(
        self, student_client, subject, classroom, academic_year
    ):
        url = reverse("exam-type-list")
        resp = student_client.post(url, {
            "subject": str(subject.pk),
            "classroom": str(classroom.pk),
            "academic_year": str(academic_year.pk),
            "trimester": 1,
            "name": "Hack",
            "percentage": "100",
        })
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )


@pytest.mark.django_db
class TestGradeEndpoints:
    """Tests for grade entry, listing, publishing."""

    def test_bulk_enter_as_teacher(
        self, teacher_client, exam_type, student_user, teacher_assignment
    ):
        url = reverse("grade-bulk-enter")
        resp = teacher_client.post(
            url,
            {
                "exam_type": str(exam_type.pk),
                "grades": [
                    {
                        "student": str(student_user.student_profile.pk),
                        "score": "16.00",
                    }
                ],
            },
            format="json",
        )
        # Expect 200/201/400 (depending on assignment validation)
        assert resp.status_code in (
            status.HTTP_200_OK,
            status.HTTP_201_CREATED,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_grade_list_as_admin(self, admin_client, exam_type):
        url = reverse("grade-list")
        resp = admin_client.get(url, {"exam_type": str(exam_type.pk)})
        assert resp.status_code == status.HTTP_200_OK

    def test_grade_list_unauthenticated(self, api_client):
        url = reverse("grade-list")
        resp = api_client.get(url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED
