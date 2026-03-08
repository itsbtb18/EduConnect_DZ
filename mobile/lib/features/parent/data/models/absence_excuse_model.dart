/// Absence excuse submitted by parent for a child's absence.
class AbsenceExcuse {
  final String id;
  final String attendanceRecordId;
  final String? studentName;
  final DateTime? absenceDate;
  final String justificationText;
  final String? attachmentUrl;
  final String status; // PENDING, APPROVED, REJECTED
  final String? reviewComment;
  final DateTime createdAt;

  const AbsenceExcuse({
    required this.id,
    required this.attendanceRecordId,
    this.studentName,
    this.absenceDate,
    required this.justificationText,
    this.attachmentUrl,
    this.status = 'PENDING',
    this.reviewComment,
    required this.createdAt,
  });

  bool get isPending => status == 'PENDING';
  bool get isApproved => status == 'APPROVED';
  bool get isRejected => status == 'REJECTED';

  String get statusLabel => switch (status) {
    'PENDING' => 'En attente',
    'APPROVED' => 'Validée',
    'REJECTED' => 'Rejetée',
    _ => status,
  };

  factory AbsenceExcuse.fromJson(Map<String, dynamic> json) {
    return AbsenceExcuse(
      id: json['id'] as String,
      attendanceRecordId:
          json['attendance_record'] as String? ??
          json['attendance_record_id'] as String? ??
          '',
      studentName: json['student_name'] as String?,
      absenceDate: json['absence_date'] != null
          ? DateTime.parse(json['absence_date'] as String)
          : null,
      justificationText: json['justification_text'] as String? ?? '',
      attachmentUrl: json['attachment'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      reviewComment: json['review_comment'] as String?,
      createdAt: DateTime.parse(
        json['created_at'] as String? ?? DateTime.now().toIso8601String(),
      ),
    );
  }
}
