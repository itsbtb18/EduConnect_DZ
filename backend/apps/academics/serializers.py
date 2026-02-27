from rest_framework import serializers
from .models import (
    Class,
    Lesson,
    Resource,
    ScheduleSlot,
    Subject,
    TeacherAssignment,
)


class ClassSerializer(serializers.ModelSerializer):
    section_name = serializers.CharField(source="section.name", read_only=True)

    class Meta:
        model = Class
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class TeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    class_name = serializers.CharField(source="assigned_class.name", read_only=True)

    class Meta:
        model = TeacherAssignment
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ScheduleSlotSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)

    class Meta:
        model = ScheduleSlot
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]
