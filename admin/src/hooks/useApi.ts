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

export function useStudentFullProfile(id: string) {
  return useQuery({
    queryKey: ['students', id, 'full-profile'],
    queryFn: async () => {
      const { data } = await studentsAPI.fullProfile(id);
      return data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useStudentQRCode(id: string, enabled = true) {
  return useQuery({
    queryKey: ['students', id, 'qr-code'],
    queryFn: async () => {
      const { data } = await studentsAPI.qrCode(id);
      return data;
    },
    enabled: !!id && enabled,
    staleTime: 3_600_000, // 1h — matches Redis TTL
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

export function useTeacherFullProfile(id: string) {
  return useQuery({
    queryKey: ['teachers', id, 'full-profile'],
    queryFn: async () => {
      const { data } = await teachersAPI.fullProfile(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useTeacherQRCode(id: string) {
  return useQuery({
    queryKey: ['teachers', id, 'qr-code'],
    queryFn: async () => {
      const { data } = await teachersAPI.qrCode(id);
      return data as { qr_code_base64: string; qr_data: string; generated_at: string };
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

export function useBulkSetupTeachers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { teachers: Record<string, unknown>[] }) =>
      teachersAPI.bulkSetup(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] });
    },
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

/* ──────────────────────────── Levels ────────────────────────────────── */
export function useLevels(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['levels', params],
    queryFn: async () => {
      const res = await academicsAPI.levels(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => academicsAPI.createLevel(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['levels'] });
      message.success('Niveau ajouté');
    },
    onError: () => message.error("Erreur lors de l'ajout du niveau"),
  });
}

export function useUpdateLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      academicsAPI.updateLevel(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['levels'] });
      message.success('Niveau mis à jour');
    },
    onError: () => message.error('Erreur de mise à jour'),
  });
}

export function useDeleteLevel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsAPI.deleteLevel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['levels'] });
      message.success('Niveau supprimé');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

/* ──────────────────────────── Streams ───────────────────────────────── */
export function useStreams(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['streams', params],
    queryFn: async () => {
      const res = await academicsAPI.streams(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => academicsAPI.createStream(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['streams'] });
      message.success('Filière ajoutée');
    },
    onError: () => message.error("Erreur lors de l'ajout de la filière"),
  });
}

export function useUpdateStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      academicsAPI.updateStream(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['streams'] });
      message.success('Filière mise à jour');
    },
    onError: () => message.error('Erreur de mise à jour'),
  });
}

export function useDeleteStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsAPI.deleteStream(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['streams'] });
      message.success('Filière supprimée');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

/* ──────────────────────── Level–Subjects ────────────────────────────── */
export function useLevelSubjects(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['level-subjects', params],
    queryFn: async () => {
      const res = await academicsAPI.levelSubjects(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateLevelSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => academicsAPI.createLevelSubject(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['level-subjects'] });
    },
  });
}

export function useUpdateLevelSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      academicsAPI.updateLevelSubject(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['level-subjects'] });
      message.success('Configuration mise à jour');
    },
    onError: () => message.error('Erreur de mise à jour'),
  });
}

export function useDeleteLevelSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsAPI.deleteLevelSubject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['level-subjects'] });
      message.success('Configuration supprimée');
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

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => academicsAPI.createSubject(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsAPI.deleteSubject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      message.success('Matière supprimée');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

/**
 * Batch upsert: subjects + level-subject configs in one API call.
 * Used by the setup wizard (step 5) for bulk save.
 */
export function useBulkSyncSubjects() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { subjects: Record<string, unknown>[]; level_subjects: Record<string, unknown>[] }) =>
      academicsAPI.bulkSyncSubjects(data),
    onSuccess: (_data) => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['level-subjects'] });
    },
  });
}

/* ────────────────────────── Sections & Academic Years ───────────────── */
export function useSections(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['sections', params],
    queryFn: async () => {
      const res = await schoolsAPI.sections(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateSection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => schoolsAPI.createSection(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sections'] });
      message.success('Section créée');
    },
    onError: () => message.error('Erreur lors de la création de la section'),
  });
}

export function useAcademicYears(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['academic-years', params],
    queryFn: async () => {
      const res = await schoolsAPI.academicYears(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => schoolsAPI.createAcademicYear(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['academic-years'] });
      message.success('Année académique créée');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: Record<string, unknown>; status?: number } };
      console.error('Academic year creation error:', err?.response?.data);
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') {
        message.error(detail);
      } else if (err?.response?.data && typeof err.response.data === 'object') {
        const firstField = Object.keys(err.response.data)[0];
        const msgs = err.response.data[firstField];
        const text = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
        message.error(`${firstField}: ${text}`);
      } else {
        message.error("Erreur lors de la création de l'année académique");
      }
    },
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

export function useGradeAuditLog(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['gradeAuditLog', params],
    queryFn: async () => {
      const { data } = await gradesAPI.auditLog(params);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!params?.student_id,
    retry: 1,
  });
}

/* ── ExamTypes ── */
export function useExamTypes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['examTypes', params],
    queryFn: async () => {
      const res = await gradesAPI.examTypes(params);
      return extractData(res);
    },
    enabled: !!params?.classroom_id,
    retry: 1,
  });
}

export function useCreateExamType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.createExamType(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['examTypes'] });
      message.success('Type d\'examen créé');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const msg = e?.response?.data?.percentage?.[0] || 'Erreur lors de la création';
      message.error(msg);
    },
  });
}

export function useUpdateExamType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      gradesAPI.updateExamType(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['examTypes'] });
      message.success('Type d\'examen mis à jour');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const msg = e?.response?.data?.percentage?.[0] || 'Erreur de mise à jour';
      message.error(msg);
    },
  });
}

export function useDeleteExamType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gradesAPI.deleteExamType(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['examTypes'] });
      message.success('Type d\'examen supprimé');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

/* ── Grade Operations ── */
export function useBulkEnterGrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.bulkEnter(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] });
      qc.invalidateQueries({ queryKey: ['gradeAuditLog'] });
      message.success('Notes enregistrées avec succès');
    },
    onError: () => message.error('Erreur lors de la saisie en lot'),
  });
}

export function usePublishGrades() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.publishGrades(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] });
      qc.invalidateQueries({ queryKey: ['gradeAuditLog'] });
      message.success('Notes publiées avec succès');
    },
    onError: () => message.error('Erreur lors de la publication'),
  });
}

export function useCorrectGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      gradesAPI.correctGrade(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades'] });
      qc.invalidateQueries({ queryKey: ['gradeAuditLog'] });
      message.success('Note corrigée');
    },
    onError: () => message.error('Erreur lors de la correction'),
  });
}

/* ── Subject Averages ── */
export function useSubjectAverages(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['subjectAverages', params],
    queryFn: async () => {
      const res = await gradesAPI.subjectAverages(params);
      return extractData(res);
    },
    enabled: !!params?.classroom_id && !!params?.trimester,
    retry: 1,
  });
}

export function useRecalcSubjectAverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.recalcSubjectAverage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjectAverages'] });
      message.success('Moyenne recalculée');
    },
    onError: () => message.error('Erreur lors du recalcul'),
  });
}

export function useOverrideSubjectAverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.overrideSubjectAverage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjectAverages'] });
      qc.invalidateQueries({ queryKey: ['gradeAuditLog'] });
      message.success('Moyenne matière modifiée');
    },
    onError: () => message.error('Erreur de modification'),
  });
}

export function usePublishSubjectAverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.publishSubjectAverage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjectAverages'] });
      message.success('Moyennes matière publiées');
    },
    onError: () => message.error('Erreur de publication'),
  });
}

/* ── Trimester Averages ── */
export function useTrimesterAverages(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['trimesterAverages', params],
    queryFn: async () => {
      const res = await gradesAPI.trimesterAverages(params);
      return extractData(res);
    },
    enabled: !!params?.classroom_id && !!params?.trimester,
    retry: 1,
  });
}

export function useRecalcTrimesterAverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.recalcTrimesterAverage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trimesterAverages'] });
      qc.invalidateQueries({ queryKey: ['subjectAverages'] });
      message.success('Moyennes trimestre recalculées');
    },
    onError: () => message.error('Erreur lors du recalcul'),
  });
}

export function useOverrideTrimesterAverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.overrideTrimesterAverage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trimesterAverages'] });
      qc.invalidateQueries({ queryKey: ['gradeAuditLog'] });
      message.success('Moyenne générale modifiée');
    },
    onError: () => message.error('Erreur de modification'),
  });
}

export function usePublishTrimesterAverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.publishTrimesterAverage(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trimesterAverages'] });
      message.success('Moyennes trimestre publiées');
    },
    onError: () => message.error('Erreur de publication'),
  });
}

export function useLockTrimester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.lockTrimester(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trimesterAverages'] });
      qc.invalidateQueries({ queryKey: ['gradeAuditLog'] });
      message.success('Trimestre verrouillé');
    },
    onError: () => message.error('Erreur de verrouillage'),
  });
}

export function useUnlockTrimester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.unlockTrimester(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trimesterAverages'] });
      qc.invalidateQueries({ queryKey: ['gradeAuditLog'] });
      message.success('Trimestre déverrouillé');
    },
    onError: () => message.error('Erreur de déverrouillage'),
  });
}

/* ── Grade Appeals ── */
export function useGradeAppeals(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['gradeAppeals', params],
    queryFn: async () => {
      const res = await gradesAPI.appeals(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useRespondAppeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      gradesAPI.respondAppeal(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gradeAppeals'] });
      qc.invalidateQueries({ queryKey: ['pendingAppealsCount'] });
      qc.invalidateQueries({ queryKey: ['gradeAuditLog'] });
      message.success('Réponse envoyée');
    },
    onError: () => message.error('Erreur lors de la réponse'),
  });
}

export function usePendingAppealsCount() {
  return useQuery({
    queryKey: ['pendingAppealsCount'],
    queryFn: async () => {
      const { data } = await gradesAPI.pendingAppealsCount();
      return (data as { count: number })?.count ?? 0;
    },
    refetchInterval: 60_000,
    retry: 1,
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

export function useAbsenceStats() {
  return useQuery({
    queryKey: ['attendance', 'stats'],
    queryFn: async () => {
      const res = await attendanceAPI.stats();
      return extractData(res);
    },
    retry: 1,
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useJustifyAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      attendanceAPI.justify(id, { justification_note: note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      message.success('Absence justifiée avec succès');
    },
    onError: () => message.error('Erreur lors de la justification'),
  });
}

export function useCancelAbsence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceAPI.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      message.success('Enregistrement supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

/* ─────────────────────────── Finance (Payments) ─────────────────────── */
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
      qc.invalidateQueries({ queryKey: ['paymentStats'] });
    },
    onError: () => message.error('Erreur lors de la création du paiement'),
  });
}

export function useUpdatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      financeAPI.updatePayment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['paymentStats'] });
      message.success('Paiement mis à jour');
    },
    onError: () => message.error('Erreur de mise à jour'),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeAPI.deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['paymentStats'] });
      message.success('Paiement supprimé');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

export function usePaymentStats() {
  return useQuery({
    queryKey: ['paymentStats'],
    queryFn: async () => {
      const res = await financeAPI.stats();
      return extractData(res);
    },
    retry: 1,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useExpiringSoon() {
  return useQuery({
    queryKey: ['expiringSoon'],
    queryFn: async () => {
      const res = await financeAPI.expiringSoon();
      return extractData(res);
    },
    retry: 1,
    staleTime: 30_000,
  });
}

export function useSendReminder() {
  return useMutation({
    mutationFn: (id: string) => financeAPI.sendReminder(id),
    onError: () => message.error('Erreur lors de l\'envoi du rappel'),
  });
}

export function useBulkReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => financeAPI.bulkReminder(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expiringSoon'] });
      message.success('Rappels envoyés avec succès');
    },
    onError: () => message.error('Erreur lors de l\'envoi des rappels'),
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
      message.success('Structure de frais créée');
    },
    onError: () => message.error('Erreur de création'),
  });
}

export function useUpdateFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      financeAPI.updateFee(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] });
      message.success('Structure mise à jour');
    },
    onError: () => message.error('Erreur de mise à jour'),
  });
}

export function useDeleteFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeAPI.deleteFee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fees'] });
      message.success('Structure supprimée');
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

/* ─────────────────────────── Chat / Messaging ──────────────────────── */
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const res = await chatAPI.conversations();
      return extractData(res);
    },
    retry: 1,
  });
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ['conversationMessages', conversationId],
    queryFn: async () => {
      const res = await chatAPI.messages(conversationId);
      return extractData(res);
    },
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { participant_other_id: string; participant_other_role: string }) =>
      chatAPI.createConversation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => message.error('Erreur lors de la création de la conversation'),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatAPI.deleteConversation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      message.success('Conversation supprimée');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: FormData }) =>
      chatAPI.uploadAttachment(conversationId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['conversationMessages', vars.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => message.error('Erreur d\'envoi du fichier'),
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const res = await chatAPI.contacts();
      return extractData(res);
    },
    retry: 1,
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

/* ─────────────────────────── Timetables ─────────────────────────────── */
export function useTimetables(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['timetables', params],
    queryFn: async () => {
      const res = await academicsAPI.timetables(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useTimetablesClassesStatus() {
  return useQuery({
    queryKey: ['timetables-classes-status'],
    queryFn: async () => {
      const res = await academicsAPI.timetablesClassesStatus();
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => academicsAPI.createTimetable(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetables'] });
      qc.invalidateQueries({ queryKey: ['timetables-classes-status'] });
    },
    onError: () => message.error('Erreur lors de l\'ajout'),
  });
}

export function useUpdateTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      academicsAPI.updateTimetable(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetables'] });
      qc.invalidateQueries({ queryKey: ['timetables-classes-status'] });
      message.success('Emploi du temps mis à jour');
    },
    onError: () => message.error('Erreur de mise à jour'),
  });
}

export function useDeleteTimetable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsAPI.deleteTimetable(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timetables'] });
      qc.invalidateQueries({ queryKey: ['timetables-classes-status'] });
      message.success('Emploi du temps supprimé');
    },
    onError: () => message.error('Erreur de suppression'),
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

export function useSchoolProfile(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['school-profile'],
    queryFn: async () => {
      const { data } = await schoolsAPI.profile();
      return data;
    },
    retry: 1,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData | Record<string, unknown>) => schoolsAPI.create(data),
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
    mutationFn: ({ id, data }: { id: string; data: FormData | Record<string, unknown> }) =>
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

export function useUploadSchoolLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      schoolsAPI.uploadLogo(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schools'] });
      qc.invalidateQueries({ queryKey: ['school-profile'] });
      message.success('Logo mis a jour');
    },
    onError: () => message.error('Erreur lors du telechargement du logo'),
  });
}

export function useCompleteSetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => schoolsAPI.completeSetup(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['school-profile'] });
      message.success('Configuration terminee');
    },
    onError: () => message.error('Erreur'),
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

export function useHomeworkStats() {
  return useQuery({
    queryKey: ['homework', 'stats'],
    queryFn: async () => {
      const { data } = await homeworkAPI.stats();
      return data;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useHomeworkCalendar(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['homework', 'calendar', params],
    queryFn: async () => {
      const { data } = await homeworkAPI.calendar(params);
      return data;
    },
  });
}

export function useHomeworkOverload(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['homework', 'overload', params],
    queryFn: async () => {
      const { data } = await homeworkAPI.overload(params);
      return data;
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
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      homeworkAPI.delete(id, reason ? { reason } : undefined),
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

/* ─────────────────── Create Conversation (compat) ───────────────────── */
// Kept for backward compat — delegates to useCreateConversation above

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

/* ─────────────────── Finance Stats (legacy — now uses usePaymentStats) ── */
export function useFinanceStats() {
  return usePaymentStats();
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
