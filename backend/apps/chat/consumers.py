"""
WebSocket consumers for real-time chat and notifications.
Authenticates via JWT from query param.
Read receipts, typing indicators, message events.
"""

import json
import logging

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db import models
from django.utils import timezone

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers — FCM push for offline recipients
# ---------------------------------------------------------------------------


@database_sync_to_async
def _push_fcm_to_user(user_id, title, body, data=None):
    """Send FCM push to all devices of a user (fire-and-forget)."""
    try:
        from apps.notifications.models import DeviceToken
        from core.firebase import send_push_notification

        tokens = list(
            DeviceToken.objects.filter(user_id=user_id).values_list("token", flat=True)
        )
        for token in tokens:
            try:
                send_push_notification(token, title, body, data or {})
            except Exception:
                pass
    except Exception:
        logger.exception("FCM push failed for user %s", user_id)


@database_sync_to_async
def _push_fcm_to_users(user_ids, title, body, data=None):
    """Batch FCM push to multiple users."""
    try:
        from apps.notifications.models import DeviceToken
        from core.firebase import send_push_to_multiple

        tokens = list(
            DeviceToken.objects.filter(user_id__in=user_ids).values_list(
                "token", flat=True
            )
        )
        if tokens:
            send_push_to_multiple(tokens, title, body, data or {})
    except Exception:
        logger.exception("Batch FCM push failed")


# ---------------------------------------------------------------------------
# ChatConsumer — per-conversation
# ---------------------------------------------------------------------------


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for a specific conversation."""

    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"
        self.user = self.scope.get("user")

        # Reject unauthenticated
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Verify participation
        is_participant = await self._verify_participant()
        if not is_participant:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Mark messages as delivered when user connects
        await self._mark_delivered()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

    async def receive(self, text_data):
        if not self.user or not self.user.is_authenticated:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        event_type = data.get("type", "message")

        # Handle typing indicator
        if event_type == "typing":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing_indicator",
                    "user_id": str(self.user.id),
                    "user_name": self.user.full_name,
                    "is_typing": data.get("is_typing", True),
                },
            )
            return

        # Handle mark-read event
        if event_type == "mark_read":
            await self._mark_read()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "read_receipt",
                    "conversation_id": str(self.conversation_id),
                    "reader_id": str(self.user.id),
                    "read_at": timezone.now().isoformat(),
                },
            )
            return

        # Normal message
        content = data.get("content", "").strip()
        if not content:
            return

        # Save and broadcast
        message_data = await self._save_message(content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "message": message_data},
        )

        # Notify the other participant (WebSocket + FCM fallback)
        if message_data.get("recipient_id"):
            recipient_id = message_data["recipient_id"]
            await self.channel_layer.group_send(
                f"notifications_{recipient_id}",
                {
                    "type": "new_message_notification",
                    "conversation_id": str(self.conversation_id),
                    "sender_name": message_data["sender_name"],
                    "preview": content[:60],
                },
            )
            # FCM push for offline recipient
            await _push_fcm_to_user(
                recipient_id,
                f"Message de {message_data['sender_name']}",
                content[:120],
                {"conversation_id": str(self.conversation_id)},
            )

    async def chat_message(self, event):
        """Relay message to WebSocket client."""
        await self.send(text_data=json.dumps(event["message"]))

    async def typing_indicator(self, event):
        """Relay typing indicator (don't send back to the typer)."""
        if event.get("user_id") != str(self.user.id):
            await self.send(text_data=json.dumps({
                "event": "typing",
                "user_id": event["user_id"],
                "user_name": event["user_name"],
                "is_typing": event["is_typing"],
            }))

    async def read_receipt(self, event):
        """Relay read receipt."""
        await self.send(text_data=json.dumps({
            "event": "messages_read",
            "conversation_id": event["conversation_id"],
            "reader_id": event["reader_id"],
            "read_at": event["read_at"],
        }))

    # -- DB helpers --

    @database_sync_to_async
    def _verify_participant(self):
        from .models import Conversation

        return (
            Conversation.objects.filter(
                pk=self.conversation_id,
            )
            .filter(
                models.Q(participant_admin=self.user)
                | models.Q(participant_other=self.user)
            )
            .exists()
        )

    @database_sync_to_async
    def _save_message(self, content):
        from .models import Conversation, Message

        conv = Conversation.objects.select_related(
            "participant_admin", "participant_other"
        ).get(pk=self.conversation_id)

        message = Message.objects.create(
            conversation=conv,
            sender=self.user,
            content=content,
            status=Message.Status.SENT,
        )

        other = (
            conv.participant_other
            if conv.participant_admin == self.user
            else conv.participant_admin
        )

        return {
            "id": str(message.id),
            "conversation_id": str(conv.id),
            "sender_id": str(self.user.id),
            "sender_name": self.user.full_name,
            "sender_is_admin": self.user == conv.participant_admin,
            "content": content,
            "attachment_url": None,
            "attachment_type": None,
            "attachment_name": None,
            "attachment_size": None,
            "is_read": False,
            "status": "SENT",
            "is_pinned": False,
            "is_deleted": False,
            "created_at": message.created_at.isoformat(),
            "recipient_id": str(other.id),
        }

    @database_sync_to_async
    def _mark_delivered(self):
        """Mark all messages from the other user as DELIVERED on connect."""
        from .models import Conversation, Message

        try:
            conv = Conversation.objects.get(pk=self.conversation_id)
            Message.objects.filter(
                conversation=conv,
                is_deleted=False,
                status=Message.Status.SENT,
            ).exclude(
                sender=self.user
            ).update(
                status=Message.Status.DELIVERED,
                delivered_at=timezone.now(),
            )
        except Exception:
            pass

    @database_sync_to_async
    def _mark_read(self):
        """Mark all messages from the other user as READ."""
        from .models import Conversation, Message

        try:
            conv = Conversation.objects.get(pk=self.conversation_id)
            now = timezone.now()
            Message.objects.filter(
                conversation=conv,
                is_deleted=False,
            ).exclude(
                sender=self.user
            ).exclude(
                status=Message.Status.READ
            ).update(
                is_read=True,
                status=Message.Status.READ,
                read_at=now,
            )
            # Reset unread counter
            if self.user == conv.participant_admin:
                Conversation.objects.filter(pk=conv.pk).update(
                    unread_count_admin=0,
                    is_read_by_admin=True,
                )
        except Exception:
            pass


# ---------------------------------------------------------------------------
# NotificationConsumer — global per-user channel
# ---------------------------------------------------------------------------


class NotificationConsumer(AsyncWebsocketConsumer):
    """Global WebSocket for real-time notifications (messages, payments, absences)."""

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.group_name = f"notifications_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def new_message_notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "new_message",
                    "conversation_id": event["conversation_id"],
                    "sender_name": event["sender_name"],
                    "preview": event["preview"],
                }
            )
        )

    async def payment_notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "payment_expired",
                    "message": event["message"],
                    "count": event["count"],
                }
            )
        )

    async def absence_notification(self, event):
        await self.send(
            text_data=json.dumps(
                {
                    "type": "absence_alert",
                    "message": event["message"],
                }
            )
        )

    async def room_message_notification(self, event):
        """Relay a group-room message notification."""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "room_message",
                    "room_id": event["room_id"],
                    "room_name": event["room_name"],
                    "sender_name": event["sender_name"],
                    "preview": event["preview"],
                }
            )
        )


# ---------------------------------------------------------------------------
# GroupChatConsumer — per-ChatRoom (broadcast / group salons)
# ---------------------------------------------------------------------------


class GroupChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for a ChatRoom (group / broadcast)."""

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"room_{self.room_id}"
        self.user = self.scope.get("user")

        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        is_member = await self._verify_membership()
        if not is_member:
            await self.close(code=4003)
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

    async def receive(self, text_data):
        if not self.user or not self.user.is_authenticated:
            return

        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        event_type = data.get("type", "message")

        # Handle typing indicator
        if event_type == "typing":
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "typing_indicator",
                    "user_id": str(self.user.id),
                    "user_name": self.user.full_name,
                    "is_typing": data.get("is_typing", True),
                },
            )
            return

        content = data.get("content", "").strip()
        if not content:
            return

        # Check write permission (only ADMIN members can write in broadcast)
        can_write = await self._can_write()
        if not can_write:
            await self.send(
                text_data=json.dumps(
                    {"error": "You do not have write permission in this room."}
                )
            )
            return

        message_data = await self._save_room_message(content)

        # Broadcast to the room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "room_chat_message", "message": message_data},
        )

        # Notify all other members via their personal notification channel + FCM
        other_member_ids = await self._get_other_member_ids()
        for uid in other_member_ids:
            await self.channel_layer.group_send(
                f"notifications_{uid}",
                {
                    "type": "room_message_notification",
                    "room_id": str(self.room_id),
                    "room_name": message_data.get("room_name", ""),
                    "sender_name": message_data["sender_name"],
                    "preview": content[:60],
                },
            )

        # Batch FCM push for offline members
        if other_member_ids:
            await _push_fcm_to_users(
                other_member_ids,
                f"{message_data.get('room_name', 'Salon')}: {message_data['sender_name']}",
                content[:120],
                {"room_id": str(self.room_id)},
            )

    async def room_chat_message(self, event):
        """Relay room message to WebSocket client."""
        await self.send(text_data=json.dumps(event["message"]))

    async def typing_indicator(self, event):
        """Relay typing indicator."""
        if event.get("user_id") != str(self.user.id):
            await self.send(text_data=json.dumps({
                "event": "typing",
                "user_id": event["user_id"],
                "user_name": event["user_name"],
                "is_typing": event["is_typing"],
            }))

    # -- DB helpers --

    @database_sync_to_async
    def _verify_membership(self):
        from .models import ChatRoomMembership

        return ChatRoomMembership.objects.filter(
            room_id=self.room_id, user=self.user
        ).exists()

    @database_sync_to_async
    def _can_write(self):
        from .models import ChatRoom, ChatRoomMembership

        try:
            room = ChatRoom.objects.get(pk=self.room_id)
        except ChatRoom.DoesNotExist:
            return False

        if room.room_type in (
            ChatRoom.RoomType.CLASS_BROADCAST,
            ChatRoom.RoomType.ADMIN_BROADCAST,
            ChatRoom.RoomType.ADMIN_ALL_BROADCAST,
        ):
            return ChatRoomMembership.objects.filter(
                room=room, user=self.user, role=ChatRoomMembership.Role.ADMIN
            ).exists()
        return True

    @database_sync_to_async
    def _save_room_message(self, content):
        from .models import ChatRoom, ChatRoomMessage

        room = ChatRoom.objects.get(pk=self.room_id)
        msg = ChatRoomMessage.objects.create(
            room=room, sender=self.user, content=content,
            status=ChatRoomMessage.Status.SENT,
        )
        return {
            "id": str(msg.id),
            "room_id": str(room.id),
            "room_name": room.name,
            "sender_id": str(self.user.id),
            "sender_name": self.user.full_name,
            "content": content,
            "attachment_url": None,
            "attachment_type": None,
            "status": "SENT",
            "is_pinned": False,
            "is_deleted": False,
            "created_at": msg.created_at.isoformat(),
        }

    @database_sync_to_async
    def _get_other_member_ids(self):
        from .models import ChatRoomMembership

        return list(
            ChatRoomMembership.objects.filter(room_id=self.room_id, is_muted=False)
            .exclude(user=self.user)
            .values_list("user_id", flat=True)
        )
