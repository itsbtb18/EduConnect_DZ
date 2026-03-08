import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/medical_bloc.dart';

/// Parent screen for submitting medical info update requests.
class MedicalUpdateRequestScreen extends StatefulWidget {
  final String studentId;
  const MedicalUpdateRequestScreen({super.key, required this.studentId});

  @override
  State<MedicalUpdateRequestScreen> createState() =>
      _MedicalUpdateRequestScreenState();
}

class _MedicalUpdateRequestScreenState
    extends State<MedicalUpdateRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  final _allergyController = TextEditingController();
  final _medicationController = TextEditingController();
  final _emergencyNameController = TextEditingController();
  final _emergencyPhoneController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _allergyController.dispose();
    _medicationController.dispose();
    _emergencyNameController.dispose();
    _emergencyPhoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => MedicalBloc(),
      child: Scaffold(
        appBar: AppBar(title: const Text('Mise à jour médicale')),
        body: BlocConsumer<MedicalBloc, MedicalState>(
          listener: (context, state) {
            if (state is MedicalUpdateSubmitted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Demande de mise à jour envoyée'),
                  backgroundColor: Colors.green,
                ),
              );
              Navigator.of(context).pop();
            }
            if (state is MedicalError) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.message),
                  backgroundColor: Colors.red,
                ),
              );
            }
          },
          builder: (context, state) {
            final isLoading = state is MedicalLoading;
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Info card
                    Card(
                      color: Colors.blue.shade50,
                      child: const Padding(
                        padding: EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Icon(Icons.info_outline, color: Colors.blue),
                            SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'Remplissez les champs que vous souhaitez '
                                'mettre à jour. L\'infirmerie traitera '
                                'votre demande.',
                                style: TextStyle(fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Allergies
                    Text(
                      'Nouvelles allergies',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _allergyController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText:
                            'Décrivez les allergies (type, allergène, sévérité)...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Medications
                    Text(
                      'Médicaments en cours',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _medicationController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: 'Nom du médicament, dosage, fréquence...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Emergency contact
                    Text(
                      'Contact d\'urgence',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _emergencyNameController,
                      decoration: const InputDecoration(
                        hintText: 'Nom du contact',
                        prefixIcon: Icon(Icons.person),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _emergencyPhoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        hintText: 'Téléphone',
                        prefixIcon: Icon(Icons.phone),
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Additional notes
                    Text(
                      'Notes complémentaires',
                      style: Theme.of(context).textTheme.titleSmall,
                    ),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _notesController,
                      maxLines: 4,
                      decoration: const InputDecoration(
                        hintText: 'Autres informations médicales...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Submit
                    FilledButton.icon(
                      onPressed: isLoading ? null : () => _submit(context),
                      icon: isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.send),
                      label: Text(isLoading ? 'Envoi en cours...' : 'Envoyer'),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  void _submit(BuildContext context) {
    if (!_formKey.currentState!.validate()) return;

    final data = <String, dynamic>{};
    if (_allergyController.text.trim().isNotEmpty) {
      data['new_allergies'] = _allergyController.text.trim();
    }
    if (_medicationController.text.trim().isNotEmpty) {
      data['current_medications'] = _medicationController.text.trim();
    }
    if (_emergencyNameController.text.trim().isNotEmpty) {
      data['emergency_contact_name'] = _emergencyNameController.text.trim();
    }
    if (_emergencyPhoneController.text.trim().isNotEmpty) {
      data['emergency_contact_phone'] = _emergencyPhoneController.text.trim();
    }
    if (_notesController.text.trim().isNotEmpty) {
      data['notes'] = _notesController.text.trim();
    }

    if (data.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez remplir au moins un champ')),
      );
      return;
    }

    context.read<MedicalBloc>().add(
      SubmitMedicalUpdate(studentId: widget.studentId, updateData: data),
    );
  }
}
