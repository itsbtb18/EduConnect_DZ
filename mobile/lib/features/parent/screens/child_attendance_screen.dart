import 'package:flutter/material.dart';

/// Parent screen to view their child's attendance records.
class ChildAttendanceScreen extends StatefulWidget {
  const ChildAttendanceScreen({super.key});

  @override
  State<ChildAttendanceScreen> createState() => _ChildAttendanceScreenState();
}

class _ChildAttendanceScreenState extends State<ChildAttendanceScreen> {
  // Placeholder data
  final _children = [
    {'id': '1', 'name': 'Ahmed Benali', 'classroom': '1AM - A'},
    {'id': '2', 'name': 'Sara Benali', 'classroom': '3AM - B'},
  ];
  String? _selectedChildId;

  DateTime _selectedMonth = DateTime(DateTime.now().year, DateTime.now().month);

  // Simulated attendance data (day → status)
  final Map<int, String> _attendanceData = {
    1: 'present',
    2: 'present',
    3: 'present',
    4: 'absent',
    5: 'present',
    6: 'present',
    7: 'present',
    8: 'late',
    9: 'present',
    10: 'present',
    11: 'present',
    12: 'present',
    13: 'absent',
    14: 'present',
    15: 'present',
  };

  @override
  void initState() {
    super.initState();
    _selectedChildId = _children.first['id'];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Présences de mon enfant')),
      body: Column(
        children: [
          _buildChildSelector(),
          _buildMonthSelector(),
          const Divider(height: 1),
          _buildSummaryCards(),
          const SizedBox(height: 8),
          Expanded(child: _buildCalendarGrid()),
          _buildLegend(),
        ],
      ),
    );
  }

  Widget _buildChildSelector() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: DropdownButtonFormField<String>(
        initialValue: _selectedChildId,
        decoration: const InputDecoration(
          labelText: 'Enfant',
          border: OutlineInputBorder(),
          isDense: true,
          prefixIcon: Icon(Icons.child_care),
        ),
        items: _children
            .map(
              (c) => DropdownMenuItem(
                value: c['id'],
                child: Text('${c['name']} — ${c['classroom']}'),
              ),
            )
            .toList(),
        onChanged: (v) => setState(() => _selectedChildId = v),
      ),
    );
  }

  Widget _buildMonthSelector() {
    final months = [
      'Jan',
      'Fév',
      'Mar',
      'Avr',
      'Mai',
      'Jun',
      'Sep',
      'Oct',
      'Nov',
      'Déc',
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
              '${months[_selectedMonth.month <= 6 ? _selectedMonth.month - 1 : _selectedMonth.month - 3]} ${_selectedMonth.year}',
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
    final present = _attendanceData.values.where((s) => s == 'present').length;
    final absent = _attendanceData.values.where((s) => s == 'absent').length;
    final late_ = _attendanceData.values.where((s) => s == 'late').length;
    final total = _attendanceData.length;
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
        final status = _attendanceData[day];
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
