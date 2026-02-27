"""
Custom DRF permission classes for EduConnect.
All role checks compare against the User.Role TextChoices enum values.
"""

from rest_framework.exceptions import NotFound
from rest_framework.permissions import BasePermission


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
    """Allow access only to ADMIN or SECTION_ADMIN roles."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("ADMIN", "SECTION_ADMIN")
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
    """Allow access to ADMIN, SECTION_ADMIN, or TEACHER roles."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("ADMIN", "SECTION_ADMIN", "TEACHER")
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
