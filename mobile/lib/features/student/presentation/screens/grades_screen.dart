import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/models/grade_model.dart';
import '../bloc/student_bloc.dart';

/// Grades screen — displays student grades per subject and semester
class GradesScreen extends StatefulWidget {
  const GradesScreen({super.key});

  @override
  State<GradesScreen> createState() => _GradesScreenState();
}

class _GradesScreenState extends State<GradesScreen> {
  @override
  void initState() {
    super.initState();
    context.read<StudentBloc>().add(const StudentLoadGrades());
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Mes Notes',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: BlocBuilder<StudentBloc, StudentState>(
              builder: (context, state) {
                if (state is StudentLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state is StudentError) {
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
                          onPressed: () => context.read<StudentBloc>().add(
                            const StudentLoadGrades(),
                          ),
                          child: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  );
                }
                if (state is StudentGradesLoaded) {
                  return _buildGradesList(state.grades);
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGradesList(List<Grade> grades) {
    if (grades.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.grade_outlined, size: 64, color: AppColors.textHint),
            SizedBox(height: 16),
            Text(
              'Aucune note disponible',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    // Group grades by subject
    final bySubject = <String, List<Grade>>{};
    for (final g in grades) {
      final key = g.subjectName ?? 'Autre';
      bySubject.putIfAbsent(key, () => []).add(g);
    }

    return ListView.builder(
      itemCount: bySubject.length,
      itemBuilder: (context, index) {
        final subject = bySubject.keys.elementAt(index);
        final subjectGrades = bySubject[subject]!;
        final avg =
            subjectGrades.fold<double>(0, (s, g) => s + g.score) /
            subjectGrades.length;
        final avgColor = avg >= 10 ? Colors.green : Colors.red;

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ExpansionTile(
            leading: CircleAvatar(
              backgroundColor: avgColor.withAlpha(30),
              child: Text(
                avg.toStringAsFixed(1),
                style: TextStyle(
                  color: avgColor,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
            title: Text(
              subject,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              '${subjectGrades.length} note(s)',
              style: const TextStyle(fontSize: 12),
            ),
            children: subjectGrades.map((g) {
              return ListTile(
                dense: true,
                title: Text(g.examTypeName ?? 'Examen'),
                trailing: Text(
                  '${g.score.toStringAsFixed(1)}/${g.maxScore.toInt()}',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: g.score >= 10 ? Colors.green : Colors.red,
                  ),
                ),
                subtitle: g.remark != null ? Text(g.remark!) : null,
              );
            }).toList(),
          ),
        );
      },
    );
  }
}
