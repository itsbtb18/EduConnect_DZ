import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  SearchOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useApi';
import './Header.css';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/students': 'Gestion des eleves',
  '/teachers': 'Gestion des enseignants',
  '/grades': 'Notes & Bulletins',
  '/attendance': 'Suivi des absences',
  '/timetable': 'Emploi du temps',
  '/announcements': 'Annonces',
  '/messaging': 'Messagerie',
  '/financial': 'Gestion financiere',
  '/analytics': 'Analytiques',
  '/settings': 'Parametres',
};

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: notifData } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifData?.results?.filter((n: any) => !n.is_read).length || 0;

  const matchedPath = Object.keys(pageTitles).find((p) => location.pathname.startsWith(p));
  const title = matchedPath ? pageTitles[matchedPath] : 'EduConnect';

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
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

  return (
    <header className="header">
      <h1 className="header__title">{title}</h1>
      <div className="header__actions">
        <button className="header__icon-btn" title="Rechercher">
          <SearchOutlined />
        </button>

        <div className="header__notif-wrapper">
          <button className="header__icon-btn" title="Notifications" onClick={() => navigate('/notifications')}>
            <BellOutlined />
          </button>
          {unreadCount > 0 && (
            <span className="header__notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
          )}
        </div>

        <button className="header__icon-btn" title="Parametres" onClick={() => navigate('/settings')}>
          <SettingOutlined />
        </button>

        <div className="header__divider" />

        <div ref={dropdownRef} className="pos-relative">
          <div className="header__user" onClick={() => setDropdownOpen((v) => !v)}>
            <div className="header__user-avatar">{initials}</div>
            <div className="header__user-info">
              <span className="header__user-name">
                {user ? `${user.first_name} ${user.last_name}`.trim() || 'Admin' : 'Admin'}
              </span>
              <span className="header__user-role">{user?.role || 'superadmin'}</span>
            </div>
            <DownOutlined className="header__caret" />
          </div>

          {dropdownOpen && (
            <div className="header__dropdown">
              <button className="header__dropdown-btn" onClick={() => { setDropdownOpen(false); navigate('/settings'); }}>
                <UserOutlined /> Mon profil
              </button>
              <button className="header__dropdown-btn" onClick={() => { setDropdownOpen(false); navigate('/settings'); }}>
                <SettingOutlined /> Parametres
              </button>
              <div className="header__dropdown-sep" />
              <button className="header__dropdown-btn header__dropdown-btn--danger" onClick={handleLogout}>
                <LogoutOutlined /> Deconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
