from rest_framework import serializers

from .models import HomeworkAttachment, HomeworkPost, HomeworkView


# ---------------------------------------------------------------------------
# Read serializers
# ---------------------------------------------------------------------------


class HomeworkAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeworkAttachment
        fields = ["id", "file", "file_type", "file_name", "created_at"]
        read_only_fields = ["id", "created_at"]


class HomeworkPostSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_name = serializers.CharField(source="class_obj.name", read_only=True)
    academic_year_name = serializers.CharField(
        source="academic_year.name", read_only=True, default=""
    )
    attachments = HomeworkAttachmentSerializer(many=True, read_only=True)
    view_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = HomeworkPost
        fields = [
            "id",
            "school",
            "class_obj",
            "subject",
            "teacher",
            "academic_year",
            "title",
            "description",
            "assigned_date",
            "due_date",
            "estimated_duration_minutes",
            "is_published",
            "is_corrected",
            "created_at",
            "updated_at",
            "is_deleted",
            "delete_reason",
            # computed
            "teacher_name",
            "subject_name",
            "class_name",
            "academic_year_name",
            "attachments",
            "view_count",
        ]
        read_only_fields = [
            "id",
            "school",
            "teacher",
            "created_at",
            "updated_at",
            "is_deleted",
            "deleted_at",
            "delete_reason",
        ]


class HomeworkViewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(
        source="student.user.full_name", read_only=True
    )

    class Meta:
        model = HomeworkView
        fields = ["id", "student", "homework", "viewed_at", "student_name"]
        read_only_fields = ["id", "viewed_at"]


# ---------------------------------------------------------------------------
# Write serializers
# ---------------------------------------------------------------------------


class HomeworkCreateSerializer(serializers.Serializer):
    """Create or update a homework post."""

    subject_id = serializers.UUIDField()
    class_id = serializers.UUIDField()
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    due_date = serializers.DateField()
    assigned_date = serializers.DateField(required=False)
    estimated_duration_minutes = serializers.IntegerField(
        required=False, min_value=1, max_value=600
    )
    is_published = serializers.BooleanField(required=False, default=True)


# ---------------------------------------------------------------------------
# Stats / Calendar / Overload serializers
# ---------------------------------------------------------------------------


class HomeworkStatsSerializer(serializers.Serializer):
    total = serializers.IntegerField()
    this_week = serializers.IntegerField()
    this_month = serializers.IntegerField()
    overdue_count = serializers.IntegerField()
    corrected_count = serializers.IntegerField()
    most_active_teacher = serializers.CharField(allow_blank=True)
    busiest_class = serializers.CharField(allow_blank=True)
    overload_alerts = serializers.IntegerField()


class HomeworkCalendarDaySerializer(serializers.Serializer):
    date = serializers.DateField()
    count = serializers.IntegerField()
    items = HomeworkPostSerializer(many=True)


class HomeworkOverloadSerializer(serializers.Serializer):
    date = serializers.DateField()
    class_name = serializers.CharField()
    class_id = serializers.UUIDField()
    count = serializers.IntegerField()
    titles = serializers.ListField(child=serializers.CharField())
