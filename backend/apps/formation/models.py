"""
Formation app models — Training center management.

All models inherit from TenantModel (school FK, soft delete, audit)
to guarantee multi-tenant isolation.
"""

import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from core.models import TenantModel


# =====================================================================
# Department
# =====================================================================


class Department(TenantModel):
    """
    A department within a training center (e.g. Langues, Informatique).
    """

    name = models.CharField(max_length=200)
    color = models.CharField(
        max_length=7,
        default="#3B82F6",
        help_text="Hex colour for UI display, e.g. #3B82F6",
    )
    description = models.TextField(blank=True, default="")
    head = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="headed_departments",
        help_text="Department head (formateur or admin)",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "formation_departments"
        unique_together = ("school", "name")
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} — {self.school.name}"


# =====================================================================
# Formation (training programme)
# =====================================================================


class Formation(TenantModel):
    """
    A training programme offered by a center.
    """

    class AudienceType(models.TextChoices):
        CHILDREN = "CHILDREN", "Enfants"
        TEENAGERS = "TEENAGERS", "Adolescents"
        ADULTS = "ADULTS", "Adultes"
        MIXED = "MIXED", "Mixte"

    class EvaluationMode(models.TextChoices):
        PLACEMENT_TEST = "PLACEMENT_TEST", "Test de placement"
        INTERVIEW = "INTERVIEW", "Entretien"
        SELF_ASSESSMENT = "SELF_ASSESSMENT", "Auto-évaluation"
        NONE = "NONE", "Aucun"

    name = models.CharField(max_length=300)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name="formations",
    )
    description = models.TextField(blank=True, default="")
    audience = models.CharField(
        max_length=20,
        choices=AudienceType.choices,
        default=AudienceType.MIXED,
    )
    total_duration_hours = models.PositiveIntegerField(
        help_text="Total duration of the programme in hours",
    )
    prerequisites = models.TextField(
        blank=True,
        default="",
        help_text="Prerequisites to enrol in this formation",
    )
    entry_evaluation_mode = models.CharField(
        max_length=20,
        choices=EvaluationMode.choices,
        default=EvaluationMode.NONE,
    )

    # Internal levels — JSON list, e.g. ["A1","A2","B1","B2","C1","C2"]
    # or ["Débutant","Intermédiaire","Avancé"]
    levels = models.JSONField(
        default=list,
        blank=True,
        help_text='Ordered list of internal levels, e.g. ["A1","A2","B1","B2"]',
    )

    # Pricing
    fee_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Base fee (DZD) — interpreted per billing_cycle",
    )

    class BillingCycle(models.TextChoices):
        MONTHLY = "MONTHLY", "Mensuel"
        PER_SESSION = "PER_SESSION", "Par session"
        PER_MODULE = "PER_MODULE", "Par module"
        HOURLY = "HOURLY", "Horaire"
        FIXED = "FIXED", "Forfait global"

    billing_cycle = models.CharField(
        max_length=15,
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY,
    )
    registration_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="One-time registration fee (DZD)",
    )

    group_duration_weeks = models.PositiveIntegerField(
        default=12,
        help_text="Default duration of a group in weeks",
    )
    max_learners_per_group = models.PositiveIntegerField(
        default=20,
        help_text="Maximum learners per group",
    )
    materials_provided = models.TextField(
        blank=True,
        default="",
        help_text="Materials included (books, software, etc.)",
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "formations"
        unique_together = ("school", "name", "department")
        ordering = ["department__name", "name"]

    def __str__(self):
        return f"{self.name} ({self.department.name})"


# =====================================================================
# TrainingGroup (equivalent of "Class" for schools)
# =====================================================================


class TrainingGroup(TenantModel):
    """
    A group of learners for a specific formation and level.
    """

    class GroupStatus(models.TextChoices):
        OPEN = "OPEN", "Ouvert"
        FULL = "FULL", "Complet"
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        COMPLETED = "COMPLETED", "Terminé"
        CANCELLED = "CANCELLED", "Annulé"

    name = models.CharField(max_length=200)
    formation = models.ForeignKey(
        Formation,
        on_delete=models.CASCADE,
        related_name="groups",
    )
    trainer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="training_groups",
        help_text="Formateur assigned to this group",
    )
    level = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Level within the formation (e.g. A1, Débutant)",
    )
    room = models.ForeignKey(
        "academics.Room",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="training_groups",
    )
    capacity = models.PositiveIntegerField(default=20)
    start_date = models.DateField()
    end_date = models.DateField()
    sessions_per_week = models.PositiveIntegerField(default=2)
    status = models.CharField(
        max_length=15,
        choices=GroupStatus.choices,
        default=GroupStatus.OPEN,
    )

    class Meta:
        db_table = "training_groups"
        ordering = ["-start_date", "name"]

    def __str__(self):
        return f"{self.name} — {self.formation.name}"

    @property
    def enrolled_count(self):
        return self.enrollments.filter(
            status__in=(
                TrainingEnrollment.EnrollmentStatus.ACTIVE,
                TrainingEnrollment.EnrollmentStatus.COMPLETED,
            ),
            is_deleted=False,
        ).count()

    @property
    def is_full(self):
        return self.enrolled_count >= self.capacity


# =====================================================================
# TrainingEnrollment
# =====================================================================


class TrainingEnrollment(TenantModel):
    """
    Enrollment of a learner in a training group.
    """

    class EnrollmentStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "Actif"
        SUSPENDED = "SUSPENDED", "Suspendu"
        PENDING_PAYMENT = "PENDING_PAYMENT", "En attente de paiement"
        COMPLETED = "COMPLETED", "Terminé"
        DROPPED = "DROPPED", "Abandonné"
        WAITLIST = "WAITLIST", "Liste d'attente"

    learner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="training_enrollments",
    )
    group = models.ForeignKey(
        TrainingGroup,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    enrollment_date = models.DateField(default=timezone.now)
    status = models.CharField(
        max_length=20,
        choices=EnrollmentStatus.choices,
        default=EnrollmentStatus.PENDING_PAYMENT,
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "training_enrollments"
        unique_together = ("learner", "group")
        ordering = ["-enrollment_date"]

    def __str__(self):
        return f"{self.learner.full_name} → {self.group.name}"

    def clean(self):
        if (
            self.status == self.EnrollmentStatus.ACTIVE
            and self.group.is_full
            and not self.pk  # new enrollment
        ):
            raise ValidationError(
                "Ce groupe est complet. L'apprenant sera placé en liste d'attente."
            )


# =====================================================================
# PlacementTest
# =====================================================================


class PlacementTest(TenantModel):
    """
    Result of a placement test for a learner before enrollment.
    """

    learner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="placement_tests",
    )
    formation = models.ForeignKey(
        Formation,
        on_delete=models.CASCADE,
        related_name="placement_tests",
    )
    test_date = models.DateField(default=timezone.now)
    score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Score obtained (e.g. 75.50)",
    )
    max_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("100.00"),
    )
    suggested_level = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Level suggested based on test result",
    )
    notes = models.TextField(blank=True, default="")
    validated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validated_placements",
    )
    is_validated = models.BooleanField(default=False)

    class Meta:
        db_table = "placement_tests"
        ordering = ["-test_date"]

    def __str__(self):
        return (
            f"{self.learner.full_name} — {self.formation.name} — {self.suggested_level}"
        )


# =====================================================================
# TrainingSession (equivalent of a class session / séance)
# =====================================================================


class TrainingSession(TenantModel):
    """
    An individual session (séance) within a training group.
    """

    class SessionStatus(models.TextChoices):
        SCHEDULED = "SCHEDULED", "Planifiée"
        COMPLETED = "COMPLETED", "Réalisée"
        CANCELLED = "CANCELLED", "Annulée"
        MAKEUP = "MAKEUP", "Rattrapage"

    group = models.ForeignKey(
        TrainingGroup,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.ForeignKey(
        "academics.Room",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="training_sessions",
    )
    trainer = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="training_sessions",
        help_text="Override trainer for this specific session",
    )
    status = models.CharField(
        max_length=12,
        choices=SessionStatus.choices,
        default=SessionStatus.SCHEDULED,
    )
    cancellation_reason = models.TextField(blank=True, default="")
    topic = models.CharField(
        max_length=300,
        blank=True,
        default="",
        help_text="Subject/topic covered in this session",
    )

    class Meta:
        db_table = "training_sessions"
        ordering = ["date", "start_time"]

    def __str__(self):
        return f"{self.group.name} — {self.date} {self.start_time}"

    def clean(self):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("L'heure de fin doit être après l'heure de début.")


# =====================================================================
# SessionAttendance
# =====================================================================


class SessionAttendance(TenantModel):
    """
    Attendance record for a learner in a training session.
    """

    class AttendanceStatus(models.TextChoices):
        PRESENT = "PRESENT", "Présent"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "En retard"
        EXCUSED = "EXCUSED", "Excusé"

    session = models.ForeignKey(
        TrainingSession,
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    learner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="training_attendances",
    )
    status = models.CharField(
        max_length=10,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT,
    )
    note = models.TextField(blank=True, default="")

    class Meta:
        db_table = "session_attendances"
        unique_together = ("session", "learner")
        ordering = ["learner__last_name"]

    def __str__(self):
        return f"{self.learner.full_name} — {self.get_status_display()}"


# =====================================================================
# LevelPassage (level promotion)
# =====================================================================


class LevelPassage(TenantModel):
    """
    Records a learner's passage from one level to the next within a formation.
    """

    class Decision(models.TextChoices):
        PROMOTED = "PROMOTED", "Promu"
        MAINTAINED = "MAINTAINED", "Maintenu"
        PENDING = "PENDING", "En attente"

    learner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="level_passages",
    )
    formation = models.ForeignKey(
        Formation,
        on_delete=models.CASCADE,
        related_name="level_passages",
    )
    from_level = models.CharField(max_length=50)
    to_level = models.CharField(max_length=50)

    # Criteria
    min_attendance_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("80.00"),
        help_text="Minimum attendance percentage required",
    )
    min_grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("50.00"),
        help_text="Minimum grade/score required",
    )
    actual_attendance_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )
    actual_grade = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    decision = models.CharField(
        max_length=12,
        choices=Decision.choices,
        default=Decision.PENDING,
    )
    decided_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="level_decisions",
    )
    decision_date = models.DateField(null=True, blank=True)
    certificate_generated = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "level_passages"
        ordering = ["-decision_date"]

    def __str__(self):
        return (
            f"{self.learner.full_name}: {self.from_level} → {self.to_level} "
            f"({self.get_decision_display()})"
        )


# =====================================================================
# Certificate
# =====================================================================


class Certificate(TenantModel):
    """
    Certificate / attestation issued to a learner.
    """

    class CertificateType(models.TextChoices):
        ATTENDANCE = "ATTENDANCE", "Attestation de présence"
        COMPLETION = "COMPLETION", "Attestation de réussite"
        LEVEL = "LEVEL", "Attestation de niveau"

    learner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    formation = models.ForeignKey(
        Formation,
        on_delete=models.CASCADE,
        related_name="certificates",
    )
    certificate_type = models.CharField(
        max_length=15,
        choices=CertificateType.choices,
    )
    level_achieved = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Level attested (e.g. B1, Intermédiaire)",
    )
    reference_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True,
        help_text="Auto-generated, e.g. CERT-2026-00001",
    )
    issue_date = models.DateField(default=timezone.now)
    content = models.TextField(
        blank=True,
        default="",
        help_text="Full certificate text / body",
    )
    pdf_file = models.FileField(
        upload_to="certificates/",
        blank=True,
        null=True,
    )
    issued_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="issued_certificates",
    )

    class Meta:
        db_table = "certificates"
        ordering = ["-issue_date"]

    def __str__(self):
        return (
            f"{self.get_certificate_type_display()} — {self.learner.full_name} — "
            f"{self.formation.name}"
        )

    def save(self, *args, **kwargs):
        if not self.reference_number:
            year = self.issue_date.year if self.issue_date else timezone.now().year
            last = (
                Certificate.objects.filter(reference_number__startswith=f"CERT-{year}-")
                .order_by("-reference_number")
                .values_list("reference_number", flat=True)
                .first()
            )
            if last:
                seq = int(last.split("-")[-1]) + 1
            else:
                seq = 1
            self.reference_number = f"CERT-{year}-{seq:05d}"
        super().save(*args, **kwargs)


# =====================================================================
# CrossInstitutionProfile + InstitutionMembership
# =====================================================================


class CrossInstitutionProfile(models.Model):
    """
    Internal-only link that tracks when the same physical person
    is enrolled in multiple institutions.
    NEVER exposed to institution APIs — only visible to SUPER_ADMIN.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Canonical identity fields (for matching)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, blank=True, default="")
    national_id = models.CharField(
        max_length=30,
        blank=True,
        default="",
        help_text="National ID for deduplication",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "cross_institution_profiles"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class InstitutionMembership(models.Model):
    """
    Links a CrossInstitutionProfile to a specific User account
    at a specific institution. Internal use only.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        CrossInstitutionProfile,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="institution_memberships",
    )
    school = models.ForeignKey(
        "schools.School",
        on_delete=models.CASCADE,
        related_name="cross_memberships",
    )
    role = models.CharField(max_length=30)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "institution_memberships"
        unique_together = ("profile", "user", "school")

    def __str__(self):
        return f"{self.profile} @ {self.school.name} ({self.role})"


# =====================================================================
# Formation Finance
# =====================================================================


class FormationFeeStructure(TenantModel):
    """
    Fee structure specific to a formation.
    Supports multiple billing cycles and registration fees.
    """

    formation = models.ForeignKey(
        Formation,
        on_delete=models.CASCADE,
        related_name="fee_structures",
    )
    name = models.CharField(
        max_length=200,
        help_text="e.g. Frais Anglais B1 — Session Automne 2026",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Fee amount per billing cycle (DZD)",
    )

    class BillingCycle(models.TextChoices):
        MONTHLY = "MONTHLY", "Mensuel"
        PER_SESSION = "PER_SESSION", "Par session"
        PER_MODULE = "PER_MODULE", "Par module"
        HOURLY = "HOURLY", "Horaire"
        FIXED = "FIXED", "Forfait global"

    billing_cycle = models.CharField(
        max_length=15,
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY,
    )
    registration_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "formation_fee_structures"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.amount} DA/{self.get_billing_cycle_display()}"


class LearnerPayment(TenantModel):
    """
    Payment record for a learner in a training center.
    """

    class PaymentMethod(models.TextChoices):
        ESPECES = "especes", "Espèces"
        BARIDIMOB = "baridimob", "BaridiMob"
        CIB = "cib", "CIB"
        VIREMENT = "virement", "Virement bancaire"

    class PaymentStatus(models.TextChoices):
        PAID = "PAID", "Payé"
        PARTIAL = "PARTIAL", "Partiel"
        PENDING = "PENDING", "En attente"
        REFUNDED = "REFUNDED", "Remboursé"

    learner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="learner_payments",
    )
    fee_structure = models.ForeignKey(
        FormationFeeStructure,
        on_delete=models.CASCADE,
        related_name="payments",
        null=True,
        blank=True,
    )
    group = models.ForeignKey(
        TrainingGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(default=timezone.now)
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
        default=PaymentMethod.ESPECES,
    )
    receipt_number = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
        help_text="Auto-generated, e.g. FPAY-2026-00001",
    )
    status = models.CharField(
        max_length=10,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PAID,
    )
    is_registration_fee = models.BooleanField(
        default=False,
        help_text="Whether this payment covers registration fee",
    )
    notes = models.TextField(blank=True, default="")
    recorded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_learner_payments",
    )

    class Meta:
        db_table = "learner_payments"
        ordering = ["-payment_date"]

    def __str__(self):
        return f"{self.learner.full_name} — {self.amount} DA — {self.receipt_number}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            year = self.payment_date.year if self.payment_date else timezone.now().year
            last = (
                LearnerPayment.objects.filter(
                    receipt_number__startswith=f"FPAY-{year}-"
                )
                .order_by("-receipt_number")
                .values_list("receipt_number", flat=True)
                .first()
            )
            seq = int(last.split("-")[-1]) + 1 if last else 1
            self.receipt_number = f"FPAY-{year}-{seq:05d}"
        super().save(*args, **kwargs)


class Discount(TenantModel):
    """
    Discount that can be applied to a learner's fee.
    """

    class DiscountType(models.TextChoices):
        PERCENTAGE = "PERCENTAGE", "Pourcentage"
        FIXED = "FIXED", "Montant fixe"

    name = models.CharField(max_length=200)
    discount_type = models.CharField(
        max_length=12,
        choices=DiscountType.choices,
        default=DiscountType.PERCENTAGE,
    )
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Percentage or fixed amount",
    )
    applicable_formations = models.ManyToManyField(
        Formation,
        blank=True,
        related_name="discounts",
        help_text="If empty, applies to all formations",
    )
    conditions = models.TextField(
        blank=True,
        default="",
        help_text="E.g. siblings, early registration, group discount",
    )
    is_active = models.BooleanField(default=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "formation_discounts"
        ordering = ["name"]

    def __str__(self):
        if self.discount_type == self.DiscountType.PERCENTAGE:
            return f"{self.name} ({self.value}%)"
        return f"{self.name} ({self.value} DA)"

    def compute(self, base_amount):
        if self.discount_type == self.DiscountType.PERCENTAGE:
            return round(base_amount * self.value / Decimal("100"), 2)
        return min(self.value, base_amount)


class LearnerDiscount(TenantModel):
    """
    Links a discount to a specific learner enrollment.
    """

    learner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="learner_discounts",
    )
    discount = models.ForeignKey(
        Discount,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    group = models.ForeignKey(
        TrainingGroup,
        on_delete=models.CASCADE,
        related_name="applied_discounts",
    )
    applied_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Actual discount amount applied",
    )

    class Meta:
        db_table = "learner_discounts"
        unique_together = ("learner", "discount", "group")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.learner.full_name} — {self.discount.name} — {self.applied_amount} DA"


# =====================================================================
# Trainer Payroll (vacataire / hourly-based)
# =====================================================================


class TrainerSalaryConfig(TenantModel):
    """
    Salary configuration for trainers (formateurs).
    Extends the concept of SalaryConfig for training centers.
    """

    class ContractType(models.TextChoices):
        PERMANENT = "PERMANENT", "Permanent"
        VACATAIRE = "VACATAIRE", "Vacataire (horaire)"
        CONTRACT = "CONTRACT", "Contractuel"

    trainer = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="trainer_salary_config",
    )
    contract_type = models.CharField(
        max_length=12,
        choices=ContractType.choices,
        default=ContractType.VACATAIRE,
    )
    base_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Monthly base salary (DZD) — for permanent/contract only",
    )
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Rate per hour (DZD) — primary for vacataires",
    )
    bank_account = models.CharField(max_length=30, blank=True, default="")
    hire_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "trainer_salary_configs"

    def __str__(self):
        rate = (
            self.hourly_rate if self.contract_type == "VACATAIRE" else self.base_salary
        )
        return f"{self.trainer.full_name} — {rate} DA"


class TrainerPaySlip(TenantModel):
    """
    Simplified pay slip for trainers.
    For vacataires, computed from actual hours taught.
    """

    class PaySlipStatus(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        VALIDATED = "VALIDATED", "Validé"
        PAID = "PAID", "Payé"

    trainer = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="trainer_payslips",
    )
    month = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    year = models.PositiveIntegerField()

    # Hours
    total_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Total hours taught this month",
    )
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    hours_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="total_hours × hourly_rate",
    )

    # Base (for permanent/contract)
    base_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )

    gross_salary = models.DecimalField(max_digits=10, decimal_places=2)
    deductions_detail = models.JSONField(
        default=list,
        blank=True,
        help_text='[{"name":"CNAS","amount":1500},...]',
    )
    total_deductions = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    net_salary = models.DecimalField(max_digits=10, decimal_places=2)

    reference = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
        help_text="Auto-generated, e.g. TFDP-2026-03-00001",
    )
    status = models.CharField(
        max_length=10,
        choices=PaySlipStatus.choices,
        default=PaySlipStatus.DRAFT,
    )

    class Meta:
        db_table = "trainer_payslips"
        unique_together = ("trainer", "month", "year", "school")
        ordering = ["-year", "-month"]

    def __str__(self):
        return f"{self.trainer.full_name} — {self.month}/{self.year} — {self.net_salary} DA"

    def save(self, *args, **kwargs):
        if not self.reference:
            prefix = f"TFDP-{self.year}-{self.month:02d}"
            last = (
                TrainerPaySlip.objects.filter(reference__startswith=prefix)
                .order_by("-reference")
                .values_list("reference", flat=True)
                .first()
            )
            seq = int(last.split("-")[-1]) + 1 if last else 1
            self.reference = f"{prefix}-{seq:05d}"
        super().save(*args, **kwargs)
