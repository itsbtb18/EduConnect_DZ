import 'package:flutter/material.dart';

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

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [_HomeworkListTab(), _SubmissionsTab()],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateHomeworkDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Nouveau devoir'),
      ),
    );
  }

  void _showCreateHomeworkDialog(BuildContext context) {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    DateTime? deadline;

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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Nouveau devoir',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
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
            StatefulBuilder(
              builder: (context, setInnerState) => OutlinedButton.icon(
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
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Devoir créé avec succès')),
                );
              },
              child: const Text('Créer le devoir'),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeworkListTab extends StatelessWidget {
  // Placeholder data
  final _homeworks = const [
    {
      'title': 'Exercice d\'algèbre — Chapitre 3',
      'subject': 'Mathématiques',
      'classroom': '1AM - A',
      'deadline': '2025-02-15',
      'submissions': 28,
      'total': 35,
    },
    {
      'title': 'Rédaction: Mon village natal',
      'subject': 'Langue Française',
      'classroom': '2AM - B',
      'deadline': '2025-02-18',
      'submissions': 15,
      'total': 32,
    },
    {
      'title': 'TP Physique — Les forces',
      'subject': 'Physique',
      'classroom': '1AM - A',
      'deadline': '2025-02-20',
      'submissions': 5,
      'total': 35,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _homeworks.length,
      itemBuilder: (context, index) {
        final hw = _homeworks[index];
        final submitted = hw['submissions'] as int;
        final total = hw['total'] as int;
        return Card(
          child: ListTile(
            leading: const CircleAvatar(child: Icon(Icons.assignment)),
            title: Text(hw['title'] as String),
            subtitle: Text(
              '${hw['subject']} — ${hw['classroom']}\n'
              'Date limite: ${hw['deadline']}\n'
              'Soumissions: $submitted/$total',
            ),
            isThreeLine: true,
            trailing: CircularProgressIndicator(
              value: total > 0 ? submitted / total : 0,
              strokeWidth: 3,
            ),
          ),
        );
      },
    );
  }
}

class _SubmissionsTab extends StatelessWidget {
  final _submissions = const [
    {
      'student': 'Ahmed Benali',
      'homework': 'Exercice d\'algèbre',
      'submittedAt': '2025-02-12',
      'status': 'submitted',
    },
    {
      'student': 'Fatima Rahmani',
      'homework': 'Exercice d\'algèbre',
      'submittedAt': '2025-02-13',
      'status': 'graded',
    },
    {
      'student': 'Sara Boudiaf',
      'homework': 'Rédaction',
      'submittedAt': '2025-02-14',
      'status': 'submitted',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _submissions.length,
      itemBuilder: (context, index) {
        final sub = _submissions[index];
        final isGraded = sub['status'] == 'graded';
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
            title: Text(sub['student'] as String),
            subtitle: Text(
              '${sub['homework']} — ${sub['submittedAt']}\n'
              'Statut: ${isGraded ? "Noté" : "En attente"}',
            ),
            isThreeLine: true,
            trailing: isGraded
                ? null
                : TextButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Notation à venir')),
                      );
                    },
                    child: const Text('Noter'),
                  ),
          ),
        );
      },
    );
  }
}
