/**
 * Role-based route guards and permission configuration.
 *
 * Each operational role has a set of allowed route prefixes and a default redirect.
 * RoleGuard wraps routes and redirects users who don't have access.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type OperationalRole } from '../../context/AuthContext';

/* ── Route permissions per operational role ─────────────────────── */
export interface RoleConfig {
  label: string;
  defaultPath: string;
  /** Route prefixes this role can access */
  allowedPrefixes: string[];
  /** If true, all route access is read-only (no create/edit/delete buttons) */
  readOnly?: boolean;
}

export const ROLE_CONFIGS: Record<OperationalRole, RoleConfig> = {
  SUPER_ADMIN: {
    label: 'Super Admin',
    defaultPath: '/platform/dashboard',
    allowedPrefixes: ['/platform'],
  },
  ADMIN: {
    label: 'Directeur',
    defaultPath: '/dashboard',
    allowedPrefixes: [
      '/dashboard', '/users', '/students', '/teachers', '/classes',
      '/notes-bulletins', '/grades', '/attendance', '/homework', '/timetable',
      '/discipline', '/announcements', '/messaging', '/notifications',
      '/financial', '/infirmerie', '/cantine', '/transport', '/library',
      '/elearning', '/sms', '/fingerprint', '/staff', '/analytics', '/settings',
      '/setup',
    ],
  },
  SECTION_ADMIN: {
    label: 'Admin Section',
    defaultPath: '/dashboard',
    allowedPrefixes: [
      '/dashboard', '/users', '/students', '/teachers', '/classes',
      '/notes-bulletins', '/grades', '/attendance', '/homework', '/timetable',
      '/discipline', '/announcements', '/messaging', '/notifications',
      '/financial', '/infirmerie', '/cantine', '/transport', '/library',
      '/elearning', '/sms', '/fingerprint', '/staff', '/analytics', '/settings',
      '/setup',
    ],
  },
  GENERAL_SUPERVISOR: {
    label: 'Superviseur Général',
    defaultPath: '/dashboard',
    allowedPrefixes: [
      '/dashboard', '/students', '/teachers', '/classes',
      '/notes-bulletins', '/grades', '/attendance', '/homework', '/timetable',
      '/discipline', '/announcements', '/notifications',
      '/financial', '/finance', '/infirmerie', '/cantine', '/transport', '/library',
      '/librarian', '/canteen-manager', '/transport-manager', '/hr',
      '/elearning', '/fingerprint', '/staff', '/analytics',
    ],
    readOnly: true,
  },
  FINANCE_MANAGER: {
    label: 'Responsable Finance',
    defaultPath: '/finance/dashboard',
    allowedPrefixes: ['/finance', '/financial', '/students'],
  },
  LIBRARIAN: {
    label: 'Bibliothécaire',
    defaultPath: '/librarian/dashboard',
    allowedPrefixes: ['/librarian', '/library'],
  },
  CANTEEN_MANAGER: {
    label: 'Responsable Cantine',
    defaultPath: '/canteen-manager/dashboard',
    allowedPrefixes: ['/canteen-manager', '/cantine'],
  },
  TRANSPORT_MANAGER: {
    label: 'Responsable Transport',
    defaultPath: '/transport-manager/dashboard',
    allowedPrefixes: ['/transport-manager', '/transport'],
  },
  HR_MANAGER: {
    label: 'Responsable RH',
    defaultPath: '/hr/dashboard',
    allowedPrefixes: ['/hr', '/staff'],
  },
  TEACHER: {
    label: 'Enseignant',
    defaultPath: '/dashboard',
    allowedPrefixes: ['/dashboard'],
  },
  PARENT: {
    label: 'Parent',
    defaultPath: '/dashboard',
    allowedPrefixes: ['/dashboard'],
  },
  STUDENT: {
    label: 'Élève',
    defaultPath: '/dashboard',
    allowedPrefixes: ['/dashboard'],
  },
};

/** Check if a role is allowed to access a given path */
export function isRouteAllowed(role: OperationalRole, pathname: string): boolean {
  const config = ROLE_CONFIGS[role];
  if (!config) return false;
  return config.allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

/** Get the default path for a role */
export function getDefaultPath(role: OperationalRole): string {
  return ROLE_CONFIGS[role]?.defaultPath || '/dashboard';
}

/** Check if current role is read-only */
export function isReadOnlyRole(role: OperationalRole): boolean {
  return ROLE_CONFIGS[role]?.readOnly === true;
}

/* ── Operational role sets for quick checks ────────────────────── */
/** Roles that see the full school admin sidebar */
export const FULL_ACCESS_ROLES: OperationalRole[] = ['ADMIN', 'SECTION_ADMIN'];

/** Roles with dedicated dashboards (not the main school admin UI) */
export const DEDICATED_DASHBOARD_ROLES: OperationalRole[] = [
  'FINANCE_MANAGER', 'LIBRARIAN', 'CANTEEN_MANAGER', 'TRANSPORT_MANAGER', 'HR_MANAGER',
];

/* ── RoleGuard component ───────────────────────────────────────── */
interface RoleGuardProps {
  /** Roles allowed to access this route */
  allowed: OperationalRole[];
  children: React.ReactNode;
}

/**
 * Protects a route — redirects to the user's default path if their role
 * is not in the `allowed` list.
 */
const RoleGuard: React.FC<RoleGuardProps> = ({ allowed, children }) => {
  const { operationalRole } = useAuth();

  if (!allowed.includes(operationalRole)) {
    const fallback = getDefaultPath(operationalRole);
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export { RoleGuard };
export default RoleGuard;
