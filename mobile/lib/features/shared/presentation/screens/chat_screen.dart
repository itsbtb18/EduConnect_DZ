import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../data/models/communication_model.dart';
import '../bloc/chat_bloc.dart';

/// Chat / conversations screen (shared between all roles)
class ChatScreen extends StatelessWidget {
  const ChatScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => ChatBloc()..add(ChatLoadConversations()),
      child: const _ChatScreenBody(),
    );
  }
}

class _ChatScreenBody extends StatelessWidget {
  const _ChatScreenBody();

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ChatBloc, ChatState>(
      builder: (context, state) {
        if (state is ChatMessagesLoaded) {
          return _ChatDetailView(
            conversationId: state.conversationId,
            messages: state.messages,
          );
        }
        return _ConversationListView(state: state);
      },
    );
  }
}

class _ConversationListView extends StatelessWidget {
  final ChatState state;
  const _ConversationListView({required this.state});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: _buildBody(context),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (state is ChatLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (state is ChatError) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              (state as ChatError).message,
              style: const TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: () =>
                  context.read<ChatBloc>().add(ChatLoadConversations()),
              child: const Text('Réessayer'),
            ),
          ],
        ),
      );
    }
    if (state is ChatConversationsLoaded) {
      final conversations = (state as ChatConversationsLoaded).conversations;
      if (conversations.isEmpty) {
        return const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
              SizedBox(height: 16),
              Text('Aucune conversation', style: TextStyle(color: Colors.grey)),
            ],
          ),
        );
      }
      return RefreshIndicator(
        onRefresh: () async =>
            context.read<ChatBloc>().add(ChatLoadConversations()),
        child: ListView.builder(
          itemCount: conversations.length,
          itemBuilder: (context, index) {
            final conv = conversations[index];
            final otherParticipants = conv.participants
                .map((p) => p.name)
                .join(', ');
            return ListTile(
              leading: CircleAvatar(
                child: Text(
                  (conv.title ?? otherParticipants).isNotEmpty
                      ? (conv.title ?? otherParticipants)[0].toUpperCase()
                      : '?',
                ),
              ),
              title: Text(conv.title ?? otherParticipants),
              subtitle: Text(
                conv.lastMessageText ?? 'Pas de message',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              trailing: conv.unreadCount > 0
                  ? CircleAvatar(
                      radius: 12,
                      backgroundColor: Colors.blue,
                      child: Text(
                        '${conv.unreadCount}',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                        ),
                      ),
                    )
                  : conv.lastMessageAt != null
                  ? Text(
                      '${conv.lastMessageAt!.day}/${conv.lastMessageAt!.month}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    )
                  : null,
              onTap: () =>
                  context.read<ChatBloc>().add(ChatSelectConversation(conv.id)),
            );
          },
        ),
      );
    }
    return const SizedBox.shrink();
  }
}

class _ChatDetailView extends StatefulWidget {
  final String conversationId;
  final List<Message> messages;

  const _ChatDetailView({required this.conversationId, required this.messages});

  @override
  State<_ChatDetailView> createState() => _ChatDetailViewState();
}

class _ChatDetailViewState extends State<_ChatDetailView> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  String? _attachedFilePath;
  String? _attachedFileName;

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
    );
    if (image != null) {
      setState(() {
        _attachedFilePath = image.path;
        _attachedFileName = image.name;
      });
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    );
    if (result != null && result.files.single.path != null) {
      setState(() {
        _attachedFilePath = result.files.single.path;
        _attachedFileName = result.files.single.name;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    _scrollToBottom();
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () =>
              context.read<ChatBloc>().add(ChatLoadConversations()),
        ),
        title: const Text('Conversation'),
      ),
      body: Column(
        children: [
          Expanded(
            child: widget.messages.isEmpty
                ? const Center(
                    child: Text(
                      'Aucun message',
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(12),
                    itemCount: widget.messages.length,
                    itemBuilder: (context, index) {
                      final msg = widget.messages[index];
                      return _MessageBubble(message: msg);
                    },
                  ),
          ),
          if (_attachedFilePath != null) _buildAttachmentPreview(),
          _buildInputBar(context),
        ],
      ),
    );
  }

  Widget _buildAttachmentPreview() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      color: Colors.grey.shade100,
      child: Row(
        children: [
          const Icon(Icons.attach_file, size: 18, color: Colors.blue),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              _attachedFileName ?? 'Fichier',
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 13),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 18),
            onPressed: () => setState(() {
              _attachedFilePath = null;
              _attachedFileName = null;
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildInputBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(25),
            blurRadius: 4,
            offset: const Offset(0, -1),
          ),
        ],
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.image_outlined, color: Colors.blue),
            onPressed: _pickImage,
            tooltip: 'Envoyer une image',
          ),
          IconButton(
            icon: const Icon(Icons.attach_file, color: Colors.blue),
            onPressed: _pickFile,
            tooltip: 'Joindre un fichier',
          ),
          Expanded(
            child: TextField(
              controller: _controller,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _send(context),
              decoration: InputDecoration(
                hintText: 'Écrire un message...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 10,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          FloatingActionButton.small(
            onPressed: () => _send(context),
            child: const Icon(Icons.send),
          ),
        ],
      ),
    );
  }

  void _send(BuildContext context) {
    final text = _controller.text.trim();
    if (text.isEmpty && _attachedFilePath == null) return;

    if (_attachedFilePath != null) {
      context.read<ChatBloc>().add(
        ChatSendAttachment(
          filePath: _attachedFilePath!,
          fileName: _attachedFileName ?? 'file',
          content: text,
        ),
      );
      setState(() {
        _attachedFilePath = null;
        _attachedFileName = null;
      });
    } else {
      context.read<ChatBloc>().add(ChatSendMessage(text));
    }
    _controller.clear();
  }
}

class _MessageBubble extends StatelessWidget {
  final Message message;
  const _MessageBubble({required this.message});

  Widget _buildStatus() {
    switch (message.status) {
      case 'READ':
        return const Icon(Icons.done_all, size: 14, color: Colors.blue);
      case 'DELIVERED':
        return const Icon(Icons.done_all, size: 14, color: Colors.grey);
      case 'SENT':
      default:
        return const Icon(Icons.done, size: 14, color: Colors.grey);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (message.senderName != null)
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 2),
              child: Text(
                message.senderName!,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey,
                ),
              ),
            ),
          if (message.isPinned)
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 2),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.push_pin, size: 12, color: Colors.amber.shade700),
                  const SizedBox(width: 2),
                  Text(
                    'Épinglé',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.amber.shade700,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: message.isPinned
                  ? Colors.amber.shade50
                  : Theme.of(context).colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(12),
              border: message.isPinned
                  ? Border.all(color: Colors.amber.shade200)
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image attachment
                if (message.attachmentUrl != null &&
                    message.attachmentType == 'image')
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        message.attachmentUrl!,
                        width: 200,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => const Icon(
                          Icons.broken_image,
                          size: 48,
                          color: Colors.grey,
                        ),
                      ),
                    ),
                  ),
                // Video attachment
                if (message.attachmentUrl != null &&
                    message.attachmentType == 'video')
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: InkWell(
                      onTap: () => launchUrl(Uri.parse(message.attachmentUrl!)),
                      child: Container(
                        width: 200,
                        height: 120,
                        decoration: BoxDecoration(
                          color: Colors.black12,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Center(
                          child: Icon(
                            Icons.play_circle_fill,
                            size: 48,
                            color: Colors.white70,
                          ),
                        ),
                      ),
                    ),
                  ),
                // Document attachment
                if (message.attachmentUrl != null &&
                    message.attachmentType == 'document')
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: InkWell(
                      onTap: () => launchUrl(Uri.parse(message.attachmentUrl!)),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.description,
                              color: Colors.blue,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Flexible(
                              child: Text(
                                message.attachmentName ?? 'Document',
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: Colors.blue,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                // Text content
                if (message.content.isNotEmpty) Text(message.content),
                // Time + status
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${message.createdAt.hour.toString().padLeft(2, '0')}:${message.createdAt.minute.toString().padLeft(2, '0')}',
                      style: const TextStyle(fontSize: 10, color: Colors.grey),
                    ),
                    const SizedBox(width: 4),
                    _buildStatus(),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
