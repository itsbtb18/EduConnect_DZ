import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/medical_bloc.dart';
import '../../data/models/medical_model.dart';

/// Parent screen displaying child's medical summary.
class MedicalSummaryScreen extends StatelessWidget {
  final String studentId;
  const MedicalSummaryScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) =>
          MedicalBloc()..add(LoadMedicalSummary(studentId: studentId)),
      child: Scaffold(
        appBar: AppBar(title: const Text('Dossier médical')),
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
                        LoadMedicalSummary(studentId: studentId),
                      ),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              );
            }
            if (state is MedicalSummaryLoaded) {
              return _buildContent(context, state.summary);
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, MedicalSummary summary) {
    final theme = Theme.of(context);
    return RefreshIndicator(
      onRefresh: () async {
        context.read<MedicalBloc>().add(
          LoadMedicalSummary(studentId: studentId),
        );
      },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // General info card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Informations générales',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  _infoRow(
                    Icons.bloodtype,
                    'Groupe sanguin',
                    summary.bloodGroup,
                  ),
                  if (summary.weight != null)
                    _infoRow(
                      Icons.monitor_weight,
                      'Poids',
                      '${summary.weight} kg',
                    ),
                  if (summary.height != null)
                    _infoRow(Icons.height, 'Taille', '${summary.height} cm'),
                  if (summary.bmi != null)
                    _infoRow(
                      Icons.speed,
                      'IMC',
                      summary.bmi!.toStringAsFixed(1),
                    ),
                  if (summary.treatingDoctor != null)
                    _infoRow(
                      Icons.local_hospital,
                      'Médecin',
                      summary.treatingDoctor!,
                    ),
                  if (summary.insuranceType != null)
                    _infoRow(
                      Icons.security,
                      'Assurance',
                      summary.insuranceType!,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),

          // Emergency contact
          if (summary.emergencyContactName != null) ...[
            Card(
              color: Colors.red.shade50,
              child: ListTile(
                leading: Icon(Icons.emergency, color: Colors.red.shade700),
                title: Text(summary.emergencyContactName!),
                subtitle: Text(summary.emergencyContactPhone ?? ''),
                trailing: summary.emergencyContactPhone != null
                    ? IconButton(
                        icon: const Icon(Icons.phone, color: Colors.green),
                        onPressed: () {},
                      )
                    : null,
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Allergies
          if (summary.allergies.isNotEmpty) ...[
            Text('Allergies', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            ...summary.allergies.map(
              (a) => Card(
                color: a.isAnaphylactic
                    ? Colors.red.shade50
                    : Colors.orange.shade50,
                child: ListTile(
                  leading: Icon(
                    a.isAnaphylactic ? Icons.warning_amber : Icons.info_outline,
                    color: a.isAnaphylactic ? Colors.red : Colors.orange,
                  ),
                  title: Text(a.allergen),
                  subtitle: Text(
                    '${a.allergyType} — ${a.severity}${a.hasEpipen ? ' (EpiPen)' : ''}',
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Active medications
          if (summary.activeMedications.isNotEmpty) ...[
            Text('Médicaments actifs', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            ...summary.activeMedications.map(
              (m) => Card(
                child: ListTile(
                  leading: const Icon(Icons.medication, color: Colors.blue),
                  title: Text(m.dciName),
                  subtitle: Text(
                    '${m.dosage} — ${m.frequency}\n${m.administrationRoute}',
                  ),
                  isThreeLine: true,
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Disabilities
          if (summary.disabilities.isNotEmpty) ...[
            Text(
              'Handicaps / Aménagements',
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            ...summary.disabilities.map(
              (d) => Card(
                child: ListTile(
                  leading: const Icon(Icons.accessible, color: Colors.purple),
                  title: Text(d.disabilityType),
                  subtitle: Text(
                    'Autonomie: ${d.autonomyLevel}${d.schoolAccommodations != null ? '\n${d.schoolAccommodations}' : ''}',
                  ),
                  isThreeLine: d.schoolAccommodations != null,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          Text(
            '$label : ',
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
