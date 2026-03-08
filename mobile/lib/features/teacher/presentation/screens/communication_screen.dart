import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../data/models/chat_room_model.dart';
import '../bloc/chat_room_cubit.dart';

/// Communication améliorée — broadcast rooms, contacts, templates.
class CommunicationScreen extends StatefulWidget {
  const CommunicationScreen({super.key});

  @override
  State<CommunicationScreen> createState() => _CommunicationScreenState();
}

class _CommunicationScreenState extends State<CommunicationScreen>
    with SingleTickerProviderStateMixin {
  final ChatRoomCubit _cubit = ChatRoomCubit();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _cubit.loadRooms();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _cubit.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _cubit,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Communication'),
          bottom: TabBar(
            controller: _tabController,
            tabs: const [
              Tab(text: 'Groupes'),
              Tab(text: 'Contacts'),
            ],
            onTap: (index) {
              if (index == 0) _cubit.loadRooms();
              if (index == 1) _cubit.loadContacts();
            },
          ),
        ),
        body: TabBarView(
          controller: _tabController,
          children: [_buildRoomsTab(), _buildContactsTab()],
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: () => _showCreateRoomDialog(context),
          child: const Icon(Icons.group_add),
        ),
      ),
    );
  }

  Widget _buildRoomsTab() {
    return BlocBuilder<ChatRoomCubit, ChatRoomState>(
      builder: (context, state) {
        if (state is ChatRoomLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is ChatRoomListLoaded) {
          if (state.rooms.isEmpty) {
            return const Center(
              child: Text('Aucun groupe', style: TextStyle(color: Colors.grey)),
            );
          }
          return RefreshIndicator(
            onRefresh: () => _cubit.loadRooms(),
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: state.rooms.length,
              itemBuilder: (context, index) {
                final room = state.rooms[index];
                return _buildRoomTile(room);
              },
            ),
          );
        }
        if (state is ChatRoomError) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(state.message, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => _cubit.loadRooms(),
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          );
        }
        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildRoomTile(ChatRoom room) {
    IconData icon;
    switch (room.roomType) {
      case 'CLASS_BROADCAST':
        icon = Icons.campaign;
        break;
      case 'ADMIN_BROADCAST':
        icon = Icons.admin_panel_settings;
        break;
      case 'TEACHER_PARENT_GROUP':
        icon = Icons.family_restroom;
        break;
      default:
        icon = Icons.group;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(child: Icon(icon)),
        title: Text(
          room.name,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: Text(
          '${room.memberCount} membres'
          '${room.lastMessageText != null ? '\n${room.lastMessageText}' : ''}',
        ),
        isThreeLine: room.lastMessageText != null,
        trailing: const Icon(Icons.chevron_right),
        onTap: () => _openRoom(room),
      ),
    );
  }

  void _openRoom(ChatRoom room) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BlocProvider.value(
          value: _cubit,
          child: _RoomMessagesPage(room: room, cubit: _cubit),
        ),
      ),
    );
  }

  Widget _buildContactsTab() {
    return BlocBuilder<ChatRoomCubit, ChatRoomState>(
      builder: (context, state) {
        if (state is ChatRoomLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        if (state is ChatContactsLoaded) {
          return _buildContactGroups(state.contacts);
        }
        if (state is ChatRoomError) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(state.message, style: const TextStyle(color: Colors.red)),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => _cubit.loadContacts(),
                  child: const Text('Réessayer'),
                ),
              ],
            ),
          );
        }
        return const Center(
          child: Text(
            'Appuyez sur "Contacts" pour charger',
            style: TextStyle(color: Colors.grey),
          ),
        );
      },
    );
  }

  Widget _buildContactGroups(Map<String, List<ChatContact>> contacts) {
    final roleLabels = {
      'parents': 'Parents',
      'eleves': 'Élèves',
      'enseignants': 'Enseignants',
      'admins': 'Administration',
    };

    final entries = contacts.entries.where((e) => e.value.isNotEmpty).toList();

    if (entries.isEmpty) {
      return const Center(
        child: Text('Aucun contact', style: TextStyle(color: Colors.grey)),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(12),
      children: entries.map((entry) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text(
                roleLabels[entry.key] ?? entry.key,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).colorScheme.primary,
                ),
              ),
            ),
            ...entry.value.map(
              (contact) => ListTile(
                leading: CircleAvatar(
                  child: Text(
                    contact.name.isNotEmpty
                        ? contact.name[0].toUpperCase()
                        : '?',
                  ),
                ),
                title: Text(contact.name),
                subtitle: Text(
                  contact.hasConversation ? 'Conversation active' : '',
                ),
                trailing: Icon(
                  contact.hasConversation
                      ? Icons.chat_bubble
                      : Icons.chat_bubble_outline,
                  color: contact.hasConversation
                      ? Theme.of(context).colorScheme.primary
                      : null,
                ),
              ),
            ),
            const Divider(),
          ],
        );
      }).toList(),
    );
  }

  void _showCreateRoomDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    String roomType = 'TEACHER_STUDENT_GROUP';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 16,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
        ),
        child: StatefulBuilder(
          builder: (context, setInnerState) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Créer un groupe',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Nom du groupe *',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: roomType,
                decoration: const InputDecoration(
                  labelText: 'Type',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'TEACHER_STUDENT_GROUP',
                    child: Text('Groupe Enseignant-Élèves'),
                  ),
                  DropdownMenuItem(
                    value: 'TEACHER_PARENT_GROUP',
                    child: Text('Groupe Enseignant-Parents'),
                  ),
                  DropdownMenuItem(
                    value: 'CLASS_BROADCAST',
                    child: Text('Diffusion Classe'),
                  ),
                ],
                onChanged: (v) => setInnerState(() => roomType = v ?? roomType),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () {
                  if (nameCtrl.text.isEmpty) return;
                  Navigator.pop(ctx);
                  _cubit.createRoom(name: nameCtrl.text, roomType: roomType);
                },
                child: const Text('Créer'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Room Messages Sub-page ───────────────────────────────────────────────────

class _RoomMessagesPage extends StatefulWidget {
  final ChatRoom room;
  final ChatRoomCubit cubit;

  const _RoomMessagesPage({required this.room, required this.cubit});

  @override
  State<_RoomMessagesPage> createState() => _RoomMessagesPageState();
}

class _RoomMessagesPageState extends State<_RoomMessagesPage> {
  final TextEditingController _msgCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    widget.cubit.loadMessages(widget.room);
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.room.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.text_snippet),
            tooltip: 'Modèles',
            onPressed: _showTemplates,
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: BlocBuilder<ChatRoomCubit, ChatRoomState>(
              bloc: widget.cubit,
              builder: (context, state) {
                if (state is ChatRoomLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state is ChatRoomMessagesLoaded) {
                  if (state.messages.isEmpty) {
                    return const Center(
                      child: Text(
                        'Aucun message',
                        style: TextStyle(color: Colors.grey),
                      ),
                    );
                  }
                  return ListView.builder(
                    reverse: true,
                    padding: const EdgeInsets.all(12),
                    itemCount: state.messages.length,
                    itemBuilder: (context, index) {
                      final msg =
                          state.messages[state.messages.length - 1 - index];
                      return _buildMessageBubble(msg);
                    },
                  );
                }
                if (state is ChatRoomError) {
                  return Center(child: Text(state.message));
                }
                return const SizedBox.shrink();
              },
            ),
          ),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(RoomMessage msg) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            msg.senderName ?? 'Utilisateur',
            style: TextStyle(
              fontSize: 12,
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(msg.content),
          ),
          const SizedBox(height: 2),
          Text(
            '${msg.createdAt.hour}:${msg.createdAt.minute.toString().padLeft(2, '0')}',
            style: const TextStyle(fontSize: 10, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, -1),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _msgCtrl,
              decoration: const InputDecoration(
                hintText: 'Écrire un message...',
                border: InputBorder.none,
              ),
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _send(),
            ),
          ),
          IconButton(icon: const Icon(Icons.send), onPressed: _send),
        ],
      ),
    );
  }

  void _send() {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;
    _msgCtrl.clear();
    widget.cubit.sendMessage(widget.room, text);
  }

  void _showTemplates() {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.all(16),
        children: [
          const Text(
            'Modèles de messages',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          ...teacherMessageTemplates.map(
            (tpl) => ListTile(
              leading: const Icon(Icons.text_snippet_outlined),
              title: Text(tpl.title),
              subtitle: Text(
                tpl.content,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              onTap: () {
                Navigator.pop(ctx);
                _msgCtrl.text = tpl.content;
              },
            ),
          ),
        ],
      ),
    );
  }
}
