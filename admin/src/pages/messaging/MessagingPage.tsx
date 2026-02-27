import React, { useState } from 'react';
import { Button, Input, Empty, Spin, Tag } from 'antd';
import { SendOutlined, MessageOutlined, UserOutlined } from '@ant-design/icons';
import { useChatRooms, useChatMessages, useSendMessage } from '../../hooks/useApi';

const MessagingPage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [messageText, setMessageText] = useState('');

  const { data: rooms, isLoading: roomsLoading } = useChatRooms();
  const { data: messages, isLoading: msgsLoading } = useChatMessages(selectedRoom);
  const sendMessage = useSendMessage();

  const handleSend = () => {
    if (!messageText.trim() || !selectedRoom) return;
    sendMessage.mutate(
      { roomId: selectedRoom, data: { content: messageText.trim() } },
      { onSuccess: () => setMessageText('') },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Messagerie</h1>
          <p>Communication en temps reel</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', height: 'calc(100vh - 240px)', display: 'flex' }}>
        {/* Room list */}
        <div style={{
          width: 280,
          borderRight: '1px solid var(--gray-200)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--gray-100)', fontWeight: 700, fontSize: 14, color: 'var(--gray-900)' }}>
            Conversations
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {roomsLoading ? (
              <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
            ) : rooms?.results?.length ? (
              rooms.results.map((room: Record<string, unknown>) => (
                <div
                  key={room.id as string}
                  onClick={() => setSelectedRoom(room.id as string)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: selectedRoom === room.id ? 'var(--primary-50)' : 'transparent',
                    borderLeft: selectedRoom === room.id ? '3px solid var(--primary)' : '3px solid transparent',
                    transition: 'all 150ms ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'var(--gray-200)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      color: 'var(--gray-600)',
                    }}>
                      <UserOutlined />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {(room.name as string) || `Salle ${room.id}`}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                        {(room.last_message as string)?.slice(0, 30) || 'Aucun message'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty description="Aucune conversation" style={{ padding: 40 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </div>

        {/* Message area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedRoom ? (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {msgsLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><Spin /></div>
                ) : messages?.results?.length ? (
                  messages.results.map((msg: Record<string, unknown>, i: number) => (
                    <div
                      key={(msg.id as string) || i}
                      style={{
                        maxWidth: '70%',
                        alignSelf: (msg.is_mine as boolean) ? 'flex-end' : 'flex-start',
                        background: (msg.is_mine as boolean) ? 'var(--primary)' : 'var(--gray-100)',
                        color: (msg.is_mine as boolean) ? '#fff' : 'var(--gray-800)',
                        padding: '10px 14px',
                        borderRadius: 14,
                        fontSize: 13,
                      }}
                    >
                      {!msg.is_mine && (
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, opacity: 0.7 }}>
                          {(msg.sender_name as string) || (msg.sender as string) || ''}
                        </div>
                      )}
                      {(msg.content as string) || (msg.text as string) || ''}
                    </div>
                  ))
                ) : (
                  <Empty description="Aucun message" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: 8 }}>
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ecrire un message..."
                  style={{ borderRadius: 20, height: 40 }}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sendMessage.isPending}
                  style={{ borderRadius: 20, height: 40, width: 40, padding: 0 }}
                />
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="empty-state">
                <div className="empty-state__icon"><MessageOutlined /></div>
                <div className="empty-state__title">Selectionnez une conversation</div>
                <div className="empty-state__desc">Choisissez une conversation dans la liste pour commencer</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
