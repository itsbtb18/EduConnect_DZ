"""
Custom User model for EduConnect Algeria.
Supports multiple roles: superadmin, admin, teacher, parent, student.
"""

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models

from core.models import TimeStampedModel


class UserManager(BaseUserManager):
    """Custom user manager supporting email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "superadmin")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Custom User model for EduConnect.
    - Admins are school administrators (one per school).
    - Teachers, parents, students belong to a school.
    - Superadmin manages the entire platform.
    """

    class Role(models.TextChoices):
        SUPERADMIN = "superadmin", "Super Admin"
        ADMIN = "admin", "School Admin"
        TEACHER = "teacher", "Teacher"
        PARENT = "parent", "Parent"
        STUDENT = "student", "Student"

    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"

    # Core fields
    email = models.EmailField(unique=True, max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    pin = models.CharField(
        max_length=6,
        blank=True,
        null=True,
        help_text="PIN code for young students (phone+PIN login)",
    )

    # Profile fields
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    arabic_first_name = models.CharField(max_length=100, blank=True)
    arabic_last_name = models.CharField(max_length=100, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)

    # Role & School
    role = models.CharField(max_length=20, choices=Role.choices)
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="users",
        blank=True,
        null=True,
        help_text="Null for superadmin only",
    )

    # Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    must_change_password = models.BooleanField(
        default=True,
        help_text="Force password change on first login",
    )
    failed_login_attempts = models.PositiveIntegerField(default=0)
    locked_until = models.DateTimeField(blank=True, null=True)

    # FCM token for push notifications
    fcm_token = models.CharField(max_length=512, blank=True, null=True)

    # Preferences
    language = models.CharField(
        max_length=5,
        default="fr",
        choices=[("ar", "Arabic"), ("fr", "French"), ("en", "English")],
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
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

    @property
    def arabic_full_name(self):
        return f"{self.arabic_first_name} {self.arabic_last_name}"


class StudentProfile(TimeStampedModel):
    """Extended profile for student users."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    student_id = models.CharField(
        max_length=50, blank=True, help_text="School-assigned student ID"
    )
    classroom = models.ForeignKey(
        "academics.Classroom",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    enrollment_date = models.DateField(blank=True, null=True)
    school_level = models.CharField(
        max_length=20,
        choices=[
            ("primary", "Primary"),
            ("middle", "Middle School"),
            ("secondary", "Secondary/High School"),
        ],
        blank=True,
    )

    class Meta:
        db_table = "student_profiles"

    def __str__(self):
        return f"Student: {self.user.full_name}"


class TeacherProfile(TimeStampedModel):
    """Extended profile for teacher users."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="teacher_profile"
    )
    employee_id = models.CharField(max_length=50, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "teacher_profiles"

    def __str__(self):
        return f"Teacher: {self.user.full_name}"


class ParentProfile(TimeStampedModel):
    """Extended profile for parent users — supports multiple children."""

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="parent_profile"
    )
    children = models.ManyToManyField(
        User,
        related_name="parents",
        blank=True,
        limit_choices_to={"role": "student"},
    )
    relationship = models.CharField(
        max_length=20,
        choices=[
            ("father", "Father"),
            ("mother", "Mother"),
            ("guardian", "Guardian"),
        ],
        blank=True,
    )

    class Meta:
        db_table = "parent_profiles"

    def __str__(self):
        return f"Parent: {self.user.full_name}"
