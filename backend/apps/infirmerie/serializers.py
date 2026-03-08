"""
ILMI — Infirmerie Serializers
=================================
Read & write serializers with role-based field restrictions.
"""

from rest_framework import serializers
from .models import (
    MedicalRecord,
    MedicalHistory,
    Allergy,
    Medication,
    Vaccination,
    Consultation,
    Disability,
    PsychologicalRecord,
    EmergencyProtocol,
    EmergencyEvent,
    InfirmeryMessage,
    AbsenceJustification,
    EpidemicAlert,
    ContagiousDisease,
)


# ═══════════════════════════════════════════════════════════════════════════
# Medical Record
# ═══════════════════════════════════════════════════════════════════════════


class MedicalHistorySerializer(serializers.ModelSerializer):
    history_type_display = serializers.CharField(
        source="get_history_type_display", read_only=True
    )

    class Meta:
        model = MedicalHistory
        fields = [
            "id",
            "medical_record",
            "history_type",
            "history_type_display",
            "condition_name",
            "diagnosis_date",
            "treatment",
            "specialist_doctor",
            "is_ongoing",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AllergySerializer(serializers.ModelSerializer):
    allergy_type_display = serializers.CharField(
        source="get_allergy_type_display", read_only=True
    )
    severity_display = serializers.CharField(
        source="get_severity_display", read_only=True
    )

    class Meta:
        model = Allergy
        fields = [
            "id",
            "medical_record",
            "allergy_type",
            "allergy_type_display",
            "allergen_name",
            "severity",
            "severity_display",
            "symptoms",
            "emergency_protocol",
            "has_epipen",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MedicationSerializer(serializers.ModelSerializer):
    administration_route_display = serializers.CharField(
        source="get_administration_route_display", read_only=True
    )
    frequency_display = serializers.CharField(
        source="get_frequency_display", read_only=True
    )
    is_stock_low = serializers.BooleanField(read_only=True)

    class Meta:
        model = Medication
        fields = [
            "id",
            "medical_record",
            "dci_name",
            "commercial_name",
            "dosage",
            "administration_route",
            "administration_route_display",
            "frequency",
            "frequency_display",
            "schedule_times",
            "stock_quantity",
            "stock_alert_threshold",
            "is_stock_low",
            "start_date",
            "end_date",
            "prescribing_doctor",
            "prescription_file",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "is_stock_low", "created_at"]


class VaccinationSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Vaccination
        fields = [
            "id",
            "medical_record",
            "vaccine_name",
            "status",
            "status_display",
            "administration_date",
            "administered_at",
            "lot_number",
            "next_due_date",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class DisabilitySerializer(serializers.ModelSerializer):
    disability_type_display = serializers.CharField(
        source="get_disability_type_display", read_only=True
    )
    autonomy_level_display = serializers.CharField(
        source="get_autonomy_level_display", read_only=True
    )

    class Meta:
        model = Disability
        fields = [
            "id",
            "medical_record",
            "disability_type",
            "disability_type_display",
            "description",
            "autonomy_level",
            "autonomy_level_display",
            "school_accommodations",
            "pap_file",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PsychologicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PsychologicalRecord
        fields = [
            "id",
            "medical_record",
            "vulnerability_report",
            "is_in_therapy",
            "therapist_name",
            "therapist_phone",
            "family_situation_notes",
            "follow_up_notes",
            "last_session_date",
            "next_session_date",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class MedicalRecordSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    blood_group_display = serializers.CharField(
        source="get_blood_group_display", read_only=True
    )
    bmi = serializers.FloatField(read_only=True)
    history_entries = MedicalHistorySerializer(many=True, read_only=True)
    allergies = AllergySerializer(many=True, read_only=True)
    medications = MedicationSerializer(many=True, read_only=True)
    vaccinations = VaccinationSerializer(many=True, read_only=True)
    disabilities = DisabilitySerializer(many=True, read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            "id",
            "student",
            "student_name",
            "blood_group",
            "blood_group_display",
            "weight_height_history",
            "current_weight",
            "current_height",
            "bmi",
            "treating_doctor",
            "treating_doctor_phone",
            "insurance_provider",
            "cnas_number",
            "casnos_number",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relation",
            "notes",
            "history_entries",
            "allergies",
            "medications",
            "vaccinations",
            "disabilities",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "student_name", "bmi", "created_at", "updated_at"]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else ""


class MedicalRecordCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = [
            "student",
            "blood_group",
            "current_weight",
            "current_height",
            "treating_doctor",
            "treating_doctor_phone",
            "insurance_provider",
            "cnas_number",
            "casnos_number",
            "emergency_contact_name",
            "emergency_contact_phone",
            "emergency_contact_relation",
            "notes",
        ]


class MedicalRecordListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""

    student_name = serializers.SerializerMethodField()
    blood_group_display = serializers.CharField(
        source="get_blood_group_display", read_only=True
    )
    bmi = serializers.FloatField(read_only=True)
    allergy_count = serializers.SerializerMethodField()
    has_anaphylactic = serializers.SerializerMethodField()

    class Meta:
        model = MedicalRecord
        fields = [
            "id",
            "student",
            "student_name",
            "blood_group",
            "blood_group_display",
            "current_weight",
            "current_height",
            "bmi",
            "allergy_count",
            "has_anaphylactic",
            "created_at",
        ]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else ""

    def get_allergy_count(self, obj):
        return obj.allergies.count()

    def get_has_anaphylactic(self, obj):
        return obj.allergies.filter(severity="ANAPHYLACTIC").exists()


# ═══════════════════════════════════════════════════════════════════════════
# Teacher-restricted view: only accommodations
# ═══════════════════════════════════════════════════════════════════════════


class StudentAccommodationsSerializer(serializers.ModelSerializer):
    """Teacher view: only disability accommodations for a student, no medical details."""

    student_name = serializers.SerializerMethodField()
    disabilities = DisabilitySerializer(many=True, read_only=True)

    class Meta:
        model = MedicalRecord
        fields = ["id", "student", "student_name", "disabilities"]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else ""


# ═══════════════════════════════════════════════════════════════════════════
# Parent-restricted view: summary only
# ═══════════════════════════════════════════════════════════════════════════


class ParentMedicalSummarySerializer(serializers.ModelSerializer):
    """Parent view: basic info, allergies, medications, vaccinations. No psych records."""

    student_name = serializers.SerializerMethodField()
    blood_group_display = serializers.CharField(
        source="get_blood_group_display", read_only=True
    )
    bmi = serializers.FloatField(read_only=True)
    allergies = AllergySerializer(many=True, read_only=True)
    medications = MedicationSerializer(many=True, read_only=True)
    vaccinations = VaccinationSerializer(many=True, read_only=True)
    disabilities = DisabilitySerializer(many=True, read_only=True)

    class Meta:
        model = MedicalRecord
        fields = [
            "id",
            "student",
            "student_name",
            "blood_group",
            "blood_group_display",
            "current_weight",
            "current_height",
            "bmi",
            "allergies",
            "medications",
            "vaccinations",
            "disabilities",
            "created_at",
        ]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else ""


# ═══════════════════════════════════════════════════════════════════════════
# Consultation
# ═══════════════════════════════════════════════════════════════════════════


class ConsultationSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    nurse_name = serializers.SerializerMethodField()
    reason_display = serializers.CharField(source="get_reason_display", read_only=True)
    outcome_display = serializers.CharField(
        source="get_outcome_display", read_only=True
    )

    class Meta:
        model = Consultation
        fields = [
            "id",
            "student",
            "student_name",
            "nurse",
            "nurse_name",
            "consultation_datetime",
            "reason",
            "reason_display",
            "reason_detail",
            "symptoms_description",
            "temperature",
            "blood_pressure_systolic",
            "blood_pressure_diastolic",
            "spo2",
            "pulse",
            "blood_sugar",
            "weight",
            "height",
            "care_provided",
            "outcome",
            "outcome_display",
            "duration_minutes",
            "observations",
            "attachment",
            "parent_contacted",
            "parent_contacted_at",
            "created_at",
        ]
        read_only_fields = ["id", "nurse", "nurse_name", "created_at"]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else ""

    def get_nurse_name(self, obj):
        return obj.nurse.full_name if obj.nurse else ""


class ConsultationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Consultation
        fields = [
            "student",
            "consultation_datetime",
            "reason",
            "reason_detail",
            "symptoms_description",
            "temperature",
            "blood_pressure_systolic",
            "blood_pressure_diastolic",
            "spo2",
            "pulse",
            "blood_sugar",
            "weight",
            "height",
            "care_provided",
            "outcome",
            "duration_minutes",
            "observations",
            "attachment",
        ]


# ═══════════════════════════════════════════════════════════════════════════
# Emergency
# ═══════════════════════════════════════════════════════════════════════════


class EmergencyProtocolSerializer(serializers.ModelSerializer):
    emergency_type_display = serializers.CharField(
        source="get_emergency_type_display", read_only=True
    )

    class Meta:
        model = EmergencyProtocol
        fields = [
            "id",
            "emergency_type",
            "emergency_type_display",
            "title",
            "protocol_steps",
            "triggers",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class EmergencyEventSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    emergency_type_display = serializers.CharField(
        source="get_emergency_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    duration_seconds = serializers.IntegerField(read_only=True)

    class Meta:
        model = EmergencyEvent
        fields = [
            "id",
            "consultation",
            "protocol",
            "student",
            "student_name",
            "emergency_type",
            "emergency_type_display",
            "status",
            "status_display",
            "started_at",
            "ended_at",
            "duration_seconds",
            "actions_taken",
            "liaison_report_pdf",
            "post_emergency_report",
            "parent_notified",
            "parent_notified_at",
            "emergency_services_called",
            "created_at",
        ]
        read_only_fields = ["id", "duration_seconds", "created_at"]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else ""


class EmergencyEventCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyEvent
        fields = [
            "student",
            "emergency_type",
            "protocol",
            "consultation",
        ]


# ═══════════════════════════════════════════════════════════════════════════
# Messaging
# ═══════════════════════════════════════════════════════════════════════════


class InfirmeryMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    template_display = serializers.CharField(
        source="get_template_display", read_only=True
    )

    class Meta:
        model = InfirmeryMessage
        fields = [
            "id",
            "student",
            "student_name",
            "sender",
            "sender_name",
            "recipient",
            "recipient_name",
            "template",
            "template_display",
            "subject",
            "body",
            "attachment",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "sender",
            "sender_name",
            "is_read",
            "read_at",
            "created_at",
        ]

    def get_sender_name(self, obj):
        return obj.sender.full_name if obj.sender else ""

    def get_recipient_name(self, obj):
        return obj.recipient.full_name if obj.recipient else ""

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else ""


# ═══════════════════════════════════════════════════════════════════════════
# Absence Justification
# ═══════════════════════════════════════════════════════════════════════════


class AbsenceJustificationSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    submitted_by_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = AbsenceJustification
        fields = [
            "id",
            "student",
            "student_name",
            "submitted_by",
            "submitted_by_name",
            "consultation",
            "absence_date_start",
            "absence_date_end",
            "generic_reason",
            "medical_certificate",
            "status",
            "status_display",
            "validated_by",
            "validated_at",
            "rejection_reason",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "submitted_by",
            "submitted_by_name",
            "validated_by",
            "validated_at",
            "created_at",
        ]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else ""

    def get_submitted_by_name(self, obj):
        return obj.submitted_by.full_name if obj.submitted_by else ""


# ═══════════════════════════════════════════════════════════════════════════
# Epidemic
# ═══════════════════════════════════════════════════════════════════════════


class EpidemicAlertSerializer(serializers.ModelSerializer):
    alert_level_display = serializers.CharField(
        source="get_alert_level_display", read_only=True
    )
    classroom_name = serializers.SerializerMethodField()

    class Meta:
        model = EpidemicAlert
        fields = [
            "id",
            "classroom",
            "classroom_name",
            "disease_name",
            "case_count",
            "detection_date",
            "alert_level",
            "alert_level_display",
            "is_contagious",
            "description",
            "actions_taken",
            "is_resolved",
            "resolved_at",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_classroom_name(self, obj):
        return str(obj.classroom) if obj.classroom else ""


class ContagiousDiseaseSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ContagiousDisease
        fields = [
            "id",
            "student",
            "student_name",
            "epidemic_alert",
            "disease_name",
            "onset_date",
            "recommended_eviction_days",
            "authorized_return_date",
            "status",
            "status_display",
            "notes",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_student_name(self, obj):
        return obj.student.full_name if obj.student else ""
