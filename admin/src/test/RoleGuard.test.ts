import { describe, it, expect } from 'vitest';
import { isRouteAllowed, getDefaultPath, isReadOnlyRole, ROLE_CONFIGS } from '../components/guards/RoleGuard';

describe('RoleGuard utilities', () => {
  describe('getDefaultPath', () => {
    it('returns /dashboard for ADMIN', () => {
      expect(getDefaultPath('ADMIN')).toBe('/dashboard');
    });

    it('returns role-specific path for FINANCE_MANAGER', () => {
      const path = getDefaultPath('FINANCE_MANAGER');
      expect(path).toContain('finance');
    });

    it('returns role-specific path for LIBRARIAN', () => {
      const path = getDefaultPath('LIBRARIAN');
      expect(path).toContain('librar');
    });
  });

  describe('isRouteAllowed', () => {
    it('ADMIN can access /dashboard', () => {
      expect(isRouteAllowed('ADMIN', '/dashboard')).toBe(true);
    });

    it('ADMIN can access /financial', () => {
      expect(isRouteAllowed('ADMIN', '/financial')).toBe(true);
    });

    it('FINANCE_MANAGER can access /finance', () => {
      expect(isRouteAllowed('FINANCE_MANAGER', '/finance')).toBe(true);
    });
  });

  describe('isReadOnlyRole', () => {
    it('GENERAL_SUPERVISOR is read-only', () => {
      expect(isReadOnlyRole('GENERAL_SUPERVISOR')).toBe(true);
    });

    it('ADMIN is not read-only', () => {
      expect(isReadOnlyRole('ADMIN')).toBe(false);
    });
  });

  describe('ROLE_CONFIGS', () => {
    it('has config for all known roles', () => {
      const expectedRoles = [
        'ADMIN', 'SECTION_ADMIN', 'GENERAL_SUPERVISOR',
        'FINANCE_MANAGER', 'LIBRARIAN', 'CANTEEN_MANAGER',
        'TRANSPORT_MANAGER', 'HR_MANAGER',
      ];
      for (const role of expectedRoles) {
        expect(ROLE_CONFIGS).toHaveProperty(role);
      }
    });

    it('each config has required fields', () => {
      for (const [, config] of Object.entries(ROLE_CONFIGS)) {
        expect(config).toHaveProperty('allowedPrefixes');
        expect(config).toHaveProperty('defaultPath');
      }
    });
  });
});
