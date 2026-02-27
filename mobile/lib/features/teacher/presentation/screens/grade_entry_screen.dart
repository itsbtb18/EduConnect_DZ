import 'package:flutter/material.dart';

/// Teacher screen for entering and managing student grades.
class GradeEntryScreen extends StatefulWidget {
  const GradeEntryScreen({super.key});

  @override
  State<GradeEntryScreen> createState() => _GradeEntryScreenState();
}

class _GradeEntryScreenState extends State<GradeEntryScreen> {
  String? _selectedClassroom;
  String? _selectedSubject;
  String? _selectedExamType;
  final Map<String, TextEditingController> _gradeControllers = {};

  // Placeholder data — replace with BLoC/repository calls
  final _classrooms = ['1AM - A', '1AM - B', '2AM - A', '2AM - B'];
  final _subjects = ['Mathématiques', 'Physique', 'Français', 'Arabe'];
  final _examTypes = ['Devoir 1', 'Devoir 2', 'Composition'];
  final _students = [
    {'id': '1', 'name': 'Ahmed Benali'},
    {'id': '2', 'name': 'Fatima Rahmani'},
    {'id': '3', 'name': 'Youcef Mansouri'},
    {'id': '4', 'name': 'Sara Boudiaf'},
    {'id': '5', 'name': 'Khalil Haddad'},
  ];

  @override
  void dispose() {
    for (final c in _gradeControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Saisie des notes'),
        actions: [
          TextButton.icon(
            onPressed: _onSaveGrades,
            icon: const Icon(Icons.save, color: Colors.white),
            label: const Text(
              'Enregistrer',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filters
          _buildFilters(),
          const Divider(),
          // Student grade list
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
          _buildDropdown(
            label: 'Classe',
            value: _selectedClassroom,
            items: _classrooms,
            onChanged: (v) => setState(() => _selectedClassroom = v),
          ),
          _buildDropdown(
            label: 'Matière',
            value: _selectedSubject,
            items: _subjects,
            onChanged: (v) => setState(() => _selectedSubject = v),
          ),
          _buildDropdown(
            label: 'Type d\'examen',
            value: _selectedExamType,
            items: _examTypes,
            onChanged: (v) => setState(() => _selectedExamType = v),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return SizedBox(
      width: 180,
      child: DropdownButtonFormField<String>(
        initialValue: value,
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          isDense: true,
        ),
        items: items
            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
            .toList(),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildStudentList() {
    if (_selectedClassroom == null ||
        _selectedSubject == null ||
        _selectedExamType == null) {
      return const Center(
        child: Text(
          'Sélectionnez une classe, une matière et un type d\'examen',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      itemCount: _students.length,
      itemBuilder: (context, index) {
        final student = _students[index];
        final id = student['id']!;
        _gradeControllers.putIfAbsent(id, () => TextEditingController());

        return Card(
          child: ListTile(
            leading: CircleAvatar(child: Text('${index + 1}')),
            title: Text(student['name']!),
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
                validator: (v) {
                  if (v == null || v.isEmpty) return null;
                  final score = double.tryParse(v);
                  if (score == null || score < 0 || score > 20) {
                    return '0-20';
                  }
                  return null;
                },
              ),
            ),
          ),
        );
      },
    );
  }

  void _onSaveGrades() {
    final entries = <Map<String, dynamic>>[];
    for (final e in _gradeControllers.entries) {
      if (e.value.text.isNotEmpty) {
        entries.add({
          'student_id': e.key,
          'score': double.tryParse(e.value.text) ?? 0,
        });
      }
    }
    if (entries.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Aucune note saisie')));
      return;
    }
    // Dispatch grades to backend
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${entries.length} notes enregistrées')),
    );
  }
}
