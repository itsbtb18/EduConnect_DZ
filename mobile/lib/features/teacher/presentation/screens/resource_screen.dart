import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../../student/data/models/academic_model.dart';
import '../../../student/data/repositories/academic_repository.dart';
import '../../data/models/resource_model.dart';
import '../bloc/resource_cubit.dart';

/// Teaching resources management screen.
class ResourceScreen extends StatefulWidget {
  const ResourceScreen({super.key});

  @override
  State<ResourceScreen> createState() => _ResourceScreenState();
}

class _ResourceScreenState extends State<ResourceScreen> {
  final ResourceCubit _cubit = ResourceCubit();
  List<Subject> _subjects = [];
  String? _selectedSubjectId;
  bool _filtersLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFilters();
  }

  Future<void> _loadFilters() async {
    try {
      final subjects = await getIt<AcademicRepository>().getSubjects();
      setState(() {
        _subjects = subjects;
        _filtersLoading = false;
      });
      _cubit.loadResources();
    } catch (_) {
      setState(() => _filtersLoading = false);
      _cubit.loadResources();
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
          title: const Text('Ressources Pédagogiques'),
          actions: [
            if (_subjects.isNotEmpty)
              PopupMenuButton<String?>(
                icon: const Icon(Icons.filter_list),
                onSelected: (v) {
                  setState(() => _selectedSubjectId = v);
                  _cubit.loadResources(subjectId: v);
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(value: null, child: Text('Toutes')),
                  ..._subjects.map(
                    (s) => PopupMenuItem(value: s.id, child: Text(s.name)),
                  ),
                ],
              ),
          ],
        ),
        body: _filtersLoading
            ? const Center(child: CircularProgressIndicator())
            : BlocConsumer<ResourceCubit, ResourceState>(
                listener: (context, state) {
                  if (state is ResourceUploaded) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Ressource ajoutée')),
                    );
                    _cubit.loadResources(subjectId: _selectedSubjectId);
                  }
                  if (state is ResourceError) {
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(SnackBar(content: Text(state.message)));
                  }
                },
                builder: (context, state) {
                  if (state is ResourceLoading || state is ResourceUploading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (state is ResourceLoaded) {
                    return _buildResourceList(state.resources);
                  }
                  if (state is ResourceError) {
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
                            onPressed: () => _cubit.loadResources(),
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
          onPressed: () => _showUploadDialog(context),
          icon: const Icon(Icons.upload_file),
          label: const Text('Ajouter'),
        ),
      ),
    );
  }

  Widget _buildResourceList(List<TeachingResource> resources) {
    if (resources.isEmpty) {
      return const Center(
        child: Text('Aucune ressource', style: TextStyle(color: Colors.grey)),
      );
    }
    return RefreshIndicator(
      onRefresh: () => _cubit.loadResources(subjectId: _selectedSubjectId),
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: resources.length,
        itemBuilder: (context, index) {
          final res = resources[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Theme.of(
                  context,
                ).colorScheme.secondaryContainer,
                child: Icon(res.typeIcon),
              ),
              title: Text(
                res.title,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                '${res.subjectName ?? ''}'
                '${res.chapter != null ? ' — ${res.chapter}' : ''}\n'
                '${res.typeLabel}'
                '${res.downloadCount > 0 ? ' • ${res.downloadCount} téléchargements' : ''}',
              ),
              isThreeLine: true,
              trailing: PopupMenuButton<String>(
                onSelected: (v) {
                  if (v == 'delete') _confirmDelete(res);
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text(
                      'Supprimer',
                      style: TextStyle(color: Colors.red),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showUploadDialog(BuildContext context) {
    final titleCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final chapterCtrl = TextEditingController();
    final linkCtrl = TextEditingController();
    String? subjectId;
    String resourceType = 'pdf';

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
                  'Ajouter une ressource',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: titleCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Titre *',
                    border: OutlineInputBorder(),
                  ),
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
                  controller: chapterCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Chapitre',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  initialValue: resourceType,
                  decoration: const InputDecoration(
                    labelText: 'Type',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'pdf', child: Text('PDF')),
                    DropdownMenuItem(value: 'video', child: Text('Vidéo')),
                    DropdownMenuItem(value: 'image', child: Text('Image')),
                    DropdownMenuItem(value: 'link', child: Text('Lien')),
                    DropdownMenuItem(
                      value: 'presentation',
                      child: Text('Présentation'),
                    ),
                  ],
                  onChanged: (v) =>
                      setInnerState(() => resourceType = v ?? 'pdf'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: linkCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Lien externe (optionnel)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: descCtrl,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () {
                    if (titleCtrl.text.isEmpty || subjectId == null) return;
                    Navigator.pop(ctx);
                    _cubit.uploadResource(
                      title: titleCtrl.text,
                      description: descCtrl.text.isEmpty ? null : descCtrl.text,
                      subjectId: subjectId!,
                      chapter: chapterCtrl.text.isEmpty
                          ? null
                          : chapterCtrl.text,
                      resourceType: resourceType,
                      externalLink: linkCtrl.text.isEmpty
                          ? null
                          : linkCtrl.text,
                    );
                  },
                  child: const Text('Ajouter'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _confirmDelete(TeachingResource resource) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la ressource'),
        content: Text('Voulez-vous supprimer « ${resource.title} » ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _cubit.deleteResource(resource.id);
            },
            child: const Text('Supprimer', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
