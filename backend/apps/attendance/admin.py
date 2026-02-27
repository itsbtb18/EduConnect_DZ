from django.contrib import admin
from .models import AbsenceExcuse, AttendanceRecord


@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ("student", "class_obj", "date", "status", "marked_by")
    list_filter = ("status", "date")


@admin.register(AbsenceExcuse)
class AbsenceExcuseAdmin(admin.ModelAdmin):
    list_display = ("attendance_record", "status", "submitted_by", "created_at")
    list_filter = ("status",)
