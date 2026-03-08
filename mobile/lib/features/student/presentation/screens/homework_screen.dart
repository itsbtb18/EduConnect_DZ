import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_theme.dart';
import '../../data/models/homework_model.dart';
import '../bloc/student_bloc.dart';

/// Homework list and submission screen for students
class HomeworkScreen extends StatefulWidget {
  const HomeworkScreen({super.key});

  @override
  State<HomeworkScreen> createState() => _HomeworkScreenState();
}

class _HomeworkScreenState extends State<HomeworkScreen> {
  @override
  void initState() {
    super.initState();
    context.read<StudentBloc>().add(StudentLoadHomework());
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Mes Devoirs',
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
                            StudentLoadHomework(),
                          ),
                          child: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  );
                }
                if (state is StudentHomeworkLoaded) {
                  return _buildFilteredView(state.tasks);
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilteredView(List<HomeworkTask> tasks) {
    final pending = tasks
        .where((t) => !t.hasSubmitted && !t.isOverdue)
        .toList();
    final submitted = tasks.where((t) => t.hasSubmitted).toList();
    final overdue = tasks.where((t) => t.isOverdue && !t.hasSubmitted).toList();

    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          TabBar(
            tabs: [
              Tab(text: 'À faire (${pending.length})'),
              Tab(text: 'Soumis (${submitted.length})'),
              Tab(text: 'En retard (${overdue.length})'),
            ],
          ),
          const SizedBox(height: 8),
          Expanded(
            child: TabBarView(
              children: [
                _buildHomeworkList(pending, 'Aucun devoir à faire'),
                _buildHomeworkList(submitted, 'Aucun devoir soumis'),
                _buildHomeworkList(overdue, 'Aucun devoir en retard'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeworkList(List<HomeworkTask> tasks, String emptyMsg) {
    if (tasks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.assignment_outlined,
              size: 48,
              color: AppColors.textHint,
            ),
            const SizedBox(height: 12),
            Text(
              emptyMsg,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: tasks.length,
      itemBuilder: (context, index) {
        final hw = tasks[index];
        final daysLeft = hw.dueDate.difference(DateTime.now()).inDays;
        final urgencyColor = hw.isOverdue
            ? Colors.red
            : hw.isDueSoon
            ? Colors.orange
            : Colors.green;

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: urgencyColor.withAlpha(30),
              child: Icon(Icons.assignment, color: urgencyColor, size: 20),
            ),
            title: Text(hw.title, maxLines: 1, overflow: TextOverflow.ellipsis),
            subtitle: Text(
              '${hw.subjectName ?? ''} • ${hw.teacherName ?? ''}\n'
              'Date limite: ${hw.dueDate.day}/${hw.dueDate.month}/${hw.dueDate.year}',
            ),
            isThreeLine: true,
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: urgencyColor.withAlpha(25),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                hw.isOverdue
                    ? 'En retard'
                    : daysLeft <= 0
                    ? 'Aujourd\'hui'
                    : '$daysLeft j',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: urgencyColor,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
