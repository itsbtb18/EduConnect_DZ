import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/models/announcement_model.dart';
import '../bloc/announcement_cubit.dart';

const _audienceLabels = {
  'ALL': 'Tous',
  'PARENTS': 'Parents',
  'STUDENTS': 'Élèves',
  'TEACHERS': 'Enseignants',
  'SPECIFIC_CLASS': 'Classe',
  'SPECIFIC_SECTION': 'Section',
};

/// Announcements screen (shared between all roles)
class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  String _filter = 'ALL';

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => AnnouncementCubit()..loadAnnouncements(),
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Annonces'),
          actions: [
            PopupMenuButton<String>(
              icon: const Icon(Icons.filter_list),
              tooltip: 'Filtrer par audience',
              onSelected: (v) {
                setState(() => _filter = v);
                context.read<AnnouncementCubit>().loadAnnouncements(
                  targetAudience: v == 'ALL' ? null : v,
                );
              },
              itemBuilder: (_) => _audienceLabels.entries
                  .map(
                    (e) => PopupMenuItem(
                      value: e.key,
                      child: Row(
                        children: [
                          if (_filter == e.key)
                            const Icon(Icons.check, size: 18),
                          if (_filter == e.key) const SizedBox(width: 8),
                          Text(e.value),
                        ],
                      ),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
        body: BlocBuilder<AnnouncementCubit, AnnouncementState>(
          builder: (context, state) {
            if (state is AnnouncementLoading) {
              return const Center(child: CircularProgressIndicator());
            }
            if (state is AnnouncementError) {
              return Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      state.message,
                      style: const TextStyle(color: Colors.red),
                    ),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () =>
                          context.read<AnnouncementCubit>().loadAnnouncements(),
                      child: const Text('Réessayer'),
                    ),
                  ],
                ),
              );
            }
            if (state is AnnouncementLoaded) {
              if (state.announcements.isEmpty) {
                return const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.campaign_outlined,
                        size: 64,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Aucune annonce pour le moment',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                );
              }

              // Sort: urgent first, then pinned, then by date
              final sorted = [...state.announcements]
                ..sort((a, b) {
                  if (a.isUrgent != b.isUrgent) return a.isUrgent ? -1 : 1;
                  if (a.isPinned != b.isPinned) return a.isPinned ? -1 : 1;
                  return b.createdAt.compareTo(a.createdAt);
                });

              return RefreshIndicator(
                onRefresh: () =>
                    context.read<AnnouncementCubit>().loadAnnouncements(
                      targetAudience: _filter == 'ALL' ? null : _filter,
                    ),
                child: ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: sorted.length,
                  itemBuilder: (context, index) =>
                      _AnnouncementCard(announcement: sorted[index]),
                ),
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final Announcement announcement;
  const _AnnouncementCard({required this.announcement});

  @override
  Widget build(BuildContext context) {
    final a = announcement;
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: a.isUrgent
            ? const BorderSide(color: Colors.red, width: 1.5)
            : BorderSide.none,
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Urgent banner ──
          if (a.isUrgent)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              color: Colors.red,
              child: const Row(
                children: [
                  Icon(
                    Icons.warning_amber_rounded,
                    color: Colors.white,
                    size: 16,
                  ),
                  SizedBox(width: 6),
                  Text(
                    'URGENT',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

          // ── Image ──
          if (a.imageUrl != null && a.imageUrl!.isNotEmpty)
            Image.network(
              a.imageUrl!,
              width: double.infinity,
              height: 180,
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const SizedBox.shrink(),
            ),

          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Header row: icon + title + date ──
                Row(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: a.isUrgent
                          ? Colors.red.shade50
                          : a.isPinned
                          ? Colors.amber.shade50
                          : Colors.blue.shade50,
                      child: Icon(
                        a.isUrgent
                            ? Icons.warning_amber_rounded
                            : a.isPinned
                            ? Icons.push_pin
                            : Icons.campaign,
                        size: 20,
                        color: a.isUrgent
                            ? Colors.red
                            : a.isPinned
                            ? Colors.amber.shade700
                            : Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            a.title,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (a.authorName != null)
                            Text(
                              a.authorName!,
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: Colors.grey,
                              ),
                            ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${a.createdAt.day}/${a.createdAt.month}/${a.createdAt.year}',
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.grey,
                          ),
                        ),
                        if (a.viewsCount > 0)
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.visibility,
                                size: 13,
                                color: Colors.grey,
                              ),
                              const SizedBox(width: 3),
                              Text(
                                '${a.viewsCount}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 10),

                // ── Audience chip ──
                Chip(
                  label: Text(
                    _audienceLabels[a.targetAudience] ?? a.targetAudience,
                    style: const TextStyle(fontSize: 11),
                  ),
                  visualDensity: VisualDensity.compact,
                  padding: EdgeInsets.zero,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),

                const SizedBox(height: 8),

                // ── Body text ──
                Text(
                  a.body.length > 200
                      ? '${a.body.substring(0, 200)}...'
                      : a.body,
                  style: theme.textTheme.bodyMedium,
                ),

                // ── File attachments ──
                if (a.attachments.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  const Divider(height: 1),
                  const SizedBox(height: 8),
                  ...a.attachments.map(
                    (att) => InkWell(
                      onTap: () => _openAttachment(att.file),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.attach_file,
                              size: 18,
                              color: Colors.blue,
                            ),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                att.fileName ?? 'Pièce jointe',
                                style: const TextStyle(
                                  color: Colors.blue,
                                  fontSize: 13,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],

                // ── Pin badge ──
                if (a.isPinned && !a.isUrgent) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        Icons.push_pin,
                        size: 14,
                        color: Colors.amber.shade700,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Épinglée',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.amber.shade700,
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openAttachment(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
