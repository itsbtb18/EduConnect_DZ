import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/elearning_model.dart';
import '../bloc/elearning_bloc.dart';

class ExamBankScreen extends StatefulWidget {
  const ExamBankScreen({super.key});

  @override
  State<ExamBankScreen> createState() => _ExamBankScreenState();
}

class _ExamBankScreenState extends State<ExamBankScreen> {
  String? _selectedType;

  static const _examTypes = [
    ('BEP', 'BEP'),
    ('BEM', 'BEM'),
    ('BAC', 'BAC'),
    ('EXERCISE', 'Exercice'),
    ('HOMEWORK', 'Devoir'),
    ('MOCK_EXAM', 'Examen blanc'),
  ];

  @override
  void initState() {
    super.initState();
    context.read<ElearningBloc>().add(const LoadExams());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Banque d'examens")),
      body: Column(
        children: [
          // Filter chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('Tout'),
                  selected: _selectedType == null,
                  onSelected: (_) {
                    setState(() => _selectedType = null);
                    context.read<ElearningBloc>().add(const LoadExams());
                  },
                ),
                const SizedBox(width: 8),
                ..._examTypes.map(
                  (e) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(e.$2),
                      selected: _selectedType == e.$1,
                      onSelected: (_) {
                        setState(() => _selectedType = e.$1);
                        context.read<ElearningBloc>().add(
                          LoadExams(type: e.$1),
                        );
                      },
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: BlocBuilder<ElearningBloc, ElearningState>(
              builder: (context, state) {
                if (state is ElearningLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state is ElearningError) {
                  return Center(child: Text('Erreur: ${state.message}'));
                }
                if (state is ExamsLoaded) {
                  if (state.exams.isEmpty) {
                    return const Center(child: Text('Aucun examen trouvé'));
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: state.exams.length,
                    itemBuilder: (_, i) => _ExamCard(exam: state.exams[i]),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ExamCard extends StatelessWidget {
  final ExamBankItem exam;
  const _ExamCard({required this.exam});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _typeColor(exam.examType).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    exam.examType,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _typeColor(exam.examType),
                    ),
                  ),
                ),
                const Spacer(),
                if (exam.year != null)
                  Text('${exam.year}', style: theme.textTheme.bodySmall),
              ],
            ),
            const SizedBox(height: 8),
            Text(exam.title, style: theme.textTheme.titleMedium),
            if (exam.subjectName != null || exam.levelName != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  [
                    exam.subjectName,
                    exam.levelName,
                  ].where((e) => e != null).join(' · '),
                  style: theme.textTheme.bodySmall,
                ),
              ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.download, size: 16, color: theme.hintColor),
                const SizedBox(width: 4),
                Text('${exam.downloadCount}', style: theme.textTheme.bodySmall),
                const Spacer(),
                if (exam.file != null)
                  FilledButton.tonalIcon(
                    onPressed: () {
                      // Download exam file
                    },
                    icon: const Icon(Icons.picture_as_pdf, size: 18),
                    label: const Text('Sujet'),
                  ),
                if (exam.solutionFile != null && exam.solutionVisible) ...[
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: () {
                      // Download solution
                    },
                    icon: const Icon(Icons.check_circle, size: 18),
                    label: const Text('Corrigé'),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'BEP':
        return Colors.cyan;
      case 'BEM':
        return Colors.blue;
      case 'BAC':
        return Colors.deepPurple;
      case 'EXERCISE':
        return Colors.green;
      case 'HOMEWORK':
        return Colors.orange;
      case 'MOCK_EXAM':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
