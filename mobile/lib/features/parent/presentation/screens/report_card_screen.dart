import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/di/injection.dart';
import '../../../student/data/models/grade_model.dart';
import '../../../student/data/repositories/grade_repository.dart';

/// Bulletin scolaire — view report cards, download/share PDF.
class ReportCardScreen extends StatefulWidget {
  const ReportCardScreen({super.key});

  @override
  State<ReportCardScreen> createState() => _ReportCardScreenState();
}

class _ReportCardScreenState extends State<ReportCardScreen> {
  List<ReportCard> _cards = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final cards = await getIt<GradeRepository>().getReportCards();
      setState(() {
        _cards = cards;
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
    return Scaffold(
      appBar: AppBar(title: const Text('Bulletins scolaires')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _load, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    if (_cards.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.description_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 12),
            Text('Aucun bulletin disponible'),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _cards.length,
        itemBuilder: (_, i) => _reportCardTile(_cards[i]),
      ),
    );
  }

  Widget _reportCardTile(ReportCard card) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                const Icon(Icons.school, color: Colors.indigo),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    card.semesterName ?? 'Semestre',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                if (card.generalAverage != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _averageColor(card.generalAverage!),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${card.generalAverage!.toStringAsFixed(2)}/20',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
            if (card.studentName != null) ...[
              const SizedBox(height: 4),
              Text(
                card.studentName!,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
              ),
            ],

            // Rank
            if (card.rank != null && card.totalStudents != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.leaderboard, size: 16, color: Colors.amber),
                  const SizedBox(width: 4),
                  Text(
                    'Classement : ${card.rank}/${card.totalStudents}',
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
                  ),
                ],
              ),
            ],

            // Subject averages
            if (card.subjectAverages.isNotEmpty) ...[
              const SizedBox(height: 10),
              const Divider(),
              ...card.subjectAverages.map(_subjectRow),
            ],

            // Admin comment
            if (card.adminComment != null && card.adminComment!.isNotEmpty) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  card.adminComment!,
                  style: const TextStyle(
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            ],

            // Actions
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (card.pdfUrl != null) ...[
                  OutlinedButton.icon(
                    icon: const Icon(Icons.download, size: 16),
                    label: const Text('Télécharger'),
                    onPressed: () => _openPdf(card.pdfUrl!),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.share, size: 16),
                    label: const Text('Partager'),
                    onPressed: () => _openPdf(card.pdfUrl!),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _subjectRow(SubjectAverage sa) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          Expanded(
            child: Text(sa.subjectName, style: const TextStyle(fontSize: 13)),
          ),
          Text(
            '${sa.average.toStringAsFixed(2)}/20',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: _averageColor(sa.average),
            ),
          ),
        ],
      ),
    );
  }

  Color _averageColor(double avg) {
    if (avg >= 16) return Colors.green.shade700;
    if (avg >= 12) return Colors.blue;
    if (avg >= 10) return Colors.orange;
    return Colors.red;
  }

  Future<void> _openPdf(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
