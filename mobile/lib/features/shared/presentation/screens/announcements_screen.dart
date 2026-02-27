import 'package:flutter/material.dart';

import '../../../../core/theme/app_theme.dart';

/// Announcements screen (shared between all roles)
class AnnouncementsScreen extends StatelessWidget {
  const AnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Annonces')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.campaign_outlined, size: 64, color: AppColors.textHint),
            SizedBox(height: 16),
            Text(
              'Les annonces seront affichées ici',
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}
