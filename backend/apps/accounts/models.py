"""
Custom User model for EduConnect Algeria.
Uses phone_number as USERNAME_FIELD.
Supports roles: SUPER_ADMIN, ADMIN, SECTION_ADMIN, TEACHER, PARENT, STUDENT.
"""

import uuid

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


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
    Custom User model for EduConnect.
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

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
