import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/formation_models.dart';
import '../../data/repositories/trainer_repository.dart';
import '../../../shared/data/repositories/chat_repository.dart';
import '../../../shared/data/models/communication_model.dart';

class TrainerDashboard extends StatefulWidget {
  const TrainerDashboard({super.key});

  @override
  State<TrainerDashboard> createState() => _TrainerDashboardState();
}

class _TrainerDashboardState extends State<TrainerDashboard> {
  bool _isLoading = true;
  String? _error;

  List<TrainingGroup> _groups = [];
  List<TrainingSession> _todaySessions = [];
  List<Conversation> _conversations = [];
  int _unmarkedSessions = 0;

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
      final today = DateTime.now().toIso8601String().split('T').first;
      final results = await Future.wait([
        getIt<TrainerRepository>().getMyGroups(),
        getIt<TrainerRepository>().getSessions(date: today),
        getIt<ChatRepository>().getConversations(),
      ]);

      _groups = results[0] as List<TrainingGroup>;
      _todaySessions = results[1] as List<TrainingSession>;
      _conversations = results[2] as List<Conversation>;
      _unmarkedSessions = _todaySessions
          .where((s) => !s.attendanceMarked && !s.isCancelled)
          .length;

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

    final unreadMessages = _conversations.fold<int>(
      0,
      (sum, c) => sum + c.unreadCount,
    );

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Tableau de bord Formateur',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Summary cards
          Row(
            children: [
              _summaryCard(
                'Mes groupes',
                '${_groups.length}',
                Icons.groups,
                AppColors.primary,
              ),
              const SizedBox(width: 12),
              _summaryCard(
                'Séances',
                '${_todaySessions.length}',
                Icons.event,
                AppColors.secondary,
              ),
              const SizedBox(width: 12),
              _summaryCard(
                'Messages',
                '$unreadMessages',
                Icons.mail,
                Colors.green,
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Alert: unmarked sessions
          if (_unmarkedSessions > 0)
            Card(
              color: AppColors.warning.withValues(alpha: 0.1),
              child: ListTile(
                leading: const Icon(
                  Icons.warning_amber,
                  color: AppColors.warning,
                ),
                title: Text('$_unmarkedSessions séance(s) non marquée(s)'),
                subtitle: const Text('Présence à enregistrer'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.go('/trainer/attendance'),
              ),
            ),
          const SizedBox(height: 16),

          _buildSection('Séances du jour', Icons.today, _buildTodaySessions()),
          const SizedBox(height: 16),
          _buildSection('Mes groupes', Icons.groups, _buildGroupsList()),
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
      children: _todaySessions.map((session) {
        final statusColor = session.isCancelled
            ? Colors.red
            : session.isCompleted
            ? Colors.green
            : AppColors.primary;
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          leading: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                session.startTime.substring(0, 5),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
              Text(
                session.endTime.substring(0, 5),
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          title: Text(session.groupName ?? 'Groupe'),
          subtitle: Text(
            '${session.room ?? ''} • ${session.topic ?? 'Séance'}',
            style: const TextStyle(fontSize: 12),
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (!session.attendanceMarked && !session.isCancelled)
                const Icon(
                  Icons.warning_amber,
                  color: AppColors.warning,
                  size: 18,
                ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  session.isCancelled
                      ? 'Annulée'
                      : session.isCompleted
                      ? 'Terminée'
                      : 'Planifiée',
                  style: TextStyle(
                    fontSize: 10,
                    color: statusColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildGroupsList() {
    if (_groups.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(8),
        child: Text(
          'Aucun groupe assigné',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return Column(
      children: _groups.map((group) {
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: Text(group.name),
          subtitle: Text(
            '${group.formationName ?? ''} • ${group.level} • ${group.enrolledCount}/${group.capacity} apprenants',
            style: const TextStyle(fontSize: 12),
          ),
          trailing: Text(
            group.room ?? '',
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        );
      }).toList(),
    );
  }
}
