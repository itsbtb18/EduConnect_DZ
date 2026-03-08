import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/library_bloc.dart';
import '../../data/models/library_model.dart';

/// Student screen showing personal loan history and active reservations.
class LibraryMyBorrowsScreen extends StatelessWidget {
  const LibraryMyBorrowsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => LibraryBloc()..add(const LoadMyLoans()),
      child: const _BorrowsBody(),
    );
  }
}

class _BorrowsBody extends StatefulWidget {
  const _BorrowsBody();

  @override
  State<_BorrowsBody> createState() => _BorrowsBodyState();
}

class _BorrowsBodyState extends State<_BorrowsBody>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (_tabController.index == 1) {
        context.read<LibraryBloc>().add(const LoadMyReservations());
      } else {
        context.read<LibraryBloc>().add(const LoadMyLoans());
      }
    });
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
        title: const Text('Mes emprunts'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Emprunts'),
            Tab(text: 'Réservations'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [_LoansTab(), _ReservationsTab()],
      ),
    );
  }
}

class _LoansTab extends StatelessWidget {
  const _LoansTab();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LibraryBloc, LibraryState>(
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
              context.read<LibraryBloc>().add(const LoadMyLoans());
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: state.loans.length,
              itemBuilder: (_, i) => _LoanCard(loan: state.loans[i]),
            ),
          );
        }
        if (state is LibraryError) {
          return Center(child: Text(state.message));
        }
        return const SizedBox.shrink();
      },
    );
  }
}

class _ReservationsTab extends StatelessWidget {
  const _ReservationsTab();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<LibraryBloc, LibraryState>(
      builder: (context, state) {
        if (state is LibraryLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is ReservationsLoaded) {
          if (state.reservations.isEmpty) {
            return const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.bookmark, size: 64, color: Colors.grey),
                  SizedBox(height: 12),
                  Text('Aucune réservation'),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () async {
              context.read<LibraryBloc>().add(const LoadMyReservations());
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: state.reservations.length,
              itemBuilder: (_, i) =>
                  _ReservationCard(reservation: state.reservations[i]),
            ),
          );
        }
        if (state is ReservationCancelled) {
          // Reload after cancellation
          WidgetsBinding.instance.addPostFrameCallback((_) {
            context.read<LibraryBloc>().add(const LoadMyReservations());
          });
          return const Center(child: CircularProgressIndicator());
        }
        if (state is LibraryError) {
          return Center(child: Text(state.message));
        }
        return const SizedBox.shrink();
      },
    );
  }
}

class _LoanCard extends StatelessWidget {
  final Loan loan;
  const _LoanCard({required this.loan});

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
            if (loan.renewalsCount > 0) ...[
              const SizedBox(height: 4),
              Text(
                'Renouvelé ${loan.renewalsCount}/2 fois',
                style: theme.textTheme.bodySmall?.copyWith(color: Colors.grey),
              ),
            ],
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

class _ReservationCard extends StatelessWidget {
  final Reservation reservation;
  const _ReservationCard({required this.reservation});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    Color statusColor;
    String statusLabel;
    switch (reservation.status) {
      case 'PENDING':
        statusColor = Colors.orange;
        statusLabel = 'En attente';
      case 'FULFILLED':
        statusColor = Colors.green;
        statusLabel = 'Honorée';
      case 'CANCELLED':
        statusColor = Colors.grey;
        statusLabel = 'Annulée';
      case 'EXPIRED':
        statusColor = Colors.red;
        statusLabel = 'Expirée';
      default:
        statusColor = Colors.grey;
        statusLabel = reservation.status;
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
                    reservation.bookTitle,
                    style: theme.textTheme.titleSmall,
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
            Text(
              'Réservé le ${_formatDate(reservation.reservedDate)}',
              style: theme.textTheme.bodySmall,
            ),
            if (reservation.status == 'PENDING') ...[
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    context.read<LibraryBloc>().add(
                      CancelReservation(reservationId: reservation.id),
                    );
                  },
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                  ),
                  child: const Text('Annuler la réservation'),
                ),
              ),
            ],
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
