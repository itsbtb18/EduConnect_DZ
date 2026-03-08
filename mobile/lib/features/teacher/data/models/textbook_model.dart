/// Lesson / Cahier de Texte models matching Django academics.Lesson
class Lesson {
  final String id;
  final String subjectId;
  final String? subjectName;
  final String classroomId;
  final String? classroomName;
  final String title;
  final String? content;
  final DateTime date;
  final String? duration; // e.g. "1h", "2h"
  final String? objectives;
  final String? resources;
  final String? homework;
  final DateTime? createdAt;

  const Lesson({
    required this.id,
    required this.subjectId,
    this.subjectName,
    required this.classroomId,
    this.classroomName,
    required this.title,
    this.content,
    required this.date,
    this.duration,
    this.objectives,
    this.resources,
    this.homework,
    this.createdAt,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) => Lesson(
    id: json['id'] as String,
    subjectId: json['subject'] as String? ?? '',
    subjectName: json['subject_name'] as String?,
    classroomId: json['classroom'] as String? ?? json['class'] as String? ?? '',
    classroomName:
        json['classroom_name'] as String? ?? json['class_name'] as String?,
    title: json['title'] as String,
    content: json['content'] as String?,
    date: DateTime.parse(json['date'] as String),
    duration: json['duration'] as String?,
    objectives: json['objectives'] as String?,
    resources: json['resources'] as String?,
    homework: json['homework'] as String?,
    createdAt: json['created_at'] != null
        ? DateTime.parse(json['created_at'] as String)
        : null,
  );

  Map<String, dynamic> toJson() => {
    'subject': subjectId,
    'classroom': classroomId,
    'title': title,
    'content': content,
    'date': date.toIso8601String().split('T')[0],
    'duration': duration,
    'objectives': objectives,
    'resources': resources,
    'homework': homework,
  };
}
