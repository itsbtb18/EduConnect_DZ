import React, { useState } from 'react';
import Avatar from '../../components/ui/Avatar';
import { conversations, chatMessages } from '../../data/mockData';
import type { Conversation, Message } from '../../types';

const MessagingPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(conversations[0]?.id || '');
  const [input, setInput] = useState('');

  const current = conversations.find((c) => c.id === selectedId) as Conversation | undefined;
  const msgs = chatMessages.filter((m) => m.conversationId === selectedId);

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 'calc(100vh - 60px)' }}>
      {/* Conversation list */}
      <div style={{ width: 300, borderRight: '1px solid #E5E7EB', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>💬 Messagerie</h2>
          <input
            type="text"
            placeholder="Rechercher…"
            style={{
              marginTop: 10, width: '100%', padding: '8px 10px', border: '1.5px solid #E5E7EB',
              borderRadius: 10, fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', cursor: 'pointer',
                background: c.id === selectedId ? '#EFF6FF' : '#fff',
                borderLeft: c.id === selectedId ? '3px solid #1A6BFF' : '3px solid transparent',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Avatar name={c.contactName} size={36} />
                {c.online && (
                  <span
                    style={{
                      position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                      borderRadius: '50%', background: '#00C48C', border: '2px solid #fff',
                    }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{c.contactName}</span>
                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.role} — {c.lastMessage}
                </div>
              </div>
              {c.unread > 0 && (
                <span
                  style={{
                    background: '#FF4757', color: '#fff', borderRadius: '50%', width: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {c.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F8FAFC' }}>
        {current ? (
          <>
            {/* Chat header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: '#fff', borderBottom: '1px solid #E5E7EB' }}>
              <Avatar name={current.contactName} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{current.contactName}</div>
                <div style={{ fontSize: 11, color: current.online ? '#00C48C' : '#9CA3AF' }}>
                  {current.online ? '● En ligne' : '○ Hors ligne'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {msgs.map((m: Message) => {
                const fromMe = m.sender === 'admin';
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start' }}>
                    <div
                      style={{
                        maxWidth: '65%',
                        padding: '10px 14px',
                        borderRadius: fromMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: fromMe ? '#1A6BFF' : '#fff',
                        color: fromMe ? '#fff' : '#1F2937',
                        fontSize: 13,
                        lineHeight: 1.5,
                        boxShadow: fromMe ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                      }}
                    >
                      {m.text}
                      <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: 'right' }}>
                        {m.time}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 20px', background: '#fff', borderTop: '1px solid #E5E7EB' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrire un message…"
                style={{
                  flex: 1, padding: '10px 14px', border: '1.5px solid #E5E7EB', borderRadius: 12,
                  fontSize: 13, outline: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
              <button
                style={{
                  padding: '10px 20px', border: 'none', borderRadius: 12, background: '#1A6BFF',
                  color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Envoyer
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
            Sélectionnez une conversation
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingPage;
