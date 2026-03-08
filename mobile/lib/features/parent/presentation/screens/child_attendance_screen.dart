import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../shared/data/models/communication_model.dart';
import '../../../teacher/data/repositories/attendance_repository.dart';

/// Parent screen to view their child's attendance records.
class ChildAttendanceScreen extends StatefulWidget {
  const ChildAttendanceScreen({super.key});

  @override
  State<ChildAttendanceScreen> createState() => _ChildAttendanceScreenState();
}

class _ChildAttendanceScreenState extends State<ChildAttendanceScreen> {
  DateTime _selectedMonth = DateTime(DateTime.now().year, DateTime.now().month);
  List<AttendanceRecord> _records = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAttendance();
  }

  Future<void> _loadAttendance() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final records = await getIt<AttendanceRepository>().getRecords();
      setState(() {
        _records = records;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  /// Get records filtered to the selected month
  Map<int, String> get _monthData {
    final map = <int, String>{};
    for (final r in _records) {
      if (r.date.year == _selectedMonth.year &&
          r.date.month == _selectedMonth.month) {
        map[r.date.day] = r.status;
      }
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Présences de mon enfant')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: _loadAttendance,
                    child: const Text('Réessayer'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadAttendance,
              child: Column(
                children: [
                  _buildMonthSelector(),
                  const Divider(height: 1),
                  _buildSummaryCards(),
                  const SizedBox(height: 8),
                  Expanded(child: _buildCalendarGrid()),
                  _buildLegend(),
                ],
              ),
            ),
    );
  }

  Widget _buildMonthSelector() {
    const months = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: () => setState(() {
              _selectedMonth = DateTime(
                _selectedMonth.year,
                _selectedMonth.month - 1,
              );
            }),
          ),
          Expanded(
            child: Text(
              '${months[_selectedMonth.month - 1]} ${_selectedMonth.year}',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: () => setState(() {
              _selectedMonth = DateTime(
                _selectedMonth.year,
                _selectedMonth.month + 1,
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCards() {
    final data = _monthData;
    final present = data.values.where((s) => s == 'present').length;
    final absent = data.values.where((s) => s == 'absent').length;
    final late_ = data.values.where((s) => s == 'late').length;
    final total = data.length;
    final rate = total > 0 ? (present / total * 100) : 0.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          _summaryCard('Présences', present, Colors.green),
          _summaryCard('Absences', absent, Colors.red),
          _summaryCard('Retards', late_, Colors.orange),
          _summaryCard('Taux', rate.toInt(), Colors.blue, suffix: '%'),
        ],
      ),
    );
  }

  Widget _summaryCard(
    String label,
    int value,
    Color color, {
    String suffix = '',
  }) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            children: [
              Text(
                '$value$suffix',
                style: TextStyle(
                  fontSize: 20,
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

  Widget _buildCalendarGrid() {
    final data = _monthData;
    final daysInMonth = DateUtils.getDaysInMonth(
      _selectedMonth.year,
      _selectedMonth.month,
    );
    final firstWeekday = DateTime(
      _selectedMonth.year,
      _selectedMonth.month,
      1,
    ).weekday;

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 7,
        childAspectRatio: 1,
        crossAxisSpacing: 4,
        mainAxisSpacing: 4,
      ),
      itemCount: daysInMonth + firstWeekday - 1,
      itemBuilder: (context, index) {
        if (index < firstWeekday - 1) {
          return const SizedBox();
        }
        final day = index - firstWeekday + 2;
        final status = data[day];
        return Container(
          decoration: BoxDecoration(
            color: _dayColor(status),
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.grey.shade300),
          ),
          child: Center(
            child: Text(
              '$day',
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: status == null ? Colors.grey : Colors.black87,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildLegend() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _legendDot(Colors.green.shade100, 'Présent'),
          const SizedBox(width: 16),
          _legendDot(Colors.red.shade100, 'Absent'),
          const SizedBox(width: 16),
          _legendDot(Colors.orange.shade100, 'Retard'),
          const SizedBox(width: 16),
          _legendDot(Colors.grey.shade100, 'Pas de cours'),
        ],
      ),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
            border: Border.all(color: Colors.grey.shade400),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11)),
      ],
    );
  }

  Color _dayColor(String? status) => switch (status) {
    'present' => Colors.green.shade100,
    'absent' => Colors.red.shade100,
    'late' => Colors.orange.shade100,
    _ => Colors.grey.shade50,
  };
}
