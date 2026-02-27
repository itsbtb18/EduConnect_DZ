from django.contrib import admin
from .models import ExamType, Grade, ReportCard


@admin.register(ExamType)
class ExamTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "weight", "max_score")


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ("student", "subject", "exam_type", "score", "max_score", "status")
    list_filter = ("status", "exam_type", "subject")


@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = ("student", "semester", "general_average", "rank", "is_published")
    list_filter = ("is_published", "semester")
