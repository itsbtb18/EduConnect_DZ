from django.contrib import admin
from .models import (
    Class,
    Lesson,
    Resource,
    ScheduleSlot,
    Subject,
    TeacherAssignment,
)


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = ("name", "level", "section", "academic_year", "max_students")
    list_filter = ("section", "academic_year")


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "code", "coefficient")
    list_filter = ("school",)


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "subject", "assigned_class", "academic_year")
    list_filter = ("school", "academic_year")


@admin.register(ScheduleSlot)
class ScheduleSlotAdmin(admin.ModelAdmin):
    list_display = (
        "assigned_class",
        "subject",
        "teacher",
        "day_of_week",
        "start_time",
        "end_time",
    )


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "assigned_class", "teacher", "order")


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "resource_type", "subject", "assigned_class", "teacher")
    list_filter = ("resource_type",)
