"""
Security middleware for ILMI:
- JWT scope enforcement
- Read-only role enforcement
- Audit logging for access denied
- Supervisor read-only mode
"""

import json
import logging

from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class ScopeEnforcementMiddleware(MiddlewareMixin):
    """
    Middleware that checks JWT scopes against endpoint requirements.
    Each view can declare required scopes via `required_scopes` attribute.
    If the token doesn't have the required scope, return 403.
    """

    def process_view(self, request, view_func, view_args, view_kwargs):
        # Skip for unauthenticated or non-API requests
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return None

        # Get view class if it's a class-based view
        view_cls = getattr(view_func, "cls", None) or getattr(
            view_func, "view_class", None
        )
        if not view_cls:
            return None

        required_scopes = getattr(view_cls, "required_scopes", None)
        if not required_scopes:
            return None

        # Get user's scopes from JWT claims or role mapping
        from apps.accounts.models_security import ROLE_SCOPES

        user_scopes = set(ROLE_SCOPES.get(request.user.role, []))

        # Check if user has at least one required scope
        if isinstance(required_scopes, str):
            required_scopes = [required_scopes]

        if not user_scopes.intersection(set(required_scopes)):
            from apps.accounts.security import log_audit

            log_audit(
                action="ACCESS_DENIED",
                request=request,
                metadata={
                    "reason": "insufficient_scope",
                    "required": required_scopes,
                    "path": request.path,
                },
            )
            return JsonResponse(
                {"detail": "Accès non autorisé."},
                status=403,
            )

        return None


class ReadOnlyRoleMiddleware(MiddlewareMixin):
    """
    Blocks all write operations (POST/PUT/PATCH/DELETE) for read-only roles
    (e.g., GENERAL_SUPERVISOR).
    Returns 403 without even reaching the view.
    """

    WRITE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    # Paths that read-only users CAN write to (auth endpoints)
    EXEMPT_PATHS = {
        "/api/v1/auth/login/",
        "/api/v1/auth/logout/",
        "/api/v1/auth/refresh/",
        "/api/v1/auth/change-password/",
        "/api/v1/auth/verify-otp/",
        "/api/v1/auth/verify-totp/",
    }

    def process_request(self, request):
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return None

        if request.method not in self.WRITE_METHODS:
            return None

        from apps.accounts.models_security import READ_ONLY_ROLES

        if request.user.role not in READ_ONLY_ROLES:
            return None

        # Check exempt paths
        if request.path in self.EXEMPT_PATHS:
            return None

        from apps.accounts.security import log_audit

        log_audit(
            action="ACCESS_DENIED",
            request=request,
            metadata={
                "reason": "read_only_role",
                "method": request.method,
                "path": request.path,
            },
        )
        return JsonResponse(
            {"detail": "Votre rôle ne permet que la consultation (lecture seule)."},
            status=403,
        )


class AuditAccessDeniedMiddleware(MiddlewareMixin):
    """
    Logs all 403 responses to the audit trail for security monitoring.
    """

    def process_response(self, request, response):
        if response.status_code == 403:
            user = getattr(request, "user", None)
            if user and getattr(user, "is_authenticated", False):
                from apps.accounts.security import log_audit

                log_audit(
                    action="ACCESS_DENIED",
                    request=request,
                    metadata={
                        "path": request.path,
                        "method": request.method,
                        "status": 403,
                    },
                )
        return response


class IPWhitelistMiddleware(MiddlewareMixin):
    """
    For SUPER_ADMIN users, verify their IP is in the whitelist.
    If no whitelist entries exist, allow all IPs (initial setup).
    """

    def process_view(self, request, view_func, view_args, view_kwargs):
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return None

        if request.user.role != "SUPER_ADMIN":
            return None

        from apps.accounts.models_security import IPWhitelist
        from apps.accounts.security import get_client_ip

        # If no whitelist entries exist, allow all (first-time setup)
        if not IPWhitelist.objects.filter(is_active=True).exists():
            return None

        client_ip = get_client_ip(request)
        if not IPWhitelist.objects.filter(
            ip_address=client_ip, is_active=True
        ).exists():
            from apps.accounts.security import log_audit

            log_audit(
                action="ACCESS_DENIED",
                request=request,
                metadata={
                    "reason": "ip_not_whitelisted",
                    "ip": client_ip,
                },
            )
            return JsonResponse(
                {"detail": "Accès refusé depuis cette adresse IP."},
                status=403,
            )

        return None
