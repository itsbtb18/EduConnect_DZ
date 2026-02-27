/// Fee structure defined by the school.
///
/// Matches the Django finance app models.
class FeeStructure {
  final String id;
  final String name;
  final String? description;
  final double amount;
  final String? levelName;
  final String academicYearName;
  final DateTime? dueDate;
  final bool isActive;

  const FeeStructure({
    required this.id,
    required this.name,
    this.description,
    required this.amount,
    this.levelName,
    required this.academicYearName,
    this.dueDate,
    this.isActive = true,
  });

  factory FeeStructure.fromJson(Map<String, dynamic> json) {
    return FeeStructure(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      levelName: json['level_name'] as String?,
      academicYearName: json['academic_year_name'] as String? ?? '',
      dueDate: json['due_date'] != null
          ? DateTime.parse(json['due_date'] as String)
          : null,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

/// Payment record for a student
class Payment {
  final String id;
  final String studentId;
  final String? studentName;
  final String feeId;
  final String? feeName;
  final double amount;
  final String status; // pending, completed, failed, refunded
  final String? paymentMethod; // cash, ccp, baridi_mob, other
  final String? referenceNumber;
  final String? receiptUrl;
  final DateTime? paidAt;
  final DateTime createdAt;

  const Payment({
    required this.id,
    required this.studentId,
    this.studentName,
    required this.feeId,
    this.feeName,
    required this.amount,
    required this.status,
    this.paymentMethod,
    this.referenceNumber,
    this.receiptUrl,
    this.paidAt,
    required this.createdAt,
  });

  bool get isCompleted => status == 'completed';
  bool get isPending => status == 'pending';

  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] as String,
      studentId:
          json['student'] as String? ?? json['student_id'] as String? ?? '',
      studentName: json['student_name'] as String?,
      feeId: json['fee'] as String? ?? json['fee_id'] as String? ?? '',
      feeName: json['fee_name'] as String?,
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'pending',
      paymentMethod: json['payment_method'] as String?,
      referenceNumber: json['reference_number'] as String?,
      receiptUrl: json['receipt_file'] as String?,
      paidAt: json['paid_at'] != null
          ? DateTime.parse(json['paid_at'] as String)
          : null,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'student': studentId,
      'fee': feeId,
      'amount': amount,
      'payment_method': paymentMethod,
      'reference_number': referenceNumber,
    };
  }
}

/// Summary of a student's financial status
class FinanceSummary {
  final double totalFees;
  final double totalPaid;
  final double totalRemaining;
  final int pendingPayments;
  final List<FeeStatus> feeStatuses;

  const FinanceSummary({
    required this.totalFees,
    required this.totalPaid,
    required this.totalRemaining,
    this.pendingPayments = 0,
    this.feeStatuses = const [],
  });

  double get paidPercentage =>
      totalFees > 0 ? (totalPaid / totalFees * 100) : 0;

  factory FinanceSummary.fromJson(Map<String, dynamic> json) {
    return FinanceSummary(
      totalFees: (json['total_fees'] as num?)?.toDouble() ?? 0.0,
      totalPaid: (json['total_paid'] as num?)?.toDouble() ?? 0.0,
      totalRemaining: (json['total_remaining'] as num?)?.toDouble() ?? 0.0,
      pendingPayments: json['pending_payments'] as int? ?? 0,
      feeStatuses:
          (json['fee_statuses'] as List<dynamic>?)
              ?.map((e) => FeeStatus.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

/// Status of a specific fee for a student
class FeeStatus {
  final String feeId;
  final String feeName;
  final double amount;
  final double paid;
  final double remaining;
  final bool isFullyPaid;

  const FeeStatus({
    required this.feeId,
    required this.feeName,
    required this.amount,
    required this.paid,
    required this.remaining,
    this.isFullyPaid = false,
  });

  factory FeeStatus.fromJson(Map<String, dynamic> json) {
    return FeeStatus(
      feeId: json['fee_id'] as String? ?? '',
      feeName: json['fee_name'] as String? ?? '',
      amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
      paid: (json['paid'] as num?)?.toDouble() ?? 0.0,
      remaining: (json['remaining'] as num?)?.toDouble() ?? 0.0,
      isFullyPaid: json['is_fully_paid'] as bool? ?? false,
    );
  }
}
