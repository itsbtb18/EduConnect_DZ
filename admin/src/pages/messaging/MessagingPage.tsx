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

      <div className="card msg-container">
        {/* Room list */}
        <div className="msg-sidebar">
          <div className="msg-sidebar__header">
            Conversations
          </div>
          <div className="msg-sidebar__list">
            {roomsLoading ? (
              <div className="msg-sidebar__loading"><Spin /></div>
            ) : rooms?.results?.length ? (
              rooms.results.map((room: Record<string, unknown>) => (
                <div
                  key={room.id as string}
                  onClick={() => setSelectedRoom(room.id as string)}
                  className={`msg-room ${selectedRoom === room.id ? 'msg-room--active' : ''}`}
                >
                  <div className="flex-row flex-center gap-10">
                    <div className="msg-room__avatar">
                      <UserOutlined />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="msg-room__name">
                        {(room.name as string) || `Salle ${room.id}`}
                      </div>
                      <div className="msg-room__preview">
                        {(room.last_message as string)?.slice(0, 30) || 'Aucun message'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty description="Aucune conversation" className="msg-sidebar__loading" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </div>
        </div>

        {/* Message area */}
        <div className="msg-area">
          {selectedRoom ? (
            <>
              {/* Messages */}
              <div className="msg-list">
                {msgsLoading ? (
                  <div className="loading-center"><Spin /></div>
                ) : messages?.results?.length ? (
                  messages.results.map((msg: Record<string, unknown>, i: number) => (
                    <div
                      key={(msg.id as string) || i}
                      className={`msg-bubble ${(msg.is_mine as boolean) ? 'msg-bubble--mine' : 'msg-bubble--other'}`}
                    >
                      {!msg.is_mine && (
                        <div className="msg-bubble__sender">
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
              <div className="msg-input-bar">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ecrire un message..."
                  className="msg-input"
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSend}
                  loading={sendMessage.isPending}
                  className="msg-send-btn"
                />
              </div>
            </>
          ) : (
            <div className="msg-empty">
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
