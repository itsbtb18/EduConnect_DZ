"""
Base model classes shared across all apps.
"""

import uuid

from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model with created/updated timestamps."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class TenantModel(TimeStampedModel):
    """
    Abstract base model for multi-tenant data.
    All tenant-scoped models should inherit from this.
    """

    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="%(class)s_set",
    )

    class Meta:
        abstract = True
        ordering = ["-created_at"]
