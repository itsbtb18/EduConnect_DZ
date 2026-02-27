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

from core.permissions import IsSchoolAdmin

from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    PINLoginSerializer,
    UserCreateSerializer,
    UserSerializer,
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
# User management
# ---------------------------------------------------------------------------


@extend_schema(tags=["auth"])
class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/auth/users/  → List users in the school
    POST /api/v1/auth/users/  → Create a new user (admins only)
    """

    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def get_queryset(self):
        return User.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        serializer.save(
            school=self.request.user.school,
            created_by=self.request.user,
        )

    @extend_schema(
        summary="List school users",
        description="List all users in the authenticated admin's school.",
        responses={200: UserSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create a user",
        description=(
            "Create a new user in the admin's school. "
            "Requires **ADMIN** or **SECTION_ADMIN** role."
        ),
        request=UserCreateSerializer,
        responses={
            201: UserSerializer,
            400: OpenApiResponse(description="Validation error."),
            403: OpenApiResponse(description="Not a school admin."),
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

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSchoolAdmin]

    def get_queryset(self):
        return User.objects.filter(school=self.request.user.school)

    @extend_schema(
        summary="Retrieve a user",
        description="Get details of a user in the admin's school.",
        responses={
            200: UserSerializer,
            404: OpenApiResponse(description="User not found."),
        },
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update a user",
        description="Partially update a user in the admin's school.",
        request=UserSerializer,
        responses={
            200: UserSerializer,
            404: OpenApiResponse(description="User not found."),
        },
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete a user",
        description="Remove a user from the admin's school.",
        responses={204: None, 404: OpenApiResponse(description="User not found.")},
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


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
