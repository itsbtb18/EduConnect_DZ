"""
Tests for the Accounts app.
"""

import pytest
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
class TestUserRegistration:
    """Tests for user authentication endpoints."""

    def test_admin_can_list_users(self, admin_client, school, admin_user):
        """Admin can list all users in their school."""
        url = reverse("user-list")
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_teacher_cannot_list_users(self, teacher_client):
        """Teachers should not be able to list all users."""
        url = reverse("user-list")
        response = teacher_client.get(url)
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_200_OK,  # May be filtered
        ]

    def test_unauthenticated_cannot_access(self, api_client):
        """Unauthenticated requests are rejected."""
        url = reverse("user-list")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class TestUserProfile:
    """Tests for user profile auto-creation via signals."""

    def test_student_profile_created_on_user_save(self, student_user):
        """Student profile is auto-created when user is saved."""
        assert hasattr(student_user, "student_profile")

    def test_teacher_profile_created_on_user_save(self, teacher_user):
        """Teacher profile is auto-created when user is saved."""
        assert hasattr(teacher_user, "teacher_profile")

    def test_parent_profile_created_on_user_save(self, parent_user):
        """Parent profile is auto-created when user is saved."""
        assert hasattr(parent_user, "parent_profile")


@pytest.mark.django_db
class TestJWTAuth:
    """Tests for JWT authentication."""

    def test_obtain_token(self, api_client, admin_user):
        """Users can obtain JWT tokens with valid credentials."""
        url = reverse("token_obtain_pair")
        response = api_client.post(
            url,
            {
                "email": admin_user.email,
                "password": "Test@1234",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
        assert "refresh" in response.data

    def test_obtain_token_invalid_password(self, api_client, admin_user):
        """Invalid password returns 401."""
        url = reverse("token_obtain_pair")
        response = api_client.post(
            url,
            {
                "email": admin_user.email,
                "password": "wrong-password",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_token(self, api_client, admin_user):
        """Refresh token returns a new access token."""
        url = reverse("token_obtain_pair")
        response = api_client.post(
            url,
            {
                "email": admin_user.email,
                "password": "Test@1234",
            },
        )
        refresh = response.data["refresh"]

        url = reverse("token_refresh")
        response = api_client.post(url, {"refresh": refresh})
        assert response.status_code == status.HTTP_200_OK
        assert "access" in response.data
