from django.contrib import admin

from .models import Grade, ReportCard, Subject, TrimesterConfig


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "class_obj", "coefficient", "teacher")
    list_filter = ("school", "section")


@admin.register(TrimesterConfig)
class TrimesterConfigAdmin(admin.ModelAdmin):
    list_display = (
        "school",
        "section",
        "continuous_weight",
        "test1_weight",
        "test2_weight",
        "final_weight",
    )
    list_filter = ("school",)


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "subject",
        "exam_type",
        "trimester",
        "value",
        "max_value",
        "status",
    )
    list_filter = ("status", "exam_type", "trimester")


@admin.register(ReportCard)
class ReportCardAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "trimester",
        "academic_year",
        "general_average",
        "rank",
        "is_published",
    )
    list_filter = ("is_published", "trimester")
