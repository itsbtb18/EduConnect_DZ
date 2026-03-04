"""
╔══════════════════════════════════════════════════════════════════════════╗
║  Grades — DRF Serializers                                              ║
║                                                                        ║
║  ExamType / Grade / SubjectAverage / TrimesterAverage /                ║
║  AnnualAverage / GradeAppeal / ReportCard                              ║
║                                                                        ║
║  Plus input serializers for bulk-enter, correct, publish,              ║
║  recalculate, override, lock/unlock, appeal create/respond.            ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

from decimal import Decimal

from rest_framework import serializers

from .models import (
    AnnualAverage,
    ExamType,
    Grade,
    GradeAppeal,
    GradeAuditLog,
    ReportCard,
    SubjectAverage,
    TrimesterAverage,
)


# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════


def _student_name(obj):
    try:
        u = obj.student.user
        return f"{u.first_name} {u.last_name}"
    except Exception:
        return str(obj.student_id)


# ═══════════════════════════════════════════════════════════════════════════
# ExamType
# ═══════════════════════════════════════════════════════════════════════════


class ExamTypeSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    classroom_name = serializers.CharField(source="classroom.name", read_only=True)
    current_total_percentage = serializers.SerializerMethodField()

    class Meta:
        model = ExamType
        fields = [
            "id",
            "subject",
            "subject_name",
            "classroom",
            "classroom_name",
            "academic_year",
            "trimester",
            "name",
            "percentage",
            "max_score",
            "current_total_percentage",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def get_current_total_percentage(self, obj) -> str:
        """Sum of percentages for same subject/classroom/trimester."""
        total = (
            ExamType.objects.filter(
                subject=obj.subject,
                classroom=obj.classroom,
                academic_year=obj.academic_year,
                trimester=obj.trimester,
            )
            .exclude(pk=obj.pk)
            .values_list("percentage", flat=True)
        )
        return str(sum(total, Decimal("0")) + obj.percentage)


class ExamTypeCreateSerializer(serializers.ModelSerializer):
    """Used for POST / PUT on ExamType."""

    class Meta:
        model = ExamType
        fields = [
            "subject",
            "classroom",
            "academic_year",
            "trimester",
            "name",
            "percentage",
            "max_score",
        ]

    def validate(self, data):
        """Block if total percentage would exceed 100%."""
        existing_total = (
            ExamType.objects.filter(
                subject=data["subject"],
                classroom=data["classroom"],
                academic_year=data["academic_year"],
                trimester=data["trimester"],
            )
            .exclude(pk=self.instance.pk if self.instance else None)
            .values_list("percentage", flat=True)
        )
        total = sum(existing_total, Decimal("0")) + data["percentage"]
        if total > Decimal("100"):
            raise serializers.ValidationError(
                {
                    "percentage": (
                        f"Le total des pourcentages serait {total}% (max 100%). "
                        f"Actuellement {total - data['percentage']}% utilisés."
                    )
                }
            )
        return data


# ═══════════════════════════════════════════════════════════════════════════
# Grade
# ═══════════════════════════════════════════════════════════════════════════


class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(
        source="exam_type.subject.name",
        read_only=True,
    )
    exam_name = serializers.CharField(source="exam_type.name", read_only=True)
    max_score = serializers.DecimalField(
        source="exam_type.max_score",
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )
    effective_score = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Grade
        fields = [
            "id",
            "student",
            "student_name",
            "exam_type",
            "exam_name",
            "subject_name",
            "score",
            "max_score",
            "effective_score",
            "is_absent",
            "is_published",
            "published_at",
            "published_by",
            "entered_by",
            "entered_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "entered_at",
            "updated_at",
            "published_at",
            "published_by",
        ]

    def get_student_name(self, obj):
        return _student_name(obj)


# ── Bulk enter ──────────────────────────────────────────────────────────


class GradeBulkItemSerializer(serializers.Serializer):
    """One item inside a bulk grade submission."""

    student_id = serializers.UUIDField()
    score = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        min_value=0,
        required=False,
        allow_null=True,
    )
    is_absent = serializers.BooleanField(default=False)


class GradeBulkEnterSerializer(serializers.Serializer):
    """POST /api/grades/bulk-enter/"""

    exam_type_id = serializers.UUIDField()
    grades = GradeBulkItemSerializer(many=True)


# ── Grade correct ──────────────────────────────────────────────────────


class GradeCorrectSerializer(serializers.Serializer):
    """POST /api/grades/{id}/correct/"""

    new_score = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0)
    reason = serializers.CharField(min_length=1)


# ── Grade publish by exam_type ─────────────────────────────────────────


class GradePublishSerializer(serializers.Serializer):
    """POST /api/grades/publish/"""

    exam_type_id = serializers.UUIDField()


# ═══════════════════════════════════════════════════════════════════════════
# SubjectAverage
# ═══════════════════════════════════════════════════════════════════════════


class SubjectAverageSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source="subject.name", read_only=True)
    effective_average = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = SubjectAverage
        fields = [
            "id",
            "student",
            "student_name",
            "subject",
            "subject_name",
            "classroom",
            "academic_year",
            "trimester",
            "calculated_average",
            "manual_override",
            "effective_average",
            "is_published",
            "published_at",
            "published_by",
            "is_locked",
            "locked_at",
            "locked_by",
            "last_calculated_at",
        ]
        read_only_fields = [
            "id",
            "calculated_average",
            "last_calculated_at",
            "published_at",
            "published_by",
            "locked_at",
            "locked_by",
        ]

    def get_student_name(self, obj):
        return _student_name(obj)


class SubjectAverageRecalcSerializer(serializers.Serializer):
    """POST /api/grades/subject-averages/recalculate/"""

    classroom_id = serializers.UUIDField()
    subject_id = serializers.UUIDField()
    trimester = serializers.IntegerField(min_value=1, max_value=3)


class SubjectAverageOverrideSerializer(serializers.Serializer):
    """POST /api/grades/subject-averages/override/"""

    subject_average_id = serializers.UUIDField()
    new_value = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=0, max_value=20
    )
    reason = serializers.CharField(min_length=1)


class SubjectAveragePublishSerializer(serializers.Serializer):
    """POST /api/grades/subject-averages/publish/"""

    classroom_id = serializers.UUIDField()
    subject_id = serializers.UUIDField()
    trimester = serializers.IntegerField(min_value=1, max_value=3)


# ═══════════════════════════════════════════════════════════════════════════
# TrimesterAverage
# ═══════════════════════════════════════════════════════════════════════════


class TrimesterAverageSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    effective_average = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = TrimesterAverage
        fields = [
            "id",
            "student",
            "student_name",
            "classroom",
            "academic_year",
            "trimester",
            "calculated_average",
            "manual_override",
            "effective_average",
            "rank_in_class",
            "rank_in_stream",
            "rank_in_level",
            "rank_in_section",
            "appreciation",
            "is_published",
            "published_at",
            "published_by",
            "is_locked",
            "locked_at",
            "locked_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "calculated_average",
            "rank_in_class",
            "rank_in_stream",
            "rank_in_level",
            "rank_in_section",
            "appreciation",
            "created_at",
            "updated_at",
            "published_at",
            "published_by",
            "locked_at",
            "locked_by",
        ]

    def get_student_name(self, obj):
        return _student_name(obj)


class TrimesterRecalcSerializer(serializers.Serializer):
    """POST /api/grades/trimester-averages/recalculate/"""

    classroom_id = serializers.UUIDField()
    trimester = serializers.IntegerField(min_value=1, max_value=3)


class TrimesterOverrideSerializer(serializers.Serializer):
    """POST /api/grades/trimester-averages/override/"""

    trimester_average_id = serializers.UUIDField()
    new_value = serializers.DecimalField(
        max_digits=5, decimal_places=2, min_value=0, max_value=20
    )
    reason = serializers.CharField(min_length=1)


class TrimesterPublishSerializer(serializers.Serializer):
    """POST /api/grades/trimester-averages/publish/"""

    classroom_id = serializers.UUIDField()
    trimester = serializers.IntegerField(min_value=1, max_value=3)


class TrimesterLockSerializer(serializers.Serializer):
    """POST /api/grades/trimester-averages/lock/"""

    classroom_id = serializers.UUIDField()
    trimester = serializers.IntegerField(min_value=1, max_value=3)


class TrimesterUnlockSerializer(serializers.Serializer):
    """POST /api/grades/trimester-averages/unlock/"""

    classroom_id = serializers.UUIDField()
    trimester = serializers.IntegerField(min_value=1, max_value=3)
    reason = serializers.CharField(min_length=1)


# ═══════════════════════════════════════════════════════════════════════════
# AnnualAverage
# ═══════════════════════════════════════════════════════════════════════════


class AnnualAverageSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    effective_average = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = AnnualAverage
        fields = [
            "id",
            "student",
            "student_name",
            "classroom",
            "academic_year",
            "calculated_average",
            "manual_override",
            "effective_average",
            "rank_in_class",
            "rank_in_level",
            "appreciation",
            "is_published",
            "is_locked",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "calculated_average",
            "rank_in_class",
            "rank_in_level",
            "appreciation",
            "created_at",
            "updated_at",
        ]

    def get_student_name(self, obj):
        return _student_name(obj)


# ═══════════════════════════════════════════════════════════════════════════
# GradeAppeal
# ═══════════════════════════════════════════════════════════════════════════


class GradeAppealSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(
        source="get_status_display",
        read_only=True,
    )
    appeal_type_display = serializers.CharField(
        source="get_appeal_type_display",
        read_only=True,
    )
    assigned_teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = GradeAppeal
        fields = [
            "id",
            "student",
            "student_name",
            "appeal_type",
            "appeal_type_display",
            "grade",
            "subject_average",
            "trimester_average",
            "reason",
            "student_comment",
            "status",
            "status_display",
            "assigned_to_teacher",
            "assigned_teacher_name",
            "assigned_to_admin",
            "response",
            "responded_by",
            "responded_at",
            "original_value",
            "corrected_value",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "assigned_to_teacher",
            "assigned_to_admin",
            "responded_by",
            "responded_at",
            "original_value",
            "corrected_value",
            "created_at",
            "updated_at",
        ]

    def get_student_name(self, obj):
        return _student_name(obj)

    def get_assigned_teacher_name(self, obj):
        if obj.assigned_to_teacher:
            try:
                return obj.assigned_to_teacher.user.get_full_name()
            except Exception:
                pass
        return None


class GradeAppealCreateSerializer(serializers.Serializer):
    """POST /api/grades/appeals/ — student creates an appeal."""

    appeal_type = serializers.ChoiceField(choices=GradeAppeal.AppealType.choices)
    grade_id = serializers.UUIDField(required=False, allow_null=True)
    subject_average_id = serializers.UUIDField(required=False, allow_null=True)
    trimester_average_id = serializers.UUIDField(required=False, allow_null=True)
    reason = serializers.CharField(min_length=1)
    student_comment = serializers.CharField(
        required=False, default="", allow_blank=True
    )

    def validate(self, data):
        """Ensure the correct FK is provided for the appeal_type."""
        at = data["appeal_type"]
        if at == GradeAppeal.AppealType.EXAM_GRADE and not data.get("grade_id"):
            raise serializers.ValidationError(
                {"grade_id": "Requis pour un recours sur note d'examen."}
            )
        if at == GradeAppeal.AppealType.SUBJECT_AVERAGE and not data.get(
            "subject_average_id"
        ):
            raise serializers.ValidationError(
                {"subject_average_id": "Requis pour un recours sur moyenne matière."}
            )
        if at == GradeAppeal.AppealType.TRIMESTER_AVERAGE and not data.get(
            "trimester_average_id"
        ):
            raise serializers.ValidationError(
                {
                    "trimester_average_id": "Requis pour un recours sur moyenne trimestrielle."
                }
            )
        return data


class GradeAppealRespondSerializer(serializers.Serializer):
    """POST /api/grades/appeals/{id}/respond/"""

    status = serializers.ChoiceField(
        choices=[GradeAppeal.Status.ACCEPTED, GradeAppeal.Status.REJECTED],
    )
    response = serializers.CharField(required=True, min_length=1)
    corrected_value = serializers.DecimalField(
        max_digits=5,
        decimal_places=2,
        required=False,
        allow_null=True,
    )


# ═══════════════════════════════════════════════════════════════════════════
# ReportCard
# ═══════════════════════════════════════════════════════════════════════════


class ReportCardSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = ReportCard
        fields = [
            "id",
            "student",
            "student_name",
            "class_obj",
            "academic_year",
            "trimester",
            "general_average",
            "rank",
            "total_students",
            "admin_comment",
            "teacher_comment",
            "pdf_url",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "general_average",
            "rank",
            "total_students",
            "pdf_url",
            "created_at",
            "updated_at",
        ]

    def get_student_name(self, obj):
        return _student_name(obj)


# ═══════════════════════════════════════════════════════════════════════════
# GRADE AUDIT LOG
# ═══════════════════════════════════════════════════════════════════════════


class GradeAuditLogSerializer(serializers.ModelSerializer):
    """Read-only serializer for the audit timeline."""

    performed_by_name = serializers.SerializerMethodField()
    action_label = serializers.SerializerMethodField()

    class Meta:
        model = GradeAuditLog
        fields = [
            "id",
            "action",
            "action_label",
            "performed_by",
            "performed_by_name",
            "old_value",
            "new_value",
            "reason",
            "subject_name",
            "exam_name",
            "trimester",
            "ip_address",
            "created_at",
        ]

    def get_performed_by_name(self, obj):
        u = obj.performed_by
        if u is None:
            return "Système"
        return f"{u.first_name} {u.last_name}".strip() or str(u)

    def get_action_label(self, obj):
        return obj.get_action_display()
