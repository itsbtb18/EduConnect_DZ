"""
WebSocket consumer for real-time chat.
Authenticates via JWT from query param, enforces room participation.
"""

from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer handling real-time chat messages."""

    async def connect(self):
        self.room_id = self.scope["url_route"]["kwargs"]["room_id"]
        self.room_group_name = f"chat_{self.room_id}"
        self.user = None

        # ---- Authenticate via JWT from query string ----
        query_string = self.scope.get("query_string", b"").decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]

        if not token:
            await self.close(code=4001)
            return

        self.user = await self._authenticate_token(token)
        if self.user is None:
            await self.close(code=4001)
            return

        # ---- Verify user is a participant of this room ----
        is_participant = await self._is_room_participant(self.user, self.room_id)
        if not is_participant:
            await self.close(code=4003)
            return

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        if hasattr(self, "room_group_name"):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name
            )

    async def receive_json(self, content, **kwargs):
        if self.user is None:
            return

        message_content = content.get("content", "")
        attachment_type = content.get("attachment_type")

        # Save message to database
        message_data = await self._save_message(
            room_id=self.room_id,
            sender=self.user,
            content=message_content,
            attachment_type=attachment_type,
        )

        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message_data,
            },
        )

    async def chat_message(self, event):
        """Receive message from room group and send to WebSocket."""
        await self.send_json(event["message"])

    # -----------------------------------------------------------------------
    # Database helpers
    # -----------------------------------------------------------------------

    @database_sync_to_async
    def _authenticate_token(self, token):
        """Validate a JWT access token and return the user or None."""
        try:
            from rest_framework_simplejwt.tokens import AccessToken

            from apps.accounts.models import User

            validated = AccessToken(token)
            user_id = validated.get("user_id")
            return User.objects.get(pk=user_id, is_active=True)
        except Exception:
            return None

    @database_sync_to_async
    def _is_room_participant(self, user, room_id):
        """Check if the user is a participant of the given room."""
        from .models import ChatRoom

        return ChatRoom.objects.filter(pk=room_id, participants=user).exists()

    @database_sync_to_async
    def _save_message(self, room_id, sender, content, attachment_type=None):
        """Persist a message and return serialisable dict."""
        from .models import ChatRoom, Message

        room = ChatRoom.objects.get(pk=room_id)
        message = Message.objects.create(
            room=room,
            sender=sender,
            content=content,
            attachment_type=attachment_type,
        )
        return {
            "id": str(message.id),
            "room_id": str(message.room_id),
            "sender_id": str(sender.id),
            "sender_name": sender.full_name,
            "content": message.content,
            "attachment_type": message.attachment_type,
            "sent_at": message.sent_at.isoformat(),
        }
