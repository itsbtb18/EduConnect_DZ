from django.contrib import admin
from .models import (
    Classroom,
    Lesson,
    Level,
    Resource,
    ScheduleSlot,
    Subject,
    TeacherAssignment,
)


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "school_stage", "order")
    list_filter = ("school", "school_stage")


@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ("name", "level", "school", "academic_year", "capacity")
    list_filter = ("school", "level")


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "code", "coefficient")
    list_filter = ("school",)


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "subject", "classroom", "academic_year")
    list_filter = ("school", "academic_year")


@admin.register(ScheduleSlot)
class ScheduleSlotAdmin(admin.ModelAdmin):
    list_display = (
        "classroom",
        "subject",
        "teacher",
        "day_of_week",
        "start_time",
        "end_time",
    )


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "classroom", "teacher", "order")


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "resource_type", "subject", "classroom", "teacher")
    list_filter = ("resource_type",)
