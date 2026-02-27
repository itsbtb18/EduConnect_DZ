/// Form validation helpers for the EduConnect app.
class AppValidators {
  AppValidators._();

  /// Validates email format.
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email is required';
    }
    final regex = RegExp(r'^[\w\.-]+@[\w\.-]+\.\w{2,}$');
    if (!regex.hasMatch(value.trim())) {
      return 'Enter a valid email address';
    }
    return null;
  }

  /// Validates password (minimum 8 chars, at least one letter and one digit).
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!RegExp(r'[A-Za-z]').hasMatch(value)) {
      return 'Password must contain at least one letter';
    }
    if (!RegExp(r'\d').hasMatch(value)) {
      return 'Password must contain at least one number';
    }
    return null;
  }

  /// Validates password confirmation matches.
  static String? Function(String?) confirmPassword(String password) {
    return (String? value) {
      if (value == null || value.isEmpty) {
        return 'Please confirm your password';
      }
      if (value != password) {
        return 'Passwords do not match';
      }
      return null;
    };
  }

  /// Validates required field.
  static String? required(String? value, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  /// Validates Algerian phone number (0x xx xx xx xx).
  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Phone number is required';
    }
    final cleaned = value.replaceAll(RegExp(r'[\s\-]'), '');
    final regex = RegExp(r'^(0|\+213)[5-7]\d{8}$');
    if (!regex.hasMatch(cleaned)) {
      return 'Enter a valid Algerian phone number';
    }
    return null;
  }

  /// Validates a grade score (0-20).
  static String? gradeScore(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Score is required';
    }
    final score = double.tryParse(value);
    if (score == null) {
      return 'Enter a valid number';
    }
    if (score < 0 || score > 20) {
      return 'Score must be between 0 and 20';
    }
    return null;
  }

  /// Validates a coefficient (1-9).
  static String? coefficient(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Coefficient is required';
    }
    final coeff = int.tryParse(value);
    if (coeff == null || coeff < 1 || coeff > 9) {
      return 'Coefficient must be between 1 and 9';
    }
    return null;
  }

  /// Validates minimum length.
  static String? Function(String?) minLength(int min) {
    return (String? value) {
      if (value != null && value.trim().length < min) {
        return 'Must be at least $min characters';
      }
      return null;
    };
  }

  /// Validates maximum length.
  static String? Function(String?) maxLength(int max) {
    return (String? value) {
      if (value != null && value.trim().length > max) {
        return 'Must be at most $max characters';
      }
      return null;
    };
  }

  /// Compose multiple validators—returns the first non-null error.
  static String? Function(String?) compose(
    List<String? Function(String?)> validators,
  ) {
    return (String? value) {
      for (final validator in validators) {
        final error = validator(value);
        if (error != null) return error;
      }
      return null;
    };
  }
}
