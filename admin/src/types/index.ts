/* ══════════════════════════════════════════════════════════════════════
   ILMI — Admin Panel TypeScript Types
   Matches backend Django serializers for type‑safe API calls
   ══════════════════════════════════════════════════════════════════════ */

// ── Generic paginated response ──
export interface PaginatedResponse<T = unknown> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── User / Auth ──
export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'SECTION_ADMIN'
  | 'TEACHER'
  | 'PARENT'
  | 'STUDENT';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  photo?: string;
  role: UserRole;
  school?: string;
  school_name?: string;
  school_detail?: School;
  is_active: boolean;
  is_first_login: boolean;
  subscription_plan?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  role: UserRole;
  school_id?: string;
  is_first_login: boolean;
  user?: User;
}

// ── School ──
export type SchoolCategory = 'PRIVATE_SCHOOL' | 'TRAINING_CENTER';
export type TrainingType =
  | 'SUPPORT_COURSES'
  | 'LANGUAGES'
  | 'PROFESSIONAL'
  | 'EXAM_PREP'
  | 'COMPUTING'
  | 'OTHER';

export interface School {
  id: string;
  name: string;
  logo?: string;
  logo_url?: string;
  address?: string;
  wilaya?: string;
  phone?: string;
  email?: string;
  website?: string;
  motto?: string;
  subdomain: string;
  school_category: SchoolCategory;
  has_primary: boolean;
  has_middle: boolean;
  has_high: boolean;
  available_streams?: string[];
  training_type?: TrainingType;
  subscription_plan: 'STARTER' | 'PRO' | 'PRO_AI';
  subscription_active: boolean;
  subscription_start?: string;
  subscription_end?: string;
  max_students: number;
  is_active: boolean;
  setup_completed: boolean;
  notes?: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolCreatePayload {
  name: string;
  logo?: File;
  address?: string;
  wilaya?: string;
  phone?: string;
  email?: string;
  website?: string;
  motto?: string;
  subdomain: string;
  school_category: SchoolCategory;
  has_primary?: boolean;
  has_middle?: boolean;
  has_high?: boolean;
  available_streams?: string[];
  training_type?: TrainingType;
  subscription_plan: string;
  subscription_start?: string;
  subscription_end?: string;
  max_students?: number;
  notes?: string;
  admin_first_name?: string;
  admin_last_name?: string;
  admin_phone?: string;
  admin_email?: string;
  admin_password?: string;
}

export interface SchoolCreateResponse extends School {
  admin_credentials?: {
    user_id: string;
    phone_number: string;
    password: string;
    first_name: string;
    last_name: string;
  };
}

export interface Section {
  id: string;
  school: string;
  name: string;
  type: 'PRIMARY' | 'MIDDLE' | 'HIGH';
  created_at?: string;
}

export interface AcademicYear {
  id: string;
  school: string;
  section?: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

// ── Academics — Hierarchy ──

export interface Level {
  id: string;
  section: string;
  section_name?: string;
  section_type?: string;
  name: string;
  code: string;
  order: number;
  max_grade: number;
  passing_grade: number;
  has_streams: boolean;
  stream_count?: number;
}

export interface Stream {
  id: string;
  level: string;
  level_code?: string;
  name: string;
  code: string;
  short_name?: string;
  is_tronc_commun: boolean;
  order: number;
}

export interface LevelSubject {
  id: string;
  level: string;
  level_code?: string;
  stream?: string | null;
  stream_name?: string | null;
  subject: string;
  subject_name?: string;
  coefficient: number;
  is_mandatory: boolean;
  weekly_hours?: number | null;
}

export interface ClassInfo {
  id: string;
  name: string;
  level: string;
  level_code?: string;
  level_name?: string;
  stream?: string | null;
  stream_name?: string | null;
  section?: string;
  academic_year?: string;
  homeroom_teacher?: string;
  homeroom_teacher_name?: string;
  capacity?: number;
  /** @deprecated use capacity */
  max_students?: number;
  student_count?: number;
  average?: number;
  attendance_rate?: number;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  arabic_name?: string;
  code?: string;
  color?: string;
  icon?: string;
}

export interface ScheduleSlot {
  id: string;
  day: string;
  day_of_week?: string;
  start_time: string;
  end_time: string;
  subject?: string;
  subject_name?: string;
  teacher?: string;
  teacher_name?: string;
  class_obj?: string;
  class_name?: string;
  room?: string;
}

// ── Student / Teacher profiles ──
export interface StudentProfile {
  id: string;
  user?: User;
  first_name: string;
  last_name: string;
  student_id?: string;
  current_class?: string;
  current_class_name?: string;
  class_name?: string;
  class_assigned?: string;
  date_of_birth?: string;
  enrollment_date?: string;
  attendance_rate?: number;
  average?: number;
  status?: string;
  is_active?: boolean;
  phone_number?: string;
  parent_phone?: string;
  email?: string;
}

export interface TeacherProfile {
  id: string;
  user?: User;
  first_name: string;
  last_name: string;
  specialization?: string;
  section?: string;
  phone?: string;
  phone_number?: string;
  email?: string;
  subject?: string;
  status?: string;
  is_active?: boolean;
  classes?: string[];
  classes_assigned?: string[] | string;
  last_login?: string;
  created_at?: string;
}

// ── Grade ──
export type GradeStatus = 'draft' | 'submitted' | 'published' | 'returned';
export type ExamType = 'CONTINUOUS' | 'TEST_1' | 'TEST_2' | 'FINAL';

export interface Grade {
  id: string;
  student?: string;
  student_name?: string;
  subject?: string;
  subject_name?: string;
  trimester?: 1 | 2 | 3;
  academic_year?: string;
  exam_type?: ExamType;
  score?: number;
  value?: number;
  max_value?: number;
  average?: number;
  grade?: number;
  status?: GradeStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ReportCard {
  id: string;
  student: string;
  student_name?: string;
  trimester: 1 | 2 | 3;
  academic_year?: string;
  general_average?: number;
  rank?: number;
  total_students?: number;
  pdf_url?: string;
  is_published: boolean;
  created_at?: string;
}

// ── Attendance ──
export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  student?: string;
  student_name?: string;
  class_obj?: string;
  class_name?: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  excused?: boolean;
  marked_by?: string;
}

export interface BulkAttendancePayload {
  class_id: string;
  date: string;
  records: Array<{
    student: string;
    status: AttendanceStatus;
    note?: string;
  }>;
}

// ── Finance ──
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CCP' | 'BARIDIMOB';

export interface FeeStructure {
  id: string;
  name: string;
  target_class?: string;
  academic_year?: string;
  amount: number;
  due_date?: string;
  is_installment_allowed?: boolean;
  installment_count?: number;
}

export interface Payment {
  id: string;
  student?: string;
  student_name?: string;
  fee?: string;
  amount: number;
  payment_method?: string;
  status?: string;
  reference_number?: string;
  receipt_file?: string;
  paid_at?: string;
  note?: string;
  date?: string;
  created_at?: string;
}

export interface FinanceStats {
  total_revenue: number;
  total_paid: number;
  total_pending: number;
  total_overdue: number;
  payment_count: number;
  paid_count: number;
  pending_count: number;
}

// ── Chat / Messaging ──
export type ConversationRole = 'parent' | 'enseignant' | 'eleve' | 'admin';

export interface Conversation {
  id: string;
  participant_other: string;
  participant_other_name: string;
  participant_other_role: ConversationRole;
  participant_other_initials: string;
  last_message_preview: string;
  last_message_at: string | null;
  unread_count_admin: number;
}

export interface ChatMessage {
  id: string;
  conversation_id?: string;
  sender_id?: string;
  sender?: string;
  sender_name?: string;
  sender_is_admin?: boolean;
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  is_read?: boolean;
  created_at?: string;
  // Transient fields for optimistic UI
  _optimistic?: boolean;
  recipient_id?: string;
}

export interface ContactUser {
  id: string;
  full_name: string;
  initials: string;
  has_conversation: boolean;
}

export interface ContactsResponse {
  enseignants: ContactUser[];
  parents: ContactUser[];
  eleves: ContactUser[];
  admins: ContactUser[];
}

// Legacy compatibility — keep ChatRoom alias
export type ChatRoomType =
  | 'TEACHER_PARENT'
  | 'TEACHER_STUDENT'
  | 'CLASS_BROADCAST'
  | 'ADMIN_PARENT'
  | 'ADMIN_BROADCAST';

export interface ChatRoom {
  id: string;
  name?: string;
  room_type?: ChatRoomType;
  related_student?: string;
  related_class?: string;
  participants?: string[];
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  created_at?: string;
}

// ── Announcement ──
export interface Announcement {
  id: string;
  title: string;
  content?: string;
  message?: string;
  author?: string;
  target?: string;
  audience?: string;
  type?: string;
  urgent?: boolean;
  pinned?: boolean;
  channel?: 'app' | 'sms' | 'both';
  scheduled_at?: string;
  target_class?: string;
  target_class_name?: string;
  target_section?: string;
  target_users?: string[];
  views?: number;
  created_at?: string;
  updated_at?: string;
}

// ── Notification ──
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface Notification {
  id: string;
  title?: string;
  message: string;
  type?: NotificationType;
  is_read: boolean;
  created_at?: string;
}

// ── Homework ──
export interface Homework {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  subject_name?: string;
  class_obj?: string;
  class_name?: string;
  due_date?: string;
  status?: string;
  created_at?: string;
}

// ── Platform Settings ──
export interface PlatformConfig {
  id?: string;
  maintenance_mode: boolean;
  open_registration: boolean;
  default_language: string;
  require_2fa: boolean;
  lock_after_failures: boolean;
  max_login_attempts: number;
  session_duration_minutes: number;
  email_notifications: boolean;
  push_notifications: boolean;
  subscription_alerts: boolean;
  alert_days_before_expiry: number;
}

// ── Activity Log ──
export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'EXPORT'
  | 'IMPORT'
  | 'PUBLISH'
  | 'OTHER';

export interface ActivityLog {
  id: string;
  user?: string;
  user_name?: string;
  action: ActivityAction;
  resource_type?: string;
  resource_id?: string;
  description: string;
  ip_address?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ── System Health ──
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  database: { status: string; response_time_ms: number };
  redis: { status: string; response_time_ms: number };
  celery: { status: string; active_workers: number };
  storage: { used_mb: number; available_mb: number };
  uptime_seconds: number;
  version: string;
}

// ── UI helper types ──
export interface StatCardData {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  borderColor?: string;
  icon?: React.ReactNode;
  colorClass?: string;
}

export type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'gray';
