from rest_framework import serializers
from .models import AbsenceExcuse, AttendanceRecord


class AttendanceRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = AttendanceRecord
        fields = "__all__"
        read_only_fields = ["id", "school", "marked_by", "created_at", "updated_at"]


class AbsenceExcuseSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = AbsenceExcuse
        fields = "__all__"
        read_only_fields = [
            "id",
            "school",
            "submitted_by",
            "reviewed_by",
            "created_at",
            "updated_at",
        ]
