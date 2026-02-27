/// School model matching Django schools app
class School {
  final String id;
  final String name;
  final String? nameAr;
  final String code;
  final String? logo;
  final String? email;
  final String? phone;
  final String? address;
  final String? wilaya;
  final String schoolType; // primary, middle, secondary, combined
  final String subscriptionPlan;
  final DateTime? subscriptionExpiry;
  final int maxStudents;
  final bool isActive;

  const School({
    required this.id,
    required this.name,
    this.nameAr,
    required this.code,
    this.logo,
    this.email,
    this.phone,
    this.address,
    this.wilaya,
    this.schoolType = 'combined',
    this.subscriptionPlan = 'basic',
    this.subscriptionExpiry,
    this.maxStudents = 100,
    this.isActive = true,
  });

  factory School.fromJson(Map<String, dynamic> json) {
    return School(
      id: json['id'] as String,
      name: json['name'] as String,
      nameAr: json['name_ar'] as String?,
      code: json['code'] as String,
      logo: json['logo'] as String?,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      wilaya: json['wilaya'] as String?,
      schoolType: json['school_type'] as String? ?? 'combined',
      subscriptionPlan: json['subscription_plan'] as String? ?? 'basic',
      subscriptionExpiry: json['subscription_expiry'] != null
          ? DateTime.parse(json['subscription_expiry'] as String)
          : null,
      maxStudents: json['max_students'] as int? ?? 100,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

/// Academic year
class AcademicYear {
  final String id;
  final String name;
  final DateTime startDate;
  final DateTime endDate;
  final bool isCurrent;

  const AcademicYear({
    required this.id,
    required this.name,
    required this.startDate,
    required this.endDate,
    this.isCurrent = false,
  });

  factory AcademicYear.fromJson(Map<String, dynamic> json) {
    return AcademicYear(
      id: json['id'] as String,
      name: json['name'] as String,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: DateTime.parse(json['end_date'] as String),
      isCurrent: json['is_current'] as bool? ?? false,
    );
  }
}
