"""
Core serializers — tenant-aware base serializers.
"""

from rest_framework import serializers


class TenantAwareSerializer(serializers.ModelSerializer):
    """
    Base serializer for tenant-scoped models.

    Automatically sets ``school`` and ``created_by`` from the request
    so that API consumers never need to supply them manually.
    The fields are exposed as read-only so they appear in responses
    but cannot be overwritten by clients.
    """

    class Meta:
        # Subclasses MUST define ``model`` and ``fields``.
        read_only_fields = [
            "id",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]

    # ------------------------------------------------------------------
    # Hook: inject school + created_by on create
    # ------------------------------------------------------------------
    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            user = request.user
            if hasattr(user, "school") and user.school:
                validated_data.setdefault("school", user.school)
            validated_data.setdefault("created_by", user)
        return super().create(validated_data)

    # ------------------------------------------------------------------
    # Hook: inject updated_by on update
    # ------------------------------------------------------------------
    def update(self, instance, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            validated_data.setdefault("updated_by", request.user)
        return super().update(instance, validated_data)
