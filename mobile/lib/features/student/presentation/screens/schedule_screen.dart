import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';
import '../../data/models/academic_model.dart';
import '../bloc/student_bloc.dart';

/// Subject-based color palette for consistent timetable coloring
const _subjectColors = <Color>[
  Color(0xFF3B82F6), // blue
  Color(0xFF22C55E), // green
  Color(0xFFF97316), // orange
  Color(0xFF8B5CF6), // purple
  Color(0xFF0D9488), // teal
  Color(0xFFEC4899), // pink
  Color(0xFF6366F1), // indigo
  Color(0xFFEAB308), // yellow
  Color(0xFFEF4444), // red
  Color(0xFF06B6D4), // cyan
];

/// Weekly schedule screen with day/week toggle (Sunday–Thursday)
class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  bool _weekView = false;
  final Map<String, Color> _subjectColorMap = {};

  @override
  void initState() {
    super.initState();
    context.read<StudentBloc>().add(StudentLoadSchedule());
  }

  int _todayTabIndex() {
    final weekday = DateTime.now().weekday; // 1=Mon…7=Sun
    if (weekday == 7) return 0;
    if (weekday >= 1 && weekday <= 4) return weekday;
    return 0;
  }

  Color _colorForSubject(String? subjectName) {
    if (subjectName == null || subjectName.isEmpty) return Colors.grey;
    return _subjectColorMap.putIfAbsent(subjectName, () {
      return _subjectColors[_subjectColorMap.length % _subjectColors.length];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header with toggle ──
          Row(
            children: [
              Expanded(
                child: Text(
                  'Emploi du Temps',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              SegmentedButton<bool>(
                segments: const [
                  ButtonSegment(
                    value: false,
                    icon: Icon(Icons.today, size: 18),
                    label: Text('Jour'),
                  ),
                  ButtonSegment(
                    value: true,
                    icon: Icon(Icons.view_week, size: 18),
                    label: Text('Semaine'),
                  ),
                ],
                selected: {_weekView},
                onSelectionChanged: (s) => setState(() => _weekView = s.first),
                style: ButtonStyle(
                  visualDensity: VisualDensity.compact,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ── Content ──
          Expanded(
            child: BlocBuilder<StudentBloc, StudentState>(
              builder: (context, state) {
                if (state is StudentLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state is StudentError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
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
                          onPressed: () => context.read<StudentBloc>().add(
                            StudentLoadSchedule(),
                          ),
                          child: const Text('Réessayer'),
                        ),
                      ],
                    ),
                  );
                }
                if (state is StudentScheduleLoaded) {
                  return _weekView
                      ? _buildWeekView(state.slots)
                      : _buildDayTabs(state.slots);
                }
                return const SizedBox.shrink();
              },
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Day Tabs View (existing behavior, improved)
  // ═══════════════════════════════════════════════════════════════════════

  Widget _buildDayTabs(List<ScheduleSlot> allSlots) {
    return DefaultTabController(
      length: 5,
      initialIndex: _todayTabIndex(),
      child: Column(
        children: [
          TabBar(
            isScrollable: true,
            tabs: AppConstants.schoolDays.map((day) => Tab(text: day)).toList(),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: TabBarView(
              children: List.generate(5, (dayIndex) {
                final daySlots =
                    allSlots.where((s) => s.dayOfWeek == dayIndex).toList()
                      ..sort((a, b) => a.startTime.compareTo(b.startTime));
                return _buildDaySchedule(daySlots);
              }),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDaySchedule(List<ScheduleSlot> slots) {
    if (slots.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.free_breakfast, size: 48, color: AppColors.textHint),
            SizedBox(height: 12),
            Text(
              'Pas de cours ce jour',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: slots.length,
      itemBuilder: (context, index) {
        final slot = slots[index];
        final color = _colorForSubject(slot.subjectName);
        return _SlotCard(slot: slot, color: color);
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Week Grid View (new)
  // ═══════════════════════════════════════════════════════════════════════

  Widget _buildWeekView(List<ScheduleSlot> allSlots) {
    // Collect unique time slots
    final timeSlots = <String>{};
    for (final s in allSlots) {
      timeSlots.add(
        '${s.startTime.substring(0, 5)}-${s.endTime.substring(0, 5)}',
      );
    }
    final sortedTimes = timeSlots.toList()..sort();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          headingRowHeight: 40,
          dataRowMinHeight: 56,
          dataRowMaxHeight: 72,
          columnSpacing: 8,
          horizontalMargin: 4,
          columns: [
            const DataColumn(
              label: Text(
                'Heure',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
            ...List.generate(
              5,
              (i) => DataColumn(
                label: Text(
                  AppConstants.schoolDays[i].substring(0, 3),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ),
          ],
          rows: sortedTimes.map((time) {
            final parts = time.split('-');
            final start = parts[0];
            final end = parts[1];
            return DataRow(
              cells: [
                DataCell(
                  Text('$start\n$end', style: const TextStyle(fontSize: 11)),
                ),
                ...List.generate(5, (dayIndex) {
                  final slot = allSlots.firstWhere(
                    (s) =>
                        s.dayOfWeek == dayIndex &&
                        s.startTime.substring(0, 5) == start,
                    orElse: () => ScheduleSlot(
                      id: '',
                      dayOfWeek: dayIndex,
                      startTime: start,
                      endTime: end,
                      subjectId: '',
                    ),
                  );
                  if (slot.subjectName == null) {
                    return const DataCell(SizedBox.shrink());
                  }
                  final color = _colorForSubject(slot.subjectName);
                  return DataCell(
                    Container(
                      width: 80,
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: color.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                        border: Border(
                          left: BorderSide(color: color, width: 3),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            slot.subjectName!,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color: color,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (slot.room != null)
                            Text(
                              slot.room!,
                              style: const TextStyle(
                                fontSize: 9,
                                color: AppColors.textHint,
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Slot Card widget (color-coded by subject)
// ═══════════════════════════════════════════════════════════════════════════

class _SlotCard extends StatelessWidget {
  final ScheduleSlot slot;
  final Color color;
  const _SlotCard({required this.slot, required this.color});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Container(
        decoration: BoxDecoration(
          border: Border(left: BorderSide(color: color, width: 4)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: ListTile(
          leading: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                slot.startTime.substring(0, 5),
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              Text(
                slot.endTime.substring(0, 5),
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
          title: Text(
            slot.subjectName ?? 'Matière',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
          subtitle: Text(
            '${slot.teacherName ?? ''} • ${slot.room ?? ''}',
            style: const TextStyle(fontSize: 12),
          ),
          trailing: Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
        ),
      ),
    );
  }
}
