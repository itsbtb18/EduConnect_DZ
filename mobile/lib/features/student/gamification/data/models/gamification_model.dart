/// Gamification models matching Django backend API responses.
library;

class GamificationProfile {
  final String id;
  final String studentId;
  final String studentName;
  final int totalPoints;
  final String level;
  final String levelLabel;
  final String? nextLevel;
  final int pointsToNext;
  final int streakDays;
  final String? lastActivityDate;
  final List<Achievement> achievements;

  const GamificationProfile({
    required this.id,
    required this.studentId,
    this.studentName = '',
    this.totalPoints = 0,
    this.level = 'DEBUTANT',
    this.levelLabel = 'Débutant',
    this.nextLevel,
    this.pointsToNext = 0,
    this.streakDays = 0,
    this.lastActivityDate,
    this.achievements = const [],
  });

  double get levelProgress {
    if (pointsToNext <= 0) return 1.0;
    final thresholds = {
      'DEBUTANT': 0,
      'EXPLORATEUR': 200,
      'CHAMPION': 600,
      'MAITRE': 1500,
      'LEGENDE': 3000,
    };
    final currentThreshold = thresholds[level] ?? 0;
    final nextThreshold = thresholds[nextLevel] ?? currentThreshold;
    final range = nextThreshold - currentThreshold;
    if (range <= 0) return 1.0;
    final earned = totalPoints - currentThreshold;
    return (earned / range).clamp(0.0, 1.0);
  }

  String get levelEmoji => switch (level) {
    'DEBUTANT' => '🌱',
    'EXPLORATEUR' => '🧭',
    'CHAMPION' => '🏆',
    'MAITRE' => '👑',
    'LEGENDE' => '⭐',
    _ => '🌱',
  };

  factory GamificationProfile.fromJson(Map<String, dynamic> json) {
    return GamificationProfile(
      id: json['id'] as String? ?? '',
      studentId: json['student'] as String? ?? '',
      studentName: json['student_name'] as String? ?? '',
      totalPoints: json['total_points'] as int? ?? 0,
      level: json['level'] as String? ?? 'DEBUTANT',
      levelLabel: json['level_label'] as String? ?? 'Débutant',
      nextLevel: json['next_level'] as String?,
      pointsToNext: json['points_to_next'] as int? ?? 0,
      streakDays: json['streak_days'] as int? ?? 0,
      lastActivityDate: json['last_activity_date'] as String?,
      achievements:
          (json['achievements'] as List<dynamic>?)
              ?.map((e) => Achievement.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class BadgeDefinition {
  final String id;
  final String name;
  final String? nameAr;
  final String description;
  final String icon;
  final String category;
  final int pointsReward;
  final String criteriaType;
  final int criteriaValue;

  const BadgeDefinition({
    required this.id,
    required this.name,
    this.nameAr,
    this.description = '',
    this.icon = '🏅',
    this.category = 'ACADEMIC',
    this.pointsReward = 0,
    this.criteriaType = 'MANUAL',
    this.criteriaValue = 0,
  });

  String get categoryLabel => switch (category) {
    'ACADEMIC' => 'Académique',
    'ATTENDANCE' => 'Assiduité',
    'BEHAVIOUR' => 'Comportement',
    'READING' => 'Lecture',
    'QUIZ' => 'Quiz',
    'SPECIAL' => 'Spécial',
    _ => category,
  };

  factory BadgeDefinition.fromJson(Map<String, dynamic> json) {
    return BadgeDefinition(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      nameAr: json['name_ar'] as String?,
      description: json['description'] as String? ?? '',
      icon: json['icon'] as String? ?? '🏅',
      category: json['category'] as String? ?? 'ACADEMIC',
      pointsReward: json['points_reward'] as int? ?? 0,
      criteriaType: json['criteria_type'] as String? ?? 'MANUAL',
      criteriaValue: json['criteria_value'] as int? ?? 0,
    );
  }
}

class Achievement {
  final String id;
  final String badgeId;
  final String badgeName;
  final String badgeIcon;
  final String badgeCategory;
  final String badgeDescription;
  final int pointsReward;
  final String earnedAt;

  const Achievement({
    required this.id,
    this.badgeId = '',
    required this.badgeName,
    this.badgeIcon = '🏅',
    this.badgeCategory = 'ACADEMIC',
    this.badgeDescription = '',
    this.pointsReward = 0,
    required this.earnedAt,
  });

  factory Achievement.fromJson(Map<String, dynamic> json) {
    return Achievement(
      id: json['id'] as String? ?? '',
      badgeId: json['badge_id'] as String? ?? json['badge'] as String? ?? '',
      badgeName: json['badge_name'] as String? ?? '',
      badgeIcon: json['badge_icon'] as String? ?? '🏅',
      badgeCategory: json['badge_category'] as String? ?? 'ACADEMIC',
      badgeDescription: json['badge_description'] as String? ?? '',
      pointsReward: json['points_reward'] as int? ?? 0,
      earnedAt: json['earned_at'] as String? ?? '',
    );
  }
}

class PointTransaction {
  final String id;
  final int amount;
  final String reason;
  final String createdAt;

  const PointTransaction({
    required this.id,
    required this.amount,
    this.reason = '',
    required this.createdAt,
  });

  factory PointTransaction.fromJson(Map<String, dynamic> json) {
    return PointTransaction(
      id: json['id'] as String? ?? '',
      amount: json['amount'] as int? ?? 0,
      reason: json['reason'] as String? ?? '',
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}

class WeeklyChallenge {
  final String id;
  final String title;
  final String description;
  final String startDate;
  final String endDate;
  final String goalType;
  final int goalValue;
  final int pointsReward;
  final bool isActive;

  const WeeklyChallenge({
    required this.id,
    required this.title,
    this.description = '',
    required this.startDate,
    required this.endDate,
    this.goalType = 'HOMEWORK',
    this.goalValue = 0,
    this.pointsReward = 0,
    this.isActive = true,
  });

  String get goalTypeLabel => switch (goalType) {
    'ATTENDANCE' => 'Présence',
    'HOMEWORK' => 'Devoirs',
    'QUIZ' => 'Quiz',
    'READING' => 'Lecture',
    'GRADE' => 'Notes',
    _ => goalType,
  };

  String get goalTypeIcon => switch (goalType) {
    'ATTENDANCE' => '📅',
    'HOMEWORK' => '📝',
    'QUIZ' => '🧩',
    'READING' => '📚',
    'GRADE' => '⭐',
    _ => '🎯',
  };

  factory WeeklyChallenge.fromJson(Map<String, dynamic> json) {
    return WeeklyChallenge(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      startDate: json['start_date'] as String? ?? '',
      endDate: json['end_date'] as String? ?? '',
      goalType: json['goal_type'] as String? ?? 'HOMEWORK',
      goalValue: json['goal_value'] as int? ?? 0,
      pointsReward: json['points_reward'] as int? ?? 0,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}

class ChallengeParticipation {
  final String id;
  final WeeklyChallenge challenge;
  final int currentProgress;
  final bool isCompleted;
  final String? completedAt;
  final double progressPercentage;

  const ChallengeParticipation({
    required this.id,
    required this.challenge,
    this.currentProgress = 0,
    this.isCompleted = false,
    this.completedAt,
    this.progressPercentage = 0,
  });

  factory ChallengeParticipation.fromJson(Map<String, dynamic> json) {
    return ChallengeParticipation(
      id: json['id'] as String? ?? '',
      challenge: WeeklyChallenge.fromJson(
        json['challenge'] as Map<String, dynamic>? ?? {},
      ),
      currentProgress: json['current_progress'] as int? ?? 0,
      isCompleted: json['is_completed'] as bool? ?? false,
      completedAt: json['completed_at'] as String?,
      progressPercentage:
          (json['progress_percentage'] as num?)?.toDouble() ?? 0,
    );
  }
}

class LeaderboardEntry {
  final int rank;
  final String studentId;
  final String studentName;
  final int totalPoints;
  final String level;
  final int badgeCount;

  const LeaderboardEntry({
    required this.rank,
    required this.studentId,
    required this.studentName,
    this.totalPoints = 0,
    this.level = 'DEBUTANT',
    this.badgeCount = 0,
  });

  String get levelEmoji => switch (level) {
    'DEBUTANT' => '🌱',
    'EXPLORATEUR' => '🧭',
    'CHAMPION' => '🏆',
    'MAITRE' => '👑',
    'LEGENDE' => '⭐',
    _ => '🌱',
  };

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: json['rank'] as int? ?? 0,
      studentId: json['student_id'] as String? ?? '',
      studentName: json['student_name'] as String? ?? '',
      totalPoints: json['total_points'] as int? ?? 0,
      level: json['level'] as String? ?? 'DEBUTANT',
      badgeCount: json['badge_count'] as int? ?? 0,
    );
  }
}
