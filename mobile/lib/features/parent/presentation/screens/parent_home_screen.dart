import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/context/context_banner.dart';
import '../../../../core/theme/app_theme.dart';
import '../bloc/child_selector_cubit.dart';
import '../widgets/child_selector_widget.dart';

/// Parent home screen with bottom navigation, child selector & drawer.
class ParentHomeScreen extends StatelessWidget {
  final Widget child;

  const ParentHomeScreen({super.key, required this.child});

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    if (location.startsWith('/parent/grades')) return 1;
    if (location.startsWith('/parent/attendance')) return 2;
    if (location.startsWith('/parent/medical')) return 3;
    if (location.startsWith('/parent/finance')) return 4;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ChildSelectorCubit()..loadChildren(),
      child: Builder(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: const ChildSelectorWidget(),
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
                  backgroundColor: AppColors.accent,
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
                  context.go('/parent');
                case 1:
                  context.go('/parent/grades');
                case 2:
                  context.go('/parent/attendance');
                case 3:
                  context.go('/parent/medical');
                case 4:
                  context.go('/parent/finance');
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
                icon: Icon(Icons.event_busy_outlined),
                selectedIcon: Icon(Icons.event_busy),
                label: 'Présence',
              ),
              NavigationDestination(
                icon: Icon(Icons.medical_services_outlined),
                selectedIcon: Icon(Icons.medical_services),
                label: 'Santé',
              ),
              NavigationDestination(
                icon: Icon(Icons.payments_outlined),
                selectedIcon: Icon(Icons.payments),
                label: 'Paiements',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(color: AppColors.primary),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Icon(Icons.family_restroom, size: 40, color: Colors.white),
                SizedBox(height: 8),
                Text(
                  'Espace Parent',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          _drawerItem(context, Icons.restaurant, 'Cantine', '/parent/canteen'),
          _drawerItem(
            context,
            Icons.directions_bus,
            'Transport',
            '/parent/transport',
          ),
          _drawerItem(
            context,
            Icons.description,
            'Bulletins',
            '/parent/report-cards',
          ),
          _drawerItem(
            context,
            Icons.edit_document,
            'Justifications',
            '/parent/absence-excuses',
          ),
          _drawerItem(
            context,
            Icons.local_library,
            'Bibliothèque',
            '/parent/library',
          ),
          _drawerItem(context, Icons.school, 'E-Learning', '/parent/elearning'),
          const Divider(),
          _drawerItem(
            context,
            Icons.settings,
            'Préférences',
            '/parent/preferences',
          ),
        ],
      ),
    );
  }

  Widget _drawerItem(
    BuildContext context,
    IconData icon,
    String label,
    String route,
  ) {
    return ListTile(
      leading: Icon(icon),
      title: Text(label),
      onTap: () {
        Navigator.pop(context); // close drawer
        context.push(route);
      },
    );
  }
}
