import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../student/data/models/academic_model.dart';
import '../../../student/data/models/grade_model.dart';
import '../../../student/data/repositories/academic_repository.dart';
import '../../../student/data/repositories/grade_repository.dart';
import '../../../shared/data/models/communication_model.dart';
import '../../data/repositories/attendance_repository.dart';

/// Teacher screen for entering and managing student grades.
class GradeEntryScreen extends StatefulWidget {
  const GradeEntryScreen({super.key});

  @override
  State<GradeEntryScreen> createState() => _GradeEntryScreenState();
}

class _GradeEntryScreenState extends State<GradeEntryScreen> {
  String? _selectedClassroomId;
  String? _selectedSubjectId;
  String? _selectedExamTypeId;
  final Map<String, TextEditingController> _gradeControllers = {};

  List<Classroom> _classrooms = [];
  List<Subject> _subjects = [];
  List<ExamType> _examTypes = [];
  List<AttendanceRecord> _students =
      []; // used to get student list from attendance
  bool _loading = true;
  bool _saving = false;
  bool _loadingStudents = false;

  @override
  void initState() {
    super.initState();
    _loadFilters();
  }

  @override
  void dispose() {
    for (final c in _gradeControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _loadFilters() async {
    try {
      final results = await Future.wait([
        getIt<AcademicRepository>().getClassrooms(),
        getIt<AcademicRepository>().getSubjects(),
        getIt<GradeRepository>().getExamTypes(),
      ]);
      setState(() {
        _classrooms = results[0] as List<Classroom>;
        _subjects = results[1] as List<Subject>;
        _examTypes = results[2] as List<ExamType>;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadStudents() async {
    if (_selectedClassroomId == null) return;
    setState(() => _loadingStudents = true);
    try {
      // Load students via attendance records for this classroom
      final records = await getIt<AttendanceRepository>().getRecords(
        classroomId: _selectedClassroomId,
      );
      // De-duplicate by studentId
      final seen = <String>{};
      final unique = <AttendanceRecord>[];
      for (final r in records) {
        if (seen.add(r.studentId)) {
          unique.add(r);
        }
      }
      setState(() {
        _students = unique;
        _loadingStudents = false;
        // Reset controllers
        for (final c in _gradeControllers.values) {
          c.dispose();
        }
        _gradeControllers.clear();
      });
    } catch (e) {
      setState(() => _loadingStudents = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Saisie des notes'),
        actions: [
          TextButton.icon(
            onPressed: _saving ? null : _onSaveGrades,
            icon: const Icon(Icons.save, color: Colors.white),
            label: const Text(
              'Enregistrer',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildFilters(),
                const Divider(),
                Expanded(child: _buildStudentList()),
              ],
            ),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Wrap(
        spacing: 12,
        runSpacing: 8,
        children: [
          SizedBox(
            width: 180,
            child: DropdownButtonFormField<String>(
              initialValue: _selectedClassroomId,
              decoration: const InputDecoration(
                labelText: 'Classe',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              items: _classrooms
                  .map(
                    (c) => DropdownMenuItem(value: c.id, child: Text(c.name)),
                  )
                  .toList(),
              onChanged: (v) {
                setState(() => _selectedClassroomId = v);
                _loadStudents();
              },
            ),
          ),
          SizedBox(
            width: 180,
            child: DropdownButtonFormField<String>(
              initialValue: _selectedSubjectId,
              decoration: const InputDecoration(
                labelText: 'Matière',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              items: _subjects
                  .map(
                    (s) => DropdownMenuItem(value: s.id, child: Text(s.name)),
                  )
                  .toList(),
              onChanged: (v) => setState(() => _selectedSubjectId = v),
            ),
          ),
          SizedBox(
            width: 180,
            child: DropdownButtonFormField<String>(
              initialValue: _selectedExamTypeId,
              decoration: const InputDecoration(
                labelText: 'Type d\'examen',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              items: _examTypes
                  .map(
                    (e) => DropdownMenuItem(value: e.id, child: Text(e.name)),
                  )
                  .toList(),
              onChanged: (v) => setState(() => _selectedExamTypeId = v),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentList() {
    if (_selectedClassroomId == null ||
        _selectedSubjectId == null ||
        _selectedExamTypeId == null) {
      return const Center(
        child: Text(
          'Sélectionnez une classe, une matière et un type d\'examen',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    if (_loadingStudents) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_students.isEmpty) {
      return const Center(
        child: Text('Aucun élève trouvé', style: TextStyle(color: Colors.grey)),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      itemCount: _students.length,
      itemBuilder: (context, index) {
        final student = _students[index];
        final id = student.studentId;
        _gradeControllers.putIfAbsent(id, () => TextEditingController());

        return Card(
          child: ListTile(
            leading: CircleAvatar(child: Text('${index + 1}')),
            title: Text(student.studentName ?? 'Élève $id'),
            trailing: SizedBox(
              width: 80,
              child: TextFormField(
                controller: _gradeControllers[id],
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                textAlign: TextAlign.center,
                decoration: const InputDecoration(
                  hintText: '/20',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Future<void> _onSaveGrades() async {
    if (_selectedSubjectId == null || _selectedExamTypeId == null) return;

    final entries = <MapEntry<String, double>>[];
    for (final e in _gradeControllers.entries) {
      if (e.value.text.isNotEmpty) {
        final score = double.tryParse(e.value.text);
        if (score != null && score >= 0 && score <= 20) {
          entries.add(MapEntry(e.key, score));
        }
      }
    }
    if (entries.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Aucune note saisie')));
      return;
    }

    setState(() => _saving = true);
    try {
      final gradeRepo = getIt<GradeRepository>();
      for (final entry in entries) {
        await gradeRepo.createGrade(
          studentId: entry.key,
          subjectId: _selectedSubjectId!,
          examTypeId: _selectedExamTypeId!,
          score: entry.value,
        );
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${entries.length} notes enregistrées')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
