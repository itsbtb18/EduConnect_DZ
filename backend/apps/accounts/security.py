"""
Security utilities: audit logging, device fingerprinting, OTP, lockout checks.
"""

import hashlib
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Client IP extraction
# ---------------------------------------------------------------------------


def get_client_ip(request):
    """Extract the real client IP, respecting X-Forwarded-For."""
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


# ---------------------------------------------------------------------------
# Device fingerprinting
# ---------------------------------------------------------------------------


def compute_device_fingerprint(request):
    """
    Compute a SHA-256 fingerprint from request attributes.
    Uses: user-agent, accept-language, custom device header.
    """
    ua = request.META.get("HTTP_USER_AGENT", "")
    lang = request.META.get("HTTP_ACCEPT_LANGUAGE", "")
    # Mobile apps send a custom header with device-specific info
    device_id = request.META.get("HTTP_X_DEVICE_ID", "")

    raw = f"{ua}|{lang}|{device_id}"
    return hashlib.sha256(raw.encode()).hexdigest()


def get_device_info(request):
    """Extract human-readable device info from request."""
    ua = request.META.get("HTTP_USER_AGENT", "")
    device_name = request.META.get("HTTP_X_DEVICE_NAME", ua[:100])
    device_os = request.META.get("HTTP_X_DEVICE_OS", "")
    return {"device_name": device_name, "device_os": device_os}


def is_trusted_device(user, fingerprint):
    """Check if a device fingerprint is trusted for this user."""
    from .models_security import TrustedDevice

    return TrustedDevice.objects.filter(
        user=user,
        device_fingerprint=fingerprint,
        is_revoked=False,
    ).exists()


def register_trusted_device(user, fingerprint, request):
    """Register a new trusted device after OTP validation."""
    from .models_security import TrustedDevice

    info = get_device_info(request)
    device, created = TrustedDevice.objects.update_or_create(
        user=user,
        device_fingerprint=fingerprint,
        defaults={
            "device_name": info["device_name"],
            "device_os": info["device_os"],
            "last_ip": get_client_ip(request),
            "is_revoked": False,
        },
    )
    return device


# ---------------------------------------------------------------------------
# Login attempt tracking & lockout
# ---------------------------------------------------------------------------

LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_SECONDS = 30 * 60  # 30 minutes


def _lockout_key(phone_number):
    return f"login_lockout:{phone_number}"


def _attempt_key(phone_number):
    return f"login_attempts:{phone_number}"


def is_account_locked(phone_number):
    """Check if account is locked due to failed attempts."""
    return cache.get(_lockout_key(phone_number)) is not None


def get_remaining_attempts(phone_number):
    """Return how many attempts remain before lockout."""
    attempts = cache.get(_attempt_key(phone_number), 0)
    return max(0, LOGIN_MAX_ATTEMPTS - attempts)


def get_lockout_remaining_seconds(phone_number):
    """Return seconds remaining in lockout, or 0 if not locked."""
    ttl = cache.ttl(_lockout_key(phone_number))
    if ttl is None or ttl < 0:
        return 0
    return ttl


def record_login_attempt(phone_number, request, success, failure_reason=""):
    """Record a login attempt and handle lockout."""
    from .models_security import LoginAttempt

    LoginAttempt.objects.create(
        phone_number=phone_number,
        ip_address=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
        success=success,
        failure_reason=failure_reason,
    )

    if success:
        # Clear failed attempts on success
        cache.delete(_attempt_key(phone_number))
        cache.delete(_lockout_key(phone_number))
    else:
        # Increment failed attempts
        attempt_key = _attempt_key(phone_number)
        attempts = cache.get(attempt_key, 0) + 1
        cache.set(attempt_key, attempts, timeout=LOGIN_LOCKOUT_SECONDS)

        if attempts >= LOGIN_MAX_ATTEMPTS:
            cache.set(
                _lockout_key(phone_number),
                True,
                timeout=LOGIN_LOCKOUT_SECONDS,
            )
            log_audit(
                action="ACCOUNT_LOCKED",
                request=request,
                metadata={
                    "phone_number": phone_number,
                    "reason": "too_many_failed_attempts",
                },
            )


# ---------------------------------------------------------------------------
# OTP generation & verification
# ---------------------------------------------------------------------------

OTP_EXPIRY_SECONDS = 300  # 5 minutes
OTP_MAX_ATTEMPTS = 3


def generate_otp(user, purpose, device_fingerprint=""):
    """Generate a 6-digit OTP and store it."""
    from .models_security import OTPVerification

    # Invalidate previous codes for same purpose
    OTPVerification.objects.filter(
        user=user,
        purpose=purpose,
        is_used=False,
    ).update(is_used=True)

    code = f"{secrets.randbelow(1000000):06d}"
    otp = OTPVerification.objects.create(
        user=user,
        code=code,
        purpose=purpose,
        device_fingerprint=device_fingerprint,
        expires_at=timezone.now() + timedelta(seconds=OTP_EXPIRY_SECONDS),
    )
    return code


def verify_otp(user, code, purpose):
    """Verify an OTP code. Returns True on success."""
    from .models_security import OTPVerification

    otp = (
        OTPVerification.objects.filter(
            user=user,
            purpose=purpose,
            is_used=False,
        )
        .order_by("-created_at")
        .first()
    )

    if not otp:
        return False

    if otp.is_expired:
        return False

    if otp.attempts >= OTP_MAX_ATTEMPTS:
        otp.is_used = True
        otp.save(update_fields=["is_used"])
        return False

    if otp.code != code:
        otp.attempts += 1
        otp.save(update_fields=["attempts"])
        return False

    # Success
    otp.is_used = True
    otp.save(update_fields=["is_used"])
    return True


# ---------------------------------------------------------------------------
# TOTP (Google Authenticator)
# ---------------------------------------------------------------------------


def setup_totp(user):
    """Create a TOTP device for a user. Returns provisioning URI."""
    import pyotp

    from .models_security import TOTPDevice

    secret = pyotp.random_base32()
    TOTPDevice.objects.update_or_create(
        user=user,
        defaults={"secret": secret, "is_confirmed": False},
    )
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(
        name=user.phone_number,
        issuer_name="ILMI",
    )


def verify_totp(user, code):
    """Verify a TOTP code for a user. Returns True on success."""
    import pyotp

    from .models_security import TOTPDevice

    try:
        device = TOTPDevice.objects.get(user=user)
    except TOTPDevice.DoesNotExist:
        return False

    totp = pyotp.TOTP(device.secret)
    if totp.verify(code, valid_window=1):
        if not device.is_confirmed:
            device.is_confirmed = True
            device.save(update_fields=["is_confirmed"])
        return True
    return False


# ---------------------------------------------------------------------------
# Audit logging
# ---------------------------------------------------------------------------


def log_audit(
    action,
    request=None,
    user=None,
    model_name="",
    object_id="",
    changes=None,
    metadata=None,
    school=None,
):
    """
    Create an immutable audit log entry.
    Can be called from views, signals, or middleware.
    """
    from .models_security import AuditLog

    if request and not user:
        user = getattr(request, "user", None)
        if user and not user.is_authenticated:
            user = None

    ip = get_client_ip(request) if request else None
    ua = request.META.get("HTTP_USER_AGENT", "")[:500] if request else ""
    role = getattr(user, "role", "") if user else ""

    if not school and user:
        school = getattr(user, "school", None)

    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=str(object_id) if object_id else "",
            changes=changes,
            metadata=metadata,
            ip_address=ip,
            user_agent=ua,
            school=school,
            role=role,
        )
    except Exception:
        logger.exception("Failed to write audit log")


def log_model_change(action, instance, user=None, request=None, changes=None):
    """Helper to log a model create/update/delete."""
    log_audit(
        action=action,
        request=request,
        user=user,
        model_name=instance.__class__.__name__,
        object_id=str(instance.pk) if instance.pk else "",
        changes=changes,
        school=getattr(instance, "school", None),
    )


# ---------------------------------------------------------------------------
# Session management
# ---------------------------------------------------------------------------


def create_session(user, refresh_token_jti, request, device=None, expires_at=None):
    """Create an active session record."""
    from .models_security import ActiveSession, ROLE_REFRESH_LIFETIMES

    if not expires_at:
        lifetime = ROLE_REFRESH_LIFETIMES.get(user.role, 30 * 86400)
        expires_at = timezone.now() + timedelta(seconds=lifetime)

    return ActiveSession.objects.create(
        user=user,
        refresh_token_jti=refresh_token_jti,
        device=device,
        ip_address=get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
        expires_at=expires_at,
    )


def revoke_session(session_id):
    """Revoke a specific session."""
    from .models_security import ActiveSession

    ActiveSession.objects.filter(id=session_id).update(is_revoked=True)


def revoke_all_sessions(user, except_jti=None):
    """Revoke all sessions for a user, optionally keeping one."""
    from .models_security import ActiveSession

    qs = ActiveSession.objects.filter(user=user, is_revoked=False)
    if except_jti:
        qs = qs.exclude(refresh_token_jti=except_jti)
    qs.update(is_revoked=True)


def detect_token_reuse(jti):
    """
    Detect refresh token reuse (stolen token scenario).
    If a JTI is used but its session is already revoked,
    revoke ALL sessions for that user (security breach).
    Returns True if reuse was detected.
    """
    from .models_security import ActiveSession

    try:
        session = ActiveSession.objects.select_related("user").get(
            refresh_token_jti=jti
        )
    except ActiveSession.DoesNotExist:
        return False

    if session.is_revoked:
        # Token reuse detected! Revoke everything.
        logger.warning(
            "Refresh token reuse detected for user %s (JTI: %s). "
            "Revoking all sessions.",
            session.user,
            jti,
        )
        revoke_all_sessions(session.user)
        log_audit(
            action="SESSION_REVOKED",
            user=session.user,
            metadata={
                "reason": "refresh_token_reuse_detected",
                "jti": jti,
            },
        )
        return True

    return False
