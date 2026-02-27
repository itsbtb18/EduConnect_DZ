import 'package:flutter/material.dart';

/// Reusable card widget for displaying a grade/subject score.
class GradeCard extends StatelessWidget {
  final String subjectName;
  final double average;
  final int coefficient;
  final double? previousAverage;
  final VoidCallback? onTap;

  const GradeCard({
    super.key,
    required this.subjectName,
    required this.average,
    required this.coefficient,
    this.previousAverage,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = _gradeColor(average);
    final trend = previousAverage != null ? average - previousAverage! : null;

    return Card(
      elevation: 1,
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color.withAlpha(75)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Average badge
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: color.withAlpha(30),
                  shape: BoxShape.circle,
                  border: Border.all(color: color, width: 2),
                ),
                child: Center(
                  child: Text(
                    average.toStringAsFixed(1),
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Subject info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subjectName,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Coefficient: $coefficient',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              // Trend indicator
              if (trend != null)
                _TrendBadge(trend: trend)
              else
                const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }

  Color _gradeColor(double grade) {
    if (grade >= 16) return Colors.green.shade700;
    if (grade >= 14) return Colors.green;
    if (grade >= 12) return Colors.lightGreen;
    if (grade >= 10) return Colors.orange;
    if (grade >= 8) return Colors.deepOrange;
    return Colors.red;
  }
}

class _TrendBadge extends StatelessWidget {
  final double trend;

  const _TrendBadge({required this.trend});

  @override
  Widget build(BuildContext context) {
    final isUp = trend > 0;
    final isFlat = trend.abs() < 0.1;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isFlat
            ? Colors.grey.shade100
            : (isUp ? Colors.green.shade50 : Colors.red.shade50),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isFlat
                ? Icons.remove
                : (isUp ? Icons.arrow_upward : Icons.arrow_downward),
            size: 14,
            color: isFlat ? Colors.grey : (isUp ? Colors.green : Colors.red),
          ),
          const SizedBox(width: 2),
          Text(
            '${trend > 0 ? '+' : ''}${trend.toStringAsFixed(1)}',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isFlat ? Colors.grey : (isUp ? Colors.green : Colors.red),
            ),
          ),
        ],
      ),
    );
  }
}
