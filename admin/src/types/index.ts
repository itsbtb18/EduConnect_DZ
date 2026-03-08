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
  | 'GENERAL_SUPERVISOR'
  | 'FINANCE_MANAGER'
  | 'LIBRARIAN'
  | 'CANTEEN_MANAGER'
  | 'TRANSPORT_MANAGER'
  | 'HR_MANAGER'
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
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject?: string;
  subject_name?: string;
  subject_color?: string;
  teacher?: string;
  teacher_name?: string;
  assigned_class?: string;
  class_obj?: string;
  class_name?: string;
  room?: string;
  room_display?: string;
  room_name?: string;
  academic_year?: string;
  status?: 'DRAFT' | 'PUBLISHED';
  status_label?: string;
  day_label?: string;
  is_temporary?: boolean;
  note?: string;
}

export type RoomType = 'CLASSROOM' | 'LAB' | 'COMPUTER_LAB' | 'LIBRARY' | 'GYM' | 'ART_ROOM' | 'MUSIC_ROOM' | 'MEETING_ROOM' | 'AUDITORIUM' | 'OTHER';

export interface SchoolRoom {
  id: string;
  school: string;
  name: string;
  code: string;
  room_type: RoomType;
  capacity: number;
  floor: string;
  building: string;
  is_available: boolean;
  equipment: string;
  occupied_slots: number;
  created_at: string;
  updated_at: string;
}

export interface TimeSlotConfig {
  id: string;
  school: string;
  label: string;
  start_time: string;
  end_time: string;
  order: number;
  is_break: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeacherAvailabilityBlock {
  id: string;
  school: string;
  teacher: string;
  teacher_name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleConflict {
  type: 'TEACHER' | 'ROOM' | 'CLASS' | 'TEACHER_UNAVAILABLE';
  message: string;
  conflicting_slot_id?: string;
}

export interface TimetableValidation {
  class_id: string;
  class_name: string;
  total_slots: number;
  issues: (ScheduleConflict & { slot_id: string; slot_label: string })[];
  is_valid: boolean;
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
  template?: string;
  template_name?: string;
  sent_to_parents?: boolean;
  sent_at?: string;
  created_at?: string;
}

// ── Report Card Template ──
export interface ReportCardTemplateSignature {
  title: string;
  name: string;
}

export interface ReportCardTemplateSectionConfig {
  key: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface ReportCardTemplate {
  id: string;
  school: string;
  name: string;
  is_default: boolean;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  header_text: string;
  footer_text: string;
  show_school_logo: boolean;
  show_student_photo: boolean;
  show_appreciation: boolean;
  show_ranking: boolean;
  show_absence_count: boolean;
  signatures: ReportCardTemplateSignature[];
  sections_config: ReportCardTemplateSectionConfig[];
  show_coefficient: boolean;
  show_class_average: boolean;
  show_min_max: boolean;
  created_at: string;
  updated_at: string;
}

// ── Generation Progress ──
export interface ReportCardProgress {
  status: 'running' | 'completed' | 'failed' | 'unknown';
  total?: number;
  completed?: number;
  current_class?: string;
  errors?: Array<{ student: string; name: string; error: string }>;
  zip_url?: string;
  error?: string;
  message?: string;
}

// ── Grade Analytics ──
export interface SubjectAverageData {
  class: string;
  average: number;
}

export interface PassFailData {
  class: string;
  total: number;
  passed: number;
  failed: number;
  pass_rate: number;
}

export interface ClassComparisonData {
  class: string;
  average: number;
  students: number;
}

export interface TopStudentData {
  name: string;
  class: string;
  average: number;
  rank?: number;
}

export interface TopStudentsByLevel {
  level: string;
  students: TopStudentData[];
}

export interface TrimesterEvolutionData {
  trimester: number;
  average: number;
  students: number;
}

export interface AtRiskStudent {
  student_id: string;
  name: string;
  class: string;
  previous_avg: number;
  current_avg: number;
  drop: number;
  trimesters: string;
}

export interface TeacherAnalytics {
  teacher_id: string;
  name: string;
  subjects: string[];
  classes: string[];
  class_averages: Record<string, number>;
  total_grades: number;
  published_grades: number;
  submission_rate: number;
}

export interface GradeAnalyticsResponse {
  subject_averages: Record<string, SubjectAverageData[]>;
  pass_fail_rates: PassFailData[];
  class_comparison: ClassComparisonData[];
  top_students_by_level: TopStudentsByLevel[];
  trimester_evolution: TrimesterEvolutionData[];
  at_risk_students: AtRiskStudent[];
  teacher_analytics: TeacherAnalytics[];
}

// ── Attendance Reports ──
export interface MonthlyAttendanceStudent {
  student_id: string;
  name: string;
  absent: number;
  late: number;
  present: number;
  justified: number;
  days: Record<number, string>;
}

export interface MonthlyAttendanceReport {
  class_id: string;
  class_name: string;
  year: number;
  month: number;
  days_in_month: number;
  students: MonthlyAttendanceStudent[];
}

export interface AttendanceCalendarDay {
  date: string;
  day: number;
  status: string;
  period: string;
  is_justified: boolean;
}

export interface AttendanceCalendarResponse {
  student_id: string;
  summary: {
    total_records: number;
    absent: number;
    late: number;
    present: number;
    justified: number;
  };
  calendar: Record<string, AttendanceCalendarDay[]>;
}

export interface AnnualAttendanceMonth {
  month: number;
  total: number;
  absent: number;
  late: number;
  present: number;
  justified: number;
  absence_rate: number;
}

export interface AnnualAttendanceReport {
  year: number;
  class_id?: string;
  months: AnnualAttendanceMonth[];
}

export interface AttendanceRankingItem {
  rank: number;
  student_id: string;
  name: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  attendance_rate: number;
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
export type ConversationRole = 'parent' | 'enseignant' | 'eleve' | 'admin' | 'infirmier';

export type ConversationRoomType =
  | 'TEACHER_PARENT'
  | 'TEACHER_STUDENT'
  | 'ADMIN_PARENT'
  | 'ADMIN_TEACHER'
  | 'NURSE_PARENT';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface Conversation {
  id: string;
  participant_other: string;
  participant_other_name: string;
  participant_other_role: ConversationRole;
  participant_other_initials: string;
  last_message_preview: string;
  last_message_at: string | null;
  unread_count_admin: number;
  room_type?: ConversationRoomType;
  related_student?: string;
  related_student_name?: string;
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
  attachment_type?: 'IMAGE' | 'DOCUMENT' | 'VIDEO' | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  status?: MessageStatus;
  delivered_at?: string | null;
  read_at?: string | null;
  is_pinned?: boolean;
  is_deleted?: boolean;
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

// ── Chat Room (group/broadcast) ──
export type ChatRoomType =
  | 'TEACHER_PARENT'
  | 'TEACHER_STUDENT'
  | 'CLASS_BROADCAST'
  | 'ADMIN_PARENT'
  | 'ADMIN_BROADCAST'
  | 'ADMIN_ALL_BROADCAST'
  | 'ADMIN_TEACHER_GROUP'
  | 'NURSE_PARENT_GROUP';

export interface ChatRoomMessage {
  id: string;
  room?: string;
  sender_id?: string;
  sender_name?: string;
  sender_role?: string;
  content: string;
  attachment_url?: string | null;
  attachment_type?: 'image' | 'document' | 'video' | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  status?: MessageStatus;
  is_pinned?: boolean;
  is_deleted?: boolean;
  created_at?: string;
}

export interface ChatRoom {
  id: string;
  name?: string;
  room_type?: ChatRoomType;
  related_student?: string;
  related_class?: string;
  related_section?: string;
  participants?: string[];
  member_count?: number;
  last_message_preview?: string;
  last_message_at?: string;
  unread_count?: number;
  created_at?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'GENERAL' | 'ABSENCE' | 'GRADES' | 'DISCIPLINE' | 'MEETING' | 'HEALTH';
  created_by_name?: string;
  created_at?: string;
}

// ── Announcement ──
export interface Announcement {
  id: string;
  title: string;
  body?: string;
  content?: string;
  message?: string;
  author?: string;
  author_name?: string;
  target_audience?: string;
  target?: string;
  audience?: string;
  type?: string;
  is_urgent?: boolean;
  urgent?: boolean;
  is_pinned?: boolean;
  pinned?: boolean;
  image?: string;
  image_url?: string | null;
  channel?: 'app' | 'sms' | 'both';
  scheduled_at?: string;
  publish_at?: string | null;
  published_at?: string | null;
  target_class?: string;
  target_class_id?: string;
  target_class_name?: string;
  target_section?: string;
  target_section_id?: string;
  target_section_name?: string;
  target_users?: string[];
  views_count?: number;
  views?: number;
  read_count?: number;
  is_deleted?: boolean;
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

// ── Subscription / Module System ──
export type ModuleSlug =
  | 'pedagogique'
  | 'empreintes'
  | 'finance'
  | 'cantine'
  | 'transport'
  | 'auto_education'
  | 'sms'
  | 'bibliotheque'
  | 'infirmerie'
  | 'mobile_apps'
  | 'ai_chatbot';

export interface SchoolSubscription {
  id: string;
  school: string;
  school_name: string;
  is_active: boolean;
  plan_name: string;
  subscription_start: string;
  subscription_end: string | null;
  max_students: number;
  suspension_reason: string;
  module_pedagogique: boolean;
  module_empreintes: boolean;
  module_finance: boolean;
  module_cantine: boolean;
  module_transport: boolean;
  module_auto_education: boolean;
  module_sms: boolean;
  module_bibliotheque: boolean;
  module_infirmerie: boolean;
  module_mobile_apps: boolean;
  module_ai_chatbot: boolean;
  monthly_total: string;
  active_modules: ModuleSlug[];
  activation_log: Array<{
    action: string;
    module: string;
    by: string;
    at: string;
    prorata?: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface ModuleActivationLog {
  id: string;
  school: string;
  module_name: string;
  action: 'ACTIVATED' | 'DEACTIVATED';
  activated_by: string | null;
  activated_by_name: string;
  reason: string;
  prorata_amount: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface SubscriptionInvoice {
  id: string;
  school: string;
  school_name: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  amount: string;
  tax_amount: string;
  total_amount: string;
  status: InvoiceStatus;
  line_items: Array<{ module: string; amount: string }>;
  notes: string;
  paid_at: string | null;
  due_date: string | null;
  generated_by: string | null;
  generated_by_name: string;
  created_at: string;
  updated_at: string;
}

// ── Analytics (Super Admin) ──
export interface AnalyticsOverview {
  total_schools: number;
  active_schools: number;
  inactive_schools: number;
  new_schools_7d: number;
  new_schools_30d: number;
  total_users: number;
  new_users_7d: number;
  new_users_30d: number;
  total_revenue: string;
  revenue_30d: string;
  mrr: string;
  expiring_soon: number;
  growth_rate: number;
}

export interface AnalyticsRevenue {
  by_month: Array<{ month: string; total: string; invoice_count: number }>;
  by_module: Array<{ module: string; total: string }>;
}

export interface ModuleUsage {
  module: string;
  count: number;
  percentage: number;
  price: string;
}

export interface WilayaMapData {
  wilaya: string;
  count: number;
  active: number;
}

export interface ChurnData {
  total_subscriptions: number;
  active: number;
  suspended: number;
  renewal_rate: number;
  expiring_7d: number;
  expiring_14d: number;
  expiring_30d: number;
  recently_churned: number;
}

// ── Impersonation ──
export interface ImpersonationLog {
  id: string;
  super_admin_name: string;
  target_school_name: string;
  target_school_id: string;
  target_user_name: string;
  action: string;
  ip_address: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
}

export interface ImpersonateResponse {
  access: string;
  refresh: string;
  school: { id: string; name: string; subdomain: string };
  target_user: { id: string; name: string; role: string };
  log_id: string;
}

// ── Content Management ──
export type ContentCategory = 'BEP' | 'BEM' | 'BAC' | 'TEXTBOOK' | 'GUIDE' | 'OTHER';

export interface ContentResource {
  id: string;
  title: string;
  description: string;
  category: ContentCategory;
  subject: string;
  level: string;
  year: string;
  file: string | null;
  file_url: string;
  thumbnail: string | null;
  is_published: boolean;
  download_count: number;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// ══════════════════════════════════════════════════════════════════════
// Infirmerie (School Infirmary)
// ══════════════════════════════════════════════════════════════════════

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN';
export type AllergyType = 'MEDICATION' | 'FOOD' | 'ENVIRONMENTAL' | 'INSECT' | 'CONTACT' | 'OTHER';
export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLACTIC';
export type HistoryType = 'CHRONIC' | 'CHILDHOOD' | 'SURGERY' | 'HOSPITALISATION' | 'FAMILY';
export type AdministrationRoute = 'ORAL' | 'SUBLINGUAL' | 'INJECTION' | 'INHALATION' | 'TOPICAL' | 'RECTAL' | 'EYE_DROP' | 'OTHER';
export type MedicationFrequency = '1X_DAY' | '2X_DAY' | '3X_DAY' | 'AS_NEEDED' | 'WEEKLY' | 'OTHER';
export type VaccinationStatus = 'DONE' | 'NOT_DONE' | 'OVERDUE' | 'SCHEDULED';
export type ConsultationReason = 'HEADACHE' | 'STOMACH' | 'FEVER' | 'INJURY' | 'ALLERGY_REACTION' | 'ASTHMA' | 'DIABETES' | 'EPILEPSY' | 'NAUSEA' | 'DIZZINESS' | 'EYE' | 'DENTAL' | 'SKIN' | 'PSYCHOLOGICAL' | 'MEDICATION_ADMIN' | 'FOLLOW_UP' | 'OTHER';
export type ConsultationOutcome = 'RETURN_CLASS' | 'REST_ROOM' | 'CONTACT_PARENT' | 'SENT_HOME' | 'EMERGENCY' | 'HOSPITAL_REFERRAL' | 'OTHER';
export type DisabilityType = 'MOTOR' | 'VISUAL' | 'HEARING' | 'COGNITIVE' | 'LEARNING' | 'SPEECH' | 'AUTISM' | 'OTHER';
export type AutonomyLevel = 'FULL' | 'PARTIAL' | 'ASSISTED' | 'FULL_ASSISTANCE';
export type EmergencyType = 'ANAPHYLAXIS' | 'ASTHMA_ATTACK' | 'EPILEPTIC_SEIZURE' | 'DIABETIC_EMERGENCY' | 'CARDIAC' | 'TRAUMA' | 'HEMORRHAGE' | 'FRACTURE' | 'BURN' | 'POISONING' | 'OTHER';
export type EmergencyEventStatus = 'IN_PROGRESS' | 'RESOLVED' | 'TRANSFERRED';
export type MessageTemplate = 'CONSULTATION_DONE' | 'MEDICATION_REMINDER' | 'VACCINATION_REMINDER' | 'REST_NOTIFICATION' | 'SENT_HOME' | 'EMERGENCY_ALERT' | 'CUSTOM';
export type JustificationStatus = 'SUBMITTED' | 'VALIDATED' | 'REJECTED';
export type AlertLevel = 'WATCH' | 'WARNING' | 'CRITICAL';
export type DiseaseStatus = 'ACTIVE' | 'EVICTION' | 'CLEARED';

export interface MedicalRecord {
  id: string;
  student: string;
  student_name?: string;
  blood_group: BloodGroup;
  blood_group_display?: string;
  weight_height_history: Array<{ date: string; weight: number; height: number }>;
  current_weight: number | null;
  current_height: number | null;
  bmi: number | null;
  treating_doctor: string;
  treating_doctor_phone: string;
  insurance_provider: string;
  cnas_number: string;
  casnos_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  notes: string;
  // Nested
  history_entries?: MedicalHistoryEntry[];
  allergies?: Allergy[];
  medications?: InfirmerieMedication[];
  vaccinations?: InfirmerieVaccination[];
  disabilities?: Disability[];
  // List fields
  allergy_count?: number;
  has_anaphylactic?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicalHistoryEntry {
  id: string;
  medical_record: string;
  history_type: HistoryType;
  history_type_display?: string;
  condition_name: string;
  diagnosis_date: string | null;
  treatment: string;
  specialist_doctor: string;
  is_ongoing: boolean;
  notes: string;
}

export interface Allergy {
  id: string;
  medical_record: string;
  allergy_type: AllergyType;
  allergy_type_display?: string;
  allergen_name: string;
  severity: AllergySeverity;
  severity_display?: string;
  symptoms: string;
  emergency_protocol: string;
  has_epipen: boolean;
}

export interface InfirmerieMedication {
  id: string;
  medical_record: string;
  dci_name: string;
  commercial_name: string;
  dosage: string;
  administration_route: AdministrationRoute;
  administration_route_display?: string;
  frequency: MedicationFrequency;
  frequency_display?: string;
  schedule_times: string[];
  stock_quantity: number;
  stock_alert_threshold: number;
  is_stock_low?: boolean;
  start_date: string;
  end_date: string | null;
  prescribing_doctor: string;
  prescription_file: string | null;
  is_active: boolean;
}

export interface InfirmerieVaccination {
  id: string;
  medical_record: string;
  vaccine_name: string;
  status: VaccinationStatus;
  status_display?: string;
  administration_date: string | null;
  administered_at: string;
  lot_number: string;
  next_due_date: string | null;
  notes: string;
}

export interface InfirmerieConsultation {
  id: string;
  student: string;
  student_name?: string;
  nurse: string | null;
  nurse_name?: string;
  consultation_datetime: string;
  reason: ConsultationReason;
  reason_display?: string;
  reason_detail: string;
  symptoms_description: string;
  temperature: number | null;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  spo2: number | null;
  pulse: number | null;
  blood_sugar: number | null;
  weight: number | null;
  height: number | null;
  care_provided: string;
  outcome: ConsultationOutcome;
  outcome_display?: string;
  duration_minutes: number;
  observations: string;
  attachment: string | null;
  parent_contacted: boolean;
  parent_contacted_at: string | null;
  created_at: string;
}

export interface Disability {
  id: string;
  medical_record: string;
  disability_type: DisabilityType;
  disability_type_display?: string;
  description: string;
  autonomy_level: AutonomyLevel;
  autonomy_level_display?: string;
  school_accommodations: string;
  pap_file: string | null;
}

export interface PsychologicalRecord {
  id: string;
  medical_record: string;
  vulnerability_report: string;
  is_in_therapy: boolean;
  therapist_name: string;
  therapist_phone: string;
  family_situation_notes: string;
  follow_up_notes: string;
  last_session_date: string | null;
  next_session_date: string | null;
}

export interface EmergencyProtocol {
  id: string;
  emergency_type: EmergencyType;
  emergency_type_display?: string;
  title: string;
  protocol_steps: Array<{ step: number; action: string; duration?: string }>;
  triggers: string;
  is_active: boolean;
}

export interface EmergencyEvent {
  id: string;
  student: string;
  student_name?: string;
  consultation: string | null;
  protocol: string | null;
  protocol_title?: string;
  emergency_type: EmergencyType;
  emergency_type_display?: string;
  status: EmergencyEventStatus;
  status_display?: string;
  started_at: string;
  ended_at: string | null;
  actions_taken: Array<{ time: string; action: string }>;
  duration_seconds?: number;
  liaison_report_pdf: string | null;
  post_emergency_report: string;
  parent_notified: boolean;
  parent_notified_at: string | null;
  emergency_services_called: boolean;
}

export interface InfirmeryMessage {
  id: string;
  student: string;
  student_name?: string;
  sender: string;
  sender_name?: string;
  recipient: string;
  recipient_name?: string;
  template: MessageTemplate;
  template_display?: string;
  subject: string;
  body: string;
  attachment: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AbsenceJustification {
  id: string;
  student: string;
  student_name?: string;
  submitted_by: string | null;
  submitted_by_name?: string;
  consultation: string | null;
  absence_date_start: string;
  absence_date_end: string;
  generic_reason: string;
  medical_certificate: string | null;
  status: JustificationStatus;
  status_display?: string;
  validated_by: string | null;
  validated_at: string | null;
  rejection_reason: string;
  created_at: string;
}

export interface EpidemicAlert {
  id: string;
  classroom: string | null;
  classroom_name?: string;
  disease_name: string;
  case_count: number;
  detection_date: string;
  alert_level: AlertLevel;
  alert_level_display?: string;
  is_contagious: boolean;
  description: string;
  actions_taken: string;
  is_resolved: boolean;
  resolved_at: string | null;
}

export interface ContagiousDisease {
  id: string;
  student: string;
  student_name?: string;
  epidemic_alert: string | null;
  disease_name: string;
  onset_date: string;
  recommended_eviction_days: number;
  authorized_return_date: string | null;
  status: DiseaseStatus;
  status_display?: string;
  notes: string;
}

export interface InfirmerieDashboardData {
  today_consultations: number;
  active_emergencies: number;
  low_stock_medications: number;
  anaphylactic_allergies: number;
  active_epidemics: number;
  pending_justifications: number;
  evictions: number;
  unread_messages: number;
  total_medical_records: number;
  vaccination_coverage: number;
  consultations_by_reason: Array<{ reason: string; count: number }>;
}

export interface InfirmerieReportData {
  period_start: string;
  period_end: string;
  total_consultations: number;
  consultations_by_reason: Array<{ reason: string; count: number }>;
  consultations_by_outcome: Array<{ outcome: string; count: number }>;
  allergy_summary: Array<{ allergy_type: string; severity: string; count: number }>;
  vaccination_total: number;
  vaccination_done: number;
  vaccination_coverage: number;
  epidemic_summary: Array<{ disease_name: string; alert_level: string; case_count: number; is_resolved: boolean }>;
}

// ══════════════════════════════════════════════════════════════════════
// Cantine (School Canteen)
// ══════════════════════════════════════════════════════════════════════

export type NutritionalStatus = 'NORMAL' | 'UNDERWEIGHT' | 'OVERWEIGHT' | 'OBESE';
export type DietaryRestriction = 'NONE' | 'DIABETIC' | 'CELIAC' | 'LACTOSE' | 'ALLERGY' | 'VEGETARIAN' | 'OTHER';
export type MenuPeriod = 'WEEKLY' | 'MONTHLY' | 'TRIMESTER';
export type DayOfWeek = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU';

export interface CanteenStudent {
  id: string;
  student: string;
  student_name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  nutritional_status: NutritionalStatus;
  nutritional_status_display: string;
  dietary_restriction: DietaryRestriction;
  dietary_restriction_display: string;
  allergy_details: string;
  medical_note: string;
  created_at: string;
}

export interface CanteenMenuItem {
  id: string;
  menu: string;
  date: string;
  day_of_week: DayOfWeek;
  day_of_week_display: string;
  starter: string;
  main_course: string;
  side_dish: string;
  dessert: string;
  allergens: string;
  suitable_for_diabetic: boolean;
  suitable_for_celiac: boolean;
  calories_approx: number | null;
}

export interface CanteenMenu {
  id: string;
  title: string;
  period_type: MenuPeriod;
  period_type_display: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
  notes: string;
  items: CanteenMenuItem[];
  items_count: number;
  created_at: string;
}

export interface CanteenMenuList {
  id: string;
  title: string;
  period_type: MenuPeriod;
  period_type_display: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
  items_count: number;
  created_at: string;
}

export interface MealAttendance {
  id: string;
  student: string;
  student_name: string;
  menu_item: string | null;
  date: string;
  present: boolean;
  notes: string;
  created_at: string;
}

export interface ConsumptionReport {
  start: string;
  end: string;
  enrolled_students: number;
  total_records: number;
  total_present: number;
  total_absent: number;
  attendance_rate: number;
  dietary_restrictions: Array<{ dietary_restriction: string; count: number }>;
  daily_breakdown: Array<{ date: string; present: number; absent: number }>;
}

// ══════════════════════════════════════════════════════════════════════
// Transport
// ══════════════════════════════════════════════════════════════════════

export type LicenseType = 'B' | 'C' | 'D' | 'E';
export type TripType = 'DEPARTURE' | 'RETURN';
export type TripStatus = 'ON_TIME' | 'DELAYED' | 'CANCELLED';

export interface BusDriver {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  national_id: string;
  date_of_birth: string | null;
  blood_type: string;
  photo_url: string;
  address: string;
  license_number: string;
  license_type: LicenseType | '';
  license_expiry: string | null;
  license_valid: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  hire_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BusStop {
  id: string;
  line: string;
  line_name?: string;
  name: string;
  order: number;
  estimated_time: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface TransportLine {
  id: string;
  name: string;
  neighborhood: string;
  description: string;
  driver: string | null;
  driver_detail?: { id: string; full_name: string; phone: string };
  vehicle_plate: string;
  vehicle_model: string;
  vehicle_year: number | null;
  vehicle_color: string;
  capacity: number;
  departure_time: string | null;
  return_time: string | null;
  distance_km: number | null;
  is_active: boolean;
  enrolled_count: number;
  stops: BusStop[];
  created_at: string;
}

export interface TransportLineList {
  id: string;
  name: string;
  neighborhood: string;
  driver_name: string;
  vehicle_plate: string;
  capacity: number;
  enrolled_count: number;
  departure_time: string | null;
  return_time: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StudentTransport {
  id: string;
  student: string;
  student_name: string;
  line: string;
  line_name: string;
  pickup_stop: string | null;
  pickup_stop_name: string;
  dropoff_stop: string | null;
  dropoff_stop_name: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TripLog {
  id: string;
  line: string;
  line_name?: string;
  date: string;
  trip_type: TripType;
  trip_type_display: string;
  scheduled_time: string | null;
  actual_time: string | null;
  status: TripStatus;
  status_display: string;
  delay_minutes: number;
  passengers_count: number;
  notes: string;
  created_at: string;
}

export interface TransportReport {
  total_trips: number;
  on_time_count: number;
  delayed_count: number;
  cancelled_count: number;
  on_time_rate: number;
  avg_delay_minutes: number;
  avg_passengers: number;
  lines: Array<{
    line_id: string;
    line_name: string;
    total_trips: number;
    on_time_count: number;
    on_time_rate: number;
  }>;
}

/* ═══════════════════════════════════════════════════════════════════════
   LIBRARY / BIBLIOTHÈQUE
   ═══════════════════════════════════════════════════════════════════════ */

export type BookCategory =
  | 'FICTION' | 'NON_FICTION' | 'SCIENCE' | 'MATHEMATICS' | 'HISTORY'
  | 'GEOGRAPHY' | 'LITERATURE' | 'RELIGION' | 'ARTS' | 'TECHNOLOGY'
  | 'REFERENCE' | 'PHILOSOPHY' | 'LANGUAGES' | 'SPORTS' | 'OTHER';

export type BookLanguage = 'ARABIC' | 'FRENCH' | 'ENGLISH' | 'TAMAZIGHT' | 'OTHER';

export type BookCopyStatus = 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'RETIRED';

export type BookCopyCondition = 'NEW' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED';

export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST';

export type ReservationStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';

export type LibraryRequestType = 'PURCHASE' | 'SUGGESTION' | 'OTHER';

export type LibraryRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  category: BookCategory;
  language: BookLanguage;
  subject: string;
  description: string;
  publication_year: number | null;
  edition: string;
  page_count: number | null;
  cover_image_url: string;
  total_copies: number;
  available_copies: number;
  created_at: string;
  updated_at: string;
}

export interface BookCopy {
  id: string;
  book: string;
  book_title: string;
  barcode: string;
  condition: BookCopyCondition;
  status: BookCopyStatus;
  location: string;
  acquisition_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  book_copy: string;
  borrower: string;
  borrower_name: string;
  book_title: string;
  copy_barcode: string;
  borrowed_date: string;
  due_date: string;
  returned_date: string | null;
  status: LoanStatus;
  renewals_count: number;
  is_overdue: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  book: string;
  user: string;
  user_name: string;
  book_title: string;
  reserved_date: string;
  status: ReservationStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryRequest {
  id: string;
  requester: string;
  requester_name: string;
  request_type: LibraryRequestType;
  title: string;
  author: string;
  description: string;
  status: LibraryRequestStatus;
  admin_response: string;
  resolved_by: string | null;
  resolved_by_name: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryUsageReport {
  total_books: number;
  total_copies: number;
  available_copies: number;
  total_loans: number;
  active_loans: number;
  overdue_loans: number;
  active_borrowers: number;
  popular_books: Array<{
    book__title: string;
    count: number;
  }>;
  category_distribution: Record<string, number>;
}

// ════════════════════════════════════════════════════════════════════════
// E-Learning
// ════════════════════════════════════════════════════════════════════════

export type ElearningResourceType = 'PDF' | 'VIDEO' | 'COURSE' | 'SUMMARY' | 'EXERCISE' | 'OTHER';
export type ElearningScope = 'GLOBAL' | 'SCHOOL';
export type ExamBankType = 'BEP' | 'BEM' | 'BAC' | 'EXERCISE' | 'HOMEWORK' | 'MOCK_EXAM';
export type QuizQuestionType = 'MCQ' | 'TRUE_FALSE' | 'FREE_TEXT';

export interface DigitalResource {
  id: string;
  title: string;
  description: string;
  resource_type: ElearningResourceType;
  scope: ElearningScope;
  section: string | null;
  section_name: string;
  level: string | null;
  level_name: string;
  subject: string | null;
  subject_name: string;
  chapter: string;
  file: string | null;
  external_url: string;
  tags: string[];
  download_count: number;
  view_count: number;
  is_favourited: boolean;
  created_by: string | null;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ExamBankItem {
  id: string;
  title: string;
  exam_type: ExamBankType;
  level: string | null;
  level_name: string;
  subject: string | null;
  subject_name: string;
  year: number | null;
  description: string;
  file: string;
  solution_file: string | null;
  solution_visible: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz: string;
  order: number;
  question_type: QuizQuestionType;
  text: string;
  options: string[];
  correct_answer: unknown;
  points: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string | null;
  subject_name: string;
  level: string | null;
  level_name: string;
  chapter: string;
  duration_minutes: number;
  created_by_teacher: string | null;
  teacher_name: string;
  assigned_classrooms: string[];
  assigned_classroom_ids: string[];
  allow_retake: boolean;
  show_correction_immediately: boolean;
  is_published: boolean;
  closes_at: string | null;
  is_closed: boolean;
  total_points: number;
  question_count: number;
  questions: QuizQuestion[];
  created_at: string;
  updated_at: string;
}

export interface QuizListItem {
  id: string;
  title: string;
  description: string;
  subject: string | null;
  subject_name: string;
  level: string | null;
  level_name: string;
  chapter: string;
  duration_minutes: number;
  teacher_name: string;
  allow_retake: boolean;
  show_correction_immediately: boolean;
  is_published: boolean;
  closes_at: string | null;
  is_closed: boolean;
  total_points: number;
  question_count: number;
  attempt_count: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz: string;
  quiz_title: string;
  student: string;
  student_name: string;
  started_at: string;
  finished_at: string | null;
  score: number;
  total_points: number;
  answers: Record<string, { answer: unknown; is_correct: boolean; points_earned: number }>;
  passed: boolean;
  created_at: string;
}

export interface StudentProgress {
  id: string;
  student: string;
  student_name: string;
  subject: string;
  subject_name: string;
  completion_percentage: number;
  strengths: string[];
  weaknesses: string[];
  quiz_average: number;
  total_resources_viewed: number;
  total_quizzes_taken: number;
  recommended_resource_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface ElearningAnalytics {
  total_resources: number;
  total_exams: number;
  total_quizzes: number;
  total_attempts: number;
  popular_resources: Array<{
    id: string;
    title: string;
    resource_type: string;
    view_count: number;
    download_count: number;
  }>;
  quiz_stats: Array<{
    id: string;
    title: string;
    attempt_count: number;
    pass_count: number;
    avg_score: number | null;
  }>;
  question_stats: Array<{
    question_id: string;
    order: number;
    text: string;
    total_answers: number;
    correct_answers: number;
    success_rate: number;
  }>;
  class_averages: Array<{
    quiz__title: string;
    quiz__id: string;
    avg: number;
    count: number;
  }>;
  resource_by_subject: Array<{
    subject__name: string;
    total_views: number;
    total_downloads: number;
    count: number;
  }>;
}

// ==========================================================================
// SMS Module
// ==========================================================================

export type SMSProvider = 'CHINGUITEL' | 'MOBILIS' | 'DJEZZY' | 'OOREDOO' | 'TWILIO' | 'CUSTOM';
export type SMSMessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
export type SMSEventType = 'ABSENCE' | 'ARRIVAL' | 'LOW_GRADE' | 'PAYMENT_REMINDER' | 'PAYMENT_OVERDUE' | 'URGENT_ANNOUNCEMENT' | 'EVENT_REMINDER' | 'WELCOME' | 'CAMPAIGN' | 'CUSTOM';
export type SMSTemplateEventType = 'ABSENCE' | 'ARRIVAL' | 'LOW_GRADE' | 'PAYMENT_REMINDER' | 'PAYMENT_OVERDUE' | 'URGENT_ANNOUNCEMENT' | 'EVENT_REMINDER' | 'WELCOME' | 'CUSTOM';
export type SMSCampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'COMPLETED' | 'CANCELLED';
export type SMSCampaignTarget = 'ALL' | 'SECTION' | 'CLASS' | 'INDIVIDUAL';
export type SMSLanguage = 'FR' | 'AR';

export interface SMSConfig {
  id: string;
  provider: SMSProvider;
  provider_display: string;
  sender_name: string;
  api_url: string;
  monthly_quota: number;
  remaining_balance: number;
  alert_threshold: number;
  is_active: boolean;
  cost_per_sms: number;
  usage_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  language: SMSLanguage;
  language_display: string;
  event_type: SMSTemplateEventType;
  event_type_display: string;
  is_active: boolean;
  char_count: number;
  created_at: string;
  updated_at: string;
}

export interface SMSMessage {
  id: string;
  recipient_phone: string;
  recipient_name: string;
  content: string;
  status: SMSMessageStatus;
  status_display: string;
  event_type: SMSEventType;
  event_type_display: string;
  template: string | null;
  campaign: string | null;
  cost: number;
  gateway_message_id: string;
  error_message: string;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface SMSCampaign {
  id: string;
  title: string;
  message: string;
  target_type: SMSCampaignTarget;
  target_type_display: string;
  target_section: string | null;
  target_class: string | null;
  scheduled_at: string | null;
  status: SMSCampaignStatus;
  status_display: string;
  estimated_cost: number;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  completed_at: string | null;
  delivery_rate: number;
  created_at: string;
  updated_at: string;
  messages?: SMSMessage[];
}

export interface SMSBalance {
  remaining_balance: number;
  monthly_quota: number;
  usage_percentage: number;
  cost_per_sms: number;
  alert_threshold: number;
  is_low: boolean;
  provider?: string;
  provider_display?: string;
  month_stats: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    total_cost: number;
    delivery_rate: number;
  };
}

export interface SMSAnalytics {
  balance: {
    remaining: number;
    quota: number;
    is_low: boolean;
  };
  overall: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    total_cost: number;
  };
  monthly: {
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    total_cost: number;
    delivery_rate: number;
  };
  daily_chart: Array<{ date: string; count: number }>;
  by_event_type: Array<{ event_type: string; count: number }>;
  recent_campaigns: SMSCampaign[];
}

// ==========================================================================
// Notification Preferences
// ==========================================================================

export type NotificationPriority = 'URGENT' | 'IMPORTANT' | 'INFO';
export type NotificationCategory = 'ACADEMIC' | 'ATTENDANCE' | 'FINANCE' | 'LIBRARY' | 'TRANSPORT' | 'CANTEEN' | 'MESSAGE' | 'SYSTEM';

export interface NotificationPreference {
  push_academic: boolean;
  push_attendance: boolean;
  push_finance: boolean;
  push_library: boolean;
  push_transport: boolean;
  push_canteen: boolean;
  push_messages: boolean;
  push_system: boolean;
  sms_academic: boolean;
  sms_attendance: boolean;
  sms_finance: boolean;
  sms_library: boolean;
  sms_transport: boolean;
  sms_canteen: boolean;
  sms_messages: boolean;
  silent_mode_enabled: boolean;
  silent_start_time: string | null;
  silent_end_time: string | null;
  weekly_summary_enabled: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read_rate: number;
  by_type: Array<{ notification_type: string; count: number }>;
  by_priority: Array<{ priority: string; count: number }>;
  by_category: Array<{ category: string; count: number }>;
}

// ==========================================================================
// Fingerprint / Biometric
// ==========================================================================

export type FingerprintDeviceType = 'ZKTECO' | 'SUPREMA' | 'DIGITAL_PERSONA' | 'GENERIC';
export type FingerprintDeviceStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
export type FingerprintEventType = 'CHECK_IN' | 'CHECK_OUT';
export type FingerprintTemplateStatus = 'ENROLLED' | 'NOT_ENROLLED' | 'RENEWAL_NEEDED';
export type FingerprintEnrollmentStatus = 'enrolled' | 'partial' | 'not_enrolled';

export interface FingerprintDevice {
  id: string;
  name: string;
  serial_number: string;
  device_type: FingerprintDeviceType;
  location: string;
  ip_address: string | null;
  port: number;
  api_url: string;
  status: FingerprintDeviceStatus;
  firmware_version: string;
  last_heartbeat: string | null;
  is_active: boolean;
  last_sync: string | null;
  is_online: boolean;
}

export interface FingerprintTemplate {
  id: string;
  student: string;
  student_name: string;
  student_photo: string;
  finger_index: number;
  finger_label: string;
  capture_number: number;
  quality_score: number;
  status: FingerprintTemplateStatus;
  enrolled_at: string;
  expires_at: string | null;
}

export interface BiometricAttendanceLog {
  id: string;
  student: string | null;
  student_name: string;
  user: string | null;
  device: string | null;
  device_name: string;
  timestamp: string;
  event_type: FingerprintEventType;
  event_label: string;
  verified: boolean;
  confidence_score: number;
  is_late: boolean;
  late_minutes: number;
  expected_time: string | null;
  synced_to_attendance: boolean;
  is_manual_fallback: boolean;
  created_at: string;
}

export interface StudentEnrollmentStatus {
  student_id: string;
  student_name: string;
  student_photo: string;
  class_name: string;
  fingers_enrolled: number;
  total_captures: number;
  status: FingerprintEnrollmentStatus;
  last_enrolled: string | null;
}

export interface FingerprintDashboardData {
  total_devices: number;
  online_devices: number;
  total_students: number;
  enrolled_students: number;
  today_scans: number;
  today_late: number;
  avg_confidence: number;
  hourly_chart: Array<{ hour: string; count: number }>;
  recent_logs: BiometricAttendanceLog[];
}

export interface TardinessReport {
  total_checkins: number;
  late_count: number;
  late_rate: number;
  avg_late_minutes: number;
  top_late_students: Array<{
    student_id: string;
    name: string;
    late_count: number;
    total_minutes: number;
  }>;
  daily_trend: Array<{
    date: string;
    total: number;
    late: number;
  }>;
}

export interface DeviceDiagnostic {
  device_id: string;
  name: string;
  online: boolean;
  firmware: string;
  sensor_quality: number;
  serial: string;
  error: string;
}

// ── Discipline ──────────────────────────────────────────────────────────

export type IncidentSeverity = 'POSITIVE' | 'WARNING' | 'SERIOUS';
export type IncidentStatus = 'REPORTED' | 'UNDER_REVIEW' | 'VALIDATED' | 'RESOLVED' | 'DISMISSED';
export type SanctionType = 'VERBAL_WARNING' | 'WRITTEN_WARNING' | 'DETENTION' | 'SUSPENSION' | 'EXPULSION' | 'COMMUNITY_SERVICE' | 'OTHER';
export type BehaviorRating = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';

export interface Incident {
  id: string;
  school: string;
  student: string;
  student_name: string;
  class_name: string;
  reported_by: string;
  reported_by_name: string;
  date: string;
  time: string | null;
  severity: IncidentSeverity;
  severity_label: string;
  status: IncidentStatus;
  status_label: string;
  title: string;
  description: string;
  location: string;
  witnesses: string;
  immediate_action: string;
  validated_by: string | null;
  validated_at: string | null;
  parent_notified: boolean;
  parent_notified_at: string | null;
  resolution_note: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisciplineSanction {
  id: string;
  school: string;
  incident: string;
  student: string;
  student_name: string;
  sanction_type: SanctionType;
  sanction_label: string;
  start_date: string;
  end_date: string | null;
  decision: string;
  decided_by: string | null;
  parent_notified: boolean;
  created_at: string;
}

export interface BehaviorReport {
  id: string;
  school: string;
  student: string;
  student_name: string;
  period: string;
  rating: BehaviorRating;
  rating_label: string;
  conduct_score: number | null;
  comments: string;
  reported_by: string | null;
  created_at: string;
}

export interface WarningThreshold {
  id: string;
  school: string;
  trimester: string;
  max_warnings: number;
}

export interface DisciplineStats {
  total_incidents: number;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
  pending: number;
  sanctions_total: number;
}

export interface WarningCount {
  student_id: string;
  student_name: string;
  class_name: string;
  warning_count: number;
  threshold: number;
  exceeded: boolean;
}

export interface ClassComparison {
  class_id: string;
  class_name: string;
  total_incidents: number;
  positive: number;
  warnings: number;
  serious: number;
}

// ── Staff Management ────────────────────────────────────────────────────

export type StaffPosition = 'SECRETARY' | 'ACCOUNTANT' | 'LIBRARIAN' | 'SUPERVISOR' | 'COUNSELOR' | 'NURSE' | 'JANITOR' | 'SECURITY' | 'IT_ADMIN' | 'DRIVER' | 'COOK' | 'DIRECTOR' | 'VICE_DIRECTOR' | 'OTHER';
export type StaffContractType = 'CDI' | 'CDD' | 'VACATAIRE' | 'STAGIAIRE';
export type StaffDocType = 'CONTRACT' | 'ID_CARD' | 'DIPLOMA' | 'MEDICAL' | 'OTHER';
export type StaffAttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE';
export type StaffLeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'UNPAID' | 'PERSONAL' | 'OTHER';
export type StaffLeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface StaffMember {
  id: string;
  school: string;
  user: string;
  full_name: string;
  position: StaffPosition;
  position_label: string;
  department: string;
  hire_date: string | null;
  contract_type: StaffContractType;
  contract_label: string;
  contract_end_date: string | null;
  base_salary: number;
  bank_account: string;
  emergency_contact: string;
  notes: string;
  is_active: boolean;
  phone_number: string;
  email: string;
  photo: string | null;
  created_at: string;
}

export interface StaffDocument {
  id: string;
  school: string;
  staff: string;
  doc_type: StaffDocType;
  doc_type_label: string;
  title: string;
  file: string;
  uploaded_at: string;
}

export interface StaffAttendanceRecord {
  id: string;
  school: string;
  staff: string;
  staff_name: string;
  date: string;
  status: StaffAttendanceStatus;
  status_label: string;
  clock_in: string | null;
  clock_out: string | null;
  hours_worked: number;
  source: string;
  notes: string;
  created_at: string;
}

export interface StaffLeave {
  id: string;
  school: string;
  staff: string;
  staff_name: string;
  leave_type: StaffLeaveType;
  leave_type_label: string;
  start_date: string;
  end_date: string;
  status: StaffLeaveStatus;
  status_label: string;
  reason: string;
  approved_by: string | null;
  days: number;
  created_at: string;
}

export interface StaffStats {
  total_staff: number;
  active_staff: number;
  by_position: Record<string, number>;
  present_today: number;
  pending_leaves: number;
}
