import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/grade_model.dart';
import '../../data/models/homework_model.dart';
import '../../data/models/academic_model.dart';
import '../../data/repositories/grade_repository.dart';
import '../../data/repositories/homework_repository.dart';
import '../../data/repositories/academic_repository.dart';
import '../../../shared/data/repositories/announcement_repository.dart';
import '../../../shared/data/models/announcement_model.dart';

class StudentDashboard extends StatefulWidget {
  const StudentDashboard({super.key});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  bool _isLoading = true;
  String? _error;

  List<ScheduleSlot> _todaySlots = [];
  List<Grade> _recentGrades = [];
  List<HomeworkTask> _pendingHomework = [];
  List<Announcement> _announcements = [];

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
        getIt<GradeRepository>().getGrades(),
        getIt<HomeworkRepository>().getTasks(),
        getIt<AnnouncementRepository>().getAnnouncements(),
      ]);

      final allSlots = results[0] as List<ScheduleSlot>;
      final todayDow = _todayDayOfWeek();
      _todaySlots = allSlots.where((s) => s.dayOfWeek == todayDow).toList()
        ..sort((a, b) => a.startTime.compareTo(b.startTime));

      _recentGrades = (results[1] as List<Grade>).take(5).toList();
      _pendingHomework = (results[2] as List<HomeworkTask>)
          .where((t) => !t.hasSubmitted && !t.isOverdue)
          .take(5)
          .toList();
      _announcements = (results[3] as List<Announcement>).take(3).toList();

      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  int _todayDayOfWeek() {
    final wd = DateTime.now().weekday; // 1=Mon..7=Sun
    if (wd == 7) return 0; // Sunday
    return wd; // Mon=1..Thu=4
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

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Tableau de bord',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          _buildSection(
            'Cours aujourd\'hui',
            Icons.schedule,
            _buildTodaySchedule(),
          ),
          const SizedBox(height: 16),
          _buildSection('Dernières notes', Icons.grade, _buildRecentGrades()),
          const SizedBox(height: 16),
          _buildSection(
            'Devoirs à rendre',
            Icons.assignment,
            _buildPendingHomework(),
          ),
          const SizedBox(height: 16),
          _buildSection('Annonces', Icons.campaign, _buildAnnouncements()),
        ],
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
            '${slot.teacherName ?? ''} • ${slot.room ?? ''}',
            style: const TextStyle(fontSize: 12),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRecentGrades() {
    if (_recentGrades.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucune note récente',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _recentGrades.map((g) {
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

  Widget _buildPendingHomework() {
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
          title: Text(hw.title),
          subtitle: Text(hw.subjectName ?? ''),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: hw.isDueSoon
                  ? Colors.orange.shade100
                  : Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              daysLeft <= 0 ? 'Aujourd\'hui' : '$daysLeft j',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: hw.isDueSoon
                    ? Colors.orange.shade800
                    : Colors.blue.shade800,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAnnouncements() {
    if (_announcements.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucune annonce',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _announcements.map((a) {
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: const Icon(Icons.campaign, size: 20),
          title: Text(a.title, maxLines: 1, overflow: TextOverflow.ellipsis),
          subtitle: Text(
            '${a.authorName ?? ''} • ${a.createdAt.day}/${a.createdAt.month}',
            style: const TextStyle(fontSize: 11),
          ),
        );
      }).toList(),
    );
  }
}
