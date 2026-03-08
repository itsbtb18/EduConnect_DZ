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

  checkConflicts: (data: Record<string, unknown>) =>
    apiClient.post('/academics/schedule/check-conflicts/', data),

  classSchedule: (classId: string) =>
    apiClient.get(`/academics/schedule/class-schedule/${classId}/`),

  teacherSchedule: (teacherId: string) =>
    apiClient.get(`/academics/schedule/teacher-schedule/${teacherId}/`),

  publishSchedule: (classId: string) =>
    apiClient.post(`/academics/schedule/publish/${classId}/`),

  unpublishSchedule: (classId: string) =>
    apiClient.post(`/academics/schedule/unpublish/${classId}/`),

  validateTimetable: (classId: string) =>
    apiClient.get(`/academics/schedule/validate-timetable/${classId}/`),

  exportClassPdf: (classId: string) =>
    apiClient.get(`/academics/schedule/export-class-pdf/${classId}/`, { responseType: 'blob' }),

  exportTeacherPdf: (teacherId: string) =>
    apiClient.get(`/academics/schedule/export-teacher-pdf/${teacherId}/`, { responseType: 'blob' }),

  roomSchedule: (roomId: string) =>
    apiClient.get(`/academics/schedule/room-schedule/${roomId}/`),

  // Rooms
  rooms: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/rooms/', { params }),

  createRoom: (data: Record<string, unknown>) =>
    apiClient.post('/academics/rooms/', data),

  updateRoom: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/rooms/${id}/`, data),

  deleteRoom: (id: string) =>
    apiClient.delete(`/academics/rooms/${id}/`),

  roomOccupancy: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/rooms/occupancy/', { params }),

  // Teacher availability
  teacherAvailability: (params?: Record<string, unknown>) =>
    apiClient.get('/academics/teacher-availability/', { params }),

  createTeacherAvailability: (data: Record<string, unknown>) =>
    apiClient.post('/academics/teacher-availability/', data),

  deleteTeacherAvailability: (id: string) =>
    apiClient.delete(`/academics/teacher-availability/${id}/`),

  // Time slot config
  timeSlots: () =>
    apiClient.get('/academics/time-slots/'),

  createTimeSlot: (data: Record<string, unknown>) =>
    apiClient.post('/academics/time-slots/', data),

  updateTimeSlot: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/academics/time-slots/${id}/`, data),

  deleteTimeSlot: (id: string) =>
    apiClient.delete(`/academics/time-slots/${id}/`),

  seedDefaultTimeSlots: () =>
    apiClient.post('/academics/time-slots/seed-defaults/'),

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

  // ── Report Card Templates ──
  reportCardTemplates: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/report-card-templates/', { params }),

  createReportCardTemplate: (data: Record<string, unknown>) =>
    apiClient.post('/grades/report-card-templates/', data),

  updateReportCardTemplate: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/grades/report-card-templates/${id}/`, data),

  deleteReportCardTemplate: (id: string) =>
    apiClient.delete(`/grades/report-card-templates/${id}/`),

  // ── Report Card Generation ──
  generateClassReportCards: (data: Record<string, unknown>) =>
    apiClient.post('/grades/report-cards/generate-class/', data),

  generateSchoolReportCards: (data: Record<string, unknown>) =>
    apiClient.post('/grades/report-cards/generate-school/', data),

  reportCardProgress: (taskId: string) =>
    apiClient.get(`/grades/report-cards/progress/${taskId}/`),

  // ── Grade Analytics ──
  gradeAnalytics: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/analytics/', { params }),

  // ── MEN Official Export ──
  menExport: (params?: Record<string, unknown>) =>
    apiClient.get('/grades/men-export/', { params, responseType: 'blob' }),
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

  // ── Attendance Reports ──
  monthlyReport: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/reports/monthly/', { params }),

  calendarReport: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/reports/calendar/', { params }),

  annualReport: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/reports/annual/', { params }),

  ranking: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/reports/ranking/', { params }),

  excelExport: (params?: Record<string, unknown>) =>
    apiClient.get('/attendance/reports/excel/', { params, responseType: 'blob' }),
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

  // Fee Discounts
  discounts: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/discounts/', { params }),
  createDiscount: (data: Record<string, unknown>) =>
    apiClient.post('/finance/discounts/', data),
  updateDiscount: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/discounts/${id}/`, data),
  deleteDiscount: (id: string) =>
    apiClient.delete(`/finance/discounts/${id}/`),

  // Late Penalties
  penalties: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/penalties/', { params }),
  createPenalty: (data: Record<string, unknown>) =>
    apiClient.post('/finance/penalties/', data),
  updatePenalty: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/penalties/${id}/`, data),
  deletePenalty: (id: string) =>
    apiClient.delete(`/finance/penalties/${id}/`),

  // Registration Deposits
  deposits: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/deposits/', { params }),
  createDeposit: (data: Record<string, unknown>) =>
    apiClient.post('/finance/deposits/', data),
  updateDeposit: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/deposits/${id}/`, data),
  deleteDeposit: (id: string) =>
    apiClient.delete(`/finance/deposits/${id}/`),

  // Extra Fees
  extraFees: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/extra-fees/', { params }),
  createExtraFee: (data: Record<string, unknown>) =>
    apiClient.post('/finance/extra-fees/', data),
  updateExtraFee: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/extra-fees/${id}/`, data),
  deleteExtraFee: (id: string) =>
    apiClient.delete(`/finance/extra-fees/${id}/`),

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

  receipt: (id: string) =>
    apiClient.get(`/finance/payments/${id}/receipt/`, { responseType: 'blob' }),

  // Expense Categories
  expenseCategories: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/expense-categories/', { params }),
  createExpenseCategory: (data: Record<string, unknown>) =>
    apiClient.post('/finance/expense-categories/', data),
  updateExpenseCategory: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/expense-categories/${id}/`, data),
  deleteExpenseCategory: (id: string) =>
    apiClient.delete(`/finance/expense-categories/${id}/`),

  // Expenses
  expenses: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/expenses/', { params }),
  createExpense: (data: Record<string, unknown>) =>
    apiClient.post('/finance/expenses/', data),
  deleteExpense: (id: string) =>
    apiClient.delete(`/finance/expenses/${id}/`),
  approveExpense: (id: string, data: Record<string, unknown>) =>
    apiClient.post(`/finance/expenses/${id}/approve/`, data),

  // Budgets
  budgets: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/budgets/', { params }),
  createBudget: (data: Record<string, unknown>) =>
    apiClient.post('/finance/budgets/', data),
  updateBudget: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/budgets/${id}/`, data),
  deleteBudget: (id: string) =>
    apiClient.delete(`/finance/budgets/${id}/`),

  // Salary Configs
  salaryConfigs: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/salary-configs/', { params }),
  createSalaryConfig: (data: Record<string, unknown>) =>
    apiClient.post('/finance/salary-configs/', data),
  updateSalaryConfig: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/salary-configs/${id}/`, data),
  deleteSalaryConfig: (id: string) =>
    apiClient.delete(`/finance/salary-configs/${id}/`),

  // Deductions
  deductions: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/deductions/', { params }),
  createDeduction: (data: Record<string, unknown>) =>
    apiClient.post('/finance/deductions/', data),
  updateDeduction: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/deductions/${id}/`, data),
  deleteDeduction: (id: string) =>
    apiClient.delete(`/finance/deductions/${id}/`),

  // Salary Advances
  advances: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/advances/', { params }),
  createAdvance: (data: Record<string, unknown>) =>
    apiClient.post('/finance/advances/', data),
  approveAdvance: (id: string, data: Record<string, unknown>) =>
    apiClient.post(`/finance/advances/${id}/approve/`, data),

  // Payslips
  payslips: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/payslips/', { params }),
  generatePayslip: (data: Record<string, unknown>) =>
    apiClient.post('/finance/payslips/generate/', data),
  bulkGeneratePayslips: (data: Record<string, unknown>) =>
    apiClient.post('/finance/payslips/bulk-generate/', data),
  getPayslip: (id: string) =>
    apiClient.get(`/finance/payslips/${id}/`),
  updatePayslip: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/finance/payslips/${id}/`, data),
  payslipPdf: (id: string) =>
    apiClient.get(`/finance/payslips/${id}/pdf/`, { responseType: 'blob' }),
  payrollStats: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/payslips/stats/', { params }),

  // Financial Reports
  financialReports: (params?: Record<string, unknown>) =>
    apiClient.get('/finance/reports/', { params }),
};

// ── Announcements ──
export const announcementsAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/announcements/', { params }),

  get: (id: string) =>
    apiClient.get(`/announcements/${id}/`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/announcements/', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/announcements/${id}/`, data),

  delete: (id: string) => apiClient.delete(`/announcements/${id}/`),

  markRead: (id: string) =>
    apiClient.post(`/announcements/${id}/read/`),

  uploadImage: (id: string, data: FormData) =>
    apiClient.post(`/announcements/${id}/upload-image/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  readers: (id: string) =>
    apiClient.get(`/announcements/${id}/readers/`),

  uploadAttachment: (id: string, data: FormData) =>
    apiClient.post(`/announcements/${id}/upload-attachment/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ── Chat / Messaging ──
export const chatAPI = {
  // Conversations
  conversations: (params?: Record<string, unknown>) =>
    apiClient.get('/chat/conversations/', { params }),

  createConversation: (data: {
    participant_other_id: string;
    participant_other_role: string;
    room_type?: string;
    related_student_id?: string;
  }) => apiClient.post('/chat/conversations/', data),

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

  // Read receipts
  markConversationRead: (conversationId: string) =>
    apiClient.post(`/chat/conversations/${conversationId}/messages/read/`),

  // Message actions
  deleteMessage: (conversationId: string, messageId: string) =>
    apiClient.delete(`/chat/conversations/${conversationId}/messages/${messageId}/`),

  pinMessage: (conversationId: string, messageId: string) =>
    apiClient.post(`/chat/conversations/${conversationId}/messages/${messageId}/pin/`),

  // Rooms (group/broadcast)
  rooms: (params?: Record<string, unknown>) =>
    apiClient.get('/chat/rooms/', { params }),

  createRoom: (data: Record<string, unknown>) =>
    apiClient.post('/chat/rooms/', data),

  roomMessages: (roomId: string) =>
    apiClient.get(`/chat/rooms/${roomId}/messages/`),

  roomUploadAttachment: (roomId: string, data: FormData) =>
    apiClient.post(`/chat/rooms/${roomId}/messages/upload/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteRoomMessage: (roomId: string, messageId: string) =>
    apiClient.delete(`/chat/rooms/${roomId}/messages/${messageId}/`),

  pinRoomMessage: (roomId: string, messageId: string) =>
    apiClient.post(`/chat/rooms/${roomId}/messages/${messageId}/pin/`),

  // Search
  searchMessages: (params: { q: string }) =>
    apiClient.get('/chat/messages/search/', { params }),

  // Templates
  templates: (params?: Record<string, unknown>) =>
    apiClient.get('/chat/templates/', { params }),

  createTemplate: (data: Record<string, unknown>) =>
    apiClient.post('/chat/templates/', data),

  updateTemplate: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/chat/templates/${id}/`, data),

  deleteTemplate: (id: string) =>
    apiClient.delete(`/chat/templates/${id}/`),

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

// ── Subscriptions (Super Admin) ──
export const subscriptionsAPI = {
  get: (schoolId: string) =>
    apiClient.get(`/schools/super/${schoolId}/subscription/`),

  update: (schoolId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/schools/super/${schoolId}/subscription/`, data),

  activateModule: (schoolId: string, module: string, data?: Record<string, unknown>) =>
    apiClient.post(`/schools/super/${schoolId}/modules/${module}/activate/`, data || {}),

  deactivateModule: (schoolId: string, module: string, data?: Record<string, unknown>) =>
    apiClient.post(`/schools/super/${schoolId}/modules/${module}/deactivate/`, data || {}),

  suspend: (schoolId: string, reason: string) =>
    apiClient.post(`/schools/super/${schoolId}/suspend/`, { reason }),

  invoices: (schoolId: string, params?: Record<string, unknown>) =>
    apiClient.get(`/schools/super/${schoolId}/invoices/`, { params }),

  generateInvoice: (schoolId: string, data: Record<string, unknown>) =>
    apiClient.post(`/schools/super/${schoolId}/invoices/generate/`, data),

  markPaid: (schoolId: string, invoiceId: string) =>
    apiClient.patch(`/schools/super/${schoolId}/invoices/${invoiceId}/mark-paid/`),

  moduleLogs: (schoolId: string) =>
    apiClient.get(`/schools/super/${schoolId}/module-logs/`),

  allInvoices: (params?: Record<string, unknown>) =>
    apiClient.get('/schools/super/invoices/', { params }),
};

// ── Super Admin Analytics ──
export const analyticsAPI = {
  overview: () =>
    apiClient.get('/schools/super/analytics/overview/'),

  revenue: () =>
    apiClient.get('/schools/super/analytics/revenue/'),

  modulesUsage: () =>
    apiClient.get('/schools/super/analytics/modules-usage/'),

  schoolsMap: () =>
    apiClient.get('/schools/super/analytics/schools-map/'),

  churn: () =>
    apiClient.get('/schools/super/analytics/churn/'),

  performance: () =>
    apiClient.get('/schools/super/analytics/performance/'),
};

// ── Super Admin Impersonation ──
export const impersonationAPI = {
  start: (schoolId: string) =>
    apiClient.post(`/schools/super/${schoolId}/impersonate/`),

  end: (logId: string) =>
    apiClient.post('/schools/super/impersonate/end/', { log_id: logId }),

  logs: () =>
    apiClient.get('/schools/super/impersonation-logs/'),
};

// ── Super Admin Content Management ──
export const contentAPI = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/schools/super/content/resources/', { params }),

  get: (id: string) =>
    apiClient.get(`/schools/super/content/resources/${id}/`),

  create: (data: FormData | Record<string, unknown>) =>
    apiClient.post('/schools/super/content/resources/', data),

  update: (id: string, data: FormData | Record<string, unknown>) =>
    apiClient.patch(`/schools/super/content/resources/${id}/`, data),

  delete: (id: string) =>
    apiClient.delete(`/schools/super/content/resources/${id}/`),
};

// ── Super Admin Broadcast ──
export const broadcastAPI = {
  send: (data: { title: string; message: string; target?: string }) =>
    apiClient.post('/schools/super/broadcast/', data),
};

// ══════════════════════════════════════════════════════════════════════
// Infirmerie (School Infirmary)
// ══════════════════════════════════════════════════════════════════════

export const infirmerieAPI = {
  // Dashboard & Reports
  dashboard: () => apiClient.get('/infirmerie/dashboard/'),
  reports: (params?: Record<string, string>) => apiClient.get('/infirmerie/reports/', { params }),
  lowStock: () => apiClient.get('/infirmerie/low-stock/'),

  // Medical Records
  records: {
    list: (params?: Record<string, unknown>) => apiClient.get('/infirmerie/records/', { params }),
    get: (id: string) => apiClient.get(`/infirmerie/records/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/infirmerie/records/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/records/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/infirmerie/records/${id}/`),
  },

  // Medical History (nested under record)
  history: {
    list: (recordId: string) => apiClient.get(`/infirmerie/records/${recordId}/history/`),
    create: (recordId: string, data: Record<string, unknown>) => apiClient.post(`/infirmerie/records/${recordId}/history/`, data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/history/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/infirmerie/history/${id}/`),
  },

  // Allergies
  allergies: {
    list: (recordId: string) => apiClient.get(`/infirmerie/records/${recordId}/allergies/`),
    create: (recordId: string, data: Record<string, unknown>) => apiClient.post(`/infirmerie/records/${recordId}/allergies/`, data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/allergies/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/infirmerie/allergies/${id}/`),
  },

  // Medications
  medications: {
    list: (recordId: string, params?: Record<string, unknown>) => apiClient.get(`/infirmerie/records/${recordId}/medications/`, { params }),
    create: (recordId: string, data: Record<string, unknown>) => apiClient.post(`/infirmerie/records/${recordId}/medications/`, data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/medications/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/infirmerie/medications/${id}/`),
  },

  // Vaccinations
  vaccinations: {
    list: (recordId: string, params?: Record<string, unknown>) => apiClient.get(`/infirmerie/records/${recordId}/vaccinations/`, { params }),
    create: (recordId: string, data: Record<string, unknown>) => apiClient.post(`/infirmerie/records/${recordId}/vaccinations/`, data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/vaccinations/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/infirmerie/vaccinations/${id}/`),
  },

  // Disabilities
  disabilities: {
    list: (recordId: string) => apiClient.get(`/infirmerie/records/${recordId}/disabilities/`),
    create: (recordId: string, data: Record<string, unknown>) => apiClient.post(`/infirmerie/records/${recordId}/disabilities/`, data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/disabilities/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/infirmerie/disabilities/${id}/`),
  },

  // Psychological Records
  psychological: {
    list: (recordId: string) => apiClient.get(`/infirmerie/records/${recordId}/psychological/`),
    create: (recordId: string, data: Record<string, unknown>) => apiClient.post(`/infirmerie/records/${recordId}/psychological/`, data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/psychological/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/infirmerie/psychological/${id}/`),
  },

  // Consultations
  consultations: {
    list: (params?: Record<string, unknown>) => apiClient.get('/infirmerie/consultations/', { params }),
    get: (id: string) => apiClient.get(`/infirmerie/consultations/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/infirmerie/consultations/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/consultations/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/infirmerie/consultations/${id}/`),
  },

  // Emergency Protocols
  protocols: {
    list: (params?: Record<string, unknown>) => apiClient.get('/infirmerie/protocols/', { params }),
    get: (id: string) => apiClient.get(`/infirmerie/protocols/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/infirmerie/protocols/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/protocols/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/infirmerie/protocols/${id}/`),
  },

  // Emergency Events
  emergencies: {
    list: (params?: Record<string, unknown>) => apiClient.get('/infirmerie/emergencies/', { params }),
    get: (id: string) => apiClient.get(`/infirmerie/emergencies/${id}/`),
    trigger: (data: Record<string, unknown>) => apiClient.post('/infirmerie/emergencies/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/emergencies/${id}/`, data),
    close: (id: string, data: Record<string, unknown>) => apiClient.post(`/infirmerie/emergencies/${id}/close/`, data),
  },

  // Messages
  messages: {
    list: (params?: Record<string, unknown>) => apiClient.get('/infirmerie/messages/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/infirmerie/messages/', data),
    markRead: (id: string) => apiClient.post(`/infirmerie/messages/${id}/read/`),
  },

  // Absence Justifications
  justifications: {
    list: (params?: Record<string, unknown>) => apiClient.get('/infirmerie/justifications/', { params }),
    create: (data: Record<string, unknown> | FormData) => apiClient.post('/infirmerie/justifications/', data),
    validate: (id: string, data: { action: 'validate' | 'reject'; rejection_reason?: string }) =>
      apiClient.post(`/infirmerie/justifications/${id}/validate/`, data),
  },

  // Epidemic Alerts
  epidemics: {
    list: (params?: Record<string, unknown>) => apiClient.get('/infirmerie/epidemics/', { params }),
    get: (id: string) => apiClient.get(`/infirmerie/epidemics/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/infirmerie/epidemics/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/epidemics/${id}/`, data),
  },

  // Contagious Diseases
  contagious: {
    list: (params?: Record<string, unknown>) => apiClient.get('/infirmerie/contagious/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/infirmerie/contagious/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/infirmerie/contagious/${id}/`, data),
  },

  // Teacher: Accommodations
  accommodations: (studentId: string) => apiClient.get(`/infirmerie/accommodations/${studentId}/`),
};

// ══════════════════════════════════════════════════════════════════════
// Cantine (School Canteen)
// ══════════════════════════════════════════════════════════════════════

export const cantineAPI = {
  students: {
    list: (params?: Record<string, unknown>) => apiClient.get('/canteen/students/', { params }),
    get: (id: string) => apiClient.get(`/canteen/students/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/canteen/students/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/canteen/students/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/canteen/students/${id}/`),
  },
  menus: {
    list: (params?: Record<string, unknown>) => apiClient.get('/canteen/menus/', { params }),
    get: (id: string) => apiClient.get(`/canteen/menus/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/canteen/menus/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/canteen/menus/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/canteen/menus/${id}/`),
    publish: (id: string) => apiClient.post(`/canteen/menus/${id}/publish/`),
  },
  menuItems: {
    list: (menuId: string) => apiClient.get(`/canteen/menus/${menuId}/items/`),
    create: (menuId: string, data: Record<string, unknown>) => apiClient.post(`/canteen/menus/${menuId}/items/`, data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/canteen/menu-items/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/canteen/menu-items/${id}/`),
  },
  attendance: {
    list: (params?: Record<string, unknown>) => apiClient.get('/canteen/attendance/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/canteen/attendance/', data),
    bulk: (data: { date: string; entries: Array<{ student: string; present: boolean; notes?: string }> }) =>
      apiClient.post('/canteen/attendance/bulk/', data),
  },
  reports: {
    consumption: (params?: Record<string, string>) => apiClient.get('/canteen/reports/consumption/', { params }),
  },
};

// ══════════════════════════════════════════════════════════════════════
// Transport
// ══════════════════════════════════════════════════════════════════════

export const transportAPI = {
  drivers: {
    list: (params?: Record<string, unknown>) => apiClient.get('/transport/drivers/', { params }),
    get: (id: string) => apiClient.get(`/transport/drivers/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/transport/drivers/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/transport/drivers/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/transport/drivers/${id}/`),
    idCard: (id: string) => apiClient.get(`/transport/drivers/${id}/id-card/`),
  },
  lines: {
    list: (params?: Record<string, unknown>) => apiClient.get('/transport/lines/', { params }),
    get: (id: string) => apiClient.get(`/transport/lines/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/transport/lines/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/transport/lines/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/transport/lines/${id}/`),
  },
  stops: {
    list: (params?: Record<string, unknown>) => apiClient.get('/transport/stops/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/transport/stops/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/transport/stops/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/transport/stops/${id}/`),
  },
  students: {
    list: (params?: Record<string, unknown>) => apiClient.get('/transport/students/', { params }),
    get: (id: string) => apiClient.get(`/transport/students/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/transport/students/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/transport/students/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/transport/students/${id}/`),
  },
  trips: {
    list: (params?: Record<string, unknown>) => apiClient.get('/transport/trips/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/transport/trips/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/transport/trips/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/transport/trips/${id}/`),
  },
  reports: {
    performance: (params?: Record<string, string>) => apiClient.get('/transport/report/', { params }),
  },
  notify: {
    delay: (lineId: string, data: { delay_minutes: number; message?: string }) =>
      apiClient.post(`/transport/notify-delay/${lineId}/`, data),
    arrival: (lineId: string) => apiClient.post(`/transport/notify-arrival/${lineId}/`),
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   LIBRARY / BIBLIOTHÈQUE
   ═══════════════════════════════════════════════════════════════════════ */

export const libraryAPI = {
  books: {
    list: (params?: Record<string, unknown>) => apiClient.get('/library/books/', { params }),
    get: (id: string) => apiClient.get(`/library/books/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/library/books/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/library/books/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/library/books/${id}/`),
  },
  copies: {
    list: (params?: Record<string, unknown>) => apiClient.get('/library/copies/', { params }),
    get: (id: string) => apiClient.get(`/library/copies/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/library/copies/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/library/copies/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/library/copies/${id}/`),
  },
  loans: {
    list: (params?: Record<string, unknown>) => apiClient.get('/library/loans/', { params }),
    get: (id: string) => apiClient.get(`/library/loans/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/library/loans/', data),
    return: (id: string) => apiClient.post(`/library/loans/${id}/return/`),
    renew: (id: string) => apiClient.post(`/library/loans/${id}/renew/`),
    myLoans: () => apiClient.get('/library/my-loans/'),
  },
  reservations: {
    list: (params?: Record<string, unknown>) => apiClient.get('/library/reservations/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/library/reservations/', data),
    cancel: (id: string) => apiClient.post(`/library/reservations/${id}/cancel/`),
  },
  requests: {
    list: (params?: Record<string, unknown>) => apiClient.get('/library/requests/', { params }),
    get: (id: string) => apiClient.get(`/library/requests/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/library/requests/', data),
    resolve: (id: string, data: { action: string; admin_response?: string }) =>
      apiClient.post(`/library/requests/${id}/resolve/`, data),
  },
  usageReport: (params?: Record<string, string>) => apiClient.get('/library/usage-report/', { params }),
};

// ═══════════════════════════════════════════════════════════════════════
// E-Learning
// ═══════════════════════════════════════════════════════════════════════

export const elearningAPI = {
  resources: {
    list: (params?: Record<string, unknown>) => apiClient.get('/elearning/resources/', { params }),
    get: (id: string) => apiClient.get(`/elearning/resources/${id}/`),
    create: (data: FormData) => apiClient.post('/elearning/resources/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id: string, data: FormData) => apiClient.put(`/elearning/resources/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id: string) => apiClient.delete(`/elearning/resources/${id}/`),
    favourite: (id: string) => apiClient.post(`/elearning/resources/${id}/favourite/`),
    download: (id: string) => apiClient.post(`/elearning/resources/${id}/download/`),
  },
  exams: {
    list: (params?: Record<string, unknown>) => apiClient.get('/elearning/exams/', { params }),
    get: (id: string) => apiClient.get(`/elearning/exams/${id}/`),
    create: (data: FormData) => apiClient.post('/elearning/exams/', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id: string, data: FormData) => apiClient.put(`/elearning/exams/${id}/`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id: string) => apiClient.delete(`/elearning/exams/${id}/`),
    download: (id: string) => apiClient.post(`/elearning/exams/${id}/download/`),
  },
  quizzes: {
    list: (params?: Record<string, unknown>) => apiClient.get('/elearning/quizzes/', { params }),
    get: (id: string) => apiClient.get(`/elearning/quizzes/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/elearning/quizzes/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.put(`/elearning/quizzes/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/elearning/quizzes/${id}/`),
    questions: (quizId: string) => apiClient.get(`/elearning/quizzes/${quizId}/questions/`),
    addQuestion: (quizId: string, data: Record<string, unknown>) =>
      apiClient.post(`/elearning/quizzes/${quizId}/questions/`, data),
    updateQuestion: (quizId: string, questionId: string, data: Record<string, unknown>) =>
      apiClient.put(`/elearning/quizzes/${quizId}/questions/${questionId}/`, data),
    deleteQuestion: (quizId: string, questionId: string) =>
      apiClient.delete(`/elearning/quizzes/${quizId}/questions/${questionId}/`),
    submit: (quizId: string, data: { answers: Record<string, unknown> }) =>
      apiClient.post(`/elearning/quizzes/${quizId}/submit/`, data),
    attempts: (quizId: string) => apiClient.get(`/elearning/quizzes/${quizId}/attempts/`),
  },
  myAttempts: () => apiClient.get('/elearning/my-attempts/'),
  progress: {
    list: (params?: Record<string, unknown>) => apiClient.get('/elearning/progress/', { params }),
    get: (id: string) => apiClient.get(`/elearning/progress/${id}/`),
  },
  analytics: (params?: Record<string, string>) => apiClient.get('/elearning/analytics/', { params }),
};

// ── SMS ──
export const smsAPI = {
  config: {
    get: () => apiClient.get('/sms/config/'),
    update: (data: Record<string, unknown>) => apiClient.put('/sms/config/', data),
  },
  balance: () => apiClient.get('/sms/balance/'),
  send: (data: { phone: string; message: string; template_id?: string; template_context?: Record<string, string> }) =>
    apiClient.post('/sms/send/', data),
  history: (params?: Record<string, unknown>) => apiClient.get('/sms/history/', { params }),
  templates: {
    list: (params?: Record<string, unknown>) => apiClient.get('/sms/templates/', { params }),
    get: (id: string) => apiClient.get(`/sms/templates/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/sms/templates/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.put(`/sms/templates/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/sms/templates/${id}/`),
  },
  campaigns: {
    list: (params?: Record<string, unknown>) => apiClient.get('/sms/campaigns/', { params }),
    get: (id: string) => apiClient.get(`/sms/campaigns/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/sms/campaigns/', data),
    delete: (id: string) => apiClient.delete(`/sms/campaigns/${id}/`),
  },
  analytics: (params?: Record<string, unknown>) => apiClient.get('/sms/analytics/', { params }),
};

// ── Notifications (extended) ──
export const notificationsExtAPI = {
  preferences: {
    get: () => apiClient.get('/notifications/preferences/'),
    update: (data: Record<string, unknown>) => apiClient.put('/notifications/preferences/', data),
  },
  stats: () => apiClient.get('/notifications/stats/'),
  markAllRead: () => apiClient.post('/notifications/read-all/'),
};

// ── Fingerprint / Biometric ──
export const fingerprintAPI = {
  dashboard: () => apiClient.get('/fingerprint/dashboard/'),
  devices: {
    list: () => apiClient.get('/fingerprint/devices/'),
    get: (id: string) => apiClient.get(`/fingerprint/devices/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/fingerprint/devices/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.put(`/fingerprint/devices/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/fingerprint/devices/${id}/`),
  },
  enroll: (data: { student_id: string; finger_index: number; captures: string[]; quality_scores?: number[]; device_id?: string }) =>
    apiClient.post('/fingerprint/enroll/', data),
  verify: (data: { template: string; device_id?: string }) =>
    apiClient.post('/fingerprint/verify/', data),
  manualFallback: (data: { student_id: string; event_type: string; timestamp?: string }) =>
    apiClient.post('/fingerprint/manual-fallback/', data),
  enrolledStudents: (params?: Record<string, unknown>) =>
    apiClient.get('/fingerprint/students/enrolled/', { params }),
  logs: (params?: Record<string, unknown>) =>
    apiClient.get('/fingerprint/logs/', { params }),
  tardinessReport: (params?: Record<string, unknown>) =>
    apiClient.get('/fingerprint/reports/tardiness/', { params }),
  diagnostics: () => apiClient.get('/fingerprint/diagnostics/'),
};

// ── Discipline ──────────────────────────────────────────────────────────

export const disciplineAPI = {
  incidents: {
    list: (params?: Record<string, unknown>) => apiClient.get('/discipline/incidents/', { params }),
    get: (id: string) => apiClient.get(`/discipline/incidents/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/discipline/incidents/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/discipline/incidents/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/discipline/incidents/${id}/`),
    workflow: (id: string, data: { action: string; resolution_note?: string }) =>
      apiClient.post(`/discipline/incidents/${id}/workflow/`, data),
  },
  sanctions: {
    list: (params?: Record<string, unknown>) => apiClient.get('/discipline/sanctions/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/discipline/sanctions/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/discipline/sanctions/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/discipline/sanctions/${id}/`),
  },
  behaviorReports: {
    list: (params?: Record<string, unknown>) => apiClient.get('/discipline/behavior-reports/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/discipline/behavior-reports/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/discipline/behavior-reports/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/discipline/behavior-reports/${id}/`),
  },
  warningThresholds: {
    list: (params?: Record<string, unknown>) => apiClient.get('/discipline/warning-thresholds/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/discipline/warning-thresholds/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/discipline/warning-thresholds/${id}/`, data),
  },
  stats: (params?: Record<string, unknown>) => apiClient.get('/discipline/stats/', { params }),
  warnings: (params?: Record<string, unknown>) => apiClient.get('/discipline/warnings/', { params }),
  classComparison: (params?: Record<string, unknown>) => apiClient.get('/discipline/class-comparison/', { params }),
};

// ── Staff Management ────────────────────────────────────────────────────

export const staffAPI = {
  members: {
    list: (params?: Record<string, unknown>) => apiClient.get('/staff/members/', { params }),
    get: (id: string) => apiClient.get(`/staff/members/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/staff/members/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/staff/members/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/staff/members/${id}/`),
  },
  documents: {
    list: (params?: Record<string, unknown>) => apiClient.get('/staff/documents/', { params }),
    create: (data: FormData) => apiClient.post('/staff/documents/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
    delete: (id: string) => apiClient.delete(`/staff/documents/${id}/`),
  },
  attendance: {
    list: (params?: Record<string, unknown>) => apiClient.get('/staff/attendance/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/staff/attendance/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/staff/attendance/${id}/`, data),
  },
  leaves: {
    list: (params?: Record<string, unknown>) => apiClient.get('/staff/leaves/', { params }),
    create: (data: Record<string, unknown>) => apiClient.post('/staff/leaves/', data),
    approve: (id: string) => apiClient.post(`/staff/leaves/${id}/approve/`),
    reject: (id: string) => apiClient.post(`/staff/leaves/${id}/reject/`),
  },
  stats: () => apiClient.get('/staff/stats/'),
};
