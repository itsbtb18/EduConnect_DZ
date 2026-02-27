"""
Root conftest.py for pytest.
Provides shared fixtures: users, school, academic structures, API client.
"""

import pytest
from rest_framework.test import APIClient


# ──────────────────────────────────────────────
# School & Academic Year Fixtures
# ──────────────────────────────────────────────


@pytest.fixture
def school(db):
    """Create a test school."""
    from apps.schools.models import School

    return School.objects.create(
        name="Test School",
        code="test-school",
        address="123 Test Street, Algiers",
        phone="0551234567",
        wilaya="Alger",
        school_type="middle",
        is_active=True,
    )


@pytest.fixture
def academic_year(db, school):
    """Create a current academic year for the test school."""
    from apps.schools.models import AcademicYear

    return AcademicYear.objects.create(
        school=school,
        name="2024-2025",
        start_date="2024-09-08",
        end_date="2025-06-30",
        is_current=True,
    )


# ──────────────────────────────────────────────
# User Fixtures
# ──────────────────────────────────────────────


@pytest.fixture
def admin_user(db, school):
    """Create an admin user."""
    from apps.accounts.models import User

    return User.objects.create_user(
        email="admin@test-school.dz",
        password="Test@1234",
        school=school,
        role="admin",
        first_name="Admin",
        last_name="Test",
        is_staff=True,
    )


@pytest.fixture
def teacher_user(db, school):
    """Create a teacher user (profile is auto-created by signal)."""
    from apps.accounts.models import User

    return User.objects.create_user(
        email="teacher@test-school.dz",
        password="Test@1234",
        school=school,
        role="teacher",
        first_name="Karim",
        last_name="Benmoussa",
    )


@pytest.fixture
def student_user(db, school):
    """Create a student user (profile is auto-created by signal)."""
    from apps.accounts.models import User

    return User.objects.create_user(
        email="student@test-school.dz",
        password="Test@1234",
        school=school,
        role="student",
        first_name="Ahmed",
        last_name="Benali",
    )


@pytest.fixture
def parent_user(db, school):
    """Create a parent user (profile is auto-created by signal)."""
    from apps.accounts.models import User

    return User.objects.create_user(
        email="parent@test-school.dz",
        password="Test@1234",
        school=school,
        role="parent",
        first_name="Mohamed",
        last_name="Benali",
    )


# ──────────────────────────────────────────────
# Academic Structure Fixtures
# ──────────────────────────────────────────────


@pytest.fixture
def level(db, school):
    """Create a test level."""
    from apps.academics.models import Level

    return Level.objects.create(
        school=school,
        name="1ère Année Moyenne",
        code="1AM",
        order=1,
    )


@pytest.fixture
def classroom(db, school, level):
    """Create a test classroom."""
    from apps.academics.models import Classroom

    return Classroom.objects.create(
        school=school,
        name="1AM - A",
        level=level,
        capacity=35,
    )


@pytest.fixture
def subject(db, school):
    """Create a test subject."""
    from apps.academics.models import Subject

    return Subject.objects.create(
        school=school,
        name="Mathématiques",
        coefficient=5,
    )


@pytest.fixture
def teacher_assignment(db, school, teacher_user, classroom, subject):
    """Create a teacher assignment (teacher → classroom + subject)."""
    from apps.academics.models import TeacherAssignment

    return TeacherAssignment.objects.create(
        school=school,
        teacher=teacher_user,
        classroom=classroom,
        subject=subject,
    )


@pytest.fixture
def exam_type(db, school):
    """Create a test exam type."""
    from apps.grades.models import ExamType

    return ExamType.objects.create(
        school=school,
        name="Composition",
        weight=50,
    )


# ──────────────────────────────────────────────
# API Client Fixtures
# ──────────────────────────────────────────────


@pytest.fixture
def api_client():
    """Return an unauthenticated DRF test client."""
    return APIClient()


@pytest.fixture
def admin_client(api_client, admin_user):
    """Return an API client authenticated as admin."""
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def teacher_client(api_client, teacher_user):
    """Return an API client authenticated as teacher."""
    api_client.force_authenticate(user=teacher_user)
    return api_client


@pytest.fixture
def student_client(api_client, student_user):
    """Return an API client authenticated as student."""
    api_client.force_authenticate(user=student_user)
    return api_client


@pytest.fixture
def parent_client(api_client, parent_user):
    """Return an API client authenticated as parent."""
    api_client.force_authenticate(user=parent_user)
    return api_client
