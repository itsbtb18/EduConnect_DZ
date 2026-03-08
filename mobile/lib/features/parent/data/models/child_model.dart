/// Child profile for parent's view — represents a student linked to parent.
class ChildProfile {
  final String id; // StudentProfile UUID
  final String userId; // User UUID
  final String firstName;
  final String lastName;
  final String? firstNameAr;
  final String? lastNameAr;
  final String? avatar;
  final String studentId; // School-issued ID (e.g. "STU-2024-001")
  final String? classroomName;
  final String? classroomId;
  final String? schoolId;
  final String? schoolName;
  final int unreadNotifications;

  const ChildProfile({
    required this.id,
    required this.userId,
    required this.firstName,
    required this.lastName,
    this.firstNameAr,
    this.lastNameAr,
    this.avatar,
    required this.studentId,
    this.classroomName,
    this.classroomId,
    this.schoolId,
    this.schoolName,
    this.unreadNotifications = 0,
  });

  String get fullName => '$firstName $lastName';

  factory ChildProfile.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return ChildProfile(
      id: json['id'] as String,
      userId: user?['id'] as String? ?? json['user_id'] as String? ?? '',
      firstName:
          user?['first_name'] as String? ?? json['first_name'] as String? ?? '',
      lastName:
          user?['last_name'] as String? ?? json['last_name'] as String? ?? '',
      firstNameAr:
          user?['first_name_ar'] as String? ?? json['first_name_ar'] as String?,
      lastNameAr:
          user?['last_name_ar'] as String? ?? json['last_name_ar'] as String?,
      avatar: user?['avatar'] as String? ?? json['avatar'] as String?,
      studentId: json['student_id'] as String? ?? '',
      classroomName:
          json['current_class_name'] as String? ??
          json['classroom_name'] as String?,
      classroomId:
          json['current_class'] as String? ?? json['classroom_id'] as String?,
      schoolId:
          json['school'] as String? ??
          user?['school'] as String? ??
          json['school_id'] as String?,
      schoolName:
          json['school_name'] as String? ?? user?['school_name'] as String?,
      unreadNotifications: json['unread_notifications'] as int? ?? 0,
    );
  }
}
