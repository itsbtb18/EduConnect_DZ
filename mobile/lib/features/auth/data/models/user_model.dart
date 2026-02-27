/// User model matching the Django accounts.User model
class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? firstNameAr;
  final String? lastNameAr;
  final String role; // superadmin, admin, teacher, parent, student
  final String? phone;
  final String? avatar;
  final String? schoolId;
  final String? schoolName;
  final String language;
  final bool isActive;
  final bool mustChangePassword;

  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.firstNameAr,
    this.lastNameAr,
    required this.role,
    this.phone,
    this.avatar,
    this.schoolId,
    this.schoolName,
    this.language = 'fr',
    this.isActive = true,
    this.mustChangePassword = false,
  });

  String get fullName => '$firstName $lastName';
  String get fullNameAr => (firstNameAr != null && lastNameAr != null)
      ? '$firstNameAr $lastNameAr'
      : fullName;

  bool get isAdmin => role == 'admin' || role == 'superadmin';
  bool get isTeacher => role == 'teacher';
  bool get isStudent => role == 'student';
  bool get isParent => role == 'parent';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      firstNameAr: json['first_name_ar'] as String?,
      lastNameAr: json['last_name_ar'] as String?,
      role: json['role'] as String,
      phone: json['phone'] as String?,
      avatar: json['avatar'] as String?,
      schoolId: json['school'] as String?,
      schoolName: json['school_name'] as String?,
      language: json['language'] as String? ?? 'fr',
      isActive: json['is_active'] as bool? ?? true,
      mustChangePassword: json['must_change_password'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'first_name': firstName,
      'last_name': lastName,
      'first_name_ar': firstNameAr,
      'last_name_ar': lastNameAr,
      'role': role,
      'phone': phone,
      'avatar': avatar,
      'school': schoolId,
      'language': language,
    };
  }
}

/// Login response from the JWT endpoint
class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final User user;

  const LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['access'] as String,
      refreshToken: json['refresh'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
