from rest_framework import serializers
from .models import (
    Classroom,
    Lesson,
    Level,
    Resource,
    ScheduleSlot,
    Subject,
    TeacherAssignment,
)


class LevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Level
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ClassroomSerializer(serializers.ModelSerializer):
    level_name = serializers.CharField(source="level.name", read_only=True)

    class Meta:
        model = Classroom
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class TeacherAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source="teacher.full_name", read_only=True)
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    classroom_name = serializers.CharField(source="classroom.name", read_only=True)

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
