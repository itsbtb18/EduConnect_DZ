import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../data/models/formation_models.dart';
import '../../data/repositories/trainer_repository.dart';

class TrainerCancelSessionScreen extends StatefulWidget {
  const TrainerCancelSessionScreen({super.key});

  @override
  State<TrainerCancelSessionScreen> createState() =>
      _TrainerCancelSessionScreenState();
}

class _TrainerCancelSessionScreenState
    extends State<TrainerCancelSessionScreen> {
  bool _isLoading = true;
  String? _error;
  List<TrainingSession> _sessions = [];

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      _sessions = await getIt<TrainerRepository>().getSessions(
        status: 'SCHEDULED',
      );
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _showCancelDialog(TrainingSession session) async {
    final reasonCtrl = TextEditingController();
    bool requestReplacement = false;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Annuler la séance'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${session.groupName ?? "Groupe"} — ${session.date}'),
              Text(
                '${session.startTime.substring(0, 5)} - ${session.endTime.substring(0, 5)}',
                style: const TextStyle(color: AppColors.textSecondary),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: reasonCtrl,
                decoration: const InputDecoration(
                  labelText: 'Motif d\'annulation *',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                value: requestReplacement,
                onChanged: (v) =>
                    setDialogState(() => requestReplacement = v ?? false),
                title: const Text(
                  'Demander un remplaçant',
                  style: TextStyle(fontSize: 14),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Retour'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: Colors.white,
              ),
              onPressed: () async {
                if (reasonCtrl.text.trim().isEmpty) {
                  ScaffoldMessenger.of(ctx).showSnackBar(
                    const SnackBar(content: Text('Veuillez saisir un motif')),
                  );
                  return;
                }
                try {
                  await getIt<TrainerRepository>().cancelSession(
                    sessionId: session.id,
                    reason: reasonCtrl.text.trim(),
                  );
                  if (requestReplacement) {
                    await getIt<TrainerRepository>().requestReplacement(
                      sessionId: session.id,
                      reason: reasonCtrl.text.trim(),
                    );
                  }
                  if (ctx.mounted) Navigator.pop(ctx);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Séance annulée avec succès'),
                        backgroundColor: AppColors.success,
                      ),
                    );
                  }
                  _loadSessions();
                } catch (e) {
                  if (ctx.mounted) {
                    ScaffoldMessenger.of(ctx).showSnackBar(
                      SnackBar(
                        content: Text('Erreur: $e'),
                        backgroundColor: AppColors.error,
                      ),
                    );
                  }
                }
              },
              child: const Text('Confirmer l\'annulation'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadSessions,
      child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : _sessions.isEmpty
          ? ListView(
              children: const [
                SizedBox(height: 100),
                Center(
                  child: Icon(
                    Icons.event_available,
                    size: 64,
                    color: AppColors.textSecondary,
                  ),
                ),
                SizedBox(height: 16),
                Center(
                  child: Text(
                    'Aucune séance planifiée à annuler',
                    style: TextStyle(color: AppColors.textSecondary),
                  ),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _sessions.length + 1,
              itemBuilder: (_, i) {
                if (i == 0) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Text(
                      'Annuler une séance',
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  );
                }
                final s = _sessions[i - 1];
                return Card(
                  child: ListTile(
                    leading: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          s.date.length >= 10 ? s.date.substring(5) : s.date,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          s.startTime.substring(0, 5),
                          style: const TextStyle(fontSize: 11),
                        ),
                      ],
                    ),
                    title: Text(s.groupName ?? 'Groupe'),
                    subtitle: Text(
                      '${s.room ?? ''} • ${s.topic ?? 'Séance'}',
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                      ),
                      onPressed: () => _showCancelDialog(s),
                      child: const Text('Annuler'),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
