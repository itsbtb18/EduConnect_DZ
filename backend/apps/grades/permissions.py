"""
╔══════════════════════════════════════════════════════════════════════════╗
║  Grades — Custom DRF permission classes                                ║
║                                                                        ║
║  IsTeacherOfClassroom      — teacher must be assigned to the class     ║
║  IsAdminOrTeacherOfClassroom — ADMIN/SECTION_ADMIN OR assigned teacher ║
║  IsAdminOnly               — ADMIN / SECTION_ADMIN / SUPER_ADMIN only  ║
║  IsNotLocked               — trimester must not be locked              ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

import logging

from rest_framework.permissions import BasePermission

logger = logging.getLogger(__name__)


def _get_classroom_id(request, view):
    """
    Resolve the classroom UUID from the request.
    Looks in: request.data, query_params, then the view object itself.
    """
    return (
        request.data.get("classroom_id")
        or request.data.get("classroom")
        or request.query_params.get("classroom_id")
        or request.query_params.get("classroom")
        or getattr(view, "_classroom_id", None)
    )


def _get_exam_type_classroom_id(request):
    """
    If the request contains an exam_type_id, resolve its classroom_id.
    """
    et_id = request.data.get("exam_type_id") or request.data.get("exam_type")
    if not et_id:
        return None
    try:
        from apps.grades.models import ExamType

        return str(
            ExamType.objects.values_list("classroom_id", flat=True).get(pk=et_id)
        )
    except Exception:
        return None


def _is_teacher_of_classroom(user, classroom_id):
    """Check if the user (TEACHER) is assigned to teach in the given classroom."""
    if not classroom_id:
        return False
    from apps.academics.models import TeacherAssignment

    return TeacherAssignment.objects.filter(
        teacher=user,
        assigned_class_id=classroom_id,
    ).exists()


class IsTeacherOfClassroom(BasePermission):
    """
    L'enseignant doit être assigné à la classe concernée.
    Admins (ADMIN / SECTION_ADMIN / SUPER_ADMIN) passent automatiquement.
    """

    message = "Vous n'êtes pas enseignant dans cette classe."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Admins always pass
        if user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN"):
            return True

        if user.role != "TEACHER":
            return False

        classroom_id = _get_classroom_id(request, view) or _get_exam_type_classroom_id(
            request
        )
        return _is_teacher_of_classroom(user, classroom_id)


class IsAdminOrTeacherOfClassroom(BasePermission):
    """
    Admin de l'école (ADMIN / SECTION_ADMIN / SUPER_ADMIN)
    OU enseignant assigné à la classe.
    """

    message = "Vous devez être administrateur ou enseignant de cette classe."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        if user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN"):
            return True

        if user.role == "TEACHER":
            classroom_id = _get_classroom_id(
                request, view
            ) or _get_exam_type_classroom_id(request)
            return _is_teacher_of_classroom(user, classroom_id)

        return False


class IsAdminOnly(BasePermission):
    """
    Uniquement ADMIN / SECTION_ADMIN / SUPER_ADMIN.
    Les enseignants n'ont pas accès.
    """

    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("SUPER_ADMIN", "ADMIN", "SECTION_ADMIN")
        )


class IsNotLocked(BasePermission):
    """
    Vérifier que le trimestre n'est pas verrouillé avant toute modification.
    Résout le classroom_id + trimester depuis la requête et vérifie is_locked
    sur TrimesterAverage.
    """

    message = "Ce trimestre est verrouillé. Aucune modification n'est autorisée."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False

        # Read-only methods always pass
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True

        classroom_id = _get_classroom_id(request, view) or _get_exam_type_classroom_id(
            request
        )
        trimester = request.data.get("trimester") or request.query_params.get(
            "trimester"
        )

        if not classroom_id or not trimester:
            # Can't determine lock status — let the view handle it
            return True

        from apps.grades.models import TrimesterAverage

        return not TrimesterAverage.objects.filter(
            classroom_id=classroom_id,
            trimester=int(trimester),
            is_locked=True,
        ).exists()
