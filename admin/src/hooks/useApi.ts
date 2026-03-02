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
  homeworkAPI,
  authAPI,
  schoolsAPI,
  usersAPI,
  platformSettingsAPI,
  activityLogsAPI,
  systemHealthAPI,
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
    refetchInterval: 60_000,
  });

  const teachers = useQuery({
    queryKey: ['teachers', 'stats'],
    queryFn: () => teachersAPI.list({ page_size: 1 }),
    retry: 1,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const classes = useQuery({
    queryKey: ['classes', 'stats'],
    queryFn: () => academicsAPI.classes({ page_size: 1 }),
    retry: 1,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const payments = useQuery({
    queryKey: ['payments', 'stats'],
    queryFn: () => financeAPI.payments({ page_size: 1 }),
    retry: 1,
    staleTime: 60_000,
    refetchInterval: 60_000,
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

export function useCreateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => studentsAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      message.success('Eleve ajoute avec succes');
    },
    onError: () => message.error("Erreur lors de l'ajout"),
  });
}

export function useUpdateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      studentsAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      message.success('Eleve mis a jour');
    },
    onError: () => message.error('Erreur de mise a jour'),
  });
}

export function useDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['students'] });
      message.success('Eleve supprime');
    },
    onError: () => message.error('Erreur de suppression'),
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

export function useCreateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => teachersAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      message.success('Enseignant cree avec succes');
    },
    onError: () => message.error("Erreur lors de la creation"),
  });
}

export function useUpdateTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      teachersAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      message.success('Enseignant mis a jour');
    },
    onError: () => message.error('Erreur de mise a jour'),
  });
}

export function useDeleteTeacher() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teachersAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
      message.success('Enseignant supprime');
    },
    onError: () => message.error('Erreur de suppression'),
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

export function useDeleteGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gradesAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] });
      message.success('Note supprimée');
    },
    onError: () => message.error('Erreur lors de la suppression'),
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
      message.success('Paiement enregistré');
    },
    onError: () => message.error('Erreur de paiement'),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      financeAPI.updatePayment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      message.success('Paiement mis à jour');
    },
    onError: () => message.error('Erreur de mise à jour'),
  });
}

export function useFees(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['fees', params],
    queryFn: async () => {
      const res = await financeAPI.fees(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createFee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] });
      message.success('Frais créé');
    },
    onError: () => message.error('Erreur de création'),
  });
}

export function useDeleteFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeAPI.deleteFee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] });
      message.success('Frais supprimé');
    },
    onError: () => message.error('Erreur de suppression'),
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

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      announcementsAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      message.success('Annonce mise a jour');
    },
    onError: () => message.error('Erreur de mise a jour'),
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
    mutationFn: ({ roomId, data }: { roomId: string; data: Record<string, unknown> | FormData }) =>
      chatAPI.sendMessage(roomId, data as Record<string, unknown>),
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

/* ──────────────────── Profile & Password ────────────────────────────── */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      usersAPI.update(data.id as string, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['currentUser'] });
      message.success('Profil mis a jour');
    },
    onError: () => message.error('Erreur de mise a jour du profil'),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ old_password, new_password }: { old_password: string; new_password: string }) =>
      usersAPI.changePassword(old_password, new_password),
    onSuccess: () => {
      message.success('Mot de passe modifie avec succes');
    },
    onError: () => message.error('Erreur lors du changement de mot de passe'),
  });
}

/* ──────────────────── Homework ────────────────────────────────────── */
export function useHomework(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['homework', params],
    queryFn: async () => {
      const res = await homeworkAPI.list(params);
      return extractData(res);
    },
  });
}

export function useCreateHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => homeworkAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework'] });
      message.success('Devoir créé avec succès');
    },
    onError: () => message.error('Erreur lors de la création du devoir'),
  });
}

export function useUpdateHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      homeworkAPI.update(data.id as string, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework'] });
      message.success('Devoir mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteHomework() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homeworkAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['homework'] });
      message.success('Devoir supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

/* ─────────────────── Class CRUD (Rec #5) ────────────────────────────── */
export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => academicsAPI.createClass(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      message.success('Classe créée avec succès');
    },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      academicsAPI.updateClass(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      message.success('Classe mise à jour');
    },
    onError: () => message.error('Erreur de mise à jour'),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsAPI.deleteClass(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['classes'] });
      message.success('Classe supprimée');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

/* ─────────────────── Schedule CRUD (Rec #4) ─────────────────────────── */
export function useCreateScheduleSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => academicsAPI.createScheduleSlot(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      message.success('Créneau ajouté');
    },
    onError: () => message.error('Erreur lors de l\'ajout'),
  });
}

export function useUpdateScheduleSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      academicsAPI.updateScheduleSlot(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      message.success('Créneau mis à jour');
    },
    onError: () => message.error('Erreur de mise à jour'),
  });
}

export function useDeleteScheduleSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsAPI.deleteScheduleSlot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      message.success('Créneau supprimé');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

/* ─────────────────── Create Chat Room (Rec #2) ──────────────────────── */
export function useCreateChatRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => chatAPI.createRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
      message.success('Conversation créée');
    },
    onError: () => message.error('Erreur lors de la création'),
  });
}

/* ─────────────────── Bulk Attendance (Rec #9) ───────────────────────── */
export function useBulkMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => attendanceAPI.bulkMark(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      message.success('Présence enregistrée pour la classe');
    },
    onError: () => message.error('Erreur lors de l\'enregistrement'),
  });
}

/* ─────────────────── Report Cards (Rec #8) ──────────────────────────── */
export function useReportCards(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reportCards', params],
    queryFn: async () => {
      const res = await gradesAPI.reportCards(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useGenerateReportCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.generateReportCard(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reportCards'] });
      message.success('Bulletin généré');
    },
    onError: () => message.error('Erreur de génération'),
  });
}

/* ─────────────────── Finance Stats (Rec #7) ─────────────────────────── */
export function useFinanceStats() {
  return useQuery({
    queryKey: ['financeStats'],
    queryFn: async () => {
      try {
        const { data } = await financeAPI.stats();
        return data;
      } catch {
        // Fallback: if aggregate endpoint doesn't exist yet, return null
        return null;
      }
    },
    retry: 0,
    staleTime: 60_000,
  });
}

/* ─────────────── Platform Settings (Rec #3 — Super Admin) ───────────── */
export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platformSettings'],
    queryFn: async () => {
      try {
        const { data } = await platformSettingsAPI.get();
        return data;
      } catch {
        // fallback to localStorage if API not available yet
        return null;
      }
    },
    retry: 0,
    staleTime: 120_000,
  });
}

export function useUpdatePlatformSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => platformSettingsAPI.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platformSettings'] });
      message.success('Configuration sauvegardée');
    },
    onError: () => message.error('Erreur de sauvegarde'),
  });
}

/* ─────────────── Activity Logs (Rec #13 — Super Admin) ──────────────── */
export function useActivityLogs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['activityLogs', params],
    queryFn: async () => {
      try {
        const res = await activityLogsAPI.list(params);
        return extractData(res);
      } catch {
        return { results: [], count: 0 };
      }
    },
    retry: 0,
  });
}

/* ─────────────── System Health (Rec #14 — Super Admin) ──────────────── */
export function useSystemHealth() {
  return useQuery({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      try {
        const { data } = await systemHealthAPI.check();
        return data;
      } catch {
        return null;
      }
    },
    retry: 0,
    refetchInterval: 30_000,
  });
}
