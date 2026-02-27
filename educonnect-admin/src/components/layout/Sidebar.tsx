import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [
      { icon: '📊', label: 'Tableau de bord', path: '/dashboard' },
    ],
  },
  {
    title: 'ACADÉMIQUE',
    items: [
      { icon: '👥',   label: 'Élèves',            path: '/students' },
      { icon: '👩‍🏫',  label: 'Enseignants',        path: '/teachers' },
      { icon: '📋',   label: 'Notes & Bulletins',  path: '/grades' },
      { icon: '✅',   label: 'Absences',            path: '/attendance' },
      { icon: '📅',   label: 'Emploi du temps',    path: '/timetable' },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { icon: '📢', label: 'Annonces',   path: '/announcements' },
      { icon: '💬', label: 'Messagerie', path: '/messaging' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { icon: '💰', label: 'Finances',    path: '/financial' },
      { icon: '📈', label: 'Analytiques', path: '/analytics' },
      { icon: '⚙️', label: 'Paramètres', path: '/settings' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: 220,
        height: '100vh',
        background: '#0D1B3E',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
        overflowY: 'auto',
        zIndex: 200,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 24,
          padding: '8px 4px',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1A6BFF, #FF6B35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          🎓
        </div>
        <span style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>
          EduConnect
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        {NAV.map((section) => (
          <div key={section.title}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.3)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '12px 12px 4px',
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    background: isActive ? '#1A6BFF' : 'transparent',
                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                    fontWeight: isActive ? 600 : 500,
                    fontFamily: 'var(--font)',
                    marginBottom: 2,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* School Profile Card */}
      <div
        style={{
          marginTop: 'auto',
          padding: 12,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Avatar name="École Ibn Khaldoun" size={32} colorIndex={0} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
            École Ibn Khaldoun
          </div>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              background: 'rgba(26,107,255,0.3)',
              color: '#A5B4FC',
              padding: '2px 6px',
              borderRadius: 100,
              display: 'inline-block',
              marginTop: 2,
            }}
          >
            Pro
          </span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
