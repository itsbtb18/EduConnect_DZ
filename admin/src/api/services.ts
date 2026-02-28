/**
 * API service functions for EduConnect admin panel.
 * Each function wraps an apiClient call and returns typed data.
 */
import apiClient from './client';

// ── Auth ──
export const authAPI = {
  login: (phone_number: string, password: string) =>
    apiClient.post('/auth/login/', { phone_number, password }),

  refreshToken: (refresh: string) =>
    apiClient.post('/auth/refresh/', { refresh }),

  logout: (refresh: string) =>
    apiClient.post('/auth/logout/', { refresh }),

  me: () => apiClient.get('/auth/me/'),

  platformStats: () => apiClient.get('/auth/platform-stats/'),
};

// ── Users (admin management) ──
export const usersAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/auth/users/', { params }),

  get: (id: string) => apiClient.get(`/auth/users/${id}/`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/auth/users/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/auth/users/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/auth/users/${id}/`),

  resetPassword: (id: string, new_password: string) =>
    apiClient.post(`/auth/users/${id}/reset-password/`, { new_password }),

  changePassword: (old_password: string, new_password: string) =>
    apiClient.post('/auth/change-password/', { old_password, new_password }),
};

// ── Schools ──
export const schoolsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/schools/', { params }),

  get: (id: string) => apiClient.get(`/schools/${id}/`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/schools/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/schools/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/schools/${id}/`),

  mySchool: () => apiClient.get('/schools/my-school/'),

  sections: (params?: Record<string, unknown>) =>
    apiClient.get('/schools/sections/', { params }),

  academicYears: (params?: Record<string, unknown>) =>
    apiClient.get('/schools/academic-years/', { params }),
};

// ── Academics ──
export const academicsAPI = {
  classes: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/classes/', { params }),

  getClass: (id: string) => apiClient.get(`/academics/classes/${id}/`),

  subjects: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/subjects/', { params }),

  scheduleSlots: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/schedule-slots/', { params }),
};

// ── Students ──
export const studentsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/students/', { params }),

  get: (id: string) => apiClient.get(`/academics/students/${id}/`),
};

// ── Teachers ──
export const teachersAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/teachers/', { params }),

  get: (id: string) => apiClient.get(`/academics/teachers/${id}/`),
};

// ── Grades ──
export const gradesAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/', { params }),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/grades/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/grades/${id}/`, data),

  subjects: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/subjects/', { params }),

  reportCards: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/report-cards/', { params }),
};

// ── Attendance ──
export const attendanceAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/', { params }),

  mark: (data: Record<string, unknown>) =>
    apiClient.post('/attendance/', data),

  excuses: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/excuses/', { params }),
};

// ── Finance ──
export const financeAPI = {
  fees: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/fees/', { params }),

  payments: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/payments/', { params }),

  createPayment: (data: Record<string, unknown>) =>
    apiClient.post('/finance/payments/', data),
};

// ── Announcements ──
export const announcementsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/announcements/', { params }),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/announcements/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/announcements/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/announcements/${id}/`),
};

// ── Chat ──
export const chatAPI = {
  rooms: (params?: Record<string, unknown>) =>
    apiClient.get('/chat/rooms/', { params }),

  messages: (roomId: string, params?: Record<string, unknown>) =>
    apiClient.get(`/chat/rooms/${roomId}/messages/`, { params }),

  sendMessage: (roomId: string, data: Record<string, unknown>) =>
    apiClient.post(`/chat/rooms/${roomId}/messages/`, data),
};

// ── Notifications ──
export const notificationsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/notifications/', { params }),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/`, { is_read: true }),
};

// ── Homework ──
export const homeworkAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/homework/', { params }),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/homework/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/homework/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/homework/${id}/`),
};
