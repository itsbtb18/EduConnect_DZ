"""
Serializers for the Accounts app.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer that includes user role and school in the token."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["school_id"] = str(user.school_id) if user.school_id else None
        token["full_name"] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user display."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "phone",
            "first_name",
            "last_name",
            "arabic_first_name",
            "arabic_last_name",
            "date_of_birth",
            "gender",
            "avatar",
            "role",
            "school",
            "language",
            "is_active",
            "must_change_password",
            "created_at",
        ]
        read_only_fields = ["id", "role", "school", "created_at"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating users (admin creates all accounts)."""

    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "phone",
            "first_name",
            "last_name",
            "arabic_first_name",
            "arabic_last_name",
            "date_of_birth",
            "gender",
            "role",
            "school",
            "language",
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


class PhonePinLoginSerializer(serializers.Serializer):
    """Serializer for student phone + PIN login."""

    phone = serializers.CharField(required=True)
    pin = serializers.CharField(required=True, max_length=6)
