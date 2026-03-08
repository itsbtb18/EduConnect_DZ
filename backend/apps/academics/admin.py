from django.contrib import admin

from .models import (
    Class,
    Lesson,
    Level,
    LevelSubject,
    Resource,
    Room,
    ScheduleSlot,
    Stream,
    Subject,
    TeacherAssignment,
    TimeSlotConfig,
    Timetable,
)


# ── Hierarchy ────────────────────────────────────────────────────────────


@admin.register(Level)
class LevelAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "section",
        "school",
        "order",
        "max_grade",
        "passing_grade",
        "has_streams",
    )
    list_filter = ("school", "section__section_type", "has_streams")
    ordering = ("school", "section", "order")


@admin.register(Stream)
class StreamAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "name",
        "level",
        "school",
        "is_tronc_commun",
        "order",
    )
    list_filter = ("school", "level", "is_tronc_commun")
    ordering = ("school", "level", "order")


# ── Subjects ─────────────────────────────────────────────────────────────


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ("name", "arabic_name", "code", "school", "color")
    list_filter = ("school",)
    search_fields = ("name", "arabic_name", "code")


@admin.register(LevelSubject)
class LevelSubjectAdmin(admin.ModelAdmin):
    list_display = (
        "subject",
        "level",
        "stream",
        "coefficient",
        "is_mandatory",
        "weekly_hours",
        "school",
    )
    list_filter = ("school", "level", "stream", "is_mandatory")
    ordering = ("school", "level", "stream", "-coefficient")


# ── Classroom ────────────────────────────────────────────────────────────


@admin.register(Class)
class ClassAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "level",
        "stream",
        "section",
        "academic_year",
        "capacity",
        "homeroom_teacher",
        "school",
    )
    list_filter = ("school", "section", "level", "academic_year")
    ordering = ("school", "level__order", "name")


# ── Teacher Assignment ───────────────────────────────────────────────────


@admin.register(TeacherAssignment)
class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ("teacher", "subject", "assigned_class", "academic_year", "school")
    list_filter = ("school", "academic_year")


# ── Schedule ─────────────────────────────────────────────────────────────


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
    list_filter = ("school", "day_of_week")


# ── Lessons & Resources ─────────────────────────────────────────────────


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "subject", "assigned_class", "teacher", "order")
    list_filter = ("school",)


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "resource_type", "subject", "assigned_class", "teacher")
    list_filter = ("school", "resource_type")


# ── Timetable ────────────────────────────────────────────────────────────


@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "class_group",
        "academic_year",
        "uploaded_by",
        "created_at",
    )
    list_filter = ("school", "academic_year")


# ── Room & TimeSlotConfig ────────────────────────────────────────────────


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "room_type", "capacity", "is_available", "school")
    list_filter = ("school", "room_type", "is_available")


@admin.register(TimeSlotConfig)
class TimeSlotConfigAdmin(admin.ModelAdmin):
    list_display = ("label", "start_time", "end_time", "order", "is_break", "school")
    list_filter = ("school", "is_break")
    ordering = ("school", "order")
