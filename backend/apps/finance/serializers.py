from rest_framework import serializers
from .models import FeeStructure, Payment


class FeeStructureSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeeStructure
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.full_name", read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = ["id", "school", "created_at", "updated_at"]
