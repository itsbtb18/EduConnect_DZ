from rest_framework import serializers

from .models import SMSCampaign, SMSConfig, SMSMessage, SMSTemplate


# ---------------------------------------------------------------------------
# SMSConfig
# ---------------------------------------------------------------------------


class SMSConfigSerializer(serializers.ModelSerializer):
    provider_display = serializers.CharField(
        source="get_provider_display", read_only=True
    )
    usage_percentage = serializers.SerializerMethodField()

    class Meta:
        model = SMSConfig
        fields = [
            "id",
            "provider",
            "provider_display",
            "sender_name",
            "api_url",
            "monthly_quota",
            "remaining_balance",
            "alert_threshold",
            "is_active",
            "cost_per_sms",
            "usage_percentage",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_usage_percentage(self, obj):
        if obj.monthly_quota == 0:
            return 0
        used = obj.monthly_quota - obj.remaining_balance
        return round((used / obj.monthly_quota) * 100, 1)


class SMSConfigCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSConfig
        fields = [
            "provider",
            "sender_name",
            "api_key",
            "api_secret",
            "api_url",
            "monthly_quota",
            "remaining_balance",
            "alert_threshold",
            "cost_per_sms",
        ]


# ---------------------------------------------------------------------------
# SMSTemplate
# ---------------------------------------------------------------------------


class SMSTemplateSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(
        source="get_event_type_display", read_only=True
    )
    language_display = serializers.CharField(
        source="get_language_display", read_only=True
    )
    char_count = serializers.SerializerMethodField()

    class Meta:
        model = SMSTemplate
        fields = [
            "id",
            "name",
            "content",
            "language",
            "language_display",
            "event_type",
            "event_type_display",
            "is_active",
            "char_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_char_count(self, obj):
        return len(obj.content)


class SMSTemplateCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SMSTemplate
        fields = ["name", "content", "language", "event_type", "is_active"]


# ---------------------------------------------------------------------------
# SMSMessage
# ---------------------------------------------------------------------------


class SMSMessageSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    event_type_display = serializers.CharField(
        source="get_event_type_display", read_only=True
    )

    class Meta:
        model = SMSMessage
        fields = [
            "id",
            "recipient_phone",
            "recipient_name",
            "content",
            "status",
            "status_display",
            "event_type",
            "event_type_display",
            "template",
            "campaign",
            "cost",
            "gateway_message_id",
            "error_message",
            "sent_at",
            "delivered_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class SMSSendSerializer(serializers.Serializer):
    """Serializer for single SMS send endpoint."""

    phone = serializers.CharField(max_length=20)
    message = serializers.CharField(max_length=640)
    template_id = serializers.UUIDField(required=False)
    template_context = serializers.DictField(required=False, default=dict)


# ---------------------------------------------------------------------------
# SMSCampaign
# ---------------------------------------------------------------------------


class SMSCampaignSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    target_type_display = serializers.CharField(
        source="get_target_type_display", read_only=True
    )
    delivery_rate = serializers.SerializerMethodField()

    class Meta:
        model = SMSCampaign
        fields = [
            "id",
            "title",
            "message",
            "target_type",
            "target_type_display",
            "target_section",
            "target_class",
            "scheduled_at",
            "status",
            "status_display",
            "estimated_cost",
            "total_recipients",
            "sent_count",
            "delivered_count",
            "failed_count",
            "completed_at",
            "delivery_rate",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "sent_count",
            "delivered_count",
            "failed_count",
            "completed_at",
            "created_at",
            "updated_at",
        ]

    def get_delivery_rate(self, obj):
        if obj.sent_count == 0:
            return 0
        return round((obj.delivered_count / obj.sent_count) * 100, 1)


class SMSCampaignCreateSerializer(serializers.ModelSerializer):
    target_individuals_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, write_only=True
    )

    class Meta:
        model = SMSCampaign
        fields = [
            "title",
            "message",
            "target_type",
            "target_section",
            "target_class",
            "target_individuals_ids",
            "scheduled_at",
        ]

    def create(self, validated_data):
        individuals = validated_data.pop("target_individuals_ids", [])
        campaign = SMSCampaign.objects.create(**validated_data)
        if individuals:
            campaign.target_individuals.set(individuals)
        return campaign
