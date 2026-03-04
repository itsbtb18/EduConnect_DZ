/* ══════════════════════════════════════════════════════════════════════
   ILMI — Student Full Profile Types
   Matches backend StudentFullProfileSerializer response exactly
   ══════════════════════════════════════════════════════════════════════ */

// ── Identity ──
export interface StudentIdentity {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone_number: string;
  email: string;
  photo: string | null;
  role: string;
  school_id: string | null;
  school_name: string | null;
  is_active: boolean;
  created_at: string | null;
  student_id: string;
  date_of_birth: string | null;
  enrollment_date: string | null;
  qr_code_data: string | null;
}

// ── Academic Info ──
export interface ProfileClassInfo {
  id: string;
  name: string;
  level: string;
  level_code: string;
  stream: string;
  section: string;
  academic_year: string;
}

export interface ProfileLevelSubject {
  subject_name: string;
  subject_code: string;
  coefficient: string;
  weekly_hours: string | null;
  is_mandatory: boolean;
}

export interface StudentAcademicInfo {
  current_class: ProfileClassInfo | null;
  level_subjects: ProfileLevelSubject[];
}

// ── Payment Info ──
export interface ProfilePaymentBrief {
  id: string;
  amount_paid: string;
  payment_date: string;
  payment_type: string;
  payment_method: string;
  receipt_number: string;
  period_start: string;
  period_end: string;
  status: string;
}

export interface StudentPaymentInfo {
  total_paid: string;
  payment_count: number;
  recent_payments: ProfilePaymentBrief[];
}

// ── Teachers ──
export interface ProfileTeacherBrief {
  id: string;
  full_name: string;
  subject: string;
  subject_code: string;
}

// ── Parents ──
export interface ProfileParentBrief {
  id: string;
  full_name: string;
  phone_number: string;
  relationship: string;
}

// ── Absences ──
export interface ProfileAbsenceRecord {
  id: string;
  date: string;
  period: string;
  subject_name: string;
  status: string;
  is_justified: boolean;
}

export interface StudentAbsencesSummary {
  total_absences: number;
  justified: number;
  unjustified: number;
  late_count: number;
  recent_absences: ProfileAbsenceRecord[];
}

// ── Grades History ──
export interface ProfileSubjectAverage {
  subject: string;
  trimester: number;
  average: string | null;
  is_published: boolean;
  academic_year: string;
}

export interface ProfileTrimesterAverage {
  trimester: number;
  average: string | null;
  rank_in_class: number;
  appreciation: string;
  is_published: boolean;
  academic_year: string;
}

export interface ProfileAnnualAverage {
  average: string | null;
  rank_in_class: number;
  rank_in_level: number;
  appreciation: string;
  is_published: boolean;
  academic_year: string;
}

export interface StudentGradesHistory {
  subject_averages: ProfileSubjectAverage[];
  trimester_averages: ProfileTrimesterAverage[];
  annual_average: ProfileAnnualAverage | null;
}

// ── Appeals ──
export interface ProfileAppealBrief {
  id: string;
  appeal_type: string;
  status: string;
  reason: string;
  created_at: string;
  responded_at: string | null;
}

// ── Document (placeholder) ──
export interface ProfileDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
}

// ── QR Code response ──
export interface StudentQRCodeResponse {
  qr_code_base64: string;
  qr_data: string;
  generated_at: string;
}

// ══════════════════════════════════════════════════════════════════════
// Full Profile — Top-level response
// ══════════════════════════════════════════════════════════════════════

export interface StudentFullProfile {
  identity: StudentIdentity;
  academic_info: StudentAcademicInfo;
  payment_info: StudentPaymentInfo;
  teachers: ProfileTeacherBrief[];
  parents: ProfileParentBrief[];
  absences_summary: StudentAbsencesSummary;
  grades_history: StudentGradesHistory;
  appeals: ProfileAppealBrief[];
  documents: ProfileDocument[];
}
