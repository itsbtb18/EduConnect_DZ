import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/child_model.dart';
import '../bloc/child_selector_cubit.dart';

/// Dropdown chip in AppBar to select which child's data to view.
/// Grouped by school for multi-establishment parents.
class ChildSelectorWidget extends StatelessWidget {
  final void Function(ChildProfile child)? onSelected;

  const ChildSelectorWidget({super.key, this.onSelected});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ChildSelectorCubit, ChildSelectorState>(
      builder: (context, state) {
        if (state is! ChildSelectorLoaded) return const SizedBox.shrink();
        if (state.children.length <= 1) {
          // Single child — just show name
          final child = state.selected;
          if (child == null) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Chip(
              avatar: const Icon(Icons.child_care, size: 18),
              label: Text(child.fullName, style: const TextStyle(fontSize: 13)),
            ),
          );
        }

        // Multi-child — tappable dropdown
        return InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => _showChildPicker(context, state),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Stack(
                  children: [
                    const Icon(Icons.child_care, size: 20),
                    if ((state.selected?.unreadNotifications ?? 0) > 0)
                      Positioned(
                        right: -2,
                        top: -2,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '${state.selected!.unreadNotifications}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 6),
                Text(
                  state.selected?.firstName ?? '',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Icon(Icons.arrow_drop_down, size: 20),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showChildPicker(BuildContext context, ChildSelectorLoaded state) {
    final cubit = context.read<ChildSelectorCubit>();
    final bySchool = state.bySchool;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Padding(
              padding: EdgeInsets.all(16),
              child: Text(
                'Sélectionner un enfant',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
            const Divider(height: 1),
            ...bySchool.entries.expand(
              (entry) => [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: Row(
                    children: [
                      const Icon(Icons.school, size: 16, color: Colors.grey),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          entry.key,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                ...entry.value.map(
                  (child) => ListTile(
                    leading: CircleAvatar(
                      backgroundImage: child.avatar != null
                          ? NetworkImage(child.avatar!)
                          : null,
                      child: child.avatar == null
                          ? Text(
                              child.firstName.isNotEmpty
                                  ? child.firstName[0]
                                  : '?',
                            )
                          : null,
                    ),
                    title: Text(child.fullName),
                    subtitle: Text(child.classroomName ?? child.studentId),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (child.unreadNotifications > 0)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.red,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${child.unreadNotifications}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                              ),
                            ),
                          ),
                        if (state.selected?.id == child.id)
                          const Padding(
                            padding: EdgeInsets.only(left: 8),
                            child: Icon(
                              Icons.check_circle,
                              color: Colors.green,
                            ),
                          ),
                      ],
                    ),
                    onTap: () {
                      cubit.selectChild(child);
                      onSelected?.call(child);
                      Navigator.pop(ctx);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
