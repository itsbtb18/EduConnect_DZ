from django.contrib import admin

from .models import (
    AnnualAverage,
    ExamType,
    Grade,
    GradeAppeal,
    ReportCard,
    SubjectAverage,
    TrimesterAverage,
)


# ── ExamType ──────────────────────────────────────────────────────────────


@admin.register(ExamType)
class ExamTypeAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "subject",
        "classroom",
        "trimester",
        "percentage",
        "max_score",
    )
    list_filter = ("trimester", "academic_year")
    search_fields = ("name", "subject__name")


# ── Grade ─────────────────────────────────────────────────────────────────


@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "get_subject",
        "get_exam_name",
        "score",
        "is_absent",
        "is_published",
    )
    list_filter = ("is_published", "is_absent", "exam_type__trimester")
    search_fields = ("student__user__first_name", "student__user__last_name")
    raw_id_fields = ("student", "exam_type")

    @admin.display(description="Matière")
    def get_subject(self, obj):
        return obj.exam_type.subject.name

    @admin.display(description="Examen")
    def get_exam_name(self, obj):
        return f"{obj.exam_type.name} T{obj.exam_type.trimester}"


# ── SubjectAverage ────────────────────────────────────────────────────────


@admin.register(SubjectAverage)
class SubjectAverageAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "subject",
        "trimester",
        "calculated_average",
        "manual_override",
        "effective_average",
        "is_published",
        "is_locked",
    )
    list_filter = ("trimester", "is_published", "is_locked")
    search_fields = (
        "student__user__first_name",
        "student__user__last_name",
        "subject__name",
    )

    @admin.display(description="Moyenne effective")
    def effective_average(self, obj):
        return obj.effective_average


# ── TrimesterAverage ──────────────────────────────────────────────────────


@admin.register(TrimesterAverage)
class TrimesterAverageAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "trimester",
        "calculated_average",
        "rank_in_class",
        "appreciation",
        "is_published",
        "is_locked",
    )
    list_filter = ("trimester", "is_published", "is_locked")
    search_fields = ("student__user__first_name", "student__user__last_name")


# ── AnnualAverage ─────────────────────────────────────────────────────────


@admin.register(AnnualAverage)
class AnnualAverageAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "calculated_average",
        "rank_in_class",
        "appreciation",
        "is_published",
    )
    list_filter = ("is_published", "academic_year")
    search_fields = ("student__user__first_name", "student__user__last_name")


# ── GradeAppeal ───────────────────────────────────────────────────────────


@admin.register(GradeAppeal)
class GradeAppealAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "appeal_type",
        "status",
        "original_value",
        "corrected_value",
        "created_at",
    )
    list_filter = ("status", "appeal_type")
    search_fields = ("student__user__first_name", "student__user__last_name")


# ── ReportCard ────────────────────────────────────────────────────────────


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
    search_fields = ("student__user__first_name", "student__user__last_name")
