"""
Views for the Accounts app.
"""

import hashlib

from django.contrib.auth import get_user_model
from django.core.cache import cache
from drf_spectacular.utils import OpenApiResponse, extend_schema, inline_serializer
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.permissions import IsSchoolAdmin, IsSuperAdmin

from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    PINLoginSerializer,
    ResetPasswordSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
)

User = get_user_model()

# Reusable inline schemas for auth responses
_TokenResponseSchema = inline_serializer(
    "TokenResponse",
    fields={
        "access": serializers.CharField(),
        "refresh": serializers.CharField(),
        "role": serializers.CharField(),
        "is_first_login": serializers.BooleanField(),
        "school_id": serializers.CharField(allow_null=True),
    },
)

_DetailSchema = inline_serializer(
    "DetailResponse",
    fields={"detail": serializers.CharField()},
)


# ---------------------------------------------------------------------------
# JWT Login (phone_number + password)
# ---------------------------------------------------------------------------


@extend_schema(
    tags=["auth"],
    summary="Login with phone number & password",
    description=(
        "Authenticate using **phone_number** + **password**. "
        "Returns JWT access/refresh tokens along with user role and school ID."
    ),
    responses={
        200: _TokenResponseSchema,
        401: OpenApiResponse(description="Invalid credentials."),
    },
)
class LoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/
    Authenticate with phone_number + password.
    Returns: access, refresh, role, is_first_login, school_id.
    """

    serializer_class = CustomTokenObtainPairSerializer


# ---------------------------------------------------------------------------
# PIN Login (phone_number + pin — students only)
# ---------------------------------------------------------------------------

# Rate-limit constants
_PIN_MAX_ATTEMPTS = 5
_PIN_LOCKOUT_SECONDS = 30 * 60  # 30 minutes


def _cache_key(phone_number: str) -> str:
    """Return a cache key for PIN login attempts."""
    return f"pin_attempts:{phone_number}"


class PINLoginView(APIView):
    """
    POST /api/v1/auth/login/pin/
    Authenticate a STUDENT user with phone_number + PIN.

    Rate limiting:
    - Max 5 failed attempts per phone_number.
    - After 5 failures the phone_number is locked out for 30 minutes.
    - Uses Django cache backend (Redis recommended).

    Security:
    - Generic error message regardless of whether the phone exists,
      the role is wrong, or the PIN doesn't match.
    """

    permission_classes = [permissions.AllowAny]

    _GENERIC_ERROR = "Invalid credentials."

    @extend_schema(
        tags=["auth"],
        summary="Login with phone number & PIN (students)",
        description=(
            "Authenticate a **STUDENT** user with phone_number + 4-digit PIN. "
            "Rate-limited to 5 attempts per phone number (30-min lockout)."
        ),
        request=PINLoginSerializer,
        responses={
            200: _TokenResponseSchema,
            401: OpenApiResponse(description="Invalid credentials or locked out."),
        },
    )
    def post(self, request):
        serializer = PINLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone_number = serializer.validated_data["phone_number"]
        pin = serializer.validated_data["pin"]

        # ---- rate-limit check ----
        key = _cache_key(phone_number)
        attempts = cache.get(key, 0)
        if attempts >= _PIN_MAX_ATTEMPTS:
            return Response(
                {"detail": self._GENERIC_ERROR},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ---- authenticate ----
        try:
            user = User.objects.select_related("school").get(
                phone_number=phone_number,
                role=User.Role.STUDENT,
                is_active=True,
            )
            profile = user.student_profile  # raises RelatedObjectDoesNotExist
        except (User.DoesNotExist, User.student_profile.RelatedObjectDoesNotExist):
            self._record_failure(key)
            return Response(
                {"detail": self._GENERIC_ERROR},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Verify hashed PIN
        pin_hash = hashlib.sha256(str(pin).encode()).hexdigest()
        if profile.pin_hash != pin_hash:
            self._record_failure(key)
            return Response(
                {"detail": self._GENERIC_ERROR},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ---- success — clear attempts, issue JWT ----
        cache.delete(key)

        token = CustomTokenObtainPairSerializer.get_token(user)
        return Response(
            {
                "access": str(token.access_token),
                "refresh": str(token),
                "role": user.role,
                "is_first_login": user.is_first_login,
                "school_id": str(user.school_id) if user.school_id else None,
            }
        )

    @staticmethod
    def _record_failure(key: str):
        """Increment failed-attempt counter in cache."""
        attempts = cache.get(key, 0) + 1
        cache.set(key, attempts, timeout=_PIN_LOCKOUT_SECONDS)


# ---------------------------------------------------------------------------
# Token Refresh
# ---------------------------------------------------------------------------


@extend_schema(
    tags=["auth"],
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access/refresh pair.",
    responses={
        200: OpenApiResponse(description="New token pair returned."),
        401: OpenApiResponse(description="Token is invalid or expired."),
    },
)
class TokenRefreshAPIView(TokenRefreshView):
    """
    POST /api/v1/auth/refresh/
    Refresh an expired access token.
    """

    pass


# ---------------------------------------------------------------------------
# User management (school admin or superadmin)
# ---------------------------------------------------------------------------


class IsSuperOrSchoolAdmin(permissions.BasePermission):
    """Allow SUPER_ADMIN, ADMIN, or SECTION_ADMIN."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN")
        )


@extend_schema(tags=["auth"])
class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/auth/users/  → List users (filtered by school or all for superadmin)
    POST /api/v1/auth/users/  → Create a new user
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperOrSchoolAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related("school").all()

        # SUPER_ADMIN sees all users; school admins see only their school
        if user.role != "SUPER_ADMIN":
            qs = qs.filter(school=user.school)

        # Optional filters
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)

        school_id = self.request.query_params.get("school")
        if school_id and user.role == "SUPER_ADMIN":
            qs = qs.filter(school_id=school_id)

        search = self.request.query_params.get("search")
        if search:
            from django.db.models import Q

            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(phone_number__icontains=search)
                | Q(email__icontains=search)
            )

        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() in ("true", "1"))

        return qs.order_by("last_name", "first_name")

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @extend_schema(
        summary="List users",
        description=(
            "List users. SUPER_ADMIN sees all (can filter by school/role). "
            "School admins see only their school's users."
        ),
        responses={200: UserSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create a user",
        description=(
            "Create a new user. SUPER_ADMIN can specify any school. "
            "School admins auto-assign their own school."
        ),
        request=UserCreateSerializer,
        responses={
            201: UserSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Insufficient permissions."),
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


@extend_schema(tags=["auth"])
class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/auth/users/<id>/
    PATCH  /api/v1/auth/users/<id>/
    DELETE /api/v1/auth/users/<id>/
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperOrSchoolAdmin]

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return UserUpdateSerializer
        return UserSerializer

    def get_queryset(self):
        user = self.request.user
        qs = User.objects.select_related("school").all()
        if user.role != "SUPER_ADMIN":
            qs = qs.filter(school=user.school)
        return qs

    @extend_schema(
        summary="Retrieve a user",
        description="Get details of a user.",
        responses={
            200: UserSerializer,
            404: OpenApiResponse(description="User not found."),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update a user",
        description="Partially update a user.",
        request=UserUpdateSerializer,
        responses={
            200: UserSerializer,
            404: OpenApiResponse(description="User not found."),
        },
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete a user",
        description="Deactivate (soft-delete) a user.",
        responses={204: None, 404: OpenApiResponse(description="User not found.")},
    )
    def delete(self, request, *args, **kwargs):
        # Soft-delete: deactivate instead of hard delete
        instance = self.get_object()
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Admin password reset (superadmin / school admin resets a user's password)
# ---------------------------------------------------------------------------


class ResetUserPasswordView(APIView):
    """
    POST /api/v1/auth/users/<uuid:pk>/reset-password/
    Admin resets a user's password without knowing the old one.
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperOrSchoolAdmin]

    @extend_schema(
        tags=["auth"],
        summary="Reset a user's password",
        description="Admin resets a user's password. Sets is_first_login=True.",
        request=ResetPasswordSerializer,
        responses={
            200: _DetailSchema,
            404: OpenApiResponse(description="User not found."),
        },
    )
    def post(self, request, pk):
        try:
            qs = User.objects.all()
            if request.user.role != "SUPER_ADMIN":
                qs = qs.filter(school=request.user.school)
            target_user = qs.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_user.set_password(serializer.validated_data["new_password"])
        target_user.is_first_login = True
        target_user.save(update_fields=["password", "is_first_login"])

        return Response({"detail": "Password has been reset. User must change it on next login."})


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/v1/auth/me/     → Current user profile
    PATCH /api/v1/auth/me/     → Update own profile
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    @extend_schema(
        tags=["auth"],
        summary="Get current user profile",
        description="Retrieve the authenticated user's own profile.",
        responses={200: UserSerializer},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        tags=["auth"],
        summary="Update current user profile",
        description="Update the authenticated user's own profile fields.",
        request=UserSerializer,
        responses={200: UserSerializer},
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password/
    """

    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["auth"],
        summary="Change password",
        description="Change the authenticated user's password. Clears the first-login flag.",
        request=ChangePasswordSerializer,
        responses={
            200: _DetailSchema,
            400: OpenApiResponse(
                description="Old password incorrect or validation error."
            ),
        },
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data["new_password"])
        user.is_first_login = False
        user.save(update_fields=["password", "is_first_login"])

        return Response({"detail": "Password changed successfully."})
