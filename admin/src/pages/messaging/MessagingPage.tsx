import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare, Plus, Search, Paperclip, Send, X, Trash2,
  FileText, Download, Image as ImageIcon, Pin, Check, CheckCheck,
  Users, Hash, Video, Smile, BookTemplate, MoreVertical,
} from 'lucide-react';
import {
  useConversations, useConversationMessages, useCreateConversation,
  useDeleteConversation, useUploadAttachment, useContacts,
  useChatRooms, useCreateChatRoom, useChatRoomMessages,
  useRoomUploadAttachment, usePinMessage, useDeleteMessage,
  useMarkConversationRead, useSearchMessages, useMessageTemplates,
} from '../../hooks/useApi';
import { useChat, useRoomChat, useNotificationSocket } from '../../hooks/useWebSocket';
import { useAuth } from '../../context/AuthContext';
import type { Conversation, ChatMessage, ContactUser, ConversationRole, ContactsResponse, ChatRoom, ChatRoomMessage, MessageTemplate } from '../../types';
import './MessagingPage.css';

/* ── Helpers ── */
const ROLE_LABELS: Record<ConversationRole, string> = {
  parent: 'Parent',
  enseignant: 'Enseignant',
  eleve: 'Eleve',
  admin: 'Admin',
  infirmier: 'Infirmier',
};

const CONTACT_GROUPS: { key: keyof ContactsResponse; label: string; role: ConversationRole }[] = [
  { key: 'enseignants', label: 'Enseignants', role: 'enseignant' },
  { key: 'parents', label: 'Parents', role: 'parent' },
  { key: 'eleves', label: 'Eleves', role: 'eleve' },
  { key: 'admins', label: 'Admins', role: 'admin' },
];

const ROOM_TYPE_LABELS: Record<string, string> = {
  CLASS_BROADCAST: 'Classe (broadcast)',
  ADMIN_BROADCAST: 'Admin broadcast',
  ADMIN_ALL_BROADCAST: 'Tous (broadcast)',
  TEACHER_PARENT_GROUP: 'Enseignant — Parents',
  TEACHER_STUDENT_GROUP: 'Enseignant — Élèves',
  ADMIN_TEACHER_GROUP: 'Admin — Enseignants',
  NURSE_PARENT_GROUP: 'Infirmier — Parents',
};

const ALLOWED_FILE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'mp4', 'mov', 'webm'];
const ACCEPT_FILE_TYPES = ALLOWED_FILE_EXTENSIONS.map(e => `.${e}`).join(',');

function formatTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatRelativeDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return formatTime(iso);
  if (days === 1) return 'Hier';
  if (days < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function formatDateSeparator(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatFileSize(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}

function isSameDay(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.slice(0, 10) === b.slice(0, 10);
}

/* ══════════════════════════════════════════════════════════════════════ */
const MessagingPage: React.FC = () => {
  const { user } = useAuth();

  /* ── State ── */
  const [selectedId, setSelectedId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [convSearch, setConvSearch] = useState('');
  const [wsMessages, setWsMessages] = useState<ChatMessage[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'rooms'>('direct');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roomWsMessages, setRoomWsMessages] = useState<ChatRoomMessage[]>([]);
  const [contextMenuMsg, setContextMenuMsg] = useState<string | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('CLASS_BROADCAST');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* ── Queries ── */
  const { data: convData, isLoading: convsLoading } = useConversations();
  const { data: msgData, isLoading: msgsLoading } = useConversationMessages(selectedId);
  const createConv = useCreateConversation();
  const deleteConv = useDeleteConversation();
  const uploadAttach = useUploadAttachment();
  const { data: contactsData } = useContacts();

  /* ── Rooms queries ── */
  const { data: roomsData } = useChatRooms();
  const { data: roomMsgData, isLoading: roomMsgsLoading } = useChatRoomMessages(selectedRoomId);
  const createRoom = useCreateChatRoom();
  const roomUploadAttach = useRoomUploadAttachment();
  const pinMsg = usePinMessage();
  const deleteMsg = useDeleteMessage();
  const markRead = useMarkConversationRead();
  const { data: templatesData } = useMessageTemplates();
  const { data: searchResults } = useSearchMessages(searchOpen ? searchQuery : '');

  const rooms = (Array.isArray(roomsData) ? roomsData : roomsData?.results || []) as ChatRoom[];
  const roomApiMessages = (Array.isArray(roomMsgData) ? roomMsgData : roomMsgData?.results || []) as ChatRoomMessage[];
  const templates = (Array.isArray(templatesData) ? templatesData : templatesData?.results || []) as MessageTemplate[];
  const searchHits = (Array.isArray(searchResults) ? searchResults : searchResults?.results || []) as Record<string, unknown>[];

  const conversations = (Array.isArray(convData) ? convData : convData?.results || []) as Conversation[];
  const apiMessages = (Array.isArray(msgData) ? msgData : msgData?.results || []) as ChatMessage[];
  const contacts = contactsData as ContactsResponse | undefined;

  /* ── WebSocket ── */
  const onWsMessage = useCallback((msg: ChatMessage) => {
    setWsMessages((prev) => {
      // avoid duplicates
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const { isConnected, sendMessage: wsSend } = useChat({
    conversationId: selectedId,
    onMessage: onWsMessage,
  });

  useNotificationSocket();

  /* ── Room WebSocket ── */
  const onRoomWsMessage = useCallback((msg: ChatRoomMessage) => {
    setRoomWsMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const { isConnected: roomConnected, sendMessage: roomWsSend } = useRoomChat({
    roomId: selectedRoomId,
    onMessage: onRoomWsMessage,
  });

  /* ── Reset room WS on switch ── */
  useEffect(() => { setRoomWsMessages([]); }, [selectedRoomId]);

  /* ── Mark conversation as read on select ── */
  useEffect(() => {
    if (selectedId && sendMarkRead) sendMarkRead();
    if (selectedId) markRead.mutate(selectedId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  /* ── Derived ── */
  const selectedConv = useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId],
  );

  const filteredConvs = useMemo(() => {
    if (!convSearch.trim()) return conversations;
    const q = convSearch.toLowerCase();
    return conversations.filter(
      (c) =>
        c.participant_other_name.toLowerCase().includes(q) ||
        (c.last_message_preview || '').toLowerCase().includes(q),
    );
  }, [conversations, convSearch]);

  // Merge API + WS messages, deduplicate
  const allMessages = useMemo(() => {
    const map = new Map<string, ChatMessage>();
    for (const m of apiMessages) map.set(m.id, m);
    for (const m of wsMessages) if (!map.has(m.id)) map.set(m.id, m);
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(),
    );
  }, [apiMessages, wsMessages]);

  // Merge room API + WS messages
  const allRoomMessages = useMemo(() => {
    const map = new Map<string, ChatRoomMessage>();
    for (const m of roomApiMessages) map.set(m.id, m);
    for (const m of roomWsMessages) if (!map.has(m.id)) map.set(m.id, m);
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(),
    );
  }, [roomApiMessages, roomWsMessages]);

  /* ── Reset WS messages on conversation switch ── */
  useEffect(() => {
    setWsMessages([]);
  }, [selectedId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  /* ── Lightbox ESC ── */
  useEffect(() => {
    if (!lightboxUrl) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxUrl]);

  /* ── Auto-resize textarea ── */
  const adjustTextarea = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  /* ── File handler ── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert('Le fichier ne doit pas depasser 25 Mo');
        return;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_FILE_EXTENSIONS.includes(ext || '')) {
        alert(`Types acceptés : ${ALLOWED_FILE_EXTENSIONS.join(', ').toUpperCase()}`);
        return;
      }
      setAttachedFile(file);
    }
    e.target.value = '';
  };

  /* ── Send ── */
  const handleSend = () => {
    if ((!messageText.trim() && !attachedFile) || !selectedId) return;
    const content = messageText.trim();

    // File upload via REST
    if (attachedFile) {
      const fd = new FormData();
      if (content) fd.append('content', content);
      fd.append('file', attachedFile);
      uploadAttach.mutate(
        { conversationId: selectedId, data: fd },
        {
          onSuccess: () => {
            setMessageText('');
            setAttachedFile(null);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
          },
        },
      );
      return;
    }

    // Text-only via WebSocket
    if (isConnected && content) {
      const sent = wsSend(content);
      if (sent) {
        // Optimistic message
        const optimistic: ChatMessage = {
          id: `opt-${Date.now()}`,
          conversation_id: selectedId,
          sender_id: user?.id,
          sender_name: user ? `${user.first_name} ${user.last_name}` : '',
          sender_is_admin: true,
          content,
          created_at: new Date().toISOString(),
          _optimistic: true,
        };
        setWsMessages((prev) => [...prev, optimistic]);
        setMessageText('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* ── Read receipt indicator ── */
  const renderStatus = (msg: ChatMessage) => {
    if (!msg.sender_is_admin && msg.sender_id !== user?.id) return null;
    if (msg._optimistic) return <span className="msg-status" title="Envoi...">⏳</span>;
    if (msg.status === 'READ') return <span className="msg-status msg-status--read" title="Lu">🔵</span>;
    if (msg.status === 'DELIVERED') return <span className="msg-status" title="Reçu"><CheckCheck size={14} /></span>;
    return <span className="msg-status" title="Envoyé"><Check size={14} /></span>;
  };

  /* ── Room send ── */
  const handleRoomSend = () => {
    if ((!messageText.trim() && !attachedFile) || !selectedRoomId) return;
    const content = messageText.trim();

    if (attachedFile) {
      const fd = new FormData();
      if (content) fd.append('content', content);
      fd.append('attachment', attachedFile);
      roomUploadAttach.mutate(
        { roomId: selectedRoomId, data: fd },
        {
          onSuccess: () => {
            setMessageText('');
            setAttachedFile(null);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
          },
        },
      );
      return;
    }

    if (roomConnected && content) {
      const sent = roomWsSend(content);
      if (sent) {
        setMessageText('');
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
      }
    }
  };

  /* ── Create room ── */
  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    createRoom.mutate(
      { name: newRoomName, room_type: newRoomType },
      {
        onSuccess: () => {
          setRoomModalOpen(false);
          setNewRoomName('');
        },
      },
    );
  };

  /* ── Insert template ── */
  const handleInsertTemplate = (tpl: MessageTemplate) => {
    setMessageText(tpl.content);
    setTemplatePickerOpen(false);
  };

  /* ── Create conversation ── */
  const handleCreateConversation = (contact: ContactUser, role: ConversationRole) => {
    createConv.mutate(
      { participant_other_id: contact.id, participant_other_role: role },
      {
        onSuccess: (res) => {
          const newConv = (res as { data: Conversation }).data || res;
          if (newConv && typeof newConv === 'object' && 'id' in newConv) {
            setSelectedId((newConv as Conversation).id);
          }
          setModalOpen(false);
          setModalSearch('');
        },
      },
    );
  };

  /* ── Delete ── */
  const handleDelete = () => {
    if (!selectedId) return;
    deleteConv.mutate(selectedId, {
      onSuccess: () => {
        setSelectedId('');
        setConfirmDelete(false);
      },
    });
  };

  /* ── Filtered contacts ── */
  const filteredContacts = useMemo(() => {
    if (!contacts) return null;
    const q = modalSearch.toLowerCase().trim();
    if (!q) return contacts;
    const filter = (arr: ContactUser[]) => arr.filter((c) => c.full_name.toLowerCase().includes(q));
    return {
      enseignants: filter(contacts.enseignants),
      parents: filter(contacts.parents),
      eleves: filter(contacts.eleves),
      admins: filter(contacts.admins),
    } as ContactsResponse;
  }, [contacts, modalSearch]);

  /* ══════════════════════════════════════════════════════════════════ */
  /* ── RENDER ── */
  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <>
      <div className="msg-page">
        {/* ─── LEFT PANEL ─── */}
        <div className="msg-panel-left">
          <div className="msg-panel-left__header">
            <div className="msg-panel-left__title">
              <MessageSquare /> Messagerie
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="msg-new-btn" title="Rechercher" onClick={() => setSearchOpen(!searchOpen)}>
                <Search />
              </button>
              <button className="msg-new-btn" title="Nouvelle conversation" onClick={() => { setModalOpen(true); setModalSearch(''); }}>
                <Plus />
              </button>
            </div>
          </div>

          {/* Tabs: Direct / Rooms */}
          <div className="msg-tabs">
            <button className={`msg-tab ${activeTab === 'direct' ? 'msg-tab--active' : ''}`} onClick={() => { setActiveTab('direct'); setSelectedRoomId(''); }}>
              <MessageSquare size={14} /> Direct
            </button>
            <button className={`msg-tab ${activeTab === 'rooms' ? 'msg-tab--active' : ''}`} onClick={() => { setActiveTab('rooms'); setSelectedId(''); }}>
              <Users size={14} /> Salons
            </button>
          </div>

          {/* Search */}
          {(activeTab === 'direct' || searchOpen) && (
          <div className="msg-search">
            <div className="msg-search__wrap">
              <span className="msg-search__icon"><Search /></span>
              <input
                className="msg-search__input"
                placeholder={searchOpen ? "Rechercher dans l'historique..." : "Rechercher une conversation..."}
                value={searchOpen ? searchQuery : convSearch}
                onChange={(e) => searchOpen ? setSearchQuery(e.target.value) : setConvSearch(e.target.value)}
              />
              {searchOpen && <button className="msg-search__close" onClick={() => { setSearchOpen(false); setSearchQuery(''); }}><X size={14} /></button>}
            </div>
          </div>
          )}

          {/* Search results */}
          {searchOpen && searchQuery.length >= 2 && (
            <div className="msg-conv-list">
              {searchHits.length === 0 ? (
                <div className="msg-empty-state" style={{ paddingTop: 20 }}>
                  <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Aucun résultat</p>
                </div>
              ) : (
                searchHits.map((hit, i) => (
                  <div key={`search-${i}`} className="msg-conv-item" onClick={() => {
                    if (hit.conversation_id) { setSelectedId(hit.conversation_id as string); setActiveTab('direct'); }
                    else if (hit.room_id) { setSelectedRoomId(hit.room_id as string); setActiveTab('rooms'); }
                    setSearchOpen(false); setSearchQuery('');
                  }}>
                    <div className="msg-avatar msg-avatar--admin"><Search size={14} /></div>
                    <div className="msg-conv-item__body">
                      <div className="msg-conv-item__row">
                        <span className="msg-conv-item__name">{hit.sender_name as string}</span>
                        <span className="msg-conv-item__time">{hit.room_name ? `#${hit.room_name}` : 'DM'}</span>
                      </div>
                      <div className="msg-conv-item__row">
                        <span className="msg-conv-item__preview">{hit.content as string}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Conversation list (direct) */}
          {activeTab === 'direct' && !searchOpen && (
          <div className="msg-conv-list">
            {convsLoading ? (
              <div className="msg-loading"><div className="msg-spinner" /></div>
            ) : filteredConvs.length === 0 ? (
              <div className="msg-empty-state" style={{ paddingTop: 40 }}>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                  {convSearch ? 'Aucun resultat' : 'Aucune conversation'}
                </p>
              </div>
            ) : (
              filteredConvs.map((conv) => (
                <div
                  key={conv.id}
                  className={[
                    'msg-conv-item',
                    selectedId === conv.id ? 'msg-conv-item--active' : '',
                    conv.unread_count_admin > 0 ? 'msg-conv-item--unread' : '',
                  ].join(' ')}
                  onClick={() => setSelectedId(conv.id)}
                >
                  <div className={`msg-avatar msg-avatar--${conv.participant_other_role}`}>
                    {conv.participant_other_initials}
                  </div>
                  <div className="msg-conv-item__body">
                    <div className="msg-conv-item__row">
                      <span className="msg-conv-item__name">
                        {conv.participant_other_name}
                        <span className={`msg-conv-item__role-tag msg-conv-item__role-tag--${conv.participant_other_role}`}>
                          {ROLE_LABELS[conv.participant_other_role]}
                        </span>
                      </span>
                      <span className="msg-conv-item__time">{formatRelativeDate(conv.last_message_at)}</span>
                    </div>
                    <div className="msg-conv-item__row">
                      <span className="msg-conv-item__preview">
                        {conv.last_message_preview || 'Aucun message'}
                      </span>
                      {conv.unread_count_admin > 0 && (
                        <span className="msg-unread-badge">{conv.unread_count_admin}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          )}

          {/* Rooms list */}
          {activeTab === 'rooms' && !searchOpen && (
          <div className="msg-conv-list">
            <button className="msg-room-create-btn" onClick={() => setRoomModalOpen(true)}>
              <Plus size={14} /> Créer un salon
            </button>
            {rooms.length === 0 ? (
              <div className="msg-empty-state" style={{ paddingTop: 40 }}>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>Aucun salon</p>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className={[
                    'msg-conv-item',
                    selectedRoomId === room.id ? 'msg-conv-item--active' : '',
                  ].join(' ')}
                  onClick={() => setSelectedRoomId(room.id)}
                >
                  <div className="msg-avatar msg-avatar--room">
                    <Hash size={14} />
                  </div>
                  <div className="msg-conv-item__body">
                    <div className="msg-conv-item__row">
                      <span className="msg-conv-item__name">{room.name}</span>
                      <span className="msg-conv-item__time">{room.member_count} membres</span>
                    </div>
                    <div className="msg-conv-item__row">
                      <span className="msg-conv-item__preview">
                        {ROOM_TYPE_LABELS[room.room_type] || room.room_type}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          )}
        </div>

        {/* ─── RIGHT PANEL ─── */}
        <div className="msg-panel-right">
          {/* Direct conversation chat */}
          {activeTab === 'direct' && selectedId && selectedConv ? (
            <>
              {/* Chat header */}
              <div className="msg-chat-header">
                <div className="msg-chat-header__left">
                  <div className={`msg-avatar msg-avatar--sm msg-avatar--${selectedConv.participant_other_role}`}>
                    {selectedConv.participant_other_initials}
                  </div>
                  <div className="msg-chat-header__info">
                    <div className="msg-chat-header__name">{selectedConv.participant_other_name}</div>
                    <div className="msg-chat-header__role">{ROLE_LABELS[selectedConv.participant_other_role]}</div>
                  </div>
                </div>
                <div className="msg-chat-header__actions">
                  <div className={`msg-chat-header__ws ${isConnected ? 'msg-chat-header__ws--online' : ''}`}>
                    <span className="msg-chat-header__ws-dot" />
                    {isConnected ? 'En ligne' : 'Hors ligne'}
                  </div>
                  <button
                    className="msg-header-btn msg-header-btn--danger"
                    title="Supprimer la conversation"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="msg-messages">
                {msgsLoading ? (
                  <div className="msg-loading"><div className="msg-spinner" /></div>
                ) : allMessages.length === 0 ? (
                  <div className="msg-empty-state">
                    <div className="msg-empty-state__icon"><MessageSquare /></div>
                    <div className="msg-empty-state__title">Debut de la conversation</div>
                    <div className="msg-empty-state__desc">Envoyez votre premier message</div>
                  </div>
                ) : (
                  <>
                    {allMessages.map((msg, idx) => {
                      const showDateSep = idx === 0 || !isSameDay(allMessages[idx - 1].created_at, msg.created_at);
                      const isAdmin = msg.sender_is_admin ?? (msg.sender_id === user?.id);

                      return (
                        <React.Fragment key={msg.id}>
                          {showDateSep && msg.created_at && (
                            <div className="msg-date-sep">
                              <div className="msg-date-sep__line" />
                              <span className="msg-date-sep__text">{formatDateSeparator(msg.created_at)}</span>
                              <div className="msg-date-sep__line" />
                            </div>
                          )}
                          <div
                            className={[
                              'msg-bubble',
                              isAdmin ? 'msg-bubble--admin' : 'msg-bubble--other',
                              msg._optimistic ? 'msg-bubble--optimistic' : '',
                              msg.is_pinned ? 'msg-bubble--pinned' : '',
                            ].join(' ')}
                            onContextMenu={(e) => { e.preventDefault(); setContextMenuMsg(contextMenuMsg === msg.id ? null : msg.id); }}
                          >
                            {msg.is_pinned && (
                              <div className="msg-bubble__pin-badge"><Pin size={10} /> Épinglé</div>
                            )}
                            {!isAdmin && msg.sender_name && (
                              <div className="msg-bubble__sender">{msg.sender_name}</div>
                            )}

                            {/* Image attachment */}
                            {msg.attachment_url && msg.attachment_type === 'image' && (
                              <img
                                src={msg.attachment_url}
                                alt={msg.attachment_name || 'Image'}
                                className="msg-bubble__image"
                                onClick={() => setLightboxUrl(msg.attachment_url!)}
                              />
                            )}

                            {/* Video attachment */}
                            {msg.attachment_url && msg.attachment_type === 'video' && (
                              <video
                                src={msg.attachment_url}
                                controls
                                className="msg-bubble__image"
                                style={{ maxHeight: 240 }}
                              />
                            )}

                            {/* Document attachment */}
                            {msg.attachment_url && msg.attachment_type === 'document' && (
                              <a
                                className="msg-bubble__doc"
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <div className="msg-bubble__doc-icon"><FileText /></div>
                                <div className="msg-bubble__doc-info">
                                  <div className="msg-bubble__doc-name">{msg.attachment_name || 'Document'}</div>
                                  <div className="msg-bubble__doc-size">{formatFileSize(msg.attachment_size)}</div>
                                </div>
                              </a>
                            )}

                            {msg.content && (
                              <div className="msg-bubble__content">{msg.content}</div>
                            )}

                            <div className="msg-bubble__time">
                              {formatTime(msg.created_at)}
                              {isAdmin && <span className="msg-bubble__status">{renderStatus(msg)}</span>}
                              <button className="msg-bubble__menu-btn" onClick={(e) => { e.stopPropagation(); setContextMenuMsg(contextMenuMsg === msg.id ? null : msg.id); }}>
                                <MoreVertical size={12} />
                              </button>
                            </div>
                            {/* Context menu */}
                            {contextMenuMsg === msg.id && (
                              <div className="msg-bubble__context-menu">
                                <button onClick={() => { pinMsg.mutate(msg.id); setContextMenuMsg(null); }}>
                                  <Pin size={12} /> {msg.is_pinned ? 'Désépingler' : 'Épingler'}
                                </button>
                                {isAdmin && !msg.is_deleted && (
                                  <button onClick={() => { deleteMsg.mutate(msg.id); setContextMenuMsg(null); }}>
                                    <Trash2 size={12} /> Supprimer
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Upload preview */}
              {attachedFile && (
                <div className="msg-upload-preview">
                  <div className="msg-upload-preview__icon">
                    {/\.(jpg|jpeg|png)$/i.test(attachedFile.name) ? <ImageIcon /> : <FileText />}
                  </div>
                  <span className="msg-upload-preview__name">{attachedFile.name}</span>
                  <span className="msg-upload-preview__size">{formatFileSize(attachedFile.size)}</span>
                  <button className="msg-upload-preview__remove" onClick={() => setAttachedFile(null)}><X /></button>
                </div>
              )}

              {/* Input bar */}
              <div className="msg-input-bar">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="sr-only"
                  accept={ACCEPT_FILE_TYPES}
                  title="Joindre un fichier"
                />
                <button className="msg-attach-btn" title="Joindre un fichier (max 25 Mo)" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip />
                </button>
                <button className="msg-attach-btn" title="Modèles de messages" onClick={() => setTemplatePickerOpen(!templatePickerOpen)}>
                  <BookTemplate />
                </button>
                <textarea
                  ref={textareaRef}
                  className="msg-textarea"
                  rows={1}
                  placeholder="Ecrire un message..."
                  value={messageText}
                  onChange={(e) => { setMessageText(e.target.value); adjustTextarea(); }}
                  onKeyDown={handleKeyDown}
                />
                <button
                  className="msg-send-btn"
                  disabled={!messageText.trim() && !attachedFile}
                  onClick={handleSend}
                  title="Envoyer"
                >
                  <Send />
                </button>
              </div>
            </>
          ) : activeTab === 'rooms' && selectedRoomId ? (
            /* ─── ROOM CHAT ─── */
            <>
              <div className="msg-chat-header">
                <div className="msg-chat-header__left">
                  <div className="msg-avatar msg-avatar--sm msg-avatar--room"><Hash size={14} /></div>
                  <div className="msg-chat-header__info">
                    <div className="msg-chat-header__name">{rooms.find(r => r.id === selectedRoomId)?.name ?? 'Salon'}</div>
                    <div className="msg-chat-header__role">{ROOM_TYPE_LABELS[rooms.find(r => r.id === selectedRoomId)?.room_type ?? ''] ?? ''}</div>
                  </div>
                </div>
                <div className="msg-chat-header__actions">
                  <div className={`msg-chat-header__ws ${roomConnected ? 'msg-chat-header__ws--online' : ''}`}>
                    <span className="msg-chat-header__ws-dot" />
                    {roomConnected ? 'En ligne' : 'Hors ligne'}
                  </div>
                </div>
              </div>

              <div className="msg-messages">
                {allRoomMessages.length === 0 ? (
                  <div className="msg-empty-state">
                    <div className="msg-empty-state__icon"><Hash /></div>
                    <div className="msg-empty-state__title">Salon vide</div>
                    <div className="msg-empty-state__desc">Soyez le premier à envoyer un message</div>
                  </div>
                ) : (
                  <>
                    {allRoomMessages.map((msg, idx) => {
                      const showDateSep = idx === 0 || !isSameDay(allRoomMessages[idx - 1].created_at, msg.created_at);
                      const isAdmin = msg.sender_is_admin ?? (msg.sender_id === user?.id);
                      return (
                        <React.Fragment key={msg.id}>
                          {showDateSep && msg.created_at && (
                            <div className="msg-date-sep">
                              <div className="msg-date-sep__line" />
                              <span className="msg-date-sep__text">{formatDateSeparator(msg.created_at)}</span>
                              <div className="msg-date-sep__line" />
                            </div>
                          )}
                          <div className={['msg-bubble', isAdmin ? 'msg-bubble--admin' : 'msg-bubble--other', (msg as ChatRoomMessage).is_pinned ? 'msg-bubble--pinned' : ''].join(' ')}>
                            {(msg as ChatRoomMessage).is_pinned && (
                              <div className="msg-bubble__pin-badge"><Pin size={10} /> Épinglé</div>
                            )}
                            {!isAdmin && msg.sender_name && (
                              <div className="msg-bubble__sender">{msg.sender_name}</div>
                            )}
                            {(msg as ChatRoomMessage).attachment_url && (msg as ChatRoomMessage).attachment_type === 'image' && (
                              <img src={(msg as ChatRoomMessage).attachment_url!} alt="Image" className="msg-bubble__image" onClick={() => setLightboxUrl((msg as ChatRoomMessage).attachment_url!)} />
                            )}
                            {(msg as ChatRoomMessage).attachment_url && (msg as ChatRoomMessage).attachment_type === 'video' && (
                              <video src={(msg as ChatRoomMessage).attachment_url!} controls className="msg-bubble__image" style={{ maxHeight: 240 }} />
                            )}
                            {(msg as ChatRoomMessage).attachment_url && (msg as ChatRoomMessage).attachment_type === 'document' && (
                              <a className="msg-bubble__doc" href={(msg as ChatRoomMessage).attachment_url!} target="_blank" rel="noopener noreferrer">
                                <div className="msg-bubble__doc-icon"><FileText /></div>
                                <div className="msg-bubble__doc-info">
                                  <div className="msg-bubble__doc-name">{(msg as ChatRoomMessage).attachment_name || 'Document'}</div>
                                </div>
                              </a>
                            )}
                            {msg.content && <div className="msg-bubble__content">{msg.content}</div>}
                            <div className="msg-bubble__time">{formatTime(msg.created_at)}</div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Room input bar */}
              <div className="msg-input-bar">
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="sr-only" accept={ACCEPT_FILE_TYPES} title="Joindre un fichier" />
                <button className="msg-attach-btn" title="Joindre un fichier" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip />
                </button>
                <textarea
                  ref={textareaRef}
                  className="msg-textarea"
                  rows={1}
                  placeholder="Ecrire dans le salon..."
                  value={messageText}
                  onChange={(e) => { setMessageText(e.target.value); adjustTextarea(); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRoomSend(); } }}
                />
                <button className="msg-send-btn" disabled={!messageText.trim() && !attachedFile} onClick={handleRoomSend} title="Envoyer">
                  <Send />
                </button>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="msg-empty-state">
              <div className="msg-empty-state__icon"><MessageSquare /></div>
              <div className="msg-empty-state__title">{activeTab === 'rooms' ? 'Sélectionnez un salon' : 'Sélectionnez une conversation'}</div>
              <div className="msg-empty-state__desc">
                {activeTab === 'rooms' ? 'Choisissez un salon ou créez-en un nouveau' : 'Choisissez une conversation ou démarrez-en une nouvelle'}
              </div>
              {activeTab === 'rooms' ? (
                <button className="msg-empty-state__btn" onClick={() => setRoomModalOpen(true)}>
                  <Plus /> Nouveau salon
                </button>
              ) : (
                <button className="msg-empty-state__btn" onClick={() => { setModalOpen(true); setModalSearch(''); }}>
                  <Plus /> Nouvelle conversation
                </button>
              )}
            </div>
          )}

          {/* Template picker dropdown */}
          {templatePickerOpen && (
            <div className="msg-template-picker">
              <div className="msg-template-picker__header">
                <span>Modèles de messages</span>
                <button onClick={() => setTemplatePickerOpen(false)}><X size={14} /></button>
              </div>
              <div className="msg-template-picker__list">
                {templates.length === 0 ? (
                  <p style={{ padding: 12, fontSize: 13, color: 'var(--text-tertiary)' }}>Aucun modèle disponible</p>
                ) : (
                  templates.map((tpl) => (
                    <button key={tpl.id} className="msg-template-picker__item" onClick={() => handleInsertTemplate(tpl)}>
                      <div className="msg-template-picker__item-title">{tpl.name}</div>
                      <div className="msg-template-picker__item-preview">{tpl.content.substring(0, 80)}{tpl.content.length > 80 ? '...' : ''}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── DELETE CONFIRM ─── */}
      {confirmDelete && (
        <div className="msg-modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div className="msg-modal" style={{ width: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal__header">
              <span className="msg-modal__title">Supprimer la conversation ?</span>
              <button className="msg-modal__close" onClick={() => setConfirmDelete(false)}><X /></button>
            </div>
            <div style={{ padding: '0 24px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
              Cette action est irreversible. Tous les messages et fichiers seront supprimes.
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px', justifyContent: 'flex-end' }}>
              <button
                className="msg-empty-state__btn"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
                onClick={() => setConfirmDelete(false)}
              >
                Annuler
              </button>
              <button
                className="msg-empty-state__btn"
                style={{ background: 'var(--danger)' }}
                onClick={handleDelete}
              >
                <Trash2 /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── NEW CONVERSATION MODAL ─── */}
      {modalOpen && (
        <div className="msg-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="msg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal__header">
              <span className="msg-modal__title">Nouvelle conversation</span>
              <button className="msg-modal__close" onClick={() => setModalOpen(false)}><X /></button>
            </div>

            <div className="msg-modal__search">
              <div className="msg-modal__search-wrap">
                <span className="msg-modal__search-icon"><Search /></span>
                <input
                  className="msg-modal__search-input"
                  placeholder="Rechercher un contact..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="msg-modal__body">
              {!filteredContacts ? (
                <div className="msg-loading"><div className="msg-spinner" /></div>
              ) : (
                CONTACT_GROUPS.map(({ key, label, role }) => {
                  const list = filteredContacts[key];
                  if (!list || list.length === 0) return null;
                  return (
                    <React.Fragment key={key}>
                      <div className="msg-modal__group-title">{label} ({list.length})</div>
                      {list.map((contact) => (
                        <div
                          key={contact.id}
                          className={`msg-modal__contact ${contact.has_conversation ? 'msg-modal__contact--existing' : ''}`}
                          onClick={() => handleCreateConversation(contact, role)}
                        >
                          <div className={`msg-avatar msg-avatar--sm msg-avatar--${role}`}>
                            {contact.initials}
                          </div>
                          <span className="msg-modal__contact-name">{contact.full_name}</span>
                          {contact.has_conversation && (
                            <span className="msg-modal__existing-tag">En cours</span>
                          )}
                        </div>
                      ))}
                    </React.Fragment>
                  );
                })
              )}
              {filteredContacts && modalSearch &&
                !filteredContacts.enseignants.length &&
                !filteredContacts.parents.length &&
                !filteredContacts.eleves.length &&
                !filteredContacts.admins.length && (
                <div className="msg-modal__empty">Aucun contact trouve</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── IMAGE LIGHTBOX ─── */}
      {lightboxUrl && (
        <div className="msg-lightbox" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Apercu" className="msg-lightbox__img" onClick={(e) => e.stopPropagation()} />
          <div className="msg-lightbox__toolbar">
            <a
              className="msg-lightbox__btn"
              href={lightboxUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Telecharger"
            >
              <Download />
            </a>
            <button className="msg-lightbox__btn" onClick={() => setLightboxUrl(null)} title="Fermer">
              <X />
            </button>
          </div>
        </div>
      )}

      {/* ─── ROOM CREATION MODAL ─── */}
      {roomModalOpen && (
        <div className="msg-modal-overlay" onClick={() => setRoomModalOpen(false)}>
          <div className="msg-modal" style={{ width: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="msg-modal__header">
              <span className="msg-modal__title">Créer un salon</span>
              <button className="msg-modal__close" onClick={() => setRoomModalOpen(false)}><X /></button>
            </div>
            <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Nom du salon
                <input
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="ex: Parents 3ème A"
                />
              </label>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Type de salon
                <select
                  style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13 }}
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                >
                  {Object.entries(ROOM_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px', justifyContent: 'flex-end' }}>
              <button
                className="msg-empty-state__btn"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}
                onClick={() => setRoomModalOpen(false)}
              >
                Annuler
              </button>
              <button
                className="msg-empty-state__btn"
                disabled={!newRoomName.trim()}
                onClick={handleCreateRoom}
              >
                <Plus /> Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagingPage;
