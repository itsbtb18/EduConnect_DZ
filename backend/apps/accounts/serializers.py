"""
Serializers for the Accounts app.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


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
# User CRUD
# ---------------------------------------------------------------------------


class UserSerializer(serializers.ModelSerializer):
    """Read serializer for user display."""

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
            "is_active",
            "is_first_login",
            "created_at",
        ]
        read_only_fields = ["id", "role", "school", "created_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users (admin creates all accounts)."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "phone_number",
            "password",
            "email",
            "first_name",
            "last_name",
            "role",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


# ---------------------------------------------------------------------------
# PIN Login
# ---------------------------------------------------------------------------


class PINLoginSerializer(serializers.Serializer):
    """Accepts phone_number + pin for student-only login."""

    phone_number = serializers.CharField(required=True)
    pin = serializers.IntegerField(required=True)
