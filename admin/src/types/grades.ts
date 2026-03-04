/* ══════════════════════════════════════════════════════════════════════
   ILMI — Grade Management System Types
   Matches backend Django serializers exactly
   ══════════════════════════════════════════════════════════════════════ */

// ─── ExamType ────────────────────────────────────────────────────────

export interface ExamType {
  id: string;
  subject: string;
  subject_name: string;
  classroom: string;
  classroom_name: string;
  academic_year: string;
  trimester: 1 | 2 | 3;
  name: string;
  percentage: number;   // serialized as string from Decimal, parse on use
  max_score: number;
  current_total_percentage: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExamTypeCreatePayload {
  subject: string;
  classroom: string;
  academic_year: string;
  trimester: number;
  name: string;
  percentage: number;
  max_score: number;
}

// ─── Grade ───────────────────────────────────────────────────────────

export interface GradeEntry {
  id: string;
  student: string;
  student_name: string;
  exam_type: string;
  exam_name: string;
  subject_name: string;
  score: number | null;
  max_score: number;
  effective_score: number;
  is_absent: boolean;
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  entered_by: string | null;
  entered_at: string;
  updated_at: string;
}

export interface GradeBulkItem {
  student_id: string;
  score: number | null;
  is_absent: boolean;
}

export interface GradeBulkEnterPayload {
  exam_type_id: string;
  grades: GradeBulkItem[];
}

export interface GradeCorrectPayload {
  new_score: number;
  reason: string;
}

export interface GradePublishPayload {
  exam_type_id: string;
}

// ─── SubjectAverage ──────────────────────────────────────────────────

export interface SubjectAverage {
  id: string;
  student: string;
  student_name: string;
  subject: string;
  subject_name: string;
  classroom: string;
  academic_year: string;
  trimester: number;
  calculated_average: number | null;
  manual_override: number | null;
  effective_average: number | null;
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  is_locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
  last_calculated_at: string | null;
}

export interface SubjectAverageRecalcPayload {
  classroom_id: string;
  subject_id: string;
  trimester: number;
}

export interface SubjectAverageOverridePayload {
  subject_average_id: string;
  new_value: number;
  reason: string;
}

export interface SubjectAveragePublishPayload {
  classroom_id: string;
  subject_id: string;
  trimester: number;
}

// ─── TrimesterAverage ────────────────────────────────────────────────

export interface TrimesterAverage {
  id: string;
  student: string;
  student_name: string;
  classroom: string;
  academic_year: string;
  trimester: number;
  calculated_average: number | null;
  manual_override: number | null;
  effective_average: number | null;
  rank_in_class: number | null;
  rank_in_stream: number | null;
  rank_in_level: number | null;
  rank_in_section: number | null;
  appreciation: string;
  is_published: boolean;
  published_at: string | null;
  published_by: string | null;
  is_locked: boolean;
  locked_at: string | null;
  locked_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrimesterRecalcPayload {
  classroom_id: string;
  trimester: number;
}

export interface TrimesterOverridePayload {
  trimester_average_id: string;
  new_value: number;
  reason: string;
}

export interface TrimesterPublishPayload {
  classroom_id: string;
  trimester: number;
}

export interface TrimesterLockPayload {
  classroom_id: string;
  trimester: number;
}

export interface TrimesterUnlockPayload {
  classroom_id: string;
  trimester: number;
  reason: string;
}

// ─── GradeAppeal ─────────────────────────────────────────────────────

export type AppealStatus = 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
export type AppealType = 'EXAM_GRADE' | 'SUBJECT_AVERAGE' | 'TRIMESTER_AVERAGE';

export interface GradeAppeal {
  id: string;
  student: string;
  student_name: string;
  appeal_type: AppealType;
  appeal_type_display: string;
  grade: string | null;
  subject_average: string | null;
  trimester_average: string | null;
  reason: string;
  student_comment: string;
  status: AppealStatus;
  status_display: string;
  assigned_to_teacher: string | null;
  assigned_teacher_name: string | null;
  assigned_to_admin: string | null;
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  original_value: number | null;
  corrected_value: number | null;
  created_at: string;
  updated_at: string;
}

export interface AppealCreatePayload {
  appeal_type: AppealType;
  grade_id?: string;
  subject_average_id?: string;
  trimester_average_id?: string;
  reason: string;
  student_comment?: string;
}

export interface AppealRespondPayload {
  status: 'ACCEPTED' | 'REJECTED';
  response: string;
  corrected_value?: number | null;
}

// ─── Filters ─────────────────────────────────────────────────────────

export interface GradeFilters {
  sectionId: string | null;
  levelId: string | null;
  classroomId: string | null;
  trimester: 1 | 2 | 3;
}

// ─── Component props ─────────────────────────────────────────────────

export interface StudentGradeRow {
  studentId: string;
  studentName: string;
  score: number | null;
  isAbsent: boolean;
  gradeId?: string;
  status?: string;
}

/** Pivot row for the Averages tab — one row per student, one column per subject */
export interface StudentAverageRow {
  studentId: string;
  studentName: string;
  subjectAverages: Record<string, SubjectAverage>;  // keyed by subject id
  trimesterAverage: TrimesterAverage | null;
}
