from django.contrib import admin
from .models import AcademicYear, School, Section


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "address",
        "phone",
        "subdomain",
        "subscription_plan",
        "subscription_active",
    )
    list_filter = ("subscription_plan", "subscription_active")
    search_fields = ("name", "address", "subdomain")


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "section_type", "is_active")
    list_filter = ("section_type", "school", "is_active")


@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ("school", "name", "start_date", "end_date", "is_current")
    list_filter = ("is_current", "school")
