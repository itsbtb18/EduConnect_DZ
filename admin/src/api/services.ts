/**
 * API service functions for ILMI admin panel.
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

  create: (data: FormData | Record<string, unknown>) =>
    apiClient.post('/schools/', data),

  update: (id: string, data: FormData | Record<string, unknown>) =>
    apiClient.patch(`/schools/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/schools/${id}/`),

  mySchool: () => apiClient.get('/schools/my-school/'),

  profile: () => apiClient.get('/schools/profile/'),

  updateProfile: (data: FormData | Record<string, unknown>) =>
    apiClient.patch('/schools/update-profile/', data),

  completeSetup: () => apiClient.post('/schools/complete-setup/'),

  uploadLogo: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post(`/schools/${id}/logo/`, formData);
  },

  sections: (params?: Record<string, unknown>) =>
    apiClient.get('/schools/sections/', { params }),

  createSection: (data: Record<string, unknown>) =>
    apiClient.post('/schools/sections/', data),

  updateSection: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/schools/sections/${id}/`, data),

  deleteSection: (id: string) =>
    apiClient.delete(`/schools/sections/${id}/`),

  academicYears: (params?: Record<string, unknown>) =>
    apiClient.get('/schools/academic-years/', { params }),

  createAcademicYear: (data: Record<string, unknown>) =>
    apiClient.post('/schools/academic-years/', data),

  updateAcademicYear: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/schools/academic-years/${id}/`, data),

  deleteAcademicYear: (id: string) =>
    apiClient.delete(`/schools/academic-years/${id}/`),
};

// ── Academics ──
export const academicsAPI = {
  // ▸ Levels
  levels: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/levels/', { params }),

  getLevel: (id: string) => apiClient.get(`/academics/levels/${id}/`),

  createLevel: (data: Record<string, unknown>) =>
    apiClient.post('/academics/levels/', data),

  updateLevel: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/levels/${id}/`, data),

  deleteLevel: (id: string) => apiClient.delete(`/academics/levels/${id}/`),

  // ▸ Streams
  streams: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/streams/', { params }),

  getStream: (id: string) => apiClient.get(`/academics/streams/${id}/`),

  createStream: (data: Record<string, unknown>) =>
    apiClient.post('/academics/streams/', data),

  updateStream: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/streams/${id}/`, data),

  deleteStream: (id: string) => apiClient.delete(`/academics/streams/${id}/`),

  // ▸ LevelSubjects
  levelSubjects: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/level-subjects/', { params }),

  createLevelSubject: (data: Record<string, unknown>) =>
    apiClient.post('/academics/level-subjects/', data),

  updateLevelSubject: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/level-subjects/${id}/`, data),

  deleteLevelSubject: (id: string) =>
    apiClient.delete(`/academics/level-subjects/${id}/`),

  // ▸ Classes
  classes: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/classes/', { params }),

  getClass: (id: string) => apiClient.get(`/academics/classes/${id}/`),

  createClass: (data: Record<string, unknown>) =>
    apiClient.post('/academics/classes/', data),

  updateClass: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/classes/${id}/`, data),

  deleteClass: (id: string) => apiClient.delete(`/academics/classes/${id}/`),

  // ▸ Subjects (catalog)
  subjects: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/subjects/', { params }),

  createSubject: (data: Record<string, unknown>) =>
    apiClient.post('/academics/subjects/', data),

  updateSubject: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/subjects/${id}/`, data),

  deleteSubject: (id: string) =>
    apiClient.delete(`/academics/subjects/${id}/`),

  /** Batch upsert subjects + level-subject configs in one request */
  bulkSyncSubjects: (data: { subjects: Record<string, unknown>[]; level_subjects: Record<string, unknown>[] }) =>
    apiClient.post('/academics/subjects/bulk-sync/', data),

  scheduleSlots: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/schedule/', { params }),

  createScheduleSlot: (data: Record<string, unknown>) =>
    apiClient.post('/academics/schedule/', data),

  updateScheduleSlot: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/schedule/${id}/`, data),

  deleteScheduleSlot: (id: string) =>
    apiClient.delete(`/academics/schedule/${id}/`),

  // Timetables (image-based)
  timetables: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/timetables/', { params }),

  createTimetable: (data: FormData) =>
    apiClient.post('/academics/timetables/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateTimetable: (id: string, data: FormData) =>
    apiClient.patch(`/academics/timetables/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteTimetable: (id: string) =>
    apiClient.delete(`/academics/timetables/${id}/`),

  timetablesClassesStatus: () =>
    apiClient.get('/academics/timetables/classes-status/'),

  teachers: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/assignments/', { params }),
};

// ── Students ──
export const studentsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/students/', { params }),

  get: (id: string) => apiClient.get(`/academics/students/${id}/`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/academics/students/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/students/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/academics/students/${id}/`),

  fullProfile: (id: string) =>
    apiClient.get(`/academics/students/${id}/full-profile/`),

  qrCode: (id: string) =>
    apiClient.get(`/academics/students/${id}/qr-code/`),
};

// ── Teachers ──
export const teachersAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/teachers/', { params }),

  get: (id: string) => apiClient.get(`/academics/teachers/${id}/`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/academics/teachers/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/teachers/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/academics/teachers/${id}/`),

  fullProfile: (id: string) =>
    apiClient.get(`/academics/teachers/${id}/full-profile/`),

  qrCode: (id: string) =>
    apiClient.get(`/academics/teachers/${id}/qr-code/`),

  bulkSetup: (data: { teachers: Record<string, unknown>[] }) =>
    apiClient.post('/academics/teachers/bulk-setup/', data),
};

// ── Grades ──
export const gradesAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/list/', { params }),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/grades/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/grades/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/grades/${id}/`),

  subjects: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/subjects/', { params }),

  reportCards: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/report-cards/', { params }),

  generateReportCard: (data: Record<string, unknown>) =>
    apiClient.post('/grades/report-cards/', data),

  auditLog: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/audit-log/', { params }),

  // ── ExamType CRUD ──
  examTypes: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/exam-types/', { params }),

  createExamType: (data: Record<string, unknown>) =>
    apiClient.post('/grades/exam-types/', data),

  updateExamType: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/grades/exam-types/${id}/`, data),

  deleteExamType: (id: string) =>
    apiClient.delete(`/grades/exam-types/${id}/`),

  // ── Grade operations ──
  bulkEnter: (data: Record<string, unknown>) =>
    apiClient.post('/grades/bulk-enter/', data),

  publishGrades: (data: Record<string, unknown>) =>
    apiClient.post('/grades/publish/', data),

  correctGrade: (id: string, data: Record<string, unknown>) =>
    apiClient.post(`/grades/${id}/correct/`, data),

  // ── Subject Averages ──
  subjectAverages: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/subject-averages/', { params }),

  recalcSubjectAverage: (data: Record<string, unknown>) =>
    apiClient.post('/grades/subject-averages/recalculate/', data),

  overrideSubjectAverage: (data: Record<string, unknown>) =>
    apiClient.post('/grades/subject-averages/override/', data),

  publishSubjectAverage: (data: Record<string, unknown>) =>
    apiClient.post('/grades/subject-averages/publish/', data),

  // ── Trimester Averages ──
  trimesterAverages: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/trimester-averages/', { params }),

  recalcTrimesterAverage: (data: Record<string, unknown>) =>
    apiClient.post('/grades/trimester-averages/recalculate/', data),

  overrideTrimesterAverage: (data: Record<string, unknown>) =>
    apiClient.post('/grades/trimester-averages/override/', data),

  publishTrimesterAverage: (data: Record<string, unknown>) =>
    apiClient.post('/grades/trimester-averages/publish/', data),

  lockTrimester: (data: Record<string, unknown>) =>
    apiClient.post('/grades/trimester-averages/lock/', data),

  unlockTrimester: (data: Record<string, unknown>) =>
    apiClient.post('/grades/trimester-averages/unlock/', data),

  // ── Appeals ──
  appeals: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/appeals/list/', { params }),

  createAppeal: (data: Record<string, unknown>) =>
    apiClient.post('/grades/appeals/', data),

  respondAppeal: (id: string, data: Record<string, unknown>) =>
    apiClient.post(`/grades/appeals/${id}/respond/`, data),

  pendingAppealsCount: () =>
    apiClient.get('/grades/appeals/pending-count/'),
};

// ── Attendance ──
export const attendanceAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/', { params }),

  mark: (data: Record<string, unknown>) =>
    apiClient.post('/attendance/mark/', data),

  bulkMark: (data: Record<string, unknown>) =>
    apiClient.post('/attendance/mark/', data),

  excuses: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/excuses/', { params }),

  stats: () =>
    apiClient.get('/attendance/stats/'),

  justify: (id: string, data: { justification_note: string }) =>
    apiClient.patch(`/attendance/${id}/justify/`, data),

  cancel: (id: string) =>
    apiClient.delete(`/attendance/${id}/cancel/`),

  report: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/report/', { params, responseType: 'blob' }),
};

// ── Finance (Payments) ──
export const financeAPI = {
  // Fee structures
  fees: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/fee-structures/', { params }),

  createFee: (data: Record<string, unknown>) =>
    apiClient.post('/finance/fee-structures/', data),

  updateFee: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/fee-structures/${id}/`, data),

  deleteFee: (id: string) =>
    apiClient.delete(`/finance/fee-structures/${id}/`),

  // Payments
  payments: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/payments/', { params }),

  getPayment: (id: string) =>
    apiClient.get(`/finance/payments/${id}/`),

  createPayment: (data: Record<string, unknown>) =>
    apiClient.post('/finance/payments/', data),

  updatePayment: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/payments/${id}/`, data),

  deletePayment: (id: string) =>
    apiClient.delete(`/finance/payments/${id}/`),

  // Stats & reports
  stats: () => apiClient.get('/finance/payments/stats/'),

  expiringSoon: () => apiClient.get('/finance/payments/expiring-soon/'),

  sendReminder: (id: string) =>
    apiClient.post(`/finance/payments/${id}/send-reminder/`),

  bulkReminder: () =>
    apiClient.post('/finance/payments/bulk-reminder/'),

  report: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/payments/report/', { params, responseType: 'blob' }),
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

// ── Chat / Messaging ──
export const chatAPI = {
  // Conversations
  conversations: (params?: Record<string, unknown>) =>
    apiClient.get('/chat/conversations/', { params }),

  createConversation: (data: { participant_other_id: string; participant_other_role: string }) =>
    apiClient.post('/chat/conversations/', data),

  deleteConversation: (id: string) =>
    apiClient.delete(`/chat/conversations/${id}/`),

  // Messages
  messages: (conversationId: string) =>
    apiClient.get(`/chat/conversations/${conversationId}/messages/`),

  uploadAttachment: (conversationId: string, data: FormData) =>
    apiClient.post(
      `/chat/conversations/${conversationId}/messages/upload/`,
      data,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    ),

  // Contacts
  contacts: () =>
    apiClient.get('/chat/conversations/contacts/'),
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

  get: (id: string) => apiClient.get(`/homework/${id}/`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/homework/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/homework/${id}/`, data),

  delete: (id: string, data?: Record<string, unknown>) =>
    apiClient.delete(`/homework/${id}/`, { data }),

  stats: () => apiClient.get('/homework/stats/'),

  calendar: (params?: Record<string, unknown>) =>
    apiClient.get('/homework/calendar/', { params }),

  overload: (params?: Record<string, unknown>) =>
    apiClient.get('/homework/overload/', { params }),
};

// ── Platform Settings (Super Admin) ──
export const platformSettingsAPI = {
  get: () => apiClient.get('/auth/platform-settings/'),

  update: (data: Record<string, unknown>) =>
    apiClient.patch('/auth/platform-settings/', data),
};

// ── Activity Logs (Super Admin) ──
export const activityLogsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/auth/activity-logs/', { params }),
};

// ── System Health (Super Admin) ──
export const systemHealthAPI = {
  check: () => apiClient.get('/auth/system-health/'),
};
