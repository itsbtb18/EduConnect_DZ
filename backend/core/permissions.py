"""
Custom DRF permission classes for ILMI.
All role checks compare against the User.Role TextChoices enum values.
"""

import functools
import logging

from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import BasePermission

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Role-based permissions
# ---------------------------------------------------------------------------


class IsSuperAdmin(BasePermission):
    """Allow access only to SUPER_ADMIN users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "SUPER_ADMIN"
        )


class IsSchoolAdmin(BasePermission):
    """Allow access to SUPER_ADMIN, ADMIN, or SECTION_ADMIN roles."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN")
        )


class IsTeacher(BasePermission):
    """Allow access only to TEACHER role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "TEACHER"
        )


class IsParent(BasePermission):
    """Allow access only to PARENT role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "PARENT"
        )


class IsStudent(BasePermission):
    """Allow access only to STUDENT role."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "STUDENT"
        )


class IsAdminOrTeacher(BasePermission):
    """Allow access to SUPER_ADMIN, ADMIN, SECTION_ADMIN, or TEACHER roles."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role
            in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN", "TEACHER")
        )


# ---------------------------------------------------------------------------
# Object-level / tenant isolation
# ---------------------------------------------------------------------------


class IsSameSchool(BasePermission):
    """
    Checks that the object's school matches request.user.school.
    Returns 404 (not 403) on mismatch so we don't leak the existence of
    resources belonging to other schools.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user

        # SUPER_ADMIN can access any school's data
        if user.role == "SUPER_ADMIN":
            return True

        obj_school_id = None
        if hasattr(obj, "school_id"):
            obj_school_id = obj.school_id
        elif hasattr(obj, "school"):
            obj_school_id = getattr(obj.school, "id", None)

        if obj_school_id is None:
            # Object has no school relation — allow
            return True

        if obj_school_id != user.school_id:
            # Raise 404 instead of 403 to avoid leaking info
            raise NotFound()

        return True


# ---------------------------------------------------------------------------
# Module-based permissions
# ---------------------------------------------------------------------------


def _check_module_active(user, module_slug: str) -> bool:
    """
    Check if a module is active for the user's school.
    Returns True for SUPER_ADMIN (bypass).
    Returns False if no school or no subscription.
    """
    if not user or not user.is_authenticated:
        return False

    if user.role == "SUPER_ADMIN":
        return True

    school = getattr(user, "school", None)
    if not school:
        return False

    try:
        subscription = school.subscription
    except Exception:
        # No SchoolSubscription exists yet
        return False

    if not subscription.is_active:
        return False

    return subscription.is_module_active(module_slug)


class IsModuleActive(BasePermission):
    """
    DRF permission class that checks if a module is activated for
    the request user's school.

    Usage:
        class MyViewSet(viewsets.ModelViewSet):
            permission_classes = [IsAuthenticated, IsModuleActive]
            module_name = 'cantine'
    """

    message = (
        "Module non activé. Contactez votre administrateur ILMI pour activer ce module."
    )

    def has_permission(self, request, view):
        module_slug = getattr(view, "module_name", None)
        if not module_slug:
            return True  # No module restriction
        return _check_module_active(request.user, module_slug)


def require_module(module_slug: str):
    """
    Class decorator for ViewSets / APIViews.
    Sets module_name on the class and injects IsModuleActive into
    permission_classes automatically.

    Usage:
        @require_module('cantine')
        class MenuListCreateView(APIView):
            permission_classes = [IsAuthenticated, IsSchoolAdmin]
            ...

    SUPER_ADMIN bypasses the check.
    Returns 403 with "Module non activé" message if the module is not active.
    """

    def decorator(cls):
        cls.module_name = module_slug

        original_check = getattr(cls, "check_permissions", None)

        @functools.wraps(original_check)
        def check_permissions(self, request):
            # Check module activation first
            if not _check_module_active(request.user, module_slug):
                raise PermissionDenied(
                    detail="Module non activé. Contactez votre administrateur ILMI pour activer ce module."
                )
            # Call original permission checks
            if original_check:
                original_check(request)

        cls.check_permissions = check_permissions
        return cls

    return decorator
