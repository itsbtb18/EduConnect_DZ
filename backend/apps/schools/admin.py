from django.contrib import admin
from .models import AcademicYear, School, Semester


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "code",
        "city",
        "wilaya",
        "school_type",
        "subscription_plan",
        "is_active",
    )
    list_filter = ("school_type", "subscription_plan", "is_active", "wilaya")
    search_fields = ("name", "code", "city")


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ("school", "name", "start_date", "end_date", "is_current")
    list_filter = ("is_current", "school")


@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ("name", "academic_year", "start_date", "end_date", "is_current")
    list_filter = ("is_current",)
