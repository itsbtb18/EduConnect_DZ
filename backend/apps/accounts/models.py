"""
Custom User model for Madrassa.
Uses phone_number as USERNAME_FIELD.
Supports roles: SUPER_ADMIN, ADMIN, SECTION_ADMIN, TEACHER, PARENT, STUDENT.
"""

import logging
import uuid

from django.contrib.auth.hashers import identify_hasher
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models

logger = logging.getLogger(__name__)


class UserManager(BaseUserManager):
    """Custom manager — authenticates via phone_number."""

    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError("Users must have a phone number")
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_first_login", False)
        # Always force SUPER_ADMIN role for superuser
        extra_fields["role"] = User.Role.SUPER_ADMIN
        # Ensure name fields have defaults
        extra_fields.setdefault("first_name", "Super")
        extra_fields.setdefault("last_name", "Admin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(phone_number, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for Madrassa.
    - Uses phone_number as the unique identifier (USERNAME_FIELD).
    - No username field.
    - SUPER_ADMIN has no school; all other roles belong to a school.
    """

    class Role(models.TextChoices):
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"
        ADMIN = "ADMIN", "Admin"
        SECTION_ADMIN = "SECTION_ADMIN", "Section Admin"
        TEACHER = "TEACHER", "Teacher"
        PARENT = "PARENT", "Parent"
        STUDENT = "STUDENT", "Student"

    # Primary key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Identity
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    photo = models.ImageField(upload_to="users/photos/", blank=True, null=True)

    # Role & School
    role = models.CharField(max_length=20, choices=Role.choices)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.SET_NULL,
        related_name="users",
        blank=True,
        null=True,
        help_text="Null for SUPER_ADMIN only",
    )

    # Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_first_login = models.BooleanField(
        default=True,
        help_text="True until the user changes their initial password",
    )

    # Audit
    created_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_users",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "phone_number"
    REQUIRED_FIELDS = ["first_name", "last_name", "role"]

    class Meta:
        db_table = "users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["last_name", "first_name"]

    # ------------------------------------------------------------------
    # Safety net: detect & hash plain-text passwords before saving
    # ------------------------------------------------------------------
    def save(self, *args, **kwargs):
        if self.password and not self.password.startswith("!"):
            try:
                identify_hasher(self.password)
            except ValueError:
                # Password is NOT in a recognised hash format → hash it now
                logger.warning(
                    "Detected unhashed password for user %s — hashing before save.",
                    self.phone_number,
                )
                self.set_password(self.password)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class ActivityLog(models.Model):
    """Audit log for admin actions."""

    class Action(models.TextChoices):
        CREATE = "CREATE", "Create"
        UPDATE = "UPDATE", "Update"
        DELETE = "DELETE", "Delete"
        LOGIN = "LOGIN", "Login"
        EXPORT = "EXPORT", "Export"
        OTHER = "OTHER", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activity_logs",
    )
    action = models.CharField(max_length=20, choices=Action.choices)
    resource = models.CharField(max_length=100, blank=True, default="")
    description = models.TextField(blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "activity_logs"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} — {self.action} — {self.resource} ({self.created_at})"


class PlatformConfig(models.Model):
    """Singleton platform configuration (one row)."""

    platform_name = models.CharField(max_length=100, default="Madrassa DZ")
    default_language = models.CharField(max_length=10, default="fr")
    maintenance_mode = models.BooleanField(default=False)
    allow_registration = models.BooleanField(default=True)
    max_schools = models.PositiveIntegerField(default=100)
    smtp_configured = models.BooleanField(default=False)
    sms_configured = models.BooleanField(default=False)
    backup_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "platform_config"
        verbose_name = "Platform Config"
        verbose_name_plural = "Platform Config"

    def save(self, *args, **kwargs):
        # Enforce singleton
        self.pk = 1
        super().save(*args, **kwargs)

    def __str__(self):
        return self.platform_name
