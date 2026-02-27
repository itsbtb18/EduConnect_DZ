from rest_framework import serializers
from .models import HomeworkSubmission, HomeworkTask


class HomeworkTaskSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    submissions_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = HomeworkTask
        fields = "__all__"
        read_only_fields = ["id", "school", "teacher", "created_at", "updated_at"]


class HomeworkSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = HomeworkSubmission
        fields = "__all__"
        read_only_fields = ["id", "school", "student", "created_at", "updated_at"]
