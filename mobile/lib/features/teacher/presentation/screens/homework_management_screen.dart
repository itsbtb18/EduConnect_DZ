import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/constants/api_endpoints.dart';
import '../../../../core/network/dio_client.dart';
import '../../../student/data/models/academic_model.dart';
import '../../../student/data/models/homework_model.dart';
import '../../../student/data/repositories/academic_repository.dart';
import '../../../student/data/repositories/homework_repository.dart';

/// Teacher screen for managing homework assignments.
class HomeworkManagementScreen extends StatefulWidget {
  const HomeworkManagementScreen({super.key});

  @override
  State<HomeworkManagementScreen> createState() =>
      _HomeworkManagementScreenState();
}

class _HomeworkManagementScreenState extends State<HomeworkManagementScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  List<Classroom> _classrooms = [];
  List<Subject> _subjects = [];
  List<HomeworkTask> _homeworks = [];
  List<HomeworkSubmission> _submissions = [];
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        getIt<HomeworkRepository>().getTasks(),
        getIt<HomeworkRepository>().getSubmissions(),
        getIt<AcademicRepository>().getClassrooms(),
        getIt<AcademicRepository>().getSubjects(),
        _loadStats(),
      ]);
      setState(() {
        _homeworks = results[0] as List<HomeworkTask>;
        _submissions = results[1] as List<HomeworkSubmission>;
        _classrooms = results[2] as List<Classroom>;
        _subjects = results[3] as List<Subject>;
        _stats = results[4] as Map<String, dynamic>?;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Devoirs & Exercices'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Mes devoirs'),
            Tab(text: 'Soumissions'),
            Tab(text: 'Stats'),
            Tab(text: 'Calendrier'),
          ],
        ),
      ),
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
                    onPressed: _loadData,
                    child: const Text('Réessayer'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadData,
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildHomeworkListTab(),
                  _buildSubmissionsTab(),
                  _buildStatsTab(),
                  _buildCalendarTab(),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateHomeworkDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Nouveau devoir'),
      ),
    );
  }

  Widget _buildHomeworkListTab() {
    if (_homeworks.isEmpty) {
      return const Center(
        child: Text('Aucun devoir', style: TextStyle(color: Colors.grey)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _homeworks.length,
      itemBuilder: (context, index) {
        final hw = _homeworks[index];
        final progress = hw.totalStudents > 0
            ? hw.submissionCount / hw.totalStudents
            : 0.0;
        return Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.assignment)),
            title: Text(hw.title),
            subtitle: Text(
              '${hw.subjectName ?? ''} — ${hw.classroomName ?? ''}\n'
              'Date limite: ${hw.dueDate.day}/${hw.dueDate.month}/${hw.dueDate.year}\n'
              'Soumissions: ${hw.submissionCount}/${hw.totalStudents}',
            ),
            isThreeLine: true,
            trailing: SizedBox(
              width: 36,
              height: 36,
              child: CircularProgressIndicator(value: progress, strokeWidth: 3),
            ),
          ),
        );
      },
    );
  }

  Widget _buildSubmissionsTab() {
    if (_submissions.isEmpty) {
      return const Center(
        child: Text('Aucune soumission', style: TextStyle(color: Colors.grey)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _submissions.length,
      itemBuilder: (context, index) {
        final sub = _submissions[index];
        final isGraded = sub.isGraded;
        return Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: isGraded
                  ? Colors.green.shade50
                  : Colors.orange.shade50,
              child: Icon(
                isGraded ? Icons.check_circle : Icons.pending,
                color: isGraded ? Colors.green : Colors.orange,
              ),
            ),
            title: Text(sub.studentName ?? 'Élève'),
            subtitle: Text(
              'Soumis le: ${sub.submittedAt != null ? '${sub.submittedAt!.day}/${sub.submittedAt!.month}/${sub.submittedAt!.year}' : '—'}\n'
              'Statut: ${isGraded
                  ? "Noté (${sub.grade?.toStringAsFixed(1)})"
                  : sub.isLate
                  ? "En retard"
                  : "En attente"}',
            ),
            isThreeLine: true,
            trailing: !isGraded
                ? IconButton(
                    icon: const Icon(
                      Icons.check_circle_outline,
                      color: Colors.green,
                    ),
                    tooltip: 'Marquer corrigé',
                    onPressed: () => _markCorrected(sub),
                  )
                : null,
          ),
        );
      },
    );
  }

  void _showCreateHomeworkDialog(BuildContext context) {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    DateTime? deadline;
    String? selectedClassroomId;
    String? selectedSubjectId;

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
          builder: (context, setInnerState) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Nouveau devoir',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: selectedClassroomId,
                decoration: const InputDecoration(
                  labelText: 'Classe',
                  border: OutlineInputBorder(),
                ),
                items: _classrooms
                    .map(
                      (c) => DropdownMenuItem(value: c.id, child: Text(c.name)),
                    )
                    .toList(),
                onChanged: (v) => setInnerState(() => selectedClassroomId = v),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: selectedSubjectId,
                decoration: const InputDecoration(
                  labelText: 'Matière',
                  border: OutlineInputBorder(),
                ),
                items: _subjects
                    .map(
                      (s) => DropdownMenuItem(value: s.id, child: Text(s.name)),
                    )
                    .toList(),
                onChanged: (v) => setInnerState(() => selectedSubjectId = v),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'Titre',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: descriptionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Description / Consignes',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now().add(const Duration(days: 7)),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 90)),
                  );
                  if (picked != null) {
                    setInnerState(() => deadline = picked);
                  }
                },
                icon: const Icon(Icons.calendar_today),
                label: Text(
                  deadline != null
                      ? 'Date limite: ${deadline!.day}/${deadline!.month}/${deadline!.year}'
                      : 'Choisir la date limite',
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () async {
                  if (titleController.text.isEmpty ||
                      selectedClassroomId == null ||
                      selectedSubjectId == null ||
                      deadline == null) {
                    return;
                  }
                  Navigator.pop(ctx);
                  try {
                    await getIt<HomeworkRepository>().createTask(
                      title: titleController.text,
                      description: descriptionController.text.isEmpty
                          ? null
                          : descriptionController.text,
                      subjectId: selectedSubjectId!,
                      classroomId: selectedClassroomId!,
                      dueDate: deadline!,
                    );
                    if (mounted) {
                      ScaffoldMessenger.of(this.context).showSnackBar(
                        const SnackBar(
                          content: Text('Devoir créé avec succès'),
                        ),
                      );
                      _loadData();
                    }
                  } catch (e) {
                    if (mounted) {
                      ScaffoldMessenger.of(
                        this.context,
                      ).showSnackBar(SnackBar(content: Text('Erreur: $e')));
                    }
                  }
                },
                child: const Text('Créer le devoir'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Stats Tab ───────────────────────────────────────────────────────────

  Future<Map<String, dynamic>?> _loadStats() async {
    try {
      final response = await getIt<DioClient>().dio.get(
        ApiEndpoints.homeworkStats,
      );
      return response.data as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Widget _buildStatsTab() {
    if (_stats == null) {
      return const Center(
        child: Text(
          'Statistiques indisponibles',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _statCard(
          'Total devoirs',
          '${_stats!['total_tasks'] ?? 0}',
          Icons.assignment,
        ),
        _statCard(
          'Soumissions reçues',
          '${_stats!['total_submissions'] ?? 0}',
          Icons.upload_file,
        ),
        _statCard(
          'Taux de soumission',
          '${_stats!['submission_rate'] ?? 0}%',
          Icons.percent,
        ),
        _statCard(
          'En retard',
          '${_stats!['late_submissions'] ?? 0}',
          Icons.schedule,
          color: Colors.orange,
        ),
        _statCard(
          'Corrigés',
          '${_stats!['corrected'] ?? 0}',
          Icons.check_circle,
          color: Colors.green,
        ),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, {Color? color}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: (color ?? Theme.of(context).colorScheme.primary)
              .withValues(alpha: 0.15),
          child: Icon(
            icon,
            color: color ?? Theme.of(context).colorScheme.primary,
          ),
        ),
        title: Text(label),
        trailing: Text(
          value,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  // ── Calendar Tab ────────────────────────────────────────────────────────

  Widget _buildCalendarTab() {
    // Group homeworks by date
    final grouped = <String, List<HomeworkTask>>{};
    for (final hw in _homeworks) {
      final key =
          '${hw.dueDate.year}-${hw.dueDate.month.toString().padLeft(2, '0')}-${hw.dueDate.day.toString().padLeft(2, '0')}';
      grouped.putIfAbsent(key, () => []).add(hw);
    }
    final sortedKeys = grouped.keys.toList()..sort();

    if (sortedKeys.isEmpty) {
      return const Center(
        child: Text(
          'Aucun devoir planifié',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: sortedKeys.length,
      itemBuilder: (context, index) {
        final date = sortedKeys[index];
        final tasks = grouped[date]!;
        final overloaded = tasks.length >= 3;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: overloaded ? Colors.red.shade50 : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Text(
                    date,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: overloaded ? Colors.red : null,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('${tasks.length} devoir(s)'),
                  if (overloaded) ...[
                    const SizedBox(width: 8),
                    Icon(Icons.warning, color: Colors.red, size: 16),
                    const Text(
                      ' Surcharge',
                      style: TextStyle(color: Colors.red, fontSize: 12),
                    ),
                  ],
                ],
              ),
            ),
            ...tasks.map(
              (hw) => Card(
                margin: const EdgeInsets.only(left: 16, top: 4, bottom: 4),
                child: ListTile(
                  dense: true,
                  title: Text(hw.title),
                  subtitle: Text(
                    '${hw.subjectName ?? ''} — ${hw.classroomName ?? ''}',
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        );
      },
    );
  }

  // ── Mark as corrected ──────────────────────────────────────────────────

  Future<void> _markCorrected(HomeworkSubmission sub) async {
    try {
      await getIt<DioClient>().dio.post(ApiEndpoints.homeworkCorrected(sub.id));
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Marqué comme corrigé')));
        _loadData();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erreur: $e')));
      }
    }
  }
}
