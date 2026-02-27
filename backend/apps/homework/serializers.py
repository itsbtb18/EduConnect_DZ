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
            "title",
            "description",
            "due_date",
            "is_corrected",
            "created_at",
            "updated_at",
            "is_deleted",
            "teacher_name",
            "subject_name",
            "class_name",
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
    due_date = serializers.DateTimeField()
