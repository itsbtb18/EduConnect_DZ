from django.contrib import admin
from .models import Announcement, AnnouncementAttachment, AnnouncementRead


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "school",
        "author",
        "target_audience",
        "is_pinned",
    )
    list_filter = ("target_audience", "is_pinned", "is_deleted")


@admin.register(AnnouncementAttachment)
class AnnouncementAttachmentAdmin(admin.ModelAdmin):
    list_display = ("announcement", "file_name", "created_at")


@admin.register(AnnouncementRead)
class AnnouncementReadAdmin(admin.ModelAdmin):
    list_display = ("announcement", "user", "read_at")
