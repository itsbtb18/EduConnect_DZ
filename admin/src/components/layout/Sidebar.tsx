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
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  superAdminOnly?: boolean;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { path: '/dashboard', icon: <DashboardOutlined />, label: 'Tableau de bord' },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { path: '/users', icon: <UserOutlined />, label: 'Utilisateurs', adminOnly: true },
      { path: '/schools', icon: <BankOutlined />, label: 'Ecoles', superAdminOnly: true },
    ],
  },
  {
    title: 'Academique',
    items: [
      { path: '/students', icon: <TeamOutlined />, label: 'Eleves' },
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
      { path: '/settings', icon: <SettingOutlined />, label: 'Parametres' },
    ],
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SECTION_ADMIN' || isSuperAdmin;

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        <div className="sidebar__logo-mark">EC</div>
        <div className="sidebar__logo-text">
          Edu<span>Connect</span>
        </div>
      </div>

      {/* Navigation */}
      {sections.map((section) => {
        const visibleItems = section.items.filter((item) => {
          if (item.superAdminOnly && !isSuperAdmin) return false;
          if (item.adminOnly && !isAdmin) return false;
          return true;
        });
        if (visibleItems.length === 0) return null;
        return (
          <React.Fragment key={section.title}>
            <div className="sidebar__section-title">{section.title}</div>
            {visibleItems.map((item) => (
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
        );
      })}

      {/* Spacer */}
      <div className="sidebar__spacer" />

      {/* School info */}
      <div className="sidebar__school-card">
        <div className="sidebar__school-info">
          <div className="sidebar__school-avatar">EIK</div>
          <div>
            <div className="sidebar__school-name">Ecole Ibn Khaldoun</div>
            <div className="sidebar__school-plan">Plan Premium</div>
          </div>
        </div>
      </div>

      <div className="sidebar__version">v2.0.0</div>
    </nav>
  );
};

export default Sidebar;
