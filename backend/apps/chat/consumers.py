"""
WebSocket consumers for real-time chat and notifications.
Authenticates via JWT from query param.
"""

import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.db import models


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

        content = data.get("content", "").strip()
        if not content:
            return

        # Save and broadcast
        message_data = await self._save_message(content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "message": message_data},
        )

        # Notify the other participant
        if message_data.get("recipient_id"):
            await self.channel_layer.group_send(
                f"notifications_{message_data['recipient_id']}",
                {
                    "type": "new_message_notification",
                    "conversation_id": str(self.conversation_id),
                    "sender_name": message_data["sender_name"],
                    "preview": content[:60],
                },
            )

    async def chat_message(self, event):
        """Relay message to WebSocket client."""
        await self.send(text_data=json.dumps(event["message"]))

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
            "created_at": message.created_at.isoformat(),
            "recipient_id": str(other.id),
        }


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
