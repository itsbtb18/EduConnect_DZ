import 'package:flutter/material.dart';

/// Student screen for browsing downloadable lesson resources.
class ResourcesScreen extends StatefulWidget {
  const ResourcesScreen({super.key});

  @override
  State<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends State<ResourcesScreen> {
  String? _selectedSubject;
  final _searchController = TextEditingController();

  final _subjects = [
    'Tous',
    'Mathématiques',
    'Physique',
    'Sciences Naturelles',
    'Langue Arabe',
    'Langue Française',
    'Anglais',
    'Informatique',
  ];

  // Placeholder data — replace with BLoC/repository
  final _resources = [
    {
      'title': 'Cours: Équations du 1er degré',
      'subject': 'Mathématiques',
      'type': 'pdf',
      'size': '2.4 MB',
      'teacher': 'M. Benmoussa',
      'date': '2025-01-15',
    },
    {
      'title': 'TP: Les forces et le mouvement',
      'subject': 'Physique',
      'type': 'pdf',
      'size': '1.8 MB',
      'teacher': 'Mme. Rahmani',
      'date': '2025-01-18',
    },
    {
      'title': 'Vidéo: La photosynthèse',
      'subject': 'Sciences Naturelles',
      'type': 'video',
      'size': '45 MB',
      'teacher': 'M. Khelifi',
      'date': '2025-01-20',
    },
    {
      'title': 'Exercices corrigés — Grammaire',
      'subject': 'Langue Française',
      'type': 'pdf',
      'size': '980 KB',
      'teacher': 'Mme. Mansouri',
      'date': '2025-01-22',
    },
    {
      'title': 'Introduction to Programming',
      'subject': 'Informatique',
      'type': 'pdf',
      'size': '3.2 MB',
      'teacher': 'M. Djebbar',
      'date': '2025-02-01',
    },
  ];

  List<Map<String, String>> get _filtered {
    return _resources.where((r) {
      final matchSubject =
          _selectedSubject == null ||
          _selectedSubject == 'Tous' ||
          r['subject'] == _selectedSubject;
      final matchSearch =
          _searchController.text.isEmpty ||
          r['title']!.toLowerCase().contains(
            _searchController.text.toLowerCase(),
          );
      return matchSubject && matchSearch;
    }).toList();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ressources pédagogiques')),
      body: Column(
        children: [
          _buildSearchBar(),
          _buildSubjectFilter(),
          const Divider(height: 1),
          Expanded(child: _buildResourceList()),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Rechercher une ressource...',
          prefixIcon: const Icon(Icons.search),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          isDense: true,
        ),
        onChanged: (_) => setState(() {}),
      ),
    );
  }

  Widget _buildSubjectFilter() {
    return SizedBox(
      height: 42,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        itemCount: _subjects.length,
        itemBuilder: (context, index) {
          final subject = _subjects[index];
          final selected = subject == (_selectedSubject ?? 'Tous');
          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: FilterChip(
              label: Text(subject),
              selected: selected,
              onSelected: (_) => setState(() {
                _selectedSubject = subject == 'Tous' ? null : subject;
              }),
              selectedColor: Theme.of(
                context,
              ).colorScheme.primary.withAlpha(50),
            ),
          );
        },
      ),
    );
  }

  Widget _buildResourceList() {
    final filtered = _filtered;
    if (filtered.isEmpty) {
      return const Center(
        child: Text(
          'Aucune ressource trouvée',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final res = filtered[index];
        return Card(
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: _typeColor(res['type']!).withAlpha(50),
              child: Icon(
                _typeIcon(res['type']!),
                color: _typeColor(res['type']!),
              ),
            ),
            title: Text(res['title']!),
            subtitle: Text(
              '${res['subject']} — ${res['teacher']}\n'
              '${res['date']} • ${res['size']}',
            ),
            isThreeLine: true,
            trailing: IconButton(
              icon: const Icon(Icons.download),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Téléchargement: ${res['title']}')),
                );
              },
            ),
          ),
        );
      },
    );
  }

  IconData _typeIcon(String type) => switch (type) {
    'pdf' => Icons.picture_as_pdf,
    'video' => Icons.play_circle_fill,
    'image' => Icons.image,
    _ => Icons.insert_drive_file,
  };

  Color _typeColor(String type) => switch (type) {
    'pdf' => Colors.red,
    'video' => Colors.blue,
    'image' => Colors.purple,
    _ => Colors.grey,
  };
}
