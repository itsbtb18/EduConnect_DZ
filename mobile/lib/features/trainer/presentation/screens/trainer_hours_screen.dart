import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/formation_models.dart';
import '../../data/repositories/trainer_repository.dart';

class TrainerHoursScreen extends StatefulWidget {
  const TrainerHoursScreen({super.key});

  @override
  State<TrainerHoursScreen> createState() => _TrainerHoursScreenState();
}

class _TrainerHoursScreenState extends State<TrainerHoursScreen> {
  bool _isLoading = true;
  String? _error;

  TrainerSalaryConfig? _salaryConfig;
  List<TrainingSession> _completedSessions = [];
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;

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
      final results = await Future.wait([
        repo.getMySalaryConfig(),
        repo.getSessions(status: 'COMPLETED'),
      ]);
      _salaryConfig = results[0] as TrainerSalaryConfig?;
      _completedSessions = results[1] as List<TrainingSession>;
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  List<TrainingSession> get _monthSessions {
    return _completedSessions.where((s) {
      final d = DateTime.tryParse(s.date);
      return d != null && d.month == _selectedMonth && d.year == _selectedYear;
    }).toList();
  }

  double get _totalHours {
    double hours = 0;
    for (final s in _monthSessions) {
      final start = _parseTime(s.startTime);
      final end = _parseTime(s.endTime);
      if (start != null && end != null) {
        hours += end.difference(start).inMinutes / 60.0;
      }
    }
    return hours;
  }

  DateTime? _parseTime(String t) {
    final parts = t.split(':');
    if (parts.length < 2) return null;
    return DateTime(2000, 1, 1, int.parse(parts[0]), int.parse(parts[1]));
  }

  double get _estimatedSalary {
    if (_salaryConfig == null) return 0;
    if (_salaryConfig!.isVacataire && _salaryConfig!.hourlyRate != null) {
      return _totalHours * _salaryConfig!.hourlyRate!;
    }
    return _salaryConfig!.baseSalary ?? 0;
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

    final months = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Jun',
      'Jul',
      'Aoû',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
    ];

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Heures & Salaire',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Month selector
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () {
                  setState(() {
                    if (_selectedMonth == 1) {
                      _selectedMonth = 12;
                      _selectedYear--;
                    } else {
                      _selectedMonth--;
                    }
                  });
                },
              ),
              Text(
                '${months[_selectedMonth - 1]} $_selectedYear',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () {
                  setState(() {
                    if (_selectedMonth == 12) {
                      _selectedMonth = 1;
                      _selectedYear++;
                    } else {
                      _selectedMonth++;
                    }
                  });
                },
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Summary cards
          Row(
            children: [
              _card(
                'Séances',
                '${_monthSessions.length}',
                Icons.event,
                AppColors.primary,
              ),
              const SizedBox(width: 12),
              _card(
                'Heures',
                '${_totalHours.toStringAsFixed(1)}h',
                Icons.access_time,
                AppColors.secondary,
              ),
              const SizedBox(width: 12),
              _card(
                'Salaire est.',
                '${_estimatedSalary.toStringAsFixed(0)} DA',
                Icons.payments,
                AppColors.success,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Contract info
          if (_salaryConfig != null) ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.badge, size: 20, color: AppColors.primary),
                        SizedBox(width: 8),
                        Text(
                          'Configuration salariale',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const Divider(),
                    _infoRow(
                      'Type de contrat',
                      _salaryConfig!.isVacataire ? 'Vacataire' : 'Permanent',
                    ),
                    if (_salaryConfig!.hourlyRate != null)
                      _infoRow(
                        'Taux horaire',
                        '${_salaryConfig!.hourlyRate!.toStringAsFixed(0)} DA/h',
                      ),
                    if (_salaryConfig!.baseSalary != null)
                      _infoRow(
                        'Salaire de base',
                        '${_salaryConfig!.baseSalary!.toStringAsFixed(0)} DA',
                      ),
                    _infoRow(
                      'Groupes assignés',
                      '${_salaryConfig!.groupCount}',
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Sessions list
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.list, size: 20, color: AppColors.primary),
                      SizedBox(width: 8),
                      Text(
                        'Séances effectuées',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const Divider(),
                  if (_monthSessions.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(8),
                      child: Text(
                        'Aucune séance ce mois',
                        style: TextStyle(color: AppColors.textSecondary),
                      ),
                    )
                  else
                    ..._monthSessions.map(
                      (s) => ListTile(
                        dense: true,
                        contentPadding: EdgeInsets.zero,
                        leading: Text(
                          s.date.length >= 10 ? s.date.substring(5) : s.date,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        title: Text(
                          s.groupName ?? 'Groupe',
                          style: const TextStyle(fontSize: 13),
                        ),
                        subtitle: Text(
                          '${s.startTime.substring(0, 5)} — ${s.endTime.substring(0, 5)}',
                          style: const TextStyle(fontSize: 11),
                        ),
                        trailing: Text(
                          s.room ?? '',
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _card(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 18,
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

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
