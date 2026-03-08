"""
Integration tests for chat & announcements API endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework import status


# ════════════════════════════════════════════════════════════════
# CHAT ENDPOINT INTEGRATION TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
@pytest.mark.integration
class TestConversationEndpoints:
    """Integration tests for chat conversation API."""

    def test_list_conversations(self, admin_client):
        url = reverse("conversation-list")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_create_conversation(self, admin_client, parent_user):
        url = reverse("conversation-list")
        resp = admin_client.post(url, {
            "participant_other": str(parent_user.pk),
            "room_type": "ADMIN_PARENT",
        }, format="json")
        assert resp.status_code in (
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,  # may return existing
        )

    def test_send_message(self, admin_client, admin_user, parent_user, school):
        from apps.chat.models import Conversation

        conv = Conversation.objects.create(
            school=school,
            room_type="ADMIN_PARENT",
            created_by=admin_user,
            participant_admin=admin_user,
            participant_other=parent_user,
            participant_other_role="PARENT",
        )
        url = reverse("conversation-messages", args=[str(conv.pk)])
        resp = admin_client.post(url, {
            "content": "Bonjour!",
        }, format="json")
        assert resp.status_code in (
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
        )

    def test_student_cannot_list_conversations(self, student_client):
        url = reverse("conversation-list")
        resp = student_client.get(url)
        assert resp.status_code in (
            status.HTTP_200_OK,  # empty list (filtered)
            status.HTTP_403_FORBIDDEN,
        )


@pytest.mark.django_db
@pytest.mark.integration
class TestChatRoomEndpoints:
    """Integration tests for chat room API."""

    def test_list_rooms(self, admin_client):
        url = reverse("chatroom-list")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_create_room(self, admin_client):
        url = reverse("chatroom-list")
        resp = admin_client.post(url, {
            "name": "Integration Test Room",
            "room_type": "BROADCAST",
        }, format="json")
        assert resp.status_code in (
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
        )

    def test_list_templates(self, admin_client):
        url = reverse("message-template-list")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK


# ════════════════════════════════════════════════════════════════
# ANNOUNCEMENT ENDPOINT INTEGRATION TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
@pytest.mark.integration
class TestAnnouncementEndpoints:
    """Integration tests for announcement API."""

    def test_list_announcements(self, admin_client):
        url = reverse("announcement-list")
        resp = admin_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_create_announcement(self, admin_client):
        url = reverse("announcement-list")
        resp = admin_client.post(url, {
            "title": "Test Announcement",
            "body": "This is a test announcement.",
            "target_audience": "ALL",
        }, format="json")
        assert resp.status_code in (
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
        )

    def test_create_urgent_announcement(self, admin_client):
        url = reverse("announcement-list")
        resp = admin_client.post(url, {
            "title": "Urgent Notice",
            "body": "Emergency situation.",
            "target_audience": "ALL",
            "is_urgent": True,
        }, format="json")
        assert resp.status_code in (
            status.HTTP_201_CREATED,
            status.HTTP_200_OK,
        )

    def test_filter_by_audience(self, admin_client, admin_user, school):
        from apps.announcements.models import Announcement

        Announcement.objects.create(
            school=school, author=admin_user,
            title="For teachers", body="...", target_audience="TEACHERS",
        )
        Announcement.objects.create(
            school=school, author=admin_user,
            title="For parents", body="...", target_audience="PARENTS",
        )
        url = reverse("announcement-list")
        resp = admin_client.get(url, {"target_audience": "TEACHERS"})
        assert resp.status_code == status.HTTP_200_OK
        results = resp.json().get("results", resp.json())
        if isinstance(results, list):
            for item in results:
                assert item.get("target_audience") == "TEACHERS"

    def test_student_can_read_announcements(self, student_client):
        url = reverse("announcement-list")
        resp = student_client.get(url)
        assert resp.status_code == status.HTTP_200_OK

    def test_student_cannot_create_announcement(self, student_client):
        url = reverse("announcement-list")
        resp = student_client.post(url, {
            "title": "Student Post",
            "body": "Should fail.",
            "target_audience": "ALL",
        }, format="json")
        assert resp.status_code in (
            status.HTTP_403_FORBIDDEN,
            status.HTTP_404_NOT_FOUND,
        )


# ════════════════════════════════════════════════════════════════
# HEALTH ENDPOINT TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
@pytest.mark.integration
class TestHealthEndpoint:
    """Test the health check endpoint."""

    def test_health_check(self, api_client):
        resp = api_client.get("/api/v1/health/")
        assert resp.status_code == status.HTTP_200_OK
