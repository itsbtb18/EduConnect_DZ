import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/formation_models.dart';
import '../../data/repositories/trainer_repository.dart';

class TrainerHomeworkScreen extends StatefulWidget {
  const TrainerHomeworkScreen({super.key});

  @override
  State<TrainerHomeworkScreen> createState() => _TrainerHomeworkScreenState();
}

class _TrainerHomeworkScreenState extends State<TrainerHomeworkScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;

  List<TrainingGroup> _groups = [];
  List<Map<String, dynamic>> _homework = [];
  List<Map<String, dynamic>> _resources = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final repo = getIt<TrainerRepository>();
      final hwData = await repo.getHomework();
      final resData = await repo.getResources();
      _groups = await repo.getMyGroups();
      _homework =
          (hwData['results'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ??
          [];
      _resources =
          (resData['results'] as List<dynamic>?)
              ?.cast<Map<String, dynamic>>() ??
          [];
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _showCreateHomeworkDialog() async {
    if (_groups.isEmpty) return;
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String? groupId = _groups.first.id;
    DateTime? dueDate;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Nouveau devoir'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: groupId,
                  decoration: const InputDecoration(labelText: 'Groupe'),
                  items: _groups
                      .map(
                        (g) =>
                            DropdownMenuItem(value: g.id, child: Text(g.name)),
                      )
                      .toList(),
                  onChanged: (v) => groupId = v,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(labelText: 'Titre'),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  decoration: const InputDecoration(labelText: 'Description'),
                  maxLines: 3,
                ),
                const SizedBox(height: 12),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    dueDate != null
                        ? 'Échéance: ${dueDate!.day}/${dueDate!.month}/${dueDate!.year}'
                        : 'Sélectionner une échéance',
                  ),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: () async {
                    final d = await showDatePicker(
                      context: ctx,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (d != null) setDialogState(() => dueDate = d);
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (titleCtrl.text.isEmpty) return;
                try {
                  await getIt<TrainerRepository>().createHomework(
                    data: {
                      'title': titleCtrl.text,
                      'description': descCtrl.text,
                      'group': groupId,
                      'due_date': dueDate?.toIso8601String().split('T').first,
                    },
                  );
                  if (ctx.mounted) Navigator.pop(ctx);
                  _loadData();
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(
                      ctx,
                    ).showSnackBar(SnackBar(content: Text('Erreur: $e')));
                  }
                }
              },
              child: const Text('Publier'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showCreateResourceDialog() async {
    final titleCtrl = TextEditingController();
    final urlCtrl = TextEditingController();
    String type = 'DOCUMENT';

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Nouvelle ressource'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(labelText: 'Titre'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: type,
                decoration: const InputDecoration(labelText: 'Type'),
                items: const [
                  DropdownMenuItem(value: 'DOCUMENT', child: Text('Document')),
                  DropdownMenuItem(value: 'VIDEO', child: Text('Vidéo')),
                  DropdownMenuItem(value: 'LINK', child: Text('Lien web')),
                ],
                onChanged: (v) => type = v ?? 'DOCUMENT',
              ),
              const SizedBox(height: 12),
              TextField(
                controller: urlCtrl,
                decoration: const InputDecoration(labelText: 'Lien / URL'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (titleCtrl.text.isEmpty) return;
              try {
                await getIt<TrainerRepository>().createResource(
                  data: {
                    'title': titleCtrl.text,
                    'resource_type': type,
                    'url': urlCtrl.text,
                  },
                );
                if (ctx.mounted) Navigator.pop(ctx);
                _loadData();
              } catch (e) {
                if (ctx.mounted) {
                  ScaffoldMessenger.of(
                    ctx,
                  ).showSnackBar(SnackBar(content: Text('Erreur: $e')));
                }
              }
            },
            child: const Text('Publier'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Devoirs'),
            Tab(text: 'Ressources'),
          ],
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton.icon(
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Devoir'),
                onPressed: _showCreateHomeworkDialog,
              ),
              const SizedBox(width: 8),
              OutlinedButton.icon(
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Ressource'),
                onPressed: _showCreateResourceDialog,
              ),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [_buildHomeworkTab(), _buildResourcesTab()],
          ),
        ),
      ],
    );
  }

  Widget _buildHomeworkTab() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_homework.isEmpty) {
      return const Center(
        child: Text(
          'Aucun devoir publié',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _homework.length,
        itemBuilder: (_, i) {
          final hw = _homework[i];
          return Card(
            child: ListTile(
              leading: const Icon(Icons.assignment, color: AppColors.primary),
              title: Text(hw['title'] as String? ?? 'Devoir'),
              subtitle: Text(
                'Échéance: ${hw['due_date'] ?? '—'} • ${hw['group_name'] ?? ''}',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: Text(
                '${hw['submissions_count'] ?? 0} soumis',
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildResourcesTab() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_resources.isEmpty) {
      return const Center(
        child: Text(
          'Aucune ressource',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _resources.length,
        itemBuilder: (_, i) {
          final r = _resources[i];
          final type = r['resource_type'] as String? ?? 'DOCUMENT';
          final icon = type == 'VIDEO'
              ? Icons.play_circle
              : type == 'LINK'
              ? Icons.link
              : Icons.description;
          return Card(
            child: ListTile(
              leading: Icon(icon, color: AppColors.secondary),
              title: Text(r['title'] as String? ?? 'Ressource'),
              subtitle: Text(type, style: const TextStyle(fontSize: 12)),
            ),
          );
        },
      ),
    );
  }
}
