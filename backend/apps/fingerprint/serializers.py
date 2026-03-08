from rest_framework import serializers

from .models import (
    BiometricAttendanceLog,
    FINGER_CHOICES,
    FingerprintDevice,
    FingerprintRecord,
    FingerprintTemplate,
)


# ---------------------------------------------------------------------------
# Device
# ---------------------------------------------------------------------------


class FingerprintDeviceSerializer(serializers.ModelSerializer):
    is_online = serializers.BooleanField(read_only=True)

    class Meta:
        model = FingerprintDevice
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]


class DeviceDiagnosticSerializer(serializers.Serializer):
    """Read-only diagnostic data returned from a reader health check."""

    device_id = serializers.UUIDField()
    name = serializers.CharField()
    online = serializers.BooleanField()
    firmware = serializers.CharField(allow_blank=True)
    sensor_quality = serializers.IntegerField()
    serial = serializers.CharField(allow_blank=True)
    error = serializers.CharField(allow_blank=True)


# ---------------------------------------------------------------------------
# Legacy record (kept for backward compat)
# ---------------------------------------------------------------------------


class FingerprintRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = FingerprintRecord
        fields = "__all__"
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]


# ---------------------------------------------------------------------------
# Template
# ---------------------------------------------------------------------------


class FingerprintTemplateSerializer(serializers.ModelSerializer):
    finger_label = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    student_photo = serializers.SerializerMethodField()

    class Meta:
        model = FingerprintTemplate
        fields = [
            "id",
            "student",
            "student_name",
            "student_photo",
            "finger_index",
            "finger_label",
            "capture_number",
            "quality_score",
            "status",
            "enrolled_at",
            "expires_at",
        ]
        read_only_fields = ["id", "enrolled_at"]

    def get_finger_label(self, obj):
        return dict(FINGER_CHOICES).get(obj.finger_index, "")

    def get_student_name(self, obj):
        s = obj.student
        return f"{s.user.last_name} {s.user.first_name}" if s else ""

    def get_student_photo(self, obj):
        s = obj.student
        if s and s.photo:
            return s.photo.url
        return ""


class EnrollSerializer(serializers.Serializer):
    """Input for fingerprint enrollment endpoint."""

    student_id = serializers.UUIDField()
    finger_index = serializers.IntegerField(min_value=0, max_value=9)
    captures = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        max_length=3,
        help_text="Base64-encoded template captures",
    )
    quality_scores = serializers.ListField(
        child=serializers.IntegerField(min_value=0, max_value=100),
        required=False,
    )
    device_id = serializers.UUIDField(required=False)


class VerifySerializer(serializers.Serializer):
    """Input for fingerprint verification endpoint."""

    template = serializers.CharField(help_text="Base64-encoded live scan")
    device_id = serializers.UUIDField(required=False)


class ManualFallbackSerializer(serializers.Serializer):
    """Input for manual attendance when reader is offline."""

    student_id = serializers.UUIDField()
    event_type = serializers.ChoiceField(
        choices=BiometricAttendanceLog.EventType.choices
    )
    timestamp = serializers.DateTimeField(required=False)


# ---------------------------------------------------------------------------
# Attendance log
# ---------------------------------------------------------------------------


class BiometricAttendanceLogSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    device_name = serializers.SerializerMethodField()
    event_label = serializers.SerializerMethodField()

    class Meta:
        model = BiometricAttendanceLog
        fields = [
            "id",
            "student",
            "student_name",
            "user",
            "device",
            "device_name",
            "timestamp",
            "event_type",
            "event_label",
            "verified",
            "confidence_score",
            "is_late",
            "late_minutes",
            "expected_time",
            "synced_to_attendance",
            "is_manual_fallback",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_student_name(self, obj):
        if obj.student:
            s = obj.student
            return f"{s.user.last_name} {s.user.first_name}"
        if obj.user:
            return f"{obj.user.last_name} {obj.user.first_name}"
        return ""

    def get_device_name(self, obj):
        return obj.device.name if obj.device else ""

    def get_event_label(self, obj):
        return obj.get_event_type_display()


# ---------------------------------------------------------------------------
# Enrollment status (per student)
# ---------------------------------------------------------------------------


class StudentEnrollmentStatusSerializer(serializers.Serializer):
    student_id = serializers.UUIDField()
    student_name = serializers.CharField()
    student_photo = serializers.CharField(allow_blank=True)
    class_name = serializers.CharField(allow_blank=True)
    fingers_enrolled = serializers.IntegerField()
    total_captures = serializers.IntegerField()
    status = serializers.CharField()
    last_enrolled = serializers.DateTimeField(allow_null=True)
