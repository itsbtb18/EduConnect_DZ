import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';

/// Notifications screen (shared between all roles)
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Toutes les notifications marquées comme lues'),
                ),
              );
            },
            child: const Text('Tout marquer lu'),
          ),
        ],
      ),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_outlined,
              size: 64,
              color: AppColors.textHint,
            ),
            SizedBox(height: 16),
            Text(
              'Aucune notification pour le moment',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
