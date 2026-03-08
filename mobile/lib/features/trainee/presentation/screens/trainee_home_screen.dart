import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/context/context_banner.dart';
import '../../../../core/theme/app_theme.dart';

/// Trainee shell providing AppBar + bottom nav + drawer.
class TraineeHomeScreen extends StatelessWidget {
  final Widget child;

  const TraineeHomeScreen({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/trainee/formations')) return 1;
    if (location.startsWith('/trainee/schedule')) return 2;
    if (location.startsWith('/trainee/results')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ILMI — Apprenant'),
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
              context.go('/trainee');
            case 1:
              context.go('/trainee/formations');
            case 2:
              context.go('/trainee/schedule');
            case 3:
              context.go('/trainee/results');
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Accueil',
          ),
          NavigationDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school),
            label: 'Formations',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_month_outlined),
            selectedIcon: Icon(Icons.calendar_month),
            label: 'Planning',
          ),
          NavigationDestination(
            icon: Icon(Icons.emoji_events_outlined),
            selectedIcon: Icon(Icons.emoji_events),
            label: 'Résultats',
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
                  'Espace Apprenant',
                  style: TextStyle(color: Colors.white, fontSize: 20),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.payments_outlined),
            title: const Text('Paiements'),
            onTap: () {
              Navigator.pop(context);
              context.go('/trainee/payments');
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
