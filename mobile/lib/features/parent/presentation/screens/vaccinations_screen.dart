import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

import '../bloc/medical_bloc.dart';
import '../../data/models/medical_model.dart';

/// Parent screen listing a child's vaccination records.
class VaccinationsScreen extends StatelessWidget {
  final String studentId;
  const VaccinationsScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => MedicalBloc()..add(LoadVaccinations(studentId: studentId)),
      child: Scaffold(
        appBar: AppBar(title: const Text('Vaccinations')),
        body: BlocBuilder<MedicalBloc, MedicalState>(
          builder: (context, state) {
            if (state is MedicalLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is MedicalError) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      size: 48,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 8),
                    Text(state.message),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.read<MedicalBloc>().add(
                        LoadVaccinations(studentId: studentId),
                      ),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              );
            }
            if (state is VaccinationsLoaded) {
              return _buildList(context, state.vaccinations);
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildList(
    BuildContext context,
    List<VaccinationRecord> vaccinations,
  ) {
    if (vaccinations.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.vaccines, size: 64, color: Colors.grey),
            SizedBox(height: 8),
            Text('Aucune vaccination enregistrée'),
          ],
        ),
      );
    }

    final overdue = vaccinations.where((v) => v.isOverdue).toList();
    final upcoming = vaccinations
        .where((v) => !v.isDone && !v.isOverdue)
        .toList();
    final done = vaccinations.where((v) => v.isDone).toList();

    return RefreshIndicator(
      onRefresh: () async {
        context.read<MedicalBloc>().add(LoadVaccinations(studentId: studentId));
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (overdue.isNotEmpty) ...[
            _sectionHeader(context, 'En retard', Colors.red, overdue.length),
            ...overdue.map((v) => _vaccinationCard(v)),
            const SizedBox(height: 16),
          ],
          if (upcoming.isNotEmpty) ...[
            _sectionHeader(context, 'À venir', Colors.blue, upcoming.length),
            ...upcoming.map((v) => _vaccinationCard(v)),
            const SizedBox(height: 16),
          ],
          if (done.isNotEmpty) ...[
            _sectionHeader(context, 'Effectuées', Colors.green, done.length),
            ...done.map((v) => _vaccinationCard(v)),
          ],
        ],
      ),
    );
  }

  Widget _sectionHeader(
    BuildContext context,
    String title,
    Color color,
    int count,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 24,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 8),
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(width: 8),
          CircleAvatar(
            radius: 12,
            backgroundColor: color.withValues(alpha: 0.15),
            child: Text('$count', style: TextStyle(fontSize: 12, color: color)),
          ),
        ],
      ),
    );
  }

  Widget _vaccinationCard(VaccinationRecord v) {
    final dateFormat = DateFormat('dd/MM/yyyy');
    Color statusColor;
    IconData statusIcon;
    if (v.isOverdue) {
      statusColor = Colors.red;
      statusIcon = Icons.warning;
    } else if (v.isDone) {
      statusColor = Colors.green;
      statusIcon = Icons.check_circle;
    } else {
      statusColor = Colors.blue;
      statusIcon = Icons.schedule;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(statusIcon, color: statusColor),
        title: Text(v.vaccineName),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Statut : ${v.status}'),
            if (v.administrationDate != null)
              Text('Administré le ${dateFormat.format(v.administrationDate!)}'),
            if (v.nextDueDate != null)
              Text(
                'Prochaine dose : ${dateFormat.format(v.nextDueDate!)}',
                style: TextStyle(
                  color: v.isOverdue ? Colors.red : null,
                  fontWeight: v.isOverdue ? FontWeight.bold : null,
                ),
              ),
            if (v.lotNumber != null) Text('Lot : ${v.lotNumber}'),
          ],
        ),
        isThreeLine: true,
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: statusColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            v.status,
            style: TextStyle(
              color: statusColor,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}
