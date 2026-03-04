from rest_framework import serializers

from .models import AbsenceExcuse, AttendanceRecord


# ---------------------------------------------------------------------------
# Read serializers
# ---------------------------------------------------------------------------


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.user.full_name", read_only=True
    )
    class_name = serializers.CharField(source="class_obj.name", read_only=True)
    teacher_name = serializers.SerializerMethodField()
    justified_by_name = serializers.SerializerMethodField()
    student_phone = serializers.SerializerMethodField()
    parent_phone = serializers.SerializerMethodField()
    student_id_number = serializers.CharField(
        source="student.student_id", read_only=True, default=""
    )

    class Meta:
        model = AttendanceRecord
        fields = "__all__"
        read_only_fields = [
            "id",
            "school",
            "marked_by",
            "justified_by",
            "justified_at",
            "created_at",
            "updated_at",
        ]

    def get_teacher_name(self, obj):
        if obj.marked_by:
            return f"{obj.marked_by.first_name} {obj.marked_by.last_name}".strip()
        return ""

    def get_justified_by_name(self, obj):
        if obj.justified_by:
            return f"{obj.justified_by.first_name} {obj.justified_by.last_name}".strip()
        return ""

    def get_student_phone(self, obj):
        return getattr(obj.student.user, "phone_number", "") or ""

    def get_parent_phone(self, obj):
        try:
            parent = obj.student.parents.first()
            if parent:
                return getattr(parent.user, "phone_number", "") or ""
        except Exception:
            pass
        return ""


class AbsenceExcuseSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="attendance_record.student.user.full_name", read_only=True
    )

    class Meta:
        model = AbsenceExcuse
        fields = "__all__"
        read_only_fields = [
            "id",
            "submitted_by",
            "reviewed_by",
            "status",
            "created_at",
        ]


# ---------------------------------------------------------------------------
# Write serializers
# ---------------------------------------------------------------------------


class AttendanceItemSerializer(serializers.Serializer):
    """One item inside a bulk attendance submission."""

    student_id = serializers.UUIDField()
    status = serializers.ChoiceField(choices=AttendanceRecord.Status.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class MarkAttendanceSerializer(serializers.Serializer):
    """Bulk attendance marking for a class on a given date."""

    class_id = serializers.UUIDField()
    date = serializers.DateField()
    period = serializers.ChoiceField(
        choices=AttendanceRecord.Period.choices,
        required=False,
        default=AttendanceRecord.Period.MORNING,
    )
    records = AttendanceItemSerializer(many=True)


class ExcuseSubmitSerializer(serializers.Serializer):
    """Parent submits an excuse for a student absence."""

    attendance_record_id = serializers.UUIDField()
    justification_text = serializers.CharField()
    attachment = serializers.FileField(required=False, allow_null=True)


class ExcuseReviewSerializer(serializers.Serializer):
    """Admin approves or rejects an excuse."""

    status = serializers.ChoiceField(
        choices=[("APPROVED", "Approved"), ("REJECTED", "Rejected")]
    )


class JustifyAbsenceSerializer(serializers.Serializer):
    """Admin directly justifies an absence."""

    justification_note = serializers.CharField(
        required=True, allow_blank=False, max_length=1000
    )


class AbsenceStatsSerializer(serializers.Serializer):
    """Response serializer for absence stats endpoint."""

    today_count = serializers.IntegerField()
    week_count = serializers.IntegerField()
    month_count = serializers.IntegerField()
    at_risk_students = serializers.ListField(child=serializers.DictField())
    teachers_not_marked = serializers.ListField(child=serializers.DictField())
