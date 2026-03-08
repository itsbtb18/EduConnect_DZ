"""
╔══════════════════════════════════════════════════════════════════════════╗
║  Grade Calculation Services for ILMI                                   ║
║  All averages are computed server-side — NEVER on the client.          ║
║                                                                        ║
║  Formulas (Algerian school system):                                    ║
║    subject_avg   = Σ(score_normalised_20 × percentage) / Σ(percentage) ║
║    trimester_avg = Σ(subject_avg × coefficient) / Σ(coefficients)      ║
║    annual_avg    = (T1 + T2 + T3) / 3                                  ║
║                                                                        ║
║  Public API:                                                           ║
║    1. calculate_subject_average   (single student/subject/trimester)   ║
║    2. calculate_trimester_average (single student/trimester)           ║
║    3. calculate_rankings          (4-level dense ranking)              ║
║    4. recalculate_cascade         (atomic: subj → trim → rank → ann)  ║
║    5. admin_override_average      (manual override + audit log)        ║
║    6. lock_trimester / unlock_trimester                                ║
║    7. recalculate_classroom_trimester  (bulk for a whole class)        ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import logging
from decimal import ROUND_HALF_UP, Decimal
from typing import Optional

from django.db import transaction
from django.db.models import QuerySet
from django.utils import timezone

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════
# CUSTOM EXCEPTIONS
# ═══════════════════════════════════════════════════════════════════════════


class LockedException(Exception):
    """Raised when trying to modify a locked average record."""


class PermissionDeniedException(Exception):
    """Raised when user doesn't have the required role."""


# ═══════════════════════════════════════════════════════════════════════════
# 1. SUBJECT AVERAGE — weighted exam scores for one subject/trimester
# ═══════════════════════════════════════════════════════════════════════════


def calculate_subject_average(
    student_id,
    subject_id,
    classroom_id,
    academic_year_id,
    trimester: int,
    *,
    save: bool = True,
) -> Optional[Decimal]:
    """
    Compute and optionally persist the SubjectAverage for one student/subject/trimester.

    Formule : Σ(score_examen × percentage_examen / 100)

    Exemple :
    - Examen 1 : score=14, percentage=60% → 14 × 0.60 = 8.4
    - Examen 2 : score=16, percentage=20% → 16 × 0.20 = 3.2
    - Contrôle  : score=18, percentage=20% → 18 × 0.20 = 3.6
    - Moyenne matière = 8.4 + 3.2 + 3.6 = 15.2 / 20

    Règles :
    - Si un examen n'a pas de note (null) → ne pas l'inclure dans le calcul
      et redistribuer son pourcentage (calcul sur les examens disponibles)
    - Si is_absent=True → score = 0
    - Arrondir à 2 décimales
    - Mettre à jour SubjectAverage.calculated_average
    - Si SubjectAverage.is_locked=True → lever LockedException

    Args:
        student_id:       UUID or StudentProfile instance
        subject_id:       UUID or academics.Subject instance
        classroom_id:     UUID or academics.Class instance
        academic_year_id: UUID or schools.AcademicYear instance
        trimester:        1, 2, or 3
        save:             if True, upsert the SubjectAverage row

    Returns:
        Decimal average on /20 scale, or None if no grades exist.
    """
    from apps.academics.models import Class as Classroom
    from apps.academics.models import StudentProfile, Subject
    from apps.grades.models import ExamType, Grade, SubjectAverage
    from apps.schools.models import AcademicYear

    # ── Resolve entities (accept both UUID strings and model instances) ──
    student = _resolve(student_id, StudentProfile)
    subject = _resolve(subject_id, Subject)
    classroom = _resolve(classroom_id, Classroom)
    academic_year = _resolve(academic_year_id, AcademicYear)

    # ── Check lock ──────────────────────────────────────────────────────
    existing = SubjectAverage.objects.filter(
        student=student,
        subject=subject,
        classroom=classroom,
        academic_year=academic_year,
        trimester=trimester,
    ).first()
    if existing and existing.is_locked:
        raise LockedException(
            f"SubjectAverage verrouillée pour {student} — {subject.name} T{trimester}. "
            "Déverrouillez d'abord pour recalculer."
        )

    # ── Fetch exam types for this combo ─────────────────────────────────
    exam_types = ExamType.objects.filter(
        subject=subject,
        classroom=classroom,
        academic_year=academic_year,
        trimester=trimester,
    )

    if not exam_types.exists():
        logger.debug(
            "No ExamType found for %s / %s / T%s — skipping",
            classroom,
            subject,
            trimester,
        )
        return None

    weighted_sum = Decimal("0")
    total_percentage = Decimal("0")

    for et in exam_types:
        grade = Grade.objects.filter(student=student, exam_type=et).first()

        if grade is None:
            # No grade entered yet for this exam type — skip it
            # (its percentage is redistributed automatically since we
            #  divide by total_percentage of available exams)
            continue

        effective = grade.effective_score  # 0 if absent, score otherwise
        if effective is None:
            continue

        # Normalise to /20 scale
        if et.max_score and et.max_score > 0:
            normalised = Decimal(str(effective)) * Decimal("20") / et.max_score
        else:
            normalised = Decimal(str(effective))

        weighted_sum += normalised * et.percentage
        total_percentage += et.percentage

    if total_percentage == 0:
        return None

    # Re-normalise: if only 60% of exams are available, scale to that
    # weighted_sum holds Σ(normalised_score × percentage)
    # total_percentage holds Σ(percentage of available exams)
    # Average = weighted_sum / total_percentage  (not /100, because we
    # redistribute the missing percentage across available exams)
    calculated = (weighted_sum / total_percentage).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    if save and calculated is not None:
        SubjectAverage.objects.update_or_create(
            student=student,
            subject=subject,
            classroom=classroom,
            academic_year=academic_year,
            trimester=trimester,
            defaults={
                "calculated_average": calculated,
                "last_calculated_at": timezone.now(),
            },
        )
        logger.debug(
            "SubjectAverage saved: %s / %s / T%s = %s",
            student,
            subject.name,
            trimester,
            calculated,
        )

    return calculated


# ═══════════════════════════════════════════════════════════════════════════
# 2. TRIMESTER AVERAGE — coefficient-weighted subject averages
# ═══════════════════════════════════════════════════════════════════════════


def calculate_trimester_average(
    student_id,
    classroom_id,
    academic_year_id,
    trimester: int,
    *,
    save: bool = True,
) -> Optional[Decimal]:
    """
    Formule : Σ(moyenne_matiere × coeff_matiere) ÷ Σ(coefficients)

    Utilise SubjectAverage.effective_average pour chaque matière
    (effective_average = manual_override si défini, sinon calculated_average).

    Règles :
    - Ne compter que les matières qui ont une SubjectAverage calculée
    - Calculer l'appréciation automatique :
        >= 18 → "Excellent"
        >= 16 → "Très Bien"
        >= 14 → "Bien"
        >= 12 → "Assez Bien"
        >= 10 → "Passable"
        < 10  → "Insuffisant"
    - Si TrimesterAverage.is_locked=True → lever LockedException

    Returns:
        Decimal average on /20, or None if no subject averages exist.
    """
    from apps.academics.models import Class as Classroom
    from apps.academics.models import StudentProfile
    from apps.grades.models import SubjectAverage, TrimesterAverage
    from apps.schools.models import AcademicYear

    student = _resolve(student_id, StudentProfile)
    classroom = _resolve(classroom_id, Classroom)
    academic_year = _resolve(academic_year_id, AcademicYear)

    # ── Check lock ──────────────────────────────────────────────────────
    existing = TrimesterAverage.objects.filter(
        student=student,
        classroom=classroom,
        academic_year=academic_year,
        trimester=trimester,
    ).first()
    if existing and existing.is_locked:
        raise LockedException(
            f"TrimesterAverage verrouillée pour {student} T{trimester}. "
            "Déverrouillez d'abord pour recalculer."
        )

    # ── Gather subject averages ─────────────────────────────────────────
    subject_averages = SubjectAverage.objects.filter(
        student=student,
        classroom=classroom,
        academic_year=academic_year,
        trimester=trimester,
    ).select_related("subject")

    if not subject_averages.exists():
        return None

    numerator = Decimal("0")
    denominator = Decimal("0")

    for sa in subject_averages:
        avg = sa.effective_average
        if avg is None:
            continue

        coeff = _get_coefficient(classroom, sa.subject)
        numerator += avg * coeff
        denominator += coeff

    if denominator == 0:
        return None

    calculated = (numerator / denominator).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )

    if save:
        obj, _ = TrimesterAverage.objects.update_or_create(
            student=student,
            classroom=classroom,
            academic_year=academic_year,
            trimester=trimester,
            defaults={
                "calculated_average": calculated,
            },
        )
        # Auto-compute appreciation
        obj.compute_appreciation()
        obj.save(update_fields=["appreciation"])
        logger.debug(
            "TrimesterAverage saved: %s T%s = %s (%s)",
            student,
            trimester,
            calculated,
            obj.appreciation,
        )

    return calculated


# ═══════════════════════════════════════════════════════════════════════════
# 3. RANKINGS — 4-level dense ranking
# ═══════════════════════════════════════════════════════════════════════════


def calculate_rankings(
    classroom_id,
    academic_year_id,
    trimester: int,
) -> None:
    """
    Calculer et mettre à jour les 4 classements pour tous les élèves :

    1. rank_in_class   — parmi les élèves de la même classe
    2. rank_in_stream  — parmi tous les élèves de la même filière
       (ex: tous les 2AS Sciences de l'école)
    3. rank_in_level   — parmi tous les élèves du même niveau
       (ex: tous les 1AM, toutes classes confondues)
    4. rank_in_section — parmi tous les élèves de la même section
       (Primaire OU CEM OU Lycée)

    En cas d'égalité de moyenne → même rang (dense ranking).
    Utilise bulk_update pour la performance.
    """
    from apps.academics.models import Class as Classroom
    from apps.grades.models import TrimesterAverage
    from apps.schools.models import AcademicYear

    classroom = _resolve(classroom_id, Classroom)
    academic_year = _resolve(academic_year_id, AcademicYear)

    # ── rank_in_class ─────────────────────────────────────────────────
    class_avgs = (
        TrimesterAverage.objects.filter(
            classroom=classroom,
            academic_year=academic_year,
            trimester=trimester,
        )
        .select_related("student")
        .order_by()  # clear default ordering
    )
    _assign_ranks(class_avgs, "rank_in_class")

    # ── rank_in_stream (lycée uniquement — si la classe a une filière) ─
    if classroom.stream_id:
        stream_avgs = TrimesterAverage.objects.filter(
            classroom__level=classroom.level,
            classroom__stream=classroom.stream,
            academic_year=academic_year,
            trimester=trimester,
        ).order_by()
        _assign_ranks(stream_avgs, "rank_in_stream")

    # ── rank_in_level ─────────────────────────────────────────────────
    level_avgs = TrimesterAverage.objects.filter(
        classroom__level=classroom.level,
        academic_year=academic_year,
        trimester=trimester,
    ).order_by()
    _assign_ranks(level_avgs, "rank_in_level")

    # ── rank_in_section ───────────────────────────────────────────────
    section_avgs = TrimesterAverage.objects.filter(
        classroom__section=classroom.section,
        academic_year=academic_year,
        trimester=trimester,
    ).order_by()
    _assign_ranks(section_avgs, "rank_in_section")

    logger.info(
        "Rankings calculated for classroom=%s T%s (class=%d, level=%d, section=%d)",
        classroom,
        trimester,
        class_avgs.count(),
        level_avgs.count(),
        section_avgs.count(),
    )


def calculate_annual_rankings(
    classroom_id,
    academic_year_id,
) -> None:
    """Rank students by their annual average within class and level."""
    from apps.academics.models import Class as Classroom
    from apps.grades.models import AnnualAverage
    from apps.schools.models import AcademicYear

    classroom = _resolve(classroom_id, Classroom)
    academic_year = _resolve(academic_year_id, AcademicYear)

    class_avgs = AnnualAverage.objects.filter(
        classroom=classroom,
        academic_year=academic_year,
    ).order_by()
    _assign_ranks(class_avgs, "rank_in_class")

    level_avgs = AnnualAverage.objects.filter(
        classroom__level=classroom.level,
        academic_year=academic_year,
    ).order_by()
    _assign_ranks(level_avgs, "rank_in_level")


# ═══════════════════════════════════════════════════════════════════════════
# 4. RECALCULATE CASCADE — atomic recalc when a Grade changes
# ═══════════════════════════════════════════════════════════════════════════


def recalculate_cascade(
    student_id,
    subject_id,
    classroom_id,
    academic_year_id,
    trimester: int,
) -> dict:
    """
    Quand une note change → recalculer dans l'ordre (transaction atomique) :
      1. SubjectAverage de la matière concernée
      2. TrimesterAverage (car la moyenne matière a changé)
      3. Classements de toute la classe (car une moyenne a changé)
      4. AnnualAverage si les 3 trimestres sont disponibles

    Logger chaque étape pour debug.

    Returns:
        dict with computed values at each step.
    """
    from apps.grades.models import TrimesterAverage

    result = {
        "subject_average": None,
        "trimester_average": None,
        "annual_average": None,
        "rankings_updated": False,
    }

    with transaction.atomic():
        # ── Step 1 : Moyenne de la matière ──────────────────────────────
        logger.info(
            "CASCADE [1/4] SubjectAverage — student=%s subject=%s T%s",
            student_id,
            subject_id,
            trimester,
        )
        try:
            sa = calculate_subject_average(
                student_id,
                subject_id,
                classroom_id,
                academic_year_id,
                trimester,
                save=True,
            )
            result["subject_average"] = str(sa) if sa else None
        except LockedException:
            logger.warning("CASCADE [1/4] SubjectAverage LOCKED — skipping")
            return result

        # ── Step 2 : Moyenne trimestrielle ──────────────────────────────
        logger.info(
            "CASCADE [2/4] TrimesterAverage — student=%s T%s",
            student_id,
            trimester,
        )
        try:
            ta = calculate_trimester_average(
                student_id,
                classroom_id,
                academic_year_id,
                trimester,
                save=True,
            )
            result["trimester_average"] = str(ta) if ta else None
        except LockedException:
            logger.warning("CASCADE [2/4] TrimesterAverage LOCKED — skipping step 2-4")
            return result

        # ── Step 3 : Classements ────────────────────────────────────────
        logger.info(
            "CASCADE [3/4] Rankings — classroom=%s T%s",
            classroom_id,
            trimester,
        )
        calculate_rankings(classroom_id, academic_year_id, trimester)
        result["rankings_updated"] = True

        # ── Step 4 : Moyenne annuelle (si 3 trimestres dispo) ───────────
        logger.info(
            "CASCADE [4/4] AnnualAverage — student=%s",
            student_id,
        )
        trim_count = (
            TrimesterAverage.objects.filter(
                student_id=student_id if isinstance(student_id, str) else student_id.pk,
                classroom_id=classroom_id
                if isinstance(classroom_id, str)
                else classroom_id.pk,
                academic_year_id=academic_year_id
                if isinstance(academic_year_id, str)
                else academic_year_id.pk,
            )
            .exclude(calculated_average__isnull=True)
            .count()
        )

        if trim_count >= 3:
            aa = _calculate_annual_average_internal(
                student_id,
                classroom_id,
                academic_year_id,
                save=True,
            )
            result["annual_average"] = str(aa) if aa else None
            if aa is not None:
                calculate_annual_rankings(classroom_id, academic_year_id)
        else:
            logger.debug(
                "CASCADE [4/4] Only %d/3 trimesters available — skipping annual",
                trim_count,
            )

    logger.info("CASCADE complete: %s", result)
    return result


# ═══════════════════════════════════════════════════════════════════════════
# 5. ADMIN OVERRIDE — manual average injection (admin only)
# ═══════════════════════════════════════════════════════════════════════════


def admin_override_average(
    override_type: str,
    object_id,
    new_value: Decimal,
    admin_user,
) -> dict:
    """
    Injection manuelle de moyenne par un admin.

    override_type : 'subject_average' | 'trimester_average' | 'annual_average'

    Règles :
    - Vérifier que admin_user a le rôle ADMIN ou SECTION_ADMIN
    - Vérifier que la moyenne n'est pas verrouillée (is_locked=False)
    - Sauvegarder l'ancienne valeur dans un AuditLog (logged)
    - Mettre manual_override = new_value
    - Recalculer les classements
    - Ne PAS recalculer les moyennes dépendantes automatiquement

    Returns:
        dict with old_value, new_value, object details.
    """
    from apps.accounts.models import User
    from apps.grades.models import AnnualAverage, SubjectAverage, TrimesterAverage

    # ── Permission check ────────────────────────────────────────────────
    if admin_user.role not in (
        User.Role.ADMIN,
        User.Role.SECTION_ADMIN,
        User.Role.SUPER_ADMIN,
    ):
        raise PermissionDeniedException(
            f"Utilisateur {admin_user} (role={admin_user.role}) n'a pas le droit "
            "de modifier manuellement une moyenne."
        )

    # ── Resolve target object ───────────────────────────────────────────
    MODEL_MAP = {
        "subject_average": SubjectAverage,
        "trimester_average": TrimesterAverage,
        "annual_average": AnnualAverage,
    }
    model_class = MODEL_MAP.get(override_type)
    if model_class is None:
        raise ValueError(
            f"override_type invalide : '{override_type}'. "
            f"Choix : {list(MODEL_MAP.keys())}"
        )

    obj = model_class.objects.get(pk=object_id)

    # ── Lock check ──────────────────────────────────────────────────────
    if obj.is_locked:
        raise LockedException(
            f"{model_class.__name__} {object_id} est verrouillé. "
            "Déverrouillez d'abord avant de modifier."
        )

    # ── Audit: log old value ────────────────────────────────────────────
    old_value = (
        obj.manual_override
        if obj.manual_override is not None
        else obj.calculated_average
    )
    logger.info(
        "ADMIN_OVERRIDE: %s pk=%s | old=%s → new=%s | by=%s (%s)",
        override_type,
        object_id,
        old_value,
        new_value,
        admin_user.pk,
        admin_user.full_name,
    )

    # ── Apply override ──────────────────────────────────────────────────
    obj.manual_override = Decimal(str(new_value)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    obj.save(update_fields=["manual_override", "updated_at"])

    # ── Recompute appreciation if applicable ────────────────────────────
    if hasattr(obj, "compute_appreciation"):
        obj.compute_appreciation()
        obj.save(update_fields=["appreciation"])

    # ── Recalculate rankings (but NOT dependent averages) ───────────────
    if override_type == "subject_average":
        # Just recompute trimester rankings for this class/trimester
        calculate_rankings(obj.classroom_id, obj.academic_year_id, obj.trimester)
    elif override_type == "trimester_average":
        calculate_rankings(obj.classroom_id, obj.academic_year_id, obj.trimester)
    elif override_type == "annual_average":
        calculate_annual_rankings(obj.classroom_id, obj.academic_year_id)

    return {
        "override_type": override_type,
        "object_id": str(object_id),
        "old_value": str(old_value) if old_value is not None else None,
        "new_value": str(obj.manual_override),
        "admin": str(admin_user.pk),
    }


# ═══════════════════════════════════════════════════════════════════════════
# 6. LOCK / UNLOCK TRIMESTER
# ═══════════════════════════════════════════════════════════════════════════


def lock_trimester(
    classroom_id,
    academic_year_id,
    trimester: int,
    director_user,
    *,
    check_completeness: bool = False,
) -> dict:
    """
    Verrouiller un trimestre pour une classe.

    Règles :
    - Vérifier que director_user est ADMIN ou SECTION_ADMIN
    - Si check_completeness=True, vérifier que toutes les notes sont saisies
    - Verrouiller tous les TrimesterAverage de la classe pour ce trimestre
    - Verrouiller tous les SubjectAverage correspondants
    - Logger l'action avec timestamp et user
    - Déclencher notification Celery aux enseignants concernés

    Returns:
        dict summary with locked counts.
    """
    from apps.accounts.models import User
    from apps.academics.models import Class as Classroom
    from apps.academics.models import TeacherAssignment
    from apps.grades.models import ExamType, Grade, SubjectAverage, TrimesterAverage
    from apps.schools.models import AcademicYear

    classroom = _resolve(classroom_id, Classroom)
    academic_year = _resolve(academic_year_id, AcademicYear)

    # ── Permission ──────────────────────────────────────────────────────
    if director_user.role not in (
        User.Role.ADMIN,
        User.Role.SECTION_ADMIN,
        User.Role.SUPER_ADMIN,
    ):
        raise PermissionDeniedException(
            f"Utilisateur {director_user} n'a pas le droit de verrouiller un trimestre."
        )

    # ── Optional: check all grades entered ──────────────────────────────
    if check_completeness:
        from apps.academics.models import StudentProfile

        students = StudentProfile.objects.filter(
            current_class=classroom,
            is_deleted=False,
        )
        exam_types = ExamType.objects.filter(
            classroom=classroom,
            academic_year=academic_year,
            trimester=trimester,
        )
        for student in students:
            for et in exam_types:
                if not Grade.objects.filter(student=student, exam_type=et).exists():
                    raise ValueError(
                        f"Notes incomplètes : {student} n'a pas de note pour "
                        f"'{et.name}' ({et.subject.name}). "
                        "Complétez toutes les notes avant de verrouiller."
                    )

    now = timezone.now()

    # ── Lock TrimesterAverages ──────────────────────────────────────────
    trim_locked = TrimesterAverage.objects.filter(
        classroom=classroom,
        academic_year=academic_year,
        trimester=trimester,
        is_locked=False,
    ).update(
        is_locked=True,
        locked_at=now,
        locked_by=director_user,
    )

    # ── Lock SubjectAverages ────────────────────────────────────────────
    subj_locked = SubjectAverage.objects.filter(
        classroom=classroom,
        academic_year=academic_year,
        trimester=trimester,
        is_locked=False,
    ).update(
        is_locked=True,
        locked_at=now,
        locked_by=director_user,
    )

    logger.info(
        "LOCK_TRIMESTER: classroom=%s T%s | trimester_avgs=%d, subject_avgs=%d | by=%s",
        classroom,
        trimester,
        trim_locked,
        subj_locked,
        director_user.pk,
    )

    # ── Notify teachers via Celery ──────────────────────────────────────
    try:
        from apps.notifications.tasks import send_notification

        # Find all teachers assigned to this class
        teacher_ids = (
            TeacherAssignment.objects.filter(
                classroom=classroom,
                academic_year=academic_year,
            )
            .values_list("teacher_id", flat=True)
            .distinct()
        )
        for teacher_id in teacher_ids:
            send_notification.delay(
                user_id=str(teacher_id),
                title="Trimestre verrouillé",
                body=(
                    f"Le trimestre {trimester} de la classe {classroom.name} "
                    f"a été verrouillé par {director_user.full_name}."
                ),
                notification_type="SYSTEM",
            )
    except Exception:
        logger.exception("Failed to send lock notifications")

    return {
        "classroom": str(classroom),
        "trimester": trimester,
        "trimester_averages_locked": trim_locked,
        "subject_averages_locked": subj_locked,
        "locked_by": str(director_user.pk),
        "locked_at": now.isoformat(),
    }


def unlock_trimester(
    classroom_id,
    academic_year_id,
    trimester: int,
    director_user,
    reason: str,
) -> dict:
    """
    Déverrouillage d'urgence (ex: recours accepté).

    Règles :
    - Vérifier que director_user est ADMIN ou SECTION_ADMIN
    - La raison est OBLIGATOIRE
    - Logger l'action complète
    """
    from apps.accounts.models import User
    from apps.academics.models import Class as Classroom
    from apps.grades.models import SubjectAverage, TrimesterAverage
    from apps.schools.models import AcademicYear

    classroom = _resolve(classroom_id, Classroom)
    academic_year = _resolve(academic_year_id, AcademicYear)

    if director_user.role not in (
        User.Role.ADMIN,
        User.Role.SECTION_ADMIN,
        User.Role.SUPER_ADMIN,
    ):
        raise PermissionDeniedException(
            f"Utilisateur {director_user} n'a pas le droit de déverrouiller un trimestre."
        )

    if not reason or not reason.strip():
        raise ValueError("Une raison est obligatoire pour déverrouiller un trimestre.")

    # ── Unlock TrimesterAverages ────────────────────────────────────────
    trim_unlocked = TrimesterAverage.objects.filter(
        classroom=classroom,
        academic_year=academic_year,
        trimester=trimester,
        is_locked=True,
    ).update(
        is_locked=False,
        locked_at=None,
        locked_by=None,
    )

    # ── Unlock SubjectAverages ──────────────────────────────────────────
    subj_unlocked = SubjectAverage.objects.filter(
        classroom=classroom,
        academic_year=academic_year,
        trimester=trimester,
        is_locked=True,
    ).update(
        is_locked=False,
        locked_at=None,
        locked_by=None,
    )

    logger.warning(
        "UNLOCK_TRIMESTER: classroom=%s T%s | reason='%s' | "
        "trimester_avgs=%d, subject_avgs=%d | by=%s",
        classroom,
        trimester,
        reason,
        trim_unlocked,
        subj_unlocked,
        director_user.pk,
    )

    return {
        "classroom": str(classroom),
        "trimester": trimester,
        "trimester_averages_unlocked": trim_unlocked,
        "subject_averages_unlocked": subj_unlocked,
        "reason": reason,
        "unlocked_by": str(director_user.pk),
        "unlocked_at": timezone.now().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════
# 7. FULL RECALCULATION — bulk recalc for a whole classroom/trimester
# ═══════════════════════════════════════════════════════════════════════════


def recalculate_classroom_trimester(
    classroom_id,
    academic_year_id,
    trimester: int,
) -> dict:
    """
    Full recalculation pipeline for one classroom + trimester:
      1. Recalculate all SubjectAverages (skipping locked)
      2. Recalculate all TrimesterAverages (skipping locked)
      3. Recalculate rankings
      4. If all 3 trimesters have data → recalculate annual averages + rankings

    Returns a summary dict with counts.
    """
    from apps.academics.models import Class as Classroom
    from apps.academics.models import StudentProfile
    from apps.academics.models import Subject as AcademicSubject
    from apps.grades.models import ExamType
    from apps.schools.models import AcademicYear

    classroom = _resolve(classroom_id, Classroom)
    academic_year = _resolve(academic_year_id, AcademicYear)

    students = StudentProfile.objects.filter(
        current_class=classroom,
        is_deleted=False,
    )

    # Discover all subjects taught in this classroom/trimester
    subject_ids = (
        ExamType.objects.filter(
            classroom=classroom,
            academic_year=academic_year,
            trimester=trimester,
        )
        .values_list("subject", flat=True)
        .distinct()
    )
    subject_objs = AcademicSubject.objects.filter(id__in=subject_ids)

    subject_avg_count = 0
    trim_avg_count = 0
    locked_skipped = 0

    for student in students:
        # Step 1: Subject averages
        for subj in subject_objs:
            try:
                result = calculate_subject_average(
                    student,
                    subj,
                    classroom,
                    academic_year,
                    trimester,
                    save=True,
                )
                if result is not None:
                    subject_avg_count += 1
            except LockedException:
                locked_skipped += 1

        # Step 2: Trimester average
        try:
            result = calculate_trimester_average(
                student,
                classroom,
                academic_year,
                trimester,
                save=True,
            )
            if result is not None:
                trim_avg_count += 1
        except LockedException:
            locked_skipped += 1

    # Step 3: Rankings
    calculate_rankings(classroom, academic_year, trimester)

    # Step 4: Annual (if all 3 trimesters done)
    annual_count = 0
    for student in students:
        result = _calculate_annual_average_internal(
            student,
            classroom,
            academic_year,
            save=True,
        )
        if result is not None:
            annual_count += 1

    if annual_count > 0:
        calculate_annual_rankings(classroom, academic_year)

    summary = {
        "classroom": str(classroom),
        "trimester": trimester,
        "students": students.count(),
        "subject_averages": subject_avg_count,
        "trimester_averages": trim_avg_count,
        "annual_averages": annual_count,
        "locked_skipped": locked_skipped,
    }
    logger.info("Recalculation complete: %s", summary)
    return summary


# ═══════════════════════════════════════════════════════════════════════════
# APPRECIATION HELPER (public)
# ═══════════════════════════════════════════════════════════════════════════


def get_appreciation(average: Optional[Decimal]) -> str:
    """
    Return French appreciation label for a /20 average.

    ≥18 Excellent | ≥16 Très Bien | ≥14 Bien |
    ≥12 Assez Bien | ≥10 Passable | <10 Insuffisant
    """
    if average is None:
        return ""
    thresholds = [
        (Decimal("18"), "Excellent"),
        (Decimal("16"), "Très Bien"),
        (Decimal("14"), "Bien"),
        (Decimal("12"), "Assez Bien"),
        (Decimal("10"), "Passable"),
    ]
    for threshold, label in thresholds:
        if average >= threshold:
            return label
    return "Insuffisant"


# ═══════════════════════════════════════════════════════════════════════════
# PRIVATE HELPERS
# ═══════════════════════════════════════════════════════════════════════════


def _resolve(value, model_class):
    """
    Accept a UUID string, UUID object, or model instance.
    Returns the model instance.
    """
    if isinstance(value, model_class):
        return value
    return model_class.objects.get(pk=value)


def _get_coefficient(classroom, subject) -> Decimal:
    """
    Look up the coefficient for a subject in the class's level/stream.
    Falls back to stream=None, then defaults to 1.
    """
    from apps.academics.models import LevelSubject

    try:
        ls = LevelSubject.objects.get(
            level=classroom.level,
            stream=classroom.stream,
            subject=subject,
        )
        return ls.coefficient
    except LevelSubject.DoesNotExist:
        # Try without stream (for CEM / primaire)
        try:
            ls = LevelSubject.objects.get(
                level=classroom.level,
                stream__isnull=True,
                subject=subject,
            )
            return ls.coefficient
        except LevelSubject.DoesNotExist:
            logger.warning(
                "No LevelSubject found for %s / %s — defaulting coefficient to 1",
                classroom.level,
                subject,
            )
            return Decimal("1")


def _assign_ranks(queryset: QuerySet, rank_field: str) -> None:
    """
    Compute dense ranks for a queryset of TrimesterAverage or AnnualAverage
    and bulk-update the specified rank field.

    Dense ranking: 1, 2, 2, 3 (ties share same rank, next rank is +1).
    """
    items = []
    for obj in queryset:
        avg = obj.effective_average
        items.append((obj, avg))

    # Sort descending; None → end
    items.sort(
        key=lambda x: x[1] if x[1] is not None else Decimal("-1"),
        reverse=True,
    )

    rank = 0
    prev_avg = None
    for obj, avg in items:
        if avg is None:
            setattr(obj, rank_field, None)
            continue
        if avg != prev_avg:
            rank += 1
        setattr(obj, rank_field, rank)
        prev_avg = avg

    if items:
        model = items[0][0].__class__
        model.objects.bulk_update(
            [obj for obj, _ in items],
            [rank_field],
            batch_size=200,
        )


def _calculate_annual_average_internal(
    student_id,
    classroom_id,
    academic_year_id,
    *,
    save: bool = True,
) -> Optional[Decimal]:
    """
    Internal: compute annual average using TrimesterConfig weights.

    Default (no config): (T1 + T2 + T3) / 3
    With config: (T1×w1 + T2×w2 + T3×w3) / (w1 + w2 + w3)

    Only when all 3 trimesters have a non-null effective_average.
    """
    from apps.academics.models import Class as Classroom
    from apps.academics.models import StudentProfile
    from apps.grades.models import AnnualAverage, TrimesterAverage, TrimesterConfig
    from apps.schools.models import AcademicYear

    student = _resolve(student_id, StudentProfile)
    classroom = _resolve(classroom_id, Classroom)
    academic_year = _resolve(academic_year_id, AcademicYear)

    trims = TrimesterAverage.objects.filter(
        student=student,
        classroom=classroom,
        academic_year=academic_year,
    )

    if trims.count() < 3:
        return None

    trim_map = {}
    for t in trims:
        avg = t.effective_average
        if avg is None:
            return None
        trim_map[t.trimester] = avg

    if len(trim_map) < 3:
        return None

    # ── Load TrimesterConfig weights (default: equal 1/1/1) ─────────
    school = classroom.section.school if hasattr(classroom, "section") else None
    config = None
    if school:
        config = TrimesterConfig.objects.filter(school=school).first()

    w1 = config.weight_t1 if config else Decimal("1")
    w2 = config.weight_t2 if config else Decimal("1")
    w3 = config.weight_t3 if config else Decimal("1")
    decimal_places = config.decimal_places if config else 2

    total_weight = w1 + w2 + w3
    if total_weight == 0:
        return None

    weighted_sum = trim_map[1] * w1 + trim_map[2] * w2 + trim_map[3] * w3
    quant = Decimal("0.1") if decimal_places == 1 else Decimal("0.01")
    calculated = (weighted_sum / total_weight).quantize(quant, rounding=ROUND_HALF_UP)

    if save:
        obj, _ = AnnualAverage.objects.update_or_create(
            student=student,
            classroom=classroom,
            academic_year=academic_year,
            defaults={"calculated_average": calculated},
        )
        obj.compute_appreciation()
        obj.save(update_fields=["appreciation"])

    return calculated


# ═══════════════════════════════════════════════════════════════════════════
# 8. GRADE WORKFLOW — state transitions (DRAFT/SUBMITTED/PUBLISHED/RETURNED)
# ═══════════════════════════════════════════════════════════════════════════


class InvalidTransitionError(Exception):
    """Raised when a grade workflow transition is invalid."""


def submit_grades(
    exam_type_id,
    teacher_user,
) -> dict:
    """
    Teacher submits grades for admin review.
    DRAFT → SUBMITTED

    Only DRAFT or RETURNED grades can be submitted.
    """
    from apps.grades.models import ExamType, Grade

    exam_type = _resolve(exam_type_id, ExamType)
    now = timezone.now()

    grades = Grade.objects.filter(
        exam_type=exam_type,
        status__in=[Grade.Status.DRAFT, Grade.Status.RETURNED],
    )

    if not grades.exists():
        raise InvalidTransitionError(
            "Aucune note en brouillon ou retournée à soumettre pour cet examen."
        )

    count = grades.update(
        status=Grade.Status.SUBMITTED,
        submitted_at=now,
        submitted_by=teacher_user,
        admin_comment="",
    )

    logger.info(
        "SUBMIT_GRADES: exam_type=%s count=%d by=%s",
        exam_type,
        count,
        teacher_user.pk,
    )
    return {
        "exam_type": str(exam_type),
        "submitted_count": count,
        "submitted_at": now.isoformat(),
    }


def publish_grades(
    exam_type_id,
    admin_user,
) -> dict:
    """
    Admin approves and publishes submitted grades.
    SUBMITTED → PUBLISHED

    Also sets is_published=True for backward compatibility.
    Triggers notification to students/parents.
    """
    from apps.accounts.models import User
    from apps.grades.models import ExamType, Grade

    exam_type = _resolve(exam_type_id, ExamType)

    if admin_user.role not in (
        User.Role.ADMIN,
        User.Role.SECTION_ADMIN,
        User.Role.SUPER_ADMIN,
    ):
        raise PermissionDeniedException(
            "Seul un administrateur peut publier les notes."
        )

    now = timezone.now()
    grades = Grade.objects.filter(
        exam_type=exam_type,
        status=Grade.Status.SUBMITTED,
    )

    if not grades.exists():
        raise InvalidTransitionError(
            "Aucune note soumise à publier pour cet examen."
        )

    count = grades.update(
        status=Grade.Status.PUBLISHED,
        is_published=True,
        published_at=now,
        published_by=admin_user,
    )

    # ── Notify students & parents ───────────────────────────────────────
    try:
        from apps.notifications.tasks import send_notification

        student_grades = Grade.objects.filter(
            exam_type=exam_type,
            status=Grade.Status.PUBLISHED,
        ).select_related("student__user", "student__parent_user")

        notified = set()
        for g in student_grades:
            student_user_id = str(g.student.user_id)
            if student_user_id not in notified:
                send_notification.delay(
                    user_id=student_user_id,
                    title="Notes publiées",
                    body=f"Vos notes de {exam_type.subject.name} ({exam_type.name}) sont disponibles.",
                    notification_type="GRADE_PUBLISHED",
                    related_object_id=str(exam_type.pk),
                    related_object_type="ExamType",
                )
                notified.add(student_user_id)
            # Notify parent
            parent_user = getattr(g.student, "parent_user", None)
            if parent_user:
                parent_id = str(parent_user.pk)
                if parent_id not in notified:
                    send_notification.delay(
                        user_id=parent_id,
                        title="Notes publiées",
                        body=f"Les notes de {g.student.user.full_name} en {exam_type.subject.name} sont disponibles.",
                        notification_type="GRADE_PUBLISHED",
                        related_object_id=str(exam_type.pk),
                        related_object_type="ExamType",
                    )
                    notified.add(parent_id)
    except Exception:
        logger.exception("Failed to send publication notifications")

    logger.info(
        "PUBLISH_GRADES: exam_type=%s count=%d by=%s",
        exam_type,
        count,
        admin_user.pk,
    )
    return {
        "exam_type": str(exam_type),
        "published_count": count,
        "published_at": now.isoformat(),
    }


def return_grades(
    exam_type_id,
    admin_user,
    comment: str,
) -> dict:
    """
    Admin rejects submitted grades with a comment.
    SUBMITTED → RETURNED

    The teacher can then modify and re-submit.
    """
    from apps.accounts.models import User
    from apps.grades.models import ExamType, Grade

    exam_type = _resolve(exam_type_id, ExamType)

    if admin_user.role not in (
        User.Role.ADMIN,
        User.Role.SECTION_ADMIN,
        User.Role.SUPER_ADMIN,
    ):
        raise PermissionDeniedException(
            "Seul un administrateur peut retourner les notes."
        )

    if not comment or not comment.strip():
        raise ValueError("Un commentaire est obligatoire pour retourner les notes.")

    now = timezone.now()
    grades = Grade.objects.filter(
        exam_type=exam_type,
        status=Grade.Status.SUBMITTED,
    )

    if not grades.exists():
        raise InvalidTransitionError(
            "Aucune note soumise à retourner pour cet examen."
        )

    count = grades.update(
        status=Grade.Status.RETURNED,
        returned_at=now,
        returned_by=admin_user,
        admin_comment=comment.strip(),
    )

    # ── Notify the teacher ──────────────────────────────────────────────
    try:
        from apps.notifications.tasks import send_notification

        if exam_type.created_by:
            send_notification.delay(
                user_id=str(exam_type.created_by_id),
                title="Notes retournées",
                body=f"Les notes de {exam_type.subject.name} ({exam_type.name}) ont été retournées. Motif : {comment[:100]}",
                notification_type="GRADE_RETURNED",
                related_object_id=str(exam_type.pk),
                related_object_type="ExamType",
            )
    except Exception:
        logger.exception("Failed to send return notification")

    logger.info(
        "RETURN_GRADES: exam_type=%s count=%d reason='%s' by=%s",
        exam_type,
        count,
        comment[:50],
        admin_user.pk,
    )
    return {
        "exam_type": str(exam_type),
        "returned_count": count,
        "comment": comment,
        "returned_at": now.isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════
# 9. STUDENT AVERAGES — aggregated view for one student
# ═══════════════════════════════════════════════════════════════════════════


def get_student_averages(student_id, academic_year_id=None) -> dict:
    """
    Return a complete averages overview for a student:
    - Subject averages per trimester
    - Trimester averages
    - Annual average
    - Rankings
    """
    from apps.academics.models import StudentProfile
    from apps.grades.models import AnnualAverage, SubjectAverage, TrimesterAverage

    student = _resolve(student_id, StudentProfile)
    classroom = student.current_class

    if not classroom:
        return {"error": "Élève sans classe assignée."}

    filters = {"student": student, "classroom": classroom}
    if academic_year_id:
        from apps.schools.models import AcademicYear

        academic_year = _resolve(academic_year_id, AcademicYear)
        filters["academic_year"] = academic_year

    # Subject averages
    subject_avgs = (
        SubjectAverage.objects.filter(**filters)
        .select_related("subject")
        .order_by("trimester", "subject__name")
    )

    # Trimester averages
    trimester_avgs = TrimesterAverage.objects.filter(**filters).order_by("trimester")

    # Annual average
    annual_filters = {
        "student": student,
        "classroom": classroom,
    }
    if "academic_year" in filters:
        annual_filters["academic_year"] = filters["academic_year"]

    annual_avgs = AnnualAverage.objects.filter(**annual_filters)

    result = {
        "student_id": str(student.pk),
        "student_name": student.user.full_name,
        "classroom": str(classroom),
        "subject_averages": [],
        "trimester_averages": [],
        "annual_averages": [],
    }

    for sa in subject_avgs:
        result["subject_averages"].append(
            {
                "id": str(sa.pk),
                "subject": sa.subject.name,
                "trimester": sa.trimester,
                "calculated_average": str(sa.calculated_average) if sa.calculated_average else None,
                "manual_override": str(sa.manual_override) if sa.manual_override else None,
                "effective_average": str(sa.effective_average) if sa.effective_average else None,
                "is_published": sa.is_published,
                "is_locked": sa.is_locked,
            }
        )

    for ta in trimester_avgs:
        result["trimester_averages"].append(
            {
                "id": str(ta.pk),
                "trimester": ta.trimester,
                "calculated_average": str(ta.calculated_average) if ta.calculated_average else None,
                "manual_override": str(ta.manual_override) if ta.manual_override else None,
                "effective_average": str(ta.effective_average) if ta.effective_average else None,
                "rank_in_class": ta.rank_in_class,
                "rank_in_stream": ta.rank_in_stream,
                "rank_in_level": ta.rank_in_level,
                "rank_in_section": ta.rank_in_section,
                "appreciation": ta.appreciation,
                "is_published": ta.is_published,
                "is_locked": ta.is_locked,
            }
        )

    for aa in annual_avgs:
        result["annual_averages"].append(
            {
                "id": str(aa.pk),
                "calculated_average": str(aa.calculated_average) if aa.calculated_average else None,
                "manual_override": str(aa.manual_override) if aa.manual_override else None,
                "effective_average": str(aa.effective_average) if aa.effective_average else None,
                "rank_in_class": aa.rank_in_class,
                "rank_in_level": aa.rank_in_level,
                "appreciation": aa.appreciation,
            }
        )

    return result


# ═══════════════════════════════════════════════════════════════════════════
# 10. CSV GRADE IMPORT — parse, validate, preview, confirm
# ═══════════════════════════════════════════════════════════════════════════


class CSVImportError(Exception):
    """Raised when CSV import fails validation."""


def parse_csv_grades(
    csv_content: str,
    exam_type_id,
    teacher_user,
) -> dict:
    """
    Parse a CSV file with columns: nom, prénom, note
    Match students against the classroom roster.

    Returns a preview dict with matched/unmatched students.
    Does NOT save any grades.
    """
    import csv
    import io as _io
    from difflib import SequenceMatcher

    from apps.academics.models import StudentProfile
    from apps.grades.models import ExamType

    exam_type = _resolve(exam_type_id, ExamType)
    classroom = exam_type.classroom

    # Parse CSV
    reader = csv.DictReader(_io.StringIO(csv_content), delimiter=";")

    # Validate headers
    if not reader.fieldnames:
        raise CSVImportError("Fichier CSV vide ou invalide.")

    # Normalise headers (case-insensitive, strip whitespace)
    normalised_headers = [h.strip().lower() for h in reader.fieldnames]

    # Accept common variations
    nom_col = None
    prenom_col = None
    note_col = None

    for i, h in enumerate(normalised_headers):
        if h in ("nom", "last_name", "nom_famille", "lastname"):
            nom_col = reader.fieldnames[i]
        elif h in ("prénom", "prenom", "first_name", "firstname"):
            prenom_col = reader.fieldnames[i]
        elif h in ("note", "score", "grade", "mark"):
            note_col = reader.fieldnames[i]

    if not nom_col or not prenom_col or not note_col:
        raise CSVImportError(
            "Colonnes requises introuvables. "
            "Le fichier doit contenir : nom, prénom, note (séparateur: ;)"
        )

    # Load classroom roster
    roster = StudentProfile.objects.filter(
        current_class=classroom,
        is_deleted=False,
    ).select_related("user")

    roster_map = {}
    for sp in roster:
        key = f"{sp.user.last_name.lower().strip()} {sp.user.first_name.lower().strip()}"
        roster_map[key] = sp

    matched = []
    unmatched = []
    errors = []

    for row_idx, row in enumerate(reader, start=2):
        nom = (row.get(nom_col) or "").strip()
        prenom = (row.get(prenom_col) or "").strip()
        note_str = (row.get(note_col) or "").strip()

        if not nom and not prenom:
            continue  # Skip empty rows

        # Parse note
        score = None
        if note_str:
            note_str = note_str.replace(",", ".")
            try:
                score = Decimal(note_str)
            except Exception:
                errors.append(
                    {"row": row_idx, "nom": nom, "prenom": prenom, "error": f"Note invalide: '{note_str}'"}
                )
                continue

            if score < 0:
                errors.append(
                    {"row": row_idx, "nom": nom, "prenom": prenom, "error": "Note négative"}
                )
                continue
            if score > exam_type.max_score:
                errors.append(
                    {"row": row_idx, "nom": nom, "prenom": prenom, "error": f"Note dépasse le barème ({exam_type.max_score})"}
                )
                continue

        # Match student
        lookup_key = f"{nom.lower()} {prenom.lower()}"
        student = roster_map.get(lookup_key)

        if not student:
            # Fuzzy match
            best_match = None
            best_ratio = 0
            for key, sp in roster_map.items():
                ratio = SequenceMatcher(None, lookup_key, key).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = sp

            if best_ratio >= 0.8:
                matched.append(
                    {
                        "row": row_idx,
                        "csv_nom": nom,
                        "csv_prenom": prenom,
                        "student_id": str(best_match.pk),
                        "student_name": best_match.user.full_name,
                        "score": str(score) if score is not None else None,
                        "fuzzy_match": True,
                        "match_confidence": round(best_ratio, 2),
                    }
                )
            else:
                unmatched.append(
                    {
                        "row": row_idx,
                        "csv_nom": nom,
                        "csv_prenom": prenom,
                        "score": str(score) if score is not None else None,
                        "best_suggestion": best_match.user.full_name if best_match else None,
                        "confidence": round(best_ratio, 2) if best_match else 0,
                    }
                )
        else:
            matched.append(
                {
                    "row": row_idx,
                    "csv_nom": nom,
                    "csv_prenom": prenom,
                    "student_id": str(student.pk),
                    "student_name": student.user.full_name,
                    "score": str(score) if score is not None else None,
                    "fuzzy_match": False,
                    "match_confidence": 1.0,
                }
            )

    return {
        "exam_type_id": str(exam_type.pk),
        "exam_type_name": str(exam_type),
        "classroom": str(classroom),
        "total_roster": roster.count(),
        "matched": matched,
        "unmatched": unmatched,
        "errors": errors,
    }


def confirm_csv_import(
    preview_data: dict,
    teacher_user,
) -> dict:
    """
    Confirm a CSV import preview and save grades as DRAFT.

    Takes the matched list from parse_csv_grades result.
    Creates/updates Grade records with status=DRAFT.
    """
    from apps.academics.models import StudentProfile
    from apps.grades.models import ExamType, Grade

    exam_type_id = preview_data.get("exam_type_id")
    exam_type = _resolve(exam_type_id, ExamType)
    matched = preview_data.get("matched", [])

    saved = 0
    errors = []

    for item in matched:
        student_id = item.get("student_id")
        score_str = item.get("score")

        if not student_id:
            continue

        try:
            student = StudentProfile.objects.get(pk=student_id, is_deleted=False)
        except StudentProfile.DoesNotExist:
            errors.append({"student_id": student_id, "error": "Élève introuvable"})
            continue

        score = Decimal(score_str) if score_str else None
        is_absent = score is None

        grade, _ = Grade.objects.update_or_create(
            student=student,
            exam_type=exam_type,
            defaults={
                "score": score,
                "is_absent": is_absent,
                "entered_by": teacher_user,
                "status": Grade.Status.DRAFT,
            },
        )
        saved += 1

    logger.info(
        "CSV_IMPORT_CONFIRM: exam_type=%s saved=%d errors=%d by=%s",
        exam_type,
        saved,
        len(errors),
        teacher_user.pk,
    )
    return {
        "exam_type": str(exam_type),
        "saved": saved,
        "errors": errors,
    }
