import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

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

const _languageLabels = {
  'ARABIC': 'Arabe',
  'FRENCH': 'Français',
  'ENGLISH': 'Anglais',
  'TAMAZIGHT': 'Tamazight',
  'OTHER': 'Autre',
};

/// Book detail screen with reservation capability.
class LibraryBookDetailScreen extends StatelessWidget {
  final String bookId;
  const LibraryBookDetailScreen({super.key, required this.bookId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => LibraryBloc()..add(LoadBookDetail(bookId: bookId)),
      child: const _DetailBody(),
    );
  }
}

class _DetailBody extends StatelessWidget {
  const _DetailBody();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Détails du livre')),
      body: BlocConsumer<LibraryBloc, LibraryState>(
        listener: (context, state) {
          if (state is ReservationCreated) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Réservation effectuée !'),
                backgroundColor: Colors.green,
              ),
            );
          }
          if (state is LibraryError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          if (state is LibraryLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is BookDetailLoaded) {
            return _buildDetail(context, theme, state.book);
          }
          if (state is LibraryError) {
            return Center(child: Text(state.message));
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildDetail(BuildContext context, ThemeData theme, Book book) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover + title
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 120,
                  height: 170,
                  child: book.coverImageUrl.isNotEmpty
                      ? Image.network(
                          book.coverImageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => _placeholder(),
                        )
                      : _placeholder(),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(book.title, style: theme.textTheme.titleLarge),
                    const SizedBox(height: 4),
                    Text(
                      book.author,
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 12),
                    _badge(
                      book.isAvailable,
                      '${book.availableCopies} / ${book.totalCopies} disponible(s)',
                    ),
                    const SizedBox(height: 8),
                    if (book.isbn.isNotEmpty)
                      Text(
                        'ISBN: ${book.isbn}',
                        style: theme.textTheme.bodySmall,
                      ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Info cards
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Informations', style: theme.textTheme.titleMedium),
                  const Divider(),
                  _infoRow(
                    'Catégorie',
                    _categoryLabels[book.category] ?? book.category,
                  ),
                  _infoRow(
                    'Langue',
                    _languageLabels[book.language] ?? book.language,
                  ),
                  if (book.publisher.isNotEmpty)
                    _infoRow('Éditeur', book.publisher),
                  if (book.subject.isNotEmpty)
                    _infoRow('Matière', book.subject),
                  if (book.publicationYear != null)
                    _infoRow('Année', '${book.publicationYear}'),
                  if (book.edition.isNotEmpty)
                    _infoRow('Édition', book.edition),
                  if (book.pageCount != null)
                    _infoRow('Pages', '${book.pageCount}'),
                ],
              ),
            ),
          ),

          if (book.description.isNotEmpty) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Description', style: theme.textTheme.titleMedium),
                    const Divider(),
                    Text(book.description),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 24),

          // Reservation button
          if (!book.isAvailable)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _showReservationDialog(context, book.id),
                icon: const Icon(Icons.bookmark_add),
                label: const Text('Réserver ce livre'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _badge(bool available, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: available ? Colors.green.shade50 : Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: available ? Colors.green : Colors.red),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            available ? Icons.check_circle : Icons.cancel,
            size: 14,
            color: available ? Colors.green : Colors.red,
          ),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: available ? Colors.green.shade700 : Colors.red.shade700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13))),
        ],
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

  void _showReservationDialog(BuildContext context, String bookId) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Réserver ce livre'),
          content: const Text(
            'Vous serez notifié(e) lorsqu\'un exemplaire sera disponible.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                context.read<LibraryBloc>().add(
                  CreateReservation(bookId: bookId),
                );
              },
              child: const Text('Confirmer'),
            ),
          ],
        );
      },
    );
  }
}
