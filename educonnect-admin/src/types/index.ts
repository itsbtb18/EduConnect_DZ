export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  studentId: string;
  classId: string;
  className: string;
  level: 'Primaire' | 'Collège' | 'Lycée';
  parentName: string;
  parentPhone: string;
  attendanceRate: number;
  average: number;
  status: 'active' | 'watch' | 'suspended';
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  subject: string;
  classes: string[];
  gradesSubmitted: number;
  lastActivity: string;
  status: 'active' | 'inactive';
}

export interface ClassRoom {
  id: string;
  name: string;
  level: 'Primaire' | 'Collège' | 'Lycée';
  teacher: string;
  studentCount: number;
  average: number;
  attendanceRate: number;
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
  className: string;
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
  body: string;
  author: string;
  date: string;
  audience: 'Tous' | 'Parents' | 'Élèves' | 'Enseignants';
  urgent: boolean;
  icon: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'parent' | 'teacher' | 'admin';
  content: string;
  sentAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participantName: string;
  participantRole: string;
  relatedStudent: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  online: boolean;
  messages: Message[];
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  totalFee: number;
  paid: number;
  balance: number;
  status: 'paid' | 'partial' | 'unpaid';
}

export type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'gray';
