"""
Security models for ILMI: Device Trust, Audit Trail, Login Attempts, Sessions.
"""

import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


# ---------------------------------------------------------------------------
# Role-based session configuration
# ---------------------------------------------------------------------------

# Refresh token lifetime per role (in seconds)
ROLE_REFRESH_LIFETIMES = {
    "SUPER_ADMIN": 2 * 3600,  # 2 hours
    "ADMIN": 8 * 3600,  # 8 hours
    "SECTION_ADMIN": 8 * 3600,  # 8 hours
    "GENERAL_SUPERVISOR": 4 * 3600,  # 4 hours
    "FINANCE_MANAGER": 8 * 3600,  # 8 hours
    "LIBRARIAN": 8 * 3600,  # 8 hours
    "CANTEEN_MANAGER": 8 * 3600,  # 8 hours
    "TRANSPORT_MANAGER": 8 * 3600,  # 8 hours
    "HR_MANAGER": 8 * 3600,  # 8 hours
    "TEACHER": 30 * 86400,  # 30 days
    "TRAINER": 30 * 86400,  # 30 days
    "PARENT": 90 * 86400,  # 90 days
    "STUDENT": 90 * 86400,  # 90 days
    "TRAINEE": 90 * 86400,  # 90 days
    "DRIVER": 24 * 3600,  # 24 hours
}

# Roles requiring OTP on new device
ROLES_REQUIRING_DEVICE_OTP = {
    "ADMIN",
    "SECTION_ADMIN",
    "TEACHER",
    "TRAINER",
    "PARENT",
    "GENERAL_SUPERVISOR",
}

# Roles requiring TOTP (Google Authenticator)
ROLES_REQUIRING_TOTP = {"SUPER_ADMIN"}

# Roles that get email alerts on login
ROLES_WITH_LOGIN_ALERT = {"SUPER_ADMIN", "GENERAL_SUPERVISOR"}

# Read-only roles: POST/PUT/PATCH/DELETE blocked
READ_ONLY_ROLES = {"GENERAL_SUPERVISOR"}

# Role-based JWT scopes
ROLE_SCOPES = {
    "SUPER_ADMIN": [
        "platform:admin",
        "schools:manage",
        "users:manage",
        "audit:read",
        "finance:manage",
        "grades:manage",
        "attendance:manage",
        "announcements:manage",
        "chat:manage",
        "transport:manage",
        "canteen:manage",
        "library:manage",
        "formation:manage",
    ],
    "ADMIN": [
        "school:admin",
        "users:manage",
        "grades:read",
        "grades:manage",
        "attendance:read",
        "attendance:manage",
        "finance:manage",
        "announcements:manage",
        "chat:manage",
        "transport:manage",
        "canteen:manage",
        "library:manage",
        "formation:manage",
        "audit:read",
    ],
    "SECTION_ADMIN": [
        "school:admin",
        "users:read",
        "grades:read",
        "grades:manage",
        "attendance:read",
        "attendance:manage",
        "announcements:manage",
    ],
    "GENERAL_SUPERVISOR": [
        "school:read",
        "users:read",
        "grades:read",
        "attendance:read",
        "finance:read",
        "announcements:read",
        "audit:read",
    ],
    "FINANCE_MANAGER": [
        "finance:manage",
        "users:read",
    ],
    "LIBRARIAN": [
        "library:manage",
        "users:read",
    ],
    "CANTEEN_MANAGER": [
        "canteen:manage",
        "users:read",
    ],
    "TRANSPORT_MANAGER": [
        "transport:manage",
        "users:read",
    ],
    "HR_MANAGER": [
        "users:manage",
        "finance:read",
    ],
    "TEACHER": [
        "grades:manage",
        "attendance:manage",
        "homework:manage",
        "announcements:read",
        "chat:manage",
        "elearning:manage",
    ],
    "TRAINER": [
        "formation:trainer",
        "attendance:manage",
        "chat:manage",
        "announcements:read",
    ],
    "PARENT": [
        "grades:read",
        "attendance:read",
        "finance:read",
        "announcements:read",
        "chat:manage",
        "transport:read",
        "canteen:read",
    ],
    "STUDENT": [
        "grades:read",
        "attendance:read",
        "homework:read",
        "announcements:read",
        "chat:read",
        "library:read",
        "elearning:read",
        "gamification:read",
    ],
    "TRAINEE": [
        "formation:trainee",
        "attendance:read",
        "announcements:read",
    ],
    "DRIVER": [
        "transport:driver",
    ],
}


# ---------------------------------------------------------------------------
# Trusted Device
# ---------------------------------------------------------------------------


class TrustedDevice(models.Model):
    """
    Stores trusted devices per user. After OTP validation on a new device,
    the device is registered here to skip OTP on subsequent logins.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trusted_devices",
    )
    device_fingerprint = models.CharField(
        max_length=64,
        help_text="SHA-256 hash of device attributes",
    )
    device_name = models.CharField(max_length=200, blank=True, default="")
    device_os = models.CharField(max_length=100, blank=True, default="")
    last_ip = models.GenericIPAddressField(null=True, blank=True)
    last_used_at = models.DateTimeField(auto_now=True)
    is_revoked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "trusted_devices"
        unique_together = ["user", "device_fingerprint"]
        ordering = ["-last_used_at"]

    def __str__(self):
        return f"{self.user} — {self.device_name or self.device_fingerprint[:12]}"


# ---------------------------------------------------------------------------
# Login Attempt Tracking
# ---------------------------------------------------------------------------


class LoginAttempt(models.Model):
    """Tracks login attempts for lockout and security analysis."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone_number = models.CharField(max_length=20, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    success = models.BooleanField(default=False)
    failure_reason = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "login_attempts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["phone_number", "created_at"]),
        ]


# ---------------------------------------------------------------------------
# Active Session Tracking
# ---------------------------------------------------------------------------


class ActiveSession(models.Model):
    """
    Tracks active user sessions. This enables:
    - Remote session revocation by admin
    - Stolen refresh token detection (double-use)
    - Session listing for user
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="active_sessions",
    )
    refresh_token_jti = models.CharField(
        max_length=64,
        unique=True,
        help_text="JTI claim of the current refresh token",
    )
    device = models.ForeignKey(
        TrustedDevice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    is_revoked = models.BooleanField(default=False)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        db_table = "active_sessions"
        ordering = ["-last_activity"]

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


# ---------------------------------------------------------------------------
# TOTP Secret (Super Admin 2FA)
# ---------------------------------------------------------------------------


class TOTPDevice(models.Model):
    """Stores TOTP secret for Google Authenticator-based 2FA."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="totp_device",
    )
    secret = models.CharField(max_length=64)
    is_confirmed = models.BooleanField(
        default=False,
        help_text="Set to True after user verifies with a valid code",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "totp_devices"


# ---------------------------------------------------------------------------
# OTP Verification (SMS-based)
# ---------------------------------------------------------------------------


class OTPVerification(models.Model):
    """Stores pending OTP codes for SMS verification."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="otp_verifications",
    )
    code = models.CharField(max_length=6)
    purpose = models.CharField(
        max_length=30,
        choices=[
            ("DEVICE_TRUST", "New Device Verification"),
            ("LOGIN", "Login Verification"),
            ("PAYMENT", "Payment Re-auth"),
        ],
    )
    device_fingerprint = models.CharField(max_length=64, blank=True, default="")
    is_used = models.BooleanField(default=False)
    attempts = models.PositiveSmallIntegerField(default=0)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "otp_verifications"
        ordering = ["-created_at"]

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at


# ---------------------------------------------------------------------------
# Comprehensive Audit Log
# ---------------------------------------------------------------------------


class AuditLog(models.Model):
    """
    Immutable audit trail for all significant actions.
    Logs are non-deletable — even SUPER_ADMIN cannot delete them.
    """

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        LOGIN_FAILED = "LOGIN_FAILED", "Login Failed"
        LOGOUT = "LOGOUT", "Logout"
        PASSWORD_CHANGE = "PASSWORD_CHANGE", "Password Change"
        CONTEXT_SWITCH = "CONTEXT_SWITCH", "Context Switch"
        ACCESS_DENIED = "ACCESS_DENIED", "Access Denied"
        DEVICE_NEW = "DEVICE_NEW", "New Device"
        DEVICE_REVOKED = "DEVICE_REVOKED", "Device Revoked"
        SESSION_REVOKED = "SESSION_REVOKED", "Session Revoked"
        OTP_SENT = "OTP_SENT", "OTP Sent"
        OTP_VERIFIED = "OTP_VERIFIED", "OTP Verified"
        TOTP_SETUP = "TOTP_SETUP", "TOTP Setup"
        ACCOUNT_LOCKED = "ACCOUNT_LOCKED", "Account Locked"
        ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED", "Account Suspended"
        EXPORT = "EXPORT", "Export"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=30, choices=Action.choices, db_index=True)
    model_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="The model/entity that was affected",
    )
    object_id = models.CharField(
        max_length=64,
        blank=True,
        default="",
        help_text="ID of the affected object",
    )
    changes = models.JSONField(
        null=True,
        blank=True,
        help_text="Dict of {field: {old: ..., new: ...}} for UPDATE actions",
    )
    metadata = models.JSONField(
        null=True,
        blank=True,
        help_text="Additional context (e.g., failure reason, device info)",
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default="")
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    role = models.CharField(max_length=30, blank=True, default="")
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["user", "timestamp"]),
            models.Index(fields=["action", "timestamp"]),
            models.Index(fields=["school", "timestamp"]),
            models.Index(fields=["model_name", "timestamp"]),
        ]
        # Prevent deletion at the Django ORM level
        managed = True

    def __str__(self):
        return f"[{self.action}] {self.user} — {self.model_name} @ {self.timestamp}"

    def delete(self, *args, **kwargs):
        """Audit logs are immutable — prevent deletion."""
        raise PermissionError("Audit logs cannot be deleted.")

    def save(self, *args, **kwargs):
        """Audit logs are immutable — prevent updates after creation."""
        if self.pk and AuditLog.objects.filter(pk=self.pk).exists():
            raise PermissionError("Audit logs cannot be modified after creation.")
        super().save(*args, **kwargs)


# ---------------------------------------------------------------------------
# IP Whitelist (Super Admin)
# ---------------------------------------------------------------------------


class IPWhitelist(models.Model):
    """IP whitelist for Super Admin access."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ip_address = models.GenericIPAddressField()
    description = models.CharField(max_length=200, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ip_whitelist"

    def __str__(self):
        return f"{self.ip_address} — {self.description}"
