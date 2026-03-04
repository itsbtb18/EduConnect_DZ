from django.contrib import admin

from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "participant_admin",
        "participant_other",
        "participant_other_role",
        "last_message_at",
        "unread_count_admin",
        "school",
    )
    list_filter = ("participant_other_role", "school")
    search_fields = (
        "participant_admin__first_name",
        "participant_admin__last_name",
        "participant_other__first_name",
        "participant_other__last_name",
    )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        "sender",
        "conversation",
        "content_preview",
        "is_read",
        "created_at",
    )
    list_filter = ("is_read",)
    search_fields = ("content",)

    @admin.display(description="Content")
    def content_preview(self, obj):
        if obj.content:
            return obj.content[:60]
        return f"[{obj.attachment_type or 'attachment'}]"
