import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_theme.dart';

/// Teacher home screen with bottom navigation
class TeacherHomeScreen extends StatelessWidget {
  final Widget child;

  const TeacherHomeScreen({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/teacher/grades')) return 2;
    if (location.startsWith('/teacher/attendance')) return 3;
    if (location.startsWith('/teacher/homework')) return 1;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('EduConnect — Enseignant'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.chat_bubble_outline),
            onPressed: () => context.push('/chat'),
          ),
          IconButton(
            icon: const CircleAvatar(
              radius: 14,
              backgroundColor: AppColors.secondary,
              child: Icon(Icons.person, size: 16, color: Colors.white),
            ),
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex(context),
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/teacher');
            case 1:
              context.go('/teacher/homework');
            case 2:
              context.go('/teacher/grades');
            case 3:
              context.go('/teacher/attendance');
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Accueil',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outlined),
            selectedIcon: Icon(Icons.people),
            label: 'Élèves',
          ),
          NavigationDestination(
            icon: Icon(Icons.edit_note_outlined),
            selectedIcon: Icon(Icons.edit_note),
            label: 'Notes',
          ),
          NavigationDestination(
            icon: Icon(Icons.fact_check_outlined),
            selectedIcon: Icon(Icons.fact_check),
            label: 'Présence',
          ),
        ],
      ),
    );
  }
}
