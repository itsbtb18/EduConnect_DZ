from rest_framework import serializers

from .models import Announcement, AnnouncementAttachment, AnnouncementRead


# ---------------------------------------------------------------------------
# Read serializers
# ---------------------------------------------------------------------------


class AnnouncementAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnnouncementAttachment
        fields = ["id", "file", "file_name", "created_at"]
        read_only_fields = ["id", "created_at"]


class AnnouncementSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.full_name", read_only=True)
    attachments = AnnouncementAttachmentSerializer(many=True, read_only=True)
    read_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Announcement
        fields = [
            "id",
            "school",
            "author",
            "title",
            "body",
            "target_audience",
            "target_section",
            "target_class",
            "is_pinned",
            "publish_at",
            "published_at",
            "created_at",
            "is_deleted",
            "author_name",
            "attachments",
            "read_count",
        ]
        read_only_fields = [
            "id",
            "school",
            "author",
            "published_at",
            "created_at",
            "is_deleted",
            "deleted_at",
        ]


class AnnouncementReadSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)

    class Meta:
        model = AnnouncementRead
        fields = ["id", "announcement", "user", "read_at", "user_name"]
        read_only_fields = ["id", "read_at"]


# ---------------------------------------------------------------------------
# Write serializers
# ---------------------------------------------------------------------------


class AnnouncementCreateSerializer(serializers.Serializer):
    """Create or update an announcement."""

    title = serializers.CharField(max_length=255)
    body = serializers.CharField()
    target_audience = serializers.ChoiceField(
        choices=Announcement.TargetAudience.choices
    )
    target_section_id = serializers.UUIDField(required=False, allow_null=True)
    target_class_id = serializers.UUIDField(required=False, allow_null=True)
    is_pinned = serializers.BooleanField(default=False)
    publish_at = serializers.DateTimeField(required=False, allow_null=True)
