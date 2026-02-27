"""
Finance models: fees, payments, receipts.
"""

from django.db import models
from core.models import TenantModel


class FeeStructure(TenantModel):
    """Fee configuration for a school level/year."""

    name = models.CharField(
        max_length=100, help_text="e.g., Annual Tuition, Registration Fee"
    )
    level = models.ForeignKey(
        "academics.Level", on_delete=models.CASCADE, related_name="fee_structures"
    )
    academic_year = models.ForeignKey(
        "schools.AcademicYear", on_delete=models.CASCADE, related_name="fee_structures"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField(null=True, blank=True)
    is_installment_allowed = models.BooleanField(default=False)
    installment_count = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "fee_structures"

    def __str__(self):
        return f"{self.name} — {self.amount} DZD"


class Payment(TenantModel):
    """A payment made by a parent/student."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    class Method(models.TextChoices):
        CASH = "cash", "Cash"
        BANK_TRANSFER = "bank_transfer", "Bank Transfer"
        CCP = "ccp", "CCP (Algérie Poste)"
        BARIDIMOB = "baridimob", "BaridiMob"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="payments",
        limit_choices_to={"role": "student"},
    )
    fee = models.ForeignKey(
        FeeStructure, on_delete=models.CASCADE, related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=Method.choices)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    reference_number = models.CharField(max_length=100, blank=True)
    receipt_file = models.FileField(upload_to="receipts/", blank=True, null=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    note = models.TextField(blank=True)

    class Meta:
        db_table = "payments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student.full_name} — {self.amount} DZD — {self.status}"
