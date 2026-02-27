import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

/// Homework list and submission screen for students
class HomeworkScreen extends StatelessWidget {
  const HomeworkScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // TODO: Connect to HomeworkBloc and load actual data
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Mes Devoirs',
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),

          // Filter tabs
          DefaultTabController(
            length: 3,
            child: Expanded(
              child: Column(
                children: [
                  const TabBar(
                    tabs: [
                      Tab(text: 'À faire'),
                      Tab(text: 'Soumis'),
                      Tab(text: 'Noté'),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: TabBarView(
                      children: [
                        _buildHomeworkList('pending'),
                        _buildHomeworkList('submitted'),
                        _buildHomeworkList('graded'),
                      ],
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

  Widget _buildHomeworkList(String filter) {
    // Placeholder — will be replaced with BLoC-driven data
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.assignment_outlined, size: 64, color: AppColors.textHint),
          SizedBox(height: 16),
          Text(
            'Les devoirs seront affichés ici',
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
