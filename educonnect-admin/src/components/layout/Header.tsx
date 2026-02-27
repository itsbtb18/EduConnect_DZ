import React from 'react';
import Avatar from '../ui/Avatar';

interface HeaderProps {
  pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({ pageTitle }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 220,
      right: 0,
      height: 60,
      background: '#0A0F1E',
      zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
    }}
  >
    {/* Left — page title */}
    <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
      {pageTitle}
    </span>

    {/* Right — actions */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Search */}
      <button
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 20,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: 0,
        }}
      >
        🔍
      </button>

      {/* Bell with badge */}
      <div style={{ position: 'relative' }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 20,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            padding: 0,
          }}
        >
          🔔
        </button>
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#FF4757',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          4
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 24,
          background: 'rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      />

      {/* User info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
        }}
      >
        <Avatar name="Admin Directeur" size={34} colorIndex={0} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
            École Ibn Khaldoun
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>
            Administrateur
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>▾</span>
      </div>
    </div>
  </div>
);

export default Header;
