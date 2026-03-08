import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../core/theme/app_theme.dart';
import '../../data/models/gamification_model.dart';
import '../bloc/gamification_cubit.dart';

/// Challenges list screen showing all active weekly challenges.
class ChallengesScreen extends StatelessWidget {
  const ChallengesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Défis 🎯'), centerTitle: true),
      body: BlocBuilder<GamificationCubit, GamificationState>(
        builder: (context, state) {
          if (state is! GamificationLoaded) {
            return const Center(child: CircularProgressIndicator());
          }
          final challenges = state.challenges;
          final myParticipations = state.myChallenges;

          if (challenges.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('🎯', style: TextStyle(fontSize: 48)),
                  SizedBox(height: 12),
                  Text(
                    'Pas de défi cette semaine',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Reviens bientôt !',
                    style: TextStyle(color: AppColors.textHint),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: challenges.length,
            itemBuilder: (context, index) {
              final challenge = challenges[index];
              final participation = myParticipations
                  .where((p) => p.challenge.id == challenge.id)
                  .firstOrNull;

              return _ChallengeDetailCard(
                challenge: challenge,
                participation: participation,
                onJoin: () => context.read<GamificationCubit>().joinChallenge(
                  challenge.id,
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _ChallengeDetailCard extends StatelessWidget {
  final WeeklyChallenge challenge;
  final ChallengeParticipation? participation;
  final VoidCallback onJoin;

  const _ChallengeDetailCard({
    required this.challenge,
    this.participation,
    required this.onJoin,
  });

  @override
  Widget build(BuildContext context) {
    final joined = participation != null;
    final completed = participation?.isCompleted ?? false;
    final progress = participation?.progressPercentage ?? 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: completed
                        ? AppColors.success.withValues(alpha: 0.15)
                        : AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      challenge.goalTypeIcon,
                      style: const TextStyle(fontSize: 24),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        challenge.title,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      Text(
                        challenge.goalTypeLabel,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                if (completed)
                  const Icon(
                    Icons.check_circle,
                    color: AppColors.success,
                    size: 28,
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Description
            if (challenge.description.isNotEmpty)
              Text(
                challenge.description,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            const SizedBox(height: 12),

            // Goal info
            Row(
              children: [
                _InfoChip(
                  icon: Icons.flag,
                  text: 'Objectif: ${challenge.goalValue}',
                ),
                const SizedBox(width: 8),
                _InfoChip(
                  icon: Icons.star,
                  text: '+${challenge.pointsReward} pts',
                  color: AppColors.accent,
                ),
              ],
            ),

            // Progress or join
            if (joined) ...[
              const SizedBox(height: 14),
              Row(
                children: [
                  Text(
                    '${participation!.currentProgress} / ${challenge.goalValue}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    '${progress.toInt()}%',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: completed ? AppColors.success : AppColors.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: progress / 100,
                  minHeight: 10,
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  valueColor: AlwaysStoppedAnimation<Color>(
                    completed ? AppColors.success : AppColors.primary,
                  ),
                ),
              ),
              if (completed) ...[
                const SizedBox(height: 8),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('🎉', style: TextStyle(fontSize: 16)),
                    SizedBox(width: 4),
                    Text(
                      'Défi accompli !',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ],
            ] else ...[
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onJoin,
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Participer au défi'),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color? color;
  const _InfoChip({required this.icon, required this.text, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: c.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: c),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: c,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
