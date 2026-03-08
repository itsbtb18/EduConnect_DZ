import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../../student/data/models/academic_model.dart' hide Lesson;
import '../../../student/data/repositories/academic_repository.dart';
import '../../data/models/textbook_model.dart';
import '../bloc/textbook_cubit.dart';

/// Cahier de texte électronique — teacher can CRUD lessons.
class TextbookScreen extends StatefulWidget {
  const TextbookScreen({super.key});

  @override
  State<TextbookScreen> createState() => _TextbookScreenState();
}

class _TextbookScreenState extends State<TextbookScreen> {
  final TextbookCubit _cubit = TextbookCubit();
  List<Classroom> _classrooms = [];
  List<Subject> _subjects = [];
  String? _selectedClassroomId;
  String? _selectedSubjectId;
  bool _filtersLoading = true;

  @override
  void initState() {
    super.initState();
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
      _cubit.loadLessons();
    } catch (_) {
      setState(() => _filtersLoading = false);
    }
  }

  @override
  void dispose() {
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _cubit,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Cahier de Texte'),
          actions: [
            IconButton(
              icon: const Icon(Icons.filter_list),
              onPressed: _showFilterSheet,
            ),
          ],
        ),
        body: _filtersLoading
            ? const Center(child: CircularProgressIndicator())
            : BlocConsumer<TextbookCubit, TextbookState>(
                listener: (context, state) {
                  if (state is TextbookSaved) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Enregistré avec succès')),
                    );
                    _cubit.loadLessons(
                      classroomId: _selectedClassroomId,
                      subjectId: _selectedSubjectId,
                    );
                  }
                  if (state is TextbookError) {
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text(state.message)));
                  }
                },
                builder: (context, state) {
                  if (state is TextbookLoading || state is TextbookSaving) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (state is TextbookLoaded) {
                    return _buildLessonList(state.lessons);
                  }
                  if (state is TextbookError) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            state.message,
                            style: const TextStyle(color: Colors.red),
                          ),
                          const SizedBox(height: 8),
                          ElevatedButton(
                            onPressed: () => _cubit.loadLessons(),
                            child: const Text('Réessayer'),
                          ),
                        ],
                      ),
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _showLessonForm(context),
          icon: const Icon(Icons.add),
          label: const Text('Nouvelle séance'),
        ),
      ),
    );
  }

  Widget _buildLessonList(List<Lesson> lessons) {
    if (lessons.isEmpty) {
      return const Center(
        child: Text(
          'Aucune séance enregistrée',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _cubit.loadLessons(
        classroomId: _selectedClassroomId,
        subjectId: _selectedSubjectId,
      ),
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: lessons.length,
        itemBuilder: (context, index) {
          final lesson = lessons[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ExpansionTile(
              leading: CircleAvatar(
                backgroundColor: Theme.of(context).colorScheme.primaryContainer,
                child: const Icon(Icons.menu_book),
              ),
              title: Text(
                lesson.title,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                '${lesson.subjectName ?? ''} — ${lesson.classroomName ?? ''}\n'
                '${lesson.date.day}/${lesson.date.month}/${lesson.date.year}'
                '${lesson.duration != null ? ' • ${lesson.duration} min' : ''}',
              ),
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (lesson.content != null &&
                          lesson.content!.isNotEmpty) ...[
                        const Text(
                          'Contenu :',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(lesson.content!),
                        const SizedBox(height: 12),
                      ],
                      if (lesson.objectives != null &&
                          lesson.objectives!.isNotEmpty) ...[
                        const Text(
                          'Objectifs :',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(lesson.objectives!),
                        const SizedBox(height: 12),
                      ],
                      if (lesson.homework != null &&
                          lesson.homework!.isNotEmpty) ...[
                        const Text(
                          'Devoir associé :',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(lesson.homework!),
                      ],
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          TextButton.icon(
                            onPressed: () =>
                                _showLessonForm(context, lesson: lesson),
                            icon: const Icon(Icons.edit, size: 18),
                            label: const Text('Modifier'),
                          ),
                          TextButton.icon(
                            onPressed: () => _confirmDelete(lesson),
                            icon: const Icon(
                              Icons.delete,
                              size: 18,
                              color: Colors.red,
                            ),
                            label: const Text(
                              'Supprimer',
                              style: TextStyle(color: Colors.red),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setInnerState) => Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Filtrer les séances',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: _selectedClassroomId,
                decoration: const InputDecoration(
                  labelText: 'Classe',
                  border: OutlineInputBorder(),
                ),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Toutes')),
                  ..._classrooms.map(
                    (c) => DropdownMenuItem(value: c.id, child: Text(c.name)),
                  ),
                ],
                onChanged: (v) => setInnerState(() => _selectedClassroomId = v),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _selectedSubjectId,
                decoration: const InputDecoration(
                  labelText: 'Matière',
                  border: OutlineInputBorder(),
                ),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Toutes')),
                  ..._subjects.map(
                    (s) => DropdownMenuItem(value: s.id, child: Text(s.name)),
                  ),
                ],
                onChanged: (v) => setInnerState(() => _selectedSubjectId = v),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  setState(() {});
                  _cubit.loadLessons(
                    classroomId: _selectedClassroomId,
                    subjectId: _selectedSubjectId,
                  );
                },
                child: const Text('Appliquer'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showLessonForm(BuildContext context, {Lesson? lesson}) {
    final titleCtrl = TextEditingController(text: lesson?.title ?? '');
    final contentCtrl = TextEditingController(text: lesson?.content ?? '');
    final objectivesCtrl = TextEditingController(
      text: lesson?.objectives ?? '',
    );
    final homeworkCtrl = TextEditingController(text: lesson?.homework ?? '');
    final durationCtrl = TextEditingController(
      text: lesson?.duration?.toString() ?? '',
    );
    DateTime selectedDate = lesson?.date ?? DateTime.now();
    String? classroomId = lesson?.classroomId;
    String? subjectId = lesson?.subjectId;

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
                Text(
                  lesson == null ? 'Nouvelle séance' : 'Modifier la séance',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
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
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Titre de la séance *',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: contentCtrl,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Contenu / Résumé',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: objectivesCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Objectifs',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: homeworkCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Devoir associé',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: durationCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Durée (minutes)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: selectedDate,
                      firstDate: DateTime(2024),
                      lastDate: DateTime(2030),
                    );
                    if (picked != null) {
                      setInnerState(() => selectedDate = picked);
                    }
                  },
                  icon: const Icon(Icons.calendar_today),
                  label: Text(
                    'Date: ${selectedDate.day}/${selectedDate.month}/${selectedDate.year}',
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () {
                    if (titleCtrl.text.isEmpty ||
                        classroomId == null ||
                        subjectId == null) {
                      return;
                    }
                    Navigator.pop(ctx);
                    final data = {
                      'title': titleCtrl.text,
                      'content': contentCtrl.text,
                      'objectives': objectivesCtrl.text,
                      'homework': homeworkCtrl.text,
                      'classroom': classroomId,
                      'subject': subjectId,
                      'date':
                          '${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}',
                      if (durationCtrl.text.isNotEmpty)
                        'duration': int.tryParse(durationCtrl.text),
                    };
                    if (lesson != null) {
                      _cubit.updateLesson(lesson.id, data);
                    } else {
                      _cubit.createLesson(data);
                    }
                  },
                  child: Text(lesson == null ? 'Créer' : 'Enregistrer'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmDelete(Lesson lesson) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la séance'),
        content: Text('Voulez-vous supprimer « ${lesson.title} » ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _cubit.deleteLesson(lesson.id);
            },
            child: const Text('Supprimer', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
