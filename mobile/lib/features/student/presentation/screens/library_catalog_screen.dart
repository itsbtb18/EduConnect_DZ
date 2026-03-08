import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../bloc/library_bloc.dart';
import '../../data/models/library_model.dart';

const _categoryLabels = {
  'FICTION': 'Fiction',
  'NON_FICTION': 'Non-fiction',
  'SCIENCE': 'Sciences',
  'MATHEMATICS': 'Mathématiques',
  'HISTORY': 'Histoire',
  'GEOGRAPHY': 'Géographie',
  'LITERATURE': 'Littérature',
  'RELIGION': 'Religion',
  'ARTS': 'Arts',
  'TECHNOLOGY': 'Technologie',
  'REFERENCE': 'Référence',
  'PHILOSOPHY': 'Philosophie',
  'LANGUAGES': 'Langues',
  'SPORTS': 'Sports',
  'OTHER': 'Autre',
};

/// Student library catalog screen with search and category filters.
class LibraryCatalogScreen extends StatelessWidget {
  const LibraryCatalogScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => LibraryBloc()..add(const LoadBooks()),
      child: const _CatalogBody(),
    );
  }
}

class _CatalogBody extends StatefulWidget {
  const _CatalogBody();

  @override
  State<_CatalogBody> createState() => _CatalogBodyState();
}

class _CatalogBodyState extends State<_CatalogBody> {
  final _searchController = TextEditingController();
  String? _selectedCategory;

  void _search() {
    context.read<LibraryBloc>().add(
      LoadBooks(query: _searchController.text, category: _selectedCategory),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Bibliothèque')),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Rechercher un livre…',
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

          // Category chips
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              children: [
                _CategoryChip(
                  label: 'Tous',
                  selected: _selectedCategory == null,
                  onTap: () {
                    setState(() => _selectedCategory = null);
                    _search();
                  },
                ),
                ..._categoryLabels.entries.map(
                  (e) => _CategoryChip(
                    label: e.value,
                    selected: _selectedCategory == e.key,
                    onTap: () {
                      setState(() => _selectedCategory = e.key);
                      _search();
                    },
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Book grid
          Expanded(
            child: BlocBuilder<LibraryBloc, LibraryState>(
              builder: (context, state) {
                if (state is LibraryLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state is LibraryError) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(state.message, style: theme.textTheme.bodyMedium),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: _search,
                          child: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  );
                }
                if (state is BooksLoaded) {
                  if (state.books.isEmpty) {
                    return const Center(child: Text('Aucun livre trouvé'));
                  }
                  return GridView.builder(
                    padding: const EdgeInsets.all(12),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.65,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                    itemCount: state.books.length,
                    itemBuilder: (_, i) => _BookCard(book: state.books[i]),
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
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _BookCard extends StatelessWidget {
  final Book book;
  const _BookCard({required this.book});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return GestureDetector(
      onTap: () => context.push('/student/library/book?bookId=${book.id}'),
      child: Card(
        clipBehavior: Clip.antiAlias,
        elevation: 2,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              flex: 3,
              child: book.coverImageUrl.isNotEmpty
                  ? Image.network(
                      book.coverImageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => _placeholder(),
                    )
                  : _placeholder(),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      book.title,
                      style: theme.textTheme.titleSmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      book.author,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        Icon(
                          book.isAvailable ? Icons.check_circle : Icons.cancel,
                          size: 14,
                          color: book.isAvailable ? Colors.green : Colors.red,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          book.isAvailable
                              ? '${book.availableCopies} dispo.'
                              : 'Indisponible',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: book.isAvailable ? Colors.green : Colors.red,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: Colors.blue.shade50,
      child: const Center(
        child: Icon(Icons.menu_book, size: 48, color: Colors.blue),
      ),
    );
  }
}
