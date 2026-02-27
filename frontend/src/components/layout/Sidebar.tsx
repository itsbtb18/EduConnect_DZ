import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import Avatar from '../ui/Avatar';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'PRINCIPAL',
    items: [{ path: '/dashboard', icon: '📊', label: 'Tableau de bord' }],
  },
  {
    title: 'ACADÉMIQUE',
    items: [
      { path: '/students', icon: '👥', label: 'Élèves' },
      { path: '/teachers', icon: '👩‍🏫', label: 'Enseignants' },
      { path: '/grades', icon: '📋', label: 'Notes & Bulletins' },
      { path: '/attendance', icon: '✅', label: 'Absences' },
      { path: '/timetable', icon: '📅', label: 'Emploi du temps' },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { path: '/announcements', icon: '📢', label: 'Annonces' },
      { path: '/messaging', icon: '💬', label: 'Messagerie' },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { path: '/financial', icon: '💰', label: 'Finances' },
      { path: '/analytics', icon: '📈', label: 'Analytiques' },
      { path: '/settings', icon: '⚙️', label: 'Paramètres' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div
      style={{
        width: 220,
        background: '#0D1B3E',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 12px',
        gap: 4,
        flexShrink: 0,
        overflowY: 'auto',
        height: '100%',
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 12px 16px',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: 'linear-gradient(135deg, #1A6BFF, #FF6B35)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
          }}
        >
          🎓
        </div>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>EduConnect</span>
      </div>

      {/* Navigation */}
      {sections.map((section) => (
        <React.Fragment key={section.title}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: '12px 12px 4px',
            }}
          >
            {section.title}
          </div>
          {section.items.map((item) => {
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  background: active ? '#1A6BFF' : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </React.Fragment>
      ))}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* School profile */}
      <div
        style={{
          padding: 12,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          marginTop: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Avatar name="École Ibn Khaldoun" size={32} color="#1A6BFF" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
              École Ibn Khaldoun
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Plan Pro</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
