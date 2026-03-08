import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../trainer/data/models/formation_models.dart';
import '../../data/repositories/trainee_repository.dart';

class TraineeFormationsScreen extends StatefulWidget {
  const TraineeFormationsScreen({super.key});

  @override
  State<TraineeFormationsScreen> createState() =>
      _TraineeFormationsScreenState();
}

class _TraineeFormationsScreenState extends State<TraineeFormationsScreen> {
  bool _isLoading = true;
  String? _error;
  List<TrainingEnrollment> _enrollments = [];

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
      _enrollments = await getIt<TraineeRepository>().getMyEnrollments();
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
      child: _enrollments.isEmpty
          ? ListView(
              children: const [
                SizedBox(height: 100),
                Center(
                  child: Icon(
                    Icons.school_outlined,
                    size: 64,
                    color: AppColors.textSecondary,
                  ),
                ),
                SizedBox(height: 16),
                Center(
                  child: Text(
                    'Aucune formation active',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _enrollments.length + 1,
              itemBuilder: (_, i) {
                if (i == 0) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      'Mes formations',
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  );
                }
                final e = _enrollments[i - 1];
                return _buildEnrollmentCard(e);
              },
            ),
    );
  }

  Widget _buildEnrollmentCard(TrainingEnrollment e) {
    final progress = e.totalSessions > 0
        ? e.sessionsAttended / e.totalSessions
        : 0.0;
    final statusColor = e.status == 'ACTIVE'
        ? AppColors.success
        : e.status == 'COMPLETED'
        ? AppColors.secondary
        : AppColors.textSecondary;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.school, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    e.formationName ?? 'Formation',
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
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    e.status == 'ACTIVE'
                        ? 'Active'
                        : e.status == 'COMPLETED'
                        ? 'Terminée'
                        : e.status,
                    style: TextStyle(
                      fontSize: 10,
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              '${e.groupName ?? ''} • Niveau: ${e.level ?? '—'}',
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 12),

            // Progress bar
            Row(
              children: [
                const Text('Avancement: ', style: TextStyle(fontSize: 12)),
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 8,
                      backgroundColor: AppColors.divider,
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        AppColors.primary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${(progress * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Stats row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _stat(
                  'Séances suivies',
                  '${e.sessionsAttended}/${e.totalSessions}',
                  AppColors.primary,
                ),
                _stat(
                  'Taux présence',
                  '${e.attendanceRate.toStringAsFixed(0)}%',
                  e.attendanceRate >= 80
                      ? AppColors.success
                      : e.attendanceRate >= 50
                      ? AppColors.warning
                      : AppColors.error,
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
