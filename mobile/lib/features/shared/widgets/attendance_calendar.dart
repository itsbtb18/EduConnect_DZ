import 'package:flutter/material.dart';

/// Reusable calendar widget that visualizes attendance for a month.
///
/// Each day is color-coded:
/// - Green: present
/// - Red: absent
/// - Orange: late
/// - Blue: excused
/// - Grey: no data / weekend
class AttendanceCalendar extends StatelessWidget {
  /// Year to display.
  final int year;

  /// Month (1-12) to display.
  final int month;

  /// Map of day number → status string ('present', 'absent', 'late', 'excused').
  final Map<int, String> dayStatuses;

  /// Callback when a day is tapped.
  final void Function(int day, String? status)? onDayTap;

  const AttendanceCalendar({
    super.key,
    required this.year,
    required this.month,
    required this.dayStatuses,
    this.onDayTap,
  });

  @override
  Widget build(BuildContext context) {
    final daysInMonth = DateUtils.getDaysInMonth(year, month);
    final firstWeekday = DateTime(year, month, 1).weekday; // 1=Mon, 7=Sun

    // Build grid cells: blanks for offset, then day cells
    final cells = <Widget>[];

    // Blank cells for days before the 1st
    for (var i = 1; i < firstWeekday; i++) {
      cells.add(const SizedBox());
    }

    // Day cells
    for (var day = 1; day <= daysInMonth; day++) {
      final status = dayStatuses[day];
      final date = DateTime(year, month, day);
      final isWeekend =
          date.weekday == 5 || date.weekday == 6; // Fri/Sat in Algeria

      cells.add(
        _DayCell(
          day: day,
          status: status,
          isWeekend: isWeekend,
          onTap: onDayTap != null ? () => onDayTap!(day, status) : null,
        ),
      );
    }

    return Column(
      children: [
        // Header row: day names
        _buildWeekdayHeader(context),
        const SizedBox(height: 4),
        // Calendar grid
        GridView.count(
          crossAxisCount: 7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 2,
          crossAxisSpacing: 2,
          children: cells,
        ),
        const SizedBox(height: 8),
        // Legend
        _buildLegend(context),
      ],
    );
  }

  Widget _buildWeekdayHeader(BuildContext context) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return Row(
      children: days.map((d) {
        final isWeekend = d == 'Fri' || d == 'Sat';
        return Expanded(
          child: Center(
            child: Text(
              d,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: isWeekend ? Colors.grey.shade400 : Colors.grey.shade700,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildLegend(BuildContext context) {
    return Wrap(
      spacing: 12,
      runSpacing: 4,
      children: [
        _legendItem(Colors.green, 'Present'),
        _legendItem(Colors.red, 'Absent'),
        _legendItem(Colors.orange, 'Late'),
        _legendItem(Colors.blue, 'Excused'),
      ],
    );
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color.withAlpha(180),
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11)),
      ],
    );
  }
}

class _DayCell extends StatelessWidget {
  final int day;
  final String? status;
  final bool isWeekend;
  final VoidCallback? onTap;

  const _DayCell({
    required this.day,
    this.status,
    this.isWeekend = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = _statusColor();
    final textColor = status != null ? Colors.white : Colors.black87;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Center(
          child: Text(
            '$day',
            style: TextStyle(
              fontSize: 12,
              fontWeight: status != null ? FontWeight.bold : FontWeight.normal,
              color: textColor,
            ),
          ),
        ),
      ),
    );
  }

  Color _statusColor() {
    if (status == null) {
      return isWeekend ? Colors.grey.shade100 : Colors.transparent;
    }
    switch (status) {
      case 'present':
        return Colors.green.withAlpha(180);
      case 'absent':
        return Colors.red.withAlpha(180);
      case 'late':
        return Colors.orange.withAlpha(180);
      case 'excused':
        return Colors.blue.withAlpha(180);
      default:
        return Colors.grey.shade200;
    }
  }
}
