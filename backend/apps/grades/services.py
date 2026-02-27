"""
Grade calculation services for EduConnect.
All averages are computed server-side — NEVER on the client.
"""

from decimal import ROUND_HALF_UP, Decimal

from apps.grades.models import Grade, Subject, TrimesterConfig


# ---------------------------------------------------------------------------
# 1. Subject trimester average
# ---------------------------------------------------------------------------


def calculate_subject_trimester_average(
    student_profile, subject, trimester, academic_year
):
    """
    Weighted average of all PUBLISHED grades for *one* subject in a trimester.

    Uses ``TrimesterConfig`` to look up the weight for each exam type.
    Returns ``None`` if any of the four exam types is missing.
    """
    config = _get_trimester_config(student_profile, subject)
    if config is None:
        return None

    weight_map = {
        Grade.ExamType.CONTINUOUS: config.continuous_weight,
        Grade.ExamType.TEST_1: config.test1_weight,
        Grade.ExamType.TEST_2: config.test2_weight,
        Grade.ExamType.FINAL: config.final_weight,
    }

    weighted_sum = Decimal("0")
    for exam_type, weight in weight_map.items():
        grade = (
            Grade.objects.filter(
                student=student_profile,
                subject=subject,
                trimester=trimester,
                academic_year=academic_year,
                exam_type=exam_type,
                status=Grade.Status.PUBLISHED,
                is_deleted=False,
            )
            .order_by("-created_at")
            .first()
        )
        if grade is None:
            return None  # incomplete — can't compute average
        # Normalise to /20 then apply weight
        normalised = grade.value * Decimal("20") / grade.max_value
        weighted_sum += normalised * weight

    return weighted_sum.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# 2. Overall trimester average (coefficient-weighted across all subjects)
# ---------------------------------------------------------------------------


def calculate_overall_trimester_average(student_profile, trimester, academic_year):
    """
    Coefficient-weighted average across every subject in the student's
    current class for the given trimester.

    Formula: Σ(subject_avg × coefficient) / Σ(coefficient)
    Returns ``None`` if no valid subject averages exist.
    """
    current_class = student_profile.current_class
    if current_class is None:
        return None

    subjects = Subject.objects.filter(
        class_obj=current_class,
        is_deleted=False,
    )

    numerator = Decimal("0")
    denominator = Decimal("0")

    for subj in subjects:
        avg = calculate_subject_trimester_average(
            student_profile, subj, trimester, academic_year
        )
        if avg is not None:
            coeff = subj.coefficient
            numerator += avg * coeff
            denominator += coeff

    if denominator == 0:
        return None

    return (numerator / denominator).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# 3. Class rank
# ---------------------------------------------------------------------------


def calculate_class_rank(student_profile, trimester, academic_year):
    """
    Rank the student within their class.  1 = best.
    Returns ``int`` or ``None`` if the student has no average.
    """
    from apps.academics.models import StudentProfile

    current_class = student_profile.current_class
    if current_class is None:
        return None

    classmates = StudentProfile.objects.filter(
        current_class=current_class,
        is_deleted=False,
    ).select_related("user")

    averages = []
    for mate in classmates:
        avg = calculate_overall_trimester_average(mate, trimester, academic_year)
        if avg is not None:
            averages.append((mate.pk, avg))

    if not averages:
        return None

    # Sort descending by average
    averages.sort(key=lambda x: x[1], reverse=True)

    # Assign ranks with tie handling
    rank = 1
    for i, (pk, avg) in enumerate(averages):
        if i > 0 and avg < averages[i - 1][1]:
            rank = i + 1
        if pk == student_profile.pk:
            return rank

    return None


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------


def _get_trimester_config(student_profile, subject):
    """
    Resolve the ``TrimesterConfig`` for the student's school & subject's section.
    Falls back to sensible defaults if no row exists.
    """
    school_id = subject.school_id
    section_id = subject.section_id

    try:
        return TrimesterConfig.objects.get(school_id=school_id, section_id=section_id)
    except TrimesterConfig.DoesNotExist:
        # Build an in-memory default so callers stay uniform
        return TrimesterConfig(
            school_id=school_id,
            section_id=section_id,
            continuous_weight=Decimal("0.20"),
            test1_weight=Decimal("0.20"),
            test2_weight=Decimal("0.20"),
            final_weight=Decimal("0.40"),
        )
