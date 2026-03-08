/// Exam management models for teacher grade workflow
class ExamConfig {
  final String id;
  final String name;
  final String? nameAr;
  final double weight;
  final double percentage;
  final String? classroomId;
  final String? subjectId;
  final String? trimester;

  const ExamConfig({
    required this.id,
    required this.name,
    this.nameAr,
    this.weight = 1.0,
    this.percentage = 0,
    this.classroomId,
    this.subjectId,
    this.trimester,
  });

  factory ExamConfig.fromJson(Map<String, dynamic> json) => ExamConfig(
    id: json['id'] as String,
    name: json['name'] as String,
    nameAr: json['name_ar'] as String?,
    weight: (json['weight'] as num?)?.toDouble() ?? 1.0,
    percentage: (json['percentage'] as num?)?.toDouble() ?? 0,
    classroomId:
        json['classroom'] as String? ?? json['classroom_id'] as String?,
    subjectId: json['subject'] as String? ?? json['subject_id'] as String?,
    trimester: json['trimester'] as String?,
  );

  Map<String, dynamic> toJson() => {
    'name': name,
    if (nameAr != null) 'name_ar': nameAr,
    'weight': weight,
    'percentage': percentage,
    if (classroomId != null) 'classroom_id': classroomId,
    if (subjectId != null) 'subject_id': subjectId,
    if (trimester != null) 'trimester': trimester,
  };
}

class GradeWorkflowStatus {
  final int draft;
  final int submitted;
  final int published;
  final int returned;
  final int total;

  const GradeWorkflowStatus({
    this.draft = 0,
    this.submitted = 0,
    this.published = 0,
    this.returned = 0,
    this.total = 0,
  });

  factory GradeWorkflowStatus.fromJson(Map<String, dynamic> json) =>
      GradeWorkflowStatus(
        draft: json['draft'] as int? ?? json['DRAFT'] as int? ?? 0,
        submitted: json['submitted'] as int? ?? json['SUBMITTED'] as int? ?? 0,
        published: json['published'] as int? ?? json['PUBLISHED'] as int? ?? 0,
        returned: json['returned'] as int? ?? json['RETURNED'] as int? ?? 0,
        total: json['total'] as int? ?? 0,
      );
}

class CsvPreviewResult {
  final List<CsvPreviewRow> matched;
  final List<String> unmatched;
  final String previewId;

  const CsvPreviewResult({
    required this.matched,
    required this.unmatched,
    required this.previewId,
  });

  factory CsvPreviewResult.fromJson(Map<String, dynamic> json) =>
      CsvPreviewResult(
        matched:
            (json['matched'] as List<dynamic>?)
                ?.map((e) => CsvPreviewRow.fromJson(e as Map<String, dynamic>))
                .toList() ??
            [],
        unmatched:
            (json['unmatched'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        previewId: json['preview_id'] as String? ?? '',
      );
}

class CsvPreviewRow {
  final String studentId;
  final String studentName;
  final double score;

  const CsvPreviewRow({
    required this.studentId,
    required this.studentName,
    required this.score,
  });

  factory CsvPreviewRow.fromJson(Map<String, dynamic> json) => CsvPreviewRow(
    studentId: json['student_id'] as String,
    studentName: json['student_name'] as String,
    score: (json['score'] as num).toDouble(),
  );
}
