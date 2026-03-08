"""
Serializers for the Accounts app.
"""

import logging

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import identify_hasher
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.schools.models import School

logger = logging.getLogger(__name__)

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
    user_id, role, school_id, is_first_login, scopes.

    Also enriches the HTTP response body with the same fields so the
    client doesn't have to decode the JWT to read them.
    """

    # simplejwt uses USERNAME_FIELD automatically, which is phone_number

    @classmethod
    def get_token(cls, user):
        from datetime import timedelta
        from .models_security import (
            ROLE_REFRESH_LIFETIMES,
            ROLE_SCOPES,
            READ_ONLY_ROLES,
        )

        token = super().get_token(user)
        # Custom payload claims
        token["role"] = user.role
        token["school_id"] = str(user.school_id) if user.school_id else None
        token["is_first_login"] = user.is_first_login

        # JWT scopes — strictly defined per role, non-modifiable
        token["scopes"] = ROLE_SCOPES.get(user.role, [])

        # Read-only flag for supervisor role
        if user.role in READ_ONLY_ROLES:
            token["read_only"] = True

        # Role-based refresh token lifetime
        lifetime_seconds = ROLE_REFRESH_LIFETIMES.get(user.role, 30 * 86400)
        token.set_exp(
            claim="exp",
            from_time=token.current_time,
            lifetime=timedelta(seconds=lifetime_seconds),
        )

        # Active modules — lets the frontend gate UI without extra API calls
        if user.school_id:
            try:
                token["active_modules"] = user.school.subscription.get_active_modules()
            except Exception:
                token["active_modules"] = []
        else:
            token["active_modules"] = []

        return token

    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            # ── Auto-repair: detect unhashed passwords and fix them ──
            phone = attrs.get(self.username_field)
            user = User.objects.filter(phone_number=phone).first()

            if user is not None:
                # Check if the stored password looks unhashed
                is_hashed = True
                if user.password and not user.password.startswith("!"):
                    try:
                        identify_hasher(user.password)
                    except ValueError:
                        is_hashed = False

                if not is_hashed:
                    # The stored password is plain text — probably saved by a
                    # buggy admin form or a bulk-import script.
                    logger.warning(
                        "Auto-fixing unhashed password for user %s during login.",
                        phone,
                    )
                    user.set_password(user.password)
                    user.save(update_fields=["password"])
                    # Retry authentication with the now-hashed password
                    try:
                        data = super().validate(attrs)
                    except AuthenticationFailed:
                        logger.warning(
                            "Login still failed after rehash for %s "
                            "(is_active=%s, has_usable_pw=%s)",
                            phone,
                            user.is_active,
                            user.has_usable_password(),
                        )
                        raise
                else:
                    # Password IS hashed; log diagnostic info and re-raise
                    logger.warning(
                        "Login failed for existing user %s "
                        "(is_active=%s, has_usable_pw=%s)",
                        phone,
                        user.is_active,
                        user.has_usable_password(),
                    )
                    raise
            else:
                raise  # No such phone number

        # Extra fields returned alongside access/refresh
        data["role"] = self.user.role
        data["is_first_login"] = self.user.is_first_login
        data["school_id"] = str(self.user.school_id) if self.user.school_id else None
        data["contexts"] = build_user_contexts(self.user)
        return data


# ---------------------------------------------------------------------------
# Multi-context builder
# ---------------------------------------------------------------------------


def _school_category_to_context_type(school):
    """Map SchoolCategory to context_type string."""
    if school and school.school_category == "TRAINING_CENTER":
        return "FORMATION"
    return "SCHOOL"


def _get_modules(school):
    """Safely fetch active modules for a school."""
    try:
        return school.subscription.get_active_modules()
    except Exception:
        return []


def _get_children_for_parent(user, school):
    """Return children list for a PARENT user at a specific school."""
    try:
        profile = user.parent_profile
        children = []
        for sp in profile.children.select_related(
            "user", "current_class", "current_class__level"
        ).filter(user__school=school, user__is_active=True):
            children.append(
                {
                    "id": str(sp.user_id),
                    "first_name": sp.user.first_name,
                    "last_name": sp.user.last_name,
                    "class_name": (sp.current_class.name if sp.current_class else None),
                    "photo": sp.user.photo.url if sp.user.photo else None,
                }
            )
        return children
    except Exception:
        return []


def build_user_contexts(user):
    """
    Build the full list of contexts for a user.

    1. The primary context comes from user.role + user.school.
    2. Additional contexts come from UserContext rows.
    3. Each context has: context_id, type, role, school_id, school_name,
       school_logo, modules_active, and (for PARENT) children[].
    """
    from .models import UserContext

    contexts = []

    # ── Primary context (from User model) ──
    if user.school_id:
        school = user.school
        ctx = {
            "context_id": f"{user.id}_{user.school_id}_{user.role}",
            "type": _school_category_to_context_type(school),
            "role": user.role,
            "school_id": str(school.id),
            "school_name": school.name,
            "school_logo": school.logo.url if school.logo else None,
            "modules_active": _get_modules(school),
        }
        if user.role == "PARENT":
            ctx["children"] = _get_children_for_parent(user, school)
        contexts.append(ctx)
    elif user.role == "SUPER_ADMIN":
        contexts.append(
            {
                "context_id": f"{user.id}_superadmin",
                "type": "PLATFORM",
                "role": "SUPER_ADMIN",
                "school_id": None,
                "school_name": "Plateforme ILMI",
                "school_logo": None,
                "modules_active": [],
            }
        )

    # ── Additional contexts (from UserContext table) ──
    extra = UserContext.objects.filter(user=user, is_active=True).select_related(
        "school", "school__subscription"
    )
    for uc in extra:
        # Skip if same as primary
        if str(uc.school_id) == str(user.school_id or "") and uc.role == user.role:
            continue
        ctx = {
            "context_id": f"{user.id}_{uc.school_id}_{uc.role}",
            "type": uc.context_type,
            "role": uc.role,
            "school_id": str(uc.school_id),
            "school_name": uc.school.name,
            "school_logo": uc.school.logo.url if uc.school.logo else None,
            "modules_active": _get_modules(uc.school),
        }
        if uc.role == "PARENT":
            ctx["children"] = _get_children_for_parent(user, uc.school)
        contexts.append(ctx)

    return contexts


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
    contexts = serializers.SerializerMethodField()

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
            "contexts",
        ]
        read_only_fields = ["id", "created_at", "contexts"]

    def get_contexts(self, obj):
        return build_user_contexts(obj)


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
                # SUPER_ADMIN fallback: auto-assign the only school if there is exactly one
                from apps.schools.models import School as _School

                schools = _School.objects.filter(is_deleted=False)
                if schools.count() == 1:
                    attrs["school"] = schools.first()
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
