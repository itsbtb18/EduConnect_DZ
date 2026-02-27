import 'package:flutter/material.dart';

/// Shared AI chatbot screen for students (educational Q&A).
class ChatbotScreen extends StatefulWidget {
  const ChatbotScreen({super.key});

  @override
  State<ChatbotScreen> createState() => _ChatbotScreenState();
}

class _ChatbotScreenState extends State<ChatbotScreen> {
  final _messageController = TextEditingController();
  final _scrollController = ScrollController();
  bool _isLoading = false;

  final List<_ChatMessage> _messages = [
    _ChatMessage(
      text:
          'Bonjour! Je suis EduBot, ton assistant éducatif.\n'
          'Pose-moi des questions sur tes cours et je t\'aiderai!',
      isBot: true,
    ),
  ];

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(_ChatMessage(text: text, isBot: false));
      _isLoading = true;
    });
    _messageController.clear();
    _scrollToBottom();

    // TODO: Call AIchatbot repository → RAG pipeline
    // Simulating a response delay
    Future.delayed(const Duration(seconds: 1), () {
      if (!mounted) return;
      setState(() {
        _messages.add(
          _ChatMessage(text: _getPlaceholderResponse(text), isBot: true),
        );
        _isLoading = false;
      });
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _getPlaceholderResponse(String query) {
    final q = query.toLowerCase();
    if (q.contains('math') || q.contains('équation') || q.contains('calcul')) {
      return 'Les mathématiques sont une matière fondamentale!\n\n'
          'Pour résoudre une équation du 1er degré ax + b = 0:\n'
          '1. Isoler le terme avec x\n'
          '2. Diviser par le coefficient de x\n'
          '3. Vérifier en remplaçant dans l\'équation\n\n'
          'Tu veux un exemple concret?';
    }
    if (q.contains('physique') || q.contains('force') || q.contains('newton')) {
      return 'En physique, les forces sont des interactions entre objets.\n\n'
          'La deuxième loi de Newton: F = m × a\n'
          'où F = force (Newton), m = masse (kg), a = accélération (m/s²)\n\n'
          'Quel aspect de la physique t\'intéresse?';
    }
    if (q.contains('merci') || q.contains('شكرا')) {
      return 'De rien! N\'hésite pas à revenir si tu as d\'autres questions. '
          'Bon courage dans tes études!';
    }
    return 'C\'est une bonne question! Laisse-moi chercher dans tes cours...\n\n'
        'Je suis connecté à la base de connaissances de ton école. '
        'Pour une réponse plus précise, essaie de mentionner '
        'la matière ou le sujet spécifique.';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Row(
          children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: Colors.white,
              child: Icon(Icons.smart_toy, size: 20, color: Colors.blue),
            ),
            SizedBox(width: 8),
            Text('EduBot'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Nouvelle conversation',
            onPressed: () => setState(() {
              _messages.clear();
              _messages.add(
                _ChatMessage(
                  text: 'Conversation réinitialisée. Comment puis-je t\'aider?',
                  isBot: true,
                ),
              );
            }),
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(12),
              itemCount: _messages.length + (_isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _messages.length) {
                  return _buildTypingIndicator();
                }
                return _buildMessageBubble(_messages[index], theme);
              },
            ),
          ),
          // Suggestion chips
          _buildSuggestionChips(),
          // Input bar
          _buildInputBar(theme),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(_ChatMessage msg, ThemeData theme) {
    return Align(
      alignment: msg.isBot ? Alignment.centerLeft : Alignment.centerRight,
      child: Container(
        margin: EdgeInsets.only(
          top: 4,
          bottom: 4,
          left: msg.isBot ? 0 : 48,
          right: msg.isBot ? 48 : 0,
        ),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: msg.isBot
              ? theme.colorScheme.surfaceContainerHighest
              : theme.colorScheme.primary,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(msg.isBot ? 4 : 16),
            bottomRight: Radius.circular(msg.isBot ? 16 : 4),
          ),
        ),
        child: Text(
          msg.text,
          style: TextStyle(
            color: msg.isBot
                ? theme.colorScheme.onSurface
                : theme.colorScheme.onPrimary,
          ),
        ),
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(top: 4, bottom: 4, right: 48),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 8),
            Text(
              'EduBot réfléchit...',
              style: TextStyle(fontStyle: FontStyle.italic),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuggestionChips() {
    if (_messages.length > 3) return const SizedBox.shrink();

    final suggestions = [
      'Comment résoudre une équation?',
      'Explique la photosynthèse',
      'C\'est quoi la 2ème loi de Newton?',
    ];

    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        children: suggestions
            .map(
              (s) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  label: Text(s, style: const TextStyle(fontSize: 12)),
                  onPressed: () {
                    _messageController.text = s;
                    _sendMessage();
                  },
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildInputBar(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
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
          Expanded(
            child: TextField(
              controller: _messageController,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => _sendMessage(),
              decoration: InputDecoration(
                hintText: 'Pose ta question...',
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
            onPressed: _isLoading ? null : _sendMessage,
            child: const Icon(Icons.send),
          ),
        ],
      ),
    );
  }
}

class _ChatMessage {
  final String text;
  final bool isBot;

  _ChatMessage({required this.text, required this.isBot});
}
