from rest_framework import serializers

from .models import DeviceToken, Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "school",
            "title",
            "body",
            "notification_type",
            "related_object_id",
            "related_object_type",
            "is_read",
            "read_at",
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
