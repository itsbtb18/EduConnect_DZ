/* ══════════════════════════════════════════════════════════════════════
   ILMI — Teacher Full Profile Types
   Matches backend TeacherFullProfileSerializer response exactly
   ══════════════════════════════════════════════════════════════════════ */

// ── Identity ──
export interface TeacherIdentity {
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
  specialization: string;
  section_id: string | null;
  section_name: string | null;
}

// ── Subjects ──
export interface TeacherSubject {
  id: string;
  name: string;
  code: string;
}

// ── Classrooms ──
export interface TeacherClassroom {
  id: string;
  name: string;
  level: string;
  stream: string;
  student_count: number;
}

// ── Teaching Stats ──
export interface TeacherStats {
  total_classes: number;
  total_students: number;
  total_subjects: number;
  total_weekly_hours: number;
}

// ── Schedule Slot ──
export interface TeacherScheduleSlot {
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  subject: string;
  classroom: string;
  room_name: string;
}

// ── Document (placeholder) ──
export interface TeacherDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
}

// ══════════════════════════════════════════════════════════════════════
// Full Profile — Top-level response
// ══════════════════════════════════════════════════════════════════════

export interface TeacherFullProfile {
  identity: TeacherIdentity;
  subjects: TeacherSubject[];
  classrooms: TeacherClassroom[];
  teaching_stats: TeacherStats;
  current_week_schedule: TeacherScheduleSlot[];
  documents: TeacherDocument[];
}
