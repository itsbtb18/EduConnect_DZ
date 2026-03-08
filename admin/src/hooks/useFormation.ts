/**
 * Formation (Training Center) — React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { formationAPI } from '../api/formationService';
import { useSchoolProfile } from './useApi';

/* ═══════════════════ Helpers ═══════════════════ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extract(res: { data: any }) {
  const d = res.data;
  if (Array.isArray(d)) return { results: d, count: d.length };
  if (d && typeof d === 'object' && 'results' in d) return d;
  return d;
}

/* ═══════════════════ Dashboard ═══════════════════ */
export function useFormationDashboard() {
  return useQuery({
    queryKey: ['formation', 'dashboard'],
    queryFn: () => formationAPI.dashboard().then(r => r.data),
    staleTime: 30_000,
  });
}

export function useFormationFinanceStats() {
  return useQuery({
    queryKey: ['formation', 'finance', 'stats'],
    queryFn: () => formationAPI.finance.stats().then(r => r.data),
    staleTime: 30_000,
  });
}

/* ═══════════════════ Departments ═══════════════════ */
export function useDepartments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'departments', params],
    queryFn: () => formationAPI.departments.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: ['formation', 'departments', id],
    queryFn: () => formationAPI.departments.get(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.departments.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'departments'] }); message.success('Département créé'); },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => formationAPI.departments.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'departments'] }); message.success('Département mis à jour'); },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formationAPI.departments.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'departments'] }); message.success('Département supprimé'); },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

/* ═══════════════════ Formations ═══════════════════ */
export function useFormations(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'formations', params],
    queryFn: () => formationAPI.formations.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useFormation(id: string) {
  return useQuery({
    queryKey: ['formation', 'formations', id],
    queryFn: () => formationAPI.formations.get(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.formations.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'formations'] }); message.success('Formation créée'); },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useUpdateFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => formationAPI.formations.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'formations'] }); message.success('Formation mise à jour'); },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteFormation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formationAPI.formations.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'formations'] }); message.success('Formation supprimée'); },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

/* ═══════════════════ Groups ═══════════════════ */
export function useTrainingGroups(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'groups', params],
    queryFn: () => formationAPI.groups.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useTrainingGroup(id: string) {
  return useQuery({
    queryKey: ['formation', 'groups', id],
    queryFn: () => formationAPI.groups.get(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.groups.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'groups'] }); message.success('Groupe créé'); },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useUpdateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => formationAPI.groups.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'groups'] }); message.success('Groupe mis à jour'); },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formationAPI.groups.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'groups'] }); message.success('Groupe supprimé'); },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

/* ═══════════════════ Enrollments ═══════════════════ */
export function useEnrollments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'enrollments', params],
    queryFn: () => formationAPI.enrollments.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.enrollments.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formation', 'enrollments'] });
      qc.invalidateQueries({ queryKey: ['formation', 'groups'] });
      message.success('Inscription créée');
    },
    onError: () => message.error('Erreur lors de l\'inscription'),
  });
}

export function useUpdateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => formationAPI.enrollments.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formation', 'enrollments'] });
      qc.invalidateQueries({ queryKey: ['formation', 'groups'] });
      message.success('Inscription mise à jour');
    },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

/* ═══════════════════ Placement Tests ═══════════════════ */
export function usePlacementTests(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'placement-tests', params],
    queryFn: () => formationAPI.placementTests.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useCreatePlacementTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.placementTests.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'placement-tests'] }); message.success('Test de placement créé'); },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useValidatePlacementTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formationAPI.placementTests.validate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'placement-tests'] }); message.success('Test validé'); },
    onError: () => message.error('Erreur de validation'),
  });
}

/* ═══════════════════ Sessions ═══════════════════ */
export function useTrainingSessions(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'sessions', params],
    queryFn: () => formationAPI.sessions.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.sessions.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'sessions'] }); message.success('Séance créée'); },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => formationAPI.sessions.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'sessions'] }); message.success('Séance mise à jour'); },
    onError: () => message.error('Erreur lors de la mise à jour'),
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => formationAPI.sessions.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'sessions'] }); message.success('Séance supprimée'); },
    onError: () => message.error('Erreur lors de la suppression'),
  });
}

/* ═══════════════════ Attendance ═══════════════════ */
export function useSessionAttendance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'attendance', params],
    queryFn: () => formationAPI.attendance.list(params).then(extract),
    staleTime: 30_000,
    enabled: !!params?.session,
  });
}

export function useBulkMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.attendance.bulkMark(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'attendance'] }); message.success('Présence enregistrée'); },
    onError: () => message.error('Erreur lors de l\'enregistrement'),
  });
}

/* ═══════════════════ Level Passages ═══════════════════ */
export function useLevelPassages(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'level-passages', params],
    queryFn: () => formationAPI.levelPassages.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useCreateLevelPassage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.levelPassages.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'level-passages'] }); message.success('Passage de niveau créé'); },
    onError: () => message.error('Erreur lors de la création'),
  });
}

export function useDecideLevelPassage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => formationAPI.levelPassages.decide(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'level-passages'] }); message.success('Décision enregistrée'); },
    onError: () => message.error('Erreur'),
  });
}

/* ═══════════════════ Certificates ═══════════════════ */
export function useCertificates(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'certificates', params],
    queryFn: () => formationAPI.certificates.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useCreateCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.certificates.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'certificates'] }); message.success('Certificat généré'); },
    onError: () => message.error('Erreur lors de la génération'),
  });
}

/* ═══════════════════ Schedule Conflicts ═══════════════════ */
export function useCheckScheduleConflicts() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.checkConflicts(data).then(r => r.data),
  });
}

/* ═══════════════════ Finance ═══════════════════ */
export function useFeeStructures(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'fee-structures', params],
    queryFn: () => formationAPI.finance.feeStructures.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.finance.feeStructures.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'fee-structures'] }); message.success('Tarification créée'); },
    onError: () => message.error('Erreur'),
  });
}

export function useLearnerPayments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'payments', params],
    queryFn: () => formationAPI.finance.payments.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useCreateLearnerPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.finance.payments.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['formation', 'payments'] });
      qc.invalidateQueries({ queryKey: ['formation', 'finance'] });
      message.success('Paiement enregistré');
    },
    onError: () => message.error('Erreur'),
  });
}

export function useDiscounts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'discounts', params],
    queryFn: () => formationAPI.finance.discounts.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useCreateDiscount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.finance.discounts.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'discounts'] }); message.success('Remise créée'); },
    onError: () => message.error('Erreur'),
  });
}

/* ═══════════════════ Payroll ═══════════════════ */
export function useTrainerSalaryConfigs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'salary-configs', params],
    queryFn: () => formationAPI.payroll.salaryConfigs.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useCreateSalaryConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.payroll.salaryConfigs.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'salary-configs'] }); message.success('Configuration salariale créée'); },
    onError: () => message.error('Erreur'),
  });
}

export function usePayslips(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['formation', 'payslips', params],
    queryFn: () => formationAPI.payroll.payslips.list(params).then(extract),
    staleTime: 30_000,
  });
}

export function useGeneratePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => formationAPI.payroll.payslips.generate(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['formation', 'payslips'] }); message.success('Fiche de paie générée'); },
    onError: () => message.error('Erreur lors de la génération'),
  });
}

/* ═══════════════════ Utility Hook ═══════════════════ */
export function useIsTrainingCenter() {
  const { data: school } = useSchoolProfile();
  return (school as { school_category?: string } | undefined)?.school_category === 'TRAINING_CENTER';
}
