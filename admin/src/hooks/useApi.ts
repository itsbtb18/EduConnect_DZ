import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  studentsAPI,
  teachersAPI,
  academicsAPI,
  gradesAPI,
  attendanceAPI,
  financeAPI,
  announcementsAPI,
  chatAPI,
  notificationsAPI,
  authAPI,
  schoolsAPI,
  usersAPI,
} from '../api/services';

/* ─────────────────────────────── Types ─────────────────────────────── */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractData(res: { data: any }): { results: Record<string, any>[]; count: number } {
  const d = res.data;
  if (Array.isArray(d)) return { results: d, count: d.length };
  if (d && typeof d === 'object' && 'results' in d) return { results: d.results, count: d.count };
  return { results: [], count: 0 };
}

/* ────────────────────────── Dashboard Stats ────────────────────────── */
export function useDashboardStats() {
  const students = useQuery({
    queryKey: ['students', 'stats'],
    queryFn: () => studentsAPI.list({ page_size: 1 }),
    retry: 1,
    staleTime: 60_000,
  });

  const teachers = useQuery({
    queryKey: ['teachers', 'stats'],
    queryFn: () => teachersAPI.list({ page_size: 1 }),
    retry: 1,
    staleTime: 60_000,
  });

  const classes = useQuery({
    queryKey: ['classes', 'stats'],
    queryFn: () => academicsAPI.classes({ page_size: 1 }),
    retry: 1,
    staleTime: 60_000,
  });

  const payments = useQuery({
    queryKey: ['payments', 'stats'],
    queryFn: () => financeAPI.payments({ page_size: 1 }),
    retry: 1,
    staleTime: 60_000,
  });

  return {
    studentCount: students.data ? extractData(students.data).count : 0,
    teacherCount: teachers.data ? extractData(teachers.data).count : 0,
    classCount: classes.data ? extractData(classes.data).count : 0,
    paymentCount: payments.data ? extractData(payments.data).count : 0,
    isLoading: students.isLoading || teachers.isLoading,
    isError: students.isError && teachers.isError,
  };
}

/* ────────────────────────────── Students ────────────────────────────── */
export function useStudents(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: async () => {
      const res = await studentsAPI.list(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ['students', id],
    queryFn: async () => {
      const { data } = await studentsAPI.get(id);
      return data;
    },
    enabled: !!id,
  });
}

/* ────────────────────────────── Teachers ────────────────────────────── */
export function useTeachers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: async () => {
      const res = await teachersAPI.list(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: ['teachers', id],
    queryFn: async () => {
      const { data } = await teachersAPI.get(id);
      return data;
    },
    enabled: !!id,
  });
}

/* ────────────────────────────── Classes ─────────────────────────────── */
export function useClasses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: async () => {
      const res = await academicsAPI.classes(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useSubjects(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: async () => {
      const res = await academicsAPI.subjects(params);
      return extractData(res);
    },
    retry: 1,
  });
}

/* ────────────────────────────── Grades ──────────────────────────────── */
export function useGrades(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['grades', params],
    queryFn: async () => {
      const res = await gradesAPI.list(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] });
      message.success('Note enregistree avec succes');
    },
    onError: () => message.error('Erreur lors de l\'enregistrement'),
  });
}

export function useUpdateGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      gradesAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] });
      message.success('Note mise a jour');
    },
    onError: () => message.error('Erreur de mise a jour'),
  });
}

/* ─────────────────────────── Attendance ─────────────────────────────── */
export function useAttendance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      const res = await attendanceAPI.list(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => attendanceAPI.mark(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      message.success('Presence enregistree');
    },
    onError: () => message.error('Erreur'),
  });
}

/* ─────────────────────────── Finance ────────────────────────────────── */
export function usePayments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      const res = await financeAPI.payments(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createPayment(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      message.success('Paiement enregistre');
    },
    onError: () => message.error('Erreur de paiement'),
  });
}

/* ─────────────────────────── Announcements ──────────────────────────── */
export function useAnnouncements(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: async () => {
      const res = await announcementsAPI.list(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => announcementsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      message.success('Annonce publiee');
    },
    onError: () => message.error('Erreur de publication'),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => announcementsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      message.success('Annonce supprimee');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

/* ─────────────────────────── Chat ───────────────────────────────────── */
export function useChatRooms(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['chatRooms', params],
    queryFn: async () => {
      const res = await chatAPI.rooms(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useChatMessages(roomId: string) {
  return useQuery({
    queryKey: ['chatMessages', roomId],
    queryFn: async () => {
      const res = await chatAPI.messages(roomId);
      return extractData(res);
    },
    enabled: !!roomId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: Record<string, unknown> }) =>
      chatAPI.sendMessage(roomId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['chatMessages', vars.roomId] });
    },
    onError: () => message.error('Erreur d\'envoi'),
  });
}

/* ─────────────────────────── Notifications ──────────────────────────── */
export function useNotifications(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const res = await notificationsAPI.list(params);
      return extractData(res);
    },
    retry: 1,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsAPI.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/* ─────────────────────────── Schedule ───────────────────────────────── */
export function useScheduleSlots(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['schedule', params],
    queryFn: async () => {
      const res = await academicsAPI.scheduleSlots(params);
      return extractData(res);
    },
    retry: 1,
  });
}

/* ─────────────────────────── Schools ────────────────────────────────── */
export function useSchools(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['schools', params],
    queryFn: async () => {
      const res = await schoolsAPI.list(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useSchool(id: string) {
  return useQuery({
    queryKey: ['schools', id],
    queryFn: async () => {
      const { data } = await schoolsAPI.get(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => schoolsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schools'] });
      message.success('Ecole creee avec succes');
    },
    onError: () => message.error("Erreur lors de la creation de l'ecole"),
  });
}

export function useUpdateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      schoolsAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schools'] });
      message.success('Ecole mise a jour');
    },
    onError: () => message.error('Erreur de mise a jour'),
  });
}

export function useDeleteSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => schoolsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schools'] });
      message.success('Ecole supprimee');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

/* ─────────────────────────── Users (admin) ──────────────────────────── */
export function useUsers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const res = await usersAPI.list(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await usersAPI.get(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => usersAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      message.success('Utilisateur cree avec succes');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: Record<string, unknown> } };
      const detail = err?.response?.data;
      if (detail) {
        const msgs = Object.values(detail).flat().join(', ');
        message.error(msgs || 'Erreur lors de la creation');
      } else {
        message.error('Erreur lors de la creation');
      }
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      usersAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      message.success('Utilisateur mis a jour');
    },
    onError: () => message.error('Erreur de mise a jour'),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      message.success('Utilisateur desactive');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, new_password }: { id: string; new_password: string }) =>
      usersAPI.resetPassword(id, new_password),
    onSuccess: () => {
      message.success('Mot de passe reinitialise');
    },
    onError: () => message.error('Erreur lors de la reinitialisation'),
  });
}

/* ─────────────────────────── Auth ───────────────────────────────────── */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await authAPI.me();
      return data;
    },
    retry: 1,
    staleTime: 120_000,
  });
}

/* ──────────────────── Platform Stats (Super Admin) ──────────────────── */
export function usePlatformStats() {
  return useQuery({
    queryKey: ['platformStats'],
    queryFn: async () => {
      const { data } = await authAPI.platformStats();
      return data;
    },
    retry: 1,
    staleTime: 60_000,
  });
}
