import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

import 'context_cubit.dart';

/// Persistent banner showing the active context with a switch button.
/// Only visible when user has multiple contexts.
class ContextBanner extends StatelessWidget {
  const ContextBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ContextCubit, ContextState>(
      builder: (context, state) {
        if (!state.hasMultiple || state.active == null) {
          return const SizedBox.shrink();
        }
        final active = state.active!;
        final color = _roleColor(active.role);

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.08),
            border: Border(
              bottom: BorderSide(color: color.withValues(alpha: 0.2)),
            ),
          ),
          child: Row(
            children: [
              Text(active.roleEmoji, style: const TextStyle(fontSize: 18)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${active.roleLabel}${active.schoolName != null ? ' · ${active.schoolName}' : ''}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              InkWell(
                onTap: () => context.go('/context-selector'),
                borderRadius: BorderRadius.circular(8),
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.swap_horiz_rounded, size: 18, color: color),
                      const SizedBox(width: 4),
                      Text(
                        'Changer',
                        style: Theme.of(context).textTheme.labelSmall?.copyWith(
                          color: color,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Color _roleColor(String role) => switch (role) {
    'STUDENT' => const Color(0xFF059669),
    'TEACHER' => const Color(0xFF2563EB),
    'PARENT' => const Color(0xFFD97706),
    'ADMIN' || 'DIRECTOR' => const Color(0xFF7C3AED),
    'SUPER_ADMIN' => const Color(0xFFDC2626),
    'DRIVER' => const Color(0xFF0891B2),
    'ACCOUNTANT' => const Color(0xFF059669),
    _ => const Color(0xFF059669),
  };
}

/// Switch context button for AppBar — shows ⇄ icon only when multi-context.
class ContextSwitchButton extends StatelessWidget {
  const ContextSwitchButton({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ContextCubit, ContextState>(
      builder: (context, state) {
        if (!state.hasMultiple) return const SizedBox.shrink();
        return IconButton(
          icon: const Icon(Icons.swap_horiz_rounded),
          tooltip: 'Changer d\'espace',
          onPressed: () => context.go('/context-selector'),
        );
      },
    );
  }
}
