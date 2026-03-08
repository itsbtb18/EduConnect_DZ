from django.contrib import admin
from .models import (
    AbsenceJustification,
    Allergy,
    Consultation,
    ContagiousDisease,
    Disability,
    EmergencyEvent,
    EmergencyProtocol,
    EpidemicAlert,
    InfirmeryMessage,
    MedicalHistory,
    MedicalRecord,
    Medication,
    PsychologicalRecord,
    Vaccination,
)


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ("student", "blood_group", "insurance_provider", "created_at")
    list_filter = ("blood_group",)
    search_fields = ("student__first_name", "student__last_name")
    raw_id_fields = ("student", "school")


@admin.register(MedicalHistory)
class MedicalHistoryAdmin(admin.ModelAdmin):
    list_display = ("medical_record", "history_type", "condition_name", "is_ongoing")
    list_filter = ("history_type", "is_ongoing")


@admin.register(Allergy)
class AllergyAdmin(admin.ModelAdmin):
    list_display = (
        "medical_record",
        "allergen_name",
        "allergy_type",
        "severity",
        "has_epipen",
    )
    list_filter = ("allergy_type", "severity")
    search_fields = ("allergen_name",)


@admin.register(Medication)
class MedicationAdmin(admin.ModelAdmin):
    list_display = (
        "dci_name",
        "commercial_name",
        "dosage",
        "is_active",
        "stock_quantity",
    )
    list_filter = ("is_active", "administration_route")
    search_fields = ("dci_name", "commercial_name")


@admin.register(Vaccination)
class VaccinationAdmin(admin.ModelAdmin):
    list_display = (
        "vaccine_name",
        "medical_record",
        "status",
        "administration_date",
        "next_due_date",
    )
    list_filter = ("status",)
    search_fields = ("vaccine_name",)


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ("student", "nurse", "reason", "outcome", "consultation_datetime")
    list_filter = ("reason", "outcome")
    search_fields = ("student__first_name", "student__last_name")
    raw_id_fields = ("student", "nurse")


@admin.register(Disability)
class DisabilityAdmin(admin.ModelAdmin):
    list_display = ("medical_record", "disability_type", "autonomy_level")
    list_filter = ("disability_type", "autonomy_level")


@admin.register(PsychologicalRecord)
class PsychologicalRecordAdmin(admin.ModelAdmin):
    list_display = ("medical_record", "is_in_therapy", "created_at")
    list_filter = ("is_in_therapy",)


@admin.register(EmergencyProtocol)
class EmergencyProtocolAdmin(admin.ModelAdmin):
    list_display = ("title", "emergency_type", "is_active")
    list_filter = ("emergency_type", "is_active")


@admin.register(EmergencyEvent)
class EmergencyEventAdmin(admin.ModelAdmin):
    list_display = ("student", "protocol", "status", "started_at", "ended_at")
    list_filter = ("status",)
    raw_id_fields = ("student",)


@admin.register(InfirmeryMessage)
class InfirmeryMessageAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "sender",
        "recipient",
        "template",
        "is_read",
        "created_at",
    )
    list_filter = ("template", "is_read")
    raw_id_fields = ("student", "sender", "recipient")


@admin.register(AbsenceJustification)
class AbsenceJustificationAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "absence_date_start",
        "absence_date_end",
        "status",
        "submitted_by",
    )
    list_filter = ("status",)
    raw_id_fields = ("student", "submitted_by", "validated_by")


@admin.register(EpidemicAlert)
class EpidemicAlertAdmin(admin.ModelAdmin):
    list_display = (
        "disease_name",
        "case_count",
        "alert_level",
        "is_resolved",
        "detection_date",
    )
    list_filter = ("alert_level", "is_resolved")


@admin.register(ContagiousDisease)
class ContagiousDiseaseAdmin(admin.ModelAdmin):
    list_display = (
        "student",
        "disease_name",
        "status",
        "onset_date",
        "authorized_return_date",
    )
    list_filter = ("status",)
    raw_id_fields = ("student", "epidemic_alert")
