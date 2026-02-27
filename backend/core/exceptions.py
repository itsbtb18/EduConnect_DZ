"""
Custom exception handler and exception classes for EduConnect API.
Provides consistent error response format across all endpoints.
"""

from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """
    Custom exception handler that wraps all errors in a consistent format:
    {
        "error": True,
        "message": "...",
        "details": {...},
        "status_code": 400
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "error": True,
            "status_code": response.status_code,
            "message": _get_error_message(response),
            "details": response.data
            if isinstance(response.data, dict)
            else {"detail": response.data},
        }
        response.data = custom_data

    return response


def _get_error_message(response):
    """Extract a human-readable error message from the response."""
    if isinstance(response.data, dict):
        if "detail" in response.data:
            return str(response.data["detail"])
        # Return first field error
        for field, errors in response.data.items():
            if isinstance(errors, list) and errors:
                return f"{field}: {errors[0]}"
            elif isinstance(errors, str):
                return f"{field}: {errors}"
    if isinstance(response.data, list) and response.data:
        return str(response.data[0])
    return "An error occurred."


class TenantAccessDenied(APIException):
    """Raised when a user attempts to access data outside their school tenant."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "You do not have access to this school's data."
    default_code = "tenant_access_denied"


class SubscriptionExpired(APIException):
    """Raised when a school's subscription has expired."""

    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = (
        "Your school's subscription has expired. Please contact the administrator."
    )
    default_code = "subscription_expired"


class AccountLocked(APIException):
    """Raised when a user account is locked due to failed login attempts."""

    status_code = status.HTTP_423_LOCKED
    default_detail = (
        "Account is locked due to too many failed login attempts. Try again later."
    )
    default_code = "account_locked"


class GradeNotPublished(APIException):
    """Raised when trying to access unpublished grades."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "These grades have not been published yet."
    default_code = "grade_not_published"


class FeatureNotAvailable(APIException):
    """Raised when accessing a feature not included in the school's plan."""

    status_code = status.HTTP_403_FORBIDDEN
    default_detail = "This feature is not available in your current subscription plan."
    default_code = "feature_not_available"


class BulkImportError(APIException):
    """Raised when a bulk import operation encounters errors."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = "Errors encountered during bulk import."
    default_code = "bulk_import_error"
