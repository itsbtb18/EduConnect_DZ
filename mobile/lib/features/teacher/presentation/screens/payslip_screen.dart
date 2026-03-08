import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/models/payslip_model.dart';
import '../bloc/payslip_cubit.dart';

/// Fiche de paie screen — teacher can view payslips and download PDFs.
class PayslipScreen extends StatefulWidget {
  const PayslipScreen({super.key});

  @override
  State<PayslipScreen> createState() => _PayslipScreenState();
}

class _PayslipScreenState extends State<PayslipScreen> {
  final PayslipCubit _cubit = PayslipCubit();
  int _selectedYear = DateTime.now().year;

  @override
  void initState() {
    super.initState();
    _cubit.loadPayslips(year: _selectedYear);
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
          title: const Text('Fiches de Paie'),
          actions: [
            PopupMenuButton<int>(
              icon: const Icon(Icons.calendar_today),
              onSelected: (year) {
                setState(() => _selectedYear = year);
                _cubit.loadPayslips(year: year);
              },
              itemBuilder: (_) {
                final currentYear = DateTime.now().year;
                return List.generate(
                  5,
                  (i) => PopupMenuItem(
                    value: currentYear - i,
                    child: Text('${currentYear - i}'),
                  ),
                );
              },
            ),
          ],
        ),
        body: BlocConsumer<PayslipCubit, PayslipState>(
          listener: (context, state) {
            if (state is PayslipPdfReady) {
              _openPdf(state.pdfUrl);
            }
            if (state is PayslipError) {
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(SnackBar(content: Text(state.message)));
            }
          },
          builder: (context, state) {
            if (state is PayslipLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is PayslipLoaded) {
              return _buildPayslipList(state.payslips);
            }
            if (state is PayslipError) {
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
                      onPressed: () => _cubit.loadPayslips(year: _selectedYear),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildPayslipList(List<PaySlip> payslips) {
    if (payslips.isEmpty) {
      return Center(
        child: Text(
          'Aucune fiche de paie pour $_selectedYear',
          style: const TextStyle(color: Colors.grey),
        ),
      );
    }

    // Summary card
    final totalNet = payslips.fold<double>(0, (sum, p) => sum + p.netSalary);

    return RefreshIndicator(
      onRefresh: () => _cubit.loadPayslips(year: _selectedYear),
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Card(
            color: Theme.of(context).colorScheme.primaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  Text(
                    'Année $_selectedYear',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${totalNet.toStringAsFixed(2)} DA',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text('Total net perçu (${payslips.length} fiches)'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          ...payslips.map((p) => _buildPayslipCard(p)),
        ],
      ),
    );
  }

  Widget _buildPayslipCard(PaySlip payslip) {
    final statusColor = payslip.isPaid
        ? Colors.green
        : payslip.status == 'VALIDATED'
        ? Colors.blue
        : Colors.orange;
    final statusText = payslip.isPaid
        ? 'Payé'
        : payslip.status == 'VALIDATED'
        ? 'Validé'
        : 'Brouillon';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ExpansionTile(
        leading: CircleAvatar(
          backgroundColor: statusColor.withValues(alpha: 0.15),
          child: Icon(Icons.receipt_long, color: statusColor),
        ),
        title: Text(
          payslip.periodLabel,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          'Net: ${payslip.netSalary.toStringAsFixed(2)} DA • $statusText',
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildRow(
                  'Salaire de base',
                  '${payslip.baseSalary.toStringAsFixed(2)} DA',
                ),
                if (payslip.totalBonuses > 0)
                  _buildRow(
                    'Total primes',
                    '+${payslip.totalBonuses.toStringAsFixed(2)} DA',
                    color: Colors.green,
                  ),
                if (payslip.totalDeductions > 0)
                  _buildRow(
                    'Total retenues',
                    '-${payslip.totalDeductions.toStringAsFixed(2)} DA',
                    color: Colors.red,
                  ),
                const Divider(),
                _buildRow(
                  'Salaire net',
                  '${payslip.netSalary.toStringAsFixed(2)} DA',
                  bold: true,
                ),
                if (payslip.details.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const Text(
                    'Détails :',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  ...payslip.details.map(
                    (d) => _buildRow(
                      d.label,
                      '${d.type == 'deduction' ? '-' : '+'}${d.amount.toStringAsFixed(2)} DA',
                      color: d.type == 'deduction' ? Colors.red : Colors.green,
                    ),
                  ),
                ],
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () => _cubit.downloadPdf(payslip.id),
                    icon: const Icon(Icons.picture_as_pdf),
                    label: const Text('Télécharger PDF'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRow(
    String label,
    String value, {
    Color? color,
    bool bold = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openPdf(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
