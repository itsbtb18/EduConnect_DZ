"""
Finance models: fee structures and student payments.
"""

import datetime

from django.db import models
from django.utils import timezone

from core.models import TenantModel


class FeeStructure(TenantModel):
    """Fee configuration for a school / academic year."""

    name = models.CharField(
        max_length=200,
        help_text="e.g. Frais de scolarité 2026-2027",
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear",
        on_delete=models.CASCADE,
        related_name="fee_structures",
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
    description = models.TextField(blank=True, default="")

    class Meta:
        db_table = "fee_structures"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}"


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
