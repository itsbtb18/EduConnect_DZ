"""
Custom permission classes for EduConnect API.
"""

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to admin users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class IsTeacher(BasePermission):
    """Allow access only to teacher users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "teacher"
        )


class IsStudent(BasePermission):
    """Allow access only to student users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "student"
        )


class IsParent(BasePermission):
    """Allow access only to parent users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "parent"
        )


class IsSuperAdmin(BasePermission):
    """Allow access only to super admin (platform operator)."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "superadmin"
        )


class IsAdminOrTeacher(BasePermission):
    """Allow access to admin or teacher users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("admin", "teacher")
        )


class IsAdminOrReadOnly(BasePermission):
    """Allow full access to admins, read-only for others."""

    def has_permission(self, request, view):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "admin"
        )


class BelongsToSameSchool(BasePermission):
    """Ensure user can only access data from their own school (tenant isolation)."""

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "school_id"):
            return obj.school_id == request.user.school_id
        if hasattr(obj, "school"):
            return obj.school_id == request.user.school_id
        return True
