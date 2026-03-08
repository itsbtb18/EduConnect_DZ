import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../student/presentation/bloc/library_bloc.dart';
import '../../../student/data/models/library_model.dart';

/// Parent screen to view their child's borrowed books.
class LibraryChildBorrowsScreen extends StatelessWidget {
  final String studentId;
  const LibraryChildBorrowsScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => LibraryBloc()..add(LoadChildLoans(childId: studentId)),
      child: Scaffold(
        appBar: AppBar(title: const Text('Emprunts de l\'enfant')),
        body: BlocBuilder<LibraryBloc, LibraryState>(
          builder: (context, state) {
            if (state is LibraryLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is LoansLoaded) {
              if (state.loans.isEmpty) {
                return const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.menu_book, size: 64, color: Colors.grey),
                      SizedBox(height: 12),
                      Text('Aucun emprunt en cours'),
                    ],
                  ),
                );
              }
              return RefreshIndicator(
                onRefresh: () async {
                  context.read<LibraryBloc>().add(
                    LoadChildLoans(childId: studentId),
                  );
                },
                child: ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: state.loans.length,
                  itemBuilder: (_, i) => _ChildLoanCard(loan: state.loans[i]),
                ),
              );
            }
            if (state is LibraryError) {
              return Center(child: Text(state.message));
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}

class _ChildLoanCard extends StatelessWidget {
  final Loan loan;
  const _ChildLoanCard({required this.loan});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dueDate = DateTime.tryParse(loan.dueDate);
    final daysLeft = dueDate != null
        ? dueDate.difference(DateTime.now()).inDays
        : 0;

    Color statusColor;
    String statusLabel;
    switch (loan.status) {
      case 'ACTIVE':
        statusColor = Colors.blue;
        statusLabel = 'Actif';
      case 'OVERDUE':
        statusColor = Colors.red;
        statusLabel = 'En retard';
      case 'RETURNED':
        statusColor = Colors.green;
        statusLabel = 'Retourné';
      default:
        statusColor = Colors.grey;
        statusLabel = loan.status;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    loan.bookTitle,
                    style: theme.textTheme.titleSmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: statusColor),
                  ),
                  child: Text(
                    statusLabel,
                    style: TextStyle(
                      fontSize: 11,
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  'Emprunté le ${_formatDate(loan.borrowedDate)}',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(
                  Icons.event,
                  size: 14,
                  color: loan.isOverdue ? Colors.red : Colors.grey,
                ),
                const SizedBox(width: 4),
                Text(
                  'Retour prévu le ${_formatDate(loan.dueDate)}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: loan.isOverdue ? Colors.red : null,
                  ),
                ),
                if (loan.status == 'ACTIVE' && daysLeft >= 0) ...[
                  const Spacer(),
                  Text(
                    '$daysLeft j restant(s)',
                    style: TextStyle(
                      fontSize: 11,
                      color: daysLeft <= 2 ? Colors.orange : Colors.grey,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }
}
