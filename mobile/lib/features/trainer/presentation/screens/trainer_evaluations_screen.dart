import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/formation_models.dart';
import '../../data/repositories/trainer_repository.dart';

class TrainerEvaluationsScreen extends StatefulWidget {
  const TrainerEvaluationsScreen({super.key});

  @override
  State<TrainerEvaluationsScreen> createState() =>
      _TrainerEvaluationsScreenState();
}

class _TrainerEvaluationsScreenState extends State<TrainerEvaluationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;

  List<TrainingGroup> _groups = [];
  List<PlacementTest> _tests = [];
  List<LevelPassage> _passages = [];
  TrainingGroup? _selectedGroup;

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
      final results = await Future.wait([
        repo.getMyGroups(),
        repo.getPlacementTests(groupId: _selectedGroup?.id),
        repo.getLevelPassages(),
      ]);
      _groups = results[0] as List<TrainingGroup>;
      _tests = results[1] as List<PlacementTest>;
      _passages = results[2] as List<LevelPassage>;
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _showCreateTestDialog() async {
    if (_groups.isEmpty) return;
    final formKey = GlobalKey<FormState>();
    String? groupId = _groups.first.id;
    String enrollmentId = '';
    String type = 'WRITTEN';
    double score = 0;
    double maxScore = 100;
    String? level;
    String? notes;

    // Load enrollments for selected group
    List<TrainingEnrollment> enrollments = [];
    try {
      enrollments = await getIt<TrainerRepository>().getGroupEnrollments(
        groupId: groupId,
      );
    } catch (_) {}

    if (!mounted) return;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Nouveau test de placement'),
          content: Form(
            key: formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    initialValue: groupId,
                    decoration: const InputDecoration(labelText: 'Groupe'),
                    items: _groups
                        .map(
                          (g) => DropdownMenuItem(
                            value: g.id,
                            child: Text(g.name),
                          ),
                        )
                        .toList(),
                    onChanged: (v) async {
                      setDialogState(() => groupId = v);
                      if (v != null) {
                        try {
                          enrollments = await getIt<TrainerRepository>()
                              .getGroupEnrollments(groupId: v);
                          setDialogState(() {});
                        } catch (_) {}
                      }
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: enrollments.isNotEmpty
                        ? enrollments.first.id
                        : null,
                    decoration: const InputDecoration(labelText: 'Apprenant'),
                    items: enrollments
                        .map(
                          (e) => DropdownMenuItem(
                            value: e.id,
                            child: Text(e.learnerName ?? 'Apprenant'),
                          ),
                        )
                        .toList(),
                    onChanged: (v) => enrollmentId = v ?? '',
                    validator: (v) => v == null ? 'Requis' : null,
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: type,
                    decoration: const InputDecoration(
                      labelText: 'Type d\'évaluation',
                    ),
                    items: const [
                      DropdownMenuItem(value: 'WRITTEN', child: Text('Écrit')),
                      DropdownMenuItem(value: 'ORAL', child: Text('Oral')),
                      DropdownMenuItem(
                        value: 'PRACTICAL',
                        child: Text('Pratique'),
                      ),
                    ],
                    onChanged: (v) => type = v ?? 'WRITTEN',
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          decoration: const InputDecoration(labelText: 'Note'),
                          keyboardType: TextInputType.number,
                          initialValue: '0',
                          onChanged: (v) => score = double.tryParse(v) ?? 0,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text('/'),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextFormField(
                          decoration: const InputDecoration(labelText: 'Max'),
                          keyboardType: TextInputType.number,
                          initialValue: '100',
                          onChanged: (v) =>
                              maxScore = double.tryParse(v) ?? 100,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    decoration: const InputDecoration(
                      labelText: 'Niveau recommandé',
                    ),
                    onChanged: (v) => level = v,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    decoration: const InputDecoration(labelText: 'Notes'),
                    maxLines: 2,
                    onChanged: (v) => notes = v,
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (formKey.currentState?.validate() != true) return;
                try {
                  await getIt<TrainerRepository>().createPlacementTest(
                    data: {
                      'enrollment': enrollmentId,
                      'evaluation_type': type,
                      'score': score,
                      'max_score': maxScore,
                      'recommended_level': level,
                      'notes': notes,
                    },
                  );
                  if (ctx.mounted) Navigator.pop(ctx);
                  _loadData();
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(
                        content: Text('Erreur: $e'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                }
              },
              child: const Text('Créer'),
            ),
          ],
        ),
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
            Tab(text: 'Tests de placement'),
            Tab(text: 'Passages de niveau'),
          ],
        ),
        // Group filter
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              const Text('Groupe: ', style: TextStyle(fontSize: 13)),
              Expanded(
                child: DropdownButton<String?>(
                  value: _selectedGroup?.id,
                  isExpanded: true,
                  hint: const Text('Tous'),
                  items: [
                    const DropdownMenuItem<String?>(
                      value: null,
                      child: Text('Tous les groupes'),
                    ),
                    ..._groups.map(
                      (g) => DropdownMenuItem(value: g.id, child: Text(g.name)),
                    ),
                  ],
                  onChanged: (v) {
                    _selectedGroup = v == null
                        ? null
                        : _groups.firstWhere((g) => g.id == v);
                    _loadData();
                  },
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_circle, color: AppColors.primary),
                onPressed: _showCreateTestDialog,
                tooltip: 'Nouveau test',
              ),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [_buildTestsTab(), _buildPassagesTab()],
          ),
        ),
      ],
    );
  }

  Widget _buildTestsTab() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_tests.isEmpty) {
      return const Center(
        child: Text(
          'Aucun test de placement',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tests.length,
        itemBuilder: (_, i) {
          final t = _tests[i];
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: t.validated
                    ? AppColors.success
                    : AppColors.warning,
                child: Text(
                  '${t.percentage.toInt()}%',
                  style: const TextStyle(fontSize: 11, color: Colors.white),
                ),
              ),
              title: Text(t.learnerName ?? 'Apprenant'),
              subtitle: Text(
                '${t.evaluationType} • ${t.score}/${t.maxScore} • ${t.recommendedLevel ?? "—"}',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: t.validated
                  ? const Icon(Icons.verified, color: AppColors.success)
                  : TextButton(
                      onPressed: () async {
                        try {
                          await getIt<TrainerRepository>()
                              .validatePlacementTest(id: t.id);
                          _loadData();
                        } catch (e) {
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Erreur: $e'),
                                backgroundColor: AppColors.error,
                              ),
                            );
                          }
                        }
                      },
                      child: const Text('Valider'),
                    ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPassagesTab() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Text(_error!));
    if (_passages.isEmpty) {
      return const Center(
        child: Text(
          'Aucun passage de niveau',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _passages.length,
        itemBuilder: (_, i) {
          final p = _passages[i];
          final color = p.isPromoted
              ? AppColors.success
              : p.isPending
              ? AppColors.warning
              : AppColors.error;
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: color,
                child: Icon(
                  p.isPromoted
                      ? Icons.arrow_upward
                      : p.isPending
                      ? Icons.hourglass_empty
                      : Icons.close,
                  color: Colors.white,
                  size: 18,
                ),
              ),
              title: Text(p.learnerName ?? 'Apprenant'),
              subtitle: Text(
                '${p.fromLevel} → ${p.toLevel} • Présence: ${p.attendanceRate.toStringAsFixed(0)}%',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  p.isPromoted
                      ? 'Promu'
                      : p.isPending
                      ? 'En attente'
                      : 'Refusé',
                  style: TextStyle(
                    fontSize: 11,
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
