import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../student/data/models/grade_model.dart';
import '../../../student/data/models/homework_model.dart';
import '../../../student/data/repositories/grade_repository.dart';
import '../../../student/data/repositories/homework_repository.dart';
import '../../../teacher/data/repositories/attendance_repository.dart';
import '../../../shared/data/models/communication_model.dart';
import '../../../shared/data/repositories/notification_repository.dart';

class ParentDashboard extends StatefulWidget {
  const ParentDashboard({super.key});

  @override
  State<ParentDashboard> createState() => _ParentDashboardState();
}

class _ParentDashboardState extends State<ParentDashboard> {
  bool _isLoading = true;
  String? _error;

  List<Grade> _childGrades = [];
  List<HomeworkTask> _pendingHomework = [];
  List<AttendanceRecord> _recentAttendance = [];
  int _unreadNotifications = 0;

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
        getIt<GradeRepository>().getGrades(),
        getIt<HomeworkRepository>().getTasks(),
        getIt<AttendanceRepository>().getRecords(),
        getIt<NotificationRepository>().getUnreadCount(),
      ]);

      _childGrades = (results[0] as List<Grade>).take(5).toList();
      _pendingHomework = (results[1] as List<HomeworkTask>)
          .where((t) => !t.hasSubmitted && !t.isOverdue)
          .take(5)
          .toList();
      _recentAttendance = (results[2] as List<AttendanceRecord>)
          .take(10)
          .toList();
      _unreadNotifications = results[3] as int;

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
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

    final present = _recentAttendance
        .where((r) => r.status == 'present')
        .length;
    final total = _recentAttendance.length;
    final rate = total > 0 ? (present / total * 100).toInt() : 0;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Tableau de bord Parent',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Summary cards
          Row(
            children: [
              _summaryCard(
                'Présence',
                '$rate%',
                Icons.check_circle,
                Colors.green,
              ),
              const SizedBox(width: 12),
              _summaryCard(
                'Devoirs',
                '${_pendingHomework.length}',
                Icons.assignment,
                Colors.orange,
              ),
              const SizedBox(width: 12),
              _summaryCard(
                'Notifs',
                '$_unreadNotifications',
                Icons.notifications,
                Colors.blue,
              ),
            ],
          ),
          const SizedBox(height: 16),

          _buildSection('Dernières notes', Icons.grade, _buildGrades()),
          const SizedBox(height: 16),
          _buildSection('Devoirs à rendre', Icons.assignment, _buildHomework()),
          const SizedBox(height: 16),
          _buildSection(
            'Présences récentes',
            Icons.calendar_today,
            _buildAttendance(),
          ),
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

  Widget _buildGrades() {
    if (_childGrades.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucune note',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _childGrades.map((g) {
        final color = g.score >= 10 ? Colors.green : Colors.red;
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: Text(g.subjectName ?? 'Matière'),
          subtitle: Text(g.examTypeName ?? ''),
          trailing: Text(
            '${g.score.toStringAsFixed(1)}/${g.maxScore.toInt()}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: color,
              fontSize: 16,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildHomework() {
    if (_pendingHomework.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucun devoir en attente',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _pendingHomework.map((hw) {
        final daysLeft = hw.dueDate.difference(DateTime.now()).inDays;
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: Text(hw.title, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text(hw.subjectName ?? ''),
          trailing: Text(
            daysLeft <= 0 ? 'Aujourd\'hui' : 'Dans $daysLeft j',
            style: TextStyle(
              fontSize: 12,
              color: daysLeft <= 1 ? Colors.red : Colors.grey,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAttendance() {
    if (_recentAttendance.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucune donnée',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _recentAttendance.take(5).map((r) {
        final color = r.status == 'present'
            ? Colors.green
            : r.status == 'late'
            ? Colors.orange
            : Colors.red;
        final label = r.status == 'present'
            ? 'Présent'
            : r.status == 'late'
            ? 'Retard'
            : 'Absent';
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: Icon(Icons.circle, size: 12, color: color),
          title: Text('${r.date.day}/${r.date.month}/${r.date.year}'),
          subtitle: Text(r.studentName ?? ''),
          trailing: Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w600),
          ),
        );
      }).toList(),
    );
  }
}
