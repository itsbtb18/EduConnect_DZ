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
  MedicineBoxOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  EyeOutlined,
  CoffeeOutlined,
  CarOutlined,
  PhoneOutlined,
  ScanOutlined,
  IdcardOutlined,
  ReadOutlined,
  ContainerOutlined,
  TruckOutlined,
  ReconciliationOutlined,
  ScheduleOutlined,
  StopOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Tooltip, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth, type OperationalRole } from '../../context/AuthContext';
import { useSchoolProfile } from '../../hooks/useApi';
import { ROLE_CONFIGS, DEDICATED_DASHBOARD_ROLES } from '../guards/RoleGuard';
import ilmiLogo from '../../assets/ilmi-logo.png';
import './Sidebar.css';

interface NavItem {
  path: string;
  icon: React.ReactNode;
  labelKey: string;
  requiredModule?: string;
  /** Show a read-only icon indicator */
  readOnlyBadge?: boolean;
}

interface NavSection {
  titleKey: string;
  items: NavItem[];
}

/* ── Super Admin navigation ── */
const superAdminSections: NavSection[] = [
  {
    titleKey: 'nav.platform',
    items: [
      { path: '/platform/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
      { path: '/platform/schools', icon: <BankOutlined />, labelKey: 'nav.schools' },
      { path: '/platform/users', icon: <UserOutlined />, labelKey: 'nav.users' },
      { path: '/platform/plans', icon: <CrownOutlined />, labelKey: 'nav.subscriptions' },
      { path: '/platform/invoices', icon: <SafetyCertificateOutlined />, labelKey: 'nav.invoices' },
      { path: '/platform/content', icon: <BookOutlined />, labelKey: 'nav.content' },
      { path: '/platform/impersonation', icon: <EyeOutlined />, labelKey: 'nav.impersonation' },
    ],
  },
  {
    titleKey: 'nav.platformSettings',
    items: [
      { path: '/platform/analytics', icon: <BarChartOutlined />, labelKey: 'nav.platformAnalytics' },
      { path: '/platform/activity-logs', icon: <AuditOutlined />, labelKey: 'nav.activityLogs' },
      { path: '/platform/system-health', icon: <HeartOutlined />, labelKey: 'nav.systemHealth' },
      { path: '/platform/notifications', icon: <BellOutlined />, labelKey: 'nav.notifications' },
      { path: '/platform/settings', icon: <SettingOutlined />, labelKey: 'nav.settings' },
    ],
  },
];

/* ── School Admin (Director) navigation — full access ── */
const schoolAdminSections: NavSection[] = [
  {
    titleKey: 'nav.principal',
    items: [
      { path: '/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
    ],
  },
  {
    titleKey: 'nav.users',
    items: [
      { path: '/users', icon: <UserOutlined />, labelKey: 'nav.users' },
    ],
  },
  {
    titleKey: 'nav.academic',
    items: [
      { path: '/students', icon: <TeamOutlined />, labelKey: 'nav.students' },
      { path: '/teachers', icon: <SolutionOutlined />, labelKey: 'nav.teachers' },
      { path: '/classes', icon: <AppstoreOutlined />, labelKey: 'nav.classes' },
      { path: '/notes-bulletins', icon: <FileTextOutlined />, labelKey: 'nav.gradesAndReports' },
      { path: '/report-cards', icon: <FileTextOutlined />, labelKey: 'nav.reportCards' },
      { path: '/attendance', icon: <CheckCircleOutlined />, labelKey: 'nav.attendance' },
      { path: '/attendance/reports', icon: <BarChartOutlined />, labelKey: 'nav.attendanceReports' },
      { path: '/homework', icon: <BookOutlined />, labelKey: 'nav.homework' },
      { path: '/timetable', icon: <CalendarOutlined />, labelKey: 'nav.timetable' },
      { path: '/discipline', icon: <SafetyCertificateOutlined />, labelKey: 'nav.discipline' },
    ],
  },
  {
    titleKey: 'nav.communication',
    items: [
      { path: '/announcements', icon: <NotificationOutlined />, labelKey: 'nav.announcements' },
      { path: '/messaging', icon: <MessageOutlined />, labelKey: 'nav.messaging' },
      { path: '/notifications', icon: <BellOutlined />, labelKey: 'nav.notifications' },
    ],
  },
  {
    titleKey: 'nav.administration',
    items: [
      { path: '/financial', icon: <DollarOutlined />, labelKey: 'nav.payments', requiredModule: 'finance' },
      { path: '/infirmerie', icon: <MedicineBoxOutlined />, labelKey: 'nav.infirmary', requiredModule: 'infirmerie' },
      { path: '/cantine', icon: <CoffeeOutlined />, labelKey: 'nav.canteen', requiredModule: 'cantine' },
      { path: '/transport', icon: <CarOutlined />, labelKey: 'nav.transport', requiredModule: 'transport' },
      { path: '/library', icon: <BookOutlined />, labelKey: 'nav.library', requiredModule: 'bibliotheque' },
      { path: '/elearning', icon: <AppstoreOutlined />, labelKey: 'nav.elearning', requiredModule: 'auto_education' },
      { path: '/sms', icon: <PhoneOutlined />, labelKey: 'nav.sms', requiredModule: 'sms' },
      { path: '/fingerprint', icon: <ScanOutlined />, labelKey: 'nav.fingerprint', requiredModule: 'empreintes' },
      { path: '/staff', icon: <AuditOutlined />, labelKey: 'nav.staff' },
      { path: '/analytics', icon: <BarChartOutlined />, labelKey: 'nav.analytics' },
      { path: '/settings', icon: <SettingOutlined />, labelKey: 'nav.settings' },
    ],
  },
];

/* ── General Supervisor — read-only access to everything ── */
const supervisorSections: NavSection[] = [
  {
    titleKey: 'nav.principal',
    items: [
      { path: '/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard', readOnlyBadge: true },
    ],
  },
  {
    titleKey: 'nav.academic',
    items: [
      { path: '/students', icon: <TeamOutlined />, labelKey: 'nav.students', readOnlyBadge: true },
      { path: '/teachers', icon: <SolutionOutlined />, labelKey: 'nav.teachers', readOnlyBadge: true },
      { path: '/classes', icon: <AppstoreOutlined />, labelKey: 'nav.classes', readOnlyBadge: true },
      { path: '/notes-bulletins', icon: <FileTextOutlined />, labelKey: 'nav.gradesAndReports', readOnlyBadge: true },
      { path: '/report-cards', icon: <FileTextOutlined />, labelKey: 'nav.reportCards', readOnlyBadge: true },
      { path: '/attendance', icon: <CheckCircleOutlined />, labelKey: 'nav.attendance', readOnlyBadge: true },
      { path: '/attendance/reports', icon: <BarChartOutlined />, labelKey: 'nav.attendanceReports', readOnlyBadge: true },
      { path: '/homework', icon: <BookOutlined />, labelKey: 'nav.homework', readOnlyBadge: true },
      { path: '/timetable', icon: <CalendarOutlined />, labelKey: 'nav.timetable', readOnlyBadge: true },
      { path: '/discipline', icon: <SafetyCertificateOutlined />, labelKey: 'nav.discipline', readOnlyBadge: true },
    ],
  },
  {
    titleKey: 'nav.communication',
    items: [
      { path: '/announcements', icon: <NotificationOutlined />, labelKey: 'nav.announcements' },
      { path: '/notifications', icon: <BellOutlined />, labelKey: 'nav.notifications', readOnlyBadge: true },
    ],
  },
  {
    titleKey: 'nav.supervision',
    items: [
      { path: '/financial', icon: <DollarOutlined />, labelKey: 'nav.payments', requiredModule: 'finance', readOnlyBadge: true },
      { path: '/infirmerie', icon: <MedicineBoxOutlined />, labelKey: 'nav.infirmary', requiredModule: 'infirmerie', readOnlyBadge: true },
      { path: '/cantine', icon: <CoffeeOutlined />, labelKey: 'nav.canteen', requiredModule: 'cantine', readOnlyBadge: true },
      { path: '/transport', icon: <CarOutlined />, labelKey: 'nav.transport', requiredModule: 'transport', readOnlyBadge: true },
      { path: '/library', icon: <BookOutlined />, labelKey: 'nav.library', requiredModule: 'bibliotheque', readOnlyBadge: true },
      { path: '/elearning', icon: <AppstoreOutlined />, labelKey: 'nav.elearning', requiredModule: 'auto_education', readOnlyBadge: true },
      { path: '/fingerprint', icon: <ScanOutlined />, labelKey: 'nav.fingerprint', requiredModule: 'empreintes', readOnlyBadge: true },
      { path: '/staff', icon: <AuditOutlined />, labelKey: 'nav.staff', readOnlyBadge: true },
      { path: '/analytics', icon: <BarChartOutlined />, labelKey: 'nav.analytics', readOnlyBadge: true },
    ],
  },
];

/* ── Finance Manager ── */
const financeManagerSections: NavSection[] = [
  {
    titleKey: 'nav.finance',
    items: [
      { path: '/finance/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
      { path: '/financial', icon: <DollarOutlined />, labelKey: 'nav.payments' },
      { path: '/students', icon: <TeamOutlined />, labelKey: 'nav.students', readOnlyBadge: true },
    ],
  },
];

/* ── Librarian ── */
const librarianSections: NavSection[] = [
  {
    titleKey: 'nav.library',
    items: [
      { path: '/librarian/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
      { path: '/library/catalog', icon: <ReadOutlined />, labelKey: 'nav.catalog' },
      { path: '/library/loans', icon: <ContainerOutlined />, labelKey: 'nav.loans' },
      { path: '/library/requests', icon: <ReconciliationOutlined />, labelKey: 'nav.requests' },
      { path: '/library/reports', icon: <BarChartOutlined />, labelKey: 'nav.reports' },
    ],
  },
];

/* ── Canteen Manager ── */
const canteenManagerSections: NavSection[] = [
  {
    titleKey: 'nav.canteen',
    items: [
      { path: '/canteen-manager/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
      { path: '/cantine/enrollments', icon: <TeamOutlined />, labelKey: 'nav.enrollments' },
      { path: '/cantine/menus', icon: <CoffeeOutlined />, labelKey: 'nav.menus' },
      { path: '/cantine/reports', icon: <BarChartOutlined />, labelKey: 'nav.reports' },
    ],
  },
];

/* ── Transport Manager ── */
const transportManagerSections: NavSection[] = [
  {
    titleKey: 'nav.transport',
    items: [
      { path: '/transport-manager/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
      { path: '/transport/lines', icon: <TruckOutlined />, labelKey: 'nav.lines' },
      { path: '/transport/drivers', icon: <IdcardOutlined />, labelKey: 'nav.drivers' },
      { path: '/transport/assignments', icon: <TeamOutlined />, labelKey: 'nav.assignments' },
      { path: '/transport/reports', icon: <BarChartOutlined />, labelKey: 'nav.reports' },
    ],
  },
];

/* ── HR Manager ── */
const hrManagerSections: NavSection[] = [
  {
    titleKey: 'nav.hr',
    items: [
      { path: '/hr/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
      { path: '/staff', icon: <AuditOutlined />, labelKey: 'nav.staff' },
      { path: '/teachers', icon: <SolutionOutlined />, labelKey: 'nav.teachers', readOnlyBadge: true },
    ],
  },
];

/* ── Training Center Admin navigation ── */
const trainingCenterSections: NavSection[] = [
  {
    titleKey: 'nav.principal',
    items: [
      { path: '/formation/dashboard', icon: <DashboardOutlined />, labelKey: 'nav.dashboard' },
    ],
  },
  {
    titleKey: 'nav.users',
    items: [
      { path: '/users', icon: <UserOutlined />, labelKey: 'nav.users' },
      { path: '/formation/learners', icon: <TeamOutlined />, labelKey: 'nav.learners' },
      { path: '/formation/trainers', icon: <SolutionOutlined />, labelKey: 'nav.trainers' },
      { path: '/formation/groups', icon: <AppstoreOutlined />, labelKey: 'nav.groups' },
    ],
  },
  {
    titleKey: 'nav.planning',
    items: [
      { path: '/formation/schedule', icon: <ScheduleOutlined />, labelKey: 'nav.schedule' },
      { path: '/formation/evaluations', icon: <TrophyOutlined />, labelKey: 'nav.evaluations' },
      { path: '/formation/cancelled-sessions', icon: <StopOutlined />, labelKey: 'nav.cancelledSessions' },
    ],
  },
  {
    titleKey: 'nav.administration',
    items: [
      { path: '/formation/finance', icon: <DollarOutlined />, labelKey: 'nav.finance' },
      { path: '/analytics', icon: <BarChartOutlined />, labelKey: 'nav.analytics' },
      { path: '/settings', icon: <SettingOutlined />, labelKey: 'nav.settings' },
    ],
  },
];

/* ── Role → sidebar mapping ── */
function getSectionsForRole(role: OperationalRole): NavSection[] {
  switch (role) {
    case 'SUPER_ADMIN': return superAdminSections;
    case 'GENERAL_SUPERVISOR': return supervisorSections;
    case 'FINANCE_MANAGER': return financeManagerSections;
    case 'LIBRARIAN': return librarianSections;
    case 'CANTEEN_MANAGER': return canteenManagerSections;
    case 'TRANSPORT_MANAGER': return transportManagerSections;
    case 'HR_MANAGER': return hrManagerSections;
    default: return schoolAdminSections;
  }
}

/* ── Role badge colors ── */
const ROLE_BADGE_COLORS: Partial<Record<OperationalRole, { bg: string; color: string }>> = {
  GENERAL_SUPERVISOR: { bg: '#EFF6FF', color: '#2563EB' },
  FINANCE_MANAGER: { bg: '#FFF7ED', color: '#EA580C' },
  LIBRARIAN: { bg: '#F5F3FF', color: '#7C3AED' },
  CANTEEN_MANAGER: { bg: '#ECFDF5', color: '#059669' },
  TRANSPORT_MANAGER: { bg: '#FEF3C7', color: '#D97706' },
  HR_MANAGER: { bg: '#FDF2F8', color: '#DB2777' },
};

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
  const { t } = useTranslation();
  const { user, activeModules, operationalRole } = useAuth();
  const isActive = (path: string) => location.pathname.startsWith(path);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const rawSections = getSectionsForRole(operationalRole);
  const roleConfig = ROLE_CONFIGS[operationalRole];
  const roleBadge = ROLE_BADGE_COLORS[operationalRole];
  const isDedicatedRole = DEDICATED_DASHBOARD_ROLES.includes(operationalRole);

  const { data: schoolProfile } = useSchoolProfile({ enabled: !isSuperAdmin });
  const school = schoolProfile as { logo_url?: string; name?: string; subscription_plan?: string; school_category?: string } | undefined;

  // Use training center navigation when school is a training center
  const isTrainingCenter = school?.school_category === 'TRAINING_CENTER';
  const effectiveSections = (!isSuperAdmin && !isDedicatedRole && isTrainingCenter)
    ? trainingCenterSections
    : rawSections;

  // Filter out nav items whose requiredModule is not active (school-level only)
  const sections = isSuperAdmin || isDedicatedRole
    ? effectiveSections
    : effectiveSections
        .map((s) => ({
          ...s,
          items: s.items.filter(
            (item) => !item.requiredModule || activeModules.includes(item.requiredModule)
          ),
        }))
        .filter((s) => s.items.length > 0);

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

      {/* Operational role badge */}
      {roleBadge && !collapsed && (
        <div className="sidebar__role-badge" style={{ background: roleBadge.bg, color: roleBadge.color }}>
          <EyeOutlined />
          <span>{roleConfig.label}</span>
        </div>
      )}

      {/* Navigation */}
      <div className="sidebar__nav">
        {sections.map((section) => (
          <React.Fragment key={section.titleKey}>
            {!collapsed && (
              <div className="sidebar__section-title">{t(section.titleKey)}</div>
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
                  {!collapsed && (
                    <>
                      <span className="sidebar__nav-label">{t(item.labelKey)}</span>
                      {item.readOnlyBadge && (
                        <EyeOutlined style={{ fontSize: 10, opacity: 0.5, marginInlineStart: 'auto' }} />
                      )}
                    </>
                  )}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.path} title={t(item.labelKey)} placement="right" mouseEnterDelay={0.1}>
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
