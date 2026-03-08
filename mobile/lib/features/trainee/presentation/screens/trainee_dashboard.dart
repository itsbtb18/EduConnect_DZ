import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../trainer/data/models/formation_models.dart';
import '../../data/repositories/trainee_repository.dart';

class TraineeDashboard extends StatefulWidget {
  const TraineeDashboard({super.key});

  @override
  State<TraineeDashboard> createState() => _TraineeDashboardState();
}

class _TraineeDashboardState extends State<TraineeDashboard> {
  bool _isLoading = true;
  String? _error;

  List<TrainingEnrollment> _enrollments = [];
  List<TrainingSession> _todaySessions = [];
  List<LearnerPayment> _payments = [];

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
      final repo = getIt<TraineeRepository>();
      final today = DateTime.now().toIso8601String().split('T').first;
      final results = await Future.wait([
        repo.getMyEnrollments(),
        repo.getMySessions(date: today),
        repo.getMyPayments(),
      ]);

      _enrollments = results[0] as List<TrainingEnrollment>;
      _todaySessions = results[1] as List<TrainingSession>;
      _payments = results[2] as List<LearnerPayment>;

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

    final avgAttendance = _enrollments.isNotEmpty
        ? _enrollments.fold<double>(0, (sum, e) => sum + e.attendanceRate) /
              _enrollments.length
        : 0.0;
    final pendingPayments = _payments.where((p) => p.isPending).length;

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

          // Summary cards
          Row(
            children: [
              _summaryCard(
                'Formations',
                '${_enrollments.length}',
                Icons.school,
                AppColors.primary,
              ),
              const SizedBox(width: 12),
              _summaryCard(
                'Présence',
                '${avgAttendance.toStringAsFixed(0)}%',
                Icons.fact_check,
                AppColors.secondary,
              ),
              const SizedBox(width: 12),
              _summaryCard(
                'Paiements',
                '$pendingPayments',
                Icons.payments,
                pendingPayments > 0 ? AppColors.warning : AppColors.success,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Next session highlight
          if (_todaySessions.isNotEmpty) ...[
            _buildSection('Prochaine séance', Icons.event, _buildNextSession()),
            const SizedBox(height: 16),
          ],

          // Active formations
          _buildSection('Mes formations', Icons.school, _buildFormationsList()),
          const SizedBox(height: 16),

          // Pending payments alert
          if (pendingPayments > 0)
            Card(
              color: AppColors.warning.withValues(alpha: 0.1),
              child: ListTile(
                leading: const Icon(
                  Icons.warning_amber,
                  color: AppColors.warning,
                ),
                title: Text('$pendingPayments paiement(s) en attente'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/trainee/payments'),
              ),
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

  Widget _buildNextSession() {
    final next = _todaySessions.where((s) => !s.isCancelled).toList();
    if (next.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Pas de séances aujourd\'hui',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    final s = next.first;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(Icons.schedule, color: AppColors.primary),
      ),
      title: Text(s.groupName ?? 'Séance'),
      subtitle: Text(
        '${s.startTime.substring(0, 5)} — ${s.endTime.substring(0, 5)} • ${s.room ?? ''} • ${s.topic ?? ''}',
        style: const TextStyle(fontSize: 12),
      ),
    );
  }

  Widget _buildFormationsList() {
    if (_enrollments.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucune formation active',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _enrollments.map((e) {
        final progress = e.totalSessions > 0
            ? e.sessionsAttended / e.totalSessions
            : 0.0;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      e.formationName ?? 'Formation',
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      '${e.groupName ?? ''} • ${e.level ?? ''}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: 80,
                child: Column(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 6,
                        backgroundColor: AppColors.divider,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          AppColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${(progress * 100).toStringAsFixed(0)}%',
                      style: const TextStyle(fontSize: 10),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '${e.attendanceRate.toStringAsFixed(0)}%',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: AppColors.secondary,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
