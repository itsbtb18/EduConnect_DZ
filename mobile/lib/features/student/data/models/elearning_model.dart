/// E-Learning module models: DigitalResource, ExamBankItem, Quiz,
/// QuizQuestion, QuizAttempt, StudentProgress.
library;

class DigitalResource {
  final String id;
  final String title;
  final String description;
  final String resourceType; // PDF, VIDEO, COURSE, SUMMARY, EXERCISE, OTHER
  final String scope; // GLOBAL, SCHOOL
  final String? sectionName;
  final String? levelName;
  final String? subjectName;
  final String? chapter;
  final String? file;
  final String? externalUrl;
  final List<String> tags;
  final int viewCount;
  final int downloadCount;
  final bool isFavourited;
  final String createdAt;

  const DigitalResource({
    required this.id,
    required this.title,
    this.description = '',
    required this.resourceType,
    required this.scope,
    this.sectionName,
    this.levelName,
    this.subjectName,
    this.chapter,
    this.file,
    this.externalUrl,
    this.tags = const [],
    this.viewCount = 0,
    this.downloadCount = 0,
    this.isFavourited = false,
    this.createdAt = '',
  });

  factory DigitalResource.fromJson(Map<String, dynamic> json) {
    return DigitalResource(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      resourceType: json['resource_type'] as String? ?? 'OTHER',
      scope: json['scope'] as String? ?? 'SCHOOL',
      sectionName: json['section_name'] as String?,
      levelName: json['level_name'] as String?,
      subjectName: json['subject_name'] as String?,
      chapter: json['chapter'] as String?,
      file: json['file'] as String?,
      externalUrl: json['external_url'] as String?,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
          [],
      viewCount: json['view_count'] as int? ?? 0,
      downloadCount: json['download_count'] as int? ?? 0,
      isFavourited: json['is_favourited'] as bool? ?? false,
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}

class ExamBankItem {
  final String id;
  final String title;
  final String description;
  final String examType; // BEP, BEM, BAC, EXERCISE, HOMEWORK, MOCK_EXAM
  final String? levelName;
  final String? subjectName;
  final int? year;
  final String? file;
  final String? solutionFile;
  final bool solutionVisible;
  final int downloadCount;
  final String createdAt;

  const ExamBankItem({
    required this.id,
    required this.title,
    this.description = '',
    required this.examType,
    this.levelName,
    this.subjectName,
    this.year,
    this.file,
    this.solutionFile,
    this.solutionVisible = false,
    this.downloadCount = 0,
    this.createdAt = '',
  });

  factory ExamBankItem.fromJson(Map<String, dynamic> json) {
    return ExamBankItem(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      examType: json['exam_type'] as String? ?? 'EXERCISE',
      levelName: json['level_name'] as String?,
      subjectName: json['subject_name'] as String?,
      year: json['year'] as int?,
      file: json['file'] as String?,
      solutionFile: json['solution_file'] as String?,
      solutionVisible: json['solution_visible'] as bool? ?? false,
      downloadCount: json['download_count'] as int? ?? 0,
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}

class QuizQuestion {
  final String id;
  final String questionType; // MCQ, TRUE_FALSE, FREE_TEXT
  final String text;
  final List<String> options;
  final dynamic correctAnswer;
  final int points;
  final String? explanation;
  final int order;

  const QuizQuestion({
    required this.id,
    required this.questionType,
    required this.text,
    this.options = const [],
    this.correctAnswer,
    this.points = 1,
    this.explanation,
    this.order = 0,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    return QuizQuestion(
      id: json['id'] as String? ?? '',
      questionType: json['question_type'] as String? ?? 'MCQ',
      text: json['text'] as String? ?? '',
      options:
          (json['options'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      correctAnswer: json['correct_answer'],
      points: json['points'] as int? ?? 1,
      explanation: json['explanation'] as String?,
      order: json['order'] as int? ?? 0,
    );
  }
}

class Quiz {
  final String id;
  final String title;
  final String description;
  final String? subjectName;
  final String? levelName;
  final String? chapter;
  final int? durationMinutes;
  final bool allowRetake;
  final bool showCorrectionImmediately;
  final bool isPublished;
  final String? closesAt;
  final int questionCount;
  final int totalPoints;
  final List<QuizQuestion> questions;
  final String createdAt;

  const Quiz({
    required this.id,
    required this.title,
    this.description = '',
    this.subjectName,
    this.levelName,
    this.chapter,
    this.durationMinutes,
    this.allowRetake = false,
    this.showCorrectionImmediately = false,
    this.isPublished = false,
    this.closesAt,
    this.questionCount = 0,
    this.totalPoints = 0,
    this.questions = const [],
    this.createdAt = '',
  });

  factory Quiz.fromJson(Map<String, dynamic> json) {
    return Quiz(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      subjectName: json['subject_name'] as String?,
      levelName: json['level_name'] as String?,
      chapter: json['chapter'] as String?,
      durationMinutes: json['duration_minutes'] as int?,
      allowRetake: json['allow_retake'] as bool? ?? false,
      showCorrectionImmediately:
          json['show_correction_immediately'] as bool? ?? false,
      isPublished: json['is_published'] as bool? ?? false,
      closesAt: json['closes_at'] as String?,
      questionCount: json['question_count'] as int? ?? 0,
      totalPoints: json['total_points'] as int? ?? 0,
      questions:
          (json['questions'] as List<dynamic>?)
              ?.map((e) => QuizQuestion.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  bool get isClosed =>
      closesAt != null &&
      DateTime.tryParse(closesAt!)?.isBefore(DateTime.now()) == true;
}

class QuizAttempt {
  final String id;
  final String quizId;
  final String? quizTitle;
  final String? studentName;
  final String startedAt;
  final String? finishedAt;
  final double score;
  final double totalPoints;
  final Map<String, dynamic> answers;
  final bool passed;

  const QuizAttempt({
    required this.id,
    required this.quizId,
    this.quizTitle,
    this.studentName,
    this.startedAt = '',
    this.finishedAt,
    this.score = 0,
    this.totalPoints = 0,
    this.answers = const {},
    this.passed = false,
  });

  factory QuizAttempt.fromJson(Map<String, dynamic> json) {
    return QuizAttempt(
      id: json['id'] as String? ?? '',
      quizId: json['quiz'] as String? ?? '',
      quizTitle: json['quiz_title'] as String?,
      studentName: json['student_name'] as String?,
      startedAt: json['started_at'] as String? ?? '',
      finishedAt: json['finished_at'] as String?,
      score: (json['score'] as num?)?.toDouble() ?? 0,
      totalPoints: (json['total_points'] as num?)?.toDouble() ?? 0,
      answers: json['answers'] as Map<String, dynamic>? ?? {},
      passed: json['passed'] as bool? ?? false,
    );
  }

  double get percentage => totalPoints > 0 ? (score / totalPoints) * 100 : 0;
}

class StudentProgress {
  final String id;
  final String? studentName;
  final String? subjectName;
  final double completionPercentage;
  final double quizAverage;
  final int totalResourcesViewed;
  final int totalQuizzesTaken;
  final List<String> strengths;
  final List<String> weaknesses;

  const StudentProgress({
    required this.id,
    this.studentName,
    this.subjectName,
    this.completionPercentage = 0,
    this.quizAverage = 0,
    this.totalResourcesViewed = 0,
    this.totalQuizzesTaken = 0,
    this.strengths = const [],
    this.weaknesses = const [],
  });

  factory StudentProgress.fromJson(Map<String, dynamic> json) {
    return StudentProgress(
      id: json['id'] as String? ?? '',
      studentName: json['student_name'] as String?,
      subjectName: json['subject_name'] as String?,
      completionPercentage:
          (json['completion_percentage'] as num?)?.toDouble() ?? 0,
      quizAverage: (json['quiz_average'] as num?)?.toDouble() ?? 0,
      totalResourcesViewed: json['total_resources_viewed'] as int? ?? 0,
      totalQuizzesTaken: json['total_quizzes_taken'] as int? ?? 0,
      strengths:
          (json['strengths'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      weaknesses:
          (json['weaknesses'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
    );
  }
}
