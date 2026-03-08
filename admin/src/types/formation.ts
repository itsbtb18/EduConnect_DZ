/**
 * Formation (Training Center) — TypeScript Types
 */

// ── Department ──
export interface Department {
  id: string;
  name: string;
  color: string;
  description?: string;
  head?: string;
  head_name?: string;
  is_active: boolean;
  formation_count?: number;
  created_at?: string;
}

// ── Formation / Program ──
export type Audience = 'CHILDREN' | 'TEENAGERS' | 'ADULTS' | 'MIXED';
export type BillingCycle = 'MONTHLY' | 'PER_SESSION' | 'PER_MODULE' | 'HOURLY' | 'FIXED';
export type EntryEvaluationMode = 'PLACEMENT_TEST' | 'INTERVIEW' | 'SELF_ASSESSMENT' | 'NONE';

export interface Formation {
  id: string;
  name: string;
  department: string;
  department_name?: string;
  audience: Audience;
  total_duration_hours: number;
  prerequisites?: string;
  entry_evaluation_mode: EntryEvaluationMode;
  levels: string[];  // e.g. ["A1","A2","B1","B2"]
  fee_amount: number;
  billing_cycle: BillingCycle;
  registration_fee: number;
  group_duration_weeks?: number;
  max_learners_per_group: number;
  materials_provided?: string;
  group_count?: number;
  active_learners?: number;
  is_active?: boolean;
  created_at?: string;
}

// ── Training Group ──
export type GroupStatus = 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface TrainingGroup {
  id: string;
  name: string;
  formation: string;
  formation_name?: string;
  trainer: string;
  trainer_name?: string;
  level: string;
  room?: string;
  room_name?: string;
  capacity: number;
  start_date: string;
  end_date?: string;
  sessions_per_week: number;
  status: GroupStatus;
  enrolled_count?: number;
  is_full?: boolean;
  created_at?: string;
}

// ── Enrollment ──
export type EnrollmentStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_PAYMENT' | 'COMPLETED' | 'DROPPED' | 'WAITLIST';

export interface TrainingEnrollment {
  id: string;
  learner: string;
  learner_name?: string;
  group: string;
  group_name?: string;
  formation_name?: string;
  enrollment_date: string;
  status: EnrollmentStatus;
  created_at?: string;
}

// ── Placement Test ──
export interface PlacementTest {
  id: string;
  learner: string;
  learner_name?: string;
  formation: string;
  formation_name?: string;
  test_date: string;
  score: number;
  max_score: number;
  suggested_level: string;
  validated_by?: string;
  is_validated: boolean;
  created_at?: string;
}

// ── Training Session ──
export type SessionStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'MAKEUP';

export interface TrainingSession {
  id: string;
  group: string;
  group_name?: string;
  date: string;
  start_time: string;
  end_time: string;
  room?: string;
  room_name?: string;
  trainer?: string;
  trainer_name?: string;
  status: SessionStatus;
  cancellation_reason?: string;
  topic?: string;
  created_at?: string;
}

// ── Session Attendance ──
export type SessionAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface SessionAttendance {
  id: string;
  session: string;
  learner: string;
  learner_name?: string;
  status: SessionAttendanceStatus;
  note?: string;
}

// ── Level Passage ──
export type PassageDecision = 'PROMOTED' | 'MAINTAINED' | 'PENDING';

export interface LevelPassage {
  id: string;
  learner: string;
  learner_name?: string;
  formation: string;
  formation_name?: string;
  from_level: string;
  to_level: string;
  min_attendance_pct: number;
  min_grade: number;
  actual_attendance_pct?: number;
  actual_grade?: number;
  decision: PassageDecision;
  decided_by?: string;
  decision_date?: string;
  certificate_generated: boolean;
  created_at?: string;
}

// ── Certificate ──
export type CertificateType = 'ATTENDANCE' | 'COMPLETION' | 'LEVEL';

export interface Certificate {
  id: string;
  learner: string;
  learner_name?: string;
  formation: string;
  formation_name?: string;
  certificate_type: CertificateType;
  level_achieved?: string;
  reference_number: string;
  issue_date: string;
  content?: string;
  pdf_file?: string;
  issued_by?: string;
  created_at?: string;
}

// ── Finance ──
export interface FormationFeeStructure {
  id: string;
  formation: string;
  formation_name?: string;
  name: string;
  amount: number;
  billing_cycle: BillingCycle;
  registration_fee: number;
  is_active: boolean;
  created_at?: string;
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING' | 'REFUNDED';

export interface LearnerPayment {
  id: string;
  learner: string;
  learner_name?: string;
  fee_structure?: string;
  group: string;
  group_name?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  status: PaymentStatus;
  is_registration_fee: boolean;
  created_at?: string;
}

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface Discount {
  id: string;
  name: string;
  discount_type: DiscountType;
  value: number;
  applicable_formations?: string[];
  conditions?: string;
  is_active: boolean;
  valid_from?: string;
  valid_until?: string;
  created_at?: string;
}

export interface LearnerDiscount {
  id: string;
  learner: string;
  learner_name?: string;
  discount: string;
  discount_name?: string;
  group: string;
  applied_amount: number;
  created_at?: string;
}

// ── Trainer Payroll ──
export type ContractType = 'PERMANENT' | 'VACATAIRE' | 'CONTRACT';

export interface TrainerSalaryConfig {
  id: string;
  trainer: string;
  trainer_name?: string;
  contract_type: ContractType;
  base_salary: number;
  hourly_rate: number;
  bank_account?: string;
  hire_date?: string;
  created_at?: string;
}

export type PayslipStatus = 'DRAFT' | 'VALIDATED' | 'PAID';

export interface TrainerPaySlip {
  id: string;
  trainer: string;
  trainer_name?: string;
  month: number;
  year: number;
  total_hours: number;
  hourly_rate: number;
  hours_amount: number;
  base_salary: number;
  gross_salary: number;
  deductions_detail?: Record<string, number>;
  total_deductions: number;
  net_salary: number;
  reference: string;
  status: PayslipStatus;
  created_at?: string;
}

// ── Dashboard ──
export interface FormationDashboardStats {
  department_count: number;
  formation_count: number;
  active_groups: number;
  active_learners: number;
  monthly_revenue: number;
  upcoming_sessions: number;
}

export interface FormationFinanceStats {
  revenue_by_month: { month: string; amount: number }[];
  payroll_cost: number;
  revenue_by_formation: { formation: string; amount: number }[];
  pending_enrollments: number;
}

// ── Schedule Conflict ──
export interface ScheduleConflictResult {
  has_conflicts: boolean;
  conflicts: {
    type: string;
    message: string;
    institution?: string;
  }[];
}

// ── Wizard types ──
export interface CenterRoomEntry {
  name: string;
  capacity: number;
}

export interface CenterDepartmentEntry {
  name: string;
  color: string;
  description?: string;
}

export interface CenterFormationEntry {
  name: string;
  department_index: number;
  audience: Audience;
  total_duration_hours: number;
  prerequisites?: string;
  entry_evaluation_mode: EntryEvaluationMode;
  levels: string[];
  fee_amount: number;
  billing_cycle: BillingCycle;
  registration_fee: number;
  max_learners_per_group: number;
}

export interface CenterTimeSlotEntry {
  label: string;
  start: string;
  end: string;
}

export interface CenterFinanceConfig {
  payment_methods: string[];
  registration_policy: string;
  refund_policy: string;
  reminder_days: number;
  tva_rate: number;
}

export interface CenterTrainerImportEntry {
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  specialization?: string;
  contract_type: ContractType;
  hourly_rate?: number;
}

export interface CenterLearnerImportEntry {
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  residence?: string;
  parent_phone?: string;
  declared_level?: string;
  objective?: string;
}

export interface CenterSetupWizardState {
  currentStep: number;
  general: {
    name: string;
    address: string;
    logo?: File | string;
    capacity: number;
    rooms: CenterRoomEntry[];
    opening_hours: { start: string; end: string };
    working_days: number[];
  };
  departments: CenterDepartmentEntry[];
  formations: CenterFormationEntry[];
  timeSlots: CenterTimeSlotEntry[];
  finance: CenterFinanceConfig;
  trainers: CenterTrainerImportEntry[];
  learners: CenterLearnerImportEntry[];
}
