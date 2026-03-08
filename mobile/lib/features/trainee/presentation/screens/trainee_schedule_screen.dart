import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../trainer/data/models/formation_models.dart';
import '../../data/repositories/trainee_repository.dart';

class TraineeScheduleScreen extends StatefulWidget {
  const TraineeScheduleScreen({super.key});

  @override
  State<TraineeScheduleScreen> createState() => _TraineeScheduleScreenState();
}

class _TraineeScheduleScreenState extends State<TraineeScheduleScreen> {
  bool _isLoading = true;
  String? _error;
  List<TrainingSession> _sessions = [];
  DateTime _weekStart = _getMonday(DateTime.now());

  static DateTime _getMonday(DateTime d) {
    final diff = d.weekday - 1;
    return DateTime(d.year, d.month, d.day - diff);
  }

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final weekStr =
          '${_weekStart.year}-${_weekStart.month.toString().padLeft(2, '0')}-${_weekStart.day.toString().padLeft(2, '0')}';
      _sessions = await getIt<TraineeRepository>().getMySessions(
        weekStart: weekStr,
      );
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  List<TrainingSession> _sessionsForDay(int dayIndex) {
    final day = _weekStart.add(Duration(days: dayIndex));
    final dayStr =
        '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
    return _sessions.where((s) => s.date == dayStr).toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));
  }

  @override
  Widget build(BuildContext context) {
    final weekEnd = _weekStart.add(const Duration(days: 6));
    final dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    return Column(
      children: [
        // Week navigation
        Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () {
                  setState(
                    () => _weekStart = _weekStart.subtract(
                      const Duration(days: 7),
                    ),
                  );
                  _loadSessions();
                },
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() => _weekStart = _getMonday(DateTime.now()));
                    _loadSessions();
                  },
                  child: Text(
                    '${_weekStart.day}/${_weekStart.month} — ${weekEnd.day}/${weekEnd.month}/${weekEnd.year}',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () {
                  setState(
                    () => _weekStart = _weekStart.add(const Duration(days: 7)),
                  );
                  _loadSessions();
                },
              ),
            ],
          ),
        ),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
              ? Center(child: Text(_error!))
              : RefreshIndicator(
                  onRefresh: _loadSessions,
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: 7,
                    itemBuilder: (_, dayIndex) {
                      final daySessions = _sessionsForDay(dayIndex);
                      final day = _weekStart.add(Duration(days: dayIndex));
                      final isToday = _isSameDay(day, DateTime.now());

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            margin: const EdgeInsets.only(top: 8),
                            decoration: BoxDecoration(
                              color: isToday
                                  ? AppColors.primary.withValues(alpha: 0.1)
                                  : AppColors.background,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                Text(
                                  '${dayNames[dayIndex]} ${day.day}/${day.month}',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: isToday
                                        ? AppColors.primary
                                        : AppColors.textPrimary,
                                  ),
                                ),
                                if (isToday) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 1,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      'Aujourd\'hui',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                      ),
                                    ),
                                  ),
                                ],
                                const Spacer(),
                                Text(
                                  '${daySessions.length} séance(s)',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (daySessions.isEmpty)
                            const Padding(
                              padding: EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              child: Text(
                                'Pas de séances',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            )
                          else
                            ...daySessions.map((s) {
                              final color = s.isCancelled
                                  ? AppColors.error
                                  : s.isCompleted
                                  ? AppColors.success
                                  : AppColors.primary;
                              return Card(
                                margin: const EdgeInsets.symmetric(
                                  horizontal: 4,
                                  vertical: 4,
                                ),
                                child: ListTile(
                                  dense: true,
                                  leading: Container(
                                    width: 4,
                                    height: 40,
                                    decoration: BoxDecoration(
                                      color: color,
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ),
                                  title: Text(
                                    s.groupName ?? 'Séance',
                                    style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  subtitle: Text(
                                    '${s.startTime.substring(0, 5)} — ${s.endTime.substring(0, 5)} • ${s.room ?? ''} • ${s.trainerName ?? ''}',
                                    style: const TextStyle(fontSize: 11),
                                  ),
                                  trailing: s.isCancelled
                                      ? const Text(
                                          'Annulée',
                                          style: TextStyle(
                                            color: AppColors.error,
                                            fontSize: 10,
                                          ),
                                        )
                                      : null,
                                ),
                              );
                            }),
                          const Divider(height: 4),
                        ],
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }

  bool _isSameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}
