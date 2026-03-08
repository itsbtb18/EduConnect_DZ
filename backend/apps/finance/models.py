"""
Finance models: fee structures, student payments, fee enrollment tracking.
"""

import datetime

from django.db import models
from django.utils import timezone

from core.models import TenantModel


class FeeStructure(TenantModel):
    """Fee configuration for a school / academic year, optionally per section."""

    name = models.CharField(
        max_length=200,
        help_text="e.g. Frais de scolarité 2026-2027",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="fee_structures",
    )
    section = models.ForeignKey(
        "schools.Section",
        on_delete=models.CASCADE,
        related_name="fee_structures",
        null=True,
        blank=True,
        help_text="If set, this fee applies only to that section (Primary/Middle/High).",
    )
    amount_monthly = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Monthly instalment amount (DZD)",
    )
    amount_trimester = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Trimester amount (DZD)",
    )
    amount_annual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Full annual amount (DZD)",
    )
    due_date = models.DateField(
        null=True,
        blank=True,
        help_text="Default due date. Overridden per student in StudentFeeEnrollment.",
    )
    description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "fee_structures"
        ordering = ["-created_at"]

    def __str__(self):
        section_str = f" — {self.section.name}" if self.section else ""
        return f"{self.name}{section_str}"


class StudentPayment(TenantModel):
    """A payment record for a student."""

    class PaymentType(models.TextChoices):
        MENSUEL = "mensuel", "Mensuel"
        TRIMESTRIEL = "trimestriel", "Trimestriel"
        ANNUEL = "annuel", "Annuel"

    class PaymentMethod(models.TextChoices):
        ESPECES = "especes", "Espèces"
        BARIDIMOB = "baridimob", "BaridiMob"
        CIB = "cib", "CIB"
        VIREMENT = "virement", "Virement bancaire"

    class Status(models.TextChoices):
        ACTIF = "actif", "Actif"
        EXPIRE = "expire", "Expiré"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="student_payments",
        limit_choices_to={"role": "STUDENT"},
    )
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    payment_type = models.CharField(
        max_length=20,
        choices=PaymentType.choices,
    )
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(
        help_text="Date the payment was physically received",
    )
    period_start = models.DateField()
    period_end = models.DateField(
        help_text="Expiry date — status computed from this",
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
    )
    receipt_number = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
        help_text="Auto-generated, e.g. PAY-2026-00001",
    )
    notes = models.TextField(blank=True, default="")
    recorded_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recorded_payments",
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIF,
        help_text="Auto-computed: actif if period_end >= today, else expire",
    )

    class Meta:
        db_table = "student_payments"
        ordering = ["-payment_date", "-created_at"]

    def __str__(self):
        return (
            f"{self.student.full_name} — {self.amount_paid} DA — {self.receipt_number}"
        )

    # ------------------------------------------------------------------
    # Auto-generate receipt number
    # ------------------------------------------------------------------
    def save(self, *args, **kwargs):
        if not self.receipt_number:
            year = self.payment_date.year if self.payment_date else timezone.now().year
            last = (
                StudentPayment.objects.filter(receipt_number__startswith=f"PAY-{year}-")
                .order_by("-receipt_number")
                .values_list("receipt_number", flat=True)
                .first()
            )
            if last:
                seq = int(last.split("-")[-1]) + 1
            else:
                seq = 1
            self.receipt_number = f"PAY-{year}-{seq:05d}"

        # Auto-compute status
        self.refresh_status(commit=False)
        super().save(*args, **kwargs)

    def refresh_status(self, commit=True):
        """Recompute status based on period_end vs today."""
        today = datetime.date.today()
        new_status = (
            self.Status.ACTIF if self.period_end >= today else self.Status.EXPIRE
        )
        if self.status != new_status:
            self.status = new_status
            if commit:
                self.save(update_fields=["status", "updated_at"])


class StudentFeeEnrollment(TenantModel):
    """
    Tracks a student's enrolment in a specific FeeStructure.

    total_due  = amount the student must pay for this fee.
    total_paid = cached sum of linked StudentPayment.amount_paid.
    status     = auto-computed from total_due vs total_paid + due_date.
    """

    class FeeStatus(models.TextChoices):
        PAID = "PAID", "Payé"
        PARTIAL = "PARTIAL", "Partiel"
        UNPAID = "UNPAID", "Impayé"
        LATE = "LATE", "En Retard"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="fee_enrollments",
        limit_choices_to={"role": "STUDENT"},
    )
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.CASCADE,
        related_name="enrollments",
    )
    total_due = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total amount owed for this fee (DZD).",
    )
    total_paid = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Cached total paid — refreshed on each payment.",
    )
    due_date = models.DateField(
        help_text="Deadline for full payment.",
    )
    status = models.CharField(
        max_length=10,
        choices=FeeStatus.choices,
        default=FeeStatus.UNPAID,
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "student_fee_enrollments"
        unique_together = ("student", "fee_structure")
        ordering = ["-created_at"]

    def __str__(self):
        return (
            f"{self.student.full_name} — {self.fee_structure.name} "
            f"({self.get_status_display()})"
        )

    # ------------------------------------------------------------------
    # Refresh cached total and status
    # ------------------------------------------------------------------
    def refresh_totals(self, commit=True):
        """
        Re-compute total_paid from linked StudentPayment rows and
        derive status from total_paid vs total_due + due_date.
        """
        from django.db.models import Sum

        agg = StudentPayment.objects.filter(
            student=self.student,
            fee_structure=self.fee_structure,
            is_deleted=False,
        ).aggregate(total=Sum("amount_paid"))
        self.total_paid = agg["total"] or 0
        self._compute_status()
        if commit:
            self.save(update_fields=["total_paid", "status", "updated_at"])

    def _compute_status(self):
        """Derive status from amounts + date."""
        today = datetime.date.today()
        if self.total_paid >= self.total_due:
            self.status = self.FeeStatus.PAID
        elif self.total_paid > 0:
            self.status = (
                self.FeeStatus.LATE if self.due_date < today else self.FeeStatus.PARTIAL
            )
        else:
            self.status = (
                self.FeeStatus.LATE if self.due_date < today else self.FeeStatus.UNPAID
            )


# =========================================================================
# PAYROLL MODULE — Salary management for teachers / staff
# =========================================================================


class SalaryConfig(TenantModel):
    """
    Per-teacher salary configuration.
    Defines base salary, hourly rate, and qualification level.
    """

    class QualificationLevel(models.TextChoices):
        LICENCE = "LICENCE", "Licence"
        MASTER = "MASTER", "Master"
        DOCTORAT = "DOCTORAT", "Doctorat"
        INGENIEUR = "INGENIEUR", "Ingénieur"
        PROFESSEUR = "PROFESSEUR", "Professeur"
        VACATAIRE = "VACATAIRE", "Vacataire"

    teacher = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="salary_config",
        limit_choices_to={"role": "TEACHER"},
    )
    base_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Gross monthly salary (DZD).",
    )
    hourly_rate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text="Rate per overtime hour (DZD).",
    )
    qualification = models.CharField(
        max_length=20,
        choices=QualificationLevel.choices,
        default=QualificationLevel.LICENCE,
    )
    weekly_hours = models.PositiveIntegerField(
        default=18,
        help_text="Contractual weekly teaching hours.",
    )
    bank_account = models.CharField(
        max_length=30,
        blank=True,
        default="",
        help_text="RIB / CCP account number for bank transfer.",
    )
    hire_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date the teacher started working at this school.",
    )

    class Meta:
        db_table = "salary_configs"
        ordering = ["teacher__last_name"]

    def __str__(self):
        return f"{self.teacher.full_name} — {self.base_salary} DA/mois"


class Deduction(TenantModel):
    """
    Reusable deduction type (e.g. Sécurité Sociale, IRG, Mutuelle).
    Can be a fixed amount or a percentage of gross salary.
    """

    class DeductionType(models.TextChoices):
        FIXED = "FIXED", "Montant fixe"
        PERCENTAGE = "PERCENTAGE", "Pourcentage"

    name = models.CharField(max_length=100, help_text="e.g. CNAS, IRG, Mutuelle")
    deduction_type = models.CharField(
        max_length=12,
        choices=DeductionType.choices,
        default=DeductionType.PERCENTAGE,
    )
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Amount (DZD) if FIXED, percentage if PERCENTAGE.",
    )
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "deductions"
        ordering = ["name"]

    def __str__(self):
        if self.deduction_type == self.DeductionType.PERCENTAGE:
            return f"{self.name} ({self.value}%)"
        return f"{self.name} ({self.value} DA)"

    def compute(self, gross_salary):
        """Return the deduction amount for the given gross salary."""
        from decimal import Decimal

        if self.deduction_type == self.DeductionType.PERCENTAGE:
            return round(gross_salary * self.value / Decimal("100"), 2)
        return self.value


class LeaveRecord(TenantModel):
    """
    Leave / absence tracking for teachers.
    Leave days reduce the salary proportionally.
    """

    class LeaveType(models.TextChoices):
        ANNUAL = "ANNUAL", "Congé annuel"
        SICK = "SICK", "Congé maladie"
        MATERNITY = "MATERNITY", "Congé maternité"
        UNPAID = "UNPAID", "Sans solde"
        OTHER = "OTHER", "Autre"

    class LeaveStatus(models.TextChoices):
        PENDING = "PENDING", "En attente"
        APPROVED = "APPROVED", "Approuvé"
        REJECTED = "REJECTED", "Rejeté"

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="leave_records",
        limit_choices_to={"role": "TEACHER"},
    )
    leave_type = models.CharField(max_length=12, choices=LeaveType.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=LeaveStatus.choices,
        default=LeaveStatus.PENDING,
    )
    reason = models.TextField(blank=True, default="")
    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_leaves",
    )

    class Meta:
        db_table = "leave_records"
        ordering = ["-start_date"]

    def __str__(self):
        return (
            f"{self.teacher.full_name} — {self.get_leave_type_display()} "
            f"({self.start_date} → {self.end_date})"
        )

    @property
    def days(self):
        """Number of leave days (inclusive)."""
        return (self.end_date - self.start_date).days + 1


class OvertimeRecord(TenantModel):
    """
    Tracks overtime hours for a teacher in a given month.
    """

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="overtime_records",
        limit_choices_to={"role": "TEACHER"},
    )
    date = models.DateField(help_text="Day the overtime was performed.")
    hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Number of extra hours.",
    )
    description = models.CharField(max_length=255, blank=True, default="")
    approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_overtimes",
    )

    class Meta:
        db_table = "overtime_records"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.teacher.full_name} — {self.hours}h le {self.date}"


class PaySlip(TenantModel):
    """
    Monthly pay slip for a teacher.
    Stores the full calculation breakdown so it's immutable after generation.
    """

    class PaySlipStatus(models.TextChoices):
        DRAFT = "DRAFT", "Brouillon"
        VALIDATED = "VALIDATED", "Validé"
        PAID = "PAID", "Payé"

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="payslips",
        limit_choices_to={"role": "TEACHER"},
    )
    month = models.PositiveIntegerField(help_text="1-12")
    year = models.PositiveIntegerField()

    # Salary breakdown (frozen at generation time)
    base_salary = models.DecimalField(max_digits=10, decimal_places=2)
    overtime_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    overtime_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    leave_days_unpaid = models.PositiveIntegerField(
        default=0,
        help_text="Unpaid leave days in this month.",
    )
    leave_deduction = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Amount deducted for unpaid leave.",
    )
    gross_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="base + overtime - leave_deduction",
    )
    deductions_detail = models.JSONField(
        default=list,
        help_text='List of {"name": ..., "amount": ...} for each deduction.',
    )
    total_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="gross - total_deductions",
    )

    reference = models.CharField(
        max_length=30,
        unique=True,
        blank=True,
        help_text="Auto-generated, e.g. FDP-2026-03-00001",
    )
    status = models.CharField(
        max_length=10,
        choices=PaySlipStatus.choices,
        default=PaySlipStatus.DRAFT,
    )
    paid_on = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "payslips"
        unique_together = ("teacher", "month", "year")
        ordering = ["-year", "-month"]

    def __str__(self):
        return f"{self.teacher.full_name} — {self.month:02d}/{self.year} — {self.net_salary} DA"

    def save(self, *args, **kwargs):
        if not self.reference:
            prefix = f"FDP-{self.year}-{self.month:02d}"
            last = (
                PaySlip.objects.filter(reference__startswith=prefix)
                .order_by("-reference")
                .values_list("reference", flat=True)
                .first()
            )
            seq = int(last.split("-")[-1]) + 1 if last else 1
            self.reference = f"{prefix}-{seq:05d}"
        super().save(*args, **kwargs)


# =========================================================================
# FEE DISCOUNTS / REDUCTIONS
# =========================================================================


class FeeDiscount(TenantModel):
    """
    Discount applicable to a student's fee.
    Types: fratrie (sibling), boursier (scholarship), exceptionnel (exceptional).
    """

    class DiscountType(models.TextChoices):
        FRATRIE = "FRATRIE", "Réduction fratrie"
        BOURSIER = "BOURSIER", "Boursier"
        EXCEPTIONNEL = "EXCEPTIONNEL", "Exceptionnel"

    class ValueType(models.TextChoices):
        FIXED = "FIXED", "Montant fixe"
        PERCENTAGE = "PERCENTAGE", "Pourcentage"

    name = models.CharField(max_length=200)
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
    )
    value_type = models.CharField(
        max_length=12,
        choices=ValueType.choices,
        default=ValueType.PERCENTAGE,
    )
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Amount (DZD) if FIXED, percentage if PERCENTAGE.",
    )
    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.CASCADE,
        related_name="discounts",
        null=True,
        blank=True,
        help_text="If set, discount applies only to this fee structure.",
    )
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "fee_discounts"
        ordering = ["-created_at"]

    def __str__(self):
        if self.value_type == self.ValueType.PERCENTAGE:
            return f"{self.name} ({self.value}%)"
        return f"{self.name} ({self.value} DA)"

    def compute(self, base_amount):
        from decimal import Decimal

        if self.value_type == self.ValueType.PERCENTAGE:
            return round(base_amount * self.value / Decimal("100"), 2)
        return min(self.value, base_amount)


class LatePenalty(TenantModel):
    """
    Penalty configuration for late payments.
    """

    class PenaltyType(models.TextChoices):
        FIXED = "FIXED", "Montant fixe"
        PERCENTAGE = "PERCENTAGE", "Pourcentage du montant dû"

    fee_structure = models.ForeignKey(
        FeeStructure,
        on_delete=models.CASCADE,
        related_name="penalties",
    )
    grace_days = models.PositiveIntegerField(
        default=7,
        help_text="Days after due date before penalty applies.",
    )
    penalty_type = models.CharField(
        max_length=12,
        choices=PenaltyType.choices,
        default=PenaltyType.FIXED,
    )
    value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Fixed amount (DZD) or percentage of amount due.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "late_penalties"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Pénalité — {self.fee_structure.name} (+{self.grace_days}j)"

    def compute(self, amount_due):
        from decimal import Decimal

        if self.penalty_type == self.PenaltyType.PERCENTAGE:
            return round(amount_due * self.value / Decimal("100"), 2)
        return self.value


class RegistrationDeposit(TenantModel):
    """
    Registration deposit (frais d'inscription) per student per academic year.
    """

    class DepositStatus(models.TextChoices):
        PAID = "PAID", "Payé"
        UNPAID = "UNPAID", "Impayé"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="registration_deposits",
        limit_choices_to={"role": "STUDENT"},
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="registration_deposits",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(
        max_length=20,
        choices=StudentPayment.PaymentMethod.choices,
        blank=True,
        default="",
    )
    receipt_number = models.CharField(max_length=30, blank=True, default="")
    status = models.CharField(
        max_length=10,
        choices=DepositStatus.choices,
        default=DepositStatus.UNPAID,
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "registration_deposits"
        unique_together = ("student", "academic_year")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student.full_name} — Inscription {self.academic_year} — {self.amount} DA"

    def save(self, *args, **kwargs):
        if self.payment_date and not self.receipt_number:
            year = self.payment_date.year
            last = (
                RegistrationDeposit.objects.filter(
                    receipt_number__startswith=f"INS-{year}-"
                )
                .order_by("-receipt_number")
                .values_list("receipt_number", flat=True)
                .first()
            )
            seq = int(last.split("-")[-1]) + 1 if last else 1
            self.receipt_number = f"INS-{year}-{seq:05d}"
            self.status = self.DepositStatus.PAID
        super().save(*args, **kwargs)


class ExtraFee(TenantModel):
    """
    Extra fees like canteen, transport, etc.
    """

    class FeeCategory(models.TextChoices):
        CANTEEN = "CANTEEN", "Cantine"
        TRANSPORT = "TRANSPORT", "Transport"
        UNIFORM = "UNIFORM", "Uniforme"
        BOOKS = "BOOKS", "Livres"
        ACTIVITIES = "ACTIVITIES", "Activités"
        OTHER = "OTHER", "Autre"

    name = models.CharField(max_length=200)
    category = models.CharField(
        max_length=20,
        choices=FeeCategory.choices,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="extra_fees",
    )
    is_mandatory = models.BooleanField(
        default=False,
        help_text="If true, fee is auto-applied to all students.",
    )
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "extra_fees"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} — {self.amount} DA"


# =========================================================================
# EXPENSE MANAGEMENT
# =========================================================================


class ExpenseCategory(TenantModel):
    """Category for expense tracking with annual budget."""

    name = models.CharField(max_length=200)
    budget_annual = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Annual budget allocated for this category (DZD).",
    )
    description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "expense_categories"
        ordering = ["name"]

    def __str__(self):
        return self.name

    @property
    def budget_consumed(self):
        """Total expenses approved in this category for the current year."""
        from django.db.models import Sum

        current_year = timezone.now().year
        agg = self.expenses.filter(
            status=Expense.ExpenseStatus.APPROVED,
            expense_date__year=current_year,
            is_deleted=False,
        ).aggregate(total=Sum("amount"))
        return agg["total"] or 0

    @property
    def budget_remaining(self):
        return self.budget_annual - self.budget_consumed


class Expense(TenantModel):
    """
    Expense record with approval workflow:
    Secretary submits → Director approves/rejects.
    """

    class ExpenseStatus(models.TextChoices):
        PENDING = "PENDING", "En attente"
        APPROVED = "APPROVED", "Approuvé"
        REJECTED = "REJECTED", "Rejeté"

    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.CASCADE,
        related_name="expenses",
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    expense_date = models.DateField()
    description = models.TextField()
    reference = models.CharField(
        max_length=50,
        blank=True,
        default="",
        help_text="Invoice/receipt reference number.",
    )
    submitted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="submitted_expenses",
    )
    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_expenses",
    )
    status = models.CharField(
        max_length=10,
        choices=ExpenseStatus.choices,
        default=ExpenseStatus.PENDING,
    )
    rejection_reason = models.TextField(blank=True, default="")

    class Meta:
        db_table = "expenses"
        ordering = ["-expense_date", "-created_at"]

    def __str__(self):
        return f"{self.category.name} — {self.amount} DA — {self.get_status_display()}"


class AnnualBudget(TenantModel):
    """Annual budget allocation per category per year."""

    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.CASCADE,
        related_name="annual_budgets",
    )
    year = models.PositiveIntegerField()
    allocated = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Budget allocated for this category/year (DZD).",
    )

    class Meta:
        db_table = "annual_budgets"
        unique_together = ("category", "year")
        ordering = ["-year"]

    def __str__(self):
        return f"{self.category.name} — {self.year} — {self.allocated} DA"

    @property
    def consumed(self):
        from django.db.models import Sum

        agg = self.category.expenses.filter(
            status=Expense.ExpenseStatus.APPROVED,
            expense_date__year=self.year,
            is_deleted=False,
        ).aggregate(total=Sum("amount"))
        return agg["total"] or 0

    @property
    def remaining(self):
        return self.allocated - self.consumed

    @property
    def consumption_pct(self):
        if self.allocated == 0:
            return 0
        return round(float(self.consumed) / float(self.allocated) * 100, 1)


# =========================================================================
# SALARY ADVANCES
# =========================================================================


class SalaryAdvance(TenantModel):
    """
    Salary advance for a teacher, deducted automatically from future payslips.
    """

    class AdvanceStatus(models.TextChoices):
        PENDING = "PENDING", "En attente"
        APPROVED = "APPROVED", "Approuvé"
        REJECTED = "REJECTED", "Rejeté"
        REPAID = "REPAID", "Remboursé"

    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="salary_advances",
        limit_choices_to={"role": "TEACHER"},
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Total advance amount (DZD).",
    )
    request_date = models.DateField(auto_now_add=True)
    reason = models.TextField(blank=True, default="")
    deduction_months = models.PositiveIntegerField(
        default=1,
        help_text="Number of months to spread the deduction over.",
    )
    monthly_deduction = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Amount deducted per month (auto-calculated).",
    )
    remaining = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Remaining amount to be repaid.",
    )
    status = models.CharField(
        max_length=10,
        choices=AdvanceStatus.choices,
        default=AdvanceStatus.PENDING,
    )
    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_advances",
    )

    class Meta:
        db_table = "salary_advances"
        ordering = ["-request_date"]

    def __str__(self):
        return f"{self.teacher.full_name} — {self.amount} DA avance"

    def save(self, *args, **kwargs):
        from decimal import Decimal

        if self.deduction_months > 0:
            self.monthly_deduction = round(
                self.amount / Decimal(str(self.deduction_months)), 2
            )
        if not self.pk:
            self.remaining = self.amount
        super().save(*args, **kwargs)
