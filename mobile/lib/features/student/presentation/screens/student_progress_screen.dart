import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/elearning_model.dart';
import '../bloc/elearning_bloc.dart';

class StudentProgressScreen extends StatelessWidget {
  const StudentProgressScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ElearningBloc()..add(const LoadProgress()),
      child: const _ProgressBody(),
    );
  }
}

class _ProgressBody extends StatelessWidget {
  const _ProgressBody();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ma Progression')),
      body: BlocBuilder<ElearningBloc, ElearningState>(
        builder: (context, state) {
          if (state is ElearningLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is ElearningError) {
            return Center(child: Text('Erreur: ${state.message}'));
          }
          if (state is ProgressLoaded) {
            if (state.progressList.isEmpty) {
              return const Center(
                child: Text('Aucune progression enregistrée'),
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: state.progressList.length,
              itemBuilder: (_, i) =>
                  _ProgressCard(progress: state.progressList[i]),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}

class _ProgressCard extends StatelessWidget {
  final StudentProgress progress;
  const _ProgressCard({required this.progress});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              progress.subjectName ?? 'Matière inconnue',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            // Completion bar
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value: progress.completionPercentage / 100,
                      minHeight: 10,
                      backgroundColor: Colors.grey.shade200,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${progress.completionPercentage.toStringAsFixed(0)}%',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _StatItem(
                  icon: Icons.quiz,
                  label: 'Quiz passés',
                  value: '${progress.totalQuizzesTaken}',
                ),
                _StatItem(
                  icon: Icons.bar_chart,
                  label: 'Moyenne Quiz',
                  value: '${progress.quizAverage.toStringAsFixed(1)}%',
                  color: progress.quizAverage >= 50
                      ? Colors.green
                      : Colors.orange,
                ),
                _StatItem(
                  icon: Icons.visibility,
                  label: 'Ressources vues',
                  value: '${progress.totalResourcesViewed}',
                ),
              ],
            ),

            // Strengths & Weaknesses
            if (progress.strengths.isNotEmpty ||
                progress.weaknesses.isNotEmpty) ...[
              const Divider(height: 24),
              if (progress.strengths.isNotEmpty) ...[
                Text(
                  'Points forts',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.green,
                  ),
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 6,
                  children: progress.strengths
                      .map(
                        (s) => Chip(
                          label: Text(s, style: const TextStyle(fontSize: 11)),
                          backgroundColor: Colors.green.withValues(alpha: 0.12),
                          padding: EdgeInsets.zero,
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                        ),
                      )
                      .toList(),
                ),
              ],
              if (progress.weaknesses.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'À améliorer',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.orange,
                  ),
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 6,
                  children: progress.weaknesses
                      .map(
                        (s) => Chip(
                          label: Text(s, style: const TextStyle(fontSize: 11)),
                          backgroundColor: Colors.orange.withValues(
                            alpha: 0.12,
                          ),
                          padding: EdgeInsets.zero,
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                        ),
                      )
                      .toList(),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? color;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Icon(icon, color: color ?? theme.colorScheme.primary, size: 22),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.titleSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(label, style: theme.textTheme.bodySmall),
      ],
    );
  }
}
