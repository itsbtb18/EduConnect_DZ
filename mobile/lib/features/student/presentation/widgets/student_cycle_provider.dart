import 'package:flutter/material.dart';

/// Student cycle enum derived from sectionType
enum StudentCycle {
  primary,  // 5-11 years — Primaire (1AP-5AP)
  middle,   // 11-15 years — CEM/Moyen (1AM-4AM)
  high,     // 15-18 years — Lycée (1AS-3AS)
}

/// Parse backend section_type string to cycle.
StudentCycle parseCycle(String? sectionType) {
  final upper = (sectionType ?? '').toUpperCase();
  if (upper.contains('PRIMARY') || upper.contains('PRIMAIRE')) {
    return StudentCycle.primary;
  }
  if (upper.contains('HIGH') || upper.contains('LYCÉE') || upper.contains('LYCEE')) {
    return StudentCycle.high;
  }
  // Default to middle (CEM)
  return StudentCycle.middle;
}

/// Provides cycle-specific theme overrides for student screens.
class CycleTheme {
  final StudentCycle cycle;

  const CycleTheme(this.cycle);

  double get titleFontSize => switch (cycle) {
    StudentCycle.primary => 24,
    StudentCycle.middle => 20,
    StudentCycle.high => 18,
  };

  double get bodyFontSize => switch (cycle) {
    StudentCycle.primary => 18,
    StudentCycle.middle => 14,
    StudentCycle.high => 14,
  };

  double get iconSize => switch (cycle) {
    StudentCycle.primary => 40,
    StudentCycle.middle => 28,
    StudentCycle.high => 24,
  };

  double get cardRadius => switch (cycle) {
    StudentCycle.primary => 20,
    StudentCycle.middle => 16,
    StudentCycle.high => 12,
  };

  double get buttonHeight => switch (cycle) {
    StudentCycle.primary => 64,
    StudentCycle.middle => 48,
    StudentCycle.high => 44,
  };

  EdgeInsets get contentPadding => switch (cycle) {
    StudentCycle.primary => const EdgeInsets.all(20),
    StudentCycle.middle => const EdgeInsets.all(16),
    StudentCycle.high => const EdgeInsets.all(12),
  };

  bool get showGamification => cycle == StudentCycle.primary;

  bool get showDetailedStats => cycle == StudentCycle.high;
}

/// InheritedWidget to provide student cycle info down the widget tree.
class StudentCycleProvider extends InheritedWidget {
  final StudentCycle cycle;
  final CycleTheme theme;

  StudentCycleProvider({
    super.key,
    required this.cycle,
    required super.child,
  }) : theme = CycleTheme(cycle);

  static StudentCycleProvider? maybeOf(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<StudentCycleProvider>();
  }

  static StudentCycle cycleOf(BuildContext context) {
    return maybeOf(context)?.cycle ?? StudentCycle.middle;
  }

  static CycleTheme themeOf(BuildContext context) {
    return maybeOf(context)?.theme ?? const CycleTheme(StudentCycle.middle);
  }

  @override
  bool updateShouldNotify(StudentCycleProvider oldWidget) {
    return cycle != oldWidget.cycle;
  }
}
