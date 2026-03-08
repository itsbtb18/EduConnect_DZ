"""
Transport serializers — full CRUD for lines, drivers, stops,
student assignments, GPS positions, and trip logs.
"""

from rest_framework import serializers

from .models import (
    BusDriver,
    BusStop,
    GPSPosition,
    StudentTransport,
    TransportLine,
    TripLog,
)


# =====================================================================
# BUS DRIVER
# =====================================================================


class BusDriverSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    license_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = BusDriver
        fields = [
            "id", "first_name", "last_name", "full_name", "phone",
            "national_id", "date_of_birth", "blood_type", "photo_url",
            "address", "license_number", "license_type", "license_expiry",
            "license_valid", "emergency_contact_name", "emergency_contact_phone",
            "hire_date", "is_active",
            "school", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "school", "created_by", "created_at", "updated_at",
        ]


class BusDriverCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusDriver
        fields = [
            "first_name", "last_name", "phone", "national_id",
            "date_of_birth", "blood_type", "photo_url", "address",
            "license_number", "license_type", "license_expiry",
            "emergency_contact_name", "emergency_contact_phone",
            "hire_date", "is_active",
        ]


# =====================================================================
# BUS STOP
# =====================================================================


class BusStopSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusStop
        fields = [
            "id", "line", "name", "order", "estimated_time",
            "latitude", "longitude",
            "school", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "school", "created_by", "created_at", "updated_at",
        ]


class BusStopCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusStop
        fields = ["line", "name", "order", "estimated_time", "latitude", "longitude"]


# =====================================================================
# TRANSPORT LINE
# =====================================================================


class TransportLineSerializer(serializers.ModelSerializer):
    stops = BusStopSerializer(many=True, read_only=True)
    driver_detail = BusDriverSerializer(source="driver", read_only=True)
    enrolled_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = TransportLine
        fields = [
            "id", "name", "neighborhood", "description",
            "driver", "driver_detail",
            "vehicle_plate", "vehicle_model", "vehicle_year", "vehicle_color",
            "capacity", "departure_time", "return_time", "distance_km",
            "is_active", "enrolled_count", "stops",
            "school", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "school", "created_by", "created_at", "updated_at",
        ]


class TransportLineCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportLine
        fields = [
            "name", "neighborhood", "description", "driver",
            "vehicle_plate", "vehicle_model", "vehicle_year", "vehicle_color",
            "capacity", "departure_time", "return_time", "distance_km",
            "is_active",
        ]


class TransportLineListSerializer(serializers.ModelSerializer):
    """Lightweight list serializer (no nested stops)."""
    enrolled_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = TransportLine
        fields = [
            "id", "name", "neighborhood", "driver",
            "vehicle_plate", "capacity",
            "departure_time", "return_time",
            "is_active", "enrolled_count",
        ]


# =====================================================================
# STUDENT TRANSPORT
# =====================================================================


class StudentTransportSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    line_name = serializers.CharField(source="line.name", read_only=True)
    pickup_stop_name = serializers.CharField(
        source="pickup_stop.name", read_only=True, default=None,
    )
    dropoff_stop_name = serializers.CharField(
        source="dropoff_stop.name", read_only=True, default=None,
    )

    class Meta:
        model = StudentTransport
        fields = [
            "id", "student", "student_name", "line", "line_name",
            "pickup_stop", "pickup_stop_name",
            "dropoff_stop", "dropoff_stop_name",
            "start_date", "end_date", "is_active",
            "school", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "school", "created_by", "created_at", "updated_at",
        ]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else None


class StudentTransportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentTransport
        fields = [
            "student", "line", "pickup_stop", "dropoff_stop",
            "start_date", "end_date", "is_active",
        ]

    def validate_student(self, value):
        if value.role != "STUDENT":
            raise serializers.ValidationError("User must have STUDENT role.")
        return value


# =====================================================================
# GPS POSITION
# =====================================================================


class GPSPositionSerializer(serializers.ModelSerializer):
    line_name = serializers.CharField(source="line.name", read_only=True)

    class Meta:
        model = GPSPosition
        fields = [
            "id", "line", "line_name",
            "latitude", "longitude", "speed", "heading",
            "recorded_at",
            "school", "created_at",
        ]
        read_only_fields = ["id", "school", "created_at"]


class GPSPositionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GPSPosition
        fields = ["line", "latitude", "longitude", "speed", "heading", "recorded_at"]


# =====================================================================
# TRIP LOG
# =====================================================================


class TripLogSerializer(serializers.ModelSerializer):
    line_name = serializers.CharField(source="line.name", read_only=True)

    class Meta:
        model = TripLog
        fields = [
            "id", "line", "line_name", "date", "trip_type",
            "scheduled_time", "actual_time",
            "status", "delay_minutes", "passengers_count", "notes",
            "school", "created_by", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "school", "created_by", "created_at", "updated_at",
        ]


class TripLogCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripLog
        fields = [
            "line", "date", "trip_type",
            "scheduled_time", "actual_time",
            "status", "delay_minutes", "passengers_count", "notes",
        ]
