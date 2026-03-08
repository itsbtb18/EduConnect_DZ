"""
Canteen serializers — CRUD + nested representations.
"""

from rest_framework import serializers

from .models import CanteenStudent, MealAttendance, Menu, MenuItem


# ─── CanteenStudent ─────────────────────────────────────────────────────


class CanteenStudentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    nutritional_status_display = serializers.CharField(
        source="get_nutritional_status_display", read_only=True
    )
    dietary_restriction_display = serializers.CharField(
        source="get_dietary_restriction_display", read_only=True
    )

    class Meta:
        model = CanteenStudent
        fields = [
            "id",
            "student",
            "student_name",
            "start_date",
            "end_date",
            "is_active",
            "nutritional_status",
            "nutritional_status_display",
            "dietary_restriction",
            "dietary_restriction_display",
            "allergy_details",
            "medical_note",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_student_name(self, obj):
        return obj.student.full_name


class CanteenStudentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CanteenStudent
        fields = [
            "student",
            "start_date",
            "end_date",
            "is_active",
            "nutritional_status",
            "dietary_restriction",
            "allergy_details",
            "medical_note",
        ]


# ─── MenuItem ───────────────────────────────────────────────────────────


class MenuItemSerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(
        source="get_day_of_week_display", read_only=True
    )

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "menu",
            "date",
            "day_of_week",
            "day_of_week_display",
            "starter",
            "main_course",
            "side_dish",
            "dessert",
            "allergens",
            "suitable_for_diabetic",
            "suitable_for_celiac",
            "calories_approx",
        ]
        read_only_fields = ["id", "day_of_week"]


class MenuItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = [
            "menu",
            "date",
            "starter",
            "main_course",
            "side_dish",
            "dessert",
            "allergens",
            "suitable_for_diabetic",
            "suitable_for_celiac",
            "calories_approx",
        ]


# ─── Menu ───────────────────────────────────────────────────────────────


class MenuSerializer(serializers.ModelSerializer):
    period_type_display = serializers.CharField(
        source="get_period_type_display", read_only=True
    )
    items = MenuItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Menu
        fields = [
            "id",
            "title",
            "period_type",
            "period_type_display",
            "start_date",
            "end_date",
            "is_published",
            "notes",
            "items",
            "items_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_items_count(self, obj):
        return obj.items.filter(is_deleted=False).count()


class MenuCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Menu
        fields = [
            "title",
            "period_type",
            "start_date",
            "end_date",
            "is_published",
            "notes",
        ]


class MenuListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views (no nested items)."""

    period_type_display = serializers.CharField(
        source="get_period_type_display", read_only=True
    )
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Menu
        fields = [
            "id",
            "title",
            "period_type",
            "period_type_display",
            "start_date",
            "end_date",
            "is_published",
            "items_count",
            "created_at",
        ]

    def get_items_count(self, obj):
        return obj.items.filter(is_deleted=False).count()


# ─── MealAttendance ─────────────────────────────────────────────────────


class MealAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = MealAttendance
        fields = [
            "id",
            "student",
            "student_name",
            "menu_item",
            "date",
            "present",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_student_name(self, obj):
        return obj.student.full_name


class MealAttendanceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealAttendance
        fields = ["student", "menu_item", "date", "present", "notes"]


class MealAttendanceBulkItemSerializer(serializers.Serializer):
    """Single attendance entry inside a bulk request."""

    student = serializers.UUIDField()
    present = serializers.BooleanField(default=True)
    notes = serializers.CharField(required=False, default="")
