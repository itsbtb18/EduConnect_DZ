from django.contrib import admin

from .models import (
    Certificate,
    CrossInstitutionProfile,
    Department,
    Discount,
    Formation,
    FormationFeeStructure,
    InstitutionMembership,
    LearnerDiscount,
    LearnerPayment,
    LevelPassage,
    PlacementTest,
    SessionAttendance,
    TrainerPaySlip,
    TrainerSalaryConfig,
    TrainingEnrollment,
    TrainingGroup,
    TrainingSession,
)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "school", "head", "is_active", "created_at")
    list_filter = ("school", "is_active")
    search_fields = ("name",)
    raw_id_fields = ("school", "head", "created_by")


@admin.register(Formation)
class FormationAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "department",
        "audience",
        "total_duration_hours",
        "fee_amount",
        "billing_cycle",
        "is_active",
    )
    list_filter = ("school", "department", "audience", "billing_cycle", "is_active")
    search_fields = ("name", "description")
    raw_id_fields = ("school", "department", "created_by")


@admin.register(TrainingGroup)
class TrainingGroupAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "formation",
        "trainer",
        "level",
        "capacity",
        "start_date",
        "end_date",
        "status",
    )
    list_filter = ("school", "status", "formation")
    search_fields = ("name",)
    raw_id_fields = ("school", "formation", "trainer", "room", "created_by")


@admin.register(TrainingEnrollment)
class TrainingEnrollmentAdmin(admin.ModelAdmin):
    list_display = ("learner", "group", "enrollment_date", "status")
    list_filter = ("status", "group__school")
    search_fields = ("learner__first_name", "learner__last_name")
    raw_id_fields = ("school", "learner", "group", "created_by")


@admin.register(PlacementTest)
class PlacementTestAdmin(admin.ModelAdmin):
    list_display = (
        "learner",
        "formation",
        "test_date",
        "score",
        "suggested_level",
        "is_validated",
    )
    list_filter = ("is_validated", "formation__school")
    search_fields = ("learner__first_name", "learner__last_name")
    raw_id_fields = ("school", "learner", "formation", "validated_by", "created_by")


@admin.register(TrainingSession)
class TrainingSessionAdmin(admin.ModelAdmin):
    list_display = (
        "group",
        "date",
        "start_time",
        "end_time",
        "trainer",
        "status",
    )
    list_filter = ("status", "group__school", "date")
    search_fields = ("group__name", "topic")
    raw_id_fields = ("school", "group", "room", "trainer", "created_by")


@admin.register(SessionAttendance)
class SessionAttendanceAdmin(admin.ModelAdmin):
    list_display = ("session", "learner", "status")
    list_filter = ("status",)
    raw_id_fields = ("school", "session", "learner", "created_by")


@admin.register(LevelPassage)
class LevelPassageAdmin(admin.ModelAdmin):
    list_display = (
        "learner",
        "formation",
        "from_level",
        "to_level",
        "decision",
        "decision_date",
    )
    list_filter = ("decision", "formation__school")
    raw_id_fields = ("school", "learner", "formation", "decided_by", "created_by")


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = (
        "reference_number",
        "learner",
        "formation",
        "certificate_type",
        "issue_date",
    )
    list_filter = ("certificate_type", "formation__school")
    search_fields = ("reference_number", "learner__first_name", "learner__last_name")
    raw_id_fields = ("school", "learner", "formation", "issued_by", "created_by")


@admin.register(FormationFeeStructure)
class FormationFeeStructureAdmin(admin.ModelAdmin):
    list_display = ("name", "formation", "amount", "billing_cycle", "is_active")
    list_filter = ("billing_cycle", "is_active", "formation__school")
    raw_id_fields = ("school", "formation", "created_by")


@admin.register(LearnerPayment)
class LearnerPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "receipt_number",
        "learner",
        "amount",
        "payment_date",
        "payment_method",
        "status",
    )
    list_filter = ("status", "payment_method", "school")
    search_fields = ("receipt_number", "learner__first_name", "learner__last_name")
    raw_id_fields = (
        "school",
        "learner",
        "fee_structure",
        "group",
        "recorded_by",
        "created_by",
    )


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ("name", "discount_type", "value", "is_active")
    list_filter = ("discount_type", "is_active", "school")
    raw_id_fields = ("school", "created_by")


@admin.register(LearnerDiscount)
class LearnerDiscountAdmin(admin.ModelAdmin):
    list_display = ("learner", "discount", "group", "applied_amount")
    raw_id_fields = ("school", "learner", "discount", "group", "created_by")


@admin.register(TrainerSalaryConfig)
class TrainerSalaryConfigAdmin(admin.ModelAdmin):
    list_display = ("trainer", "contract_type", "base_salary", "hourly_rate")
    list_filter = ("contract_type", "school")
    raw_id_fields = ("school", "trainer", "created_by")


@admin.register(TrainerPaySlip)
class TrainerPaySlipAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "trainer",
        "month",
        "year",
        "total_hours",
        "net_salary",
        "status",
    )
    list_filter = ("status", "year", "school")
    search_fields = ("reference", "trainer__first_name", "trainer__last_name")
    raw_id_fields = ("school", "trainer", "created_by")


# ─── Cross-institution (internal) ───────────────────────────


class InstitutionMembershipInline(admin.TabularInline):
    model = InstitutionMembership
    extra = 0
    raw_id_fields = ("user", "school")


@admin.register(CrossInstitutionProfile)
class CrossInstitutionProfileAdmin(admin.ModelAdmin):
    list_display = ("first_name", "last_name", "phone_number", "national_id")
    search_fields = ("first_name", "last_name", "phone_number", "national_id")
    inlines = [InstitutionMembershipInline]
