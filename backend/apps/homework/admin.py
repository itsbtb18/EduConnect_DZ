from django.contrib import admin
from .models import HomeworkPost, HomeworkAttachment, HomeworkView


@admin.register(HomeworkPost)
class HomeworkPostAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "subject",
        "class_obj",
        "teacher",
        "due_date",
        "is_corrected",
    )
    list_filter = ("is_corrected", "is_deleted")


@admin.register(HomeworkAttachment)
class HomeworkAttachmentAdmin(admin.ModelAdmin):
    list_display = ("homework", "file_name", "file_type", "created_at")


@admin.register(HomeworkView)
class HomeworkViewAdmin(admin.ModelAdmin):
    list_display = ("student", "homework", "viewed_at")
