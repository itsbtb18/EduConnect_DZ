import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';

import '../../../student/data/models/academic_model.dart';
import '../../../student/data/models/homework_model.dart';
import '../../../student/data/repositories/academic_repository.dart';
import '../../../student/data/repositories/homework_repository.dart';
import '../../../shared/data/repositories/chat_repository.dart';
import '../../../shared/data/models/communication_model.dart';

class TeacherDashboard extends StatefulWidget {
  const TeacherDashboard({super.key});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard> {
  bool _isLoading = true;
  String? _error;

  List<ScheduleSlot> _todaySlots = [];
  List<HomeworkTask> _homeworkTasks = [];
  List<Classroom> _classrooms = [];
  List<Conversation> _conversations = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        getIt<AcademicRepository>().getSchedule(),
        getIt<HomeworkRepository>().getTasks(),
        getIt<AcademicRepository>().getClassrooms(),
        getIt<ChatRepository>().getConversations(),
      ]);

      final allSlots = results[0] as List<ScheduleSlot>;
      final todayDow = _todayDayOfWeek();
      _todaySlots = allSlots.where((s) => s.dayOfWeek == todayDow).toList()
        ..sort((a, b) => a.startTime.compareTo(b.startTime));

      _homeworkTasks = results[1] as List<HomeworkTask>;
      _classrooms = results[2] as List<Classroom>;
      _conversations = results[3] as List<Conversation>;

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  int _todayDayOfWeek() {
    final wd = DateTime.now().weekday;
    if (wd == 7) return 0;
    return wd;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 8),
            Text(_error!, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    final unreadMessages = _conversations.fold<int>(
      0,
      (sum, c) => sum + c.unreadCount,
    );
    final overdueHw = _homeworkTasks.where((t) => t.isOverdue).length;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Tableau de bord Enseignant',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Summary cards
          Row(
            children: [
              _summaryCard(
                'Mes classes',
                '${_classrooms.length}',
                Icons.class_,
                Colors.blue,
              ),
              const SizedBox(width: 12),
              _summaryCard(
                'Messages',
                '$unreadMessages',
                Icons.mail,
                Colors.green,
              ),
              const SizedBox(width: 12),
              _summaryCard(
                'Devoirs',
                '${_homeworkTasks.length}',
                Icons.assignment,
                overdueHw > 0 ? Colors.orange : Colors.teal,
              ),
            ],
          ),
          const SizedBox(height: 16),

          _buildSection(
            'Cours aujourd\'hui',
            Icons.schedule,
            _buildTodaySchedule(),
          ),
          const SizedBox(height: 16),
          _buildSection(
            'Devoirs récents',
            Icons.assignment,
            _buildHomeworkList(),
          ),
          const SizedBox(height: 16),
          _buildSection('Mes classes', Icons.people, _buildClassrooms()),
        ],
      ),
    );
  }

  Widget _summaryCard(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(label, style: const TextStyle(fontSize: 11)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(String title, IconData icon, Widget content) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 20, color: AppColors.primary),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const Divider(),
            content,
          ],
        ),
      ),
    );
  }

  Widget _buildTodaySchedule() {
    if (_todaySlots.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Pas de cours aujourd\'hui',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _todaySlots.map((slot) {
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                slot.startTime.substring(0, 5),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
              Text(
                slot.endTime.substring(0, 5),
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          title: Text(slot.subjectName ?? 'Matière'),
          subtitle: Text(
            '${slot.classroomName ?? ''} • ${slot.room ?? ''}',
            style: const TextStyle(fontSize: 12),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildHomeworkList() {
    if (_homeworkTasks.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucun devoir',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _homeworkTasks.take(5).map((hw) {
        final progress = hw.totalStudents > 0
            ? hw.submissionCount / hw.totalStudents
            : 0.0;
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: Text(hw.title, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text(
            '${hw.classroomName ?? ''} • ${hw.submissionCount}/${hw.totalStudents} soumissions',
            style: const TextStyle(fontSize: 12),
          ),
          trailing: SizedBox(
            width: 36,
            height: 36,
            child: CircularProgressIndicator(
              value: progress,
              strokeWidth: 3,
              backgroundColor: Colors.grey.shade200,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildClassrooms() {
    if (_classrooms.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucune classe',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _classrooms.map((c) {
        return Chip(
          avatar: CircleAvatar(
            backgroundColor: AppColors.primary,
            child: Text(
              '${c.studentCount}',
              style: const TextStyle(color: Colors.white, fontSize: 11),
            ),
          ),
          label: Text(c.name),
        );
      }).toList(),
    );
  }
}
