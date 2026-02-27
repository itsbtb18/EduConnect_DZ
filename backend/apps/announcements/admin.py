from django.contrib import admin
from .models import Announcement, Event


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "school",
        "author",
        "target_audience",
        "priority",
        "is_published",
    )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "school", "start_date", "end_date", "is_holiday")
