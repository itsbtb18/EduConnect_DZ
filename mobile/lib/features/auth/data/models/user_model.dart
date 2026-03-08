/// Child info for parent contexts
class ChildInfo {
  final String id;
  final String firstName;
  final String lastName;
  final String? className;
  final String? photo;

  const ChildInfo({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.className,
    this.photo,
  });

  String get fullName => '$firstName $lastName';

  factory ChildInfo.fromJson(Map<String, dynamic> json) {
    return ChildInfo(
      id: json['id'] as String,
      firstName: json['first_name'] as String? ?? '',
      lastName: json['last_name'] as String? ?? '',
      className: json['class_name'] as String?,
      photo: json['photo'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'first_name': firstName,
    'last_name': lastName,
    'class_name': className,
    'photo': photo,
  };
}

/// A single role+school context for the authenticated user.
class UserContext {
  final String contextId;
  final String type; // SCHOOL, FORMATION, PLATFORM
  final String role;
  final String? schoolId;
  final String? schoolName;
  final String? schoolLogo;
  final List<String> modulesActive;
  final List<ChildInfo> children;

  const UserContext({
    required this.contextId,
    required this.type,
    required this.role,
    this.schoolId,
    this.schoolName,
    this.schoolLogo,
    this.modulesActive = const [],
    this.children = const [],
  });

  /// Display label for role
  String get roleLabel => switch (role) {
    'TEACHER' => 'Enseignant',
    'PARENT' => 'Parent',
    'STUDENT' => 'Élève',
    'ADMIN' => 'Administrateur',
    'SUPER_ADMIN' => 'Super Admin',
    'DIRECTOR' => 'Directeur',
    'ACCOUNTANT' => 'Comptable',
    'DRIVER' => 'Chauffeur',
    'TRAINER' => 'Formateur',
    'TRAINEE' => 'Apprenant',
    _ => role,
  };

  /// Role icon
  String get roleEmoji => switch (role) {
    'TEACHER' => '👨‍🏫',
    'PARENT' => '👨‍👧',
    'STUDENT' => '🎓',
    'ADMIN' => '⚙️',
    'SUPER_ADMIN' => '🛡️',
    'DIRECTOR' => '🏫',
    'ACCOUNTANT' => '💰',
    'DRIVER' => '🚌',
    'TRAINER' => '👨‍🏫',
    'TRAINEE' => '🎓',
    _ => '👤',
  };

  /// Lowercase role for router matching
  String get routeRole => role.toLowerCase();

  factory UserContext.fromJson(Map<String, dynamic> json) {
    return UserContext(
      contextId: json['context_id'] as String,
      type: json['type'] as String? ?? 'SCHOOL',
      role: json['role'] as String,
      schoolId: json['school_id'] as String?,
      schoolName: json['school_name'] as String?,
      schoolLogo: json['school_logo'] as String?,
      modulesActive:
          (json['modules_active'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      children:
          (json['children'] as List<dynamic>?)
              ?.map((e) => ChildInfo.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
    'context_id': contextId,
    'type': type,
    'role': role,
    'school_id': schoolId,
    'school_name': schoolName,
    'school_logo': schoolLogo,
    'modules_active': modulesActive,
    'children': children.map((c) => c.toJson()).toList(),
  };
}

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
  final List<UserContext> contexts;

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
    this.contexts = const [],
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
      contexts:
          (json['contexts'] as List<dynamic>?)
              ?.map((e) => UserContext.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
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

/// Login response from the JWT endpoint.
/// Backend returns flat: {access, refresh, role, is_first_login, school_id, contexts}
/// NOT a nested user object — we call /me after to get full User data.
class LoginResponse {
  final String? accessToken;
  final String? refreshToken;
  final String role;
  final bool isFirstLogin;
  final String? schoolId;
  final List<UserContext> contexts;

  /// Multi-step login: set when OTP verification is required.
  final bool requiresOtp;

  /// Multi-step login: set when TOTP verification is required.
  final bool requiresTotp;

  /// Temporary token used to complete OTP/TOTP verification.
  final String? tempToken;

  /// Whether login is complete (has tokens).
  bool get isComplete => accessToken != null && refreshToken != null;

  const LoginResponse({
    this.accessToken,
    this.refreshToken,
    this.role = '',
    this.isFirstLogin = false,
    this.schoolId,
    this.contexts = const [],
    this.requiresOtp = false,
    this.requiresTotp = false,
    this.tempToken,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['access'] as String?,
      refreshToken: json['refresh'] as String?,
      role: json['role'] as String? ?? '',
      isFirstLogin: json['is_first_login'] as bool? ?? false,
      schoolId: json['school_id'] as String?,
      requiresOtp: json['requires_otp'] as bool? ?? false,
      requiresTotp: json['requires_totp'] as bool? ?? false,
      tempToken: json['temp_token'] as String?,
      contexts:
          (json['contexts'] as List<dynamic>?)
              ?.map((e) => UserContext.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
