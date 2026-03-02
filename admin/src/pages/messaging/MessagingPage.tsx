import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Button, Input, Empty, Spin, Tag, Modal, Form, Select, Badge, Tooltip, message as antMessage } from 'antd';
import {
  SendOutlined, MessageOutlined, UserOutlined, PlusOutlined,
  WifiOutlined, DisconnectOutlined, SearchOutlined, PaperClipOutlined,
  FileOutlined, FilePdfOutlined, FileImageOutlined,
} from '@ant-design/icons';
import { useChatRooms, useChatMessages, useSendMessage, useCreateChatRoom, useUsers } from '../../hooks/useApi';
import { useChatWebSocket } from '../../hooks/useWebSocket';
import type { ChatMessage, ChatRoom } from '../../types';

const MessagingPage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [wsMessages, setWsMessages] = useState<ChatMessage[]>([]);
  const [roomSearch, setRoomSearch] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [form] = Form.useForm();
  const msgListRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: rooms, isLoading: roomsLoading } = useChatRooms();
  const { data: apiMessages, isLoading: msgsLoading } = useChatMessages(selectedRoom);
  const sendMessageMutation = useSendMessage();
  const createRoom = useCreateChatRoom();
  const { data: usersData } = useUsers({ page_size: 200 });

  const users = (usersData?.results || []) as { id: string; first_name: string; last_name: string; role: string }[];

  // WebSocket connection
  const onWsMessage = useCallback((msg: ChatMessage) => {
    setWsMessages((prev) => [...prev, msg]);
  }, []);

  const { connected, sendMessage: wsSend } = useChatWebSocket({
    roomId: selectedRoom,
    enabled: !!selectedRoom,
    onMessage: onWsMessage,
  });

  // Reset WS messages when room changes
  useEffect(() => {
    setWsMessages([]);
  }, [selectedRoom]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (msgListRef.current) {
      msgListRef.current.scrollTop = msgListRef.current.scrollHeight;
    }
  }, [apiMessages, wsMessages]);

  // Merge API messages + WebSocket messages
  const allMessages = [
    ...(apiMessages?.results || []),
    ...wsMessages,
  ] as ChatMessage[];

  // Filter rooms by search
  const filteredRooms = useMemo(() => {
    const list = (rooms?.results || []) as ChatRoom[];
    if (!roomSearch.trim()) return list;
    const q = roomSearch.toLowerCase();
    return list.filter((r) =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.last_message || '').toLowerCase().includes(q),
    );
  }, [rooms?.results, roomSearch]);

  // Selected room info
  const currentRoom = useMemo(
    () => (rooms?.results || []).find((r: ChatRoom) => r.id === selectedRoom) as ChatRoom | undefined,
    [rooms?.results, selectedRoom],
  );

  // File attachment handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        antMessage.error('Le fichier ne doit pas dépasser 10 Mo');
        return;
      }
      setAttachedFile(file);
    }
    e.target.value = '';
  };

  const getFileIcon = (name: string) => {
    if (/\.(jpg|jpeg|png|gif|webp)$/i.test(name)) return <FileImageOutlined />;
    if (/\.pdf$/i.test(name)) return <FilePdfOutlined />;
    return <FileOutlined />;
  };

  const handleSend = () => {
    if ((!messageText.trim() && !attachedFile) || !selectedRoom) return;
    const content = messageText.trim();

    // If there's an attached file, use REST (FormData)
    if (attachedFile) {
      const formData = new FormData();
      if (content) formData.append('content', content);
      formData.append('file', attachedFile);
      sendMessageMutation.mutate(
        { roomId: selectedRoom, data: formData },
        { onSuccess: () => { setMessageText(''); setAttachedFile(null); } },
      );
      return;
    }

    // Try WebSocket first, fall back to REST
    if (connected) {
      const sent = wsSend(content);
      if (sent) {
        setMessageText('');
        return;
      }
    }

    // REST fallback
    sendMessageMutation.mutate(
      { roomId: selectedRoom, data: { content } },
      { onSuccess: () => setMessageText('') },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCreateRoom = async () => {
    try {
      const values = await form.validateFields();
      await createRoom.mutateAsync(values);
      setCreateModalOpen(false);
      form.resetFields();
    } catch {
      // validation
    }
  };

  const roomTypes = [
    { value: 'TEACHER_PARENT', label: 'Enseignant ↔ Parent' },
    { value: 'TEACHER_STUDENT', label: 'Enseignant ↔ Élève' },
    { value: 'CLASS_BROADCAST', label: 'Diffusion classe' },
    { value: 'ADMIN_PARENT', label: 'Admin ↔ Parent' },
    { value: 'ADMIN_BROADCAST', label: 'Diffusion admin' },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><MessageOutlined /> Messagerie</h1>
          <p>
            Communication en temps réel
            {connected ? (
              <Tag color="green" className="msg-ws-badge"><WifiOutlined /> Connecté</Tag>
            ) : selectedRoom ? (
              <Tag color="default" className="msg-ws-badge"><DisconnectOutlined /> REST</Tag>
            ) : null}
          </p>
        </div>
        <div className="page-header__actions">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setCreateModalOpen(true); }}>
            Nouvelle conversation
          </Button>
        </div>
      </div>

      <div className="card msg-container">
        {/* Room list */}
        <div className="msg-sidebar">
          <div className="msg-sidebar__header">
            <div>Conversations</div>
            <div className="msg-sidebar__count">{(rooms?.results || []).length}</div>
          </div>
          <div className="msg-sidebar__search">
            <Input
              placeholder="Rechercher..."
              prefix={<SearchOutlined />}
              value={roomSearch}
              onChange={(e) => setRoomSearch(e.target.value)}
              allowClear
              size="small"
            />
          </div>
          <div className="msg-sidebar__list">
            {roomsLoading ? (
              <div className="msg-sidebar__loading"><Spin /></div>
            ) : filteredRooms.length ? (
              filteredRooms.map((room: ChatRoom) => (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room.id)}
                  className={`msg-room ${selectedRoom === room.id ? 'msg-room--active' : ''}`}
                >
                  <div className="flex-row flex-center gap-10">
                    <div className="msg-room__avatar">
                      <UserOutlined />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="msg-room__name">
                        {room.name || `Salle ${room.id?.slice(0, 8)}`}
                      </div>
                      <div className="msg-room__preview">
                        {room.last_message?.slice(0, 30) || 'Aucun message'}
                      </div>
                    </div>
                    {room.unread_count ? (
                      <Badge count={room.unread_count} size="small" />
                    ) : null}
                  </div>
                </div>
              ))
            ) : roomSearch ? (
              <Empty description="Aucun résultat" className="msg-sidebar__loading" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Empty description="Aucune conversation" className="msg-sidebar__loading" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </div>

        {/* Message area */}
        <div className="msg-area">
          {selectedRoom ? (
            <>
              {/* Room header */}
              <div className="msg-area__header">
                <div className="msg-area__header-name">
                  {currentRoom?.name || `Salle ${selectedRoom.slice(0, 8)}`}
                </div>
                <div className="msg-area__header-meta">
                  {currentRoom?.room_type && (
                    <Tag size="small">{currentRoom.room_type.replace(/_/g, ' ')}</Tag>
                  )}
                </div>
              </div>

              <div className="msg-list" ref={msgListRef}>
                {msgsLoading ? (
                  <div className="loading-center"><Spin /></div>
                ) : allMessages.length ? (
                  allMessages.map((msg, i) => (
                    <div
                      key={msg.id || `msg-${i}`}
                      className={`msg-bubble ${msg.is_mine ? 'msg-bubble--mine' : 'msg-bubble--other'}`}
                    >
                      {!msg.is_mine && (
                        <div className="msg-bubble__sender">
                          {msg.sender_name || msg.sender || ''}
                        </div>
                      )}
                      {msg.content || msg.text || ''}
                      {msg.file_url && (
                        <div className="msg-bubble__file">
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                            {getFileIcon(msg.file_name || 'file')} {msg.file_name || 'Fichier joint'}
                          </a>
                        </div>
                      )}
                      {msg.sent_at && (
                        <div className="msg-bubble__time">
                          {new Date(msg.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <Empty description="Aucun message" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>

              {/* File attachment preview */}
              {attachedFile && (
                <div className="msg-file-preview">
                  {getFileIcon(attachedFile.name)}
                  <span className="msg-file-preview__name">{attachedFile.name}</span>
                  <Button type="text" size="small" danger onClick={() => setAttachedFile(null)}>×</Button>
                </div>
              )}

              <div className="msg-input-bar">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="sr-only"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip"
                  title="Joindre un fichier"
                />
                <Tooltip title="Joindre un fichier (max 10 Mo)">
                  <Button
                    icon={<PaperClipOutlined />}
                    onClick={() => fileInputRef.current?.click()}
                    className="msg-attach-btn"
                  />
                </Tooltip>
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écrire un message..."
                  className="msg-input"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sendMessageMutation.isPending}
                  className="msg-send-btn"
                  disabled={!messageText.trim() && !attachedFile}
                />
              </div>
            </>
          ) : (
            <div className="msg-empty">
              <div className="empty-state">
                <div className="empty-state__icon"><MessageOutlined /></div>
                <div className="empty-state__title">Sélectionnez une conversation</div>
                <div className="empty-state__desc">Choisissez une conversation dans la liste ou créez-en une nouvelle</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      <Modal
        title="Nouvelle conversation"
        open={createModalOpen}
        onOk={handleCreateRoom}
        onCancel={() => setCreateModalOpen(false)}
        confirmLoading={createRoom.isPending}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Nom de la conversation" name="name">
            <Input placeholder="Ex: Discussion avec M. Benali" />
          </Form.Item>
          <Form.Item label="Type" name="room_type" rules={[{ required: true, message: 'Requis' }]}>
            <Select placeholder="Type de conversation" options={roomTypes} />
          </Form.Item>
          <Form.Item label="Participants" name="participants" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              mode="multiple"
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner les participants"
              options={users.map((u) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name} (${u.role})`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MessagingPage;
