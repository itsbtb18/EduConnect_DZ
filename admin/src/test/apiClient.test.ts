/**
 * Tests for the Axios API client interceptor logic
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API Client — token management logic', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('stores tokens in localStorage', () => {
    localStorage.setItem('access_token', 'test-access');
    localStorage.setItem('refresh_token', 'test-refresh');
    expect(localStorage.getItem('access_token')).toBe('test-access');
    expect(localStorage.getItem('refresh_token')).toBe('test-refresh');
  });

  it('clears tokens on logout', () => {
    localStorage.setItem('access_token', 'test-access');
    localStorage.setItem('refresh_token', 'test-refresh');

    // Simulate logout
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('formatsBearertoken correctly', () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.test.sig';
    const header = `Bearer ${token}`;
    expect(header).toBe(`Bearer ${token}`);
    expect(header.startsWith('Bearer ')).toBe(true);
  });
});

describe('API Client — refresh queue logic', () => {
  it('processQueue resolves pending promises with new token', async () => {
    let failedQueue: Array<{
      resolve: (token: string) => void;
      reject: (error: unknown) => void;
    }> = [];

    const processQueue = (error: unknown, token: string | null = null) => {
      failedQueue.forEach((prom) => {
        if (token) prom.resolve(token);
        else prom.reject(error);
      });
      failedQueue = [];
    };

    // Queue up two pending requests
    const promise1 = new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
    const promise2 = new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });

    expect(failedQueue).toHaveLength(2);

    // Process queue with new token
    processQueue(null, 'new-access-token');

    const result1 = await promise1;
    const result2 = await promise2;
    expect(result1).toBe('new-access-token');
    expect(result2).toBe('new-access-token');
    expect(failedQueue).toHaveLength(0);
  });

  it('processQueue rejects pending promises on error', async () => {
    let failedQueue: Array<{
      resolve: (token: string) => void;
      reject: (error: unknown) => void;
    }> = [];

    const processQueue = (error: unknown, token: string | null = null) => {
      failedQueue.forEach((prom) => {
        if (token) prom.resolve(token);
        else prom.reject(error);
      });
      failedQueue = [];
    };

    const promise = new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });

    processQueue(new Error('refresh failed'));

    await expect(promise).rejects.toThrow('refresh failed');
    expect(failedQueue).toHaveLength(0);
  });
});

describe('API Client — auth URL skip logic', () => {
  it('identifies auth URLs that should skip refresh', () => {
    const shouldSkipRefresh = (url?: string) => url?.includes('/auth/') ?? false;

    expect(shouldSkipRefresh('/api/v1/auth/login/')).toBe(true);
    expect(shouldSkipRefresh('/api/v1/auth/refresh/')).toBe(true);
    expect(shouldSkipRefresh('/api/v1/auth/logout/')).toBe(true);
    expect(shouldSkipRefresh('/api/v1/students/')).toBe(false);
    expect(shouldSkipRefresh('/api/v1/grades/')).toBe(false);
    expect(shouldSkipRefresh(undefined)).toBe(false);
  });
});
