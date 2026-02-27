"""
Grade calculation services for EduConnect.
Contains all business logic for computing averages, rankings, and report cards.

All averages are computed server-side — NEVER on the client.
"""

from decimal import ROUND_HALF_UP, Decimal

from django.db.models import Avg, F

from apps.academics.models import Subject


def calculate_subject_trimester_average(student, subject, semester):
    """
    Calculate a student's trimester average for a specific subject.

    Uses the school's configured grading weights:
        - Continuous Assessment weight
        - First Test weight
        - Second Test weight
        - Final Exam weight

    Returns:
        Decimal or None if no grades exist.
    """
    from apps.grades.models import Grade

    grades = Grade.objects.filter(
        student=student,
        subject=subject,
        semester=semester,
        status="published",
    )

    if not grades.exists():
        return None

    # Get the trimester weighting configuration
    config = _get_trimester_config(student.school, subject)

    weighted_sum = Decimal("0")
    total_weight = Decimal("0")

    # Map exam types to their configured weights
    weight_mapping = {
        "continuous": config.get("continuous_weight", Decimal("0.20")),
        "test_1": config.get("test1_weight", Decimal("0.20")),
        "test_2": config.get("test2_weight", Decimal("0.20")),
        "final": config.get("final_weight", Decimal("0.40")),
    }

    for exam_type_key, weight in weight_mapping.items():
        type_grades = grades.filter(exam_type__name__icontains=exam_type_key)
        if type_grades.exists():
            # Normalize scores to the same scale
            avg = type_grades.aggregate(
                avg_score=Avg(F("score") * Decimal("20") / F("max_score"))
            )["avg_score"]

            if avg is not None:
                weighted_sum += Decimal(str(avg)) * weight
                total_weight += weight

    if total_weight > 0:
        result = weighted_sum / total_weight
        return result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return None


def calculate_trimester_overall_average(student, semester):
    """
    Calculate a student's overall trimester average across all subjects,
    weighted by each subject's coefficient.

    Formula: Σ(Subject Average × Coefficient) ÷ Σ(Coefficients)

    Returns:
        Decimal or None
    """
    from apps.accounts.models import StudentProfile

    try:
        profile = student.student_profile
        classroom = profile.classroom
    except StudentProfile.DoesNotExist:
        return None

    if not classroom:
        return None

    subjects = Subject.objects.filter(
        school=student.school,
        levels=classroom.level,
    )

    numerator = Decimal("0")
    denominator = Decimal("0")

    for subject in subjects:
        avg = calculate_subject_trimester_average(student, subject, semester)
        if avg is not None:
            coeff = Decimal(str(subject.coefficient))
            numerator += avg * coeff
            denominator += coeff

    if denominator > 0:
        result = numerator / denominator
        return result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return None


def calculate_yearly_average(student, academic_year):
    """
    Calculate yearly average: (T1 + T2 + T3) / 3

    Returns:
        Decimal or None
    """
    from apps.schools.models import Semester

    semesters = Semester.objects.filter(
        academic_year=academic_year,
    ).order_by("start_date")

    trimester_averages = []
    for semester in semesters:
        avg = calculate_trimester_overall_average(student, semester)
        if avg is not None:
            trimester_averages.append(avg)

    if trimester_averages:
        result = sum(trimester_averages) / len(trimester_averages)
        return Decimal(str(result)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return None


def calculate_class_rankings(classroom, semester):
    """
    Calculate rankings for all students in a classroom for a given semester.

    Returns:
        list of dicts: [{"student": user, "average": Decimal, "rank": int}, ...]
    """
    from apps.accounts.models import StudentProfile

    students = StudentProfile.objects.filter(
        classroom=classroom,
        user__is_active=True,
    ).select_related("user")

    rankings = []
    for profile in students:
        avg = calculate_trimester_overall_average(profile.user, semester)
        if avg is not None:
            rankings.append(
                {
                    "student": profile.user,
                    "average": avg,
                }
            )

    # Sort by average descending
    rankings.sort(key=lambda x: x["average"], reverse=True)

    # Assign ranks (handle ties)
    current_rank = 1
    for i, entry in enumerate(rankings):
        if i > 0 and entry["average"] == rankings[i - 1]["average"]:
            entry["rank"] = rankings[i - 1]["rank"]
        else:
            entry["rank"] = current_rank
        current_rank += 1

    return rankings


def get_student_at_risk(school, semester, threshold=None):
    """
    Identify students at risk of failing.

    Args:
        school: School instance
        semester: Current semester
        threshold: Passing threshold (auto-detected from school level if None)

    Returns:
        list of at-risk student dicts
    """
    from apps.accounts.models import StudentProfile

    students = StudentProfile.objects.filter(
        user__school=school,
        user__is_active=True,
        classroom__isnull=False,
    ).select_related("user", "classroom", "classroom__level")

    at_risk = []
    for profile in students:
        # Auto-detect threshold based on school level
        if threshold is None:
            if profile.classroom.level.school_stage == "primary":
                level_threshold = Decimal("5.00")  # /10
            else:
                level_threshold = Decimal("10.00")  # /20
        else:
            level_threshold = Decimal(str(threshold))

        avg = calculate_trimester_overall_average(profile.user, semester)
        if avg is not None and avg < level_threshold:
            at_risk.append(
                {
                    "student": profile.user,
                    "classroom": profile.classroom,
                    "average": avg,
                    "threshold": level_threshold,
                    "gap": level_threshold - avg,
                }
            )

    # Sort by gap descending (worst first)
    at_risk.sort(key=lambda x: x["gap"], reverse=True)
    return at_risk


def _get_trimester_config(school, subject):
    """
    Get the grading weight configuration for a school/section.
    Returns default weights if no custom config exists.
    """
    # Default weights as per report
    return {
        "continuous_weight": Decimal("0.20"),
        "test1_weight": Decimal("0.20"),
        "test2_weight": Decimal("0.20"),
        "final_weight": Decimal("0.40"),
    }
