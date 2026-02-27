from rest_framework import serializers
from .models import ExamType, Grade, ReportCard


class ExamTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamType
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    exam_type_name = serializers.CharField(source="exam_type.name", read_only=True)

    class Meta:
        model = Grade
        fields = "__all__"
        read_only_fields = [
            "id",
            "school",
            "teacher",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]


class ReportCardSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = ReportCard
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]
