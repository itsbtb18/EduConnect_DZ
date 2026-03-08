import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/data/models/user_model.dart';
import '../context/context_cubit.dart';
import '../theme/app_theme.dart';

/// Elegant context selector screen shown when a user has multiple roles/schools.
class ContextSelectorScreen extends StatelessWidget {
  const ContextSelectorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ContextCubit, ContextState>(
      listener: (context, state) {
        if (state.active != null) {
          _navigateToRoleHome(context, state.active!);
        }
      },
      builder: (context, state) {
        return Scaffold(
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 40),
                  // Header
                  Icon(
                    Icons.swap_horiz_rounded,
                    size: 56,
                    color: AppColors.primary,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Choisir un espace',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Vous avez plusieurs rôles. Sélectionnez l\'espace dans lequel vous souhaitez travailler.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 32),
                  // Context cards
                  Expanded(
                    child: ListView.separated(
                      itemCount: state.contexts.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final ctx = state.contexts[index];
                        return _ContextCard(
                          userContext: ctx,
                          onTap: () {
                            context.read<ContextCubit>().switchContext(ctx);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _navigateToRoleHome(BuildContext context, UserContext active) {
    final path = switch (active.role) {
      'STUDENT' => '/student',
      'TEACHER' => '/teacher',
      'PARENT' => '/parent',
      'ADMIN' || 'DIRECTOR' || 'ACCOUNTANT' => '/teacher',
      'SUPER_ADMIN' => '/teacher',
      _ => '/student',
    };
    context.go(path);
  }
}

class _ContextCard extends StatelessWidget {
  final UserContext userContext;
  final VoidCallback onTap;

  const _ContextCard({required this.userContext, required this.onTap});

  Color get _roleColor => switch (userContext.role) {
    'STUDENT' => AppColors.primary,
    'TEACHER' => AppColors.secondary,
    'PARENT' => AppColors.accent,
    'ADMIN' || 'DIRECTOR' => const Color(0xFF7C3AED),
    'SUPER_ADMIN' => const Color(0xFFDC2626),
    'DRIVER' => const Color(0xFF0891B2),
    'ACCOUNTANT' => const Color(0xFF059669),
    _ => AppColors.primary,
  };

  IconData get _roleIcon => switch (userContext.role) {
    'STUDENT' => Icons.school_rounded,
    'TEACHER' => Icons.menu_book_rounded,
    'PARENT' => Icons.family_restroom_rounded,
    'ADMIN' => Icons.admin_panel_settings_rounded,
    'DIRECTOR' => Icons.business_rounded,
    'SUPER_ADMIN' => Icons.shield_rounded,
    'DRIVER' => Icons.directions_bus_rounded,
    'ACCOUNTANT' => Icons.account_balance_rounded,
    _ => Icons.person_rounded,
  };

  @override
  Widget build(BuildContext context) {
    final color = _roleColor;
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: color.withValues(alpha: 0.2)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              // Role icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(_roleIcon, size: 28, color: color),
              ),
              const SizedBox(width: 16),
              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      userContext.roleLabel,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: color,
                      ),
                    ),
                    if (userContext.schoolName != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        userContext.schoolName!,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                    // Subtitle info
                    if (userContext.children.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        userContext.children.map((c) => c.fullName).join(', '),
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    if (userContext.type == 'FORMATION') ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Centre de formation',
                          style: Theme.of(context).textTheme.labelSmall
                              ?.copyWith(color: const Color(0xFF92400E)),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: color.withValues(alpha: 0.5),
                size: 28,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
