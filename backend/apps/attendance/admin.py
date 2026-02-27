from django.contrib import admin
from .models import AbsenceExcuse, AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ("student", "classroom", "date", "status", "marked_by")
    list_filter = ("status", "date")


@admin.register(AbsenceExcuse)
class AbsenceExcuseAdmin(admin.ModelAdmin):
    list_display = ("student", "date", "status", "submitted_by")
    list_filter = ("status",)
