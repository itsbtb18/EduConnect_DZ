import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../core/theme/app_theme.dart';
import '../../data/models/gamification_model.dart';
import '../bloc/gamification_cubit.dart';

/// Full leaderboard screen — class ranking.
class LeaderboardScreen extends StatelessWidget {
  const LeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Classement 🏆'), centerTitle: true),
      body: BlocBuilder<GamificationCubit, GamificationState>(
        builder: (context, state) {
          if (state is! GamificationLoaded) {
            return const Center(child: CircularProgressIndicator());
          }
          final entries = state.leaderboard;
          if (entries.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('🏆', style: TextStyle(fontSize: 48)),
                  SizedBox(height: 12),
                  Text(
                    'Classement non disponible',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Top 3 podium
              if (entries.length >= 3)
                _Podium(
                  first: entries[0],
                  second: entries[1],
                  third: entries[2],
                ),
              const SizedBox(height: 16),

              // Rest of the list
              ...entries.asMap().entries.map((e) {
                final index = e.key;
                final entry = e.value;
                return _LeaderboardRow(entry: entry, isTop3: index < 3);
              }),
            ],
          );
        },
      ),
    );
  }
}

class _Podium extends StatelessWidget {
  final LeaderboardEntry first;
  final LeaderboardEntry second;
  final LeaderboardEntry third;

  const _Podium({
    required this.first,
    required this.second,
    required this.third,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 200,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // 2nd place
          _PodiumColumn(
            entry: second,
            height: 110,
            medal: '🥈',
            color: Colors.grey.shade300,
          ),
          const SizedBox(width: 8),
          // 1st place
          _PodiumColumn(
            entry: first,
            height: 150,
            medal: '🥇',
            color: AppColors.accent,
          ),
          const SizedBox(width: 8),
          // 3rd place
          _PodiumColumn(
            entry: third,
            height: 80,
            medal: '🥉',
            color: Colors.brown.shade200,
          ),
        ],
      ),
    );
  }
}

class _PodiumColumn extends StatelessWidget {
  final LeaderboardEntry entry;
  final double height;
  final String medal;
  final Color color;

  const _PodiumColumn({
    required this.entry,
    required this.height,
    required this.medal,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text(medal, style: const TextStyle(fontSize: 28)),
        const SizedBox(height: 4),
        Text(
          entry.studentName.split(' ').first,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          overflow: TextOverflow.ellipsis,
        ),
        Text(
          '${entry.totalPoints} pts',
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
        const SizedBox(height: 4),
        Container(
          width: 80,
          height: height,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.3),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            gradient: LinearGradient(
              colors: [
                color.withValues(alpha: 0.5),
                color.withValues(alpha: 0.15),
              ],
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
            ),
          ),
          child: Center(
            child: Text(entry.levelEmoji, style: const TextStyle(fontSize: 24)),
          ),
        ),
      ],
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  final LeaderboardEntry entry;
  final bool isTop3;

  const _LeaderboardRow({required this.entry, this.isTop3 = false});

  @override
  Widget build(BuildContext context) {
    final bgColor = switch (entry.rank) {
      1 => AppColors.accent.withValues(alpha: 0.08),
      2 => Colors.grey.withValues(alpha: 0.06),
      3 => Colors.brown.withValues(alpha: 0.06),
      _ => Colors.transparent,
    };

    final rankWidget = switch (entry.rank) {
      1 => const Text('🥇', style: TextStyle(fontSize: 20)),
      2 => const Text('🥈', style: TextStyle(fontSize: 20)),
      3 => const Text('🥉', style: TextStyle(fontSize: 20)),
      _ => CircleAvatar(
        radius: 14,
        backgroundColor: AppColors.primary.withValues(alpha: 0.1),
        child: Text(
          '${entry.rank}',
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: AppColors.primary,
          ),
        ),
      ),
    };

    return Card(
      margin: const EdgeInsets.only(bottom: 4),
      color: bgColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: SizedBox(width: 32, child: Center(child: rankWidget)),
        title: Text(
          entry.studentName,
          style: TextStyle(
            fontWeight: isTop3 ? FontWeight.bold : FontWeight.w500,
          ),
        ),
        subtitle: Text(
          '${entry.levelEmoji} • ${entry.badgeCount} badges',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Text(
          '${entry.totalPoints} pts',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: isTop3 ? 16 : 14,
            color: isTop3 ? AppColors.primary : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}
