from rest_framework import serializers

from .models import DeviceToken, Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    priority_display = serializers.CharField(
        source="get_priority_display", read_only=True
    )
    category_display = serializers.CharField(
        source="get_category_display", read_only=True
    )

    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "school",
            "title",
            "body",
            "notification_type",
            "priority",
            "priority_display",
            "category",
            "category_display",
            "related_object_id",
            "related_object_type",
            "is_read",
            "read_at",
            "push_sent",
            "sms_sent",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "school",
            "created_at",
        ]


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ["id", "token", "platform", "created_at", "last_used_at"]
        read_only_fields = ["id", "created_at", "last_used_at"]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            "push_academic",
            "push_attendance",
            "push_finance",
            "push_library",
            "push_transport",
            "push_canteen",
            "push_messages",
            "push_system",
            "sms_academic",
            "sms_attendance",
            "sms_finance",
            "sms_library",
            "sms_transport",
            "sms_canteen",
            "sms_messages",
            "silent_mode_enabled",
            "silent_start_time",
            "silent_end_time",
            "weekly_summary_enabled",
        ]
