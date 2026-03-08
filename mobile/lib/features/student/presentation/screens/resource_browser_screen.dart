import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/elearning_model.dart';
import '../bloc/elearning_bloc.dart';

class ResourceBrowserScreen extends StatefulWidget {
  const ResourceBrowserScreen({super.key});

  @override
  State<ResourceBrowserScreen> createState() => _ResourceBrowserScreenState();
}

class _ResourceBrowserScreenState extends State<ResourceBrowserScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchController = TextEditingController();
  String? _selectedType;

  static const _types = ['PDF', 'VIDEO', 'COURSE', 'SUMMARY', 'EXERCISE'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _types.length + 1, vsync: this);
    context.read<ElearningBloc>().add(const LoadResources());
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _search() {
    context.read<ElearningBloc>().add(
      LoadResources(query: _searchController.text, type: _selectedType),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bibliothèque Numérique'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          onTap: (index) {
            setState(() {
              _selectedType = index == 0 ? null : _types[index - 1];
            });
            _search();
          },
          tabs: [
            const Tab(text: 'Tout'),
            ..._types.map((t) => Tab(text: _typeLabel(t))),
          ],
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Rechercher...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    _search();
                  },
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              onSubmitted: (_) => _search(),
            ),
          ),
          Expanded(
            child: BlocBuilder<ElearningBloc, ElearningState>(
              builder: (context, state) {
                if (state is ElearningLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state is ElearningError) {
                  return Center(child: Text('Erreur: ${state.message}'));
                }
                if (state is ResourcesLoaded) {
                  final resources = state.resources;
                  if (resources.isEmpty) {
                    return const Center(
                      child: Text('Aucune ressource trouvée'),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: resources.length,
                    itemBuilder: (_, i) => _ResourceCard(
                      resource: resources[i],
                      onFavourite: () {
                        context.read<ElearningBloc>().add(
                          ToggleFavourite(resources[i].id),
                        );
                      },
                    ),
                  );
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  String _typeLabel(String type) {
    const labels = {
      'PDF': 'PDF',
      'VIDEO': 'Vidéo',
      'COURSE': 'Cours',
      'SUMMARY': 'Résumé',
      'EXERCISE': 'Exercice',
    };
    return labels[type] ?? type;
  }
}

class _ResourceCard extends StatelessWidget {
  final DigitalResource resource;
  final VoidCallback onFavourite;

  const _ResourceCard({required this.resource, required this.onFavourite});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _typeColor(
            resource.resourceType,
          ).withValues(alpha: 0.15),
          child: Icon(
            _typeIcon(resource.resourceType),
            color: _typeColor(resource.resourceType),
          ),
        ),
        title: Text(
          resource.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          [
            resource.subjectName,
            resource.chapter,
            resource.levelName,
          ].where((e) => e != null && e.isNotEmpty).join(' · '),
          style: theme.textTheme.bodySmall,
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(
                resource.isFavourited ? Icons.star : Icons.star_border,
                color: resource.isFavourited ? Colors.amber : null,
              ),
              onPressed: onFavourite,
            ),
            Text('${resource.viewCount}', style: theme.textTheme.bodySmall),
            const SizedBox(width: 2),
            Icon(Icons.visibility, size: 14, color: theme.hintColor),
          ],
        ),
        onTap: () {
          if (resource.externalUrl != null &&
              resource.externalUrl!.isNotEmpty) {
            // Could open URL
          }
          // Could navigate to detail
        },
      ),
    );
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'PDF':
        return Icons.picture_as_pdf;
      case 'VIDEO':
        return Icons.play_circle;
      case 'COURSE':
        return Icons.school;
      case 'SUMMARY':
        return Icons.summarize;
      case 'EXERCISE':
        return Icons.assignment;
      default:
        return Icons.insert_drive_file;
    }
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'PDF':
        return Colors.red;
      case 'VIDEO':
        return Colors.blue;
      case 'COURSE':
        return Colors.green;
      case 'SUMMARY':
        return Colors.orange;
      case 'EXERCISE':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
}
