/// Attendance model matching the Django attendance.Attendance model.
class Attendance {
  final String id;
  final String studentId;
  final String? studentName;
  final String status; // present, absent, late, excused
  final DateTime date;
  final String? sessionType; // morning, afternoon
  final String? notes;
  final String? justification;
  final DateTime? createdAt;

  const Attendance({
    required this.id,
    required this.studentId,
    this.studentName,
    required this.status,
    required this.date,
    this.sessionType,
    this.notes,
    this.justification,
    this.createdAt,
  });

  bool get isPresent => status == 'present';
  bool get isAbsent => status == 'absent';
  bool get isLate => status == 'late';
  bool get isExcused => status == 'excused';

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'] as String,
      studentId:
          json['student'] as String? ?? json['student_id'] as String? ?? '',
      studentName: json['student_name'] as String?,
      status: json['status'] as String? ?? 'present',
      date: DateTime.parse(json['date'] as String),
      sessionType: json['session_type'] as String?,
      notes: json['notes'] as String?,
      justification: json['justification'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'student': studentId,
      'status': status,
      'date': date.toIso8601String().split('T').first,
      'session_type': sessionType,
      'notes': notes,
      'justification': justification,
    };
  }
}

/// Summary of attendance for a student over a period
class AttendanceSummary {
  final int totalDays;
  final int presentDays;
  final int absentDays;
  final int lateDays;
  final int excusedDays;
  final double attendanceRate;

  const AttendanceSummary({
    required this.totalDays,
    required this.presentDays,
    required this.absentDays,
    required this.lateDays,
    this.excusedDays = 0,
    required this.attendanceRate,
  });

  factory AttendanceSummary.fromJson(Map<String, dynamic> json) {
    return AttendanceSummary(
      totalDays: json['total_days'] as int? ?? 0,
      presentDays: json['present_days'] as int? ?? 0,
      absentDays: json['absent_days'] as int? ?? 0,
      lateDays: json['late_days'] as int? ?? 0,
      excusedDays: json['excused_days'] as int? ?? 0,
      attendanceRate: (json['attendance_rate'] as num?)?.toDouble() ?? 0.0,
    );
  }
}

/// Bulk attendance entry for a classroom
class BulkAttendanceEntry {
  final String studentId;
  final String status;
  final String? notes;

  const BulkAttendanceEntry({
    required this.studentId,
    required this.status,
    this.notes,
  });

  Map<String, dynamic> toJson() {
    return {
      'student': studentId,
      'status': status,
      if (notes != null) 'notes': notes,
    };
  }
}
