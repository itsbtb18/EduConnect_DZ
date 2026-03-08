import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:file_picker/file_picker.dart';

import '../../../../core/di/injection.dart';
import '../../../student/data/models/academic_model.dart';
import '../../../student/data/repositories/academic_repository.dart';
import '../../data/models/exam_model.dart';
import '../../../shared/data/models/communication_model.dart';
import '../../data/repositories/attendance_repository.dart';
import '../../data/repositories/exam_management_repository.dart';
import '../bloc/exam_management_cubit.dart';

/// Exam and grade management screen.
class ExamManagementScreen extends StatefulWidget {
  const ExamManagementScreen({super.key});

  @override
  State<ExamManagementScreen> createState() => _ExamManagementScreenState();
}

class _ExamManagementScreenState extends State<ExamManagementScreen>
    with SingleTickerProviderStateMixin {
  final ExamManagementCubit _cubit = ExamManagementCubit();
  late TabController _tabController;

  List<Classroom> _classrooms = [];
  List<Subject> _subjects = [];
  String? _selectedClassroomId;
  String? _selectedSubjectId;
  bool _filtersLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadFilters();
  }

  Future<void> _loadFilters() async {
    try {
      final results = await Future.wait([
        getIt<AcademicRepository>().getClassrooms(),
        getIt<AcademicRepository>().getSubjects(),
      ]);
      setState(() {
        _classrooms = results[0] as List<Classroom>;
        _subjects = results[1] as List<Subject>;
        _filtersLoading = false;
      });
      _cubit.loadExamTypes();
    } catch (_) {
      setState(() => _filtersLoading = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _cubit,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Examens & Évaluations'),
          bottom: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Types'),
              Tab(text: 'Saisie'),
              Tab(text: 'Import CSV'),
            ],
          ),
        ),
        body: _filtersLoading
            ? const Center(child: CircularProgressIndicator())
            : BlocConsumer<ExamManagementCubit, ExamManagementState>(
                listener: (context, state) {
                  if (state is GradesSaved) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Notes enregistrées')),
                    );
                  }
                  if (state is GradesSubmitted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Notes soumises pour validation'),
                      ),
                    );
                  }
                  if (state is CsvConfirmed) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Import CSV confirmé')),
                    );
                  }
                  if (state is ExamManagementError) {
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text(state.message)));
                  }
                },
                builder: (context, state) {
                  return TabBarView(
                    controller: _tabController,
                    children: [
                      _buildExamTypesTab(state),
                      _buildBulkEntryTab(),
                      _buildCsvImportTab(state),
                    ],
                  );
                },
              ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showCreateExamTypeDialog(context),
          child: const Icon(Icons.add),
        ),
      ),
    );
  }

  // ── Tab 1: Exam Types ──────────────────────────────────────────────────

  Widget _buildExamTypesTab(ExamManagementState state) {
    if (state is ExamManagementLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state is ExamTypesLoaded) {
      if (state.examTypes.isEmpty) {
        return const Center(
          child: Text(
            'Aucun type d\'examen configuré',
            style: TextStyle(color: Colors.grey),
          ),
        );
      }
      return RefreshIndicator(
        onRefresh: () => _cubit.loadExamTypes(
          classroomId: _selectedClassroomId,
          subjectId: _selectedSubjectId,
        ),
        child: ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: state.examTypes.length,
          itemBuilder: (context, index) {
            final et = state.examTypes[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  child: Text(
                    '${et.percentage}%',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
                title: Text(
                  et.name,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  '${et.nameAr ?? ''}\n'
                  'Coefficient: ${et.weight} — Trimestre ${et.trimester}',
                ),
                isThreeLine: true,
                trailing: IconButton(
                  icon: const Icon(Icons.bar_chart),
                  tooltip: 'Workflow',
                  onPressed: () => _showWorkflowStatus(et),
                ),
              ),
            );
          },
        ),
      );
    }
    if (state is ExamManagementError) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(state.message, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () => _cubit.loadExamTypes(),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }
    return const SizedBox.shrink();
  }

  // ── Tab 2: Bulk Grade Entry ────────────────────────────────────────────

  Widget _buildBulkEntryTab() {
    return _BulkGradeEntryWidget(
      classrooms: _classrooms,
      subjects: _subjects,
      cubit: _cubit,
    );
  }

  // ── Tab 3: CSV Import ─────────────────────────────────────────────────

  Widget _buildCsvImportTab(ExamManagementState state) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const Icon(Icons.upload_file, size: 48, color: Colors.blue),
                  const SizedBox(height: 8),
                  const Text(
                    'Importer un fichier CSV',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Format: student_id, score\nLe fichier sera validé avant import.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    onPressed: _pickCsvFile,
                    icon: const Icon(Icons.file_open),
                    label: const Text('Choisir un fichier CSV'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          if (state is CsvPreviewLoaded) ...[
            const Text(
              'Aperçu de l\'import',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text('${state.preview.matched.length} correspondances trouvées'),
            if (state.preview.unmatched.isNotEmpty)
              Text(
                '${state.preview.unmatched.length} non trouvés',
                style: const TextStyle(color: Colors.red),
              ),
            const SizedBox(height: 8),
            Expanded(
              child: ListView.builder(
                itemCount: state.preview.matched.length,
                itemBuilder: (_, i) {
                  final row = state.preview.matched[i];
                  return ListTile(
                    dense: true,
                    title: Text(row.studentName),
                    trailing: Text(
                      '${row.score}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  );
                },
              ),
            ),
            ElevatedButton(
              onPressed: () => _cubit.confirmCsv(state.preview.previewId),
              child: const Text('Confirmer l\'import'),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _pickCsvFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['csv'],
    );
    if (result != null && result.files.single.path != null) {
      _cubit.previewCsv(result.files.single.path!);
    }
  }

  // ── Dialogs ────────────────────────────────────────────────────────────

  void _showCreateExamTypeDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final nameArCtrl = TextEditingController();
    final weightCtrl = TextEditingController(text: '1');
    final percentCtrl = TextEditingController(text: '100');
    String? classroomId;
    String? subjectId;
    int trimester = 1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
        ),
        child: StatefulBuilder(
          builder: (context, setInnerState) => SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Nouveau type d\'examen',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nom (fr) *',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: nameArCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nom (ar)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: classroomId,
                  decoration: const InputDecoration(
                    labelText: 'Classe *',
                    border: OutlineInputBorder(),
                  ),
                  items: _classrooms
                      .map(
                        (c) =>
                            DropdownMenuItem(value: c.id, child: Text(c.name)),
                      )
                      .toList(),
                  onChanged: (v) => setInnerState(() => classroomId = v),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: subjectId,
                  decoration: const InputDecoration(
                    labelText: 'Matière *',
                    border: OutlineInputBorder(),
                  ),
                  items: _subjects
                      .map(
                        (s) =>
                            DropdownMenuItem(value: s.id, child: Text(s.name)),
                      )
                      .toList(),
                  onChanged: (v) => setInnerState(() => subjectId = v),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: weightCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Coefficient',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: percentCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Pourcentage %',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<int>(
                  initialValue: trimester,
                  decoration: const InputDecoration(
                    labelText: 'Trimestre',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 1, child: Text('Trimestre 1')),
                    DropdownMenuItem(value: 2, child: Text('Trimestre 2')),
                    DropdownMenuItem(value: 3, child: Text('Trimestre 3')),
                  ],
                  onChanged: (v) => setInnerState(() => trimester = v ?? 1),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () {
                    if (nameCtrl.text.isEmpty ||
                        classroomId == null ||
                        subjectId == null) {
                      return;
                    }
                    Navigator.pop(ctx);
                    _cubit.createExamType(
                      ExamConfig(
                        id: '',
                        name: nameCtrl.text,
                        nameAr: nameArCtrl.text.isEmpty
                            ? null
                            : nameArCtrl.text,
                        weight: double.tryParse(weightCtrl.text) ?? 1.0,
                        percentage: double.tryParse(percentCtrl.text) ?? 100.0,
                        classroomId: classroomId,
                        subjectId: subjectId,
                        trimester: trimester.toString(),
                      ),
                    );
                  },
                  child: const Text('Créer'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showWorkflowStatus(ExamConfig examType) {
    _cubit.loadWorkflowStatus(examType.id);
    showDialog(
      context: context,
      builder: (ctx) => BlocBuilder<ExamManagementCubit, ExamManagementState>(
        bloc: _cubit,
        builder: (context, state) {
          if (state is WorkflowStatusLoaded) {
            final s = state.status;
            return AlertDialog(
              title: Text('Workflow — ${examType.name}'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _workflowRow('Brouillon', s.draft, Colors.grey),
                  _workflowRow('Soumis', s.submitted, Colors.blue),
                  _workflowRow('Publié', s.published, Colors.green),
                  _workflowRow('Retourné', s.returned, Colors.orange),
                  const Divider(),
                  _workflowRow('Total', s.total, Colors.black, bold: true),
                  const SizedBox(height: 16),
                  if (s.draft > 0)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          _cubit.submitGrades(examType.id);
                        },
                        child: const Text('Soumettre les notes'),
                      ),
                    ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Fermer'),
                ),
              ],
            );
          }
          return const AlertDialog(
            content: SizedBox(
              height: 100,
              child: Center(child: CircularProgressIndicator()),
            ),
          );
        },
      ),
    );
  }

  Widget _workflowRow(
    String label,
    int count,
    Color color, {
    bool bold = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(label)),
          Text(
            '$count',
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Bulk Grade Entry Widget ──────────────────────────────────────────────────

class _BulkGradeEntryWidget extends StatefulWidget {
  final List<Classroom> classrooms;
  final List<Subject> subjects;
  final ExamManagementCubit cubit;

  const _BulkGradeEntryWidget({
    required this.classrooms,
    required this.subjects,
    required this.cubit,
  });

  @override
  State<_BulkGradeEntryWidget> createState() => _BulkGradeEntryWidgetState();
}

class _BulkGradeEntryWidgetState extends State<_BulkGradeEntryWidget> {
  String? _classroomId;
  List<AttendanceRecord> _students = [];
  List<ExamConfig> _examTypes = [];
  String? _selectedExamTypeId;
  final Map<String, TextEditingController> _gradeControllers = {};
  final Set<String> _absentStudents = {};
  bool _loading = false;

  Future<void> _loadStudents() async {
    if (_classroomId == null) return;
    setState(() => _loading = true);
    try {
      final records = await getIt<AttendanceRepository>().getRecords(
        classroomId: _classroomId,
      );
      // De-duplicate by studentId
      final seen = <String>{};
      final unique = <AttendanceRecord>[];
      for (final r in records) {
        if (seen.add(r.studentId)) {
          unique.add(r);
        }
      }
      final examTypes = await getIt<ExamManagementRepository>().getExamTypes(
        classroomId: _classroomId,
      );
      setState(() {
        _students = unique;
        _examTypes = examTypes;
        _gradeControllers.clear();
        _absentStudents.clear();
        for (final s in _students) {
          _gradeControllers[s.studentId] = TextEditingController();
        }
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButtonFormField<String>(
            initialValue: _classroomId,
            decoration: const InputDecoration(
              labelText: 'Classe',
              border: OutlineInputBorder(),
            ),
            items: widget.classrooms
                .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                .toList(),
            onChanged: (v) {
              setState(() => _classroomId = v);
              _loadStudents();
            },
          ),
          const SizedBox(height: 8),
          if (_examTypes.isNotEmpty)
            DropdownButtonFormField<String>(
              initialValue: _selectedExamTypeId,
              decoration: const InputDecoration(
                labelText: 'Type d\'examen',
                border: OutlineInputBorder(),
              ),
              items: _examTypes
                  .map(
                    (e) => DropdownMenuItem(value: e.id, child: Text(e.name)),
                  )
                  .toList(),
              onChanged: (v) => setState(() => _selectedExamTypeId = v),
            ),
          const SizedBox(height: 12),
          if (_loading)
            const Center(child: CircularProgressIndicator())
          else if (_students.isNotEmpty)
            Expanded(
              child: ListView.builder(
                itemCount: _students.length,
                itemBuilder: (context, index) {
                  final student = _students[index];
                  final id = student.studentId;
                  final name = student.studentName ?? 'Élève';
                  final isAbsent = _absentStudents.contains(id);
                  return Card(
                    margin: const EdgeInsets.only(bottom: 4),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: Text(
                              name,
                              style: TextStyle(
                                decoration: isAbsent
                                    ? TextDecoration.lineThrough
                                    : null,
                              ),
                            ),
                          ),
                          Expanded(
                            flex: 2,
                            child: TextField(
                              controller: _gradeControllers[id],
                              keyboardType: TextInputType.number,
                              enabled: !isAbsent,
                              decoration: const InputDecoration(
                                hintText: '/ 20',
                                isDense: true,
                                border: OutlineInputBorder(),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            icon: Icon(
                              isAbsent
                                  ? Icons.person_off
                                  : Icons.person_outline,
                              color: isAbsent ? Colors.red : null,
                            ),
                            tooltip: 'Absent',
                            onPressed: () {
                              setState(() {
                                if (isAbsent) {
                                  _absentStudents.remove(id);
                                } else {
                                  _absentStudents.add(id);
                                }
                              });
                            },
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          if (_students.isNotEmpty && _selectedExamTypeId != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: ElevatedButton.icon(
                onPressed: _saveGrades,
                icon: const Icon(Icons.save),
                label: const Text('Enregistrer les notes'),
              ),
            ),
        ],
      ),
    );
  }

  void _saveGrades() {
    final grades = <Map<String, dynamic>>[];
    for (final student in _students) {
      final id = student.studentId;
      final isAbsent = _absentStudents.contains(id);
      final scoreText = _gradeControllers[id]?.text ?? '';
      final score = double.tryParse(scoreText);

      if (isAbsent || score != null) {
        grades.add({
          'student_id': id,
          'score': isAbsent ? 0 : score,
          'is_absent': isAbsent,
        });
      }
    }
    if (grades.isEmpty) return;
    widget.cubit.bulkEnterGrades(
      examTypeId: _selectedExamTypeId!,
      grades: grades,
    );
  }
}
