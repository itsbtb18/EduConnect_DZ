/// Academic models matching Django academics app
library;

class Level {
  final String id;
  final String name;
  final String? nameAr;
  final int order;

  const Level({
    required this.id,
    required this.name,
    this.nameAr,
    this.order = 0,
  });

  factory Level.fromJson(Map<String, dynamic> json) => Level(
    id: json['id'] as String,
    name: json['name'] as String,
    nameAr: json['name_ar'] as String?,
    order: json['order'] as int? ?? 0,
  );
}

class Classroom {
  final String id;
  final String name;
  final String? nameAr;
  final String levelId;
  final String? levelName;
  final int capacity;
  final int studentCount;

  const Classroom({
    required this.id,
    required this.name,
    this.nameAr,
    required this.levelId,
    this.levelName,
    this.capacity = 30,
    this.studentCount = 0,
  });

  factory Classroom.fromJson(Map<String, dynamic> json) => Classroom(
    id: json['id'] as String,
    name: json['name'] as String,
    nameAr: json['name_ar'] as String?,
    levelId: json['level'] as String,
    levelName: json['level_name'] as String?,
    capacity: json['capacity'] as int? ?? 30,
    studentCount: json['student_count'] as int? ?? 0,
  );
}

class Subject {
  final String id;
  final String name;
  final String? nameAr;
  final double coefficient;
  final String? color;

  const Subject({
    required this.id,
    required this.name,
    this.nameAr,
    this.coefficient = 1.0,
    this.color,
  });

  factory Subject.fromJson(Map<String, dynamic> json) => Subject(
    id: json['id'] as String,
    name: json['name'] as String,
    nameAr: json['name_ar'] as String?,
    coefficient: (json['coefficient'] as num?)?.toDouble() ?? 1.0,
    color: json['color'] as String?,
  );
}

class ScheduleSlot {
  final String id;
  final int dayOfWeek; // 0=Sunday, 4=Thursday
  final String startTime;
  final String endTime;
  final String subjectId;
  final String? subjectName;
  final String? teacherName;
  final String? classroomName;
  final String? room;

  const ScheduleSlot({
    required this.id,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.subjectId,
    this.subjectName,
    this.teacherName,
    this.classroomName,
    this.room,
  });

  factory ScheduleSlot.fromJson(Map<String, dynamic> json) => ScheduleSlot(
    id: json['id'] as String,
    dayOfWeek: json['day_of_week'] as int,
    startTime: json['start_time'] as String,
    endTime: json['end_time'] as String,
    subjectId: json['subject'] as String,
    subjectName: json['subject_name'] as String?,
    teacherName: json['teacher_name'] as String?,
    classroomName: json['classroom_name'] as String?,
    room: json['room'] as String?,
  );
}

class Lesson {
  final String id;
  final String title;
  final String? description;
  final String subjectId;
  final String? subjectName;
  final DateTime date;
  final int order;

  const Lesson({
    required this.id,
    required this.title,
    this.description,
    required this.subjectId,
    this.subjectName,
    required this.date,
    this.order = 0,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) => Lesson(
    id: json['id'] as String,
    title: json['title'] as String,
    description: json['description'] as String?,
    subjectId: json['subject'] as String,
    subjectName: json['subject_name'] as String?,
    date: DateTime.parse(json['date'] as String),
    order: json['order'] as int? ?? 0,
  );
}

class Resource {
  final String id;
  final String title;
  final String resourceType; // pdf, video, document, link
  final String? file;
  final String? externalUrl;
  final String? lessonId;
  final int fileSizeBytes;

  const Resource({
    required this.id,
    required this.title,
    required this.resourceType,
    this.file,
    this.externalUrl,
    this.lessonId,
    this.fileSizeBytes = 0,
  });

  factory Resource.fromJson(Map<String, dynamic> json) => Resource(
    id: json['id'] as String,
    title: json['title'] as String,
    resourceType: json['resource_type'] as String,
    file: json['file'] as String?,
    externalUrl: json['external_url'] as String?,
    lessonId: json['lesson'] as String?,
    fileSizeBytes: json['file_size_bytes'] as int? ?? 0,
  );
}
