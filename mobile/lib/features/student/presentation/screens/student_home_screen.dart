import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/context/context_banner.dart';
import '../../../../core/theme/app_theme.dart';

/// Student home screen with bottom navigation bar and drawer
class StudentHomeScreen extends StatelessWidget {
  final Widget child;

  const StudentHomeScreen({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/student/grades')) return 1;
    if (location.startsWith('/student/schedule')) return 2;
    if (location.startsWith('/student/homework')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('ILMI'),
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
              backgroundColor: AppColors.primary,
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
              context.go('/student');
            case 1:
              context.go('/student/grades');
            case 2:
              context.go('/student/schedule');
            case 3:
              context.go('/student/homework');
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Accueil',
          ),
          NavigationDestination(
            icon: Icon(Icons.grade_outlined),
            selectedIcon: Icon(Icons.grade),
            label: 'Notes',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today),
            label: 'Emploi',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment),
            label: 'Devoirs',
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
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, Color(0xFF065F46)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.white24,
                  child: Icon(Icons.school, size: 28, color: Colors.white),
                ),
                const SizedBox(height: 12),
                Text(
                  'Espace Élève',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          _DrawerItem(
            icon: Icons.badge_outlined,
            label: 'Carte d\'identité',
            onTap: () => _navigateFromDrawer(context, '/student/id-card'),
          ),
          _DrawerItem(
            icon: Icons.menu_book_outlined,
            label: 'E-Learning',
            onTap: () => _navigateFromDrawer(context, '/student/elearning'),
          ),
          _DrawerItem(
            icon: Icons.local_library_outlined,
            label: 'Bibliothèque',
            onTap: () => _navigateFromDrawer(context, '/student/library'),
          ),
          _DrawerItem(
            icon: Icons.restaurant_outlined,
            label: 'Cantine',
            onTap: () => _navigateFromDrawer(context, '/student/canteen'),
          ),
          _DrawerItem(
            icon: Icons.directions_bus_outlined,
            label: 'Transport',
            onTap: () => _navigateFromDrawer(context, '/student/transport'),
          ),
          _DrawerItem(
            icon: Icons.emoji_events_outlined,
            label: 'Gamification',
            onTap: () => _navigateFromDrawer(context, '/student/gamification'),
          ),
          const Divider(),
          _DrawerItem(
            icon: Icons.smart_toy_outlined,
            label: 'Assistant IA',
            onTap: () => _navigateFromDrawer(context, '/chatbot'),
          ),
          _DrawerItem(
            icon: Icons.person_outline,
            label: 'Mon profil',
            onTap: () => _navigateFromDrawer(context, '/profile'),
          ),
        ],
      ),
    );
  }

  void _navigateFromDrawer(BuildContext context, String path) {
    Navigator.of(context).pop(); // close drawer
    context.push(path);
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _DrawerItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppColors.primary),
      title: Text(label),
      onTap: onTap,
      dense: true,
    );
  }
}
