/// Student ID card data model matching the Django
/// `GET /api/v1/academics/students/<uuid>/card/` response.
class StudentCardData {
  final String id;
  final String fullName;
  final String firstName;
  final String lastName;
  final String? photo;
  final String? dateOfBirth;
  final String studentId;
  final String? enrollmentDate;

  // Class info
  final String className;
  final String sectionType;
  final String academicYear;

  // School info
  final SchoolCardInfo school;

  // QR code
  final String qrCodeBase64;
  final String qrData;

  final String generatedAt;

  const StudentCardData({
    required this.id,
    required this.fullName,
    required this.firstName,
    required this.lastName,
    this.photo,
    this.dateOfBirth,
    required this.studentId,
    this.enrollmentDate,
    required this.className,
    required this.sectionType,
    required this.academicYear,
    required this.school,
    required this.qrCodeBase64,
    required this.qrData,
    required this.generatedAt,
  });

  factory StudentCardData.fromJson(Map<String, dynamic> json) {
    return StudentCardData(
      id: json['id'] as String,
      fullName: json['full_name'] as String,
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      photo: json['photo'] as String?,
      dateOfBirth: json['date_of_birth'] as String?,
      studentId: json['student_id'] as String? ?? '',
      enrollmentDate: json['enrollment_date'] as String?,
      className: json['class_name'] as String? ?? '',
      sectionType: json['section_type'] as String? ?? '',
      academicYear: json['academic_year'] as String? ?? '',
      school: SchoolCardInfo.fromJson(
        json['school'] as Map<String, dynamic>? ?? {},
      ),
      qrCodeBase64: json['qr_code_base64'] as String? ?? '',
      qrData: json['qr_data'] as String? ?? '',
      generatedAt: json['generated_at'] as String? ?? '',
    );
  }
}

class SchoolCardInfo {
  final String id;
  final String name;
  final String? logo;
  final String motto;
  final String address;
  final String phone;
  final String wilaya;

  const SchoolCardInfo({
    required this.id,
    required this.name,
    this.logo,
    this.motto = '',
    this.address = '',
    this.phone = '',
    this.wilaya = '',
  });

  factory SchoolCardInfo.fromJson(Map<String, dynamic> json) {
    return SchoolCardInfo(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      logo: json['logo'] as String?,
      motto: json['motto'] as String? ?? '',
      address: json['address'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      wilaya: json['wilaya'] as String? ?? '',
    );
  }
}
