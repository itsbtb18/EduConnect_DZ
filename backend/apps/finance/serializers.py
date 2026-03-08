"""
Serializers for the Finance (Payments) app.
"""

from rest_framework import serializers

from .models import (
    AnnualBudget,
    Deduction,
    Expense,
    ExpenseCategory,
    ExtraFee,
    FeeDiscount,
    FeeStructure,
    LatePenalty,
    LeaveRecord,
    OvertimeRecord,
    PaySlip,
    RegistrationDeposit,
    SalaryAdvance,
    SalaryConfig,
    StudentFeeEnrollment,
    StudentPayment,
)


# ---------------------------------------------------------------------------
# Fee Structure
# ---------------------------------------------------------------------------


class FeeStructureSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )
    section_name = serializers.CharField(
        source="section.name", read_only=True, default=None
    )

    class Meta:
        model = FeeStructure
        fields = [
            "id",
            "name",
            "academic_year",
            "academic_year_name",
            "section",
            "section_name",
            "amount_monthly",
            "amount_trimester",
            "amount_annual",
            "due_date",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class FeeStructureCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = [
            "name",
            "academic_year",
            "section",
            "amount_monthly",
            "amount_trimester",
            "amount_annual",
            "due_date",
            "description",
        ]


# ---------------------------------------------------------------------------
# Student Payment
# ---------------------------------------------------------------------------


class StudentPaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    student_photo = serializers.ImageField(source="student.photo", read_only=True)
    class_name = serializers.SerializerMethodField()
    class_id = serializers.SerializerMethodField()
    fee_structure_name = serializers.CharField(
        source="fee_structure.name", read_only=True
    )
    recorded_by_name = serializers.CharField(
        source="recorded_by.full_name", read_only=True
    )
    days_overdue = serializers.SerializerMethodField()

    class Meta:
        model = StudentPayment
        fields = [
            "id",
            "student",
            "student_name",
            "student_photo",
            "class_name",
            "class_id",
            "fee_structure",
            "fee_structure_name",
            "payment_type",
            "amount_paid",
            "payment_date",
            "period_start",
            "period_end",
            "payment_method",
            "receipt_number",
            "notes",
            "recorded_by",
            "recorded_by_name",
            "status",
            "days_overdue",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "receipt_number",
            "status",
            "recorded_by",
            "created_at",
            "updated_at",
        ]

    def get_class_name(self, obj):
        profile = getattr(obj.student, "student_profile", None)
        if profile and profile.current_class:
            return profile.current_class.name
        return None

    def get_class_id(self, obj):
        profile = getattr(obj.student, "student_profile", None)
        if profile and profile.current_class:
            return str(profile.current_class.id)
        return None

    def get_days_overdue(self, obj):
        import datetime

        if obj.status == "expire":
            return (datetime.date.today() - obj.period_end).days
        return 0


class StudentPaymentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentPayment
        fields = [
            "student",
            "fee_structure",
            "payment_type",
            "amount_paid",
            "payment_date",
            "period_start",
            "period_end",
            "payment_method",
            "notes",
        ]


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------


class PaymentStatsSerializer(serializers.Serializer):
    total_this_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_this_year = serializers.DecimalField(max_digits=12, decimal_places=2)
    active_count = serializers.IntegerField()
    expired_count = serializers.IntegerField()
    never_paid_count = serializers.IntegerField()
    expired_students = serializers.ListField()


class ExpiringPaymentSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    class_name = serializers.CharField(allow_null=True)
    period_end = serializers.DateField()
    days_remaining = serializers.IntegerField()
    receipt_number = serializers.CharField()


# ---------------------------------------------------------------------------
# Student Fee Enrollment
# ---------------------------------------------------------------------------


class StudentFeeEnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    fee_structure_name = serializers.CharField(
        source="fee_structure.name", read_only=True
    )
    class_name = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = StudentFeeEnrollment
        fields = [
            "id",
            "student",
            "student_name",
            "class_name",
            "fee_structure",
            "fee_structure_name",
            "total_due",
            "total_paid",
            "remaining",
            "due_date",
            "status",
            "status_display",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "total_paid",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_class_name(self, obj):
        sp = getattr(obj.student, "student_profile", None)
        if sp and sp.current_class:
            return sp.current_class.name
        return None

    def get_remaining(self, obj):
        return max(obj.total_due - obj.total_paid, 0)


class StudentFeeEnrollmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentFeeEnrollment
        fields = [
            "student",
            "fee_structure",
            "total_due",
            "due_date",
            "notes",
        ]


# =========================================================================
# PAYROLL SERIALIZERS
# =========================================================================


class SalaryConfigSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    qualification_display = serializers.CharField(
        source="get_qualification_display", read_only=True
    )

    class Meta:
        model = SalaryConfig
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "base_salary",
            "hourly_rate",
            "qualification",
            "qualification_display",
            "weekly_hours",
            "bank_account",
            "hire_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class SalaryConfigCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryConfig
        fields = [
            "teacher",
            "base_salary",
            "hourly_rate",
            "qualification",
            "weekly_hours",
            "bank_account",
            "hire_date",
        ]


class DeductionSerializer(serializers.ModelSerializer):
    deduction_type_display = serializers.CharField(
        source="get_deduction_type_display", read_only=True
    )

    class Meta:
        model = Deduction
        fields = [
            "id",
            "name",
            "deduction_type",
            "deduction_type_display",
            "value",
            "is_active",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class DeductionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deduction
        fields = ["name", "deduction_type", "value", "is_active", "description"]


class LeaveRecordSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    leave_type_display = serializers.CharField(
        source="get_leave_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    days = serializers.IntegerField(read_only=True)
    approved_by_name = serializers.CharField(
        source="approved_by.full_name", read_only=True, default=None
    )

    class Meta:
        model = LeaveRecord
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "leave_type",
            "leave_type_display",
            "start_date",
            "end_date",
            "days",
            "status",
            "status_display",
            "reason",
            "approved_by",
            "approved_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "approved_by",
            "created_at",
            "updated_at",
        ]


class LeaveRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRecord
        fields = ["teacher", "leave_type", "start_date", "end_date", "reason"]


class OvertimeRecordSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    approved_by_name = serializers.CharField(
        source="approved_by.full_name", read_only=True, default=None
    )

    class Meta:
        model = OvertimeRecord
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "date",
            "hours",
            "description",
            "approved",
            "approved_by",
            "approved_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "approved",
            "approved_by",
            "created_at",
            "updated_at",
        ]


class OvertimeRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OvertimeRecord
        fields = ["teacher", "date", "hours", "description"]


class PaySlipSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    period = serializers.SerializerMethodField()

    class Meta:
        model = PaySlip
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "month",
            "year",
            "period",
            "base_salary",
            "overtime_hours",
            "overtime_amount",
            "leave_days_unpaid",
            "leave_deduction",
            "gross_salary",
            "deductions_detail",
            "total_deductions",
            "net_salary",
            "reference",
            "status",
            "status_display",
            "paid_on",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "base_salary",
            "overtime_hours",
            "overtime_amount",
            "leave_days_unpaid",
            "leave_deduction",
            "gross_salary",
            "deductions_detail",
            "total_deductions",
            "net_salary",
            "reference",
            "created_at",
            "updated_at",
        ]

    def get_period(self, obj):
        MONTHS_FR = {
            1: "Janvier",
            2: "Février",
            3: "Mars",
            4: "Avril",
            5: "Mai",
            6: "Juin",
            7: "Juillet",
            8: "Août",
            9: "Septembre",
            10: "Octobre",
            11: "Novembre",
            12: "Décembre",
        }
        return f"{MONTHS_FR.get(obj.month, '')} {obj.year}"


class PaySlipGenerateSerializer(serializers.Serializer):
    """Input for generating a payslip."""

    teacher = serializers.UUIDField()
    month = serializers.IntegerField(min_value=1, max_value=12)
    year = serializers.IntegerField(min_value=2020, max_value=2099)


# =========================================================================
# FEE DISCOUNTS
# =========================================================================


class FeeDiscountSerializer(serializers.ModelSerializer):
    discount_type_display = serializers.CharField(
        source="get_discount_type_display", read_only=True
    )
    value_type_display = serializers.CharField(
        source="get_value_type_display", read_only=True
    )
    fee_structure_name = serializers.CharField(
        source="fee_structure.name", read_only=True, default=None
    )

    class Meta:
        model = FeeDiscount
        fields = [
            "id",
            "name",
            "discount_type",
            "discount_type_display",
            "value_type",
            "value_type_display",
            "value",
            "fee_structure",
            "fee_structure_name",
            "is_active",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class FeeDiscountCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeDiscount
        fields = [
            "name",
            "discount_type",
            "value_type",
            "value",
            "fee_structure",
            "is_active",
            "description",
        ]


# =========================================================================
# LATE PENALTIES
# =========================================================================


class LatePenaltySerializer(serializers.ModelSerializer):
    fee_structure_name = serializers.CharField(
        source="fee_structure.name", read_only=True
    )
    penalty_type_display = serializers.CharField(
        source="get_penalty_type_display", read_only=True
    )

    class Meta:
        model = LatePenalty
        fields = [
            "id",
            "fee_structure",
            "fee_structure_name",
            "grace_days",
            "penalty_type",
            "penalty_type_display",
            "value",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class LatePenaltyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LatePenalty
        fields = ["fee_structure", "grace_days", "penalty_type", "value", "is_active"]


# =========================================================================
# REGISTRATION DEPOSITS
# =========================================================================


class RegistrationDepositSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = RegistrationDeposit
        fields = [
            "id",
            "student",
            "student_name",
            "academic_year",
            "academic_year_name",
            "amount",
            "payment_date",
            "payment_method",
            "receipt_number",
            "status",
            "status_display",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "receipt_number",
            "status",
            "created_at",
            "updated_at",
        ]


class RegistrationDepositCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistrationDeposit
        fields = [
            "student",
            "academic_year",
            "amount",
            "payment_date",
            "payment_method",
            "notes",
        ]


# =========================================================================
# EXTRA FEES
# =========================================================================


class ExtraFeeSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )

    class Meta:
        model = ExtraFee
        fields = [
            "id",
            "name",
            "category",
            "category_display",
            "amount",
            "academic_year",
            "academic_year_name",
            "is_mandatory",
            "is_active",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ExtraFeeCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtraFee
        fields = [
            "name",
            "category",
            "amount",
            "academic_year",
            "is_mandatory",
            "is_active",
            "description",
        ]


# =========================================================================
# EXPENSE MANAGEMENT
# =========================================================================


class ExpenseCategorySerializer(serializers.ModelSerializer):
    budget_consumed = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    budget_remaining = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = ExpenseCategory
        fields = [
            "id",
            "name",
            "budget_annual",
            "budget_consumed",
            "budget_remaining",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ExpenseCategoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ["name", "budget_annual", "description"]


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    submitted_by_name = serializers.CharField(
        source="submitted_by.full_name", read_only=True, default=None
    )
    approved_by_name = serializers.CharField(
        source="approved_by.full_name", read_only=True, default=None
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "category",
            "category_name",
            "amount",
            "expense_date",
            "description",
            "reference",
            "submitted_by",
            "submitted_by_name",
            "approved_by",
            "approved_by_name",
            "status",
            "status_display",
            "rejection_reason",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "submitted_by",
            "approved_by",
            "status",
            "created_at",
            "updated_at",
        ]


class ExpenseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ["category", "amount", "expense_date", "description", "reference"]


class AnnualBudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    consumed = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    consumption_pct = serializers.FloatField(read_only=True)

    class Meta:
        model = AnnualBudget
        fields = [
            "id",
            "category",
            "category_name",
            "year",
            "allocated",
            "consumed",
            "remaining",
            "consumption_pct",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class AnnualBudgetCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnualBudget
        fields = ["category", "year", "allocated"]


# =========================================================================
# SALARY ADVANCES
# =========================================================================


class SalaryAdvanceSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    approved_by_name = serializers.CharField(
        source="approved_by.full_name", read_only=True, default=None
    )

    class Meta:
        model = SalaryAdvance
        fields = [
            "id",
            "teacher",
            "teacher_name",
            "amount",
            "request_date",
            "reason",
            "deduction_months",
            "monthly_deduction",
            "remaining",
            "status",
            "status_display",
            "approved_by",
            "approved_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "monthly_deduction",
            "remaining",
            "status",
            "approved_by",
            "created_at",
            "updated_at",
        ]


class SalaryAdvanceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryAdvance
        fields = ["teacher", "amount", "reason", "deduction_months"]
