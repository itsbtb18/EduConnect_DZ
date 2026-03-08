"""
Unit tests for the chat app — models, message lifecycle, rooms, templates.
"""
import pytest
from datetime import timedelta
from django.utils import timezone
from django.db import IntegrityError


# ════════════════════════════════════════════════════════════════
# CONVERSATION MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestConversationModel:
    """Tests for the 1-to-1 Conversation model."""

    def test_create_conversation(self, school, admin_user, parent_user):
        from apps.chat.models import Conversation

        conv = Conversation.objects.create(
            school=school,
            room_type="ADMIN_PARENT",
            created_by=admin_user,
            participant_admin=admin_user,
            participant_other=parent_user,
            participant_other_role="PARENT",
        )
        assert conv.pk is not None
        assert conv.room_type == "ADMIN_PARENT"
        assert conv.participant_admin == admin_user
        assert conv.participant_other == parent_user

    def test_unique_participant_pair(self, school, admin_user, parent_user):
        from apps.chat.models import Conversation

        Conversation.objects.create(
            school=school,
            room_type="ADMIN_PARENT",
            created_by=admin_user,
            participant_admin=admin_user,
            participant_other=parent_user,
            participant_other_role="PARENT",
        )
        with pytest.raises(IntegrityError):
            Conversation.objects.create(
                school=school,
                room_type="ADMIN_PARENT",
                created_by=admin_user,
                participant_admin=admin_user,
                participant_other=parent_user,
                participant_other_role="PARENT",
            )

    def test_conversation_room_types(self, school, admin_user, teacher_user):
        from apps.chat.models import Conversation

        conv = Conversation.objects.create(
            school=school,
            room_type="ADMIN_TEACHER",
            created_by=admin_user,
            participant_admin=admin_user,
            participant_other=teacher_user,
            participant_other_role="TEACHER",
        )
        assert conv.room_type == "ADMIN_TEACHER"


# ════════════════════════════════════════════════════════════════
# MESSAGE MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestMessageModel:
    """Tests for the Message model (1-to-1)."""

    @pytest.fixture
    def conversation(self, school, admin_user, parent_user):
        from apps.chat.models import Conversation

        return Conversation.objects.create(
            school=school,
            room_type="ADMIN_PARENT",
            created_by=admin_user,
            participant_admin=admin_user,
            participant_other=parent_user,
            participant_other_role="PARENT",
        )

    def test_create_message(self, conversation, admin_user):
        from apps.chat.models import Message

        msg = Message.objects.create(
            conversation=conversation,
            sender=admin_user,
            content="Bonjour, parent!",
        )
        assert msg.pk is not None
        assert msg.content == "Bonjour, parent!"
        assert msg.status == "SENT"
        assert not msg.is_read
        assert not msg.is_pinned
        assert not msg.is_deleted

    def test_message_pin(self, conversation, admin_user):
        from apps.chat.models import Message

        msg = Message.objects.create(
            conversation=conversation,
            sender=admin_user,
            content="Important info",
        )
        msg.is_pinned = True
        msg.save()
        msg.refresh_from_db()
        assert msg.is_pinned

    def test_message_soft_delete(self, conversation, admin_user):
        from apps.chat.models import Message

        msg = Message.objects.create(
            conversation=conversation,
            sender=admin_user,
            content="To be deleted",
        )
        msg.soft_delete()
        msg.refresh_from_db()
        assert msg.is_deleted
        assert msg.deleted_at is not None

    def test_message_can_delete_within_60s(self, conversation, admin_user):
        from apps.chat.models import Message

        msg = Message.objects.create(
            conversation=conversation,
            sender=admin_user,
            content="Recent message",
        )
        assert msg.can_delete()

    def test_message_cannot_delete_after_60s(self, conversation, admin_user):
        from apps.chat.models import Message

        msg = Message.objects.create(
            conversation=conversation,
            sender=admin_user,
            content="Old message",
        )
        msg.created_at = timezone.now() - timedelta(seconds=120)
        msg.save(update_fields=["created_at"])
        assert not msg.can_delete()

    def test_message_with_attachment(self, conversation, admin_user):
        from apps.chat.models import Message

        msg = Message.objects.create(
            conversation=conversation,
            sender=admin_user,
            content="See attached",
            attachment_type="image",
            attachment_name="photo.jpg",
            attachment_size=1024,
        )
        assert msg.attachment_type == "image"
        assert msg.attachment_name == "photo.jpg"

    def test_message_read_receipt(self, conversation, admin_user):
        from apps.chat.models import Message

        msg = Message.objects.create(
            conversation=conversation,
            sender=admin_user,
            content="Check this",
        )
        msg.status = "READ"
        msg.is_read = True
        msg.read_at = timezone.now()
        msg.save()
        msg.refresh_from_db()
        assert msg.status == "READ"
        assert msg.is_read
        assert msg.read_at is not None


# ════════════════════════════════════════════════════════════════
# CHATROOM MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestChatRoomModel:
    """Tests for the ChatRoom (group/broadcast) model."""

    def test_create_chatroom(self, school, admin_user):
        from apps.chat.models import ChatRoom

        room = ChatRoom.objects.create(
            school=school,
            room_type="BROADCAST",
            name="Annonces Générales",
            created_by=admin_user,
        )
        assert room.pk is not None
        assert room.room_type == "BROADCAST"
        assert room.is_active

    def test_chatroom_types(self, school, admin_user):
        from apps.chat.models import ChatRoom

        types = [
            "CLASS_GROUP", "SECTION_GROUP", "TEACHER_ROOM",
            "PARENT_ROOM", "BROADCAST", "CUSTOM",
        ]
        for rtype in types:
            room = ChatRoom.objects.create(
                school=school,
                room_type=rtype,
                name=f"Room {rtype}",
                created_by=admin_user,
            )
            assert room.room_type == rtype

    def test_chatroom_membership(self, school, admin_user, teacher_user):
        from apps.chat.models import ChatRoom, ChatRoomMembership

        room = ChatRoom.objects.create(
            school=school,
            room_type="TEACHER_ROOM",
            name="Salle des profs",
            created_by=admin_user,
        )
        membership = ChatRoomMembership.objects.create(
            room=room,
            user=teacher_user,
            role="MEMBER",
        )
        assert membership.role == "MEMBER"
        assert not membership.is_muted

    def test_chatroom_admin_membership(self, school, admin_user):
        from apps.chat.models import ChatRoom, ChatRoomMembership

        room = ChatRoom.objects.create(
            school=school,
            room_type="BROADCAST",
            name="Admin Broadcast",
            created_by=admin_user,
        )
        membership = ChatRoomMembership.objects.create(
            room=room,
            user=admin_user,
            role="ADMIN",
        )
        assert membership.role == "ADMIN"


@pytest.mark.django_db
class TestChatRoomMessageModel:
    """Tests for ChatRoomMessage model."""

    @pytest.fixture
    def chatroom(self, school, admin_user):
        from apps.chat.models import ChatRoom

        return ChatRoom.objects.create(
            school=school,
            room_type="BROADCAST",
            name="Test Room",
            created_by=admin_user,
        )

    def test_create_room_message(self, chatroom, admin_user):
        from apps.chat.models import ChatRoomMessage

        msg = ChatRoomMessage.objects.create(
            room=chatroom,
            sender=admin_user,
            content="Hello room!",
        )
        assert msg.pk is not None
        assert msg.content == "Hello room!"
        assert not msg.is_pinned
        assert not msg.is_deleted

    def test_room_message_soft_delete(self, chatroom, admin_user):
        from apps.chat.models import ChatRoomMessage

        msg = ChatRoomMessage.objects.create(
            room=chatroom,
            sender=admin_user,
            content="Delete me",
        )
        msg.soft_delete()
        msg.refresh_from_db()
        assert msg.is_deleted

    def test_room_message_pin(self, chatroom, admin_user):
        from apps.chat.models import ChatRoomMessage

        msg = ChatRoomMessage.objects.create(
            room=chatroom,
            sender=admin_user,
            content="Pin this",
        )
        msg.is_pinned = True
        msg.save()
        msg.refresh_from_db()
        assert msg.is_pinned


# ════════════════════════════════════════════════════════════════
# MESSAGE TEMPLATE MODEL TESTS
# ════════════════════════════════════════════════════════════════


@pytest.mark.django_db
class TestMessageTemplateModel:
    """Tests for MessageTemplate model."""

    def test_create_template(self, school, admin_user):
        from apps.chat.models import MessageTemplate

        tpl = MessageTemplate.objects.create(
            school=school,
            name="Rappel absence",
            content="Votre enfant était absent le {date}. Merci de justifier.",
            category="ABSENCE",
            created_by=admin_user,
        )
        assert tpl.pk is not None
        assert tpl.name == "Rappel absence"
        assert tpl.category == "ABSENCE"

    def test_template_categories(self, school, admin_user):
        from apps.chat.models import MessageTemplate

        categories = ["ABSENCE", "GRADE", "PAYMENT", "GENERAL", "MEETING", "DISCIPLINE"]
        for cat in categories:
            tpl = MessageTemplate.objects.create(
                school=school,
                name=f"Template {cat}",
                content=f"Content for {cat}",
                category=cat,
                created_by=admin_user,
            )
            assert tpl.category == cat
