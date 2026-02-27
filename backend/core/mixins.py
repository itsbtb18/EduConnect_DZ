"""
Reusable mixins for EduConnect views and viewsets.
"""

from rest_framework import viewsets


class TenantAwareViewSetMixin:
    """
    Mixin for ViewSets that automatically scopes queries to the current
    user's school (tenant). Every single API query is automatically filtered
    by the authenticated user's school_id.

    Usage:
        class MyViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
            serializer_class = MySerializer
            model = MyModel
    """

    def get_queryset(self):
        """Filter queryset to the current user's school."""
        model = getattr(self, "model", None)
        if model is None:
            # Fallback: try to get model from serializer_class
            serializer_class = self.get_serializer_class()
            model = serializer_class.Meta.model
        return model.objects.filter(school=self.request.user.school)

    def perform_create(self, serializer):
        """Auto-assign the current user's school when creating records."""
        serializer.save(school=self.request.user.school)


class TenantAwareModelViewSet(TenantAwareViewSetMixin, viewsets.ModelViewSet):
    """
    Complete tenant-aware ModelViewSet.
    Combines TenantAwareViewSetMixin with ModelViewSet.

    Usage:
        class LevelViewSet(TenantAwareModelViewSet):
            serializer_class = LevelSerializer
            permission_classes = [IsAuthenticated, IsAdmin]
    """

    pass


class TenantAwareReadOnlyViewSet(
    TenantAwareViewSetMixin, viewsets.ReadOnlyModelViewSet
):
    """Tenant-aware read-only viewset."""

    pass


class TeacherOwnedMixin:
    """
    Mixin for ViewSets where the teacher owns the objects they create.
    Automatically assigns the requesting teacher as the owner.
    """

    def perform_create(self, serializer):
        serializer.save(
            school=self.request.user.school,
            teacher=self.request.user,
        )

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == "teacher":
            return qs.filter(teacher=self.request.user)
        return qs


class StudentFilterMixin:
    """
    Mixin that filters data based on the user's role:
    - Students see only their own data
    - Parents see their children's data
    - Teachers see their assigned class data
    - Admins see everything in their school
    """

    student_field = "student"

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user

        if user.role == "student":
            return qs.filter(**{self.student_field: user})
        elif user.role == "parent":
            children = user.parent_profile.children.all()
            return qs.filter(**{f"{self.student_field}__in": children})
        elif user.role == "teacher":
            # Teachers see data for students in their assigned classrooms
            assigned_classrooms = user.teaching_assignments.values_list(
                "classroom_id", flat=True
            )
            return qs.filter(
                **{
                    f"{self.student_field}__student_profile__classroom__in": assigned_classrooms
                }
            )
        # Admin sees all
        return qs
