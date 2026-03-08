import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../trainer/data/models/formation_models.dart';
import '../../data/repositories/trainee_repository.dart';

class TraineePaymentsScreen extends StatefulWidget {
  const TraineePaymentsScreen({super.key});

  @override
  State<TraineePaymentsScreen> createState() => _TraineePaymentsScreenState();
}

class _TraineePaymentsScreenState extends State<TraineePaymentsScreen> {
  bool _isLoading = true;
  String? _error;
  List<LearnerPayment> _payments = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      _payments = await getIt<TraineeRepository>().getMyPayments();
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }

    final pending = _payments.where((p) => p.isPending).toList();
    final completed = _payments.where((p) => !p.isPending).toList();
    final totalPaid = completed.fold<double>(0, (sum, p) => sum + p.amount);
    final totalDue = pending.fold<double>(0, (sum, p) => sum + p.amount);

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Paiements',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Summary cards
          Row(
            children: [
              _card(
                'Total payé',
                '${totalPaid.toStringAsFixed(0)} DA',
                Icons.check_circle,
                AppColors.success,
              ),
              const SizedBox(width: 12),
              _card(
                'Solde dû',
                '${totalDue.toStringAsFixed(0)} DA',
                Icons.pending,
                totalDue > 0 ? AppColors.warning : AppColors.success,
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Pending
          if (pending.isNotEmpty) ...[
            const Text(
              'En attente',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 8),
            ...pending.map((p) => _buildPaymentCard(p, isPending: true)),
            const SizedBox(height: 16),
          ],

          // History
          const Text(
            'Historique',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 8),
          if (completed.isEmpty)
            const Center(
              child: Text(
                'Aucun paiement effectué',
                style: TextStyle(color: AppColors.textSecondary),
              ),
            )
          else
            ...completed.map((p) => _buildPaymentCard(p, isPending: false)),
        ],
      ),
    );
  }

  Widget _card(String label, String value, IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 4),
              Text(
                value,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(label, style: const TextStyle(fontSize: 12)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentCard(LearnerPayment p, {required bool isPending}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: isPending ? AppColors.warning : AppColors.success,
          child: Icon(
            isPending ? Icons.pending : Icons.check,
            color: Colors.white,
            size: 18,
          ),
        ),
        title: Text(p.formationName ?? 'Formation'),
        subtitle: Text(
          '${p.paymentDate} • ${p.paymentMethod}${p.transactionRef != null ? ' • Réf: ${p.transactionRef}' : ''}',
          style: const TextStyle(fontSize: 12),
        ),
        trailing: Text(
          '${p.amount.toStringAsFixed(0)} DA',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: isPending ? AppColors.warning : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}
