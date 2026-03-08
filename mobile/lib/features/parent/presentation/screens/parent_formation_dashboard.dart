import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../trainer/data/models/formation_models.dart';
import '../../../trainee/data/repositories/trainee_repository.dart';
import '../bloc/child_selector_cubit.dart';

/// Parent formation dashboard — shows child's formation data
/// (schedule, attendance, results, payments, certificates).
/// Used when a parent is in FORMATION context viewing a minor child's data.
class ParentFormationDashboard extends StatefulWidget {
  const ParentFormationDashboard({super.key});

  @override
  State<ParentFormationDashboard> createState() =>
      _ParentFormationDashboardState();
}

class _ParentFormationDashboardState extends State<ParentFormationDashboard> {
  bool _isLoading = true;
  String? _error;

  List<TrainingEnrollment> _enrollments = [];
  List<TrainingSession> _todaySessions = [];
  List<LearnerPayment> _payments = [];
  List<Certificate> _certificates = [];
  List<PlacementTest> _tests = [];

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
        repo.getMyCertificates(),
        repo.getMyPlacementTests(),
      ]);
      _enrollments = results[0] as List<TrainingEnrollment>;
      _todaySessions = results[1] as List<TrainingSession>;
      _payments = results[2] as List<LearnerPayment>;
      _certificates = results[3] as List<Certificate>;
      _tests = results[4] as List<PlacementTest>;
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

    final cubitState = context.read<ChildSelectorCubit>().state;
    final childName = cubitState is ChildSelectorLoaded
        ? (cubitState.selected?.fullName ?? 'Enfant')
        : 'Enfant';
    final pendingPayments = _payments.where((p) => p.isPending).length;
    final avgAttendance = _enrollments.isNotEmpty
        ? _enrollments.fold<double>(0, (sum, e) => sum + e.attendanceRate) /
              _enrollments.length
        : 0.0;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Formations de $childName',
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
                avgAttendance >= 80 ? AppColors.success : AppColors.warning,
              ),
              const SizedBox(width: 12),
              _summaryCard(
                'Certificats',
                '${_certificates.length}',
                Icons.emoji_events,
                AppColors.accent,
              ),
            ],
          ),
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
                subtitle: Text(
                  _payments
                      .where((p) => p.isPending)
                      .map((p) => '${p.amount.toStringAsFixed(0)} DA')
                      .join(' + '),
                ),
              ),
            ),
          const SizedBox(height: 16),

          // Today's sessions
          _buildSection('Séances du jour', Icons.today, _buildTodaySessions()),
          const SizedBox(height: 16),

          // Enrollments
          _buildSection(
            'Formations actives',
            Icons.school,
            _buildEnrollments(),
          ),
          const SizedBox(height: 16),

          // Results
          if (_tests.isNotEmpty) ...[
            _buildSection('Résultats des tests', Icons.quiz, _buildTests()),
            const SizedBox(height: 16),
          ],

          // Certificates
          if (_certificates.isNotEmpty) ...[
            _buildSection(
              'Certificats & Attestations',
              Icons.emoji_events,
              _buildCertificates(),
            ),
            const SizedBox(height: 16),
          ],

          // Payment history
          _buildSection(
            'Historique paiements',
            Icons.payments,
            _buildPayments(),
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

  Widget _buildTodaySessions() {
    if (_todaySessions.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Pas de séances aujourd\'hui',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _todaySessions
          .map(
            (s) => ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    s.startTime.substring(0, 5),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  Text(
                    s.endTime.substring(0, 5),
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
              title: Text(s.groupName ?? 'Séance'),
              subtitle: Text(
                '${s.room ?? ''} • ${s.trainerName ?? ''}',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: s.isCancelled
                  ? const Text(
                      'Annulée',
                      style: TextStyle(color: AppColors.error, fontSize: 11),
                    )
                  : const Icon(
                      Icons.schedule,
                      color: AppColors.primary,
                      size: 18,
                    ),
            ),
          )
          .toList(),
    );
  }

  Widget _buildEnrollments() {
    if (_enrollments.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucune formation',
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
                      '${e.groupName ?? ''} • ${e.level ?? ''} • ${e.sessionsAttended}/${e.totalSessions} séances',
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: 60,
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
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: e.attendanceRate >= 80
                      ? AppColors.success
                      : AppColors.warning,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTests() {
    return Column(
      children: _tests.take(5).map((t) {
        final pct = t.percentage;
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: CircleAvatar(
            radius: 16,
            backgroundColor: pct >= 80
                ? AppColors.success
                : pct >= 50
                ? AppColors.warning
                : AppColors.error,
            child: Text(
              '${pct.toInt()}',
              style: const TextStyle(fontSize: 11, color: Colors.white),
            ),
          ),
          title: Text('${t.evaluationType} — ${t.score}/${t.maxScore}'),
          subtitle: t.recommendedLevel != null
              ? Text(
                  'Niveau: ${t.recommendedLevel}',
                  style: const TextStyle(fontSize: 12),
                )
              : null,
          trailing: Icon(
            t.validated ? Icons.verified : Icons.hourglass_empty,
            color: t.validated ? AppColors.success : AppColors.warning,
            size: 18,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCertificates() {
    return Column(
      children: _certificates
          .map(
            (c) => ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.emoji_events, color: AppColors.accent),
              title: Text(c.formationName ?? 'Certificat'),
              subtitle: Text(
                '${c.certificateType} • ${c.issueDate}',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: c.pdfUrl != null
                  ? IconButton(
                      icon: const Icon(
                        Icons.download,
                        color: AppColors.primary,
                        size: 20,
                      ),
                      onPressed: () async {
                        final uri = Uri.parse(c.pdfUrl!);
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(
                            uri,
                            mode: LaunchMode.externalApplication,
                          );
                        }
                      },
                    )
                  : null,
            ),
          )
          .toList(),
    );
  }

  Widget _buildPayments() {
    if (_payments.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucun paiement',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _payments
          .take(10)
          .map(
            (p) => ListTile(
              dense: true,
              contentPadding: EdgeInsets.zero,
              leading: Icon(
                p.isPending ? Icons.pending : Icons.check_circle,
                color: p.isPending ? AppColors.warning : AppColors.success,
                size: 20,
              ),
              title: Text(p.formationName ?? 'Paiement'),
              subtitle: Text(
                '${p.paymentDate} • ${p.paymentMethod}',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: Text(
                '${p.amount.toStringAsFixed(0)} DA',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: p.isPending
                      ? AppColors.warning
                      : AppColors.textPrimary,
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}
