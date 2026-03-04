"""
Serializers for the Finance (Payments) app.
"""

from rest_framework import serializers

from .models import FeeStructure, StudentPayment


# ---------------------------------------------------------------------------
# Fee Structure
# ---------------------------------------------------------------------------


class FeeStructureSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True
    )

    class Meta:
        model = FeeStructure
        fields = [
            "id",
            "name",
            "academic_year",
            "academic_year_name",
            "amount_monthly",
            "amount_trimester",
            "amount_annual",
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
            "amount_monthly",
            "amount_trimester",
            "amount_annual",
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
