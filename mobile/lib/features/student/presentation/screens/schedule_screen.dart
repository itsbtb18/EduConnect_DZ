import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/app_constants.dart';

/// Weekly schedule screen (Sunday to Thursday — Algerian school week)
class ScheduleScreen extends StatelessWidget {
  const ScheduleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Connect to AcademicBloc and load actual schedule
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Emploi du Temps',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Day selector (Sun-Thu)
          DefaultTabController(
            length: 5,
            initialIndex: _todayTabIndex(),
            child: Expanded(
              child: Column(
                children: [
                  TabBar(
                    isScrollable: true,
                    tabs: AppConstants.schoolDays
                        .map((day) => Tab(text: day))
                        .toList(),
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: TabBarView(
                      children: AppConstants.schoolDays
                          .map((_) => _buildDaySchedule())
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Get current day tab index (0=Sunday ... 4=Thursday)
  int _todayTabIndex() {
    final weekday = DateTime.now().weekday; // 1=Mon ... 7=Sun
    // Map: Sun(7)->0, Mon(1)->1, Tue(2)->2, Wed(3)->3, Thu(4)->4
    if (weekday == 7) return 0;
    if (weekday >= 1 && weekday <= 4) return weekday;
    return 0; // Default to Sunday for Fri/Sat
  }

  Widget _buildDaySchedule() {
    // Placeholder — will be replaced with BLoC-driven schedule data
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.calendar_today_outlined,
            size: 64,
            color: AppColors.textHint,
          ),
          SizedBox(height: 16),
          Text(
            'L\'emploi du temps sera affiché ici',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
