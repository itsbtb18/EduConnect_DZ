from rest_framework import serializers

from .models import Grade, Subject, TrimesterConfig


# ---------------------------------------------------------------------------
# Read serializers
# ---------------------------------------------------------------------------


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class TrimesterConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrimesterConfig
        fields = "__all__"
        read_only_fields = ["id"]


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.user.full_name", read_only=True
    )
    subject_name = serializers.CharField(source="subject.name", read_only=True)

    class Meta:
        model = Grade
        fields = "__all__"
        read_only_fields = [
            "id",
            "submitted_by",
            "submitted_at",
            "reviewed_by",
            "published_at",
            "created_by",
            "created_at",
            "updated_at",
        ]


# ---------------------------------------------------------------------------
# Bulk submit serializer (teacher posts a list of grades)
# ---------------------------------------------------------------------------


class GradeItemSerializer(serializers.Serializer):
    """One item inside a bulk grade submission."""

    student_id = serializers.UUIDField()
    subject_id = serializers.UUIDField()
    trimester = serializers.IntegerField(min_value=1, max_value=3)
    exam_type = serializers.ChoiceField(choices=Grade.ExamType.choices)
    value = serializers.DecimalField(max_digits=4, decimal_places=2, min_value=0)


class GradeBulkSubmitSerializer(serializers.Serializer):
    """Wrapper: list of grade items."""

    grades = GradeItemSerializer(many=True)


# ---------------------------------------------------------------------------
# Return (admin sends comment)
# ---------------------------------------------------------------------------


class GradeReturnSerializer(serializers.Serializer):
    admin_comment = serializers.CharField(required=True, min_length=1)
