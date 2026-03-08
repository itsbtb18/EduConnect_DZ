import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/formation_models.dart';
import '../../data/repositories/trainer_repository.dart';

class TrainerAttendanceScreen extends StatefulWidget {
  const TrainerAttendanceScreen({super.key});

  @override
  State<TrainerAttendanceScreen> createState() =>
      _TrainerAttendanceScreenState();
}

class _TrainerAttendanceScreenState extends State<TrainerAttendanceScreen> {
  bool _isLoading = true;
  String? _error;

  List<TrainingGroup> _groups = [];
  TrainingGroup? _selectedGroup;
  List<TrainingSession> _sessions = [];
  TrainingSession? _selectedSession;
  List<SessionAttendance> _attendance = [];
  // mutable status overrides for each attendance record
  final Map<String, String> _statusOverrides = {};
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadGroups();
  }

  Future<void> _loadGroups() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      _groups = await getIt<TrainerRepository>().getMyGroups();
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _loadSessions(TrainingGroup group) async {
    setState(() {
      _selectedGroup = group;
      _selectedSession = null;
      _attendance = [];
      _isLoading = true;
    });
    try {
      _sessions = await getIt<TrainerRepository>().getSessions(
        groupId: group.id,
      );
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _loadAttendance(TrainingSession session) async {
    setState(() {
      _selectedSession = session;
      _isLoading = true;
      _statusOverrides.clear();
    });
    try {
      _attendance = await getIt<TrainerRepository>().getSessionAttendance(
        sessionId: session.id,
      );
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _saveAttendance() async {
    if (_selectedSession == null) return;
    setState(() => _saving = true);
    try {
      final records = _attendance.map((a) {
        final status = _statusOverrides[a.enrollmentId] ?? a.status;
        return {
          'enrollment': a.enrollmentId,
          'status': status,
          'notes': a.notes,
        };
      }).toList();

      await getIt<TrainerRepository>().bulkMarkAttendance(
        sessionId: _selectedSession!.id,
        records: records,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Présences enregistrées'),
            backgroundColor: AppColors.success,
          ),
        );
        _loadAttendance(_selectedSession!);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadGroups,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Marquage des présences',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          if (_error != null)
            Card(
              color: Colors.red.shade50,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  _error!,
                  style: TextStyle(color: Colors.red.shade700),
                ),
              ),
            ),

          // Step 1: Select group
          _buildGroupSelector(),
          const SizedBox(height: 12),

          // Step 2: Select session
          if (_selectedGroup != null) _buildSessionSelector(),
          const SizedBox(height: 12),

          // Step 3: Attendance list
          if (_selectedSession != null) _buildAttendanceList(),
        ],
      ),
    );
  }

  Widget _buildGroupSelector() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.groups, size: 20, color: AppColors.primary),
                SizedBox(width: 8),
                Text(
                  '1. Sélectionner un groupe',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(),
            if (_isLoading && _selectedGroup == null)
              const Center(child: CircularProgressIndicator())
            else if (_groups.isEmpty)
              const Text(
                'Aucun groupe assigné',
                style: TextStyle(color: AppColors.textSecondary),
              )
            else
              ..._groups.map(
                (g) => ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  selected: _selectedGroup?.id == g.id,
                  selectedTileColor: AppColors.primary.withValues(alpha: 0.08),
                  leading: const Icon(Icons.group, size: 20),
                  title: Text(g.name),
                  subtitle: Text(
                    '${g.formationName ?? ''} • ${g.level}',
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: Text(
                    '${g.enrolledCount} appr.',
                    style: const TextStyle(fontSize: 12),
                  ),
                  onTap: () => _loadSessions(g),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSessionSelector() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.event, size: 20, color: AppColors.primary),
                SizedBox(width: 8),
                Text(
                  '2. Sélectionner une séance',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const Divider(),
            if (_isLoading && _selectedSession == null)
              const Center(child: CircularProgressIndicator())
            else if (_sessions.isEmpty)
              const Text(
                'Aucune séance',
                style: TextStyle(color: AppColors.textSecondary),
              )
            else
              ..._sessions.where((s) => !s.isCancelled).map((s) {
                final marked = s.attendanceMarked;
                return ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  selected: _selectedSession?.id == s.id,
                  selectedTileColor: AppColors.primary.withValues(alpha: 0.08),
                  leading: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        s.date.length >= 10 ? s.date.substring(5) : s.date,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  title: Text(
                    '${s.startTime.substring(0, 5)} - ${s.endTime.substring(0, 5)}',
                  ),
                  subtitle: Text(
                    s.topic ?? 'Séance',
                    style: const TextStyle(fontSize: 12),
                  ),
                  trailing: Icon(
                    marked ? Icons.check_circle : Icons.warning_amber,
                    color: marked ? AppColors.success : AppColors.warning,
                    size: 20,
                  ),
                  onTap: () => _loadAttendance(s),
                );
              }),
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceList() {
    const statuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
    const statusLabels = {
      'PRESENT': 'P',
      'ABSENT': 'A',
      'LATE': 'R',
      'EXCUSED': 'E',
    };
    const statusColors = {
      'PRESENT': AppColors.success,
      'ABSENT': AppColors.error,
      'LATE': AppColors.warning,
      'EXCUSED': AppColors.info,
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.fact_check,
                  size: 20,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    '3. Marquer les présences',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: _saving ? null : _saveAttendance,
                  icon: _saving
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.save, size: 18),
                  label: const Text('Enregistrer'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: statuses
                  .map(
                    (s) => Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: Row(
                        children: [
                          Container(
                            width: 18,
                            height: 18,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: statusColors[s]!.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              statusLabels[s]!,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: statusColors[s],
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text(
                            s == 'PRESENT'
                                ? 'Présent'
                                : s == 'ABSENT'
                                ? 'Absent'
                                : s == 'LATE'
                                ? 'Retard'
                                : 'Excusé',
                            style: const TextStyle(fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
            const Divider(),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_attendance.isEmpty)
              const Text(
                'Aucun apprenant inscrit',
                style: TextStyle(color: AppColors.textSecondary),
              )
            else
              ..._attendance.asMap().entries.map((entry) {
                final a = entry.value;
                final currentStatus =
                    _statusOverrides[a.enrollmentId] ?? a.status;
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          a.learnerName ?? 'Apprenant ${entry.key + 1}',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                      ...statuses.map((s) {
                        final isSelected = currentStatus == s;
                        return Padding(
                          padding: const EdgeInsets.only(left: 4),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(6),
                            onTap: () => setState(
                              () => _statusOverrides[a.enrollmentId] = s,
                            ),
                            child: Container(
                              width: 32,
                              height: 32,
                              alignment: Alignment.center,
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? statusColors[s]!
                                    : statusColors[s]!.withValues(alpha: 0.08),
                                borderRadius: BorderRadius.circular(6),
                                border: isSelected
                                    ? null
                                    : Border.all(
                                        color: statusColors[s]!.withValues(
                                          alpha: 0.3,
                                        ),
                                      ),
                              ),
                              child: Text(
                                statusLabels[s]!,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: isSelected
                                      ? Colors.white
                                      : statusColors[s],
                                ),
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
