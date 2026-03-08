/**
 * API service for security features: audit logs, devices, sessions, OTP/TOTP.
 */
import apiClient from './client';

// ── Audit Logs ──
export const auditLogsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/auth/audit-logs/', { params }),
};

// ── Trusted Devices ──
export const devicesAPI = {
  list: () => apiClient.get('/auth/devices/'),

  revoke: (deviceId: string) =>
    apiClient.post(`/auth/devices/${deviceId}/revoke/`),
};

// ── Active Sessions ──
export const sessionsAPI = {
  list: () => apiClient.get('/auth/sessions/'),

  revoke: (sessionId: string) =>
    apiClient.post(`/auth/sessions/${sessionId}/revoke/`),

  revokeAll: (currentJti?: string) =>
    apiClient.post('/auth/sessions/revoke-all/', { current_jti: currentJti }),
};

// ── OTP / TOTP ──
export const otpAPI = {
  verifyOtp: (data: { phone_number: string; code: string; device_fingerprint?: string }) =>
    apiClient.post('/auth/verify-otp/', data),

  verifyTotp: (data: { phone_number: string; code: string }) =>
    apiClient.post('/auth/verify-totp/', data),

  setupTotp: () => apiClient.get('/auth/totp/setup/'),

  confirmTotp: (code: string) =>
    apiClient.post('/auth/totp/setup/', { code }),
};
