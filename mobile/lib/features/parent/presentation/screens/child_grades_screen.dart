import 'package:flutter/material.dart';

/// Parent screen to view their child's grades and report cards.
class ChildGradesScreen extends StatefulWidget {
  const ChildGradesScreen({super.key});

  @override
  State<ChildGradesScreen> createState() => _ChildGradesScreenState();
}

class _ChildGradesScreenState extends State<ChildGradesScreen> {
  int _selectedTrimester = 1;

  // Placeholder data — replace with BLoC/repository
  final _children = [
    {'id': '1', 'name': 'Ahmed Benali', 'classroom': '1AM - A'},
    {'id': '2', 'name': 'Sara Benali', 'classroom': '3AM - B'},
  ];
  String? _selectedChildId;

  final _grades = [
    {
      'subject': 'Mathématiques',
      'coeff': 5,
      'devoir1': 14.5,
      'devoir2': 16.0,
      'comp': 15.0,
      'avg': 15.13,
    },
    {
      'subject': 'Physique',
      'coeff': 4,
      'devoir1': 12.0,
      'devoir2': 13.5,
      'comp': 14.0,
      'avg': 13.38,
    },
    {
      'subject': 'Sciences Naturelles',
      'coeff': 3,
      'devoir1': 16.0,
      'devoir2': 15.0,
      'comp': 17.0,
      'avg': 16.25,
    },
    {
      'subject': 'Langue Arabe',
      'coeff': 5,
      'devoir1': 13.0,
      'devoir2': 14.0,
      'comp': 13.5,
      'avg': 13.50,
    },
    {
      'subject': 'Langue Française',
      'coeff': 4,
      'devoir1': 11.0,
      'devoir2': 12.0,
      'comp': 12.5,
      'avg': 12.00,
    },
    {
      'subject': 'Anglais',
      'coeff': 3,
      'devoir1': 15.0,
      'devoir2': 16.0,
      'comp': 15.5,
      'avg': 15.50,
    },
    {
      'subject': 'Histoire-Géo',
      'coeff': 2,
      'devoir1': 14.0,
      'devoir2': 13.0,
      'comp': 14.5,
      'avg': 14.00,
    },
  ];

  @override
  void initState() {
    super.initState();
    _selectedChildId = _children.first['id'];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notes de mon enfant')),
      body: Column(
        children: [
          _buildChildSelector(),
          _buildTrimesterSelector(),
          const Divider(height: 1),
          Expanded(child: _buildGradesTable()),
          _buildOverallAverage(),
        ],
      ),
    );
  }

  Widget _buildChildSelector() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: DropdownButtonFormField<String>(
        initialValue: _selectedChildId,
        decoration: const InputDecoration(
          labelText: 'Enfant',
          border: OutlineInputBorder(),
          isDense: true,
          prefixIcon: Icon(Icons.child_care),
        ),
        items: _children
            .map(
              (c) => DropdownMenuItem(
                value: c['id'],
                child: Text('${c['name']} — ${c['classroom']}'),
              ),
            )
            .toList(),
        onChanged: (v) => setState(() => _selectedChildId = v),
      ),
    );
  }

  Widget _buildTrimesterSelector() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: SegmentedButton<int>(
        segments: const [
          ButtonSegment(value: 1, label: Text('Trimestre 1')),
          ButtonSegment(value: 2, label: Text('Trimestre 2')),
          ButtonSegment(value: 3, label: Text('Trimestre 3')),
        ],
        selected: {_selectedTrimester},
        onSelectionChanged: (s) => setState(() => _selectedTrimester = s.first),
      ),
    );
  }

  Widget _buildGradesTable() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(
            Theme.of(context).colorScheme.primary.withAlpha(25),
          ),
          columns: const [
            DataColumn(label: Text('Matière')),
            DataColumn(label: Text('Coeff'), numeric: true),
            DataColumn(label: Text('D1'), numeric: true),
            DataColumn(label: Text('D2'), numeric: true),
            DataColumn(label: Text('Comp'), numeric: true),
            DataColumn(label: Text('Moy'), numeric: true),
          ],
          rows: _grades.map((g) {
            final avg = g['avg'] as double;
            return DataRow(
              cells: [
                DataCell(Text(g['subject'] as String)),
                DataCell(Text('${g['coeff']}')),
                DataCell(Text('${g['devoir1']}')),
                DataCell(Text('${g['devoir2']}')),
                DataCell(Text('${g['comp']}')),
                DataCell(
                  Text(
                    avg.toStringAsFixed(2),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: avg >= 10 ? Colors.green : Colors.red,
                    ),
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildOverallAverage() {
    // Calculate weighted overall
    double totalWeighted = 0;
    int totalCoeff = 0;
    for (final g in _grades) {
      final coeff = g['coeff'] as int;
      final avg = g['avg'] as double;
      totalWeighted += avg * coeff;
      totalCoeff += coeff;
    }
    final overall = totalCoeff > 0 ? totalWeighted / totalCoeff : 0.0;

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
