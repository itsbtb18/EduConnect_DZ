/// Homework models matching Django homework app
library;

class HomeworkTask {
  final String id;
  final String title;
  final String? description;
  final String subjectId;
  final String? subjectName;
  final String? classroomId;
  final String? classroomName;
  final String? teacherName;
  final DateTime dueDate;
  final String? attachmentUrl;
  final DateTime createdAt;
  final int submissionCount;
  final int totalStudents;
  final bool hasSubmitted; // For student view

  const HomeworkTask({
    required this.id,
    required this.title,
    this.description,
    required this.subjectId,
    this.subjectName,
    this.classroomId,
    this.classroomName,
    this.teacherName,
    required this.dueDate,
    this.attachmentUrl,
    required this.createdAt,
    this.submissionCount = 0,
    this.totalStudents = 0,
    this.hasSubmitted = false,
  });

  bool get isOverdue => DateTime.now().isAfter(dueDate);
  bool get isDueSoon =>
      !isOverdue && dueDate.difference(DateTime.now()).inHours < 24;

  factory HomeworkTask.fromJson(Map<String, dynamic> json) => HomeworkTask(
    id: json['id'] as String,
    title: json['title'] as String,
    description: json['description'] as String?,
    subjectId: json['subject'] as String,
    subjectName: json['subject_name'] as String?,
    classroomId: json['classroom'] as String?,
    classroomName: json['classroom_name'] as String?,
    teacherName: json['teacher_name'] as String?,
    dueDate: DateTime.parse(json['due_date'] as String),
    attachmentUrl: json['attachment'] as String?,
    createdAt: DateTime.parse(json['created_at'] as String),
    submissionCount: json['submission_count'] as int? ?? 0,
    totalStudents: json['total_students'] as int? ?? 0,
    hasSubmitted: json['has_submitted'] as bool? ?? false,
  );
}

class HomeworkSubmission {
  final String id;
  final String taskId;
  final String studentId;
  final String? studentName;
  final String? content;
  final String? fileUrl;
  final String status; // pending, submitted, late, graded
  final double? grade;
  final String? feedback;
  final DateTime? submittedAt;
  final DateTime? gradedAt;

  const HomeworkSubmission({
    required this.id,
    required this.taskId,
    required this.studentId,
    this.studentName,
    this.content,
    this.fileUrl,
    this.status = 'pending',
    this.grade,
    this.feedback,
    this.submittedAt,
    this.gradedAt,
  });

  bool get isGraded => status == 'graded';
  bool get isLate => status == 'late';

  factory HomeworkSubmission.fromJson(Map<String, dynamic> json) =>
      HomeworkSubmission(
        id: json['id'] as String,
        taskId: json['task'] as String,
        studentId: json['student'] as String,
        studentName: json['student_name'] as String?,
        content: json['content'] as String?,
        fileUrl: json['file'] as String?,
        status: json['status'] as String? ?? 'pending',
        grade: (json['grade'] as num?)?.toDouble(),
        feedback: json['feedback'] as String?,
        submittedAt: json['submitted_at'] != null
            ? DateTime.parse(json['submitted_at'] as String)
            : null,
        gradedAt: json['graded_at'] != null
            ? DateTime.parse(json['graded_at'] as String)
            : null,
      );
}
