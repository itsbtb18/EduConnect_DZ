/**
 * Tests for AuthContext — decodeJwtPayload and role computation logic
 */
import { describe, it, expect } from 'vitest';

// Replicate decodeJwtPayload since it's not exported
function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

// Helper to create a fake JWT with given payload
function createFakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake_signature`;
}

describe('decodeJwtPayload', () => {
  it('decodes a valid JWT payload', () => {
    const token = createFakeJwt({
      user_id: '123',
      role: 'ADMIN',
      school_id: 'school-1',
      active_modules: ['grades', 'attendance', 'finance'],
    });
    const payload = decodeJwtPayload(token);
    expect(payload.user_id).toBe('123');
    expect(payload.role).toBe('ADMIN');
    expect(payload.active_modules).toEqual(['grades', 'attendance', 'finance']);
  });

  it('returns empty object for invalid token', () => {
    expect(decodeJwtPayload('not.a.valid.jwt')).toEqual({});
    expect(decodeJwtPayload('')).toEqual({});
    expect(decodeJwtPayload('single')).toEqual({});
  });

  it('handles URL-safe base64 characters', () => {
    // Create JWT with base64url encoding (- and _)
    const payload = { sub: 'test', data: 'value+with/special' };
    const base64url = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const token = `header.${base64url}.signature`;
    const decoded = decodeJwtPayload(token);
    expect(decoded.sub).toBe('test');
  });

  it('extracts exp claim correctly', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = createFakeJwt({ exp });
    const payload = decodeJwtPayload(token);
    expect(payload.exp).toBe(exp);
  });
});

describe('Role computation logic', () => {
  // Mirror the logic from AuthContext
  function computeRoles(user: { role: string } | null) {
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    const isAdmin = isSuperAdmin || user?.role === 'ADMIN' || user?.role === 'SECTION_ADMIN';
    const operationalRole = (user?.role as string) || 'STUDENT';
    return { isSuperAdmin, isAdmin, operationalRole };
  }

  it('identifies SUPER_ADMIN correctly', () => {
    const result = computeRoles({ role: 'SUPER_ADMIN' });
    expect(result.isSuperAdmin).toBe(true);
    expect(result.isAdmin).toBe(true);
    expect(result.operationalRole).toBe('SUPER_ADMIN');
  });

  it('identifies ADMIN correctly', () => {
    const result = computeRoles({ role: 'ADMIN' });
    expect(result.isSuperAdmin).toBe(false);
    expect(result.isAdmin).toBe(true);
    expect(result.operationalRole).toBe('ADMIN');
  });

  it('identifies SECTION_ADMIN as admin', () => {
    const result = computeRoles({ role: 'SECTION_ADMIN' });
    expect(result.isSuperAdmin).toBe(false);
    expect(result.isAdmin).toBe(true);
  });

  it('identifies non-admin roles correctly', () => {
    for (const role of ['TEACHER', 'PARENT', 'STUDENT', 'FINANCE_MANAGER', 'LIBRARIAN']) {
      const result = computeRoles({ role });
      expect(result.isSuperAdmin).toBe(false);
      expect(result.isAdmin).toBe(false);
      expect(result.operationalRole).toBe(role);
    }
  });

  it('defaults to STUDENT for null user', () => {
    const result = computeRoles(null);
    expect(result.isSuperAdmin).toBe(false);
    expect(result.isAdmin).toBe(false);
    expect(result.operationalRole).toBe('STUDENT');
  });
});
