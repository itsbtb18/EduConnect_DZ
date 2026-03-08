import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:ilmi_mobile/features/student/data/models/elearning_model.dart';
import 'package:ilmi_mobile/features/student/presentation/bloc/elearning_bloc.dart';

/// Teacher screen: view quizzes they've created and see attempt statistics.
class TeacherQuizDashboardScreen extends StatelessWidget {
  const TeacherQuizDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ElearningBloc()..add(const LoadQuizzes()),
      child: const _Body(),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes Quiz (Enseignant)')),
      body: BlocBuilder<ElearningBloc, ElearningState>(
        builder: (context, state) {
          if (state is ElearningLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is ElearningError) {
            return Center(child: Text('Erreur: ${state.message}'));
          }
          if (state is QuizzesLoaded) {
            if (state.quizzes.isEmpty) {
              return const Center(child: Text('Aucun quiz créé'));
            }
            return ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: state.quizzes.length,
              itemBuilder: (_, i) => _QuizTeacherCard(quiz: state.quizzes[i]),
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}

class _QuizTeacherCard extends StatelessWidget {
  final Quiz quiz;
  const _QuizTeacherCard({required this.quiz});

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
            Row(
              children: [
                Expanded(
                  child: Text(quiz.title, style: theme.textTheme.titleMedium),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: quiz.isPublished
                        ? Colors.green.withValues(alpha: 0.15)
                        : Colors.grey.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    quiz.isPublished ? 'Publié' : 'Brouillon',
                    style: TextStyle(
                      fontSize: 12,
                      color: quiz.isPublished ? Colors.green : Colors.grey,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              [
                quiz.subjectName,
                quiz.chapter,
                '${quiz.questionCount} questions',
                '${quiz.totalPoints} pts',
              ].where((e) => e != null && e.isNotEmpty).join(' · '),
              style: theme.textTheme.bodySmall,
            ),
            if (quiz.durationMinutes != null) ...[
              const SizedBox(height: 4),
              Text(
                'Durée: ${quiz.durationMinutes} min',
                style: theme.textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.people, size: 16, color: theme.hintColor),
                const SizedBox(width: 4),
                Text(
                  quiz.isClosed ? 'Quiz fermé' : 'Quiz ouvert',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: quiz.isClosed ? Colors.red : Colors.green,
                  ),
                ),
                const Spacer(),
                if (quiz.allowRetake)
                  const Chip(
                    label: Text('Reprise', style: TextStyle(fontSize: 10)),
                    padding: EdgeInsets.zero,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
