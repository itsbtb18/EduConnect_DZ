import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../trainer/data/models/formation_models.dart';
import '../../data/repositories/trainee_repository.dart';

class TraineeResultsScreen extends StatefulWidget {
  const TraineeResultsScreen({super.key});

  @override
  State<TraineeResultsScreen> createState() => _TraineeResultsScreenState();
}

class _TraineeResultsScreenState extends State<TraineeResultsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;

  List<PlacementTest> _tests = [];
  List<LevelPassage> _passages = [];
  List<Certificate> _certificates = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final repo = getIt<TraineeRepository>();
      final results = await Future.wait([
        repo.getMyPlacementTests(),
        repo.getMyLevelPassages(),
        repo.getMyCertificates(),
      ]);
      _tests = results[0] as List<PlacementTest>;
      _passages = results[1] as List<LevelPassage>;
      _certificates = results[2] as List<Certificate>;
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = e.toString();
      });
    }
  }

  Future<void> _downloadCertificate(Certificate cert) async {
    if (cert.pdfUrl == null) return;
    final uri = Uri.parse(cert.pdfUrl!);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Tests'),
            Tab(text: 'Niveaux'),
            Tab(text: 'Certificats'),
          ],
        ),
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
              ? Center(child: Text(_error!))
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _buildTestsTab(),
                    _buildPassagesTab(),
                    _buildCertificatesTab(),
                  ],
                ),
        ),
      ],
    );
  }

  Widget _buildTestsTab() {
    if (_tests.isEmpty) {
      return const Center(
        child: Text(
          'Aucun test de placement',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _tests.length,
        itemBuilder: (_, i) {
          final t = _tests[i];
          final pct = t.percentage;
          final color = pct >= 80
              ? AppColors.success
              : pct >= 50
              ? AppColors.warning
              : AppColors.error;
          return Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: color,
                    child: Text(
                      '${pct.toInt()}%',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          t.evaluationType,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          'Note: ${t.score}/${t.maxScore}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (t.recommendedLevel != null)
                          Text(
                            'Niveau recommandé: ${t.recommendedLevel}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.primary,
                            ),
                          ),
                      ],
                    ),
                  ),
                  Icon(
                    t.validated ? Icons.verified : Icons.hourglass_empty,
                    color: t.validated ? AppColors.success : AppColors.warning,
                    size: 20,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPassagesTab() {
    if (_passages.isEmpty) {
      return const Center(
        child: Text(
          'Aucun passage de niveau',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _passages.length,
        itemBuilder: (_, i) {
          final p = _passages[i];
          final color = p.isPromoted
              ? AppColors.success
              : p.isPending
              ? AppColors.warning
              : AppColors.error;
          final icon = p.isPromoted
              ? Icons.arrow_upward
              : p.isPending
              ? Icons.hourglass_empty
              : Icons.close;
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: color,
                child: Icon(icon, color: Colors.white, size: 18),
              ),
              title: Text('${p.fromLevel} → ${p.toLevel}'),
              subtitle: Text(
                'Présence: ${p.attendanceRate.toStringAsFixed(0)}%${p.averageGrade != null ? ' • Moyenne: ${p.averageGrade!.toStringAsFixed(1)}' : ''}',
                style: const TextStyle(fontSize: 12),
              ),
              trailing: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  p.isPromoted
                      ? 'Promu'
                      : p.isPending
                      ? 'En attente'
                      : 'Refusé',
                  style: TextStyle(
                    fontSize: 11,
                    color: color,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCertificatesTab() {
    if (_certificates.isEmpty) {
      return const Center(
        child: Text(
          'Aucun certificat',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _certificates.length,
        itemBuilder: (_, i) {
          final c = _certificates[i];
          return Card(
            child: ListTile(
              leading: const Icon(
                Icons.emoji_events,
                color: AppColors.accent,
                size: 28,
              ),
              title: Text(c.formationName ?? 'Certificat'),
              subtitle: Text(
                '${c.certificateType} • ${c.level ?? '—'} • Réf: ${c.referenceNumber}\nDélivré le ${c.issueDate}',
                style: const TextStyle(fontSize: 12),
              ),
              isThreeLine: true,
              trailing: c.pdfUrl != null
                  ? IconButton(
                      icon: const Icon(
                        Icons.download,
                        color: AppColors.primary,
                      ),
                      onPressed: () => _downloadCertificate(c),
                    )
                  : null,
            ),
          );
        },
      ),
    );
  }
}
