/// Utility helpers for the EduConnect Flutter app
library;

import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Get appropriate color for a grade value (out of 20)
Color gradeColor(double grade) {
  if (grade >= 16) return AppColors.gradeExcellent;
  if (grade >= 14) return AppColors.gradeGood;
  if (grade >= 10) return AppColors.gradeAverage;
  return AppColors.gradeFailing;
}

/// Format a grade for display
String formatGrade(double grade) {
  return grade == grade.roundToDouble()
      ? grade.toInt().toString()
      : grade.toStringAsFixed(2);
}

/// Get French label for a day of the week (Algerian schedule)
String dayLabel(int dayIndex) {
  const days = [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
  ];
  return days[dayIndex % 7];
}

/// Truncate a string to max length with ellipsis
String truncate(String text, int maxLength) {
  if (text.length <= maxLength) return text;
  return '${text.substring(0, maxLength)}...';
}

/// Generate initials from a name (supports Arabic and French)
String initials(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty) return '';
  if (parts.length == 1) return parts[0][0].toUpperCase();
  return '${parts[0][0]}${parts.last[0]}'.toUpperCase();
}

/// Get role display name in French
String roleLabelFr(String role) {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'teacher':
      return 'Enseignant';
    case 'student':
      return 'Élève';
    case 'parent':
      return 'Parent';
    case 'superadmin':
      return 'Super Admin';
    default:
      return role;
  }
}

/// Get role display name in Arabic
String roleLabelAr(String role) {
  switch (role) {
    case 'admin':
      return 'مدير';
    case 'teacher':
      return 'أستاذ';
    case 'student':
      return 'تلميذ';
    case 'parent':
      return 'ولي أمر';
    case 'superadmin':
      return 'المدير العام';
    default:
      return role;
  }
}

/// Format file size for display
String formatFileSize(int bytes) {
  if (bytes < 1024) return '$bytes B';
  if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
  return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
}
