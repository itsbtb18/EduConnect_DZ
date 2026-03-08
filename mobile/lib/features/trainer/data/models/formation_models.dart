/// Models shared across trainer & trainee features for formation (training center).
library;

class Department {
  final String id;
  final String name;
  final String? description;
  final String? colorCode;

  const Department({
    required this.id,
    required this.name,
    this.description,
    this.colorCode,
  });

  factory Department.fromJson(Map<String, dynamic> json) => Department(
    id: json['id']?.toString() ?? '',
    name: json['name'] as String? ?? '',
    description: json['description'] as String?,
    colorCode: json['color_code'] as String?,
  );
}

class Formation {
  final String id;
  final String name;
  final String? departmentName;
  final String? description;
  final String audience;
  final int durationHours;
  final String trainingType;
  final List<String> levels;
  final bool isActive;

  const Formation({
    required this.id,
    required this.name,
    this.departmentName,
    this.description,
    this.audience = 'ADULTS',
    this.durationHours = 0,
    this.trainingType = 'CONTINUOUS',
    this.levels = const [],
    this.isActive = true,
  });

  factory Formation.fromJson(Map<String, dynamic> json) => Formation(
    id: json['id']?.toString() ?? '',
    name: json['name'] as String? ?? '',
    departmentName: json['department_name'] as String?,
    description: json['description'] as String?,
    audience: json['audience'] as String? ?? 'ADULTS',
    durationHours: json['duration_hours'] as int? ?? 0,
    trainingType: json['training_type'] as String? ?? 'CONTINUOUS',
    levels:
        (json['levels'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
        [],
    isActive: json['is_active'] as bool? ?? true,
  );
}

class TrainingGroup {
  final String id;
  final String name;
  final String formationId;
  final String? formationName;
  final String level;
  final String? trainerName;
  final String? trainerId;
  final String? room;
  final int capacity;
  final int enrolledCount;
  final int sessionsPerWeek;
  final String startDate;
  final String? endDate;
  final String status;

  const TrainingGroup({
    required this.id,
    required this.name,
    required this.formationId,
    this.formationName,
    this.level = '',
    this.trainerName,
    this.trainerId,
    this.room,
    this.capacity = 0,
    this.enrolledCount = 0,
    this.sessionsPerWeek = 0,
    this.startDate = '',
    this.endDate,
    this.status = 'ACTIVE',
  });

  double get fillRate => capacity > 0 ? enrolledCount / capacity : 0;
  bool get isActive => status == 'ACTIVE';

  factory TrainingGroup.fromJson(Map<String, dynamic> json) => TrainingGroup(
    id: json['id']?.toString() ?? '',
    name: json['name'] as String? ?? '',
    formationId: json['formation']?.toString() ?? '',
    formationName: json['formation_name'] as String?,
    level: json['level'] as String? ?? '',
    trainerName: json['trainer_name'] as String?,
    trainerId: json['trainer']?.toString(),
    room: json['room'] as String?,
    capacity: json['capacity'] as int? ?? 0,
    enrolledCount: json['enrolled_count'] as int? ?? 0,
    sessionsPerWeek: json['sessions_per_week'] as int? ?? 0,
    startDate: json['start_date'] as String? ?? '',
    endDate: json['end_date'] as String?,
    status: json['status'] as String? ?? 'ACTIVE',
  );
}

class TrainingSession {
  final String id;
  final String groupId;
  final String? groupName;
  final String date;
  final String startTime;
  final String endTime;
  final String? room;
  final String? trainerName;
  final String? trainerId;
  final String? topic;
  final String status;
  final String? cancellationReason;
  final bool attendanceMarked;

  const TrainingSession({
    required this.id,
    required this.groupId,
    this.groupName,
    required this.date,
    required this.startTime,
    required this.endTime,
    this.room,
    this.trainerName,
    this.trainerId,
    this.topic,
    this.status = 'SCHEDULED',
    this.cancellationReason,
    this.attendanceMarked = false,
  });

  bool get isToday {
    final now = DateTime.now();
    final sessionDate = DateTime.tryParse(date);
    if (sessionDate == null) return false;
    return now.year == sessionDate.year &&
        now.month == sessionDate.month &&
        now.day == sessionDate.day;
  }

  bool get isCancelled => status == 'CANCELLED';
  bool get isCompleted => status == 'COMPLETED';
  bool get isScheduled => status == 'SCHEDULED';

  factory TrainingSession.fromJson(Map<String, dynamic> json) =>
      TrainingSession(
        id: json['id']?.toString() ?? '',
        groupId: json['group']?.toString() ?? '',
        groupName: json['group_name'] as String?,
        date: json['date'] as String? ?? '',
        startTime: json['start_time'] as String? ?? '',
        endTime: json['end_time'] as String? ?? '',
        room: json['room'] as String?,
        trainerName: json['trainer_name'] as String?,
        trainerId: json['trainer']?.toString(),
        topic: json['topic'] as String?,
        status: json['status'] as String? ?? 'SCHEDULED',
        cancellationReason: json['cancellation_reason'] as String?,
        attendanceMarked: json['attendance_marked'] as bool? ?? false,
      );
}

class SessionAttendance {
  final String id;
  final String sessionId;
  final String enrollmentId;
  final String? learnerName;
  final String status;
  final String? notes;

  const SessionAttendance({
    required this.id,
    required this.sessionId,
    required this.enrollmentId,
    this.learnerName,
    this.status = 'PRESENT',
    this.notes,
  });

  factory SessionAttendance.fromJson(Map<String, dynamic> json) =>
      SessionAttendance(
        id: json['id']?.toString() ?? '',
        sessionId: json['session']?.toString() ?? '',
        enrollmentId: json['enrollment']?.toString() ?? '',
        learnerName: json['learner_name'] as String?,
        status: json['status'] as String? ?? 'PRESENT',
        notes: json['notes'] as String?,
      );

  Map<String, dynamic> toJson() => {
    'enrollment': enrollmentId,
    'status': status,
    'notes': notes,
  };
}

class TrainingEnrollment {
  final String id;
  final String groupId;
  final String? groupName;
  final String? formationName;
  final String? learnerName;
  final String? learnerId;
  final String status;
  final String? level;
  final double attendanceRate;
  final int sessionsAttended;
  final int totalSessions;

  const TrainingEnrollment({
    required this.id,
    required this.groupId,
    this.groupName,
    this.formationName,
    this.learnerName,
    this.learnerId,
    this.status = 'ACTIVE',
    this.level,
    this.attendanceRate = 0,
    this.sessionsAttended = 0,
    this.totalSessions = 0,
  });

  factory TrainingEnrollment.fromJson(Map<String, dynamic> json) =>
      TrainingEnrollment(
        id: json['id']?.toString() ?? '',
        groupId: json['group']?.toString() ?? '',
        groupName: json['group_name'] as String?,
        formationName: json['formation_name'] as String?,
        learnerName: json['learner_name'] as String?,
        learnerId: json['learner']?.toString(),
        status: json['status'] as String? ?? 'ACTIVE',
        level: json['level'] as String?,
        attendanceRate: (json['attendance_rate'] as num?)?.toDouble() ?? 0,
        sessionsAttended: json['sessions_attended'] as int? ?? 0,
        totalSessions: json['total_sessions'] as int? ?? 0,
      );
}

class PlacementTest {
  final String id;
  final String enrollmentId;
  final String? learnerName;
  final String evaluationType;
  final double score;
  final double maxScore;
  final String? recommendedLevel;
  final String? notes;
  final bool validated;
  final String? createdAt;

  const PlacementTest({
    required this.id,
    required this.enrollmentId,
    this.learnerName,
    this.evaluationType = 'WRITTEN',
    this.score = 0,
    this.maxScore = 100,
    this.recommendedLevel,
    this.notes,
    this.validated = false,
    this.createdAt,
  });

  double get percentage => maxScore > 0 ? (score / maxScore) * 100 : 0;

  factory PlacementTest.fromJson(Map<String, dynamic> json) => PlacementTest(
    id: json['id']?.toString() ?? '',
    enrollmentId: json['enrollment']?.toString() ?? '',
    learnerName: json['learner_name'] as String?,
    evaluationType: json['evaluation_type'] as String? ?? 'WRITTEN',
    score: (json['score'] as num?)?.toDouble() ?? 0,
    maxScore: (json['max_score'] as num?)?.toDouble() ?? 100,
    recommendedLevel: json['recommended_level'] as String?,
    notes: json['notes'] as String?,
    validated: json['validated'] as bool? ?? false,
    createdAt: json['created_at'] as String?,
  );
}

class Certificate {
  final String id;
  final String enrollmentId;
  final String? learnerName;
  final String? formationName;
  final String certificateType;
  final String? level;
  final String referenceNumber;
  final String issueDate;
  final String? pdfUrl;

  const Certificate({
    required this.id,
    required this.enrollmentId,
    this.learnerName,
    this.formationName,
    this.certificateType = 'COMPLETION',
    this.level,
    this.referenceNumber = '',
    this.issueDate = '',
    this.pdfUrl,
  });

  factory Certificate.fromJson(Map<String, dynamic> json) => Certificate(
    id: json['id']?.toString() ?? '',
    enrollmentId: json['enrollment']?.toString() ?? '',
    learnerName: json['learner_name'] as String?,
    formationName: json['formation_name'] as String?,
    certificateType: json['certificate_type'] as String? ?? 'COMPLETION',
    level: json['level'] as String?,
    referenceNumber: json['reference_number'] as String? ?? '',
    issueDate: json['issue_date'] as String? ?? '',
    pdfUrl: json['pdf_url'] as String?,
  );
}

class LevelPassage {
  final String id;
  final String enrollmentId;
  final String? learnerName;
  final String fromLevel;
  final String toLevel;
  final double attendanceRate;
  final double? averageGrade;
  final String decision;
  final String? notes;
  final String? createdAt;

  const LevelPassage({
    required this.id,
    required this.enrollmentId,
    this.learnerName,
    this.fromLevel = '',
    this.toLevel = '',
    this.attendanceRate = 0,
    this.averageGrade,
    this.decision = 'PENDING',
    this.notes,
    this.createdAt,
  });

  bool get isPending => decision == 'PENDING';
  bool get isPromoted => decision == 'PROMOTED';

  factory LevelPassage.fromJson(Map<String, dynamic> json) => LevelPassage(
    id: json['id']?.toString() ?? '',
    enrollmentId: json['enrollment']?.toString() ?? '',
    learnerName: json['learner_name'] as String?,
    fromLevel: json['from_level'] as String? ?? '',
    toLevel: json['to_level'] as String? ?? '',
    attendanceRate: (json['attendance_rate'] as num?)?.toDouble() ?? 0,
    averageGrade: (json['average_grade'] as num?)?.toDouble(),
    decision: json['decision'] as String? ?? 'PENDING',
    notes: json['notes'] as String?,
    createdAt: json['created_at'] as String?,
  );
}

class LearnerPayment {
  final String id;
  final String enrollmentId;
  final String? learnerName;
  final String? formationName;
  final double amount;
  final String paymentMethod;
  final String status;
  final String? transactionRef;
  final String paymentDate;

  const LearnerPayment({
    required this.id,
    required this.enrollmentId,
    this.learnerName,
    this.formationName,
    this.amount = 0,
    this.paymentMethod = 'CASH',
    this.status = 'COMPLETED',
    this.transactionRef,
    this.paymentDate = '',
  });

  bool get isPending => status == 'PENDING';

  factory LearnerPayment.fromJson(Map<String, dynamic> json) => LearnerPayment(
    id: json['id']?.toString() ?? '',
    enrollmentId: json['enrollment']?.toString() ?? '',
    learnerName: json['learner_name'] as String?,
    formationName: json['formation_name'] as String?,
    amount: (json['amount'] as num?)?.toDouble() ?? 0,
    paymentMethod: json['payment_method'] as String? ?? 'CASH',
    status: json['status'] as String? ?? 'COMPLETED',
    transactionRef: json['transaction_ref'] as String?,
    paymentDate: json['payment_date'] as String? ?? '',
  );
}

class TrainerSalaryConfig {
  final String id;
  final String trainerId;
  final String? trainerName;
  final String contractType;
  final double? hourlyRate;
  final double? baseSalary;
  final int groupCount;

  const TrainerSalaryConfig({
    required this.id,
    required this.trainerId,
    this.trainerName,
    this.contractType = 'VACATAIRE',
    this.hourlyRate,
    this.baseSalary,
    this.groupCount = 0,
  });

  bool get isVacataire => contractType == 'VACATAIRE';

  factory TrainerSalaryConfig.fromJson(Map<String, dynamic> json) =>
      TrainerSalaryConfig(
        id: json['id']?.toString() ?? '',
        trainerId: json['trainer']?.toString() ?? '',
        trainerName: json['trainer_name'] as String?,
        contractType: json['contract_type'] as String? ?? 'VACATAIRE',
        hourlyRate: (json['hourly_rate'] as num?)?.toDouble(),
        baseSalary: (json['base_salary'] as num?)?.toDouble(),
        groupCount: json['group_count'] as int? ?? 0,
      );
}

class FormationDashboardStats {
  final int activeGroups;
  final int todaySessions;
  final int enrolledLearners;
  final int pendingPayments;
  final int totalFormations;
  final double monthlyRevenue;

  const FormationDashboardStats({
    this.activeGroups = 0,
    this.todaySessions = 0,
    this.enrolledLearners = 0,
    this.pendingPayments = 0,
    this.totalFormations = 0,
    this.monthlyRevenue = 0,
  });

  factory FormationDashboardStats.fromJson(Map<String, dynamic> json) =>
      FormationDashboardStats(
        activeGroups: json['active_groups'] as int? ?? 0,
        todaySessions: json['today_sessions'] as int? ?? 0,
        enrolledLearners: json['enrolled_learners'] as int? ?? 0,
        pendingPayments: json['pending_payments'] as int? ?? 0,
        totalFormations: json['total_formations'] as int? ?? 0,
        monthlyRevenue: (json['monthly_revenue'] as num?)?.toDouble() ?? 0,
      );
}
