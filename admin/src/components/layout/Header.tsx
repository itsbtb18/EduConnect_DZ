import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import './Header.css';

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
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const title = pageTitles[location.pathname] || 'EduConnect';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() || user.phone_number : 'Admin';
  const displayRole = user?.role || 'admin';

  return (
    <div className="header">
      {/* Left: Page title */}
      <span className="header__title">{title}</span>

      {/* Right: Actions */}
      <div className="header__actions">
        {/* Search */}
        <button className="header__icon-btn">🔍</button>

        {/* Notifications */}
        <div className="header__notif-wrapper">
          <button className="header__icon-btn">🔔</button>
          <div className="header__notif-badge">4</div>
        </div>

        {/* Divider */}
        <div className="header__divider" />

        {/* User */}
        <div className="header__user" onClick={() => setShowMenu(!showMenu)}>
          <Avatar name={displayName} size={32} color="#1A6BFF" />
          <div>
            <div className="header__user-name">{displayName}</div>
            <div className="header__user-role">
              <Badge label={displayRole} color="blue" />
            </div>
          </div>
          <span className="header__caret">▾</span>

          {/* Dropdown menu */}
          {showMenu && (
            <div className="header__dropdown">
              <button
                className="header__dropdown-btn"
                onClick={() => { navigate('/settings'); setShowMenu(false); }}
              >
                ⚙️ Paramètres
              </button>
              <button
                className="header__dropdown-btn header__dropdown-btn--danger"
                onClick={handleLogout}
              >
                🚪 Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
