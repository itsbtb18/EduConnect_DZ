import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../../student/data/models/academic_model.dart';
import '../../../student/data/repositories/academic_repository.dart';
import '../../../shared/data/models/communication_model.dart';

import '../bloc/teacher_bloc.dart';

/// Teacher screen for marking daily attendance for a classroom.
class AttendanceMarkingScreen extends StatefulWidget {
  const AttendanceMarkingScreen({super.key});

  @override
  State<AttendanceMarkingScreen> createState() =>
      _AttendanceMarkingScreenState();
}

class _AttendanceMarkingScreenState extends State<AttendanceMarkingScreen> {
  String? _selectedClassroomId;
  DateTime _selectedDate = DateTime.now();
  final Map<String, String> _attendanceStatus = {};

  List<Classroom> _classrooms = [];
  bool _loadingClassrooms = true;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _loadClassrooms();
  }

  Future<void> _loadClassrooms() async {
    try {
      final classrooms = await getIt<AcademicRepository>().getClassrooms();
      setState(() {
        _classrooms = classrooms;
        _loadingClassrooms = false;
      });
    } catch (e) {
      setState(() => _loadingClassrooms = false);
    }
  }

  void _onClassroomChanged(String? classroomId) {
    setState(() {
      _selectedClassroomId = classroomId;
      _attendanceStatus.clear();
    });
    if (classroomId != null) {
      final dateStr =
          '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
      context.read<TeacherBloc>().add(
        TeacherLoadAttendance(classroomId: classroomId, date: dateStr),
      );
    }
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() => _selectedDate = picked);
      if (_selectedClassroomId != null) {
        _onClassroomChanged(_selectedClassroomId);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Appel — Présences'),
        actions: [
          TextButton.icon(
            onPressed: _submitting ? null : _onSubmitAttendance,
            icon: const Icon(Icons.check_circle, color: Colors.white),
            label: const Text('Valider', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildHeader(),
          const Divider(height: 1),
          Expanded(child: _buildStudentListFromBloc()),
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
            child: _loadingClassrooms
                ? const LinearProgressIndicator()
                : DropdownButtonFormField<String>(
                    initialValue: _selectedClassroomId,
                    decoration: const InputDecoration(
                      labelText: 'Classe',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    items: _classrooms
                        .map(
                          (c) => DropdownMenuItem(
                            value: c.id,
                            child: Text(c.name),
                          ),
                        )
                        .toList(),
                    onChanged: _onClassroomChanged,
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

  Widget _buildStudentListFromBloc() {
    if (_selectedClassroomId == null) {
      return const Center(
        child: Text(
          'Sélectionnez une classe',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return BlocConsumer<TeacherBloc, TeacherState>(
      listener: (context, state) {
        if (state is TeacherAttendanceLoaded) {
          // Initialize status from loaded records
          for (final r in state.records) {
            _attendanceStatus[r.studentId] = r.status;
          }
        }
        if (state is TeacherAttendanceMarked) {
          setState(() => _submitting = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Appel enregistré avec succès')),
          );
        }
        if (state is TeacherError) {
          setState(() => _submitting = false);
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Erreur: ${state.message}')));
        }
      },
      builder: (context, state) {
        if (state is TeacherLoading && !_submitting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is TeacherAttendanceLoaded) {
          return _buildStudentList(state.records);
        }
        if (state is TeacherError) {
          return Center(child: Text(state.message));
        }
        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildStudentList(List<AttendanceRecord> records) {
    if (records.isEmpty) {
      return const Center(
        child: Text('Aucun élève trouvé', style: TextStyle(color: Colors.grey)),
      );
    }

    // Get unique students from records, defaulting to present
    final students = <String, String>{};
    final studentNames = <String, String>{};
    for (final r in records) {
      students.putIfAbsent(r.studentId, () => r.status);
      if (r.studentName != null) {
        studentNames[r.studentId] = r.studentName!;
      }
    }

    // Merge with local state
    for (final entry in students.entries) {
      _attendanceStatus.putIfAbsent(entry.key, () => entry.value);
    }

    final studentIds = students.keys.toList();

    return ListView.builder(
      itemCount: studentIds.length,
      itemBuilder: (context, index) {
        final id = studentIds[index];
        final name = studentNames[id] ?? 'Élève $id';
        final status = _attendanceStatus[id] ?? 'present';

        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _statusColor(status).withAlpha(50),
              child: Icon(_statusIcon(status), color: _statusColor(status)),
            ),
            title: Text(name),
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
    if (_selectedClassroomId == null || _attendanceStatus.isEmpty) return;

    setState(() => _submitting = true);
    final dateStr =
        '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';

    final records = _attendanceStatus.entries
        .map((e) => {'student': e.key, 'status': e.value})
        .toList();

    context.read<TeacherBloc>().add(
      TeacherMarkAttendance(
        classroomId: _selectedClassroomId!,
        date: dateStr,
        records: records,
      ),
    );
  }
}
