"""
Notification models and Celery tasks for push notifications via FCM.
"""

from django.db import models
from core.models import TenantModel


class Notification(TenantModel):
    """In-app notification record."""

    recipient = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True, help_text="Extra data payload")
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.recipient.full_name}: {self.title}"
