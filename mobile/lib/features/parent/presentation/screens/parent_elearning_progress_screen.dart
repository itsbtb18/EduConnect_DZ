import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../student/data/models/elearning_model.dart';
import '../../../student/presentation/bloc/elearning_bloc.dart';

/// Parent screen: view child's e-learning progress across subjects.
class ParentElearningProgressScreen extends StatelessWidget {
  final String studentId;
  const ParentElearningProgressScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ElearningBloc()..add(LoadProgress(studentId: studentId)),
      child: const _Body(),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Progression E-Learning')),
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
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.school_outlined, size: 64, color: Colors.grey),
                    SizedBox(height: 12),
                    Text('Aucune progression enregistrée'),
                  ],
                ),
              );
            }

            // Summary card at top
            final avgQuiz = state.progressList.isEmpty
                ? 0.0
                : state.progressList
                          .map((p) => p.quizAverage)
                          .reduce((a, b) => a + b) /
                      state.progressList.length;
            final totalQuizzes = state.progressList
                .map((p) => p.totalQuizzesTaken)
                .reduce((a, b) => a + b);
            final totalViewed = state.progressList
                .map((p) => p.totalResourcesViewed)
                .reduce((a, b) => a + b);

            return ListView(
              padding: const EdgeInsets.all(12),
              children: [
                // Summary
                Card(
                  color: theme.colorScheme.primaryContainer,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _SumStat(
                          icon: Icons.bar_chart,
                          label: 'Moy. Quiz',
                          value: '${avgQuiz.toStringAsFixed(1)}%',
                        ),
                        _SumStat(
                          icon: Icons.quiz,
                          label: 'Quiz passés',
                          value: '$totalQuizzes',
                        ),
                        _SumStat(
                          icon: Icons.visibility,
                          label: 'Ressources',
                          value: '$totalViewed',
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ...state.progressList.map(
                  (p) => _ParentProgressCard(progress: p),
                ),
              ],
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}

class _SumStat extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _SumStat({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Icon(icon, size: 24, color: theme.colorScheme.onPrimaryContainer),
        const SizedBox(height: 4),
        Text(
          value,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(label, style: theme.textTheme.bodySmall),
      ],
    );
  }
}

class _ParentProgressCard extends StatelessWidget {
  final StudentProgress progress;
  const _ParentProgressCard({required this.progress});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              progress.subjectName ?? 'Matière',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: progress.completionPercentage / 100,
                      minHeight: 8,
                      backgroundColor: Colors.grey.shade200,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text('${progress.completionPercentage.toStringAsFixed(0)}%'),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Quiz: ${progress.totalQuizzesTaken}',
                  style: theme.textTheme.bodySmall,
                ),
                Text(
                  'Moyenne: ${progress.quizAverage.toStringAsFixed(1)}%',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: progress.quizAverage >= 50
                        ? Colors.green
                        : Colors.orange,
                  ),
                ),
                Text(
                  'Ressources: ${progress.totalResourcesViewed}',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
