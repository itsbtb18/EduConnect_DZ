/// Models for the Infirmerie (school infirmary) module — parent view.
library;

class MedicalSummary {
  final String id;
  final String studentName;
  final String bloodGroup;
  final double? weight;
  final double? height;
  final double? bmi;
  final String? treatingDoctor;
  final String? insuranceType;
  final String? insuranceNumber;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final List<AllergyInfo> allergies;
  final List<MedicationInfo> activeMedications;
  final List<DisabilityInfo> disabilities;

  const MedicalSummary({
    required this.id,
    required this.studentName,
    required this.bloodGroup,
    this.weight,
    this.height,
    this.bmi,
    this.treatingDoctor,
    this.insuranceType,
    this.insuranceNumber,
    this.emergencyContactName,
    this.emergencyContactPhone,
    this.allergies = const [],
    this.activeMedications = const [],
    this.disabilities = const [],
  });

  factory MedicalSummary.fromJson(Map<String, dynamic> json) {
    return MedicalSummary(
      id: json['id'] as String? ?? '',
      studentName: json['student_name'] as String? ?? '',
      bloodGroup: json['blood_group'] as String? ?? 'UNKNOWN',
      weight: (json['weight'] as num?)?.toDouble(),
      height: (json['height'] as num?)?.toDouble(),
      bmi: (json['bmi'] as num?)?.toDouble(),
      treatingDoctor: json['treating_doctor'] as String?,
      insuranceType: json['insurance_type'] as String?,
      insuranceNumber: json['insurance_number'] as String?,
      emergencyContactName: json['emergency_contact_name'] as String?,
      emergencyContactPhone: json['emergency_contact_phone'] as String?,
      allergies:
          (json['allergies'] as List<dynamic>?)
              ?.map((e) => AllergyInfo.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      activeMedications:
          (json['active_medications'] as List<dynamic>?)
              ?.map((e) => MedicationInfo.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      disabilities:
          (json['disabilities'] as List<dynamic>?)
              ?.map((e) => DisabilityInfo.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class AllergyInfo {
  final String id;
  final String allergyType;
  final String allergen;
  final String severity;
  final String? symptoms;
  final bool hasEpipen;

  const AllergyInfo({
    required this.id,
    required this.allergyType,
    required this.allergen,
    required this.severity,
    this.symptoms,
    this.hasEpipen = false,
  });

  bool get isAnaphylactic => severity == 'ANAPHYLACTIC';

  factory AllergyInfo.fromJson(Map<String, dynamic> json) {
    return AllergyInfo(
      id: json['id'] as String? ?? '',
      allergyType: json['allergy_type'] as String? ?? '',
      allergen: json['allergen'] as String? ?? '',
      severity: json['severity'] as String? ?? 'MILD',
      symptoms: json['symptoms'] as String?,
      hasEpipen: json['has_epipen'] as bool? ?? false,
    );
  }
}

class MedicationInfo {
  final String id;
  final String dciName;
  final String? commercialName;
  final String dosage;
  final String administrationRoute;
  final String frequency;
  final bool isActive;

  const MedicationInfo({
    required this.id,
    required this.dciName,
    this.commercialName,
    required this.dosage,
    required this.administrationRoute,
    required this.frequency,
    this.isActive = true,
  });

  factory MedicationInfo.fromJson(Map<String, dynamic> json) {
    return MedicationInfo(
      id: json['id'] as String? ?? '',
      dciName: json['dci_name'] as String? ?? '',
      commercialName: json['commercial_name'] as String?,
      dosage: json['dosage'] as String? ?? '',
      administrationRoute: json['administration_route'] as String? ?? '',
      frequency: json['frequency'] as String? ?? '',
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

class DisabilityInfo {
  final String id;
  final String disabilityType;
  final String autonomyLevel;
  final String? schoolAccommodations;

  const DisabilityInfo({
    required this.id,
    required this.disabilityType,
    required this.autonomyLevel,
    this.schoolAccommodations,
  });

  factory DisabilityInfo.fromJson(Map<String, dynamic> json) {
    return DisabilityInfo(
      id: json['id'] as String? ?? '',
      disabilityType: json['disability_type'] as String? ?? '',
      autonomyLevel: json['autonomy_level'] as String? ?? '',
      schoolAccommodations: json['school_accommodations'] as String?,
    );
  }
}

class VaccinationRecord {
  final String id;
  final String vaccineName;
  final String status;
  final DateTime? administrationDate;
  final String? lotNumber;
  final DateTime? nextDueDate;

  const VaccinationRecord({
    required this.id,
    required this.vaccineName,
    required this.status,
    this.administrationDate,
    this.lotNumber,
    this.nextDueDate,
  });

  bool get isOverdue => status == 'OVERDUE';
  bool get isDone => status == 'DONE';

  factory VaccinationRecord.fromJson(Map<String, dynamic> json) {
    return VaccinationRecord(
      id: json['id'] as String? ?? '',
      vaccineName: json['vaccine_name'] as String? ?? '',
      status: json['status'] as String? ?? 'NOT_DONE',
      administrationDate: json['administration_date'] != null
          ? DateTime.tryParse(json['administration_date'] as String)
          : null,
      lotNumber: json['lot_number'] as String?,
      nextDueDate: json['next_due_date'] != null
          ? DateTime.tryParse(json['next_due_date'] as String)
          : null,
    );
  }
}

class InfirmeryMessage {
  final String id;
  final String subject;
  final String body;
  final String template;
  final String? senderName;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;

  const InfirmeryMessage({
    required this.id,
    required this.subject,
    required this.body,
    required this.template,
    this.senderName,
    this.isRead = false,
    this.readAt,
    required this.createdAt,
  });

  factory InfirmeryMessage.fromJson(Map<String, dynamic> json) {
    return InfirmeryMessage(
      id: json['id'] as String? ?? '',
      subject: json['subject'] as String? ?? '',
      body: json['body'] as String? ?? '',
      template: json['template'] as String? ?? 'GENERAL',
      senderName: json['sender_name'] as String?,
      isRead: json['is_read'] as bool? ?? false,
      readAt: json['read_at'] != null
          ? DateTime.tryParse(json['read_at'] as String)
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }
}
