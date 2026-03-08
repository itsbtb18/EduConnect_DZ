import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  DownOutlined,
  ExpandOutlined,
  CompressOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useApi';
import './Header.css';

/** Each entry stores i18n keys for title and breadcrumb trail */
const pageKeys: Record<string, { titleKey: string; breadcrumbKeys: string[] }> = {
  '/dashboard':              { titleKey: 'header.title.dashboard',          breadcrumbKeys: ['nav.principal'] },
  '/students':               { titleKey: 'header.title.students',           breadcrumbKeys: ['nav.academic', 'nav.students'] },
  '/teachers':               { titleKey: 'header.title.teachers',           breadcrumbKeys: ['nav.academic', 'nav.teachers'] },
  '/classes':                { titleKey: 'header.title.classes',            breadcrumbKeys: ['nav.academic', 'nav.classes'] },
  '/grades':                 { titleKey: 'header.title.grades',             breadcrumbKeys: ['nav.academic', 'nav.gradesAndReports'] },
  '/notes-bulletins':        { titleKey: 'header.title.grades',             breadcrumbKeys: ['nav.academic', 'nav.gradesAndReports'] },
  '/report-cards':           { titleKey: 'header.title.reportCards',        breadcrumbKeys: ['nav.academic', 'nav.reportCards'] },
  '/attendance':             { titleKey: 'header.title.attendance',         breadcrumbKeys: ['nav.academic', 'nav.attendance'] },
  '/attendance/reports':     { titleKey: 'header.title.attendanceReports',  breadcrumbKeys: ['nav.academic', 'nav.attendanceReports'] },
  '/timetable':              { titleKey: 'header.title.timetable',          breadcrumbKeys: ['nav.academic', 'nav.timetable'] },
  '/homework':               { titleKey: 'header.title.homework',           breadcrumbKeys: ['nav.academic', 'nav.homework'] },
  '/announcements':          { titleKey: 'header.title.announcements',      breadcrumbKeys: ['nav.communication', 'nav.announcements'] },
  '/messaging':              { titleKey: 'header.title.messaging',          breadcrumbKeys: ['nav.communication', 'nav.messaging'] },
  '/financial':              { titleKey: 'header.title.financial',          breadcrumbKeys: ['nav.administration', 'nav.payments'] },
  '/analytics':              { titleKey: 'header.title.analytics',          breadcrumbKeys: ['nav.administration', 'nav.analytics'] },
  '/settings':               { titleKey: 'header.title.settings',           breadcrumbKeys: ['nav.administration', 'nav.settings'] },
  '/users':                  { titleKey: 'header.title.users',              breadcrumbKeys: ['nav.users'] },
  '/notifications':          { titleKey: 'header.title.notifications',      breadcrumbKeys: ['nav.communication', 'nav.notifications'] },
  '/platform/dashboard':     { titleKey: 'header.title.dashboard',          breadcrumbKeys: ['nav.platform', 'nav.dashboard'] },
  '/platform/schools':       { titleKey: 'nav.schools',                     breadcrumbKeys: ['nav.platform', 'nav.schools'] },
  '/platform/users':         { titleKey: 'header.title.users',              breadcrumbKeys: ['nav.platform', 'nav.users'] },
  '/platform/plans':         { titleKey: 'nav.subscriptions',               breadcrumbKeys: ['nav.platform', 'nav.subscriptions'] },
  '/platform/analytics':     { titleKey: 'nav.platformAnalytics',           breadcrumbKeys: ['nav.platform', 'nav.analytics'] },
  '/platform/settings':      { titleKey: 'nav.platformSettings',            breadcrumbKeys: ['nav.platform', 'nav.settings'] },
  '/platform/activity-logs': { titleKey: 'nav.activityLogs',                breadcrumbKeys: ['nav.platform', 'nav.activityLogs'] },
  '/platform/system-health': { titleKey: 'nav.systemHealth',                breadcrumbKeys: ['nav.platform', 'nav.systemHealth'] },
  '/platform/notifications': { titleKey: 'header.title.notifications',      breadcrumbKeys: ['nav.platform', 'nav.notifications'] },
};

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: notifData } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifData?.results?.filter((n: any) => !n.is_read).length || 0;
  const recentNotifs = (notifData?.results || []).slice(0, 5);

  const matchedPath = Object.keys(pageKeys)
    .sort((a, b) => b.length - a.length) // longest match first
    .find((p) => location.pathname.startsWith(p));
  const matched = matchedPath ? pageKeys[matchedPath] : null;
  const pageTitle = matched ? t(matched.titleKey) : t('header.title.dashboard');
  const breadcrumbs = matched ? matched.breadcrumbKeys.map((k) => t(k)) : [t('nav.principal')];

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${(user.first_name || '')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase() || 'AD'
    : 'AD';

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const settingsPath = isSuperAdmin ? '/platform/settings' : '/settings';
  const notifsPath = isSuperAdmin ? '/platform/notifications' : '/notifications';

  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <header className="header">
      <div className="header__left">
        {/* Breadcrumbs */}
        <div className="header__breadcrumbs">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="header__breadcrumb-sep">/</span>}
              <span className={`header__breadcrumb ${i === breadcrumbs.length - 1 ? 'header__breadcrumb--current' : ''}`}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
        <h1 className="header__title">{pageTitle}</h1>
      </div>

      <div className="header__actions">
        {/* Search — opens command palette */}
        <button className="header__icon-btn" title={t('header.search')} onClick={() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
        }}>
          <SearchOutlined />
        </button>

        {/* Fullscreen */}
        <button className="header__icon-btn" title={isFullscreen ? t('header.exitFullscreen') : t('header.fullscreen')} onClick={toggleFullscreen}>
          {isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
        </button>

        {/* Notifications dropdown */}
        <div className="header__notif-wrapper" ref={notifRef}>
          <button className="header__icon-btn" title={t('nav.notifications')} onClick={() => setNotifDropdownOpen(v => !v)}>
            <BellOutlined />
          </button>
          {unreadCount > 0 && (
            <span className="header__notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
          {notifDropdownOpen && (
            <div className="header__notif-dropdown">
              <div className="header__notif-dropdown-header">
                <span>{t('nav.notifications')}</span>
                {unreadCount > 0 && <span className="header__notif-count">{t('header.unreadCount', { count: unreadCount })}</span>}
              </div>
              {recentNotifs.length === 0 ? (
                <div className="header__notif-empty">{t('header.noNotifications')}</div>
              ) : (
                recentNotifs.map((n: any) => {
                  const handleNotifClick = () => {
                    setNotifDropdownOpen(false);
                    if (n.notification_type === 'PAYMENT' && n.related_object_type === 'payment_expired') {
                      navigate('/financial?status=expire');
                    } else if (n.notification_type === 'ATTENDANCE') {
                      navigate('/attendance');
                    } else if (n.notification_type === 'HOMEWORK') {
                      navigate('/homework');
                    } else if (n.notification_type === 'GRADE') {
                      navigate('/notes-bulletins');
                    } else if (n.notification_type === 'ANNOUNCEMENT') {
                      navigate('/announcements');
                    } else {
                      navigate(notifsPath);
                    }
                  };
                  return (
                    <div
                      key={n.id}
                      className={`header__notif-item ${n.is_read ? '' : 'header__notif-item--unread'}`}
                      onClick={handleNotifClick}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="header__notif-item-title">{n.title || 'Notification'}</div>
                      <div className="header__notif-item-msg">{n.message?.slice(0, 60) || ''}{n.message?.length > 60 ? '…' : ''}</div>
                      <div className="header__notif-item-time"><ClockCircleOutlined /> {n.created_at ? new Date(n.created_at).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR') : ''}</div>
                    </div>
                  );
                })
              )}
              <button
                className="header__notif-view-all"
                onClick={() => { setNotifDropdownOpen(false); navigate(notifsPath); }}
              >
                {t('header.viewAllNotifications')}
              </button>
            </div>
          )}
        </div>

        <div className="header__divider" />

        {/* User dropdown */}
        <div ref={dropdownRef} className="header__user-wrapper">
          <div className="header__user" onClick={() => setDropdownOpen((v) => !v)}>
            <div className={`header__user-avatar ${isSuperAdmin ? 'header__user-avatar--sa' : ''}`}>{initials}</div>
            <div className="header__user-info">
              <span className="header__user-name">
                {user ? `${user.first_name} ${user.last_name}`.trim() || 'Admin' : 'Admin'}
              </span>
              <span className="header__user-role">
                {user?.role?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Admin'}
              </span>
            </div>
            <DownOutlined className={`header__caret ${dropdownOpen ? 'header__caret--open' : ''}`} />
          </div>

          {dropdownOpen && (
            <div className="header__dropdown">
              <button className="header__dropdown-btn" onClick={() => { setDropdownOpen(false); navigate(settingsPath); }}>
                <UserOutlined /> {t('header.myProfile')}
              </button>
              <button className="header__dropdown-btn" onClick={() => { setDropdownOpen(false); navigate(settingsPath); }}>
                <SettingOutlined /> {t('nav.settings')}
              </button>
              <div className="header__dropdown-sep" />
              <button className="header__dropdown-btn header__dropdown-btn--danger" onClick={handleLogout}>
                <LogoutOutlined /> {t('header.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
