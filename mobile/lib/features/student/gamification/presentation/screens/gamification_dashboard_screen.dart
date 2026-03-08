import 'package:confetti/confetti.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../../../../core/theme/app_theme.dart';
import '../../data/models/gamification_model.dart';
import '../bloc/gamification_cubit.dart';

/// Main gamification dashboard for primary school students.
/// Shows: points, level progress, badges, challenges, leaderboard preview.
class GamificationDashboardScreen extends StatefulWidget {
  const GamificationDashboardScreen({super.key});

  @override
  State<GamificationDashboardScreen> createState() =>
      _GamificationDashboardScreenState();
}

class _GamificationDashboardScreenState
    extends State<GamificationDashboardScreen> {
  late final ConfettiController _confettiController;

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(
      duration: const Duration(seconds: 3),
    );
  }

  @override
  void dispose() {
    _confettiController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes Récompenses ⭐'), centerTitle: true),
      body: Stack(
        children: [
          BlocConsumer<GamificationCubit, GamificationState>(
            listener: (context, state) {
              if (state is GamificationLoaded && state.newBadge != null) {
                _confettiController.play();
                _showBadgeDialog(context, state.newBadge!);
                context.read<GamificationCubit>().clearNewBadge();
              }
            },
            builder: (context, state) {
              if (state is GamificationLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              if (state is GamificationError) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.error_outline,
                        size: 48,
                        color: Colors.red,
                      ),
                      const SizedBox(height: 8),
                      Text(state.message),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () =>
                            context.read<GamificationCubit>().loadAll(),
                        child: const Text('Réessayer'),
                      ),
                    ],
                  ),
                );
              }
              if (state is GamificationLoaded) {
                return _buildContent(context, state);
              }
              return const SizedBox.shrink();
            },
          ),
          // Confetti overlay
          Align(
            alignment: Alignment.topCenter,
            child: ConfettiWidget(
              confettiController: _confettiController,
              blastDirectionality: BlastDirectionality.explosive,
              numberOfParticles: 30,
              maxBlastForce: 20,
              minBlastForce: 8,
              emissionFrequency: 0.05,
              gravity: 0.2,
              colors: const [
                AppColors.primary,
                AppColors.accent,
                AppColors.secondary,
                Colors.yellow,
                Colors.pink,
                Colors.green,
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(BuildContext context, GamificationLoaded state) {
    final profile = state.profile;
    return RefreshIndicator(
      onRefresh: () => context.read<GamificationCubit>().loadAll(),
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Level & Points Card ──
          _LevelCard(profile: profile),
          const SizedBox(height: 16),

          // ── Streak ──
          if (profile.streakDays > 0) ...[
            _StreakBanner(days: profile.streakDays),
            const SizedBox(height: 16),
          ],

          // ── Badges ──
          _SectionHeader(
            title: 'Mes Badges',
            icon: '🏅',
            onSeeAll: () => context.push('/student/gamification/badges'),
          ),
          const SizedBox(height: 8),
          _BadgeGrid(badges: state.myBadges, allBadges: state.allBadges),
          const SizedBox(height: 16),

          // ── Challenges ──
          _SectionHeader(
            title: 'Défis de la Semaine',
            icon: '🎯',
            onSeeAll: () => context.push('/student/gamification/challenges'),
          ),
          const SizedBox(height: 8),
          if (state.challenges.isEmpty)
            const _EmptyState(icon: '🎯', text: 'Pas de défi cette semaine')
          else
            ...state.challenges
                .take(3)
                .map(
                  (c) => _ChallengeCard(
                    challenge: c,
                    participation: state.myChallenges
                        .where((p) => p.challenge.id == c.id)
                        .firstOrNull,
                    onJoin: () =>
                        context.read<GamificationCubit>().joinChallenge(c.id),
                  ),
                ),
          const SizedBox(height: 16),

          // ── Leaderboard ──
          _SectionHeader(
            title: 'Classement',
            icon: '🏆',
            onSeeAll: () => context.push('/student/gamification/leaderboard'),
          ),
          const SizedBox(height: 8),
          if (state.leaderboard.isEmpty)
            const _EmptyState(icon: '🏆', text: 'Classement non disponible')
          else
            ...state.leaderboard.take(5).map((e) => _LeaderboardTile(entry: e)),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  void _showBadgeDialog(BuildContext context, Achievement badge) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(badge.badgeIcon, style: const TextStyle(fontSize: 64)),
            const SizedBox(height: 12),
            const Text(
              'Félicitations ! 🎉',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Tu as gagné le badge\n"${badge.badgeName}"',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16),
            ),
            if (badge.pointsReward > 0) ...[
              const SizedBox(height: 8),
              Text(
                '+${badge.pointsReward} points !',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.accent,
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Super !'),
          ),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Supporting Widgets
// ═══════════════════════════════════════════════════════════════════════════

class _LevelCard extends StatelessWidget {
  final GamificationProfile profile;
  const _LevelCard({required this.profile});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                Text(profile.levelEmoji, style: const TextStyle(fontSize: 48)),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile.levelLabel,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${profile.totalPoints} points',
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 16,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Progress bar
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: profile.levelProgress,
                minHeight: 12,
                backgroundColor: Colors.white24,
                valueColor: const AlwaysStoppedAnimation<Color>(
                  AppColors.accent,
                ),
              ),
            ),
            const SizedBox(height: 6),
            if (profile.nextLevel != null)
              Text(
                '${profile.pointsToNext} points pour ${profile.nextLevel}',
                style: const TextStyle(color: Colors.white60, fontSize: 12),
              ),
          ],
        ),
      ),
    );
  }
}

class _StreakBanner extends StatelessWidget {
  final int days;
  const _StreakBanner({required this.days});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Text('🔥', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '$days jours consécutifs !',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const Text(
                  'Continue comme ça !',
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final String icon;
  final VoidCallback? onSeeAll;
  const _SectionHeader({
    required this.title,
    required this.icon,
    this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(icon, style: const TextStyle(fontSize: 20)),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const Spacer(),
        if (onSeeAll != null)
          TextButton(onPressed: onSeeAll, child: const Text('Voir tout')),
      ],
    );
  }
}

class _BadgeGrid extends StatelessWidget {
  final List<Achievement> badges;
  final List<BadgeDefinition> allBadges;
  const _BadgeGrid({required this.badges, required this.allBadges});

  @override
  Widget build(BuildContext context) {
    if (badges.isEmpty && allBadges.isEmpty) {
      return const _EmptyState(icon: '🏅', text: 'Aucun badge disponible');
    }

    final earnedIds = badges.map((b) => b.badgeId).toSet();
    // Show earned first, then locked
    final items = <_BadgeItem>[];
    for (final b in badges) {
      items.add(_BadgeItem(icon: b.badgeIcon, name: b.badgeName, earned: true));
    }
    for (final b in allBadges) {
      if (!earnedIds.contains(b.id)) {
        items.add(_BadgeItem(icon: b.icon, name: b.name, earned: false));
      }
    }

    return SizedBox(
      height: 110,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: items.length.clamp(0, 10),
        separatorBuilder: (_, _) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final item = items[index];
          return SizedBox(
            width: 80,
            child: Column(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: item.earned
                        ? AppColors.accent.withValues(alpha: 0.15)
                        : Colors.grey.withValues(alpha: 0.1),
                    border: Border.all(
                      color: item.earned
                          ? AppColors.accent
                          : Colors.grey.shade300,
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      item.icon,
                      style: TextStyle(
                        fontSize: 28,
                        color: item.earned ? null : Colors.grey,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  item.name,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: item.earned
                        ? FontWeight.w600
                        : FontWeight.normal,
                    color: item.earned
                        ? AppColors.textPrimary
                        : AppColors.textHint,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _BadgeItem {
  final String icon;
  final String name;
  final bool earned;
  const _BadgeItem({
    required this.icon,
    required this.name,
    required this.earned,
  });
}

class _ChallengeCard extends StatelessWidget {
  final WeeklyChallenge challenge;
  final ChallengeParticipation? participation;
  final VoidCallback onJoin;
  const _ChallengeCard({
    required this.challenge,
    this.participation,
    required this.onJoin,
  });

  @override
  Widget build(BuildContext context) {
    final joined = participation != null;
    final progress = participation?.progressPercentage ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  challenge.goalTypeIcon,
                  style: const TextStyle(fontSize: 24),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        challenge.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                        ),
                      ),
                      Text(
                        challenge.description,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 2,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '+${challenge.pointsReward}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.accent,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
            if (joined) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: progress / 100,
                        minHeight: 8,
                        backgroundColor: AppColors.primary.withValues(
                          alpha: 0.1,
                        ),
                        valueColor: AlwaysStoppedAnimation<Color>(
                          participation!.isCompleted
                              ? AppColors.success
                              : AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${progress.toInt()}%',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
            if (!joined) ...[
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: onJoin,
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Participer'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _LeaderboardTile extends StatelessWidget {
  final LeaderboardEntry entry;
  const _LeaderboardTile({required this.entry});

  @override
  Widget build(BuildContext context) {
    final rankDecor = switch (entry.rank) {
      1 => ('🥇', AppColors.accent.withValues(alpha: 0.1)),
      2 => ('🥈', Colors.grey.shade100),
      3 => ('🥉', Colors.brown.shade50),
      _ => ('${entry.rank}', Colors.transparent),
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: rankDecor.$2,
      child: ListTile(
        dense: true,
        leading: Text(rankDecor.$1, style: const TextStyle(fontSize: 22)),
        title: Text(
          entry.studentName,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          '${entry.levelEmoji} ${entry.totalPoints} pts • ${entry.badgeCount} badges',
          style: const TextStyle(fontSize: 12),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String icon;
  final String text;
  const _EmptyState({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Center(
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 36)),
            const SizedBox(height: 8),
            Text(text, style: const TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}
