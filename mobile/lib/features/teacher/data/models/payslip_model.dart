/// Payslip model matching Django finance.PaySlip
class PaySlip {
  final String id;
  final String teacherId;
  final String? teacherName;
  final int month;
  final int year;
  final double baseSalary;
  final double totalBonuses;
  final double totalDeductions;
  final double netSalary;
  final String status; // DRAFT, VALIDATED, PAID
  final String? pdfUrl;
  final DateTime? paidAt;
  final DateTime? createdAt;
  final List<PaySlipDetail> details;

  const PaySlip({
    required this.id,
    required this.teacherId,
    this.teacherName,
    required this.month,
    required this.year,
    required this.baseSalary,
    this.totalBonuses = 0,
    this.totalDeductions = 0,
    required this.netSalary,
    this.status = 'DRAFT',
    this.pdfUrl,
    this.paidAt,
    this.createdAt,
    this.details = const [],
  });

  String get monthName => [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ][month - 1];

  String get periodLabel => '$monthName $year';

  bool get isPaid => status == 'PAID';

  factory PaySlip.fromJson(Map<String, dynamic> json) => PaySlip(
    id: json['id'] as String,
    teacherId: json['teacher'] as String? ?? '',
    teacherName: json['teacher_name'] as String?,
    month: json['month'] as int,
    year: json['year'] as int,
    baseSalary: (json['base_salary'] as num?)?.toDouble() ?? 0,
    totalBonuses: (json['total_bonuses'] as num?)?.toDouble() ?? 0,
    totalDeductions: (json['total_deductions'] as num?)?.toDouble() ?? 0,
    netSalary: (json['net_salary'] as num?)?.toDouble() ?? 0,
    status: json['status'] as String? ?? 'DRAFT',
    pdfUrl: json['pdf_url'] as String?,
    paidAt: json['paid_at'] != null
        ? DateTime.parse(json['paid_at'] as String)
        : null,
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'] as String)
        : null,
    details:
        (json['details'] as List<dynamic>?)
            ?.map((e) => PaySlipDetail.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [],
  );
}

class PaySlipDetail {
  final String label;
  final String type; // bonus, deduction, base
  final double amount;

  const PaySlipDetail({
    required this.label,
    required this.type,
    required this.amount,
  });

  factory PaySlipDetail.fromJson(Map<String, dynamic> json) => PaySlipDetail(
    label: json['label'] as String? ?? json['name'] as String? ?? '',
    type: json['type'] as String? ?? 'base',
    amount: (json['amount'] as num?)?.toDouble() ?? 0,
  );
}
