import React from 'react';
import { useLocation } from 'react-router-dom';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/students': 'Élèves',
  '/teachers': 'Enseignants',
  '/grades': 'Notes & Bulletins',
  '/attendance': 'Absences',
  '/timetable': 'Emploi du temps',
  '/announcements': 'Annonces',
  '/messaging': 'Messagerie',
  '/financial': 'Finances',
  '/analytics': 'Analytiques',
  '/settings': 'Paramètres',
};

const Header: React.FC = () => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'EduConnect';

  return (
    <div
      style={{
        background: '#0A0F1E',
        height: 60,
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}
    >
      {/* Left: Page title */}
      <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{title}</span>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Search */}
        <button
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: 8,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          🔍
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: 8,
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            🔔
          </button>
          <div
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              background: '#FF4757',
              borderRadius: '50%',
              fontSize: 10,
              fontWeight: 700,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0A0F1E',
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
          }}
        />

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <Avatar name="Admin User" size={32} color="#1A6BFF" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              École Ibn Khaldoun
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Badge label="Admin" color="blue" />
            </div>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginLeft: 4 }}>▾</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
