export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  class: string;
  level: 'Primaire' | 'Collège' | 'Lycée';
  parentName: string;
  parentPhone: string;
  attendanceRate: number;
  average: number;
  status: 'active' | 'watch' | 'suspended';
  enrollmentDate: string;
  photo?: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  subject: string;
  classes: string[];
  gradesSubmitted: number;
  totalGrades: number;
  lastActivity: string;
  status: 'active' | 'inactive';
  phone: string;
  email: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  level: 'Primaire' | 'Collège' | 'Lycée';
  mainTeacher: string;
  studentCount: number;
  average: number;
  attendanceRate: number;
  status: 'good' | 'watch';
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  trimester: 1 | 2 | 3;
  continuous: number;
  test1: number;
  test2: number;
  final: number;
  average: number;
  status: 'draft' | 'submitted' | 'published';
  submittedBy: string;
  submittedAt: string;
}

export interface GradeSubmission {
  id: string;
  teacher: string;
  subject: string;
  className: string;
  studentCount: number;
  submittedAt: string;
  status: 'pending' | 'published';
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  excused: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  content: string;
  author: string;
  date: string;
  type: string;
  audience: 'Tous' | 'Parents' | 'Élèves' | 'Enseignants';
  target: string;
  views: number;
  urgent: boolean;
  icon: string;
}

export interface Message {
  id: string;
  conversationId: string;
  from: string;
  fromRole: string;
  sender: string;
  content: string;
  text: string;
  time: string;
  direction: 'sent' | 'received';
}

export interface Conversation {
  id: string;
  name: string;
  contactName: string;
  role: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  avatarColor: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  totalFee: number;
  amount: number;
  paid: number;
  balance: number;
  method: string;
  date: string;
  status: 'paid' | 'partial' | 'pending' | 'overdue' | 'unpaid';
}

export interface Activity {
  icon: string;
  message: string;
  time: string;
  bgColor: string;
}

export interface TimetableSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
  teacher: string;
  room: string;
  color: string;
}

export interface StatCardData {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  borderColor: string;
}

export type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'gray';
