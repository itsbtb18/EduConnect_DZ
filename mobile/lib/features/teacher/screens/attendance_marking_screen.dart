import 'package:flutter/material.dart';

/// Teacher screen for marking daily attendance for a classroom.
class AttendanceMarkingScreen extends StatefulWidget {
  const AttendanceMarkingScreen({super.key});

  @override
  State<AttendanceMarkingScreen> createState() =>
      _AttendanceMarkingScreenState();
}

class _AttendanceMarkingScreenState extends State<AttendanceMarkingScreen> {
  String? _selectedClassroom;
  DateTime _selectedDate = DateTime.now();
  final Map<String, String> _attendanceStatus = {}; // studentId → status

  // Placeholder data — replace with BLoC/repository
  final _classrooms = ['1AM - A', '1AM - B', '2AM - A', '2AM - B'];
  final _students = [
    {'id': '1', 'name': 'Ahmed Benali'},
    {'id': '2', 'name': 'Fatima Rahmani'},
    {'id': '3', 'name': 'Youcef Mansouri'},
    {'id': '4', 'name': 'Sara Boudiaf'},
    {'id': '5', 'name': 'Khalil Haddad'},
    {'id': '6', 'name': 'Meriem Khelifi'},
    {'id': '7', 'name': 'Amine Djebbar'},
  ];

  @override
  void initState() {
    super.initState();
    // Default everyone to present
    for (final s in _students) {
      _attendanceStatus[s['id']!] = 'present';
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appel — Présences'),
        actions: [
          TextButton.icon(
            onPressed: _onSubmitAttendance,
            icon: const Icon(Icons.check_circle, color: Colors.white),
            label: const Text('Valider', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildHeader(),
          const Divider(height: 1),
          Expanded(child: _buildStudentList()),
          _buildSummaryBar(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    final dateStr =
        '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}';
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Expanded(
            child: DropdownButtonFormField<String>(
              value: _selectedClassroom,
              decoration: const InputDecoration(
                labelText: 'Classe',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              items: _classrooms
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
              onChanged: (v) => setState(() => _selectedClassroom = v),
            ),
          ),
          const SizedBox(width: 12),
          OutlinedButton.icon(
            onPressed: _pickDate,
            icon: const Icon(Icons.calendar_today, size: 18),
            label: Text(dateStr),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentList() {
    if (_selectedClassroom == null) {
      return const Center(
        child: Text(
          'Sélectionnez une classe',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      itemCount: _students.length,
      itemBuilder: (context, index) {
        final student = _students[index];
        final id = student['id']!;
        final status = _attendanceStatus[id] ?? 'present';

        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _statusColor(status).withAlpha(50),
              child: Icon(_statusIcon(status), color: _statusColor(status)),
            ),
            title: Text(student['name']!),
            trailing: ToggleButtons(
              borderRadius: BorderRadius.circular(8),
              isSelected: [
                status == 'present',
                status == 'absent',
                status == 'late',
              ],
              onPressed: (i) {
                setState(() {
                  _attendanceStatus[id] = ['present', 'absent', 'late'][i];
                });
              },
              children: const [
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Icon(Icons.check, color: Colors.green, size: 20),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Icon(Icons.close, color: Colors.red, size: 20),
                ),
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Icon(
                    Icons.access_time,
                    color: Colors.orange,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSummaryBar() {
    final present = _attendanceStatus.values
        .where((s) => s == 'present')
        .length;
    final absent = _attendanceStatus.values.where((s) => s == 'absent').length;
    final late_ = _attendanceStatus.values.where((s) => s == 'late').length;

    return Container(
      padding: const EdgeInsets.all(12),
      color: Colors.grey.shade100,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _summaryChip('Présents', present, Colors.green),
          _summaryChip('Absents', absent, Colors.red),
          _summaryChip('Retard', late_, Colors.orange),
        ],
      ),
    );
  }

  Widget _summaryChip(String label, int count, Color color) {
    return Chip(
      avatar: CircleAvatar(
        backgroundColor: color,
        child: Text(
          '$count',
          style: const TextStyle(color: Colors.white, fontSize: 12),
        ),
      ),
      label: Text(label),
    );
  }

  Color _statusColor(String status) => switch (status) {
    'present' => Colors.green,
    'absent' => Colors.red,
    'late' => Colors.orange,
    _ => Colors.grey,
  };

  IconData _statusIcon(String status) => switch (status) {
    'present' => Icons.check_circle,
    'absent' => Icons.cancel,
    'late' => Icons.access_time,
    _ => Icons.help,
  };

  void _onSubmitAttendance() {
    // TODO: Dispatch to BLoC → AttendanceRepository.bulkMark()
    final summary = _attendanceStatus.values.fold<Map<String, int>>(
      {},
      (map, s) => map..update(s, (v) => v + 1, ifAbsent: () => 1),
    );
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Appel enregistré: ${summary['present'] ?? 0} présents, '
          '${summary['absent'] ?? 0} absents, ${summary['late'] ?? 0} retards',
        ),
      ),
    );
  }
}
