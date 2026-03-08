import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/finance_model.dart';
import '../../data/repositories/finance_repository.dart';
import '../bloc/child_selector_cubit.dart';

/// Parent finance screen — balance, payment history, receipts.
class ParentFinanceScreen extends StatefulWidget {
  const ParentFinanceScreen({super.key});

  @override
  State<ParentFinanceScreen> createState() => _ParentFinanceScreenState();
}

class _ParentFinanceScreenState extends State<ParentFinanceScreen> {
  bool _loading = true;
  String? _error;
  FinanceSummary? _summary;
  List<Payment> _payments = [];

  @override
  void initState() {
    super.initState();
    _loadFinance();
  }

  Future<void> _loadFinance() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final childState = context.read<ChildSelectorCubit>().state;
      final studentId = childState is ChildSelectorLoaded
          ? childState.selected?.id ?? ''
          : '';

      final repo = getIt<FinanceRepository>();
      final results = await Future.wait([
        repo.getFinanceSummary(studentId),
        repo.getPayments(studentId: studentId),
      ]);

      setState(() {
        _summary = results[0] as FinanceSummary;
        _payments = results[1] as List<Payment>;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<ChildSelectorCubit, ChildSelectorState>(
      listener: (_, _) => _loadFinance(),
      child: Scaffold(
        appBar: AppBar(title: const Text('Finances & Paiements')),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: _loadFinance,
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: _loadFinance,
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _buildSummaryCard(),
                    const SizedBox(height: 16),
                    _buildFeeStatusList(),
                    const SizedBox(height: 16),
                    _buildPaymentHistory(),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildSummaryCard() {
    final s = _summary;
    if (s == null) return const SizedBox.shrink();
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Résumé financier',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _summaryTile(
                    'Total frais',
                    '${s.totalFees.toStringAsFixed(0)} DA',
                    Icons.account_balance,
                    Colors.blue,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _summaryTile(
                    'Payé',
                    '${s.totalPaid.toStringAsFixed(0)} DA',
                    Icons.check_circle_outline,
                    Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _summaryTile(
                    'Restant',
                    '${s.totalRemaining.toStringAsFixed(0)} DA',
                    Icons.warning_amber,
                    s.totalRemaining > 0 ? Colors.orange : Colors.green,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _summaryTile(
                    'Taux',
                    '${s.paidPercentage.toStringAsFixed(0)}%',
                    Icons.percent,
                    Colors.indigo,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: s.totalFees > 0 ? s.totalPaid / s.totalFees : 0,
                minHeight: 8,
                backgroundColor: Colors.grey.shade200,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryTile(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }

  Widget _buildFeeStatusList() {
    final fees = _summary?.feeStatuses ?? [];
    if (fees.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Détail par frais',
          style: Theme.of(
            context,
          ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        ...fees.map((fee) {
          final statusIcon = fee.isFullyPaid
              ? const Text('✅', style: TextStyle(fontSize: 18))
              : fee.remaining < fee.amount
              ? const Text('🟡', style: TextStyle(fontSize: 18))
              : const Text('🔴', style: TextStyle(fontSize: 18));
          return Card(
            child: ListTile(
              leading: statusIcon,
              title: Text(fee.feeName),
              subtitle: Text(
                'Montant: ${fee.amount.toStringAsFixed(0)} DA — '
                'Payé: ${fee.paid.toStringAsFixed(0)} DA',
              ),
              trailing: Text(
                fee.isFullyPaid
                    ? 'Payé'
                    : '${fee.remaining.toStringAsFixed(0)} DA',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: fee.isFullyPaid ? Colors.green : Colors.orange,
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildPaymentHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Historique des paiements',
          style: Theme.of(
            context,
          ).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        if (_payments.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: Center(
                child: Text(
                  'Aucun paiement enregistré',
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ),
          )
        else
          ..._payments.map((p) {
            final statusData = _paymentStatus(p);
            return Card(
              child: ListTile(
                leading: Text(
                  statusData.$1,
                  style: const TextStyle(fontSize: 20),
                ),
                title: Text(p.feeName ?? 'Paiement'),
                subtitle: Text(
                  '${p.amount.toStringAsFixed(0)} DA — '
                  '${p.paymentMethod ?? ''}\n'
                  '${p.paidAt != null ? '${p.paidAt!.day}/${p.paidAt!.month}/${p.paidAt!.year}' : '${p.createdAt.day}/${p.createdAt.month}/${p.createdAt.year}'}',
                ),
                isThreeLine: true,
                trailing: p.receiptUrl != null
                    ? IconButton(
                        icon: const Icon(Icons.download, color: Colors.blue),
                        tooltip: 'Télécharger reçu',
                        onPressed: () => _downloadReceipt(p),
                      )
                    : null,
              ),
            );
          }),
      ],
    );
  }

  (String, Color) _paymentStatus(Payment p) {
    return switch (p.status) {
      'completed' => ('✅', Colors.green),
      'pending' => ('🟡', Colors.orange),
      'failed' => ('🔴', Colors.red),
      'refunded' => ('↩️', Colors.blue),
      _ => ('⏰', Colors.grey),
    };
  }

  Future<void> _downloadReceipt(Payment p) async {
    if (p.receiptUrl == null) return;
    try {
      // Try using the receipt endpoint first
      final repo = getIt<FinanceRepository>();
      final url = await repo.downloadReceipt(p.id);
      final uri = Uri.parse(url.isNotEmpty ? url : p.receiptUrl!);
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } catch (_) {
      // Fallback to direct URL
      final uri = Uri.parse(p.receiptUrl!);
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
