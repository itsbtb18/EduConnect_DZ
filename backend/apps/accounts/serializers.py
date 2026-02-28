"""
Serializers for the Accounts app.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.schools.models import School

User = get_user_model()

# Roles that MUST belong to a school
_SCHOOL_REQUIRED_ROLES = {
    User.Role.ADMIN,
    User.Role.SECTION_ADMIN,
    User.Role.TEACHER,
    User.Role.PARENT,
    User.Role.STUDENT,
}


# ---------------------------------------------------------------------------
# JWT Token
# ---------------------------------------------------------------------------


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Adds custom claims to the JWT payload:
    user_id, role, school_id, is_first_login.

    Also enriches the HTTP response body with the same fields so the
    client doesn't have to decode the JWT to read them.
    """

    # simplejwt uses USERNAME_FIELD automatically, which is phone_number

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Custom payload claims
        token["role"] = user.role
        token["school_id"] = str(user.school_id) if user.school_id else None
        token["is_first_login"] = user.is_first_login
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Extra fields returned alongside access/refresh
        data["role"] = self.user.role
        data["is_first_login"] = self.user.is_first_login
        data["school_id"] = str(self.user.school_id) if self.user.school_id else None
        return data


# ---------------------------------------------------------------------------
# School (lightweight for nested reads)
# ---------------------------------------------------------------------------


class SchoolMinimalSerializer(serializers.ModelSerializer):
    """Minimal school info for embedding in user responses."""

    class Meta:
        model = School
        fields = ["id", "name", "subdomain", "subscription_plan"]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# User CRUD
# ---------------------------------------------------------------------------


class UserSerializer(serializers.ModelSerializer):
    """Read serializer for user display."""

    school_detail = SchoolMinimalSerializer(source="school", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "phone_number",
            "email",
            "photo",
            "role",
            "school",
            "school_detail",
            "is_active",
            "is_first_login",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating users (admin or superadmin creates accounts).
    - school is required for all roles except SUPER_ADMIN.
    - All identity fields (first_name, last_name, phone_number) are required.
    """

    password = serializers.CharField(write_only=True, min_length=8)
    school = serializers.PrimaryKeyRelatedField(
        queryset=School.objects.filter(is_deleted=False),
        required=False,
        allow_null=True,
        help_text="Required for all roles except SUPER_ADMIN.",
    )

    class Meta:
        model = User
        fields = [
            "phone_number",
            "password",
            "email",
            "first_name",
            "last_name",
            "role",
            "school",
        ]

    def validate_first_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("First name is required.")
        return value.strip()

    def validate_last_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Last name is required.")
        return value.strip()

    def validate_phone_number(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Phone number is required.")
        return value.strip()

    def validate(self, attrs):
        role = attrs.get("role")
        school = attrs.get("school")
        request = self.context.get("request")

        # SUPER_ADMIN must NOT have a school
        if role == User.Role.SUPER_ADMIN:
            if school is not None:
                raise serializers.ValidationError(
                    {"school": "SUPER_ADMIN must not be assigned to a school."}
                )
            # Only existing superadmins can create another superadmin
            if request and request.user.role != User.Role.SUPER_ADMIN:
                raise serializers.ValidationError(
                    {"role": "Only a SUPER_ADMIN can create another SUPER_ADMIN."}
                )

        # All other roles require a school
        if role in _SCHOOL_REQUIRED_ROLES and not school:
            # If the requester is a school admin, auto-assign their school
            if request and request.user.school_id:
                attrs["school"] = request.user.school
            else:
                raise serializers.ValidationError(
                    {"school": "A school must be assigned for this role."}
                )

        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        # Track who created this user
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            user.created_by = request.user
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating users — school admins can update their users."""

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone_number",
            "email",
            "photo",
            "role",
            "school",
            "is_active",
        ]

    def validate(self, attrs):
        role = attrs.get("role", self.instance.role if self.instance else None)
        school = attrs.get("school", self.instance.school if self.instance else None)

        if role == User.Role.SUPER_ADMIN and school is not None:
            raise serializers.ValidationError(
                {"school": "SUPER_ADMIN must not be assigned to a school."}
            )
        if role in _SCHOOL_REQUIRED_ROLES and not school:
            raise serializers.ValidationError(
                {"school": "A school must be assigned for this role."}
            )
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class ResetPasswordSerializer(serializers.Serializer):
    """Admin resets a user's password (no old password needed)."""

    new_password = serializers.CharField(required=True, min_length=8)


# ---------------------------------------------------------------------------
# PIN Login
# ---------------------------------------------------------------------------


class PINLoginSerializer(serializers.Serializer):
    """Accepts phone_number + pin for student-only login."""

    phone_number = serializers.CharField(required=True)
    pin = serializers.IntegerField(required=True)
