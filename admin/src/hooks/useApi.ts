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
  subscriptionsAPI,
  analyticsAPI,
  impersonationAPI,
  contentAPI,
  broadcastAPI,
  infirmerieAPI,
  cantineAPI,
  transportAPI,
  libraryAPI,
  elearningAPI,
  smsAPI,
  notificationsExtAPI,
  fingerprintAPI,
  disciplineAPI,
  staffAPI,
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

/* ── Fee Discounts ── */
export function useDiscounts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['discounts', params],
    queryFn: async () => { const r = await financeAPI.discounts(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createDiscount(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discounts'] }); message.success('Réduction créée'); },
    onError: () => message.error('Erreur'),
  });
}
export function useUpdateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => financeAPI.updateDiscount(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discounts'] }); message.success('Réduction mise à jour'); },
    onError: () => message.error('Erreur'),
  });
}
export function useDeleteDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeAPI.deleteDiscount(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discounts'] }); message.success('Réduction supprimée'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Late Penalties ── */
export function usePenalties(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['penalties', params],
    queryFn: async () => { const r = await financeAPI.penalties(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreatePenalty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createPenalty(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['penalties'] }); message.success('Pénalité créée'); },
    onError: () => message.error('Erreur'),
  });
}
export function useDeletePenalty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeAPI.deletePenalty(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['penalties'] }); message.success('Pénalité supprimée'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Registration Deposits ── */
export function useDeposits(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['deposits', params],
    queryFn: async () => { const r = await financeAPI.deposits(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreateDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createDeposit(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deposits'] }); message.success('Inscription enregistrée'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Extra Fees ── */
export function useExtraFees(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['extraFees', params],
    queryFn: async () => { const r = await financeAPI.extraFees(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreateExtraFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createExtraFee(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['extraFees'] }); message.success('Frais supplémentaire créé'); },
    onError: () => message.error('Erreur'),
  });
}
export function useDeleteExtraFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeAPI.deleteExtraFee(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['extraFees'] }); message.success('Frais supprimé'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Expense Categories ── */
export function useExpenseCategories(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['expenseCategories', params],
    queryFn: async () => { const r = await financeAPI.expenseCategories(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreateExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createExpenseCategory(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenseCategories'] }); message.success('Catégorie créée'); },
    onError: () => message.error('Erreur'),
  });
}
export function useDeleteExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeAPI.deleteExpenseCategory(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenseCategories'] }); message.success('Catégorie supprimée'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Expenses ── */
export function useExpenses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['expenses', params],
    queryFn: async () => { const r = await financeAPI.expenses(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createExpense(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); message.success('Dépense enregistrée'); },
    onError: () => message.error('Erreur'),
  });
}
export function useApproveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => financeAPI.approveExpense(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); message.success('Dépense traitée'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Budgets ── */
export function useBudgets(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['budgets', params],
    queryFn: async () => { const r = await financeAPI.budgets(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createBudget(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); message.success('Budget créé'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Salary Configs ── */
export function useSalaryConfigs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['salaryConfigs', params],
    queryFn: async () => { const r = await financeAPI.salaryConfigs(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreateSalaryConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createSalaryConfig(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaryConfigs'] }); message.success('Configuration créée'); },
    onError: () => message.error('Erreur'),
  });
}
export function useUpdateSalaryConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => financeAPI.updateSalaryConfig(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['salaryConfigs'] }); message.success('Configuration mise à jour'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Deductions ── */
export function useDeductions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['deductions', params],
    queryFn: async () => { const r = await financeAPI.deductions(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreateDeduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createDeduction(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deductions'] }); message.success('Déduction créée'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Salary Advances ── */
export function useAdvances(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['advances', params],
    queryFn: async () => { const r = await financeAPI.advances(params); return extractData(r); },
    retry: 1,
  });
}
export function useCreateAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.createAdvance(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advances'] }); message.success('Avance demandée'); },
    onError: () => message.error('Erreur'),
  });
}
export function useApproveAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => financeAPI.approveAdvance(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advances'] }); message.success('Avance traitée'); },
    onError: () => message.error('Erreur'),
  });
}

/* ── Payslips ── */
export function usePayslips(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['payslips', params],
    queryFn: async () => { const r = await financeAPI.payslips(params); return extractData(r); },
    retry: 1,
  });
}
export function useGeneratePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.generatePayslip(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payslips'] }); message.success('Fiche de paie générée'); },
    onError: () => message.error('Erreur'),
  });
}
export function useBulkGeneratePayslips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => financeAPI.bulkGeneratePayslips(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payslips'] }); message.success('Fiches de paie générées'); },
    onError: () => message.error('Erreur'),
  });
}
export function useUpdatePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => financeAPI.updatePayslip(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['payslips'] }); message.success('Fiche de paie mise à jour'); },
    onError: () => message.error('Erreur'),
  });
}
export function usePayrollStats(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['payrollStats', params],
    queryFn: async () => { const r = await financeAPI.payrollStats(params); return extractData(r); },
    retry: 1,
  });
}

/* ── Financial Reports ── */
export function useFinancialReports(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['financialReports', params],
    queryFn: async () => { const r = await financeAPI.financialReports(params); return extractData(r); },
    retry: 1,
    staleTime: 60_000,
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
    mutationFn: (data: {
      participant_other_id: string;
      participant_other_role: string;
      room_type?: string;
      related_student_id?: string;
    }) => chatAPI.createConversation(data),
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

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => chatAPI.markConversationRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) =>
      chatAPI.deleteMessage(conversationId, messageId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['conversationMessages', vars.conversationId] });
    },
    onError: () => message.error('Impossible de supprimer ce message'),
  });
}

export function usePinMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) =>
      chatAPI.pinMessage(conversationId, messageId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['conversationMessages', vars.conversationId] });
    },
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

// ── Rooms (group/broadcast) ──
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

export function useCreateChatRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => chatAPI.createRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
      message.success('Salon créé');
    },
    onError: () => message.error('Erreur lors de la création du salon'),
  });
}

export function useChatRoomMessages(roomId: string) {
  return useQuery({
    queryKey: ['chatRoomMessages', roomId],
    queryFn: async () => {
      const res = await chatAPI.roomMessages(roomId);
      return extractData(res);
    },
    enabled: !!roomId,
  });
}

export function useRoomUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string; data: FormData }) =>
      chatAPI.roomUploadAttachment(roomId, data),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['chatRoomMessages', vars.roomId] });
      qc.invalidateQueries({ queryKey: ['chatRooms'] });
    },
    onError: () => message.error('Erreur d\'envoi du fichier'),
  });
}

export function useDeleteRoomMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, messageId }: { roomId: string; messageId: string }) =>
      chatAPI.deleteRoomMessage(roomId, messageId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['chatRoomMessages', vars.roomId] });
    },
    onError: () => message.error('Impossible de supprimer ce message'),
  });
}

export function usePinRoomMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, messageId }: { roomId: string; messageId: string }) =>
      chatAPI.pinRoomMessage(roomId, messageId),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['chatRoomMessages', vars.roomId] });
    },
  });
}

// ── Search & Templates ──
export function useSearchMessages(query: string) {
  return useQuery({
    queryKey: ['searchMessages', query],
    queryFn: async () => {
      const res = await chatAPI.searchMessages({ q: query });
      return extractData(res);
    },
    enabled: query.length >= 2,
    retry: 1,
  });
}

export function useMessageTemplates(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['messageTemplates', params],
    queryFn: async () => {
      const res = await chatAPI.templates(params);
      return extractData(res);
    },
    retry: 1,
  });
}

export function useCreateMessageTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => chatAPI.createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messageTemplates'] });
      message.success('Modèle créé');
    },
    onError: () => message.error('Erreur de création du modèle'),
  });
}

export function useDeleteMessageTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatAPI.deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messageTemplates'] });
      message.success('Modèle supprimé');
    },
    onError: () => message.error('Erreur de suppression'),
  });
}

// ── Announcement extras ──
export function useMarkAnnouncementRead() {
  return useMutation({
    mutationFn: (id: string) => announcementsAPI.markRead(id),
  });
}

export function useUploadAnnouncementImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      announcementsAPI.uploadImage(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: () => message.error('Erreur d\'upload de l\'image'),
  });
}

export function useUploadAnnouncementAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      announcementsAPI.uploadAttachment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
    },
    onError: () => message.error('Erreur d\'upload du fichier'),
  });
}

export function useAnnouncementReaders(id: string) {
  return useQuery({
    queryKey: ['announcementReaders', id],
    queryFn: async () => {
      const res = await announcementsAPI.readers(id);
      return extractData(res);
    },
    enabled: !!id,
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

export function useCheckConflicts() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => academicsAPI.checkConflicts(data),
  });
}

export function useClassSchedule(classId?: string) {
  return useQuery({
    queryKey: ['classSchedule', classId],
    queryFn: async () => {
      const res = await academicsAPI.classSchedule(classId!);
      return extractData(res);
    },
    enabled: !!classId,
  });
}

export function useTeacherSchedule(teacherId?: string) {
  return useQuery({
    queryKey: ['teacherSchedule', teacherId],
    queryFn: async () => {
      const res = await academicsAPI.teacherSchedule(teacherId!);
      return extractData(res);
    },
    enabled: !!teacherId,
  });
}

export function usePublishSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => academicsAPI.publishSchedule(classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      message.success('Emploi du temps publié');
    },
    onError: () => message.error('Erreur lors de la publication'),
  });
}

export function useUnpublishSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => academicsAPI.unpublishSchedule(classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      message.success('Emploi du temps repassé en brouillon');
    },
    onError: () => message.error('Erreur'),
  });
}

export function useValidateTimetable(classId?: string) {
  return useQuery({
    queryKey: ['validateTimetable', classId],
    queryFn: async () => {
      const res = await academicsAPI.validateTimetable(classId!);
      return extractData(res);
    },
    enabled: !!classId,
  });
}

export function useExportClassPdf() {
  return useMutation({
    mutationFn: async (classId: string) => {
      const res = await academicsAPI.exportClassPdf(classId);
      return res.data;
    },
  });
}

export function useExportTeacherPdf() {
  return useMutation({
    mutationFn: async (teacherId: string) => {
      const res = await academicsAPI.exportTeacherPdf(teacherId);
      return res.data;
    },
  });
}

export function useRooms(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['rooms', params],
    queryFn: async () => {
      const res = await academicsAPI.rooms(params);
      return extractData(res);
    },
  });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => academicsAPI.createRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      message.success('Salle créée');
    },
    onError: () => message.error('Erreur'),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      academicsAPI.updateRoom(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      message.success('Salle mise à jour');
    },
    onError: () => message.error('Erreur'),
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsAPI.deleteRoom(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      message.success('Salle supprimée');
    },
    onError: () => message.error('Erreur'),
  });
}

export function useRoomOccupancy(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['roomOccupancy', params],
    queryFn: async () => {
      const res = await academicsAPI.roomOccupancy(params);
      return extractData(res);
    },
  });
}

export function useTeacherAvailability(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['teacherAvailability', params],
    queryFn: async () => {
      const res = await academicsAPI.teacherAvailability(params);
      return extractData(res);
    },
  });
}

export function useTimeSlots() {
  return useQuery({
    queryKey: ['timeSlots'],
    queryFn: async () => {
      const res = await academicsAPI.timeSlots();
      return extractData(res);
    },
  });
}

export function useCreateTimeSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => academicsAPI.createTimeSlot(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeSlots'] });
      message.success('Créneau horaire ajouté');
    },
    onError: () => message.error('Erreur'),
  });
}

export function useDeleteTimeSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => academicsAPI.deleteTimeSlot(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeSlots'] });
      message.success('Créneau horaire supprimé');
    },
    onError: () => message.error('Erreur'),
  });
}

export function useSeedDefaultTimeSlots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => academicsAPI.seedDefaultTimeSlots(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['timeSlots'] });
      message.success('Créneaux horaires par défaut créés');
    },
    onError: () => message.error('Erreur'),
  });
}

export function useRoomSchedule(roomId?: string) {
  return useQuery({
    queryKey: ['roomSchedule', roomId],
    queryFn: async () => {
      const res = await academicsAPI.roomSchedule(roomId!);
      return extractData(res);
    },
    enabled: !!roomId,
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

/* ═══════════════════ Subscriptions (Super Admin) ═══════════════════ */

export function useSubscription(schoolId: string) {
  return useQuery({
    queryKey: ['subscription', schoolId],
    queryFn: async () => {
      const { data } = await subscriptionsAPI.get(schoolId);
      return data;
    },
    enabled: !!schoolId,
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, data }: { schoolId: string; data: Record<string, unknown> }) =>
      subscriptionsAPI.update(schoolId, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['subscription', vars.schoolId] });
      message.success('Abonnement mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useActivateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, module, reason }: { schoolId: string; module: string; reason?: string }) =>
      subscriptionsAPI.activateModule(schoolId, module, { reason: reason || '' }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['subscription', vars.schoolId] });
      message.success('Module activé');
    },
    onError: () => message.error("Erreur lors de l'activation"),
  });
}

export function useDeactivateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, module, reason }: { schoolId: string; module: string; reason?: string }) =>
      subscriptionsAPI.deactivateModule(schoolId, module, { reason: reason || '' }),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['subscription', vars.schoolId] });
      message.success('Module désactivé');
    },
    onError: () => message.error('Erreur lors de la désactivation'),
  });
}

export function useSuspendSchool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, reason }: { schoolId: string; reason: string }) =>
      subscriptionsAPI.suspend(schoolId, reason),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['subscription', vars.schoolId] });
      qc.invalidateQueries({ queryKey: ['schools'] });
      message.success('École suspendue');
    },
    onError: () => message.error('Erreur lors de la suspension'),
  });
}

export function useSchoolInvoices(schoolId: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['invoices', schoolId, params],
    queryFn: async () => {
      const { data } = await subscriptionsAPI.invoices(schoolId, params);
      return data;
    },
    enabled: !!schoolId,
  });
}

export function useAllInvoices(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['allInvoices', params],
    queryFn: async () => {
      const { data } = await subscriptionsAPI.allInvoices(params);
      return data;
    },
  });
}

export function useGenerateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, data }: { schoolId: string; data: Record<string, unknown> }) =>
      subscriptionsAPI.generateInvoice(schoolId, data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['invoices', vars.schoolId] });
      qc.invalidateQueries({ queryKey: ['allInvoices'] });
      message.success('Facture générée');
    },
    onError: () => message.error('Erreur lors de la génération'),
  });
}

export function useMarkInvoicePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, invoiceId }: { schoolId: string; invoiceId: string }) =>
      subscriptionsAPI.markPaid(schoolId, invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices'] });
      qc.invalidateQueries({ queryKey: ['allInvoices'] });
      message.success('Facture marquée comme payée');
    },
    onError: () => message.error('Erreur lors du marquage'),
  });
}

export function useModuleLogs(schoolId: string) {
  return useQuery({
    queryKey: ['moduleLogs', schoolId],
    queryFn: async () => {
      const { data } = await subscriptionsAPI.moduleLogs(schoolId);
      return data;
    },
    enabled: !!schoolId,
  });
}

/* ═══════════════════ Analytics (Super Admin) ═══════════════════ */

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const { data } = await analyticsAPI.overview();
      return data;
    },
    staleTime: 60_000,
  });
}

export function useAnalyticsRevenue() {
  return useQuery({
    queryKey: ['analytics', 'revenue'],
    queryFn: async () => {
      const { data } = await analyticsAPI.revenue();
      return data;
    },
    staleTime: 120_000,
  });
}

export function useAnalyticsModulesUsage() {
  return useQuery({
    queryKey: ['analytics', 'modules-usage'],
    queryFn: async () => {
      const { data } = await analyticsAPI.modulesUsage();
      return data;
    },
    staleTime: 120_000,
  });
}

export function useAnalyticsSchoolsMap() {
  return useQuery({
    queryKey: ['analytics', 'schools-map'],
    queryFn: async () => {
      const { data } = await analyticsAPI.schoolsMap();
      return data;
    },
    staleTime: 120_000,
  });
}

export function useAnalyticsChurn() {
  return useQuery({
    queryKey: ['analytics', 'churn'],
    queryFn: async () => {
      const { data } = await analyticsAPI.churn();
      return data;
    },
    staleTime: 120_000,
  });
}

export function useAnalyticsPerformance() {
  return useQuery({
    queryKey: ['analytics', 'performance'],
    queryFn: async () => {
      const { data } = await analyticsAPI.performance();
      return data;
    },
    staleTime: 120_000,
  });
}

/* ═══════════════════ Impersonation (Super Admin) ═══════════════════ */

export function useImpersonationLogs() {
  return useQuery({
    queryKey: ['impersonation-logs'],
    queryFn: async () => {
      const { data } = await impersonationAPI.logs();
      return data;
    },
  });
}

export function useStartImpersonation() {
  return useMutation({
    mutationFn: (schoolId: string) => impersonationAPI.start(schoolId),
  });
}

export function useEndImpersonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) => impersonationAPI.end(logId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['impersonation-logs'] });
      message.success('Impersonation terminée');
    },
  });
}

/* ═══════════════════ Content Management (Super Admin) ═══════════════════ */

export function useContentResources(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['content-resources', params],
    queryFn: async () => {
      const { data } = await contentAPI.list(params);
      return data;
    },
  });
}

export function useContentResource(id: string) {
  return useQuery({
    queryKey: ['content-resources', id],
    queryFn: async () => {
      const { data } = await contentAPI.get(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData | Record<string, unknown>) => contentAPI.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-resources'] });
      message.success('Contenu créé');
    },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useUpdateContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData | Record<string, unknown> }) =>
      contentAPI.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-resources'] });
      message.success('Contenu mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contentAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['content-resources'] });
      message.success('Contenu supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

/* ═══════════════════ Broadcast (Super Admin) ═══════════════════ */

export function useBroadcast() {
  return useMutation({
    mutationFn: (data: { title: string; message: string; target?: string }) =>
      broadcastAPI.send(data),
    onSuccess: () => message.success('Diffusion envoyée'),
    onError: () => message.error("Erreur lors de l'envoi"),
  });
}

/* ══════════════════ Infirmerie (School Infirmary) ══════════════════ */

export function useInfirmerieDashboard() {
  return useQuery({
    queryKey: ['infirmerie', 'dashboard'],
    queryFn: () => infirmerieAPI.dashboard().then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useInfirmerieReports(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['infirmerie', 'reports', params],
    queryFn: () => infirmerieAPI.reports(params).then((r) => r.data),
  });
}

export function useLowStockMedications() {
  return useQuery({
    queryKey: ['infirmerie', 'low-stock'],
    queryFn: () => infirmerieAPI.lowStock().then((r) => r.data),
  });
}

export function useMedicalRecords(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['infirmerie', 'records', params],
    queryFn: () => infirmerieAPI.records.list(params).then((r) => r.data),
  });
}

export function useMedicalRecord(id: string) {
  return useQuery({
    queryKey: ['infirmerie', 'records', id],
    queryFn: () => infirmerieAPI.records.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => infirmerieAPI.records.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'records'] });
      message.success('Dossier médical créé');
    },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useUpdateMedicalRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      infirmerieAPI.records.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'records'] });
      message.success('Dossier mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useConsultations(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['infirmerie', 'consultations', params],
    queryFn: () => infirmerieAPI.consultations.list(params).then((r) => r.data),
  });
}

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => infirmerieAPI.consultations.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'consultations'] });
      qc.invalidateQueries({ queryKey: ['infirmerie', 'dashboard'] });
      message.success('Consultation enregistrée');
    },
    onError: () => message.error("Erreur lors de l'enregistrement"),
  });
}

export function useEmergencyProtocols(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['infirmerie', 'protocols', params],
    queryFn: () => infirmerieAPI.protocols.list(params).then((r) => r.data),
  });
}

export function useEmergencyEvents(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['infirmerie', 'emergencies', params],
    queryFn: () => infirmerieAPI.emergencies.list(params).then((r) => r.data),
  });
}

export function useTriggerEmergency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => infirmerieAPI.emergencies.trigger(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'emergencies'] });
      qc.invalidateQueries({ queryKey: ['infirmerie', 'dashboard'] });
      message.success('Urgence déclenchée');
    },
    onError: () => message.error("Erreur lors du déclenchement"),
  });
}

export function useCloseEmergency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      infirmerieAPI.emergencies.close(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'emergencies'] });
      qc.invalidateQueries({ queryKey: ['infirmerie', 'dashboard'] });
      message.success('Urgence clôturée');
    },
    onError: () => message.error('Erreur lors de la clôture'),
  });
}

export function useInfirmerieMessages(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['infirmerie', 'messages', params],
    queryFn: () => infirmerieAPI.messages.list(params).then((r) => r.data),
  });
}

export function useSendInfirmerieMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => infirmerieAPI.messages.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'messages'] });
      message.success('Message envoyé');
    },
    onError: () => message.error("Erreur lors de l'envoi"),
  });
}

export function useAbsenceJustifications(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['infirmerie', 'justifications', params],
    queryFn: () => infirmerieAPI.justifications.list(params).then((r) => r.data),
  });
}

export function useCreateJustification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown> | FormData) => infirmerieAPI.justifications.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'justifications'] });
      message.success('Justification soumise');
    },
    onError: () => message.error('Erreur lors de la soumission'),
  });
}

export function useValidateJustification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { action: 'validate' | 'reject'; rejection_reason?: string } }) =>
      infirmerieAPI.justifications.validate(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'justifications'] });
      message.success('Justification traitée');
    },
    onError: () => message.error('Erreur lors du traitement'),
  });
}

export function useEpidemicAlerts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['infirmerie', 'epidemics', params],
    queryFn: () => infirmerieAPI.epidemics.list(params).then((r) => r.data),
  });
}

export function useCreateEpidemicAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => infirmerieAPI.epidemics.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'epidemics'] });
      message.success('Alerte épidémique créée');
    },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useContagiousDiseases(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['infirmerie', 'contagious', params],
    queryFn: () => infirmerieAPI.contagious.list(params).then((r) => r.data),
  });
}

export function useCreateContagiousDisease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => infirmerieAPI.contagious.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['infirmerie', 'contagious'] });
      message.success('Cas enregistré');
    },
    onError: () => message.error("Erreur lors de l'enregistrement"),
  });
}

// ══════════════════════════════════════════════════════════════════════
// Cantine
// ══════════════════════════════════════════════════════════════════════

export function useCanteenStudents(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['canteen', 'students', params],
    queryFn: () => cantineAPI.students.list(params).then((r) => r.data),
  });
}

export function useCanteenStudent(id: string) {
  return useQuery({
    queryKey: ['canteen', 'student', id],
    queryFn: () => cantineAPI.students.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCanteenStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => cantineAPI.students.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'students'] });
      message.success('Élève inscrit à la cantine');
    },
    onError: () => message.error("Erreur lors de l'inscription"),
  });
}

export function useUpdateCanteenStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      cantineAPI.students.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'students'] });
      message.success('Inscription mise à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteCanteenStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cantineAPI.students.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'students'] });
      message.success('Inscription supprimée');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useCanteenMenus(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['canteen', 'menus', params],
    queryFn: () => cantineAPI.menus.list(params).then((r) => r.data),
  });
}

export function useCanteenMenu(id: string) {
  return useQuery({
    queryKey: ['canteen', 'menu', id],
    queryFn: () => cantineAPI.menus.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateCanteenMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => cantineAPI.menus.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'menus'] });
      message.success('Menu créé');
    },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useUpdateCanteenMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      cantineAPI.menus.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'menus'] });
      message.success('Menu mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteCanteenMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cantineAPI.menus.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'menus'] });
      message.success('Menu supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function usePublishCanteenMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cantineAPI.menus.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'menus'] });
      message.success('Menu publié');
    },
    onError: () => message.error('Erreur lors de la publication'),
  });
}

export function useCanteenMenuItems(menuId: string) {
  return useQuery({
    queryKey: ['canteen', 'menuItems', menuId],
    queryFn: () => cantineAPI.menuItems.list(menuId).then((r) => r.data),
    enabled: !!menuId,
  });
}

export function useCreateCanteenMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, data }: { menuId: string; data: Record<string, unknown> }) =>
      cantineAPI.menuItems.create(menuId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'menuItems'] });
      qc.invalidateQueries({ queryKey: ['canteen', 'menus'] });
      message.success('Repas ajouté');
    },
    onError: () => message.error("Erreur lors de l'ajout"),
  });
}

export function useUpdateCanteenMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      cantineAPI.menuItems.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'menuItems'] });
      message.success('Repas mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteCanteenMenuItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cantineAPI.menuItems.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'menuItems'] });
      qc.invalidateQueries({ queryKey: ['canteen', 'menus'] });
      message.success('Repas supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useCanteenAttendance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['canteen', 'attendance', params],
    queryFn: () => cantineAPI.attendance.list(params).then((r) => r.data),
  });
}

export function useBulkCanteenAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { date: string; entries: Array<{ student: string; present: boolean; notes?: string }> }) =>
      cantineAPI.attendance.bulk(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['canteen', 'attendance'] });
      message.success('Présences enregistrées');
    },
    onError: () => message.error("Erreur lors de l'enregistrement"),
  });
}

export function useConsumptionReport(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['canteen', 'report', params],
    queryFn: () => cantineAPI.reports.consumption(params).then((r) => r.data),
  });
}

// ══════════════════════════════════════════════════════════════════════
// Transport
// ══════════════════════════════════════════════════════════════════════

export function useTransportDrivers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['transport', 'drivers', params],
    queryFn: () => transportAPI.drivers.list(params).then((r) => r.data),
  });
}

export function useTransportDriver(id: string) {
  return useQuery({
    queryKey: ['transport', 'driver', id],
    queryFn: () => transportAPI.drivers.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTransportDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => transportAPI.drivers.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'drivers'] });
      message.success('Chauffeur ajouté');
    },
    onError: () => message.error("Erreur lors de l'ajout"),
  });
}

export function useUpdateTransportDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      transportAPI.drivers.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'drivers'] });
      message.success('Chauffeur mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteTransportDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportAPI.drivers.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'drivers'] });
      message.success('Chauffeur supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useDriverIdCard(id: string) {
  return useQuery({
    queryKey: ['transport', 'driver-card', id],
    queryFn: () => transportAPI.drivers.idCard(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useTransportLines(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['transport', 'lines', params],
    queryFn: () => transportAPI.lines.list(params).then((r) => r.data),
  });
}

export function useTransportLine(id: string) {
  return useQuery({
    queryKey: ['transport', 'line', id],
    queryFn: () => transportAPI.lines.get(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateTransportLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => transportAPI.lines.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'lines'] });
      message.success('Ligne créée');
    },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useUpdateTransportLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      transportAPI.lines.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'lines'] });
      message.success('Ligne mise à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteTransportLine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportAPI.lines.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'lines'] });
      message.success('Ligne supprimée');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useTransportStops(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['transport', 'stops', params],
    queryFn: () => transportAPI.stops.list(params).then((r) => r.data),
  });
}

export function useCreateTransportStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => transportAPI.stops.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'stops'] });
      qc.invalidateQueries({ queryKey: ['transport', 'lines'] });
      message.success('Arrêt ajouté');
    },
    onError: () => message.error("Erreur lors de l'ajout"),
  });
}

export function useUpdateTransportStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      transportAPI.stops.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'stops'] });
      message.success('Arrêt mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteTransportStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportAPI.stops.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'stops'] });
      qc.invalidateQueries({ queryKey: ['transport', 'lines'] });
      message.success('Arrêt supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useStudentTransports(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['transport', 'students', params],
    queryFn: () => transportAPI.students.list(params).then((r) => r.data),
  });
}

export function useCreateStudentTransport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => transportAPI.students.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'students'] });
      qc.invalidateQueries({ queryKey: ['transport', 'lines'] });
      message.success('Élève affecté');
    },
    onError: () => message.error("Erreur lors de l'affectation"),
  });
}

export function useUpdateStudentTransport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      transportAPI.students.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'students'] });
      message.success('Affectation mise à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteStudentTransport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transportAPI.students.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'students'] });
      qc.invalidateQueries({ queryKey: ['transport', 'lines'] });
      message.success('Affectation supprimée');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useTransportTrips(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['transport', 'trips', params],
    queryFn: () => transportAPI.trips.list(params).then((r) => r.data),
  });
}

export function useCreateTransportTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => transportAPI.trips.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transport', 'trips'] });
      message.success('Trajet enregistré');
    },
    onError: () => message.error("Erreur lors de l'enregistrement"),
  });
}

export function useTransportReport(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['transport', 'report', params],
    queryFn: () => transportAPI.reports.performance(params).then((r) => r.data),
  });
}

export function useNotifyDelay() {
  return useMutation({
    mutationFn: ({ lineId, data }: { lineId: string; data: { delay_minutes: number; message?: string } }) =>
      transportAPI.notify.delay(lineId, data),
    onSuccess: () => message.success('Notification de retard envoyée'),
    onError: () => message.error("Erreur lors de l'envoi"),
  });
}

export function useNotifyArrival() {
  return useMutation({
    mutationFn: (lineId: string) => transportAPI.notify.arrival(lineId),
    onSuccess: () => message.success('Notification d\'arrivée envoyée'),
    onError: () => message.error("Erreur lors de l'envoi"),
  });
}

/* ═══════════════════════════════════════════════════════════════════════
   LIBRARY / BIBLIOTHÈQUE
   ═══════════════════════════════════════════════════════════════════════ */

export function useBooks(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['library', 'books', params],
    queryFn: () => libraryAPI.books.list(params).then(r => r.data),
  });
}

export function useBook(id?: string) {
  return useQuery({
    queryKey: ['library', 'books', id],
    queryFn: () => libraryAPI.books.get(id!).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => libraryAPI.books.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      message.success('Livre ajouté');
    },
    onError: () => message.error("Erreur lors de l'ajout du livre"),
  });
}

export function useUpdateBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      libraryAPI.books.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      message.success('Livre mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryAPI.books.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      message.success('Livre supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useBookCopies(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['library', 'copies', params],
    queryFn: () => libraryAPI.copies.list(params).then(r => r.data),
  });
}

export function useCreateBookCopy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => libraryAPI.copies.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'copies'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      message.success('Exemplaire ajouté');
    },
    onError: () => message.error("Erreur lors de l'ajout de l'exemplaire"),
  });
}

export function useUpdateBookCopy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      libraryAPI.copies.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'copies'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      message.success('Exemplaire mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteBookCopy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryAPI.copies.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'copies'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      message.success('Exemplaire supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useLoans(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['library', 'loans', params],
    queryFn: () => libraryAPI.loans.list(params).then(r => r.data),
  });
}

export function useLoan(id?: string) {
  return useQuery({
    queryKey: ['library', 'loans', id],
    queryFn: () => libraryAPI.loans.get(id!).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => libraryAPI.loans.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'loans'] });
      qc.invalidateQueries({ queryKey: ['library', 'copies'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      message.success('Emprunt enregistré');
    },
    onError: () => message.error("Erreur lors de l'enregistrement de l'emprunt"),
  });
}

export function useReturnLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryAPI.loans.return(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'loans'] });
      qc.invalidateQueries({ queryKey: ['library', 'copies'] });
      qc.invalidateQueries({ queryKey: ['library', 'books'] });
      qc.invalidateQueries({ queryKey: ['library', 'reservations'] });
      message.success('Retour enregistré');
    },
    onError: () => message.error("Erreur lors du retour"),
  });
}

export function useRenewLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryAPI.loans.renew(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'loans'] });
      message.success('Emprunt renouvelé');
    },
    onError: () => message.error('Erreur lors du renouvellement'),
  });
}

export function useMyLoans() {
  return useQuery({
    queryKey: ['library', 'my-loans'],
    queryFn: () => libraryAPI.loans.myLoans().then(r => r.data),
  });
}

export function useReservations(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['library', 'reservations', params],
    queryFn: () => libraryAPI.reservations.list(params).then(r => r.data),
  });
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => libraryAPI.reservations.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'reservations'] });
      message.success('Réservation effectuée');
    },
    onError: () => message.error('Erreur lors de la réservation'),
  });
}

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryAPI.reservations.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'reservations'] });
      message.success('Réservation annulée');
    },
    onError: () => message.error("Erreur lors de l'annulation"),
  });
}

export function useLibraryRequests(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['library', 'requests', params],
    queryFn: () => libraryAPI.requests.list(params).then(r => r.data),
  });
}

export function useLibraryRequest(id?: string) {
  return useQuery({
    queryKey: ['library', 'requests', id],
    queryFn: () => libraryAPI.requests.get(id!).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateLibraryRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => libraryAPI.requests.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'requests'] });
      message.success('Demande envoyée');
    },
    onError: () => message.error("Erreur lors de l'envoi de la demande"),
  });
}

export function useResolveLibraryRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { action: string; admin_response?: string } }) =>
      libraryAPI.requests.resolve(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library', 'requests'] });
      message.success('Demande traitée');
    },
    onError: () => message.error('Erreur lors du traitement'),
  });
}

export function useLibraryUsageReport(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['library', 'usage-report', params],
    queryFn: () => libraryAPI.usageReport(params).then(r => r.data),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// E-Learning Hooks
// ═══════════════════════════════════════════════════════════════════════

// ── Digital Resources ──

export function useElearningResources(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['elearning', 'resources', params],
    queryFn: () => elearningAPI.resources.list(params).then(r => r.data),
  });
}

export function useElearningResource(id: string) {
  return useQuery({
    queryKey: ['elearning', 'resources', id],
    queryFn: () => elearningAPI.resources.get(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateElearningResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => elearningAPI.resources.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'resources'] });
      message.success('Ressource ajoutée');
    },
    onError: () => message.error("Erreur lors de l'ajout de la ressource"),
  });
}

export function useUpdateElearningResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      elearningAPI.resources.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'resources'] });
      message.success('Ressource mise à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteElearningResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => elearningAPI.resources.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'resources'] });
      message.success('Ressource supprimée');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useToggleFavouriteResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => elearningAPI.resources.favourite(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'resources'] });
    },
  });
}

export function useTrackResourceDownload() {
  return useMutation({
    mutationFn: (id: string) => elearningAPI.resources.download(id),
  });
}

// ── Exam Bank ──

export function useExamBankItems(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['elearning', 'exams', params],
    queryFn: () => elearningAPI.exams.list(params).then(r => r.data),
  });
}

export function useExamBankItem(id: string) {
  return useQuery({
    queryKey: ['elearning', 'exams', id],
    queryFn: () => elearningAPI.exams.get(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateExamBankItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => elearningAPI.exams.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'exams'] });
      message.success('Examen ajouté');
    },
    onError: () => message.error("Erreur lors de l'ajout"),
  });
}

export function useUpdateExamBankItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) =>
      elearningAPI.exams.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'exams'] });
      message.success('Examen mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteExamBankItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => elearningAPI.exams.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'exams'] });
      message.success('Examen supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useTrackExamDownload() {
  return useMutation({
    mutationFn: (id: string) => elearningAPI.exams.download(id),
  });
}

// ── Quizzes ──

export function useQuizzes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['elearning', 'quizzes', params],
    queryFn: () => elearningAPI.quizzes.list(params).then(r => r.data),
  });
}

export function useQuiz(id: string) {
  return useQuery({
    queryKey: ['elearning', 'quizzes', id],
    queryFn: () => elearningAPI.quizzes.get(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => elearningAPI.quizzes.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'quizzes'] });
      message.success('Quiz créé');
    },
    onError: () => message.error('Erreur lors de la création du quiz'),
  });
}

export function useUpdateQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      elearningAPI.quizzes.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'quizzes'] });
      message.success('Quiz mis à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteQuiz() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => elearningAPI.quizzes.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['elearning', 'quizzes'] });
      message.success('Quiz supprimé');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useQuizQuestions(quizId: string) {
  return useQuery({
    queryKey: ['elearning', 'quizzes', quizId, 'questions'],
    queryFn: () => elearningAPI.quizzes.questions(quizId).then(r => r.data),
    enabled: !!quizId,
  });
}

export function useAddQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, data }: { quizId: string; data: Record<string, unknown> }) =>
      elearningAPI.quizzes.addQuestion(quizId, data),
    onSuccess: (_, { quizId }) => {
      qc.invalidateQueries({ queryKey: ['elearning', 'quizzes', quizId] });
      message.success('Question ajoutée');
    },
    onError: () => message.error("Erreur lors de l'ajout de la question"),
  });
}

export function useUpdateQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, questionId, data }: { quizId: string; questionId: string; data: Record<string, unknown> }) =>
      elearningAPI.quizzes.updateQuestion(quizId, questionId, data),
    onSuccess: (_, { quizId }) => {
      qc.invalidateQueries({ queryKey: ['elearning', 'quizzes', quizId] });
      message.success('Question mise à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteQuizQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ quizId, questionId }: { quizId: string; questionId: string }) =>
      elearningAPI.quizzes.deleteQuestion(quizId, questionId),
    onSuccess: (_, { quizId }) => {
      qc.invalidateQueries({ queryKey: ['elearning', 'quizzes', quizId] });
      message.success('Question supprimée');
    },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useQuizAttempts(quizId: string) {
  return useQuery({
    queryKey: ['elearning', 'quizzes', quizId, 'attempts'],
    queryFn: () => elearningAPI.quizzes.attempts(quizId).then(r => r.data),
    enabled: !!quizId,
  });
}

export function useMyQuizAttempts() {
  return useQuery({
    queryKey: ['elearning', 'my-attempts'],
    queryFn: () => elearningAPI.myAttempts().then(r => r.data),
  });
}

// ── Student Progress ──

export function useStudentProgressList(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['elearning', 'progress', params],
    queryFn: () => elearningAPI.progress.list(params).then(r => r.data),
  });
}

export function useStudentProgressDetail(id: string) {
  return useQuery({
    queryKey: ['elearning', 'progress', id],
    queryFn: () => elearningAPI.progress.get(id).then(r => r.data),
    enabled: !!id,
  });
}

// ── Analytics ──

export function useElearningAnalytics(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['elearning', 'analytics', params],
    queryFn: () => elearningAPI.analytics(params).then(r => r.data),
  });
}

// ==========================================================================
// SMS
// ==========================================================================

export function useSMSConfig() {
  return useQuery({
    queryKey: ['sms', 'config'],
    queryFn: () => smsAPI.config.get().then(r => r.data),
    retry: false,
  });
}

export function useUpdateSMSConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => smsAPI.config.update(data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sms'] }); message.success('Configuration SMS mise à jour'); },
    onError: () => message.error('Erreur configuration SMS'),
  });
}

export function useSMSBalance() {
  return useQuery({
    queryKey: ['sms', 'balance'],
    queryFn: () => smsAPI.balance().then(r => r.data),
  });
}

export function useSendSMS() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { phone: string; message: string; template_id?: string; template_context?: Record<string, string> }) =>
      smsAPI.send(data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sms'] }); message.success('SMS envoyé'); },
    onError: () => message.error("Erreur d'envoi SMS"),
  });
}

export function useSMSHistory(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['sms', 'history', params],
    queryFn: () => smsAPI.history(params).then(r => r.data),
  });
}

export function useSMSTemplates(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['sms', 'templates', params],
    queryFn: () => smsAPI.templates.list(params).then(r => r.data),
  });
}

export function useCreateSMSTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => smsAPI.templates.create(data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sms', 'templates'] }); message.success('Template créé'); },
    onError: () => message.error('Erreur création template'),
  });
}

export function useUpdateSMSTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      smsAPI.templates.update(id, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sms', 'templates'] }); message.success('Template mis à jour'); },
    onError: () => message.error('Erreur mise à jour template'),
  });
}

export function useDeleteSMSTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => smsAPI.templates.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sms', 'templates'] }); message.success('Template supprimé'); },
    onError: () => message.error('Erreur suppression template'),
  });
}

export function useSMSCampaigns(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['sms', 'campaigns', params],
    queryFn: () => smsAPI.campaigns.list(params).then(r => r.data),
  });
}

export function useSMSCampaign(id: string) {
  return useQuery({
    queryKey: ['sms', 'campaigns', id],
    queryFn: () => smsAPI.campaigns.get(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateSMSCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => smsAPI.campaigns.create(data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sms'] }); message.success('Campagne créée'); },
    onError: () => message.error('Erreur création campagne'),
  });
}

export function useDeleteSMSCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => smsAPI.campaigns.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sms', 'campaigns'] }); message.success('Campagne annulée'); },
    onError: () => message.error('Erreur annulation campagne'),
  });
}

export function useSMSAnalytics() {
  return useQuery({
    queryKey: ['sms', 'analytics'],
    queryFn: () => smsAPI.analytics().then(r => r.data),
  });
}

// ==========================================================================
// Notifications (extended)
// ==========================================================================

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => notificationsExtAPI.preferences.get().then(r => r.data),
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => notificationsExtAPI.preferences.update(data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications', 'preferences'] }); message.success('Préférences mises à jour'); },
    onError: () => message.error('Erreur mise à jour préférences'),
  });
}

export function useNotificationStats() {
  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: () => notificationsExtAPI.stats().then(r => r.data),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsExtAPI.markAllRead().then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); message.success('Toutes les notifications marquées comme lues'); },
  });
}

// ==========================================================================
// Fingerprint / Biometric
// ==========================================================================

export function useFingerprintDashboard() {
  return useQuery({
    queryKey: ['fingerprint', 'dashboard'],
    queryFn: () => fingerprintAPI.dashboard().then(r => r.data),
  });
}

export function useFingerprintDevices() {
  return useQuery({
    queryKey: ['fingerprint', 'devices'],
    queryFn: () => fingerprintAPI.devices.list().then(r => r.data),
  });
}

export function useCreateFingerprintDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => fingerprintAPI.devices.create(data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fingerprint'] }); message.success('Appareil ajouté'); },
    onError: () => message.error("Erreur ajout appareil"),
  });
}

export function useUpdateFingerprintDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      fingerprintAPI.devices.update(id, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fingerprint'] }); message.success('Appareil mis à jour'); },
    onError: () => message.error('Erreur mise à jour appareil'),
  });
}

export function useDeleteFingerprintDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fingerprintAPI.devices.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fingerprint'] }); message.success('Appareil supprimé'); },
    onError: () => message.error('Erreur suppression appareil'),
  });
}

export function useFingerprintEnroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { student_id: string; finger_index: number; captures: string[]; quality_scores?: number[]; device_id?: string }) =>
      fingerprintAPI.enroll(data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fingerprint'] }); message.success('Empreinte enregistrée'); },
    onError: () => message.error("Erreur d'enregistrement"),
  });
}

export function useFingerprintVerify() {
  return useMutation({
    mutationFn: (data: { template: string; device_id?: string }) =>
      fingerprintAPI.verify(data).then(r => r.data),
  });
}

export function useManualFallback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { student_id: string; event_type: string; timestamp?: string }) =>
      fingerprintAPI.manualFallback(data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fingerprint'] }); message.success('Présence manuelle enregistrée'); },
    onError: () => message.error('Erreur enregistrement manuel'),
  });
}

export function useEnrolledStudents(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['fingerprint', 'enrolled', params],
    queryFn: () => fingerprintAPI.enrolledStudents(params).then(r => r.data),
  });
}

export function useBiometricLogs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['fingerprint', 'logs', params],
    queryFn: () => fingerprintAPI.logs(params).then(r => r.data),
  });
}

export function useTardinessReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['fingerprint', 'tardiness', params],
    queryFn: () => fingerprintAPI.tardinessReport(params).then(r => r.data),
  });
}

export function useFingerprintDiagnostics() {
  return useQuery({
    queryKey: ['fingerprint', 'diagnostics'],
    queryFn: () => fingerprintAPI.diagnostics().then(r => r.data),
    enabled: false,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// DISCIPLINE
// ═══════════════════════════════════════════════════════════════════════

export function useIncidents(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['discipline', 'incidents', params],
    queryFn: () => disciplineAPI.incidents.list(params).then(r => r.data),
  });
}

export function useIncident(id?: string) {
  return useQuery({
    queryKey: ['discipline', 'incidents', id],
    queryFn: () => disciplineAPI.incidents.get(id!).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => disciplineAPI.incidents.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discipline'] }); message.success('Incident signalé'); },
    onError: () => message.error("Erreur lors du signalement"),
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => disciplineAPI.incidents.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discipline'] }); message.success('Incident mis à jour'); },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disciplineAPI.incidents.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discipline'] }); message.success('Incident supprimé'); },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useIncidentWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, resolution_note }: { id: string; action: string; resolution_note?: string }) =>
      disciplineAPI.incidents.workflow(id, { action, resolution_note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discipline'] }); message.success('Action effectuée'); },
    onError: () => message.error("Erreur lors de l'action"),
  });
}

export function useSanctions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['discipline', 'sanctions', params],
    queryFn: () => disciplineAPI.sanctions.list(params).then(r => r.data),
  });
}

export function useCreateSanction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => disciplineAPI.sanctions.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discipline'] }); message.success('Sanction ajoutée'); },
    onError: () => message.error("Erreur lors de l'ajout de la sanction"),
  });
}

export function useBehaviorReports(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['discipline', 'behavior-reports', params],
    queryFn: () => disciplineAPI.behaviorReports.list(params).then(r => r.data),
  });
}

export function useCreateBehaviorReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => disciplineAPI.behaviorReports.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discipline'] }); message.success('Rapport ajouté'); },
    onError: () => message.error("Erreur lors de l'ajout du rapport"),
  });
}

export function useWarningThresholds(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['discipline', 'warning-thresholds', params],
    queryFn: () => disciplineAPI.warningThresholds.list(params).then(r => r.data),
  });
}

export function useUpdateWarningThreshold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => disciplineAPI.warningThresholds.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discipline'] }); message.success('Seuil mis à jour'); },
    onError: () => message.error('Erreur'),
  });
}

export function useDisciplineStats(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['discipline', 'stats', params],
    queryFn: () => disciplineAPI.stats(params).then(r => r.data),
  });
}

export function useWarningCounter(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['discipline', 'warnings', params],
    queryFn: () => disciplineAPI.warnings(params).then(r => r.data),
  });
}

export function useClassComparison(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['discipline', 'class-comparison', params],
    queryFn: () => disciplineAPI.classComparison(params).then(r => r.data),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// STAFF MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

export function useStaffMembers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['staff', 'members', params],
    queryFn: () => staffAPI.members.list(params).then(r => r.data),
  });
}

export function useStaffMember(id?: string) {
  return useQuery({
    queryKey: ['staff', 'members', id],
    queryFn: () => staffAPI.members.get(id!).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateStaffMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => staffAPI.members.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); message.success('Personnel ajouté'); },
    onError: () => message.error("Erreur lors de l'ajout"),
  });
}

export function useUpdateStaffMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => staffAPI.members.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); message.success('Personnel mis à jour'); },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteStaffMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffAPI.members.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff'] }); message.success('Personnel supprimé'); },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useStaffDocuments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['staff', 'documents', params],
    queryFn: () => staffAPI.documents.list(params).then(r => r.data),
  });
}

export function useUploadStaffDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => staffAPI.documents.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff', 'documents'] }); message.success('Document uploadé'); },
    onError: () => message.error("Erreur lors de l'upload"),
  });
}

export function useDeleteStaffDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffAPI.documents.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff', 'documents'] }); message.success('Document supprimé'); },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

export function useStaffAttendance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['staff', 'attendance', params],
    queryFn: () => staffAPI.attendance.list(params).then(r => r.data),
  });
}

export function useCreateStaffAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => staffAPI.attendance.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff', 'attendance'] }); message.success('Pointage enregistré'); },
    onError: () => message.error("Erreur lors de l'enregistrement"),
  });
}

export function useStaffLeaves(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['staff', 'leaves', params],
    queryFn: () => staffAPI.leaves.list(params).then(r => r.data),
  });
}

export function useCreateStaffLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => staffAPI.leaves.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff', 'leaves'] }); message.success('Demande de congé soumise'); },
    onError: () => message.error('Erreur lors de la soumission'),
  });
}

export function useApproveStaffLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffAPI.leaves.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff', 'leaves'] }); message.success('Congé approuvé'); },
    onError: () => message.error("Erreur lors de l'approbation"),
  });
}

export function useRejectStaffLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffAPI.leaves.reject(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['staff', 'leaves'] }); message.success('Congé rejeté'); },
    onError: () => message.error('Erreur lors du rejet'),
  });
}

export function useStaffStats() {
  return useQuery({
    queryKey: ['staff', 'stats'],
    queryFn: () => staffAPI.stats().then(r => r.data),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// REPORT CARD TEMPLATES (Prompt V)
// ═══════════════════════════════════════════════════════════════════════

export function useReportCardTemplates(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reportCardTemplates', params],
    queryFn: () => gradesAPI.reportCardTemplates(params).then(r => r.data),
  });
}

export function useCreateReportCardTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.createReportCardTemplate(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reportCardTemplates'] }); message.success('Modèle de bulletin créé'); },
    onError: () => message.error('Erreur lors de la création du modèle'),
  });
}

export function useUpdateReportCardTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      gradesAPI.updateReportCardTemplate(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reportCardTemplates'] }); message.success('Modèle mis à jour'); },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteReportCardTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gradesAPI.deleteReportCardTemplate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reportCardTemplates'] }); message.success('Modèle supprimé'); },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// REPORT CARD GENERATION (Prompt V)
// ═══════════════════════════════════════════════════════════════════════

export function useGenerateClassReportCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.generateClassReportCards(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reportCards'] }); message.success('Génération des bulletins lancée'); },
    onError: () => message.error('Erreur lors de la génération'),
  });
}

export function useGenerateSchoolReportCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => gradesAPI.generateSchoolReportCards(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['reportCards'] }); message.success('Génération école lancée'); },
    onError: () => message.error('Erreur lors de la génération'),
  });
}

export function useReportCardProgress(taskId: string | null) {
  return useQuery({
    queryKey: ['reportCardProgress', taskId],
    queryFn: () => gradesAPI.reportCardProgress(taskId!).then(r => r.data),
    enabled: !!taskId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 2000;
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════
// GRADE ANALYTICS & MEN EXPORT (Prompt V)
// ═══════════════════════════════════════════════════════════════════════

export function useGradeAnalytics(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['gradeAnalytics', params],
    queryFn: () => gradesAPI.gradeAnalytics(params).then(r => r.data),
    staleTime: 120_000,
  });
}

export function useMENExport() {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) => gradesAPI.menExport(params),
    onSuccess: (res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'export_men.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Export MEN téléchargé');
    },
    onError: () => message.error("Erreur lors de l'export MEN"),
  });
}

// ═══════════════════════════════════════════════════════════════════════
// ATTENDANCE REPORTS (Prompt V)
// ═══════════════════════════════════════════════════════════════════════

export function useMonthlyAttendanceReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['attendance', 'monthlyReport', params],
    queryFn: () => attendanceAPI.monthlyReport(params).then(r => r.data),
    enabled: !!params?.class_id,
  });
}

export function useAttendanceCalendar(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['attendance', 'calendar', params],
    queryFn: () => attendanceAPI.calendarReport(params).then(r => r.data),
    enabled: !!params?.student_id,
  });
}

export function useAnnualAttendanceReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['attendance', 'annualReport', params],
    queryFn: () => attendanceAPI.annualReport(params).then(r => r.data),
    enabled: !!params?.class_id,
  });
}

export function useAttendanceRanking(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['attendance', 'ranking', params],
    queryFn: () => attendanceAPI.ranking(params).then(r => r.data),
  });
}

export function useAttendanceExcelExport() {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) => attendanceAPI.excelExport(params),
    onSuccess: (res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rapport_presence.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      message.success('Export Excel téléchargé');
    },
    onError: () => message.error("Erreur lors de l'export"),
  });
}
