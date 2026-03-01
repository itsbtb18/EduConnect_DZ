export interface TeacherProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  photo?: string;
  schoolName: string;
  schoolLogo?: string;
}

export interface ClassRoom {
  id: string;
  name: string;           // "4ème A", "1ère AS A"
  level: 'Primaire' | 'Collège' | 'Lycée';
  subject: string;
  studentCount: number;
  room: string;           // "Salle B12"
  schedule: ScheduleSlot[];
  averageGrade: number;
}

export interface ScheduleSlot {
  id: string;
  day: 'Dimanche' | 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi';
  startTime: string;      // "08:00"
  endTime: string;        // "09:30"
  classId: string;
  className: string;
  subject: string;
  room: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  classId: string;
  className: string;
  average: number;
  attendanceRate: number;
  parentName: string;
  parentPhone: string;
  status: 'active' | 'watch' | 'suspended';
}

export type ExamType = 'CONTINUOUS' | 'TEST_1' | 'TEST_2' | 'FINAL';
export type GradeStatus = 'draft' | 'submitted' | 'published' | 'returned';
export type GradeScale = 10 | 20;

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  subject: string;
  trimester: 1 | 2 | 3;
  examType: ExamType;
  value: number;
  maxValue: GradeScale;
  status: GradeStatus;
  submittedAt?: string;
  publishedAt?: string;
  adminComment?: string;
}

export interface GradeSession {
  id: string;
  classId: string;
  className: string;
  subject: string;
  trimester: 1 | 2 | 3;
  examType: ExamType;
  status: GradeStatus;
  submittedAt?: string;
  grades: Grade[];
  adminComment?: string;
}

export interface HomeworkPost {
  id: string;
  classId: string;
  className: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;        // ISO string
  createdAt: string;
  attachments: Attachment[];
  viewCount: number;
  isCorrected: boolean;
}

export interface Resource {
  id: string;
  classId: string;
  className: string;
  subject: string;
  title: string;
  description?: string;
  fileType: 'pdf' | 'pptx' | 'docx' | 'image' | 'video' | 'link';
  fileUrl: string;
  fileSize?: string;
  chapter?: string;
  uploadedAt: string;
  downloadCount: number;
}

export interface Attachment {
  id: string;
  name: string;
  fileType: 'pdf' | 'image' | 'docx' | 'pptx';
  fileSize: string;
  fileUrl: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  subject: string;
  date: string;
  slot: string;
  records: AttendanceRecord[];
  isSubmitted: boolean;
}

export type MessageType = 'text' | 'image' | 'file';
export type ChatRoomType = 'TEACHER_PARENT' | 'TEACHER_STUDENT';

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'parent' | 'student';
  content: string;
  messageType: MessageType;
  attachment?: Attachment;
  sentAt: string;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  type: ChatRoomType;
  relatedStudentId: string;
  relatedStudentName: string;
  className: string;
  participantName: string;
  participantRole: 'parent' | 'student';
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  isOnline: boolean;
  messages: ChatMessage[];
}

export interface Notification {
  id: string;
  type: 'grade_returned' | 'new_message' | 'absence_justified' | 'announcement' | 'reminder';
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}
