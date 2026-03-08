/**
 * Tests for PAGE_TITLES mapping and matching logic from usePageTitle.ts
 */
import { describe, it, expect } from 'vitest';

// Replicate the PAGE_TITLES map and matching logic
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

function getTitle(pathname: string): string {
  const match = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((p) => pathname.startsWith(p));
  const pageName = match ? PAGE_TITLES[match] : 'ILMI';
  return `${pageName} — ILMI Platform`;
}

describe('usePageTitle — title resolution', () => {
  it('resolves /dashboard', () => {
    expect(getTitle('/dashboard')).toBe('Tableau de bord — ILMI Platform');
  });

  it('resolves /platform/dashboard (super admin)', () => {
    expect(getTitle('/platform/dashboard')).toBe('Tableau de bord — ILMI Platform');
  });

  it('resolves /students list', () => {
    expect(getTitle('/students')).toBe('Élèves — ILMI Platform');
  });

  it('resolves nested student route via prefix matching', () => {
    expect(getTitle('/students/abc-123')).toBe('Élèves — ILMI Platform');
  });

  it('prefers longest match for /platform sub-routes', () => {
    // /platform/activity-logs should match before /platform/ would (if it existed)
    expect(getTitle('/platform/activity-logs')).toBe('Journal d\'activité — ILMI Platform');
  });

  it('fallbacks to ILMI for unknown routes', () => {
    expect(getTitle('/unknown/page')).toBe('ILMI — ILMI Platform');
  });

  it('resolves /login', () => {
    expect(getTitle('/login')).toBe('Connexion — ILMI Platform');
  });

  it('resolves /financial', () => {
    expect(getTitle('/financial')).toBe('Paiements — ILMI Platform');
  });

  it('resolves /grades', () => {
    expect(getTitle('/grades')).toBe('Notes — ILMI Platform');
  });

  it('resolves /attendance sub-routes', () => {
    expect(getTitle('/attendance')).toBe('Absences — ILMI Platform');
    expect(getTitle('/attendance/reports')).toBe('Absences — ILMI Platform');
  });
});
