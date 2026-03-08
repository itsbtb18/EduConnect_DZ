/**
 * Formation (Training Center) — API Service
 * All endpoints under /api/v1/formation/
 */
import apiClient from './client';

export const formationAPI = {
  // ── Dashboard ──
  dashboard: () => apiClient.get('/formation/dashboard/'),
  terminology: () => apiClient.get('/formation/terminology/'),
  availableModules: () => apiClient.get('/formation/modules/'),

  // ── Departments ──
  departments: {
    list: (params?: Record<string, unknown>) => apiClient.get('/formation/departments/', { params }),
    get: (id: string) => apiClient.get(`/formation/departments/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/formation/departments/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/formation/departments/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/formation/departments/${id}/`),
  },

  // ── Formations ──
  formations: {
    list: (params?: Record<string, unknown>) => apiClient.get('/formation/formations/', { params }),
    get: (id: string) => apiClient.get(`/formation/formations/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/formation/formations/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/formation/formations/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/formation/formations/${id}/`),
  },

  // ── Groups ──
  groups: {
    list: (params?: Record<string, unknown>) => apiClient.get('/formation/groups/', { params }),
    get: (id: string) => apiClient.get(`/formation/groups/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/formation/groups/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/formation/groups/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/formation/groups/${id}/`),
  },

  // ── Enrollments ──
  enrollments: {
    list: (params?: Record<string, unknown>) => apiClient.get('/formation/enrollments/', { params }),
    get: (id: string) => apiClient.get(`/formation/enrollments/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/formation/enrollments/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/formation/enrollments/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/formation/enrollments/${id}/`),
  },

  // ── Placement Tests ──
  placementTests: {
    list: (params?: Record<string, unknown>) => apiClient.get('/formation/placement-tests/', { params }),
    get: (id: string) => apiClient.get(`/formation/placement-tests/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/formation/placement-tests/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/formation/placement-tests/${id}/`, data),
    validate: (id: string) => apiClient.post(`/formation/placement-tests/${id}/validate/`),
  },

  // ── Sessions ──
  sessions: {
    list: (params?: Record<string, unknown>) => apiClient.get('/formation/sessions/', { params }),
    get: (id: string) => apiClient.get(`/formation/sessions/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/formation/sessions/', data),
    update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/formation/sessions/${id}/`, data),
    delete: (id: string) => apiClient.delete(`/formation/sessions/${id}/`),
  },

  // ── Attendance ──
  attendance: {
    list: (params?: Record<string, unknown>) => apiClient.get('/formation/attendance/', { params }),
    bulkMark: (data: Record<string, unknown>) => apiClient.post('/formation/attendance/bulk/', data),
  },

  // ── Level Passages ──
  levelPassages: {
    list: (params?: Record<string, unknown>) => apiClient.get('/formation/level-passages/', { params }),
    get: (id: string) => apiClient.get(`/formation/level-passages/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/formation/level-passages/', data),
    decide: (id: string, data: Record<string, unknown>) => apiClient.post(`/formation/level-passages/${id}/decide/`, data),
  },

  // ── Certificates ──
  certificates: {
    list: (params?: Record<string, unknown>) => apiClient.get('/formation/certificates/', { params }),
    get: (id: string) => apiClient.get(`/formation/certificates/${id}/`),
    create: (data: Record<string, unknown>) => apiClient.post('/formation/certificates/', data),
  },

  // ── Schedule Conflicts ──
  checkConflicts: (data: Record<string, unknown>) => apiClient.post('/formation/schedule-conflicts/', data),

  // ── Finance ──
  finance: {
    stats: () => apiClient.get('/formation/finance/stats/'),
    feeStructures: {
      list: (params?: Record<string, unknown>) => apiClient.get('/formation/finance/fee-structures/', { params }),
      create: (data: Record<string, unknown>) => apiClient.post('/formation/finance/fee-structures/', data),
      update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/formation/finance/fee-structures/${id}/`, data),
    },
    payments: {
      list: (params?: Record<string, unknown>) => apiClient.get('/formation/finance/payments/', { params }),
      create: (data: Record<string, unknown>) => apiClient.post('/formation/finance/payments/', data),
    },
    discounts: {
      list: (params?: Record<string, unknown>) => apiClient.get('/formation/finance/discounts/', { params }),
      create: (data: Record<string, unknown>) => apiClient.post('/formation/finance/discounts/', data),
      update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/formation/finance/discounts/${id}/`, data),
    },
    learnerDiscounts: {
      list: (params?: Record<string, unknown>) => apiClient.get('/formation/finance/learner-discounts/', { params }),
      create: (data: Record<string, unknown>) => apiClient.post('/formation/finance/learner-discounts/', data),
    },
  },

  // ── Payroll ──
  payroll: {
    salaryConfigs: {
      list: (params?: Record<string, unknown>) => apiClient.get('/formation/payroll/salary-configs/', { params }),
      create: (data: Record<string, unknown>) => apiClient.post('/formation/payroll/salary-configs/', data),
      update: (id: string, data: Record<string, unknown>) => apiClient.patch(`/formation/payroll/salary-configs/${id}/`, data),
    },
    payslips: {
      list: (params?: Record<string, unknown>) => apiClient.get('/formation/payroll/payslips/', { params }),
      get: (id: string) => apiClient.get(`/formation/payroll/payslips/${id}/`),
      generate: (data: Record<string, unknown>) => apiClient.post('/formation/payroll/payslips/generate/', data),
    },
  },
};
