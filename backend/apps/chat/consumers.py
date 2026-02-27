"""
WebSocket consumer for real-time chat.
"""

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """WebSocket consumer handling real-time chat messages."""

    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        message_type = content.get("type", "chat_message")

        if message_type == "chat_message":
            # Save message to database
            message = await self.save_message(content)

            # Broadcast to room group
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "chat_message",
                    "message": {
                        "id": str(message.id),
                        "content": content["content"],
                        "sender_id": str(self.scope["user"].id),
                        "sender_name": self.scope["user"].full_name,
                        "created_at": message.created_at.isoformat(),
                    },
                },
            )

    async def chat_message(self, event):
        """Receive message from room group and send to WebSocket."""
        await self.send_json(event["message"])

    @database_sync_to_async
    def save_message(self, content):
        from .models import Conversation, Message

        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            school=self.scope["user"].school,
            conversation=conversation,
            sender=self.scope["user"],
            content=content["content"],
        )
        # Update last_message_at
        conversation.last_message_at = message.created_at
        conversation.save(update_fields=["last_message_at"])
        return message
