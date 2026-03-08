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

from .security import (
    compute_device_fingerprint,
    create_session,
    detect_token_reuse,
    generate_otp,
    get_client_ip,
    get_device_info,
    get_lockout_remaining_seconds,
    get_remaining_attempts,
    is_account_locked,
    is_trusted_device,
    log_audit,
    record_login_attempt,
    register_trusted_device,
    revoke_all_sessions,
    verify_otp,
    verify_totp,
)
from .serializers import (
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    PINLoginSerializer,
    ResetPasswordSerializer,
    UserCreateSerializer,
    UserSerializer,
    UserUpdateSerializer,
    build_user_contexts,
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
class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Authenticate with phone_number + password.
    Returns: access, refresh, role, is_first_login, school_id.

    Security features:
    - Account lockout after 5 failed attempts (30 min)
    - Remaining attempts returned in response
    - Device trust checking (new device → requires OTP per role)
    - Audit logging of all attempts
    - TOTP enforcement for Super Admin
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=["auth"],
        summary="Login with phone number & password",
        description=(
            "Authenticate using **phone_number** + **password**. "
            "Returns JWT access/refresh tokens along with user role and school ID. "
            "May require additional 2FA verification for certain roles."
        ),
        responses={
            200: _TokenResponseSchema,
            401: OpenApiResponse(description="Invalid credentials."),
            423: OpenApiResponse(description="Account locked."),
        },
    )
    def post(self, request):
        from .models_security import (
            ROLES_REQUIRING_DEVICE_OTP,
            ROLES_REQUIRING_TOTP,
            ROLES_WITH_LOGIN_ALERT,
        )

        phone_number = request.data.get("phone_number", "")

        # ── Check lockout ──
        if is_account_locked(phone_number):
            remaining = get_lockout_remaining_seconds(phone_number)
            return Response(
                {
                    "detail": "Compte verrouillé suite à trop de tentatives échouées.",
                    "locked": True,
                    "lockout_remaining_seconds": remaining,
                },
                status=status.HTTP_423_LOCKED,
            )

        # ── Authenticate ──
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            record_login_attempt(
                phone_number,
                request,
                success=False,
                failure_reason="invalid_credentials",
            )
            remaining = get_remaining_attempts(phone_number)
            response_data = {
                "detail": "Identifiants incorrects.",
                "remaining_attempts": remaining,
            }
            if remaining <= 0:
                response_data["locked"] = True
                response_data["lockout_remaining_seconds"] = 1800
            return Response(response_data, status=status.HTTP_401_UNAUTHORIZED)

        user = serializer.user
        data = serializer.validated_data

        # ── Device trust check ──
        fingerprint = compute_device_fingerprint(request)
        is_new_device = not is_trusted_device(user, fingerprint)

        # ── TOTP required for Super Admin ──
        if user.role in ROLES_REQUIRING_TOTP:
            from .models_security import TOTPDevice

            try:
                totp_device = TOTPDevice.objects.get(user=user, is_confirmed=True)
            except TOTPDevice.DoesNotExist:
                totp_device = None

            if totp_device:
                # Require TOTP verification as second step
                record_login_attempt(phone_number, request, success=True)
                log_audit(
                    action="LOGIN",
                    request=request,
                    user=user,
                    metadata={"step": "totp_required"},
                )
                return Response(
                    {
                        "requires_totp": True,
                        "access": data["access"],
                        "refresh": data["refresh"],
                        "message": "Veuillez entrer votre code TOTP.",
                    }
                )

        # ── SMS OTP required for new device (role-dependent) ──
        if is_new_device and user.role in ROLES_REQUIRING_DEVICE_OTP:
            otp_code = generate_otp(user, "DEVICE_TRUST", fingerprint)
            # In production, send SMS via the SMS app
            try:
                from apps.sms.utils import send_sms

                send_sms(
                    user.phone_number,
                    f"ILMI - Code de vérification: {otp_code}. Ce code expire dans 5 minutes.",
                )
            except Exception:
                pass  # SMS service may not be configured in dev

            log_audit(
                action="OTP_SENT",
                request=request,
                user=user,
                metadata={"purpose": "device_trust"},
            )
            record_login_attempt(phone_number, request, success=True)

            return Response(
                {
                    "requires_otp": True,
                    "access": data["access"],
                    "refresh": data["refresh"],
                    "message": "Nouvel appareil détecté. Un code de vérification a été envoyé par SMS.",
                }
            )

        # ── Full success — record and return ──
        record_login_attempt(phone_number, request, success=True)

        # Register device as trusted
        device = register_trusted_device(user, fingerprint, request)

        # Create session
        jti = data.get("refresh", "")
        try:
            from rest_framework_simplejwt.tokens import RefreshToken

            token_obj = RefreshToken(data["refresh"])
            jti = str(token_obj.get("jti", ""))
        except Exception:
            jti = ""
        if jti:
            create_session(user, jti, request, device=device)

        # Audit log
        log_audit(
            action="LOGIN",
            request=request,
            user=user,
            metadata={"device": fingerprint[:12]},
        )

        # Email alert for certain roles
        if user.role in ROLES_WITH_LOGIN_ALERT and user.email:
            try:
                from django.core.mail import send_mail

                send_mail(
                    subject="ILMI — Nouvelle connexion détectée",
                    message=f"Une connexion à votre compte a été détectée depuis {get_client_ip(request)}.",
                    from_email=None,
                    recipient_list=[user.email],
                    fail_silently=True,
                )
            except Exception:
                pass

        return Response(
            {
                "access": data["access"],
                "refresh": data["refresh"],
                "role": data["role"],
                "is_first_login": data["is_first_login"],
                "school_id": data.get("school_id"),
                "contexts": data.get("contexts", []),
            }
        )


# ---------------------------------------------------------------------------
# OTP Verification (post-login step)
# ---------------------------------------------------------------------------


class VerifyOTPView(APIView):
    """
    POST /api/v1/auth/verify-otp/
    Verify SMS OTP for new device trust.
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=["auth"],
        summary="Verify SMS OTP for device trust",
        request=inline_serializer(
            "OTPVerifyRequest",
            fields={
                "access": serializers.CharField(),
                "refresh": serializers.CharField(),
                "otp_code": serializers.CharField(),
            },
        ),
        responses={
            200: _TokenResponseSchema,
            401: OpenApiResponse(description="Invalid or expired OTP."),
        },
    )
    def post(self, request):
        from rest_framework_simplejwt.tokens import AccessToken

        access_token = request.data.get("access", "")
        refresh_token = request.data.get("refresh", "")
        otp_code = request.data.get("otp_code", "")

        if not access_token or not otp_code:
            return Response(
                {"detail": "Token et code OTP requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Decode access token to get user
        try:
            token_data = AccessToken(access_token)
            user_id = token_data.get("user_id")
            user = User.objects.get(id=user_id)
        except Exception:
            return Response(
                {"detail": "Token invalide."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not verify_otp(user, otp_code, "DEVICE_TRUST"):
            return Response(
                {"detail": "Code OTP invalide ou expiré."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # OTP verified — register device
        fingerprint = compute_device_fingerprint(request)
        device = register_trusted_device(user, fingerprint, request)

        # Create session
        try:
            from rest_framework_simplejwt.tokens import RefreshToken

            token_obj = RefreshToken(refresh_token)
            jti = str(token_obj.get("jti", ""))
            if jti:
                create_session(user, jti, request, device=device)
        except Exception:
            pass

        log_audit(
            action="OTP_VERIFIED",
            request=request,
            user=user,
            metadata={"purpose": "device_trust"},
        )
        log_audit(
            action="DEVICE_NEW",
            request=request,
            user=user,
            metadata={"fingerprint": fingerprint[:12]},
        )

        return Response(
            {
                "access": access_token,
                "refresh": refresh_token,
                "role": user.role,
                "is_first_login": user.is_first_login,
                "school_id": str(user.school_id) if user.school_id else None,
                "contexts": build_user_contexts(user),
            }
        )


# ---------------------------------------------------------------------------
# TOTP Verification (Super Admin)
# ---------------------------------------------------------------------------


class VerifyTOTPView(APIView):
    """
    POST /api/v1/auth/verify-totp/
    Verify TOTP code for Super Admin 2FA.
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=["auth"],
        summary="Verify TOTP code (Super Admin 2FA)",
        request=inline_serializer(
            "TOTPVerifyRequest",
            fields={
                "access": serializers.CharField(),
                "refresh": serializers.CharField(),
                "totp_code": serializers.CharField(),
            },
        ),
        responses={
            200: _TokenResponseSchema,
            401: OpenApiResponse(description="Invalid TOTP code."),
        },
    )
    def post(self, request):
        from rest_framework_simplejwt.tokens import AccessToken

        access_token = request.data.get("access", "")
        refresh_token = request.data.get("refresh", "")
        totp_code = request.data.get("totp_code", "")

        try:
            token_data = AccessToken(access_token)
            user_id = token_data.get("user_id")
            user = User.objects.get(id=user_id)
        except Exception:
            return Response(
                {"detail": "Token invalide."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not verify_totp(user, totp_code):
            return Response(
                {"detail": "Code TOTP invalide."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Register device as trusted
        fingerprint = compute_device_fingerprint(request)
        device = register_trusted_device(user, fingerprint, request)

        # Create session
        try:
            from rest_framework_simplejwt.tokens import RefreshToken

            token_obj = RefreshToken(refresh_token)
            jti = str(token_obj.get("jti", ""))
            if jti:
                create_session(user, jti, request, device=device)
        except Exception:
            pass

        log_audit(
            action="LOGIN",
            request=request,
            user=user,
            metadata={"2fa": "totp_verified"},
        )

        return Response(
            {
                "access": access_token,
                "refresh": refresh_token,
                "role": user.role,
                "is_first_login": user.is_first_login,
                "school_id": str(user.school_id) if user.school_id else None,
                "contexts": build_user_contexts(user),
            }
        )


# ---------------------------------------------------------------------------
# TOTP Setup (Super Admin)
# ---------------------------------------------------------------------------


class TOTPSetupView(APIView):
    """
    POST /api/v1/auth/totp/setup/
    Generate TOTP secret and return provisioning URI for Google Authenticator.
    GET  /api/v1/auth/totp/setup/
    Check if TOTP is configured.
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    @extend_schema(tags=["auth"], summary="Check TOTP status")
    def get(self, request):
        from .models_security import TOTPDevice

        try:
            device = TOTPDevice.objects.get(user=request.user)
            return Response({"configured": device.is_confirmed})
        except TOTPDevice.DoesNotExist:
            return Response({"configured": False})

    @extend_schema(tags=["auth"], summary="Setup TOTP for Super Admin")
    def post(self, request):
        from .security import setup_totp

        uri = setup_totp(request.user)
        log_audit(action="TOTP_SETUP", request=request, user=request.user)
        return Response({"provisioning_uri": uri})


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
                "contexts": build_user_contexts(user),
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
class TokenRefreshAPIView(APIView):
    """
    POST /api/v1/auth/refresh/
    Refresh an expired access token.

    Security: detects refresh token reuse (double-use = stolen token).
    If reuse is detected, ALL sessions for that user are revoked.
    """

    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=["auth"],
        summary="Refresh access token",
        description=(
            "Exchange a valid refresh token for a new access/refresh pair. "
            "If token reuse is detected, all sessions are revoked."
        ),
        request=inline_serializer(
            "RefreshRequest",
            fields={"refresh": serializers.CharField()},
        ),
        responses={
            200: OpenApiResponse(description="New token pair returned."),
            401: OpenApiResponse(description="Token is invalid, expired, or revoked."),
        },
    )
    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError
        from .models_security import ActiveSession

        refresh_str = request.data.get("refresh", "")
        if not refresh_str:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            old_token = RefreshToken(refresh_str)
            old_jti = str(old_token.get("jti", ""))
        except TokenError:
            return Response(
                {"detail": "Token invalide ou expiré."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ── Detect token reuse ──
        if old_jti and detect_token_reuse(old_jti):
            return Response(
                {
                    "detail": "Session révoquée pour raison de sécurité. Veuillez vous reconnecter."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # ── Check if session is revoked ──
        if old_jti:
            try:
                session = ActiveSession.objects.get(refresh_token_jti=old_jti)
                if session.is_revoked:
                    return Response(
                        {"detail": "Session révoquée. Veuillez vous reconnecter."},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
            except ActiveSession.DoesNotExist:
                pass  # Session tracking may not exist for older tokens

        try:
            # Blacklist old token and get new pair
            old_token.blacklist()
            user_id = old_token.get("user_id")
            user = User.objects.get(id=user_id)
            new_token = CustomTokenObtainPairSerializer.get_token(user)

            # Update session with new JTI
            new_jti = str(new_token.get("jti", ""))
            if old_jti:
                # Mark old session as revoked
                ActiveSession.objects.filter(refresh_token_jti=old_jti).update(
                    is_revoked=True
                )
            if new_jti:
                create_session(user, new_jti, request)

            return Response(
                {
                    "access": str(new_token.access_token),
                    "refresh": str(new_token),
                }
            )
        except (TokenError, User.DoesNotExist):
            return Response(
                {"detail": "Token invalide ou expiré."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


# ---------------------------------------------------------------------------
# Logout (blacklist refresh token)
# ---------------------------------------------------------------------------


@extend_schema(
    tags=["auth"],
    summary="Logout — blacklist refresh token",
    description="Blacklists the given refresh token so it can no longer be used.",
    request=inline_serializer(
        "LogoutRequest",
        fields={"refresh": serializers.CharField()},
    ),
    responses={
        205: OpenApiResponse(description="Token blacklisted."),
        400: OpenApiResponse(description="Invalid token."),
    },
)
class LogoutView(APIView):
    """POST /api/v1/auth/logout/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken
        from rest_framework_simplejwt.exceptions import TokenError

        refresh = request.data.get("refresh")
        if not refresh:
            return Response(
                {"detail": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh)
            jti = str(token.get("jti", ""))
            token.blacklist()
            # Revoke session
            if jti:
                revoke_session(jti)
        except TokenError:
            pass  # Token already expired / blacklisted — that's fine

        # Audit log
        log_audit(
            user=request.user,
            action="LOGOUT",
            request=request,
        )

        return Response(status=status.HTTP_205_RESET_CONTENT)


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

        return Response(
            {"detail": "Password has been reset. User must change it on next login."}
        )


class MeView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/v1/auth/me/     → Current user profile
    PATCH /api/v1/auth/me/     → Update own profile
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return (
            User.objects.select_related("school", "school__subscription")
            .prefetch_related("extra_contexts__school__subscription")
            .get(pk=self.request.user.pk)
        )

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


# ---------------------------------------------------------------------------
# Platform stats (super admin only)
# ---------------------------------------------------------------------------


class PlatformStatsView(APIView):
    """
    GET /api/v1/auth/platform-stats/
    Returns platform-wide statistics for the super admin dashboard.
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    @extend_schema(
        tags=["auth"],
        summary="Platform statistics (super admin)",
        description=(
            "Returns aggregated statistics across the entire platform: "
            "total schools, users, subscriptions, recent activity."
        ),
    )
    def get(self, request):
        from datetime import timedelta

        from django.db.models import Count, Q
        from django.utils import timezone

        from apps.schools.models import School

        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        # School stats
        total_schools = School.objects.filter(is_deleted=False).count()
        active_subscriptions = School.objects.filter(
            is_deleted=False, subscription_active=True
        ).count()
        inactive_subscriptions = total_schools - active_subscriptions

        # Plan distribution
        plan_distribution = list(
            School.objects.filter(is_deleted=False)
            .values("subscription_plan")
            .annotate(count=Count("id"))
            .order_by("subscription_plan")
        )

        # User stats
        total_users = User.objects.filter(is_active=True).count()
        users_by_role = list(
            User.objects.filter(is_active=True)
            .values("role")
            .annotate(count=Count("id"))
            .order_by("role")
        )
        new_users_30d = User.objects.filter(
            is_active=True, created_at__gte=thirty_days_ago
        ).count()

        # Recent schools added
        recent_schools = list(
            School.objects.filter(is_deleted=False)
            .order_by("-created_at")[:5]
            .values(
                "id",
                "name",
                "subdomain",
                "subscription_plan",
                "subscription_active",
                "created_at",
            )
        )

        # Recent users added
        recent_users = list(
            User.objects.filter(is_active=True)
            .select_related("school")
            .order_by("-created_at")[:10]
            .values(
                "id",
                "first_name",
                "last_name",
                "role",
                "phone_number",
                "school__name",
                "created_at",
            )
        )

        # Activity counts for last 7 days
        new_users_7d = User.objects.filter(
            is_active=True, created_at__gte=seven_days_ago
        ).count()
        new_schools_7d = School.objects.filter(
            is_deleted=False, created_at__gte=seven_days_ago
        ).count()

        return Response(
            {
                "schools": {
                    "total": total_schools,
                    "active_subscriptions": active_subscriptions,
                    "inactive_subscriptions": inactive_subscriptions,
                    "plan_distribution": plan_distribution,
                    "new_last_7d": new_schools_7d,
                },
                "users": {
                    "total": total_users,
                    "by_role": users_by_role,
                    "new_last_30d": new_users_30d,
                    "new_last_7d": new_users_7d,
                },
                "recent_schools": recent_schools,
                "recent_users": recent_users,
            }
        )


# ─── Platform Settings (Super Admin) ────────────────────────────────
class PlatformSettingsView(APIView):
    """Retrieve or update the singleton platform configuration."""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        from .models import PlatformConfig

        config, _ = PlatformConfig.objects.get_or_create(pk=1)
        return Response(
            {
                "platform_name": config.platform_name,
                "default_language": config.default_language,
                "maintenance_mode": config.maintenance_mode,
                "allow_registration": config.allow_registration,
                "max_schools": config.max_schools,
                "smtp_configured": config.smtp_configured,
                "sms_configured": config.sms_configured,
                "backup_enabled": config.backup_enabled,
            }
        )

    def patch(self, request):
        from .models import PlatformConfig

        config, _ = PlatformConfig.objects.get_or_create(pk=1)
        allowed_fields = [
            "platform_name",
            "default_language",
            "maintenance_mode",
            "allow_registration",
            "max_schools",
            "smtp_configured",
            "sms_configured",
            "backup_enabled",
        ]
        for field in allowed_fields:
            if field in request.data:
                setattr(config, field, request.data[field])
        config.save()
        return Response({"status": "ok"})


# ─── Activity Logs (Super Admin) ─────────────────────────────────────
class ActivityLogListView(generics.ListAPIView):
    """Paginated activity logs. Supports ?search= and ?action= filters."""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        from .models import ActivityLog

        qs = ActivityLog.objects.select_related("user").all()
        search = self.request.query_params.get("search", "")
        action = self.request.query_params.get("action", "")
        if search:
            qs = qs.filter(description__icontains=search)
        if action:
            qs = qs.filter(action=action)
        return qs

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        results = page if page is not None else qs[:50]
        data = [
            {
                "id": str(log.id),
                "user": log.user.full_name if log.user else "System",
                "action": log.action,
                "resource": log.resource,
                "description": log.description,
                "ip_address": log.ip_address,
                "created_at": log.created_at.isoformat(),
            }
            for log in results
        ]
        if page is not None:
            return self.get_paginated_response(data)
        return Response({"count": len(data), "results": data})


# ─── System Health Check ─────────────────────────────────────────────
class SystemHealthView(APIView):
    """Quick system health check: DB, Redis, Celery, Storage."""

    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        import os
        from django.conf import settings as dj_settings
        from django.db import connection

        health = {}

        # Database
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            db_name = dj_settings.DATABASES.get("default", {}).get("NAME", "unknown")
            health["database"] = {
                "status": "healthy",
                "name": db_name,
                "engine": "PostgreSQL",
            }
        except Exception as exc:
            health["database"] = {"status": "unhealthy", "error": str(exc)}

        # Redis
        try:
            cache.set("_health_check", "ok", 5)
            val = cache.get("_health_check")
            health["redis"] = {
                "status": "healthy" if val == "ok" else "degraded",
                "ping": val == "ok",
            }
        except Exception as exc:
            health["redis"] = {"status": "unhealthy", "error": str(exc)}

        # Celery
        try:
            from ilmi.celery import app as celery_app

            insp = celery_app.control.inspect(timeout=2)
            active = insp.active()
            health["celery"] = {
                "status": "healthy" if active else "degraded",
                "workers": len(active) if active else 0,
            }
        except Exception:
            health["celery"] = {"status": "unknown", "workers": 0}

        # Storage
        try:
            media_root = getattr(dj_settings, "MEDIA_ROOT", "")
            if media_root and os.path.isdir(media_root):
                stat = os.statvfs(media_root) if hasattr(os, "statvfs") else None
                if stat:
                    free_gb = round(stat.f_bavail * stat.f_frsize / (1024**3), 2)
                    health["storage"] = {"status": "healthy", "free_gb": free_gb}
                else:
                    health["storage"] = {
                        "status": "healthy",
                        "free_gb": "N/A (Windows)",
                    }
            else:
                health["storage"] = {"status": "unknown", "path": media_root}
        except Exception as exc:
            health["storage"] = {"status": "unhealthy", "error": str(exc)}

        return Response(health)


# ---------------------------------------------------------------------------
# Device management
# ---------------------------------------------------------------------------


@extend_schema(tags=["security"])
class DeviceListView(generics.ListAPIView):
    """GET /api/v1/auth/devices/ — List current user's trusted devices."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .models_security import TrustedDevice

        return TrustedDevice.objects.filter(
            user=self.request.user, is_revoked=False
        ).order_by("-last_used")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        data = [
            {
                "id": str(d.id),
                "device_name": d.device_name,
                "device_os": d.device_os,
                "last_ip": d.last_ip,
                "last_used": d.last_used.isoformat() if d.last_used else None,
                "created_at": d.created_at.isoformat(),
            }
            for d in qs
        ]
        return Response(data)


@extend_schema(tags=["security"])
class DeviceRevokeView(APIView):
    """POST /api/v1/auth/devices/<pk>/revoke/ — Revoke a trusted device."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from .models_security import TrustedDevice

        try:
            device = TrustedDevice.objects.get(
                id=pk, user=request.user, is_revoked=False
            )
        except TrustedDevice.DoesNotExist:
            return Response(
                {"detail": "Appareil non trouvé."}, status=status.HTTP_404_NOT_FOUND
            )

        device.is_revoked = True
        device.save(update_fields=["is_revoked"])

        log_audit(
            user=request.user,
            action="DEVICE_REVOKED",
            request=request,
            metadata={"device_id": str(pk), "device_name": device.device_name},
        )

        return Response({"detail": "Appareil révoqué."})


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------


@extend_schema(tags=["security"])
class SessionListView(generics.ListAPIView):
    """GET /api/v1/auth/sessions/ — List current user's active sessions."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .models_security import ActiveSession

        return (
            ActiveSession.objects.filter(user=self.request.user, is_revoked=False)
            .select_related("device")
            .order_by("-created_at")
        )

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        data = [
            {
                "id": str(s.id),
                "device_name": s.device.device_name if s.device else None,
                "device_os": s.device.device_os if s.device else None,
                "ip_address": s.ip_address,
                "user_agent": s.user_agent,
                "created_at": s.created_at.isoformat(),
                "expires_at": s.expires_at.isoformat() if s.expires_at else None,
            }
            for s in qs
        ]
        return Response(data)


@extend_schema(tags=["security"])
class SessionRevokeView(APIView):
    """POST /api/v1/auth/sessions/<pk>/revoke/ — Revoke a specific session."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        from .models_security import ActiveSession

        try:
            session = ActiveSession.objects.get(
                id=pk, user=request.user, is_revoked=False
            )
        except ActiveSession.DoesNotExist:
            return Response(
                {"detail": "Session non trouvée."}, status=status.HTTP_404_NOT_FOUND
            )

        revoke_session(session.refresh_token_jti)

        log_audit(
            user=request.user,
            action="SESSION_REVOKED",
            request=request,
            metadata={"session_id": str(pk)},
        )

        return Response({"detail": "Session révoquée."})


@extend_schema(tags=["security"])
class RevokeAllSessionsView(APIView):
    """POST /api/v1/auth/sessions/revoke-all/ — Revoke all user sessions (except current)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        current_jti = request.data.get("current_jti")
        revoke_all_sessions(request.user, exclude_jti=current_jti)

        log_audit(
            user=request.user,
            action="ALL_SESSIONS_REVOKED",
            request=request,
        )

        return Response({"detail": "Toutes les sessions ont été révoquées."})


# ---------------------------------------------------------------------------
# Audit log (enhanced — school-scoped for school admins)
# ---------------------------------------------------------------------------


@extend_schema(tags=["security"])
class AuditLogListView(generics.ListAPIView):
    """
    GET /api/v1/auth/audit-logs/
    Paginated audit logs with filters.
    - Super admin: all logs
    - School admin: logs scoped to their school
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .models_security import AuditLog

        user = self.request.user

        if user.role == "SUPER_ADMIN":
            qs = AuditLog.objects.all()
        elif user.role in ("ADMIN", "SECTION_ADMIN"):
            qs = AuditLog.objects.filter(school=user.school)
        else:
            return AuditLog.objects.none()

        # Filters
        params = self.request.query_params
        if params.get("action"):
            qs = qs.filter(action=params["action"])
        if params.get("user_id"):
            qs = qs.filter(user_id=params["user_id"])
        if params.get("model"):
            qs = qs.filter(model_name__icontains=params["model"])
        if params.get("ip"):
            qs = qs.filter(ip_address=params["ip"])
        if params.get("role"):
            qs = qs.filter(role=params["role"])
        if params.get("date_from"):
            qs = qs.filter(timestamp__date__gte=params["date_from"])
        if params.get("date_to"):
            qs = qs.filter(timestamp__date__lte=params["date_to"])
        if params.get("search"):
            from django.db.models import Q

            qs = qs.filter(
                Q(model_name__icontains=params["search"])
                | Q(ip_address__icontains=params["search"])
            )

        return qs.select_related("user", "school").order_by("-timestamp")

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        page = self.paginate_queryset(qs)
        results = page if page is not None else qs[:100]
        data = [
            {
                "id": str(log.id),
                "user": log.user.full_name if log.user else "System",
                "user_id": str(log.user_id) if log.user_id else None,
                "action": log.action,
                "model_name": log.model_name,
                "object_id": str(log.object_id) if log.object_id else None,
                "changes": log.changes,
                "metadata": log.metadata,
                "ip_address": log.ip_address,
                "user_agent": log.user_agent,
                "role": log.role,
                "school": log.school.name if log.school else None,
                "timestamp": log.timestamp.isoformat(),
            }
            for log in results
        ]
        if page is not None:
            return self.get_paginated_response(data)
        return Response({"count": len(data), "results": data})
