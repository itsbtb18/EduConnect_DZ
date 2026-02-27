from django.contrib import admin
from .models import HomeworkSubmission, HomeworkTask


@admin.register(HomeworkTask)
class HomeworkTaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "subject",
        "classroom",
        "teacher",
        "due_date",
        "is_published",
    )


@admin.register(HomeworkSubmission)
class HomeworkSubmissionAdmin(admin.ModelAdmin):
    list_display = ("student", "task", "status", "score", "submitted_at")
    list_filter = ("status",)
