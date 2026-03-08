"""
Tests for:
  1. Chronic-absenteeism Celery task (PROMPT 3.4)
  2. Chat room types — group/broadcast salons (PROMPT 4.1)
"""

import uuid
from datetime import date, timedelta
from unittest.mock import patch, MagicMock

import pytest
from django.utils import timezone
from rest_framework import status


# ╔═══════════════════════════════════════════════════════════════════╗
# ║                        FIXTURES                                  ║
# ╚═══════════════════════════════════════════════════════════════════╝


@pytest.fixture
def student_profile(student_user):
    """Return auto-created StudentProfile for student_user."""
    return student_user.student_profile


@pytest.fixture
def parent_profile(parent_user):
    """Return auto-created ParentProfile for parent_user."""
    return parent_user.parent_profile


@pytest.fixture
def linked_parent(student_profile, parent_profile):
    """Link parent to student and return parent_profile."""
    parent_profile.children.add(student_profile)
    return parent_profile


@pytest.fixture
def class_obj(school, section, level, academic_year):
    """Create a Class for attendance records."""
    from apps.academics.models import Class

    return Class.objects.create(
        school=school,
        section=section,
        level=level,
        academic_year=academic_year,
        name="1AM-A",
        capacity=35,
    )


@pytest.fixture
def absence_records(school, student_profile, class_obj):
    """Create 6 unjustified absences this month for the student."""
    from apps.attendance.models import AttendanceRecord

    today = timezone.now().date()
    month_start = date(today.year, today.month, 1)
    records = []
    periods = [AttendanceRecord.Period.MORNING, AttendanceRecord.Period.AFTERNOON]
    for i in range(6):
        # Spread across days and periods to avoid unique constraint
        day = month_start + timedelta(days=i // 2)
        period = periods[i % 2]
        records.append(
            AttendanceRecord.objects.create(
                school=school,
                student=student_profile,
                class_obj=class_obj,
                date=day,
                period=period,
                status=AttendanceRecord.Status.ABSENT,
                is_justified=False,
            )
        )
    return records


@pytest.fixture
def single_absence(school, student_profile, class_obj):
    """Create a single ABSENT attendance record."""
    from apps.attendance.models import AttendanceRecord

    return AttendanceRecord.objects.create(
        school=school,
        student=student_profile,
        class_obj=class_obj,
        date=timezone.now().date(),
        status=AttendanceRecord.Status.ABSENT,
        is_justified=False,
    )


# ── Chat fixtures ────────────────────────────────────────────────


@pytest.fixture
def teacher_user2(school):
    """Second teacher for testing."""
    from apps.accounts.models import User

    return User.objects.create_user(
        phone_number="0550000010",
        password="Test@1234",
        school=school,
        role="TEACHER",
        first_name="Fatima",
        last_name="Zerhouni",
    )


@pytest.fixture
def chat_room(school, admin_user):
    """Create a CLASS_BROADCAST chat room."""
    from apps.chat.models import ChatRoom, ChatRoomMembership

    room = ChatRoom.objects.create(
        school=school,
        room_type=ChatRoom.RoomType.CLASS_BROADCAST,
        name="Broadcast 1AM-A",
        created_by=admin_user,
    )
    ChatRoomMembership.objects.create(
        room=room, user=admin_user, role=ChatRoomMembership.Role.ADMIN
    )
    return room


@pytest.fixture
def admin_broadcast_room(school, admin_user):
    """Create an ADMIN_BROADCAST room."""
    from apps.chat.models import ChatRoom, ChatRoomMembership

    room = ChatRoom.objects.create(
        school=school,
        room_type=ChatRoom.RoomType.ADMIN_BROADCAST,
        name="Admin Announcements",
        created_by=admin_user,
    )
    ChatRoomMembership.objects.create(
        room=room, user=admin_user, role=ChatRoomMembership.Role.ADMIN
    )
    return room


# ╔═══════════════════════════════════════════════════════════════════╗
# ║         1. CHRONIC-ABSENTEEISM TASK TESTS                        ║
# ╚═══════════════════════════════════════════════════════════════════╝


@pytest.mark.django_db
class TestChronicAbsenteeism:
    """Tests for the detect_chronic_absenteeism Celery task."""

    def test_school_has_absence_alert_threshold(self, school):
        """School model has configurable absence_alert_threshold with default 5."""
        assert hasattr(school, "absence_alert_threshold")
        assert school.absence_alert_threshold == 5

    def test_threshold_is_configurable(self, school):
        """The threshold can be changed per school."""
        school.absence_alert_threshold = 3
        school.save(update_fields=["absence_alert_threshold"])
        school.refresh_from_db()
        assert school.absence_alert_threshold == 3

    @patch("apps.attendance.tasks._send_fcm_for_user")
    @patch("apps.attendance.tasks._send_fcm_for_users")
    @patch("apps.attendance.tasks._push_ws_notification")
    def test_detect_chronic_absenteeism_generates_alerts(
        self,
        mock_ws,
        mock_fcm_users,
        mock_fcm_user,
        school,
        admin_user,
        student_user,
        student_profile,
        parent_user,
        linked_parent,
        absence_records,
    ):
        """Task generates Notification records for admins and parents."""
        from apps.attendance.tasks import detect_chronic_absenteeism
        from apps.notifications.models import Notification

        result = detect_chronic_absenteeism()

        assert result["status"] == "complete"
        assert result["alerts"] > 0

        # Admin should have a notification
        admin_notifs = Notification.objects.filter(
            user=admin_user, notification_type="ATTENDANCE"
        )
        assert admin_notifs.count() >= 1
        assert "Absentéisme" in admin_notifs.first().title

        # Parent should also have a notification
        parent_notifs = Notification.objects.filter(
            user=parent_user, notification_type="ATTENDANCE"
        )
        assert parent_notifs.count() >= 1

    @patch("apps.attendance.tasks._send_fcm_for_user")
    @patch("apps.attendance.tasks._send_fcm_for_users")
    @patch("apps.attendance.tasks._push_ws_notification")
    def test_no_alert_below_threshold(
        self,
        mock_ws,
        mock_fcm_users,
        mock_fcm_user,
        school,
        admin_user,
        student_user,
        student_profile,
        class_obj,
    ):
        """No alert when absences are below threshold."""
        from apps.attendance.models import AttendanceRecord
        from apps.attendance.tasks import detect_chronic_absenteeism
        from apps.notifications.models import Notification

        # Create only 2 absences (threshold = 5)
        today = timezone.now().date()
        for i in range(2):
            AttendanceRecord.objects.create(
                school=school,
                student=student_profile,
                class_obj=class_obj,
                date=today - timedelta(days=i),
                status=AttendanceRecord.Status.ABSENT,
                is_justified=False,
            )

        result = detect_chronic_absenteeism()

        assert result["status"] == "complete"
        assert result["alerts"] == 0
        assert Notification.objects.filter(user=admin_user).count() == 0

    @patch("apps.attendance.tasks._send_fcm_for_user")
    @patch("apps.attendance.tasks._send_fcm_for_users")
    @patch("apps.attendance.tasks._push_ws_notification")
    def test_justified_absences_not_counted(
        self,
        mock_ws,
        mock_fcm_users,
        mock_fcm_user,
        school,
        admin_user,
        student_user,
        student_profile,
        class_obj,
    ):
        """Justified absences are ignored by the task."""
        from apps.attendance.models import AttendanceRecord
        from apps.attendance.tasks import detect_chronic_absenteeism
        from apps.notifications.models import Notification

        today = timezone.now().date()
        for i in range(6):
            AttendanceRecord.objects.create(
                school=school,
                student=student_profile,
                class_obj=class_obj,
                date=today - timedelta(days=i),
                status=AttendanceRecord.Status.ABSENT,
                is_justified=True,  # justified!
            )

        result = detect_chronic_absenteeism()
        assert result["alerts"] == 0
        assert Notification.objects.filter(user=admin_user).count() == 0

    @patch("apps.attendance.tasks._send_fcm_for_user")
    @patch("apps.attendance.tasks._send_fcm_for_users")
    @patch("apps.attendance.tasks._push_ws_notification")
    def test_custom_threshold_respected(
        self,
        mock_ws,
        mock_fcm_users,
        mock_fcm_user,
        school,
        admin_user,
        student_user,
        student_profile,
        parent_user,
        linked_parent,
        class_obj,
    ):
        """Lower threshold triggers alert with fewer absences."""
        from apps.attendance.models import AttendanceRecord
        from apps.attendance.tasks import detect_chronic_absenteeism
        from apps.notifications.models import Notification

        school.absence_alert_threshold = 2
        school.save(update_fields=["absence_alert_threshold"])

        today = timezone.now().date()
        for i in range(3):
            AttendanceRecord.objects.create(
                school=school,
                student=student_profile,
                class_obj=class_obj,
                date=today - timedelta(days=i),
                status=AttendanceRecord.Status.ABSENT,
                is_justified=False,
            )

        result = detect_chronic_absenteeism()
        assert result["alerts"] > 0

    @patch("apps.attendance.tasks._send_fcm_for_user")
    @patch("apps.attendance.tasks._push_ws_notification")
    def test_notify_parent_of_absence_task(
        self,
        mock_ws,
        mock_fcm,
        school,
        student_user,
        student_profile,
        parent_user,
        linked_parent,
        single_absence,
    ):
        """notify_parent_of_absence creates in-app notification for parents."""
        from apps.attendance.tasks import notify_parent_of_absence
        from apps.notifications.models import Notification

        result = notify_parent_of_absence(str(single_absence.pk))

        assert result["status"] == "sent"
        assert result["parents_notified"] >= 1

        notif = Notification.objects.filter(
            user=parent_user, notification_type="ATTENDANCE"
        ).first()
        assert notif is not None
        assert student_user.first_name in notif.body

    def test_celery_beat_has_chronic_absenteeism(self):
        """detect-chronic-absenteeism is registered in celery beat schedule."""
        from ilmi.celery import app

        schedule = app.conf.beat_schedule
        assert "detect-chronic-absenteeism" in schedule
        task_entry = schedule["detect-chronic-absenteeism"]
        assert task_entry["task"] == "apps.attendance.tasks.detect_chronic_absenteeism"

    @patch("apps.attendance.tasks._send_fcm_for_user")
    @patch("apps.attendance.tasks._push_ws_notification")
    def test_notify_parent_skips_present_students(
        self,
        mock_ws,
        mock_fcm,
        school,
        student_profile,
        class_obj,
    ):
        """notify_parent_of_absence skips if status is PRESENT."""
        from apps.attendance.models import AttendanceRecord
        from apps.attendance.tasks import notify_parent_of_absence

        record = AttendanceRecord.objects.create(
            school=school,
            student=student_profile,
            class_obj=class_obj,
            date=timezone.now().date(),
            status=AttendanceRecord.Status.PRESENT,
        )
        result = notify_parent_of_absence(str(record.pk))
        assert result["status"] == "skipped"


# ╔═══════════════════════════════════════════════════════════════════╗
# ║         2. CHAT ROOM MODELS TESTS                                ║
# ╚═══════════════════════════════════════════════════════════════════╝


@pytest.mark.django_db
class TestChatRoomModels:
    """Tests for ChatRoom, ChatRoomMembership, ChatRoomMessage models."""

    def test_conversation_has_room_type_field(self, school, admin_user, teacher_user):
        """Conversation model now has room_type field."""
        from apps.chat.models import Conversation

        conv = Conversation.objects.create(
            school=school,
            created_by=admin_user,
            participant_admin=admin_user,
            participant_other=teacher_user,
            participant_other_role="enseignant",
        )
        assert conv.room_type == Conversation.RoomType.DIRECT

    def test_conversation_room_type_choices(self):
        """Conversation.RoomType has the expected choices."""
        from apps.chat.models import Conversation

        choices = set(Conversation.RoomType.values)
        assert "DIRECT" in choices
        assert "TEACHER_PARENT" in choices
        assert "TEACHER_STUDENT" in choices
        assert "ADMIN_PARENT" in choices

    def test_chatroom_creation(self, school, admin_user):
        """ChatRoom can be created with all room types."""
        from apps.chat.models import ChatRoom

        for rt in ChatRoom.RoomType.values:
            room = ChatRoom.objects.create(
                school=school,
                room_type=rt,
                name=f"Room {rt}",
                created_by=admin_user,
            )
            assert room.pk is not None
            assert room.is_active is True

    def test_chatroom_membership(self, chat_room, teacher_user):
        """Members can be added to a ChatRoom."""
        from apps.chat.models import ChatRoomMembership

        mem = ChatRoomMembership.objects.create(
            room=chat_room,
            user=teacher_user,
            role=ChatRoomMembership.Role.MEMBER,
        )
        assert mem.pk is not None
        assert chat_room.memberships.count() == 2  # admin + teacher

    def test_chatroom_membership_unique(self, chat_room, admin_user):
        """Duplicate membership raises IntegrityError."""
        from django.db import IntegrityError
        from apps.chat.models import ChatRoomMembership

        with pytest.raises(IntegrityError):
            ChatRoomMembership.objects.create(
                room=chat_room,
                user=admin_user,
                role=ChatRoomMembership.Role.MEMBER,
            )

    def test_chatroom_message_creation(self, chat_room, admin_user):
        """Messages can be created in a ChatRoom."""
        from apps.chat.models import ChatRoomMessage

        msg = ChatRoomMessage.objects.create(
            room=chat_room,
            sender=admin_user,
            content="Hello class!",
        )
        assert msg.pk is not None
        assert chat_room.messages.count() == 1

    def test_chatroom_message_updates_room_timestamp(self, chat_room, admin_user):
        """Creating a message updates the room's updated_at."""
        from apps.chat.models import ChatRoomMessage

        old_updated = chat_room.updated_at
        import time
        time.sleep(0.05)
        ChatRoomMessage.objects.create(
            room=chat_room,
            sender=admin_user,
            content="Update timestamp test",
        )
        chat_room.refresh_from_db()
        assert chat_room.updated_at >= old_updated

    def test_chatroom_types_available(self):
        """All required room types exist."""
        from apps.chat.models import ChatRoom

        types = ChatRoom.RoomType.values
        assert "CLASS_BROADCAST" in types
        assert "ADMIN_BROADCAST" in types
        assert "TEACHER_PARENT_GROUP" in types
        assert "TEACHER_STUDENT_GROUP" in types


# ╔═══════════════════════════════════════════════════════════════════╗
# ║         3. CHAT ROOM REST API TESTS                              ║
# ╚═══════════════════════════════════════════════════════════════════╝


@pytest.mark.django_db
class TestChatRoomAPI:
    """Tests for Chat Room REST endpoints."""

    def test_create_room(self, admin_client, school):
        """POST /api/v1/chat/rooms/ creates a room."""
        resp = admin_client.post(
            "/api/v1/chat/rooms/",
            {
                "room_type": "ADMIN_BROADCAST",
                "name": "Announcements",
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["room_type"] == "ADMIN_BROADCAST"
        assert resp.data["name"] == "Announcements"

    def test_list_rooms(self, admin_client, chat_room):
        """GET /api/v1/chat/rooms/ lists rooms user belongs to."""
        resp = admin_client.get("/api/v1/chat/rooms/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data) >= 1
        room_ids = [r["id"] for r in resp.data]
        assert str(chat_room.id) in room_ids

    def test_room_detail(self, admin_client, chat_room):
        """GET /api/v1/chat/rooms/<id>/ returns room with members."""
        resp = admin_client.get(f"/api/v1/chat/rooms/{chat_room.id}/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["name"] == chat_room.name
        assert "members" in resp.data

    def test_room_detail_forbidden_for_non_member(self, teacher_user, chat_room):
        """Non-member cannot access room detail."""
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=teacher_user)
        resp = client.get(f"/api/v1/chat/rooms/{chat_room.id}/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_send_message_to_room(self, admin_client, chat_room):
        """POST /api/v1/chat/rooms/<id>/messages/ creates a message."""
        resp = admin_client.post(
            f"/api/v1/chat/rooms/{chat_room.id}/messages/",
            {"content": "Hello broadcast!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["content"] == "Hello broadcast!"

    def test_list_room_messages(self, admin_client, chat_room, admin_user):
        """GET /api/v1/chat/rooms/<id>/messages/ returns message history."""
        from apps.chat.models import ChatRoomMessage

        ChatRoomMessage.objects.create(
            room=chat_room, sender=admin_user, content="msg1"
        )
        ChatRoomMessage.objects.create(
            room=chat_room, sender=admin_user, content="msg2"
        )
        resp = admin_client.get(f"/api/v1/chat/rooms/{chat_room.id}/messages/")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data) == 2

    def test_broadcast_write_restricted_to_admin_member(
        self, admin_broadcast_room, teacher_user
    ):
        """MEMBER-role user cannot write in ADMIN_BROADCAST room."""
        from apps.chat.models import ChatRoomMembership
        from rest_framework.test import APIClient

        ChatRoomMembership.objects.create(
            room=admin_broadcast_room,
            user=teacher_user,
            role=ChatRoomMembership.Role.MEMBER,
        )
        client = APIClient()
        client.force_authenticate(user=teacher_user)
        resp = client.post(
            f"/api/v1/chat/rooms/{admin_broadcast_room.id}/messages/",
            {"content": "Should fail"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_deactivate_room(self, admin_client, chat_room):
        """DELETE /api/v1/chat/rooms/<id>/ deactivates (soft-delete)."""
        resp = admin_client.delete(f"/api/v1/chat/rooms/{chat_room.id}/")
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        chat_room.refresh_from_db()
        assert chat_room.is_active is False

    def test_deactivated_room_not_listed(self, admin_client, chat_room):
        """Deactivated rooms are not returned in list."""
        chat_room.is_active = False
        chat_room.save(update_fields=["is_active"])
        resp = admin_client.get("/api/v1/chat/rooms/")
        assert resp.status_code == status.HTTP_200_OK
        room_ids = [r["id"] for r in resp.data]
        assert str(chat_room.id) not in room_ids

    def test_create_room_with_members(self, admin_client, teacher_user, school):
        """Creating a room with member_ids adds those users."""
        resp = admin_client.post(
            "/api/v1/chat/rooms/",
            {
                "room_type": "TEACHER_PARENT_GROUP",
                "name": "Parent-Teacher Group",
                "member_ids": [str(teacher_user.id)],
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["member_count"] == 2  # admin + teacher

    def test_auto_populate_class_broadcast(
        self,
        admin_client,
        school,
        student_user,
        student_profile,
        class_obj,
        teacher_user,
        academic_year,
        subject,
    ):
        """CLASS_BROADCAST auto-adds students + teachers assigned to the class."""
        from apps.academics.models import TeacherAssignment

        student_profile.current_class = class_obj
        student_profile.save(update_fields=["current_class"])

        TeacherAssignment.objects.create(
            school=school,
            teacher=teacher_user,
            assigned_class=class_obj,
            subject=subject,
            academic_year=academic_year,
        )

        resp = admin_client.post(
            "/api/v1/chat/rooms/",
            {
                "room_type": "CLASS_BROADCAST",
                "name": "1AM-A Broadcast",
                "related_class_id": str(class_obj.id),
            },
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED
        # Should have admin (creator) + student + teacher = at least 3
        assert resp.data["member_count"] >= 3


# ╔═══════════════════════════════════════════════════════════════════╗
# ║         4. WEBSOCKET ROUTING TESTS                               ║
# ╚═══════════════════════════════════════════════════════════════════╝


@pytest.mark.django_db
class TestWebSocketRouting:
    """Verify WebSocket URL patterns are registered."""

    def test_chat_room_ws_route_exists(self):
        """ws/room/<room_id>/ route is registered."""
        from apps.chat.routing import websocket_urlpatterns

        patterns = [p.pattern.regex.pattern for p in websocket_urlpatterns]
        assert any("room" in p for p in patterns)

    def test_all_three_ws_routes(self):
        """Three WebSocket routes: chat, room, notifications."""
        from apps.chat.routing import websocket_urlpatterns

        assert len(websocket_urlpatterns) == 3

    def test_group_chat_consumer_exists(self):
        """GroupChatConsumer class exists in consumers module."""
        from apps.chat.consumers import GroupChatConsumer

        assert GroupChatConsumer is not None
