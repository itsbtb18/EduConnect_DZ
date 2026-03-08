import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/context/context_banner.dart';
import '../../../../core/theme/app_theme.dart';

/// Trainer shell providing AppBar + bottom nav + drawer.
class TrainerHomeScreen extends StatelessWidget {
  final Widget child;

  const TrainerHomeScreen({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/trainer/attendance')) return 1;
    if (location.startsWith('/trainer/evaluations')) return 2;
    if (location.startsWith('/trainer/schedule')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ILMI — Formateur'),
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
              context.go('/trainer');
            case 1:
              context.go('/trainer/attendance');
            case 2:
              context.go('/trainer/evaluations');
            case 3:
              context.go('/trainer/schedule');
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Accueil',
          ),
          NavigationDestination(
            icon: Icon(Icons.fact_check_outlined),
            selectedIcon: Icon(Icons.fact_check),
            label: 'Présence',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment),
            label: 'Évaluations',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month),
            label: 'Planning',
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
                  'Espace Formateur',
                  style: TextStyle(color: Colors.white, fontSize: 20),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.assignment),
            title: const Text('Devoirs & Ressources'),
            onTap: () {
              Navigator.pop(context);
              context.go('/trainer/homework');
            },
          ),
          ListTile(
            leading: const Icon(Icons.cancel_outlined),
            title: const Text('Annuler une séance'),
            onTap: () {
              Navigator.pop(context);
              context.go('/trainer/cancel-session');
            },
          ),
          ListTile(
            leading: const Icon(Icons.access_time),
            title: const Text('Heures & Salaire'),
            onTap: () {
              Navigator.pop(context);
              context.go('/trainer/hours');
            },
          ),
          ListTile(
            leading: const Icon(Icons.menu_book),
            title: const Text('Journal de formation'),
            onTap: () {
              Navigator.pop(context);
              context.go('/trainer/journal');
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
