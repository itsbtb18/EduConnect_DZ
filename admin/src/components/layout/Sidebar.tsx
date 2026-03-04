import React, { useState, useEffect } from 'react';
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
  BellOutlined,
  BookOutlined,
  AuditOutlined,
  HeartOutlined,
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useAuth } from '../../context/AuthContext';
import { useSchoolProfile } from '../../hooks/useApi';
import ilmiLogo from '../../assets/ilmi-logo.png';
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
      { path: '/platform/activity-logs', icon: <AuditOutlined />, label: 'Journal d\'activité' },
      { path: '/platform/system-health', icon: <HeartOutlined />, label: 'Santé système' },
      { path: '/platform/notifications', icon: <BellOutlined />, label: 'Notifications' },
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
      { path: '/classes', icon: <AppstoreOutlined />, label: 'Classes' },
      { path: '/notes-bulletins', icon: <FileTextOutlined />, label: 'Notes & Bulletins' },
      { path: '/attendance', icon: <CheckCircleOutlined />, label: 'Absences' },
      { path: '/homework', icon: <BookOutlined />, label: 'Devoirs' },
      { path: '/timetable', icon: <CalendarOutlined />, label: 'Emploi du temps' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { path: '/announcements', icon: <NotificationOutlined />, label: 'Annonces' },
      { path: '/messaging', icon: <MessageOutlined />, label: 'Messagerie' },
      { path: '/notifications', icon: <BellOutlined />, label: 'Notifications' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { path: '/financial', icon: <DollarOutlined />, label: 'Paiements' },
      { path: '/analytics', icon: <BarChartOutlined />, label: 'Analytiques' },
      { path: '/settings', icon: <SettingOutlined />, label: 'Paramètres' },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Normalise a logo URL so it always works from the browser.
 *  – absolute URLs (http…) → strip to just the pathname so the Vite / nginx proxy handles it
 *  – relative paths → ensure they start with /
 *  – falsy values → null
 */
const normalizeLogoUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  try {
    const parsed = new URL(url);
    return parsed.pathname;           // e.g. /media/schools/logos/pic.png
  } catch {
    return url.startsWith('/') ? url : `/${url}`;
  }
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const sections = isSuperAdmin ? superAdminSections : schoolAdminSections;

  const { data: schoolProfile } = useSchoolProfile({ enabled: !isSuperAdmin });
  const school = schoolProfile as { logo_url?: string; name?: string; subscription_plan?: string } | undefined;
  const schoolLogo = !isSuperAdmin ? normalizeLogoUrl(school?.logo_url) : null;

  // Track image load errors so we can fall back to initials
  const [logoError, setLogoError] = useState(false);
  useEffect(() => { setLogoError(false); }, [schoolLogo]);
  const schoolName = !isSuperAdmin ? (school?.name || user?.school_name || 'Mon école') : '';
  const planLabel = !isSuperAdmin ? (school?.subscription_plan || user?.subscription_plan || 'Starter') : '';

  const schoolInitials = schoolName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() || 'EC';

  const initials = user
    ? `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase() || 'AD'
    : 'AD';

  return (
    <nav className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
      {/* School branding (top) or ILMI logo for super admin */}
      <div className="sidebar__logo">
        {isSuperAdmin ? (
          <img src={ilmiLogo} alt="ILMI Platform" className="sidebar__logo-img" />
        ) : (
          <>
            <div className="sidebar__school-logo">
              {schoolLogo && !logoError ? (
                <img
                  src={schoolLogo}
                  alt={schoolName}
                  className="sidebar__school-logo-img"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="sidebar__school-logo-initials">{schoolInitials}</span>
              )}
            </div>
            {!collapsed && (
              <div className="sidebar__school-info">
                <div className="sidebar__school-name">{schoolName}</div>
                <div className="sidebar__school-plan">Plan {planLabel}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Collapse toggle */}
      <button className="sidebar__toggle" onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </button>

      {/* Super Admin badge */}
      {isSuperAdmin && !collapsed && (
        <div className="sidebar__sa-badge">
          <SafetyCertificateOutlined />
          <span>Super Admin</span>
        </div>
      )}

      {/* Navigation */}
      <div className="sidebar__nav">
        {sections.map((section) => (
          <React.Fragment key={section.title}>
            {!collapsed && (
              <div className="sidebar__section-title">{section.title}</div>
            )}
            {collapsed && <div className="sidebar__section-divider" />}
            {section.items.map((item) => {
              const navItem = (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`sidebar__nav-item${isActive(item.path) ? ' sidebar__nav-item--active' : ''}`}
                >
                  <span className="sidebar__nav-icon">{item.icon}</span>
                  {!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.path} title={item.label} placement="right" mouseEnterDelay={0.1}>
                  {navItem}
                </Tooltip>
              ) : (
                navItem
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Bottom area — only shown for school admins */}
      {!isSuperAdmin && (
        <div className="sidebar__bottom">
          {!collapsed && (
            <div className="sidebar__powered-by">
              <img src={ilmiLogo} alt="ILMI" className="sidebar__powered-logo" />
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
