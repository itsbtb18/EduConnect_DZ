from rest_framework import serializers
from .models import AcademicYear, School, Section


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = "__all__"
        read_only_fields = ["id", "code", "created_at", "updated_at"]


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]
