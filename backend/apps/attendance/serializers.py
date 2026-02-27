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

    class Meta:
        model = AttendanceRecord
        fields = "__all__"
        read_only_fields = [
            "id",
            "school",
            "marked_by",
            "created_at",
            "updated_at",
        ]


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
