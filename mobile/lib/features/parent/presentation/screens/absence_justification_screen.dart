import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:file_picker/file_picker.dart';

import '../../../../core/di/injection.dart';
import '../../../shared/data/models/communication_model.dart';
import '../../../teacher/data/repositories/attendance_repository.dart';
import '../../data/models/absence_excuse_model.dart';
import '../bloc/absence_excuse_cubit.dart';

/// Absence justification screen — submit excuses with photo, track status.
class AbsenceJustificationScreen extends StatefulWidget {
  const AbsenceJustificationScreen({super.key});

  @override
  State<AbsenceJustificationScreen> createState() =>
      _AbsenceJustificationScreenState();
}

class _AbsenceJustificationScreenState extends State<AbsenceJustificationScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;
  late final AbsenceExcuseCubit _cubit;

  List<AttendanceRecord> _absences = [];
  bool _loadingAbsences = true;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _cubit = AbsenceExcuseCubit()..loadExcuses();
    _loadAbsences();
  }

  Future<void> _loadAbsences() async {
    setState(() => _loadingAbsences = true);
    try {
      final records = await getIt<AttendanceRepository>().getRecords();
      setState(() {
        _absences = records.where((r) => r.status == 'absent').toList();
        _loadingAbsences = false;
      });
    } catch (_) {
      setState(() => _loadingAbsences = false);
    }
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _cubit,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Justification d\'absences'),
          bottom: TabBar(
            controller: _tabCtrl,
            tabs: const [
              Tab(icon: Icon(Icons.send), text: 'Soumettre'),
              Tab(icon: Icon(Icons.history), text: 'Suivi'),
            ],
          ),
        ),
        body: TabBarView(
          controller: _tabCtrl,
          children: [_buildSubmitTab(), _buildHistoryTab()],
        ),
      ),
    );
  }

  Widget _buildSubmitTab() {
    if (_loadingAbsences) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_absences.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
            SizedBox(height: 12),
            Text('Aucune absence à justifier'),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: _absences.length,
      itemBuilder: (context, index) {
        final record = _absences[index];
        return Card(
          child: ListTile(
            leading: const Icon(Icons.event_busy, color: Colors.red),
            title: Text(record.studentName ?? 'Enfant'),
            subtitle: Text(
              '${record.date.day}/${record.date.month}/${record.date.year}'
              '${record.note != null ? ' — ${record.note}' : ''}',
            ),
            trailing: ElevatedButton.icon(
              icon: const Icon(Icons.edit_document, size: 16),
              label: const Text('Justifier'),
              onPressed: () => _showExcuseForm(record),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHistoryTab() {
    return BlocBuilder<AbsenceExcuseCubit, AbsenceExcuseState>(
      builder: (context, state) {
        if (state is AbsenceExcuseLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is AbsenceExcuseError) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(state.message, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => _cubit.loadExcuses(),
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          );
        }
        if (state is AbsenceExcuseListLoaded) {
          if (state.excuses.isEmpty) {
            return const Center(
              child: Text(
                'Aucune justification soumise',
                style: TextStyle(color: Colors.grey),
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () => _cubit.loadExcuses(),
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: state.excuses.length,
              itemBuilder: (_, i) => _excuseCard(state.excuses[i]),
            ),
          );
        }
        return const SizedBox.shrink();
      },
    );
  }

  Widget _excuseCard(AbsenceExcuse excuse) {
    final statusColor = switch (excuse.status) {
      'APPROVED' => Colors.green,
      'REJECTED' => Colors.red,
      _ => Colors.orange,
    };
    final statusIcon = switch (excuse.status) {
      'APPROVED' => Icons.check_circle,
      'REJECTED' => Icons.cancel,
      _ => Icons.hourglass_empty,
    };

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(statusIcon, color: statusColor, size: 20),
                const SizedBox(width: 8),
                Text(
                  excuse.statusLabel,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: statusColor,
                  ),
                ),
                const Spacer(),
                Text(
                  '${excuse.createdAt.day}/${excuse.createdAt.month}/${excuse.createdAt.year}',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(excuse.justificationText),
            if (excuse.attachmentUrl != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    const Icon(Icons.attach_file, size: 16),
                    const SizedBox(width: 4),
                    Text(
                      'Pièce jointe',
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.blue.shade700,
                      ),
                    ),
                  ],
                ),
              ),
            if (excuse.reviewComment != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.comment, size: 14, color: Colors.grey),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          excuse.reviewComment!,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showExcuseForm(AttendanceRecord record) {
    final textCtrl = TextEditingController();
    String? filePath;
    bool hasText = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setInnerState) => Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            top: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Justifier l\'absence du ${record.date.day}/${record.date.month}/${record.date.year}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: textCtrl,
                maxLines: 4,
                onChanged: (v) =>
                    setInnerState(() => hasText = v.trim().isNotEmpty),
                decoration: const InputDecoration(
                  labelText: 'Motif de l\'absence',
                  hintText: 'Ex: Rendez-vous médical, maladie...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                icon: Icon(filePath != null ? Icons.check : Icons.camera_alt),
                label: Text(
                  filePath != null
                      ? 'Certificat sélectionné'
                      : 'Joindre un certificat médical',
                ),
                onPressed: () async {
                  final result = await FilePicker.platform.pickFiles(
                    type: FileType.custom,
                    allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
                  );
                  if (result != null && result.files.single.path != null) {
                    setInnerState(() => filePath = result.files.single.path);
                  }
                },
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: BlocConsumer<AbsenceExcuseCubit, AbsenceExcuseState>(
                  listener: (context, state) {
                    if (state is AbsenceExcuseSubmitted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Justification soumise avec succès'),
                          backgroundColor: Colors.green,
                        ),
                      );
                      _cubit.loadExcuses();
                      _loadAbsences();
                      _tabCtrl.animateTo(1);
                    }
                    if (state is AbsenceExcuseError) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(state.message),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  },
                  builder: (context, state) {
                    final isSubmitting = state is AbsenceExcuseSubmitting;
                    return ElevatedButton(
                      onPressed: isSubmitting || !hasText
                          ? null
                          : () {
                              _cubit.submitExcuse(
                                attendanceRecordId: record.id,
                                justificationText: textCtrl.text.trim(),
                                attachmentPath: filePath,
                              );
                            },
                      child: isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Soumettre la justification'),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
