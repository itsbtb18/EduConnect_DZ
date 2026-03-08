"""
ILMI — Infirmerie Scolaire Models
====================================
Comprehensive school infirmary module covering medical records,
allergies, medications, vaccinations, consultations, emergencies,
epidemic tracking, and nurse-parent communication.
"""

import uuid
from django.db import models
from django.utils import timezone
from core.models import TenantModel


# ═══════════════════════════════════════════════════════════════════════════
# Medical Record (Dossier Médical)
# ═══════════════════════════════════════════════════════════════════════════


class MedicalRecord(TenantModel):
    """Primary medical file for a student — one per student."""

    class BloodGroup(models.TextChoices):
        A_POS = "A+", "A+"
        A_NEG = "A-", "A-"
        B_POS = "B+", "B+"
        B_NEG = "B-", "B-"
        AB_POS = "AB+", "AB+"
        AB_NEG = "AB-", "AB-"
        O_POS = "O+", "O+"
        O_NEG = "O-", "O-"
        UNKNOWN = "UNKNOWN", "Inconnu"

    student = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="medical_record",
        limit_choices_to={"role": "STUDENT"},
    )
    blood_group = models.CharField(
        max_length=10, choices=BloodGroup.choices, default=BloodGroup.UNKNOWN
    )
    # Weight/height history stored as JSON: [{"date":"2024-01-15","weight":45.5,"height":155}]
    weight_height_history = models.JSONField(default=list, blank=True)
    current_weight = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, help_text="kg"
    )
    current_height = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, help_text="cm"
    )

    # Doctor & insurance
    treating_doctor = models.CharField(max_length=255, blank=True, default="")
    treating_doctor_phone = models.CharField(max_length=20, blank=True, default="")
    insurance_provider = models.CharField(
        max_length=255, blank=True, default="", help_text="Mutuelle / Assurance"
    )
    cnas_number = models.CharField(max_length=50, blank=True, default="")
    casnos_number = models.CharField(max_length=50, blank=True, default="")

    # Emergency contacts (separate from parent)
    emergency_contact_name = models.CharField(max_length=255, blank=True, default="")
    emergency_contact_phone = models.CharField(max_length=20, blank=True, default="")
    emergency_contact_relation = models.CharField(
        max_length=100, blank=True, default=""
    )

    notes = models.TextField(blank=True, default="")

    @property
    def bmi(self):
        """Auto-calculated BMI from current weight (kg) and height (cm)."""
        if self.current_weight and self.current_height and self.current_height > 0:
            height_m = float(self.current_height) / 100
            return round(float(self.current_weight) / (height_m**2), 1)
        return None

    class Meta:
        db_table = "infirmerie_medical_records"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Dossier médical — {self.student.full_name}"


# ═══════════════════════════════════════════════════════════════════════════
# Medical History (Antécédents)
# ═══════════════════════════════════════════════════════════════════════════


class MedicalHistory(TenantModel):
    """Chronic illnesses, childhood diseases, surgeries, hospitalisations, family history."""

    class HistoryType(models.TextChoices):
        CHRONIC_ILLNESS = "CHRONIC", "Maladie chronique"
        CHILDHOOD_DISEASE = "CHILDHOOD", "Maladie infantile"
        SURGERY = "SURGERY", "Intervention chirurgicale"
        HOSPITALISATION = "HOSPITALISATION", "Hospitalisation"
        FAMILY_HISTORY = "FAMILY", "Antécédent familial"

    medical_record = models.ForeignKey(
        MedicalRecord, on_delete=models.CASCADE, related_name="history_entries"
    )
    history_type = models.CharField(max_length=20, choices=HistoryType.choices)
    condition_name = models.CharField(max_length=255)
    diagnosis_date = models.DateField(null=True, blank=True)
    treatment = models.TextField(blank=True, default="")
    specialist_doctor = models.CharField(max_length=255, blank=True, default="")
    is_ongoing = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "infirmerie_medical_history"
        ordering = ["-diagnosis_date", "-created_at"]

    def __str__(self):
        return f"{self.get_history_type_display()}: {self.condition_name}"


# ═══════════════════════════════════════════════════════════════════════════
# Allergy
# ═══════════════════════════════════════════════════════════════════════════


class Allergy(TenantModel):
    class AllergyType(models.TextChoices):
        MEDICATION = "MEDICATION", "Médicamenteuse"
        FOOD = "FOOD", "Alimentaire"
        ENVIRONMENTAL = "ENVIRONMENTAL", "Environnementale"
        INSECT = "INSECT", "Piqûre d'insecte"
        CONTACT = "CONTACT", "Contact"
        OTHER = "OTHER", "Autre"

    class Severity(models.TextChoices):
        MILD = "MILD", "Légère"
        MODERATE = "MODERATE", "Modérée"
        SEVERE = "SEVERE", "Sévère"
        ANAPHYLACTIC = "ANAPHYLACTIC", "Anaphylactique"

    medical_record = models.ForeignKey(
        MedicalRecord, on_delete=models.CASCADE, related_name="allergies"
    )
    allergy_type = models.CharField(max_length=20, choices=AllergyType.choices)
    allergen_name = models.CharField(max_length=255)
    severity = models.CharField(max_length=20, choices=Severity.choices)
    symptoms = models.TextField(blank=True, default="")
    emergency_protocol = models.TextField(
        blank=True, default="", help_text="Conduite à tenir"
    )
    has_epipen = models.BooleanField(default=False)

    class Meta:
        db_table = "infirmerie_allergies"
        ordering = ["-severity", "allergen_name"]

    def __str__(self):
        return f"{self.allergen_name} ({self.get_severity_display()})"


# ═══════════════════════════════════════════════════════════════════════════
# Medication
# ═══════════════════════════════════════════════════════════════════════════


class Medication(TenantModel):
    class AdministrationRoute(models.TextChoices):
        ORAL = "ORAL", "Voie orale"
        SUBLINGUAL = "SUBLINGUAL", "Sublinguale"
        INJECTION = "INJECTION", "Injectable"
        INHALATION = "INHALATION", "Inhalation"
        TOPICAL = "TOPICAL", "Topique"
        RECTAL = "RECTAL", "Rectale"
        EYE_DROP = "EYE_DROP", "Collyre"
        OTHER = "OTHER", "Autre"

    class Frequency(models.TextChoices):
        ONCE_DAILY = "1X_DAY", "1 fois/jour"
        TWICE_DAILY = "2X_DAY", "2 fois/jour"
        THREE_DAILY = "3X_DAY", "3 fois/jour"
        AS_NEEDED = "AS_NEEDED", "Si besoin (SOS)"
        WEEKLY = "WEEKLY", "Hebdomadaire"
        OTHER = "OTHER", "Autre"

    medical_record = models.ForeignKey(
        MedicalRecord, on_delete=models.CASCADE, related_name="medications"
    )
    dci_name = models.CharField(
        max_length=255, help_text="Dénomination Commune Internationale"
    )
    commercial_name = models.CharField(max_length=255, blank=True, default="")
    dosage = models.CharField(max_length=100)
    administration_route = models.CharField(
        max_length=20,
        choices=AdministrationRoute.choices,
        default=AdministrationRoute.ORAL,
    )
    frequency = models.CharField(
        max_length=20, choices=Frequency.choices, default=Frequency.ONCE_DAILY
    )
    schedule_times = models.JSONField(
        default=list, blank=True, help_text="Horaires: ['08:00','12:00','18:00']"
    )

    # Infirmary stock
    stock_quantity = models.PositiveIntegerField(default=0)
    stock_alert_threshold = models.PositiveIntegerField(default=5)

    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    prescribing_doctor = models.CharField(max_length=255, blank=True, default="")
    prescription_file = models.FileField(
        upload_to="infirmerie/prescriptions/", null=True, blank=True
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "infirmerie_medications"
        ordering = ["-is_active", "dci_name"]

    @property
    def is_stock_low(self):
        return self.stock_quantity <= self.stock_alert_threshold

    def __str__(self):
        return f"{self.dci_name} ({self.dosage})"


# ═══════════════════════════════════════════════════════════════════════════
# Vaccination
# ═══════════════════════════════════════════════════════════════════════════


class Vaccination(TenantModel):
    class Status(models.TextChoices):
        DONE = "DONE", "Fait"
        NOT_DONE = "NOT_DONE", "Non fait"
        OVERDUE = "OVERDUE", "En retard"
        SCHEDULED = "SCHEDULED", "Planifié"

    medical_record = models.ForeignKey(
        MedicalRecord, on_delete=models.CASCADE, related_name="vaccinations"
    )
    vaccine_name = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NOT_DONE
    )
    administration_date = models.DateField(null=True, blank=True)
    administered_at = models.CharField(
        max_length=255, blank=True, default="", help_text="Lieu/établissement"
    )
    lot_number = models.CharField(max_length=100, blank=True, default="")
    next_due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "infirmerie_vaccinations"
        ordering = ["vaccine_name", "-administration_date"]

    def __str__(self):
        return f"{self.vaccine_name} — {self.get_status_display()}"


# ═══════════════════════════════════════════════════════════════════════════
# Consultation
# ═══════════════════════════════════════════════════════════════════════════


class Consultation(TenantModel):
    class ConsultationReason(models.TextChoices):
        HEADACHE = "HEADACHE", "Maux de tête"
        STOMACH = "STOMACH", "Maux de ventre"
        FEVER = "FEVER", "Fièvre"
        INJURY = "INJURY", "Blessure / Traumatisme"
        ALLERGY_REACTION = "ALLERGY_REACTION", "Réaction allergique"
        ASTHMA = "ASTHMA", "Crise d'asthme"
        DIABETES = "DIABETES", "Malaise diabétique"
        EPILEPSY = "EPILEPSY", "Crise d'épilepsie"
        NAUSEA = "NAUSEA", "Nausée / Vomissement"
        DIZZINESS = "DIZZINESS", "Vertige / Malaise"
        EYE = "EYE", "Problème oculaire"
        DENTAL = "DENTAL", "Problème dentaire"
        SKIN = "SKIN", "Problème cutané"
        PSYCHOLOGICAL = "PSYCHOLOGICAL", "Motif psychologique"
        MEDICATION_ADMIN = "MEDICATION_ADMIN", "Administration de médicament"
        FOLLOW_UP = "FOLLOW_UP", "Suivi / Contrôle"
        OTHER = "OTHER", "Autre"

    class Outcome(models.TextChoices):
        RETURN_CLASS = "RETURN_CLASS", "Retour en classe"
        REST_ROOM = "REST_ROOM", "Repos à l'infirmerie"
        CONTACT_PARENT = "CONTACT_PARENT", "Contact parent"
        SENT_HOME = "SENT_HOME", "Renvoi au domicile"
        EMERGENCY = "EMERGENCY", "Urgences médicales"
        HOSPITAL_REFERRAL = "HOSPITAL_REFERRAL", "Orientation hôpital"
        OTHER = "OTHER", "Autre"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="infirmerie_consultations",
        limit_choices_to={"role": "STUDENT"},
    )
    nurse = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="nurse_consultations",
    )
    consultation_datetime = models.DateTimeField(default=timezone.now)
    reason = models.CharField(max_length=30, choices=ConsultationReason.choices)
    reason_detail = models.TextField(
        blank=True, default="", help_text="Motif texte libre"
    )
    symptoms_description = models.TextField(blank=True, default="")

    # Vital signs
    temperature = models.DecimalField(
        max_digits=4, decimal_places=1, null=True, blank=True, help_text="°C"
    )
    blood_pressure_systolic = models.PositiveSmallIntegerField(null=True, blank=True)
    blood_pressure_diastolic = models.PositiveSmallIntegerField(null=True, blank=True)
    spo2 = models.PositiveSmallIntegerField(null=True, blank=True, help_text="%")
    pulse = models.PositiveSmallIntegerField(null=True, blank=True, help_text="bpm")
    blood_sugar = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, help_text="g/L"
    )
    weight = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, help_text="kg"
    )
    height = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, help_text="cm"
    )

    # Care & outcome
    care_provided = models.TextField(
        blank=True, default="", help_text="Soins prodigués"
    )
    outcome = models.CharField(
        max_length=20, choices=Outcome.choices, default=Outcome.RETURN_CLASS
    )
    duration_minutes = models.PositiveSmallIntegerField(default=0)
    observations = models.TextField(blank=True, default="")
    attachment = models.FileField(
        upload_to="infirmerie/consultations/", null=True, blank=True
    )

    # Parent contacted
    parent_contacted = models.BooleanField(default=False)
    parent_contacted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "infirmerie_consultations"
        ordering = ["-consultation_datetime"]

    def __str__(self):
        return f"Consultation {self.student.full_name} — {self.consultation_datetime:%d/%m/%Y %H:%M}"


# ═══════════════════════════════════════════════════════════════════════════
# Disability (Handicap)
# ═══════════════════════════════════════════════════════════════════════════


class Disability(TenantModel):
    class DisabilityType(models.TextChoices):
        MOTOR = "MOTOR", "Moteur"
        VISUAL = "VISUAL", "Visuel"
        HEARING = "HEARING", "Auditif"
        COGNITIVE = "COGNITIVE", "Cognitif"
        LEARNING = "LEARNING", "Trouble de l'apprentissage"
        SPEECH = "SPEECH", "Trouble du langage"
        AUTISM = "AUTISM", "TSA"
        OTHER = "OTHER", "Autre"

    class AutonomyLevel(models.TextChoices):
        FULL = "FULL", "Autonomie complète"
        PARTIAL = "PARTIAL", "Autonomie partielle"
        ASSISTED = "ASSISTED", "Assistance requise"
        FULL_ASSISTANCE = "FULL_ASSISTANCE", "Assistance complète"

    medical_record = models.ForeignKey(
        MedicalRecord, on_delete=models.CASCADE, related_name="disabilities"
    )
    disability_type = models.CharField(max_length=20, choices=DisabilityType.choices)
    description = models.TextField(blank=True, default="")
    autonomy_level = models.CharField(
        max_length=20, choices=AutonomyLevel.choices, default=AutonomyLevel.FULL
    )
    school_accommodations = models.TextField(
        blank=True, default="", help_text="Aménagements scolaires"
    )
    pap_file = models.FileField(
        upload_to="infirmerie/pap/",
        null=True,
        blank=True,
        help_text="Plan d'Accompagnement Personnalisé",
    )

    class Meta:
        db_table = "infirmerie_disabilities"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_disability_type_display()} — {self.medical_record.student.full_name}"


# ═══════════════════════════════════════════════════════════════════════════
# Psychological Record (Suivi Psychologique)
# ═══════════════════════════════════════════════════════════════════════════


class PsychologicalRecord(TenantModel):
    """Restricted access: NURSE + SCHOOL_ADMIN only."""

    medical_record = models.ForeignKey(
        MedicalRecord, on_delete=models.CASCADE, related_name="psychological_records"
    )
    vulnerability_report = models.TextField(blank=True, default="")
    is_in_therapy = models.BooleanField(default=False)
    therapist_name = models.CharField(max_length=255, blank=True, default="")
    therapist_phone = models.CharField(max_length=20, blank=True, default="")
    family_situation_notes = models.TextField(blank=True, default="")
    follow_up_notes = models.TextField(blank=True, default="")
    last_session_date = models.DateField(null=True, blank=True)
    next_session_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "infirmerie_psychological_records"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Suivi psycho — {self.medical_record.student.full_name}"


# ═══════════════════════════════════════════════════════════════════════════
# Emergency Protocol
# ═══════════════════════════════════════════════════════════════════════════


class EmergencyProtocol(TenantModel):
    class EmergencyType(models.TextChoices):
        ANAPHYLAXIS = "ANAPHYLAXIS", "Choc anaphylactique"
        ASTHMA_ATTACK = "ASTHMA_ATTACK", "Crise d'asthme sévère"
        EPILEPTIC_SEIZURE = "EPILEPTIC_SEIZURE", "Crise d'épilepsie"
        DIABETIC_EMERGENCY = "DIABETIC_EMERGENCY", "Urgence diabétique"
        CARDIAC = "CARDIAC", "Arrêt cardiaque"
        TRAUMA = "TRAUMA", "Traumatisme grave"
        HEMORRHAGE = "HEMORRHAGE", "Hémorragie"
        FRACTURE = "FRACTURE", "Fracture"
        BURN = "BURN", "Brûlure"
        POISONING = "POISONING", "Intoxication"
        OTHER = "OTHER", "Autre"

    emergency_type = models.CharField(max_length=30, choices=EmergencyType.choices)
    title = models.CharField(max_length=255)
    # Steps stored as JSON: [{"step":1,"action":"...","duration":"2min"}, ...]
    protocol_steps = models.JSONField(default=list)
    triggers = models.TextField(blank=True, default="", help_text="Signes déclencheurs")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "infirmerie_emergency_protocols"
        ordering = ["emergency_type"]

    def __str__(self):
        return f"Protocole: {self.title}"


# ═══════════════════════════════════════════════════════════════════════════
# Emergency Event
# ═══════════════════════════════════════════════════════════════════════════


class EmergencyEvent(TenantModel):
    class EventStatus(models.TextChoices):
        IN_PROGRESS = "IN_PROGRESS", "En cours"
        RESOLVED = "RESOLVED", "Résolu"
        TRANSFERRED = "TRANSFERRED", "Transféré"

    consultation = models.OneToOneField(
        Consultation,
        on_delete=models.CASCADE,
        related_name="emergency_event",
        null=True,
        blank=True,
    )
    protocol = models.ForeignKey(
        EmergencyProtocol,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )
    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="emergency_events",
        limit_choices_to={"role": "STUDENT"},
    )
    emergency_type = models.CharField(
        max_length=30, choices=EmergencyProtocol.EmergencyType.choices
    )
    status = models.CharField(
        max_length=20, choices=EventStatus.choices, default=EventStatus.IN_PROGRESS
    )
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)
    actions_taken = models.JSONField(
        default=list, help_text="[{'time':'HH:MM','action':'...'}]"
    )
    liaison_report_pdf = models.FileField(
        upload_to="infirmerie/emergencies/",
        null=True,
        blank=True,
        help_text="Fiche de liaison médicale PDF",
    )
    post_emergency_report = models.TextField(blank=True, default="")
    parent_notified = models.BooleanField(default=False)
    parent_notified_at = models.DateTimeField(null=True, blank=True)
    emergency_services_called = models.BooleanField(default=False)

    class Meta:
        db_table = "infirmerie_emergency_events"
        ordering = ["-started_at"]

    @property
    def duration_seconds(self):
        if self.ended_at:
            return (self.ended_at - self.started_at).total_seconds()
        return (timezone.now() - self.started_at).total_seconds()

    def __str__(self):
        return f"Urgence {self.get_emergency_type_display()} — {self.student.full_name}"


# ═══════════════════════════════════════════════════════════════════════════
# Infirmery Message (Nurse ↔ Parent)
# ═══════════════════════════════════════════════════════════════════════════


class InfirmeryMessage(TenantModel):
    class MessageTemplate(models.TextChoices):
        CONSULTATION_DONE = "CONSULTATION_DONE", "Consultation effectuée"
        MEDICATION_REMINDER = "MEDICATION_REMINDER", "Rappel médicament"
        VACCINATION_REMINDER = "VACCINATION_REMINDER", "Rappel vaccination"
        REST_NOTIFICATION = "REST_NOTIFICATION", "Notification de repos"
        SENT_HOME = "SENT_HOME", "Renvoi au domicile"
        EMERGENCY_ALERT = "EMERGENCY_ALERT", "Alerte urgence"
        CUSTOM = "CUSTOM", "Message personnalisé"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="infirmerie_messages",
        limit_choices_to={"role": "STUDENT"},
    )
    sender = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="sent_infirmerie_messages",
    )
    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="received_infirmerie_messages",
    )
    template = models.CharField(
        max_length=30, choices=MessageTemplate.choices, default=MessageTemplate.CUSTOM
    )
    subject = models.CharField(max_length=255)
    body = models.TextField()
    attachment = models.FileField(
        upload_to="infirmerie/messages/", null=True, blank=True
    )
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "infirmerie_messages"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Message: {self.subject}"


# ═══════════════════════════════════════════════════════════════════════════
# Absence Justification
# ═══════════════════════════════════════════════════════════════════════════


class AbsenceJustification(TenantModel):
    class JustificationStatus(models.TextChoices):
        SUBMITTED = "SUBMITTED", "Soumise"
        VALIDATED = "VALIDATED", "Validée"
        REJECTED = "REJECTED", "Rejetée"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="medical_absences",
        limit_choices_to={"role": "STUDENT"},
    )
    submitted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="submitted_justifications",
    )
    consultation = models.ForeignKey(
        Consultation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="justifications",
    )
    absence_date_start = models.DateField()
    absence_date_end = models.DateField()
    generic_reason = models.CharField(max_length=255)
    medical_certificate = models.FileField(
        upload_to="infirmerie/certificates/", null=True, blank=True
    )
    status = models.CharField(
        max_length=20,
        choices=JustificationStatus.choices,
        default=JustificationStatus.SUBMITTED,
    )
    validated_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="validated_justifications",
    )
    validated_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default="")

    class Meta:
        db_table = "infirmerie_absence_justifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Justification {self.student.full_name} — {self.absence_date_start}"


# ═══════════════════════════════════════════════════════════════════════════
# Epidemic Alert
# ═══════════════════════════════════════════════════════════════════════════


class EpidemicAlert(TenantModel):
    class AlertLevel(models.TextChoices):
        WATCH = "WATCH", "Surveillance"
        WARNING = "WARNING", "Alerte"
        CRITICAL = "CRITICAL", "Critique"

    classroom = models.ForeignKey(
        "academics.Classroom",
        on_delete=models.CASCADE,
        related_name="epidemic_alerts",
        null=True,
        blank=True,
    )
    disease_name = models.CharField(max_length=255)
    case_count = models.PositiveIntegerField(default=1)
    detection_date = models.DateField(default=timezone.now)
    alert_level = models.CharField(
        max_length=20, choices=AlertLevel.choices, default=AlertLevel.WATCH
    )
    is_contagious = models.BooleanField(default=True)
    description = models.TextField(blank=True, default="")
    actions_taken = models.TextField(blank=True, default="")
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "infirmerie_epidemic_alerts"
        ordering = ["-detection_date"]

    def __str__(self):
        return f"Alerte: {self.disease_name} ({self.case_count} cas)"


# ═══════════════════════════════════════════════════════════════════════════
# Contagious Disease (per student)
# ═══════════════════════════════════════════════════════════════════════════


class ContagiousDisease(TenantModel):
    class DiseaseStatus(models.TextChoices):
        ACTIVE = "ACTIVE", "En cours"
        EVICTION = "EVICTION", "En éviction"
        CLEARED = "CLEARED", "Guéri / Autorisé"

    student = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="contagious_diseases",
        limit_choices_to={"role": "STUDENT"},
    )
    epidemic_alert = models.ForeignKey(
        EpidemicAlert,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="individual_cases",
    )
    disease_name = models.CharField(max_length=255)
    onset_date = models.DateField()
    recommended_eviction_days = models.PositiveSmallIntegerField(default=0)
    authorized_return_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20, choices=DiseaseStatus.choices, default=DiseaseStatus.ACTIVE
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        db_table = "infirmerie_contagious_diseases"
        ordering = ["-onset_date"]

    def __str__(self):
        return f"{self.disease_name} — {self.student.full_name}"
