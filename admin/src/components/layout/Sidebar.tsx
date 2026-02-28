import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  SolutionOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  NotificationOutlined,
  MessageOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  UserOutlined,
  BankOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/* ── Super Admin navigation ── */
const superAdminSections: NavSection[] = [
  {
    title: 'Plateforme',
    items: [
      { path: '/platform/dashboard', icon: <DashboardOutlined />, label: 'Tableau de bord' },
      { path: '/platform/schools', icon: <BankOutlined />, label: 'Écoles' },
      { path: '/platform/users', icon: <UserOutlined />, label: 'Utilisateurs' },
      { path: '/platform/plans', icon: <CrownOutlined />, label: 'Abonnements' },
    ],
  },
  {
    title: 'Configuration',
    items: [
      { path: '/platform/analytics', icon: <BarChartOutlined />, label: 'Analytiques' },
      { path: '/platform/settings', icon: <SettingOutlined />, label: 'Paramètres' },
    ],
  },
];

/* ── School Admin navigation ── */
const schoolAdminSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { path: '/dashboard', icon: <DashboardOutlined />, label: 'Tableau de bord' },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { path: '/users', icon: <UserOutlined />, label: 'Utilisateurs' },
    ],
  },
  {
    title: 'Académique',
    items: [
      { path: '/students', icon: <TeamOutlined />, label: 'Élèves' },
      { path: '/teachers', icon: <SolutionOutlined />, label: 'Enseignants' },
      { path: '/grades', icon: <FileTextOutlined />, label: 'Notes & Bulletins' },
      { path: '/attendance', icon: <CheckCircleOutlined />, label: 'Absences' },
      { path: '/timetable', icon: <CalendarOutlined />, label: 'Emploi du temps' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { path: '/announcements', icon: <NotificationOutlined />, label: 'Annonces' },
      { path: '/messaging', icon: <MessageOutlined />, label: 'Messagerie' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { path: '/financial', icon: <DollarOutlined />, label: 'Finances' },
      { path: '/analytics', icon: <BarChartOutlined />, label: 'Analytiques' },
      { path: '/settings', icon: <SettingOutlined />, label: 'Paramètres' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const sections = isSuperAdmin ? superAdminSections : schoolAdminSections;

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className={`sidebar__logo-mark ${isSuperAdmin ? 'sidebar__logo-mark--sa' : ''}`}>
          {isSuperAdmin ? 'SA' : 'EC'}
        </div>
        <div className="sidebar__logo-text">
          {isSuperAdmin ? (
            <>Edu<span>Connect</span></>
          ) : (
            <>Edu<span>Connect</span></>
          )}
        </div>
      </div>

      {/* Super Admin badge */}
      {isSuperAdmin && (
        <div className="sidebar__sa-badge">
          <SafetyCertificateOutlined />
          <span>Super Admin</span>
        </div>
      )}

      {/* Navigation */}
      {sections.map((section) => (
        <React.Fragment key={section.title}>
          <div className="sidebar__section-title">{section.title}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar__nav-item${isActive(item.path) ? ' sidebar__nav-item--active' : ''}`}
            >
              <span className="sidebar__nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </React.Fragment>
      ))}

      {/* Spacer */}
      <div className="sidebar__spacer" />

      {/* Bottom card */}
      {isSuperAdmin ? (
        <div className="sidebar__school-card sidebar__school-card--sa">
          <div className="sidebar__school-info">
            <div className="sidebar__school-avatar sidebar__school-avatar--sa">
              <GlobalOutlined />
            </div>
            <div>
              <div className="sidebar__school-name">EduConnect DZ</div>
              <div className="sidebar__school-plan">Plateforme Multi-Écoles</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="sidebar__school-card">
          <div className="sidebar__school-info">
            <div className="sidebar__school-avatar">
              {(user?.school_name || 'EC')[0]?.toUpperCase() || 'E'}
            </div>
            <div>
              <div className="sidebar__school-name">{user?.school_name || 'Mon école'}</div>
              <div className="sidebar__school-plan">{user?.subscription_plan || 'Plan Starter'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="sidebar__version">v2.0.0</div>
    </nav>
  );
};

export default Sidebar;
