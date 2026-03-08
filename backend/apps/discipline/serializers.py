from rest_framework import serializers

from .models import BehaviorReport, Incident, Sanction, WarningThreshold


# ---------------------------------------------------------------------------
# Incident
# ---------------------------------------------------------------------------


class IncidentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    reported_by_name = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    severity_label = serializers.SerializerMethodField()
    status_label = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_student_name(self, obj):
        s = obj.student
        return f"{s.user.last_name} {s.user.first_name}" if s else ""

    def get_reported_by_name(self, obj):
        u = obj.reported_by
        return f"{u.last_name} {u.first_name}" if u else ""

    def get_class_name(self, obj):
        s = obj.student
        return s.current_class.name if s and s.current_class else ""

    def get_severity_label(self, obj):
        return obj.get_severity_display()

    def get_status_label(self, obj):
        return obj.get_status_display()


class IncidentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Incident
        fields = [
            "student",
            "date",
            "time",
            "severity",
            "title",
            "description",
            "location",
            "witnesses",
            "immediate_action",
        ]


class IncidentWorkflowSerializer(serializers.Serializer):
    """Advance incident through workflow stages."""

    action = serializers.ChoiceField(
        choices=["validate", "resolve", "dismiss", "notify_parent"]
    )
    resolution_note = serializers.CharField(required=False, allow_blank=True)


# ---------------------------------------------------------------------------
# Sanction
# ---------------------------------------------------------------------------


class SanctionSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    sanction_label = serializers.SerializerMethodField()

    class Meta:
        model = Sanction
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_student_name(self, obj):
        s = obj.student
        return f"{s.user.last_name} {s.user.first_name}" if s else ""

    def get_sanction_label(self, obj):
        return obj.get_sanction_type_display()


# ---------------------------------------------------------------------------
# Behavior Report
# ---------------------------------------------------------------------------


class BehaviorReportSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    rating_label = serializers.SerializerMethodField()

    class Meta:
        model = BehaviorReport
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_student_name(self, obj):
        s = obj.student
        return f"{s.user.last_name} {s.user.first_name}" if s else ""

    def get_rating_label(self, obj):
        return obj.get_rating_display()


# ---------------------------------------------------------------------------
# Warning Threshold
# ---------------------------------------------------------------------------


class WarningThresholdSerializer(serializers.ModelSerializer):
    class Meta:
        model = WarningThreshold
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]


# ---------------------------------------------------------------------------
# Stats / analytics (read-only)
# ---------------------------------------------------------------------------


class WarningCountSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    class_name = serializers.CharField(allow_blank=True)
    warning_count = serializers.IntegerField()
    threshold = serializers.IntegerField()
    exceeded = serializers.BooleanField()


class ClassComparisonSerializer(serializers.Serializer):
    class_id = serializers.UUIDField()
    class_name = serializers.CharField()
    total_incidents = serializers.IntegerField()
    positive = serializers.IntegerField()
    warnings = serializers.IntegerField()
    serious = serializers.IntegerField()
