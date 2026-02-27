from django.contrib import admin
from .models import ChatRoom, Message, MessageRead


@admin.register(ChatRoom)
class ChatRoomAdmin(admin.ModelAdmin):
    list_display = ("id", "room_type", "school", "created_at")
    list_filter = ("room_type", "school")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "room", "content", "sent_at", "is_deleted")
    list_filter = ("is_deleted",)


@admin.register(MessageRead)
class MessageReadAdmin(admin.ModelAdmin):
    list_display = ("message", "user", "read_at")
