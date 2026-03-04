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
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useApi';
import './Header.css';

const pageTitles: Record<string, { title: string; breadcrumb: string[] }> = {
  '/dashboard':            { title: 'Tableau de bord',             breadcrumb: ['Accueil'] },
  '/students':             { title: 'Gestion des élèves',          breadcrumb: ['Académique', 'Élèves'] },
  '/teachers':             { title: 'Gestion des enseignants',     breadcrumb: ['Académique', 'Enseignants'] },
  '/classes':              { title: 'Gestion des classes',          breadcrumb: ['Académique', 'Classes'] },
  '/grades':               { title: 'Notes & Bulletins',           breadcrumb: ['Académique', 'Notes'] },
  '/notes-bulletins':      { title: 'Notes & Bulletins',           breadcrumb: ['Académique', 'Notes & Bulletins'] },
  '/attendance':           { title: 'Suivi des absences',          breadcrumb: ['Académique', 'Absences'] },
  '/timetable':            { title: 'Emploi du temps',             breadcrumb: ['Académique', 'Emploi du temps'] },
  '/homework':             { title: 'Devoirs',                     breadcrumb: ['Académique', 'Devoirs'] },
  '/announcements':        { title: 'Annonces',                    breadcrumb: ['Communication', 'Annonces'] },
  '/messaging':            { title: 'Messagerie',                  breadcrumb: ['Communication', 'Messagerie'] },
  '/financial':            { title: 'Gestion des paiements',       breadcrumb: ['Administration', 'Paiements'] },
  '/analytics':            { title: 'Analytiques',                 breadcrumb: ['Administration', 'Analytiques'] },
  '/settings':             { title: 'Paramètres',                  breadcrumb: ['Administration', 'Paramètres'] },
  '/users':                { title: 'Gestion des utilisateurs',    breadcrumb: ['Gestion', 'Utilisateurs'] },
  '/notifications':        { title: 'Notifications',               breadcrumb: ['Communication', 'Notifications'] },
  '/platform/dashboard':   { title: 'Tableau de bord plateforme',  breadcrumb: ['Plateforme', 'Dashboard'] },
  '/platform/schools':     { title: 'Gestion des écoles',          breadcrumb: ['Plateforme', 'Écoles'] },
  '/platform/users':       { title: 'Gestion des utilisateurs',    breadcrumb: ['Plateforme', 'Utilisateurs'] },
  '/platform/plans':       { title: 'Gestion des abonnements',     breadcrumb: ['Plateforme', 'Abonnements'] },
  '/platform/analytics':   { title: 'Analytiques plateforme',      breadcrumb: ['Plateforme', 'Analytiques'] },
  '/platform/settings':    { title: 'Paramètres plateforme',       breadcrumb: ['Plateforme', 'Paramètres'] },
  '/platform/activity-logs': { title: 'Journal d\'activité',       breadcrumb: ['Plateforme', 'Journal'] },
  '/platform/system-health': { title: 'Santé du système',          breadcrumb: ['Plateforme', 'Santé système'] },
  '/platform/notifications': { title: 'Notifications',             breadcrumb: ['Plateforme', 'Notifications'] },
};

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: notifData } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifData?.results?.filter((n: any) => !n.is_read).length || 0;
  const recentNotifs = (notifData?.results || []).slice(0, 5);

  const matchedPath = Object.keys(pageTitles)
    .sort((a, b) => b.length - a.length) // longest match first
    .find((p) => location.pathname.startsWith(p));
  const pageInfo = matchedPath ? pageTitles[matchedPath] : { title: 'Tableau de bord', breadcrumb: ['Accueil'] };

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
          {pageInfo.breadcrumb.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="header__breadcrumb-sep">/</span>}
              <span className={`header__breadcrumb ${i === pageInfo.breadcrumb.length - 1 ? 'header__breadcrumb--current' : ''}`}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
        <h1 className="header__title">{pageInfo.title}</h1>
      </div>

      <div className="header__actions">
        {/* Search — opens command palette */}
        <button className="header__icon-btn" title="Rechercher (Ctrl+K)" onClick={() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
        }}>
          <SearchOutlined />
        </button>

        {/* Fullscreen */}
        <button className="header__icon-btn" title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'} onClick={toggleFullscreen}>
          {isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
        </button>

        {/* Notifications dropdown */}
        <div className="header__notif-wrapper" ref={notifRef}>
          <button className="header__icon-btn" title="Notifications" onClick={() => setNotifDropdownOpen(v => !v)}>
            <BellOutlined />
          </button>
          {unreadCount > 0 && (
            <span className="header__notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
          {notifDropdownOpen && (
            <div className="header__notif-dropdown">
              <div className="header__notif-dropdown-header">
                <span>Notifications</span>
                {unreadCount > 0 && <span className="header__notif-count">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</span>}
              </div>
              {recentNotifs.length === 0 ? (
                <div className="header__notif-empty">Aucune notification</div>
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
                      <div className="header__notif-item-time"><ClockCircleOutlined /> {n.created_at ? new Date(n.created_at).toLocaleDateString('fr-FR') : ''}</div>
                    </div>
                  );
                })
              )}
              <button
                className="header__notif-view-all"
                onClick={() => { setNotifDropdownOpen(false); navigate(notifsPath); }}
              >
                Voir toutes les notifications →
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
                <UserOutlined /> Mon profil
              </button>
              <button className="header__dropdown-btn" onClick={() => { setDropdownOpen(false); navigate(settingsPath); }}>
                <SettingOutlined /> Paramètres
              </button>
              <div className="header__dropdown-sep" />
              <button className="header__dropdown-btn header__dropdown-btn--danger" onClick={handleLogout}>
                <LogoutOutlined /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
