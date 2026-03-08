import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/elearning_bloc.dart';

class QuizListScreen extends StatelessWidget {
  const QuizListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ElearningBloc()..add(const LoadQuizzes()),
      child: const _QuizListBody(),
    );
  }
}

class _QuizListBody extends StatelessWidget {
  const _QuizListBody();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Mes Quiz')),
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
              return const Center(child: Text('Aucun quiz disponible'));
            }
            return ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: state.quizzes.length,
              itemBuilder: (_, i) {
                final quiz = state.quizzes[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: quiz.isPublished
                          ? Colors.green.withValues(alpha: 0.15)
                          : Colors.grey.withValues(alpha: 0.15),
                      child: Icon(
                        Icons.quiz,
                        color: quiz.isPublished ? Colors.green : Colors.grey,
                      ),
                    ),
                    title: Text(
                      quiz.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    subtitle: Text(
                      [
                        quiz.subjectName,
                        quiz.chapter,
                        if (quiz.durationMinutes != null)
                          '${quiz.durationMinutes} min',
                        '${quiz.questionCount} Q',
                      ].where((e) => e != null && e.isNotEmpty).join(' · '),
                      style: theme.textTheme.bodySmall,
                    ),
                    trailing: quiz.isClosed
                        ? const Chip(
                            label: Text(
                              'Fermé',
                              style: TextStyle(fontSize: 11),
                            ),
                            backgroundColor: Colors.red,
                          )
                        : const Icon(Icons.arrow_forward_ios, size: 16),
                    onTap: quiz.isClosed
                        ? null
                        : () => context.push(
                            '/student/elearning/quiz?quizId=${quiz.id}',
                          ),
                  ),
                );
              },
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }
}
