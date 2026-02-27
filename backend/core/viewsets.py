"""
Tenant-aware base viewset for EduConnect.
All API viewsets that serve tenant-scoped data should inherit from
TenantAwareViewSet instead of ModelViewSet.
"""

from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied


class TenantAwareViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet that enforces multi-tenant isolation.

    Behaviour
    ---------
    * ``get_queryset()`` — automatically filters by ``request.user.school``
      (SUPER_ADMIN sees everything).
    * ``perform_create()`` — stamps ``school`` and ``created_by`` from the
      current request user.
    * ``perform_update()`` — stamps ``updated_by`` (if the field exists on the
      model).
    * ``get_school()`` — helper that returns the user's school or raises
      ``PermissionDenied``.

    Never trust a client-sent ``school_id`` — the school is *always* derived
    from the authenticated user.
    """

    def get_school(self):
        """
        Return the school of the current user.
        Raises PermissionDenied if the user has no school (unless SUPER_ADMIN).
        """
        user = self.request.user
        if user.school is None:
            raise PermissionDenied("You are not associated with any school.")
        return user.school

    def get_queryset(self):
        """
        If the user is a SUPER_ADMIN return the full queryset,
        otherwise scope it to the user's school.
        """
        qs = super().get_queryset()

        user = self.request.user
        if not user.is_authenticated:
            return qs.none()

        if user.role == user.Role.SUPER_ADMIN:
            return qs

        # Regular users — must belong to a school
        school = self.get_school()
        return qs.filter(school=school)

    def perform_create(self, serializer):
        """Set school and created_by automatically on create."""
        user = self.request.user
        kwargs = {}

        # Assign school (SUPER_ADMIN may not have one)
        if user.role != user.Role.SUPER_ADMIN:
            kwargs["school"] = self.get_school()

        kwargs["created_by"] = user
        serializer.save(**kwargs)

    def perform_update(self, serializer):
        """
        Stamp updated_by if the model has that field.
        Does *not* override school — school is immutable after creation.
        """
        kwargs = {}
        model = serializer.Meta.model if hasattr(serializer, "Meta") else None
        if model and hasattr(model, "updated_by"):
            kwargs["updated_by"] = self.request.user
        serializer.save(**kwargs)
