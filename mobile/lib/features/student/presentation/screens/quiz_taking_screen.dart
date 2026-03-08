import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/elearning_model.dart';
import '../bloc/elearning_bloc.dart';

class QuizTakingScreen extends StatefulWidget {
  final String quizId;
  const QuizTakingScreen({super.key, required this.quizId});

  @override
  State<QuizTakingScreen> createState() => _QuizTakingScreenState();
}

class _QuizTakingScreenState extends State<QuizTakingScreen> {
  final Map<String, dynamic> _answers = {};
  int _currentIndex = 0;
  Timer? _timer;
  int _remainingSeconds = 0;
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    context.read<ElearningBloc>().add(LoadQuizDetail(widget.quizId));
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer(int minutes) {
    _remainingSeconds = minutes * 60;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSeconds <= 0) {
        timer.cancel();
        _submit();
      } else {
        setState(() => _remainingSeconds--);
      }
    });
  }

  void _submit() {
    if (_submitted) return;
    _submitted = true;
    _timer?.cancel();
    context.read<ElearningBloc>().add(SubmitQuiz(widget.quizId, _answers));
  }

  String _formatTime(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ElearningBloc, ElearningState>(
      listener: (context, state) {
        if (state is QuizDetailLoaded && state.quiz.durationMinutes != null) {
          _startTimer(state.quiz.durationMinutes!);
        }
        if (state is QuizSubmitted) {
          _showResultDialog(context, state.attempt);
        }
      },
      builder: (context, state) {
        if (state is ElearningLoading) {
          return Scaffold(
            appBar: AppBar(title: const Text('Quiz')),
            body: const Center(child: CircularProgressIndicator()),
          );
        }
        if (state is QuizDetailLoaded) {
          return _buildQuiz(context, state.quiz);
        }
        if (state is QuizSubmitted) {
          return _buildResult(context, state.attempt);
        }
        if (state is ElearningError) {
          return Scaffold(
            appBar: AppBar(title: const Text('Quiz')),
            body: Center(child: Text('Erreur: ${state.message}')),
          );
        }
        return Scaffold(
          appBar: AppBar(title: const Text('Quiz')),
          body: const SizedBox.shrink(),
        );
      },
    );
  }

  Widget _buildQuiz(BuildContext context, Quiz quiz) {
    final questions = quiz.questions;
    if (questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(quiz.title)),
        body: const Center(child: Text('Aucune question')),
      );
    }
    final question = questions[_currentIndex];
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(quiz.title),
        actions: [
          if (_remainingSeconds > 0)
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                margin: const EdgeInsets.only(right: 12),
                decoration: BoxDecoration(
                  color: _remainingSeconds < 60 ? Colors.red : Colors.blue,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _formatTime(_remainingSeconds),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Progress indicator
          LinearProgressIndicator(
            value: (_currentIndex + 1) / questions.length,
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Question ${_currentIndex + 1}/${questions.length}',
                  style: theme.textTheme.bodySmall,
                ),
                Text(
                  '${question.points} pt(s)',
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(question.text, style: theme.textTheme.titleMedium),
                  const SizedBox(height: 20),
                  _buildAnswerWidget(question),
                ],
              ),
            ),
          ),
          // Navigation
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_currentIndex > 0)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => setState(() => _currentIndex--),
                        child: const Text('Précédent'),
                      ),
                    ),
                  if (_currentIndex > 0) const SizedBox(width: 12),
                  Expanded(
                    child: _currentIndex < questions.length - 1
                        ? FilledButton(
                            onPressed: () => setState(() => _currentIndex++),
                            child: const Text('Suivant'),
                          )
                        : FilledButton(
                            onPressed: () => _confirmSubmit(context),
                            child: const Text('Terminer'),
                          ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnswerWidget(QuizQuestion question) {
    switch (question.questionType) {
      case 'MCQ':
        return Column(
          children: question.options.map((option) {
            final selected = _answers[question.id];
            final isSelected = selected is List && selected.contains(option);
            return Card(
              color: isSelected
                  ? Theme.of(context).colorScheme.primaryContainer
                  : null,
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Icon(
                  isSelected ? Icons.check_circle : Icons.circle_outlined,
                ),
                title: Text(option),
                onTap: () {
                  setState(() {
                    final list = List<String>.from(
                      _answers[question.id] as List? ?? [],
                    );
                    if (list.contains(option)) {
                      list.remove(option);
                    } else {
                      list.add(option);
                    }
                    _answers[question.id] = list;
                  });
                },
              ),
            );
          }).toList(),
        );
      case 'TRUE_FALSE':
        final selected = _answers[question.id] as String?;
        return Row(
          children: [
            Expanded(
              child: Card(
                color: selected == 'true'
                    ? Colors.green.withValues(alpha: 0.15)
                    : null,
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => setState(() => _answers[question.id] = 'true'),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Icon(
                          Icons.check,
                          color: selected == 'true' ? Colors.green : null,
                          size: 32,
                        ),
                        const SizedBox(height: 8),
                        const Text('Vrai'),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Card(
                color: selected == 'false'
                    ? Colors.red.withValues(alpha: 0.15)
                    : null,
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => setState(() => _answers[question.id] = 'false'),
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      children: [
                        Icon(
                          Icons.close,
                          color: selected == 'false' ? Colors.red : null,
                          size: 32,
                        ),
                        const SizedBox(height: 8),
                        const Text('Faux'),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      case 'FREE_TEXT':
        return TextField(
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'Votre réponse...',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) => _answers[question.id] = v,
        );
      default:
        return const SizedBox.shrink();
    }
  }

  void _confirmSubmit(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Confirmer'),
        content: Text(
          'Vous avez répondu à ${_answers.length} question(s). Soumettre ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              _submit();
            },
            child: const Text('Soumettre'),
          ),
        ],
      ),
    );
  }

  void _showResultDialog(BuildContext context, QuizAttempt attempt) {
    // Results are shown in the builder when state is QuizSubmitted
  }

  Widget _buildResult(BuildContext context, QuizAttempt attempt) {
    final theme = Theme.of(context);
    final pct = attempt.percentage;
    return Scaffold(
      appBar: AppBar(title: const Text('Résultats')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                attempt.passed ? Icons.emoji_events : Icons.replay,
                size: 80,
                color: attempt.passed ? Colors.amber : Colors.red,
              ),
              const SizedBox(height: 16),
              Text(
                attempt.passed ? 'Félicitations !' : 'Essayez encore',
                style: theme.textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                '${attempt.score.toInt()}/${attempt.totalPoints.toInt()} (${pct.toStringAsFixed(0)}%)',
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: attempt.passed ? Colors.green : Colors.red,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: 120,
                height: 120,
                child: CircularProgressIndicator(
                  value: pct / 100,
                  strokeWidth: 10,
                  backgroundColor: Colors.grey.shade200,
                  color: attempt.passed ? Colors.green : Colors.red,
                ),
              ),
              const SizedBox(height: 32),
              FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Retour'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
