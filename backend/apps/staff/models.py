"""
Staff management models — personnel, attendance, leave, documents.
"""

from django.db import models
from django.utils import timezone

from core.models import TenantModel


class StaffMember(TenantModel):
    """A non-teaching staff member (administrative, support, etc.)."""

    class Position(models.TextChoices):
        SECRETARY = "SECRETARY", "Secrétaire"
        ACCOUNTANT = "ACCOUNTANT", "Comptable"
        LIBRARIAN = "LIBRARIAN", "Bibliothécaire"
        SUPERVISOR = "SUPERVISOR", "Surveillant(e)"
        COUNSELOR = "COUNSELOR", "Conseiller(ère)"
        NURSE = "NURSE", "Infirmier(ère)"
        JANITOR = "JANITOR", "Agent d'entretien"
        SECURITY = "SECURITY", "Agent de sécurité"
        IT_ADMIN = "IT_ADMIN", "Responsable informatique"
        DRIVER = "DRIVER", "Chauffeur"
        COOK = "COOK", "Cuisinier(ère)"
        DIRECTOR = "DIRECTOR", "Directeur(trice)"
        VICE_DIRECTOR = "VICE_DIRECTOR", "Sous-directeur(trice)"
        OTHER = "OTHER", "Autre"

    class ContractType(models.TextChoices):
        CDI = "CDI", "CDI"
        CDD = "CDD", "CDD"
        VACATAIRE = "VACATAIRE", "Vacataire"
        STAGIAIRE = "STAGIAIRE", "Stagiaire"

    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="staff_profile",
    )
    position = models.CharField(
        max_length=20, choices=Position.choices, default=Position.OTHER
    )
    department = models.CharField(max_length=100, blank=True)
    hire_date = models.DateField(null=True, blank=True)
    contract_type = models.CharField(
        max_length=12, choices=ContractType.choices, default=ContractType.CDI
    )
    contract_end_date = models.DateField(
        null=True, blank=True, help_text="Pour CDD / Vacataire"
    )
    base_salary = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Salaire mensuel brut (DA)",
    )
    bank_account = models.CharField(max_length=30, blank=True)
    emergency_contact = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "staff_members"
        ordering = ["user__last_name", "user__first_name"]

    def __str__(self):
        return f"{self.user.last_name} {self.user.first_name} — {self.get_position_display()}"


class StaffDocument(TenantModel):
    """HR document attached to a staff member."""

    class DocType(models.TextChoices):
        CONTRACT = "CONTRACT", "Contrat"
        ID_CARD = "ID_CARD", "Pièce d'identité"
        DIPLOMA = "DIPLOMA", "Diplôme"
        MEDICAL = "MEDICAL", "Certificat médical"
        OTHER = "OTHER", "Autre"

    staff = models.ForeignKey(
        StaffMember, on_delete=models.CASCADE, related_name="documents"
    )
    doc_type = models.CharField(
        max_length=12, choices=DocType.choices, default=DocType.OTHER
    )
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to="staff/documents/%Y/%m/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "staff_documents"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.staff} — {self.title}"


class StaffAttendance(TenantModel):
    """Daily attendance / clock-in record for a staff member."""

    class AttendanceStatus(models.TextChoices):
        PRESENT = "PRESENT", "Présent"
        ABSENT = "ABSENT", "Absent"
        LATE = "LATE", "En retard"
        ON_LEAVE = "ON_LEAVE", "En congé"

    staff = models.ForeignKey(
        StaffMember, on_delete=models.CASCADE, related_name="attendance_records"
    )
    date = models.DateField()
    status = models.CharField(
        max_length=10,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT,
    )
    clock_in = models.TimeField(null=True, blank=True)
    clock_out = models.TimeField(null=True, blank=True)
    hours_worked = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="Heures travaillées (calculé automatiquement si clock_in/out renseignés)",
    )
    source = models.CharField(
        max_length=15, default="MANUAL", help_text="MANUAL ou FINGERPRINT"
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "staff_attendance"
        unique_together = ["staff", "date", "school"]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.staff} — {self.date} — {self.get_status_display()}"

    def save(self, *args, **kwargs):
        if self.clock_in and self.clock_out:
            from datetime import datetime, timedelta

            dt_in = datetime.combine(self.date, self.clock_in)
            dt_out = datetime.combine(self.date, self.clock_out)
            if dt_out < dt_in:
                dt_out += timedelta(days=1)
            diff = (dt_out - dt_in).total_seconds() / 3600
            self.hours_worked = round(diff, 2)
        super().save(*args, **kwargs)


class StaffLeave(TenantModel):
    """Leave request for a staff member."""

    class LeaveType(models.TextChoices):
        ANNUAL = "ANNUAL", "Congé annuel"
        SICK = "SICK", "Congé maladie"
        MATERNITY = "MATERNITY", "Congé maternité"
        UNPAID = "UNPAID", "Sans solde"
        PERSONAL = "PERSONAL", "Personnel"
        OTHER = "OTHER", "Autre"

    class LeaveStatus(models.TextChoices):
        PENDING = "PENDING", "En attente"
        APPROVED = "APPROVED", "Approuvé"
        REJECTED = "REJECTED", "Rejeté"

    staff = models.ForeignKey(
        StaffMember, on_delete=models.CASCADE, related_name="leave_records"
    )
    leave_type = models.CharField(max_length=12, choices=LeaveType.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=10, choices=LeaveStatus.choices, default=LeaveStatus.PENDING
    )
    reason = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_staff_leaves",
    )

    class Meta:
        db_table = "staff_leaves"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.staff} — {self.get_leave_type_display()} ({self.start_date} → {self.end_date})"

    @property
    def days(self):
        return (self.end_date - self.start_date).days + 1
