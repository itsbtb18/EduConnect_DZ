import { create } from 'zustand';
import {
  TeacherProfile,
  ClassRoom,
  Student,
  HomeworkPost,
  Resource,
  GradeSession,
  AttendanceSession,
  AttendanceStatus,
  ChatRoom,
  ChatMessage,
  MessageType,
  ChatRoomType,
  Notification,
} from '../types';
import {
  currentTeacher,
  myClasses,
  myStudents,
  homeworkPosts as initialHomeworkPosts,
  resources as initialResources,
  gradeSessions as initialGradeSessions,
  attendanceSessions as initialAttendanceSessions,
  chatRooms as initialChatRooms,
  notifications as initialNotifications,
} from '../data/mockData';

interface AppState {
  // Auth
  teacher: TeacherProfile;

  // Data (starts from mockData, mutable)
  classes: ClassRoom[];
  students: Student[];
  homeworkPosts: HomeworkPost[];
  resources: Resource[];
  gradeSessions: GradeSession[];
  attendanceSessions: AttendanceSession[];
  chatRooms: ChatRoom[];
  notifications: Notification[];

  // UI state
  activeClassId: string | null;
  unreadNotificationCount: number;
  unreadMessageCount: number;

  // Actions — HOMEWORK
  addHomework: (hw: HomeworkPost) => void;
  updateHomework: (id: string, updates: Partial<HomeworkPost>) => void;
  deleteHomework: (id: string) => void;
  markHomeworkCorrected: (id: string) => void;

  // Actions — RESOURCES
  addResource: (r: Resource) => void;
  deleteResource: (id: string) => void;

  // Actions — GRADES
  updateGradeValue: (sessionId: string, studentId: string, value: number) => void;
  submitGradeSession: (sessionId: string) => void;
  createGradeSession: (session: GradeSession) => void;

  // Actions — ATTENDANCE
  updateAttendanceStatus: (sessionId: string, studentId: string, status: AttendanceStatus) => void;
  updateAttendanceNote: (sessionId: string, studentId: string, note: string) => void;
  createAttendanceSession: (session: AttendanceSession) => void;
  submitAttendance: (sessionId: string) => void;

  // Actions — MESSAGES
  sendMessage: (roomId: string, content: string, messageType: MessageType) => void;
  markRoomAsRead: (roomId: string) => void;
  createChatRoom: (studentId: string, type: ChatRoomType) => void;

  // Actions — NOTIFICATIONS
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Actions — CLASSES
  setActiveClass: (classId: string | null) => void;
}

const useStore = create<AppState>((set, get) => ({
  // ─── Initial state ──────────────────────────────────────────────────────────
  teacher: currentTeacher,
  classes: myClasses,
  students: myStudents,
  homeworkPosts: initialHomeworkPosts,
  resources: initialResources,
  gradeSessions: initialGradeSessions,
  attendanceSessions: initialAttendanceSessions,
  chatRooms: initialChatRooms,
  notifications: initialNotifications,
  activeClassId: 'C1',
  unreadNotificationCount: initialNotifications.filter(n => !n.isRead).length,
  unreadMessageCount: initialChatRooms.reduce((sum, r) => sum + r.unreadCount, 0),

  // ─── HOMEWORK actions ────────────────────────────────────────────────────────
  addHomework: (hw) =>
    set(state => ({ homeworkPosts: [hw, ...state.homeworkPosts] })),

  updateHomework: (id, updates) =>
    set(state => ({
      homeworkPosts: state.homeworkPosts.map(hw =>
        hw.id === id ? { ...hw, ...updates } : hw,
      ),
    })),

  deleteHomework: (id) =>
    set(state => ({
      homeworkPosts: state.homeworkPosts.filter(hw => hw.id !== id),
    })),

  markHomeworkCorrected: (id) =>
    set(state => ({
      homeworkPosts: state.homeworkPosts.map(hw =>
        hw.id === id ? { ...hw, isCorrected: true } : hw,
      ),
    })),

  // ─── RESOURCES actions ───────────────────────────────────────────────────────
  addResource: (r) =>
    set(state => ({ resources: [r, ...state.resources] })),

  deleteResource: (id) =>
    set(state => ({
      resources: state.resources.filter(r => r.id !== id),
    })),

  // ─── GRADES actions ──────────────────────────────────────────────────────────
  updateGradeValue: (sessionId, studentId, value) =>
    set(state => ({
      gradeSessions: state.gradeSessions.map(session =>
        session.id !== sessionId
          ? session
          : {
              ...session,
              grades: session.grades.map(g =>
                g.studentId === studentId ? { ...g, value } : g,
              ),
            },
      ),
    })),

  submitGradeSession: (sessionId) =>
    set(state => ({
      gradeSessions: state.gradeSessions.map(session =>
        session.id !== sessionId
          ? session
          : {
              ...session,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
              grades: session.grades.map(g => ({ ...g, status: 'submitted' })),
            },
      ),
    })),

  createGradeSession: (session) =>
    set(state => ({
      gradeSessions: [
        { ...session, id: Date.now().toString() },
        ...state.gradeSessions,
      ],
    })),

  // ─── ATTENDANCE actions ──────────────────────────────────────────────────────
  updateAttendanceStatus: (sessionId, studentId, status) =>
    set(state => ({
      attendanceSessions: state.attendanceSessions.map(session =>
        session.id !== sessionId
          ? session
          : {
              ...session,
              records: session.records.map(r =>
                r.studentId === studentId ? { ...r, status } : r,
              ),
            },
      ),
    })),

  updateAttendanceNote: (sessionId, studentId, note) =>
    set(state => ({
      attendanceSessions: state.attendanceSessions.map(session =>
        session.id !== sessionId
          ? session
          : {
              ...session,
              records: session.records.map(r =>
                r.studentId === studentId ? { ...r, note } : r,
              ),
            },
      ),
    })),

  createAttendanceSession: (session) =>
    set(state => ({
      attendanceSessions: [session, ...state.attendanceSessions],
    })),

  submitAttendance: (sessionId) =>
    set(state => ({
      attendanceSessions: state.attendanceSessions.map(session =>
        session.id !== sessionId
          ? session
          : { ...session, isSubmitted: true },
      ),
    })),

  // ─── MESSAGES actions ────────────────────────────────────────────────────────
  sendMessage: (roomId, content, messageType) => {
    const { teacher, chatRooms } = get();
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      roomId,
      senderId: teacher.id,
      senderName: `${teacher.firstName} ${teacher.lastName}`,
      senderRole: 'teacher',
      content,
      messageType,
      sentAt: new Date().toISOString(),
      isRead: true,
    };
    const updatedRooms = chatRooms.map(room =>
      room.id !== roomId
        ? room
        : {
            ...room,
            messages: [...room.messages, newMessage],
            lastMessage: content,
            lastTime: 'À l\'instant',
          },
    );
    set({
      chatRooms: updatedRooms,
      unreadMessageCount: updatedRooms.reduce((sum, r) => sum + r.unreadCount, 0),
    });
  },

  markRoomAsRead: (roomId) => {
    const updatedRooms = get().chatRooms.map(room =>
      room.id !== roomId
        ? room
        : {
            ...room,
            unreadCount: 0,
            messages: room.messages.map(m => ({ ...m, isRead: true })),
          },
    );
    set({
      chatRooms: updatedRooms,
      unreadMessageCount: updatedRooms.reduce((sum, r) => sum + r.unreadCount, 0),
    });
  },

  createChatRoom: (studentId, type) => {
    const { students, chatRooms } = get();
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const existingRoom = chatRooms.find(
      r => r.relatedStudentId === studentId && r.type === type,
    );
    if (existingRoom) return;

    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      type,
      relatedStudentId: studentId,
      relatedStudentName: `${student.firstName} ${student.lastName}`,
      className: student.className,
      participantName:
        type === 'TEACHER_PARENT'
          ? student.parentName
          : `${student.firstName} ${student.lastName}`,
      participantRole: type === 'TEACHER_PARENT' ? 'parent' : 'student',
      lastMessage: '',
      lastTime: '',
      unreadCount: 0,
      isOnline: false,
      messages: [],
    };

    const updatedRooms = [...chatRooms, newRoom];
    set({
      chatRooms: updatedRooms,
      unreadMessageCount: updatedRooms.reduce((sum, r) => sum + r.unreadCount, 0),
    });
  },

  // ─── NOTIFICATIONS actions ───────────────────────────────────────────────────
  markNotificationRead: (id) => {
    const updatedNotifications = get().notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    set({
      notifications: updatedNotifications,
      unreadNotificationCount: updatedNotifications.filter(n => !n.isRead).length,
    });
  },

  markAllNotificationsRead: () =>
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
      unreadNotificationCount: 0,
    })),

  // ─── CLASSES actions ─────────────────────────────────────────────────────────
  setActiveClass: (classId) => set({ activeClassId: classId }),
}));

export default useStore;
