"""
Tests for core permissions, mixins, and multi-tenant enforcement.
"""
import pytest
from django.test import RequestFactory
from rest_framework import status
from rest_framework.test import APIRequestFactory
from django.urls import reverse


# ════════════════════════════════════════════════════════════════
# PERMISSION CLASS UNIT TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestCorePermissions:
    """Tests for core permission classes."""

    def test_is_super_admin_allows_superadmin(self):
        from core.permissions import IsSuperAdmin
        from apps.accounts.models import User

        sa = User.objects.create_user(
            phone_number="0559990001",
            password="Test@1234",
            role="SUPER_ADMIN",
            is_staff=True,
            is_superuser=True,
        )
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = sa
        perm = IsSuperAdmin()
        assert perm.has_permission(request, None)

    def test_is_super_admin_rejects_admin(self, admin_user):
        from core.permissions import IsSuperAdmin

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = admin_user
        perm = IsSuperAdmin()
        assert not perm.has_permission(request, None)

    def test_is_school_admin_allows_admin(self, admin_user):
        from core.permissions import IsSchoolAdmin

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = admin_user
        perm = IsSchoolAdmin()
        assert perm.has_permission(request, None)

    def test_is_school_admin_rejects_student(self, student_user):
        from core.permissions import IsSchoolAdmin

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = student_user
        perm = IsSchoolAdmin()
        assert not perm.has_permission(request, None)

    def test_is_teacher_allows_teacher(self, teacher_user):
        from core.permissions import IsTeacher

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = teacher_user
        perm = IsTeacher()
        assert perm.has_permission(request, None)

    def test_is_teacher_rejects_parent(self, parent_user):
        from core.permissions import IsTeacher

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = parent_user
        perm = IsTeacher()
        assert not perm.has_permission(request, None)

    def test_is_parent_allows_parent(self, parent_user):
        from core.permissions import IsParent

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = parent_user
        perm = IsParent()
        assert perm.has_permission(request, None)

    def test_is_student_allows_student(self, student_user):
        from core.permissions import IsStudent

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = student_user
        perm = IsStudent()
        assert perm.has_permission(request, None)

    def test_is_admin_or_teacher(self, admin_user, teacher_user, student_user):
        from core.permissions import IsAdminOrTeacher

        factory = APIRequestFactory()
        perm = IsAdminOrTeacher()

        request = factory.get("/")
        request.user = admin_user
        assert perm.has_permission(request, None)

        request.user = teacher_user
        assert perm.has_permission(request, None)

        request.user = student_user
        assert not perm.has_permission(request, None)


# ════════════════════════════════════════════════════════════════
# IS_SAME_SCHOOL OBJECT PERMISSION TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestIsSameSchoolPermission:
    """Tests for IsSameSchool object-level permission."""

    def test_same_school_allows_access(self, admin_user, school):
        from core.permissions import IsSameSchool

        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = admin_user
        perm = IsSameSchool()
        assert perm.has_object_permission(request, None, school)

    def test_different_school_denies_access(self, admin_user):
        from core.permissions import IsSameSchool
        from apps.schools.models import School

        other_school = School.objects.create(
            name="Other School",
            subdomain="other-school",
            address="456 Other",
            phone="0557777777",
            wilaya="Oran",
        )
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = admin_user
        perm = IsSameSchool()
        assert not perm.has_object_permission(request, None, other_school)


# ════════════════════════════════════════════════════════════════
# ENDPOINT PERMISSION INTEGRATION TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestEndpointPermissions:
    """Integration tests for role-based endpoint access."""

    def test_unauthenticated_cannot_access_protected(self, api_client):
        urls = [
            reverse("me"),
            reverse("user-list-create"),
        ]
        for url in urls:
            resp = api_client.get(url)
            assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_student_cannot_create_users(self, student_client):
        url = reverse("user-list-create")
        resp = student_client.post(url, {
            "phone_number": "0559999999",
            "password": "Test@1234",
            "role": "STUDENT",
        }, format="json")
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )

    def test_admin_can_list_users(self, admin_client):
        url = reverse("user-list-create")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_teacher_cannot_access_finance(self, teacher_client):
        url = reverse("fee-structure-list")
        resp = teacher_client.get(url)
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )

    def test_parent_cannot_mark_attendance(self, parent_user, classroom):
        from rest_framework.test import APIClient
        from datetime import date

        client = APIClient()
        client.force_authenticate(user=parent_user)
        url = reverse("attendance-mark")
        resp = client.post(url, {
            "classroom": str(classroom.pk),
            "date": str(date.today()),
            "period": "MORNING",
            "records": [],
        }, format="json")
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )

    def test_admin_can_access_exam_types(self, admin_client, exam_type):
        url = reverse("exam-type-list")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_student_can_view_own_attendance(self, student_client):
        url = reverse("student-attendance")
        resp = student_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_me_endpoint_returns_user_info(self, admin_client, admin_user):
        url = reverse("me")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert data.get("phone_number") == admin_user.phone_number or "phone" in str(data)
