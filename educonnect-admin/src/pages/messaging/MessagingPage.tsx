import React, { useState, useRef, useEffect } from 'react';
import Avatar from '../../components/ui/Avatar';
import SearchBar from '../../components/ui/SearchBar';
import { conversations } from '../../data/mockData';
import { Conversation, Message } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocalConversation extends Conversation {
  messages: Message[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isOutgoing = (msg: Message) => msg.senderId === 'admin';

// ─── Online dot ───────────────────────────────────────────────────────────────

const OnlineDot: React.FC<{ size?: number }> = ({ size = 10 }) => (
  <span
    style={{
      position: 'absolute',
      bottom: 1,
      right: 1,
      width: size,
      height: size,
      borderRadius: '50%',
      background: '#00C48C',
      border: '2px solid white',
      display: 'block',
    }}
  />
);

// ─── Small buttons ────────────────────────────────────────────────────────────

const SmBtn: React.FC<{
  label: string;
  variant?: 'secondary' | 'outline';
  onClick?: () => void;
}> = ({ label, variant = 'secondary', onClick }) => {
  const [hov, setHov] = useState(false);

  const styles: Record<string, React.CSSProperties> = {
    secondary: {
      background: hov ? '#F3F4F6' : '#F9FAFB',
      border: '1.5px solid #D1D5DB',
      color: '#374151',
    },
    outline: {
      background: hov ? '#E8F0FF' : 'white',
      border: '1.5px solid #1A6BFF',
      color: '#1A6BFF',
    },
  };

  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'var(--font)',
        transition: 'background 0.15s',
        ...styles[variant],
      }}
    >
      {label}
    </button>
  );
};

// ─── Conversation Item ────────────────────────────────────────────────────────

const ConvItem: React.FC<{
  conv: LocalConversation;
  active: boolean;
  index: number;
  onClick: () => void;
}> = ({ conv, active, index, onClick }) => {
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        gap: 10,
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid #F9FAFB',
        background: active || hov ? '#F9FAFB' : 'white',
        transition: 'background 0.12s',
      }}
    >
      {/* Avatar + online dot */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar name={conv.participantName} size={40} colorIndex={index} />
        {conv.online && <OnlineDot />}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1F2937' }}>
            {conv.participantName}
          </span>
          <span style={{ fontSize: 10, color: '#9CA3AF', flexShrink: 0, marginLeft: 6 }}>
            {conv.lastTime}
          </span>
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{conv.relatedStudent}</div>
        <div
          style={{
            fontSize: 12,
            color: '#6B7280',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: 2,
          }}
        >
          {conv.lastMessage}
        </div>
      </div>

      {/* Unread badge */}
      {conv.unreadCount > 0 && (
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#1A6BFF',
            color: 'white',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            alignSelf: 'center',
          }}
        >
          {conv.unreadCount}
        </div>
      )}
    </div>
  );
};

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MsgBubble: React.FC<{ msg: Message; convIndex: number }> = ({ msg, convIndex }) => {
  const out = isOutgoing(msg);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: out ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 8,
        flexDirection: out ? 'row-reverse' : 'row',
      }}
    >
      <Avatar name={msg.senderName} size={30} colorIndex={out ? 0 : convIndex} />

      <div style={{ maxWidth: '70%' }}>
        <div
          style={{
            background: out ? '#1A6BFF' : 'white',
            color: out ? 'white' : '#1F2937',
            borderRadius: out ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            padding: '10px 14px',
            fontSize: 13,
            lineHeight: 1.5,
            boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
          }}
        >
          {msg.content}
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#9CA3AF',
            marginTop: 3,
            textAlign: out ? 'right' : 'left',
          }}
        >
          {msg.sentAt}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const MessagingPage: React.FC = () => {
  const [localConvs, setLocalConvs] = useState<LocalConversation[]>(
    conversations as LocalConversation[],
  );
  const [activeId, setActiveId] = useState<string>(conversations[0].id);
  const [search,   setSearch]   = useState('');
  const [input,    setInput]    = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = localConvs.find((c) => c.id === activeId) ?? localConvs[0];
  const convIndex  = localConvs.findIndex((c) => c.id === activeId);

  const filtered = localConvs.filter((c) =>
    !search ||
    c.participantName.toLowerCase().includes(search.toLowerCase()) ||
    c.relatedStudent.toLowerCase().includes(search.toLowerCase()),
  );

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv.messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const newMsg: Message = {
      id: `local-${Date.now()}`,
      senderId: 'admin',
      senderName: 'Admin',
      senderRole: 'admin',
      content: text,
      sentAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };

    setLocalConvs((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: text, lastTime: 'À l\'instant' }
          : c,
      ),
    );
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>

      {/* ── LEFT PANEL ── */}
      <div
        style={{
          width: 300,
          flexShrink: 0,
          background: 'white',
          borderRight: '1px solid #F3F4F6',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Panel header */}
        <div style={{ padding: 16, borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
            Messages
          </div>
          <SearchBar
            placeholder="Rechercher..."
            value={search}
            onChange={setSearch}
            maxWidth={999}
          />
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.map((conv, i) => (
            <ConvItem
              key={conv.id}
              conv={conv}
              active={conv.id === activeId}
              index={i}
              onClick={() => setActiveId(conv.id)}
            />
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#F8F9FF',
        }}
      >
        {/* Chat header */}
        <div
          style={{
            padding: '14px 20px',
            background: 'white',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar name={activeConv.participantName} size={40} colorIndex={convIndex} />
            {activeConv.online && <OnlineDot />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>
              {activeConv.participantName}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>
              {activeConv.participantRole} · {activeConv.relatedStudent}
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <SmBtn label="📎 Joindre" variant="secondary" />
            <SmBtn label="📝 Modèle"  variant="outline"   />
          </div>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {activeConv.messages.map((msg, i) => (
            <MsgBubble key={msg.id} msg={msg} convIndex={convIndex + i + 1} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div
          style={{
            padding: '14px 20px',
            background: 'white',
            borderTop: '1px solid #F3F4F6',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1 }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrire un message… (Entrée pour envoyer)"
              rows={1}
              style={{
                width: '100%',
                borderRadius: 10,
                border: '1.5px solid #D1D5DB',
                padding: '10px 14px',
                fontSize: 13,
                resize: 'none',
                height: 44,
                fontFamily: 'var(--font)',
                outline: 'none',
                boxSizing: 'border-box',
                color: '#374151',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#1A6BFF')}
              onBlur={(e)  => (e.target.style.borderColor = '#D1D5DB')}
            />
          </div>

          <button
            style={{
              padding: 12,
              borderRadius: 10,
              border: '1.5px solid #D1D5DB',
              background: '#F9FAFB',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              fontFamily: 'var(--font)',
            }}
          >
            📎
          </button>

          <button
            onClick={handleSend}
            style={{
              padding: '12px 20px',
              borderRadius: 10,
              border: 'none',
              background: input.trim() ? '#1A6BFF' : '#93BFFF',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: input.trim() ? 'pointer' : 'default',
              fontFamily: 'var(--font)',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            Envoyer →
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
