import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../student/data/models/grade_model.dart';
import '../../../student/data/repositories/grade_repository.dart';

/// Parent screen to view their child's grades and report cards.
class ChildGradesScreen extends StatefulWidget {
  const ChildGradesScreen({super.key});

  @override
  State<ChildGradesScreen> createState() => _ChildGradesScreenState();
}

class _ChildGradesScreenState extends State<ChildGradesScreen> {
  List<Grade> _grades = [];
  List<ReportCard> _reportCards = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadGrades();
  }

  Future<void> _loadGrades() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        getIt<GradeRepository>().getGrades(),
        getIt<GradeRepository>().getReportCards(),
      ]);
      setState(() {
        _grades = results[0] as List<Grade>;
        _reportCards = results[1] as List<ReportCard>;
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
      appBar: AppBar(title: const Text('Notes de mon enfant')),
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
                    onPressed: _loadGrades,
                    child: const Text('Réessayer'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadGrades,
              child: Column(
                children: [
                  const Divider(height: 1),
                  Expanded(child: _buildGradesTable()),
                  _buildOverallAverage(),
                ],
              ),
            ),
    );
  }

  Widget _buildGradesTable() {
    if (_grades.isEmpty) {
      return const Center(
        child: Text(
          'Aucune note disponible',
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    // Group grades by subject
    final bySubject = <String, List<Grade>>{};
    for (final g in _grades) {
      final key = g.subjectName ?? g.subjectId;
      bySubject.putIfAbsent(key, () => []).add(g);
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(
            Theme.of(context).colorScheme.primary.withAlpha(25),
          ),
          columns: const [
            DataColumn(label: Text('Matière')),
            DataColumn(label: Text('Type'), numeric: false),
            DataColumn(label: Text('Note'), numeric: true),
            DataColumn(label: Text('/'), numeric: true),
            DataColumn(label: Text('Moy'), numeric: true),
          ],
          rows: bySubject.entries.expand((entry) {
            final subjectGrades = entry.value;
            final avg = subjectGrades.isNotEmpty
                ? subjectGrades.map((g) => g.score).reduce((a, b) => a + b) /
                      subjectGrades.length
                : 0.0;

            return subjectGrades.asMap().entries.map((e) {
              final g = e.value;
              final isFirst = e.key == 0;
              final isLast = e.key == subjectGrades.length - 1;

              return DataRow(
                cells: [
                  DataCell(Text(isFirst ? entry.key : '')),
                  DataCell(Text(g.examTypeName ?? '')),
                  DataCell(Text(g.score.toStringAsFixed(1))),
                  DataCell(Text(g.maxScore.toStringAsFixed(0))),
                  DataCell(
                    isLast
                        ? Text(
                            avg.toStringAsFixed(2),
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: avg >= 10 ? Colors.green : Colors.red,
                            ),
                          )
                        : const Text(''),
                  ),
                ],
              );
            });
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildOverallAverage() {
    double overall = 0;
    if (_reportCards.isNotEmpty) {
      overall = _reportCards.first.generalAverage ?? 0;
    } else if (_grades.isNotEmpty) {
      overall =
          _grades.map((g) => g.score).reduce((a, b) => a + b) / _grades.length;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      color: overall >= 10 ? Colors.green.shade50 : Colors.red.shade50,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            overall >= 10 ? Icons.emoji_events : Icons.warning,
            color: overall >= 10 ? Colors.green : Colors.red,
          ),
          const SizedBox(width: 8),
          Text(
            'Moyenne Générale: ${overall.toStringAsFixed(2)} / 20',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: overall >= 10
                  ? Colors.green.shade800
                  : Colors.red.shade800,
            ),
          ),
        ],
      ),
    );
  }
}
