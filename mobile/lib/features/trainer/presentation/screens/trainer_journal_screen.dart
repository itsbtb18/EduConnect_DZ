import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/formation_models.dart';
import '../../data/repositories/trainer_repository.dart';

class TrainerJournalScreen extends StatefulWidget {
  const TrainerJournalScreen({super.key});

  @override
  State<TrainerJournalScreen> createState() => _TrainerJournalScreenState();
}

class _TrainerJournalScreenState extends State<TrainerJournalScreen> {
  bool _isLoading = true;
  String? _error;

  List<TrainingGroup> _groups = [];
  Map<String, List<TrainingSession>> _sessionsByGroup = {};
  Map<String, List<TrainingEnrollment>> _enrollmentsByGroup = {};

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
      final repo = getIt<TrainerRepository>();
      _groups = await repo.getMyGroups();

      // Fetch sessions for all groups in parallel
      final sessionFutures = _groups.map(
        (g) => repo.getSessions(groupId: g.id),
      );
      final enrollmentFutures = _groups.map(
        (g) => repo.getGroupEnrollments(groupId: g.id),
      );

      final sessionResults = await Future.wait(sessionFutures);
      final enrollmentResults = await Future.wait(enrollmentFutures);

      _sessionsByGroup = {};
      _enrollmentsByGroup = {};
      for (int i = 0; i < _groups.length; i++) {
        _sessionsByGroup[_groups[i].id] = sessionResults[i];
        _enrollmentsByGroup[_groups[i].id] = enrollmentResults[i];
      }

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
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
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
            'Journal de formation',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Avancement du programme par groupe',
            style: TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),
          if (_groups.isEmpty)
            const Center(
              child: Text(
                'Aucun groupe assigné',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            )
          else
            ..._groups.map((g) => _buildGroupCard(g)),
        ],
      ),
    );
  }

  Widget _buildGroupCard(TrainingGroup group) {
    final sessions = _sessionsByGroup[group.id] ?? [];
    final enrollments = _enrollmentsByGroup[group.id] ?? [];

    final totalSessions = sessions.length;
    final completed = sessions.where((s) => s.isCompleted).length;
    final cancelled = sessions.where((s) => s.isCancelled).length;
    final scheduled = sessions.where((s) => s.isScheduled).length;
    final progress = totalSessions > 0 ? completed / totalSessions : 0.0;

    final avgAttendance = enrollments.isNotEmpty
        ? enrollments.fold<double>(0, (sum, e) => sum + e.attendanceRate) /
              enrollments.length
        : 0.0;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.menu_book, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    group.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: group.isActive
                        ? AppColors.success.withValues(alpha: 0.1)
                        : AppColors.textSecondary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    group.isActive ? 'Actif' : 'Inactif',
                    style: TextStyle(
                      fontSize: 10,
                      color: group.isActive
                          ? AppColors.success
                          : AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${group.formationName ?? ''} • ${group.level}',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
            const Divider(),

            // Progress bar
            Row(
              children: [
                const Text('Avancement: ', style: TextStyle(fontSize: 13)),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 8,
                      backgroundColor: AppColors.divider,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        progress > 0.7
                            ? AppColors.success
                            : progress > 0.3
                            ? AppColors.warning
                            : AppColors.error,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${(progress * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Stats
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _stat('Terminées', '$completed', AppColors.success),
                _stat('Planifiées', '$scheduled', AppColors.primary),
                _stat('Annulées', '$cancelled', AppColors.error),
                _stat(
                  'Présence',
                  '${avgAttendance.toStringAsFixed(0)}%',
                  AppColors.secondary,
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Enrollments
            Row(
              children: [
                const Icon(
                  Icons.people,
                  size: 16,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  '${enrollments.length} apprenants',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(width: 12),
                const Icon(
                  Icons.event,
                  size: 16,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  '$totalSessions séances au total',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
        ),
      ],
    );
  }
}
