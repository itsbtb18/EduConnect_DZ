import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../core/theme/app_theme.dart';
import '../bloc/gamification_cubit.dart';

/// Full badge collection screen — earned and locked badges.
class BadgesScreen extends StatelessWidget {
  const BadgesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes Badges 🏅'), centerTitle: true),
      body: BlocBuilder<GamificationCubit, GamificationState>(
        builder: (context, state) {
          if (state is! GamificationLoaded) {
            return const Center(child: CircularProgressIndicator());
          }
          final earned = state.myBadges;
          final earnedIds = earned.map((b) => b.badgeId).toSet();
          final locked = state.allBadges
              .where((b) => !earnedIds.contains(b.id))
              .toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (earned.isNotEmpty) ...[
                Text(
                  'Badges gagnés (${earned.length})',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                _BadgeGridView(
                  items: earned
                      .map(
                        (b) => _BadgeDisplayItem(
                          icon: b.badgeIcon,
                          name: b.badgeName,
                          description: b.badgeDescription,
                          category: b.badgeCategory,
                          earned: true,
                          earnedAt: b.earnedAt,
                          points: b.pointsReward,
                        ),
                      )
                      .toList(),
                ),
                const SizedBox(height: 24),
              ],
              if (locked.isNotEmpty) ...[
                Text(
                  'Badges à débloquer (${locked.length})',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 12),
                _BadgeGridView(
                  items: locked
                      .map(
                        (b) => _BadgeDisplayItem(
                          icon: b.icon,
                          name: b.name,
                          description: b.description,
                          category: b.category,
                          earned: false,
                          points: b.pointsReward,
                        ),
                      )
                      .toList(),
                ),
              ],
              if (earned.isEmpty && locked.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 48),
                    child: Text(
                      'Aucun badge disponible pour le moment',
                      style: TextStyle(color: AppColors.textSecondary),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _BadgeDisplayItem {
  final String icon;
  final String name;
  final String description;
  final String category;
  final bool earned;
  final String? earnedAt;
  final int points;

  const _BadgeDisplayItem({
    required this.icon,
    required this.name,
    this.description = '',
    this.category = '',
    required this.earned,
    this.earnedAt,
    this.points = 0,
  });
}

class _BadgeGridView extends StatelessWidget {
  final List<_BadgeDisplayItem> items;
  const _BadgeGridView({required this.items});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.75,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return GestureDetector(
          onTap: () => _showBadgeDetail(context, item),
          child: Column(
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: item.earned
                      ? AppColors.accent.withValues(alpha: 0.15)
                      : Colors.grey.withValues(alpha: 0.1),
                  border: Border.all(
                    color: item.earned
                        ? AppColors.accent
                        : Colors.grey.shade300,
                    width: 3,
                  ),
                  boxShadow: item.earned
                      ? [
                          BoxShadow(
                            color: AppColors.accent.withValues(alpha: 0.25),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ]
                      : null,
                ),
                child: Center(
                  child: Text(
                    item.icon,
                    style: TextStyle(
                      fontSize: 32,
                      color: item.earned ? null : Colors.grey,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                item.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: item.earned ? FontWeight.w600 : FontWeight.normal,
                  color: item.earned
                      ? AppColors.textPrimary
                      : AppColors.textHint,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showBadgeDetail(BuildContext context, _BadgeDisplayItem item) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(item.icon, style: const TextStyle(fontSize: 56)),
            const SizedBox(height: 12),
            Text(
              item.name,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            if (item.description.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                item.description,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
            const SizedBox(height: 12),
            if (item.points > 0)
              Chip(
                label: Text('+${item.points} points'),
                backgroundColor: AppColors.accent.withValues(alpha: 0.1),
              ),
            if (item.earned && item.earnedAt != null) ...[
              const SizedBox(height: 8),
              Text(
                'Obtenu le ${_formatDate(item.earnedAt!)}',
                style: const TextStyle(fontSize: 12, color: AppColors.textHint),
              ),
            ],
            if (!item.earned)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.lock_outline,
                      size: 16,
                      color: AppColors.textHint,
                    ),
                    const SizedBox(width: 4),
                    const Text(
                      'Pas encore débloqué',
                      style: TextStyle(fontSize: 12, color: AppColors.textHint),
                    ),
                  ],
                ),
              ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      return iso;
    }
  }
}
