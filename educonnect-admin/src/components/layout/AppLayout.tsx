import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Tableau de bord',
  '/students':      'Gestion des Élèves',
  '/teachers':      'Enseignants',
  '/grades':        'Notes & Bulletins',
  '/attendance':    'Gestion des Absences',
  '/timetable':     'Emploi du Temps',
  '/announcements': 'Annonces',
  '/messaging':     'Messagerie',
  '/financial':     'Finances',
  '/analytics':     'Analytiques',
  '/settings':      'Paramètres',
};

const AppLayout: React.FC = () => {
  const { pathname } = useLocation();
  const pageTitle = PAGE_TITLES[pathname] ?? 'EduConnect';

  return (
    <div style={{ position: 'relative' }}>
      <Sidebar />
      <div
        style={{
          marginLeft: 220,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header pageTitle={pageTitle} />
        <main
          style={{
            marginTop: 60,
            padding: pathname === '/messaging' ? 0 : 24,
            flex: 1,
            background: pathname === '/messaging' ? 'white' : '#F0F4FF',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
