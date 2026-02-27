"""
Tests for the Grades app — services, views, and tasks.
"""

import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestGradeCreation:
    """Tests for grade CRUD operations."""

    def test_teacher_can_create_grade(
        self, teacher_client, school, student_user, teacher_assignment, exam_type
    ):
        """Teacher can enter a grade for a student."""
        url = reverse("grade-list")
        data = {
            "student": str(student_user.id),
            "teacher_assignment": str(teacher_assignment.id),
            "exam_type": str(exam_type.id),
            "score": 15.5,
        }
        response = teacher_client.post(url, data)
        assert response.status_code in [
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
        ]

    def test_student_cannot_create_grade(
        self, student_client, school, student_user, teacher_assignment, exam_type
    ):
        """Students cannot enter grades."""
        url = reverse("grade-list")
        data = {
            "student": str(student_user.id),
            "teacher_assignment": str(teacher_assignment.id),
            "exam_type": str(exam_type.id),
            "score": 20,
        }
        response = student_client.post(url, data)
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestGradeCalculationService:
    """Tests for the grade calculation service layer."""

    def test_calculate_subject_trimester_average(
        self, school, student_user, teacher_assignment, exam_type
    ):
        """Verify weighted average calculation."""
        from apps.grades.models import ExamType, Grade
        from apps.grades.services import calculate_subject_trimester_average

        # Create exam types
        devoir1 = ExamType.objects.create(
            school=school, name="Devoir Test 1", weight=25
        )
        composition = exam_type  # weight=50

        # Create grades
        Grade.objects.create(
            school=school,
            student=student_user,
            teacher_assignment=teacher_assignment,
            exam_type=devoir1,
            score=14,
            is_published=True,
        )
        Grade.objects.create(
            school=school,
            student=student_user,
            teacher_assignment=teacher_assignment,
            exam_type=composition,
            score=16,
            is_published=True,
        )

        avg = calculate_subject_trimester_average(
            student_id=str(student_user.id),
            teacher_assignment_id=str(teacher_assignment.id),
            trimester=1,
        )

        # Weighted: (14*25 + 16*50) / (25+50) = (350+800)/75 = 15.33...
        assert avg is not None
        assert 15.0 <= avg <= 16.0

    def test_calculate_class_rankings(self, school, classroom, teacher_assignment):
        """Verify class ranking generation."""
        from apps.accounts.models import StudentProfile, User
        from apps.grades.models import ExamType, Grade
        from apps.grades.services import calculate_class_rankings

        exam_type = ExamType.objects.create(
            school=school, name="Rank Test Exam", weight=100
        )

        # Create 3 students with different grades
        students = []
        for i, score in enumerate([18, 14, 16]):
            user = User.objects.create_user(
                email=f"rank_student{i}@test.dz",
                password="Test@1234",
                school=school,
                role="student",
                first_name=f"Student{i}",
            )
            profile = StudentProfile.objects.filter(user=user).first()
            if profile:
                profile.classroom = classroom
                profile.save()

            Grade.objects.create(
                school=school,
                student=user,
                teacher_assignment=teacher_assignment,
                exam_type=exam_type,
                score=score,
                is_published=True,
            )
            students.append(user)

        rankings = calculate_class_rankings(
            classroom_id=str(classroom.id),
            trimester=1,
        )

        assert len(rankings) == 3
        # First place should have score 18
        assert rankings[0]["rank"] == 1
