"""
Formation serializers with dynamic terminology.

The terminology adapter translates school-centric labels
(élève, classe, enseignant, bulletin, trimestre) into
training-center terminology (apprenant, groupe, formateur,
attestation, session) so that API responses use the appropriate
language regardless of institution type.
"""

from rest_framework import serializers

from core.serializers import TenantAwareSerializer

from .models import (
    Certificate,
    CrossInstitutionProfile,
    Department,
    Discount,
    Formation,
    FormationFeeStructure,
    LearnerDiscount,
    LearnerPayment,
    LevelPassage,
    PlacementTest,
    SessionAttendance,
    TrainerPaySlip,
    TrainerSalaryConfig,
    TrainingEnrollment,
    TrainingGroup,
    TrainingSession,
)


# =====================================================================
# Dynamic terminology
# =====================================================================

SCHOOL_TO_TRAINING_TERMS = {
    "élève": "apprenant",
    "élèves": "apprenants",
    "classe": "groupe",
    "classes": "groupes",
    "enseignant": "formateur",
    "enseignants": "formateurs",
    "bulletin": "attestation",
    "bulletins": "attestations",
    "trimestre": "session",
    "trimestres": "sessions",
    "professeur": "formateur",
    "professeurs": "formateurs",
    "cours": "séance",
    "note": "évaluation",
    "notes": "évaluations",
    "matière": "module",
    "matières": "modules",
}


def adapt_terminology(data, is_training_center=True):
    """
    Recursively adapt terminology in a serializer's output dict.
    Replaces school terminology keys/values with training-center equivalents.
    """
    if not is_training_center:
        return data

    if isinstance(data, dict):
        adapted = {}
        for key, value in data.items():
            new_key = SCHOOL_TO_TRAINING_TERMS.get(key, key)
            adapted[new_key] = adapt_terminology(value, is_training_center)
        return adapted
    elif isinstance(data, list):
        return [adapt_terminology(item, is_training_center) for item in data]
    elif isinstance(data, str):
        result = data
        for school_term, training_term in SCHOOL_TO_TRAINING_TERMS.items():
            result = result.replace(school_term, training_term)
        return result
    return data


class TerminologyMixin:
    """
    Mixin for serializers that adapts terminology based on institution type.
    """

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get("request")
        if request and hasattr(request, "user") and request.user.is_authenticated:
            school = getattr(request.user, "school", None)
            if school and school.school_category == "TRAINING_CENTER":
                data["_terminology"] = "formation"
            else:
                data["_terminology"] = "school"
        return data


# =====================================================================
# Department
# =====================================================================


class DepartmentSerializer(TenantAwareSerializer):
    formation_count = serializers.SerializerMethodField()
    head_name = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "color",
            "description",
            "head",
            "head_name",
            "is_active",
            "formation_count",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_formation_count(self, obj):
        return obj.formations.filter(is_deleted=False).count()

    def get_head_name(self, obj):
        return obj.head.full_name if obj.head else None


# =====================================================================
# Formation
# =====================================================================


class FormationSerializer(TenantAwareSerializer):
    department_name = serializers.SerializerMethodField()
    group_count = serializers.SerializerMethodField()
    active_learners = serializers.SerializerMethodField()

    class Meta:
        model = Formation
        fields = [
            "id",
            "name",
            "department",
            "department_name",
            "description",
            "audience",
            "total_duration_hours",
            "prerequisites",
            "entry_evaluation_mode",
            "levels",
            "fee_amount",
            "billing_cycle",
            "registration_fee",
            "group_duration_weeks",
            "max_learners_per_group",
            "materials_provided",
            "is_active",
            "group_count",
            "active_learners",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None

    def get_group_count(self, obj):
        return obj.groups.filter(is_deleted=False).count()

    def get_active_learners(self, obj):
        return TrainingEnrollment.objects.filter(
            group__formation=obj,
            status=TrainingEnrollment.EnrollmentStatus.ACTIVE,
            is_deleted=False,
        ).count()


class FormationListSerializer(TenantAwareSerializer):
    """Lightweight serializer for list views."""

    department_name = serializers.SerializerMethodField()

    class Meta:
        model = Formation
        fields = [
            "id",
            "name",
            "department",
            "department_name",
            "audience",
            "total_duration_hours",
            "fee_amount",
            "billing_cycle",
            "is_active",
        ]

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None


# =====================================================================
# TrainingGroup
# =====================================================================


class TrainingGroupSerializer(TenantAwareSerializer):
    formation_name = serializers.SerializerMethodField()
    trainer_name = serializers.SerializerMethodField()
    room_name = serializers.SerializerMethodField()
    enrolled_count = serializers.IntegerField(
        read_only=True, source="enrolled_count_cached", default=0
    )
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = TrainingGroup
        fields = [
            "id",
            "name",
            "formation",
            "formation_name",
            "trainer",
            "trainer_name",
            "level",
            "room",
            "room_name",
            "capacity",
            "start_date",
            "end_date",
            "sessions_per_week",
            "status",
            "enrolled_count",
            "is_full",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_formation_name(self, obj):
        return obj.formation.name if obj.formation else None

    def get_trainer_name(self, obj):
        return obj.trainer.full_name if obj.trainer else None

    def get_room_name(self, obj):
        return obj.room.name if obj.room else None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Override enrolled_count with property
        data["enrolled_count"] = instance.enrolled_count
        data["is_full"] = instance.is_full
        return data


# =====================================================================
# TrainingEnrollment
# =====================================================================


class TrainingEnrollmentSerializer(TenantAwareSerializer):
    learner_name = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    formation_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainingEnrollment
        fields = [
            "id",
            "learner",
            "learner_name",
            "group",
            "group_name",
            "formation_name",
            "enrollment_date",
            "status",
            "notes",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_learner_name(self, obj):
        return obj.learner.full_name if obj.learner else None

    def get_group_name(self, obj):
        return obj.group.name if obj.group else None

    def get_formation_name(self, obj):
        return obj.group.formation.name if obj.group else None


# =====================================================================
# PlacementTest
# =====================================================================


class PlacementTestSerializer(TenantAwareSerializer):
    learner_name = serializers.SerializerMethodField()
    formation_name = serializers.SerializerMethodField()
    validated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = PlacementTest
        fields = [
            "id",
            "learner",
            "learner_name",
            "formation",
            "formation_name",
            "test_date",
            "score",
            "max_score",
            "suggested_level",
            "notes",
            "validated_by",
            "validated_by_name",
            "is_validated",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_learner_name(self, obj):
        return obj.learner.full_name if obj.learner else None

    def get_formation_name(self, obj):
        return obj.formation.name if obj.formation else None

    def get_validated_by_name(self, obj):
        return obj.validated_by.full_name if obj.validated_by else None


# =====================================================================
# TrainingSession
# =====================================================================


class TrainingSessionSerializer(TenantAwareSerializer):
    group_name = serializers.SerializerMethodField()
    trainer_name = serializers.SerializerMethodField()
    room_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainingSession
        fields = [
            "id",
            "group",
            "group_name",
            "date",
            "start_time",
            "end_time",
            "room",
            "room_name",
            "trainer",
            "trainer_name",
            "status",
            "cancellation_reason",
            "topic",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_group_name(self, obj):
        return obj.group.name if obj.group else None

    def get_trainer_name(self, obj):
        trainer = obj.trainer or (obj.group.trainer if obj.group else None)
        return trainer.full_name if trainer else None

    def get_room_name(self, obj):
        room = obj.room or (obj.group.room if obj.group else None)
        return room.name if room else None


# =====================================================================
# SessionAttendance
# =====================================================================


class SessionAttendanceSerializer(TenantAwareSerializer):
    learner_name = serializers.SerializerMethodField()

    class Meta:
        model = SessionAttendance
        fields = [
            "id",
            "session",
            "learner",
            "learner_name",
            "status",
            "note",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_learner_name(self, obj):
        return obj.learner.full_name if obj.learner else None


class BulkSessionAttendanceSerializer(serializers.Serializer):
    """For bulk marking attendance for a session."""

    session = serializers.UUIDField()
    attendances = serializers.ListField(
        child=serializers.DictField(child=serializers.CharField()),
        help_text='[{"learner":"uuid","status":"PRESENT","note":""}]',
    )


# =====================================================================
# LevelPassage
# =====================================================================


class LevelPassageSerializer(TenantAwareSerializer):
    learner_name = serializers.SerializerMethodField()
    formation_name = serializers.SerializerMethodField()

    class Meta:
        model = LevelPassage
        fields = [
            "id",
            "learner",
            "learner_name",
            "formation",
            "formation_name",
            "from_level",
            "to_level",
            "min_attendance_pct",
            "min_grade",
            "actual_attendance_pct",
            "actual_grade",
            "decision",
            "decided_by",
            "decision_date",
            "certificate_generated",
            "notes",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_learner_name(self, obj):
        return obj.learner.full_name if obj.learner else None

    def get_formation_name(self, obj):
        return obj.formation.name if obj.formation else None


# =====================================================================
# Certificate
# =====================================================================


class CertificateSerializer(TenantAwareSerializer):
    learner_name = serializers.SerializerMethodField()
    formation_name = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            "id",
            "learner",
            "learner_name",
            "formation",
            "formation_name",
            "certificate_type",
            "level_achieved",
            "reference_number",
            "issue_date",
            "content",
            "pdf_file",
            "issued_by",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "reference_number",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_learner_name(self, obj):
        return obj.learner.full_name if obj.learner else None

    def get_formation_name(self, obj):
        return obj.formation.name if obj.formation else None


# =====================================================================
# Formation Finance
# =====================================================================


class FormationFeeStructureSerializer(TenantAwareSerializer):
    formation_name = serializers.SerializerMethodField()

    class Meta:
        model = FormationFeeStructure
        fields = [
            "id",
            "formation",
            "formation_name",
            "name",
            "amount",
            "billing_cycle",
            "registration_fee",
            "description",
            "is_active",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_formation_name(self, obj):
        return obj.formation.name if obj.formation else None


class LearnerPaymentSerializer(TenantAwareSerializer):
    learner_name = serializers.SerializerMethodField()

    class Meta:
        model = LearnerPayment
        fields = [
            "id",
            "learner",
            "learner_name",
            "fee_structure",
            "group",
            "amount",
            "payment_date",
            "payment_method",
            "receipt_number",
            "status",
            "is_registration_fee",
            "notes",
            "recorded_by",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "receipt_number",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_learner_name(self, obj):
        return obj.learner.full_name if obj.learner else None


class DiscountSerializer(TenantAwareSerializer):
    class Meta:
        model = Discount
        fields = [
            "id",
            "name",
            "discount_type",
            "value",
            "applicable_formations",
            "conditions",
            "is_active",
            "valid_from",
            "valid_until",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]


class LearnerDiscountSerializer(TenantAwareSerializer):
    learner_name = serializers.SerializerMethodField()
    discount_name = serializers.SerializerMethodField()

    class Meta:
        model = LearnerDiscount
        fields = [
            "id",
            "learner",
            "learner_name",
            "discount",
            "discount_name",
            "group",
            "applied_amount",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_learner_name(self, obj):
        return obj.learner.full_name if obj.learner else None

    def get_discount_name(self, obj):
        return obj.discount.name if obj.discount else None


# =====================================================================
# Trainer Payroll
# =====================================================================


class TrainerSalaryConfigSerializer(TenantAwareSerializer):
    trainer_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainerSalaryConfig
        fields = [
            "id",
            "trainer",
            "trainer_name",
            "contract_type",
            "base_salary",
            "hourly_rate",
            "bank_account",
            "hire_date",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at", "updated_at"]

    def get_trainer_name(self, obj):
        return obj.trainer.full_name if obj.trainer else None


class TrainerPaySlipSerializer(TenantAwareSerializer):
    trainer_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainerPaySlip
        fields = [
            "id",
            "trainer",
            "trainer_name",
            "month",
            "year",
            "total_hours",
            "hourly_rate",
            "hours_amount",
            "base_salary",
            "gross_salary",
            "deductions_detail",
            "total_deductions",
            "net_salary",
            "reference",
            "status",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "reference",
            "school",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def get_trainer_name(self, obj):
        return obj.trainer.full_name if obj.trainer else None


# =====================================================================
# Cross-institution (SUPER_ADMIN only)
# =====================================================================


class CrossInstitutionProfileSerializer(serializers.ModelSerializer):
    memberships = serializers.SerializerMethodField()

    class Meta:
        model = CrossInstitutionProfile
        fields = [
            "id",
            "first_name",
            "last_name",
            "phone_number",
            "national_id",
            "memberships",
            "created_at",
        ]

    def get_memberships(self, obj):
        return [
            {
                "id": str(m.id),
                "school_id": str(m.school_id),
                "school_name": m.school.name,
                "role": m.role,
                "user_id": str(m.user_id),
                "joined_at": m.joined_at.isoformat(),
            }
            for m in obj.memberships.select_related("school").all()
        ]


# =====================================================================
# Terminology endpoint serializer
# =====================================================================


class TerminologySerializer(serializers.Serializer):
    """Returns the adapted terminology for the user's institution type."""

    institution_type = serializers.CharField()
    terms = serializers.DictField()
