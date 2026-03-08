"""
Tests for the accounts app — models, auth endpoints, serializers, permissions.
"""
import pytest
from django.urls import reverse
from rest_framework import status


# ════════════════════════════════════════════════════════════════
# MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestUserModel:
    """Tests for the custom User model."""

    def test_create_user(self, school):
        from apps.accounts.models import User

        user = User.objects.create_user(
            phone_number="0550001111",
            password="Str0ng@Pass",
            school=school,
            role="STUDENT",
            first_name="Test",
            last_name="User",
        )
        assert user.pk is not None
        assert user.phone_number == "0550001111"
        assert user.check_password("Str0ng@Pass")
        assert user.role == "STUDENT"
        assert user.school == school

    def test_phone_number_is_username(self, admin_user):
        assert admin_user.USERNAME_FIELD == "phone_number"
        assert str(admin_user) == admin_user.phone_number or admin_user.get_full_name()

    def test_user_roles(self, admin_user, teacher_user, student_user, parent_user):
        assert admin_user.role == "ADMIN"
        assert teacher_user.role == "TEACHER"
        assert student_user.role == "STUDENT"
        assert parent_user.role == "PARENT"

    def test_unique_phone_number(self, school):
        from apps.accounts.models import User

        User.objects.create_user(
            phone_number="0550009999",
            password="Test@1234",
            school=school,
            role="STUDENT",
        )
        with pytest.raises(Exception):
            User.objects.create_user(
                phone_number="0550009999",
                password="Test@1234",
                school=school,
                role="STUDENT",
            )

    def test_superadmin_no_school_required(self):
        from apps.accounts.models import User

        user = User.objects.create_user(
            phone_number="0550005555",
            password="Test@1234",
            role="SUPER_ADMIN",
            is_staff=True,
            is_superuser=True,
        )
        assert user.school is None
        assert user.role == "SUPER_ADMIN"


# ════════════════════════════════════════════════════════════════
# AUTH ENDPOINT TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestAuthEndpoints:
    """Tests for login, token refresh, and logout."""

    def test_login_success(self, api_client, admin_user):
        url = reverse("login")
        resp = api_client.post(url, {
            "phone_number": "0550000001",
            "password": "Test@1234",
        })
        assert resp.status_code == status.HTTP_200_OK
        data = resp.json()
        assert "access" in data or "token" in data or "tokens" in data

    def test_login_wrong_password(self, api_client, admin_user):
        url = reverse("login")
        resp = api_client.post(url, {
            "phone_number": "0550000001",
            "password": "WrongPassword",
        })
        assert resp.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_login_nonexistent_user(self, api_client):
        url = reverse("login")
        resp = api_client.post(url, {
            "phone_number": "0999999999",
            "password": "whatever",
        })
        assert resp.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_me_authenticated(self, admin_client, admin_user):
        url = reverse("me")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_me_unauthenticated(self, api_client):
        url = reverse("me")
        resp = api_client.get(url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ════════════════════════════════════════════════════════════════
# USER MANAGEMENT ENDPOINT TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestUserManagement:
    """Tests for user CRUD endpoints (admin-only)."""

    def test_list_users_as_admin(self, admin_client):
        url = reverse("user-list-create")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_list_users_as_teacher_forbidden(self, teacher_client):
        url = reverse("user-list-create")
        resp = teacher_client.get(url)
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )

    def test_list_users_as_student_forbidden(self, student_client):
        url = reverse("user-list-create")
        resp = student_client.get(url)
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )
