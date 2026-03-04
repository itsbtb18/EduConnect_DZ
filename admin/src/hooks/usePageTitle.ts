import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PAGE_TITLES: Record<string, string> = {
  '/platform/dashboard':     'Tableau de bord',
  '/platform/schools':       'Gestion des écoles',
  '/platform/users':         'Utilisateurs',
  '/platform/plans':         'Abonnements',
  '/platform/analytics':     'Analytiques',
  '/platform/settings':      'Paramètres',
  '/platform/activity-logs': 'Journal d\'activité',
  '/platform/system-health': 'Santé système',
  '/platform/notifications': 'Notifications',
  '/dashboard':              'Tableau de bord',
  '/students':               'Élèves',
  '/teachers':               'Enseignants',
  '/classes':                'Classes',
  '/grades':                 'Notes',
  '/attendance':             'Absences',
  '/timetable':              'Emploi du temps',
  '/homework':               'Devoirs',
  '/announcements':          'Annonces',
  '/messaging':              'Messagerie',
  '/financial':              'Paiements',
  '/analytics':              'Analytiques',
  '/notifications':          'Notifications',
  '/settings':               'Paramètres',
  '/login':                  'Connexion',
};

/**
 * Sets <title> to "PageName — ILMI Platform" on every route change.
 */
export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = Object.keys(PAGE_TITLES)
      .sort((a, b) => b.length - a.length)
      .find((p) => pathname.startsWith(p));

    const pageName = match ? PAGE_TITLES[match] : 'ILMI';
    document.title = `${pageName} — ILMI Platform`;
  }, [pathname]);
}
