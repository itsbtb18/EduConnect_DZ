import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../core/di/injection.dart';
import '../../data/models/gamification_model.dart';
import '../../data/repositories/gamification_repository.dart';

// ── States ──────────────────────────────────────────────────────────────────

abstract class GamificationState extends Equatable {
  const GamificationState();
  @override
  List<Object?> get props => [];
}

class GamificationInitial extends GamificationState {}

class GamificationLoading extends GamificationState {}

class GamificationLoaded extends GamificationState {
  final GamificationProfile profile;
  final List<BadgeDefinition> allBadges;
  final List<Achievement> myBadges;
  final List<WeeklyChallenge> challenges;
  final List<ChallengeParticipation> myChallenges;
  final List<LeaderboardEntry> leaderboard;
  final List<PointTransaction> points;

  /// Badge that was just earned (for celebration animation)
  final Achievement? newBadge;

  const GamificationLoaded({
    required this.profile,
    this.allBadges = const [],
    this.myBadges = const [],
    this.challenges = const [],
    this.myChallenges = const [],
    this.leaderboard = const [],
    this.points = const [],
    this.newBadge,
  });

  GamificationLoaded copyWith({
    GamificationProfile? profile,
    List<BadgeDefinition>? allBadges,
    List<Achievement>? myBadges,
    List<WeeklyChallenge>? challenges,
    List<ChallengeParticipation>? myChallenges,
    List<LeaderboardEntry>? leaderboard,
    List<PointTransaction>? points,
    Achievement? newBadge,
    bool clearNewBadge = false,
  }) {
    return GamificationLoaded(
      profile: profile ?? this.profile,
      allBadges: allBadges ?? this.allBadges,
      myBadges: myBadges ?? this.myBadges,
      challenges: challenges ?? this.challenges,
      myChallenges: myChallenges ?? this.myChallenges,
      leaderboard: leaderboard ?? this.leaderboard,
      points: points ?? this.points,
      newBadge: clearNewBadge ? null : (newBadge ?? this.newBadge),
    );
  }

  @override
  List<Object?> get props => [
    profile.totalPoints,
    profile.level,
    allBadges.length,
    myBadges.length,
    challenges.length,
    myChallenges.length,
    leaderboard.length,
    points.length,
    newBadge,
  ];
}

class GamificationError extends GamificationState {
  final String message;
  const GamificationError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class GamificationCubit extends Cubit<GamificationState> {
  final GamificationRepository _repo = getIt<GamificationRepository>();

  GamificationCubit() : super(GamificationInitial());

  /// Load all gamification data at once.
  Future<void> loadAll() async {
    emit(GamificationLoading());
    try {
      final results = await Future.wait([
        _repo.getMyProfile(),
        _repo.getAllBadges(),
        _repo.getMyBadges(),
        _repo.getChallenges(),
        _repo.getMyChallenges(),
        _repo.getLeaderboard(),
        _repo.getMyPoints(),
      ]);

      emit(
        GamificationLoaded(
          profile: results[0] as GamificationProfile,
          allBadges: results[1] as List<BadgeDefinition>,
          myBadges: results[2] as List<Achievement>,
          challenges: results[3] as List<WeeklyChallenge>,
          myChallenges: results[4] as List<ChallengeParticipation>,
          leaderboard: results[5] as List<LeaderboardEntry>,
          points: results[6] as List<PointTransaction>,
        ),
      );
    } catch (e) {
      emit(GamificationError(e.toString()));
    }
  }

  /// Join a challenge.
  Future<void> joinChallenge(String challengeId) async {
    final current = state;
    if (current is! GamificationLoaded) return;
    try {
      final participation = await _repo.joinChallenge(challengeId);
      final updatedChallenges = [...current.myChallenges, participation];
      emit(current.copyWith(myChallenges: updatedChallenges));
    } catch (e) {
      emit(GamificationError(e.toString()));
      emit(current);
    }
  }

  /// Clear the new badge celebration state.
  void clearNewBadge() {
    final current = state;
    if (current is GamificationLoaded) {
      emit(current.copyWith(clearNewBadge: true));
    }
  }

  /// Refresh only the profile + points.
  Future<void> refreshProfile() async {
    final current = state;
    if (current is! GamificationLoaded) return;
    try {
      final profile = await _repo.getMyProfile();
      final points = await _repo.getMyPoints();
      // Check for newly earned badges
      final oldBadgeIds = current.myBadges.map((b) => b.id).toSet();
      Achievement? newBadge;
      for (final a in profile.achievements) {
        if (!oldBadgeIds.contains(a.id)) {
          newBadge = a;
          break;
        }
      }
      emit(
        current.copyWith(
          profile: profile,
          points: points,
          myBadges: profile.achievements,
          newBadge: newBadge,
        ),
      );
    } catch (_) {}
  }
}
