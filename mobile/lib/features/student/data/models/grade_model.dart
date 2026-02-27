/// Grade models matching Django grades app
library;

class ExamType {
  final String id;
  final String name;
  final String? nameAr;
  final double weight;

  const ExamType({
    required this.id,
    required this.name,
    this.nameAr,
    this.weight = 1.0,
  });

  factory ExamType.fromJson(Map<String, dynamic> json) => ExamType(
    id: json['id'] as String,
    name: json['name'] as String,
    nameAr: json['name_ar'] as String?,
    weight: (json['weight'] as num?)?.toDouble() ?? 1.0,
  );
}

class Grade {
  final String id;
  final String studentId;
  final String? studentName;
  final String subjectId;
  final String? subjectName;
  final String examTypeId;
  final String? examTypeName;
  final double score;
  final double maxScore;
  final String? remark;
  final String status; // draft, submitted, published, rejected
  final DateTime? gradedAt;

  const Grade({
    required this.id,
    required this.studentId,
    this.studentName,
    required this.subjectId,
    this.subjectName,
    required this.examTypeId,
    this.examTypeName,
    required this.score,
    this.maxScore = 20.0,
    this.remark,
    this.status = 'published',
    this.gradedAt,
  });

  double get percentage => (score / maxScore) * 100;
  double get normalizedScore => (score / maxScore) * 20; // Normalize to /20

  factory Grade.fromJson(Map<String, dynamic> json) => Grade(
    id: json['id'] as String,
    studentId: json['student'] as String,
    studentName: json['student_name'] as String?,
    subjectId: json['subject'] as String,
    subjectName: json['subject_name'] as String?,
    examTypeId: json['exam_type'] as String,
    examTypeName: json['exam_type_name'] as String?,
    score: (json['score'] as num).toDouble(),
    maxScore: (json['max_score'] as num?)?.toDouble() ?? 20.0,
    remark: json['remark'] as String?,
    status: json['status'] as String? ?? 'published',
    gradedAt: json['graded_at'] != null
        ? DateTime.parse(json['graded_at'] as String)
        : null,
  );
}

class ReportCard {
  final String id;
  final String studentId;
  final String? studentName;
  final String semesterId;
  final String? semesterName;
  final double? generalAverage;
  final int? rank;
  final int? totalStudents;
  final String? pdfUrl;
  final String? adminComment;
  final List<SubjectAverage> subjectAverages;

  const ReportCard({
    required this.id,
    required this.studentId,
    this.studentName,
    required this.semesterId,
    this.semesterName,
    this.generalAverage,
    this.rank,
    this.totalStudents,
    this.pdfUrl,
    this.adminComment,
    this.subjectAverages = const [],
  });

  factory ReportCard.fromJson(Map<String, dynamic> json) => ReportCard(
    id: json['id'] as String,
    studentId: json['student'] as String,
    studentName: json['student_name'] as String?,
    semesterId: json['semester'] as String,
    semesterName: json['semester_name'] as String?,
    generalAverage: (json['general_average'] as num?)?.toDouble(),
    rank: json['rank'] as int?,
    totalStudents: json['total_students'] as int?,
    pdfUrl: json['pdf'] as String?,
    adminComment: json['admin_comment'] as String?,
    subjectAverages:
        (json['subject_averages'] as List?)
            ?.map((e) => SubjectAverage.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [],
  );
}

class SubjectAverage {
  final String subjectName;
  final double average;
  final double coefficient;

  const SubjectAverage({
    required this.subjectName,
    required this.average,
    required this.coefficient,
  });

  factory SubjectAverage.fromJson(Map<String, dynamic> json) => SubjectAverage(
    subjectName: json['subject_name'] as String,
    average: (json['average'] as num).toDouble(),
    coefficient: (json['coefficient'] as num).toDouble(),
  );
}
