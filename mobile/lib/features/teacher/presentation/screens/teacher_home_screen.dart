import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/context/context_banner.dart';
import '../../../../core/theme/app_theme.dart';

/// Teacher home screen with bottom navigation and drawer for extra features
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
        title: const Text('ILMI — Enseignant'),
        actions: [
          const ContextSwitchButton(),
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
      drawer: _buildDrawer(context),
      body: Column(
        children: [
          const ContextBanner(),
          Expanded(child: child),
        ],
      ),
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
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment),
            label: 'Devoirs',
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

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary,
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Icon(Icons.school, color: Colors.white, size: 40),
                SizedBox(height: 8),
                Text(
                  'Espace Enseignant',
                  style: TextStyle(color: Colors.white, fontSize: 20),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.menu_book),
            title: const Text('Cahier de Texte'),
            onTap: () {
              Navigator.pop(context);
              context.go('/teacher/textbook');
            },
          ),
          ListTile(
            leading: const Icon(Icons.folder_open),
            title: const Text('Ressources Pédagogiques'),
            onTap: () {
              Navigator.pop(context);
              context.go('/teacher/resources');
            },
          ),
          ListTile(
            leading: const Icon(Icons.receipt_long),
            title: const Text('Fiches de Paie'),
            onTap: () {
              Navigator.pop(context);
              context.go('/teacher/payslip');
            },
          ),
          ListTile(
            leading: const Icon(Icons.campaign),
            title: const Text('Communication'),
            onTap: () {
              Navigator.pop(context);
              context.go('/teacher/communication');
            },
          ),
          ListTile(
            leading: const Icon(Icons.assessment),
            title: const Text('Examens & Évaluations'),
            onTap: () {
              Navigator.pop(context);
              context.go('/teacher/exams');
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.smart_toy_outlined),
            title: const Text('Assistant IA'),
            onTap: () {
              Navigator.pop(context);
              context.push('/chatbot');
            },
          ),
          ListTile(
            leading: const Icon(Icons.announcement_outlined),
            title: const Text('Annonces'),
            onTap: () {
              Navigator.pop(context);
              context.push('/announcements');
            },
          ),
        ],
      ),
    );
  }
}
