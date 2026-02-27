import type {
  Student,
  Teacher,
  ClassInfo,
  Grade,
  GradeSubmission,
  AttendanceRecord,
  Announcement,
  Conversation,
  Message,
  Payment,
  Activity,
  TimetableSlot,
} from '../types';

// ── Students (20+) ──────────────────────────────────────────
export const students: Student[] = [
  { id: '1', firstName: 'Ahmed', lastName: 'Benali', studentId: 'STD-2024-001', class: '1ère AS A', level: 'Lycée', parentName: 'Mme. Benali', parentPhone: '0550 123 456', attendanceRate: 96, average: 15.2, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '2', firstName: 'Sara', lastName: 'Hamid', studentId: 'STD-2024-002', class: '4ème A', level: 'Collège', parentName: 'M. Hamid', parentPhone: '0661 789 012', attendanceRate: 88, average: 13.8, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '3', firstName: 'Youcef', lastName: 'Kaci', studentId: 'STD-2024-003', class: '5ème B', level: 'Collège', parentName: 'Mme. Kaci', parentPhone: '0770 345 678', attendanceRate: 72, average: 10.1, status: 'watch', enrollmentDate: '2024-09-05' },
  { id: '4', firstName: 'Imane', lastName: 'Zerrouk', studentId: 'STD-2024-004', class: 'CM2 A', level: 'Primaire', parentName: 'M. Zerrouk', parentPhone: '0555 901 234', attendanceRate: 98, average: 17.5, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '5', firstName: 'Rayan', lastName: 'Bouab', studentId: 'STD-2024-005', class: 'CE1 B', level: 'Primaire', parentName: 'Mme. Bouab', parentPhone: '0699 567 890', attendanceRate: 91, average: 14.0, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '6', firstName: 'Lina', lastName: 'Meziane', studentId: 'STD-2024-006', class: '1ère AS A', level: 'Lycée', parentName: 'M. Meziane', parentPhone: '0556 234 567', attendanceRate: 55, average: 8.9, status: 'suspended', enrollmentDate: '2024-09-05' },
  { id: '7', firstName: 'Mohamed', lastName: 'Boudiaf', studentId: 'STD-2024-007', class: '4ème A', level: 'Collège', parentName: 'Mme. Boudiaf', parentPhone: '0552 111 222', attendanceRate: 94, average: 14.5, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '8', firstName: 'Amira', lastName: 'Bensalah', studentId: 'STD-2024-008', class: '5ème B', level: 'Collège', parentName: 'M. Bensalah', parentPhone: '0663 333 444', attendanceRate: 89, average: 12.3, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '9', firstName: 'Yassine', lastName: 'Charef', studentId: 'STD-2024-009', class: 'CM2 A', level: 'Primaire', parentName: 'Mme. Charef', parentPhone: '0771 555 666', attendanceRate: 97, average: 16.1, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '10', firstName: 'Nour', lastName: 'Djebbar', studentId: 'STD-2024-010', class: '1ère AS A', level: 'Lycée', parentName: 'M. Djebbar', parentPhone: '0557 777 888', attendanceRate: 93, average: 13.2, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '11', firstName: 'Amine', lastName: 'Ferhat', studentId: 'STD-2024-011', class: 'CE1 B', level: 'Primaire', parentName: 'Mme. Ferhat', parentPhone: '0698 999 000', attendanceRate: 85, average: 11.8, status: 'watch', enrollmentDate: '2024-09-05' },
  { id: '12', firstName: 'Fatima', lastName: 'Ghezali', studentId: 'STD-2024-012', class: '4ème B', level: 'Collège', parentName: 'M. Ghezali', parentPhone: '0553 112 233', attendanceRate: 92, average: 15.7, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '13', firstName: 'Karim', lastName: 'Hadjadj', studentId: 'STD-2024-013', class: '4ème B', level: 'Collège', parentName: 'Mme. Hadjadj', parentPhone: '0664 334 455', attendanceRate: 78, average: 9.4, status: 'watch', enrollmentDate: '2024-09-05' },
  { id: '14', firstName: 'Meriem', lastName: 'Idir', studentId: 'STD-2024-014', class: '5ème B', level: 'Collège', parentName: 'M. Idir', parentPhone: '0772 556 677', attendanceRate: 95, average: 14.9, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '15', firstName: 'Sofiane', lastName: 'Khelif', studentId: 'STD-2024-015', class: 'CM2 A', level: 'Primaire', parentName: 'Mme. Khelif', parentPhone: '0558 778 899', attendanceRate: 99, average: 18.2, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '16', firstName: 'Zineb', lastName: 'Larbi', studentId: 'STD-2024-016', class: '1ère AS A', level: 'Lycée', parentName: 'M. Larbi', parentPhone: '0697 990 011', attendanceRate: 90, average: 12.6, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '17', firstName: 'Adel', lastName: 'Mansouri', studentId: 'STD-2024-017', class: 'CE1 B', level: 'Primaire', parentName: 'Mme. Mansouri', parentPhone: '0554 223 344', attendanceRate: 88, average: 13.4, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '18', firstName: 'Hana', lastName: 'Nacer', studentId: 'STD-2024-018', class: '4ème A', level: 'Collège', parentName: 'M. Nacer', parentPhone: '0665 445 566', attendanceRate: 96, average: 16.3, status: 'active', enrollmentDate: '2024-09-05' },
  { id: '19', firstName: 'Bilal', lastName: 'Ouali', studentId: 'STD-2024-019', class: '5ème B', level: 'Collège', parentName: 'Mme. Ouali', parentPhone: '0773 667 788', attendanceRate: 63, average: 7.8, status: 'watch', enrollmentDate: '2024-09-05' },
  { id: '20', firstName: 'Sihem', lastName: 'Rahmouni', studentId: 'STD-2024-020', class: 'CM2 A', level: 'Primaire', parentName: 'M. Rahmouni', parentPhone: '0559 889 900', attendanceRate: 94, average: 15.0, status: 'active', enrollmentDate: '2024-09-05' },
];

// ── Teachers (10) ───────────────────────────────────────────
export const teachers: Teacher[] = [
  { id: 't1', firstName: 'Hamid', lastName: 'Bouzid', subject: 'Physique', classes: ['1ère AS A', '2ème AS B'], gradesSubmitted: 6, totalGrades: 8, lastActivity: "Aujourd'hui 09:15", status: 'active', phone: '0550 100 200', email: 'hamid.b@school.dz' },
  { id: 't2', firstName: 'Meriem', lastName: 'Hadj', subject: 'Mathématiques', classes: ['4ème A', '5ème B', '4ème B'], gradesSubmitted: 8, totalGrades: 9, lastActivity: "Aujourd'hui 10:42", status: 'active', phone: '0661 200 300', email: 'meriem.h@school.dz' },
  { id: 't3', firstName: 'Leila', lastName: 'Amrani', subject: 'Français', classes: ['5ème B', '4ème A'], gradesSubmitted: 5, totalGrades: 6, lastActivity: 'Hier', status: 'active', phone: '0770 300 400', email: 'leila.a@school.dz' },
  { id: 't4', firstName: 'Karim', lastName: 'Slimani', subject: 'Arabe', classes: ['4ème B', '5ème B'], gradesSubmitted: 4, totalGrades: 6, lastActivity: 'Hier', status: 'active', phone: '0555 400 500', email: 'karim.s@school.dz' },
  { id: 't5', firstName: 'Fatima', lastName: 'Belkacem', subject: 'SVT', classes: ['CM2 A', '4ème A'], gradesSubmitted: 3, totalGrades: 4, lastActivity: 'il y a 2 jours', status: 'active', phone: '0696 500 600', email: 'fatima.b@school.dz' },
  { id: 't6', firstName: 'Yacine', lastName: 'Mebarki', subject: 'Histoire-Géo', classes: ['CE1 B', 'CM2 A'], gradesSubmitted: 5, totalGrades: 6, lastActivity: 'il y a 3 jours', status: 'active', phone: '0551 600 700', email: 'yacine.m@school.dz' },
  { id: 't7', firstName: 'Samia', lastName: 'Touati', subject: 'Anglais', classes: ['1ère AS A', '4ème A'], gradesSubmitted: 7, totalGrades: 8, lastActivity: "Aujourd'hui 08:30", status: 'active', phone: '0662 700 800', email: 'samia.t@school.dz' },
  { id: 't8', firstName: 'Rachid', lastName: 'Oukil', subject: 'Éducation islamique', classes: ['CE1 B', '5ème B', 'CM2 A'], gradesSubmitted: 6, totalGrades: 9, lastActivity: 'il y a 5 jours', status: 'active', phone: '0771 800 900', email: 'rachid.o@school.dz' },
  { id: 't9', firstName: 'Naima', lastName: 'Berkani', subject: 'Éducation physique', classes: ['1ère AS A', '4ème A', '5ème B'], gradesSubmitted: 3, totalGrades: 6, lastActivity: 'Hier', status: 'inactive', phone: '0556 900 100', email: 'naima.b@school.dz' },
  { id: 't10', firstName: 'Omar', lastName: 'Zidane', subject: 'Informatique', classes: ['1ère AS A'], gradesSubmitted: 2, totalGrades: 2, lastActivity: "Aujourd'hui 11:00", status: 'active', phone: '0697 010 020', email: 'omar.z@school.dz' },
];

// ── Classes (8) ─────────────────────────────────────────────
export const classes: ClassInfo[] = [
  { id: 'c1', name: '1ère AS A', level: 'Lycée', mainTeacher: 'M. Hamid', studentCount: 32, average: 14.2, attendanceRate: 94, status: 'good' },
  { id: 'c2', name: '4ème A', level: 'Collège', mainTeacher: 'Mme. Meriem', studentCount: 28, average: 12.8, attendanceRate: 91, status: 'good' },
  { id: 'c3', name: '5ème B', level: 'Collège', mainTeacher: 'M. Karim', studentCount: 30, average: 11.5, attendanceRate: 87, status: 'watch' },
  { id: 'c4', name: 'CM2 A', level: 'Primaire', mainTeacher: 'Mme. Fatima', studentCount: 25, average: 15.1, attendanceRate: 96, status: 'good' },
  { id: 'c5', name: 'CE1 B', level: 'Primaire', mainTeacher: 'M. Yacine', studentCount: 22, average: 13.9, attendanceRate: 89, status: 'watch' },
  { id: 'c6', name: '4ème B', level: 'Collège', mainTeacher: 'Mme. Leila', studentCount: 27, average: 12.1, attendanceRate: 90, status: 'good' },
  { id: 'c7', name: '2ème AS B', level: 'Lycée', mainTeacher: 'M. Hamid', studentCount: 29, average: 13.5, attendanceRate: 92, status: 'good' },
  { id: 'c8', name: 'CE2 A', level: 'Primaire', mainTeacher: 'Mme. Fatima', studentCount: 24, average: 14.8, attendanceRate: 95, status: 'good' },
];

// ── Grade submissions ───────────────────────────────────────
export const gradeSubmissions: GradeSubmission[] = [
  { id: 'gs1', teacher: 'Mme. Meriem', subject: 'Mathématiques', className: '4ème A', studentCount: 28, submittedAt: "Aujourd'hui, 10:42", status: 'pending' },
  { id: 'gs2', teacher: 'M. Hamid', subject: 'Physique', className: '1ère AS A', studentCount: 32, submittedAt: "Aujourd'hui, 09:15", status: 'pending' },
  { id: 'gs3', teacher: 'Mme. Leila', subject: 'Français', className: '5ème B', studentCount: 30, submittedAt: 'Hier', status: 'pending' },
  { id: 'gs4', teacher: 'M. Karim', subject: 'Arabe', className: '4ème B', studentCount: 27, submittedAt: 'Hier', status: 'pending' },
];

// ── Grades (sample) ─────────────────────────────────────────
export const grades: Grade[] = [
  { id: 'g1', studentId: '1', studentName: 'Ahmed Benali', subject: 'Mathématiques', trimester: 1, continuous: 16, test1: 15, test2: 17, final: 16, average: 16, status: 'published', submittedBy: 'Mme. Meriem', submittedAt: '2026-01-15' },
  { id: 'g2', studentId: '1', studentName: 'Ahmed Benali', subject: 'Physique', trimester: 1, continuous: 14, test1: 13, test2: 15, final: 15, average: 14.5, status: 'published', submittedBy: 'M. Hamid', submittedAt: '2026-01-15' },
  { id: 'g3', studentId: '1', studentName: 'Ahmed Benali', subject: 'Français', trimester: 1, continuous: 12, test1: 14, test2: 13, final: 13, average: 13, status: 'published', submittedBy: 'Mme. Leila', submittedAt: '2026-01-14' },
  { id: 'g4', studentId: '1', studentName: 'Ahmed Benali', subject: 'Arabe', trimester: 1, continuous: 15, test1: 16, test2: 15, final: 16, average: 15.5, status: 'published', submittedBy: 'M. Karim', submittedAt: '2026-01-14' },
  { id: 'g5', studentId: '2', studentName: 'Sara Hamid', subject: 'Mathématiques', trimester: 1, continuous: 13, test1: 14, test2: 13, final: 14, average: 13.5, status: 'published', submittedBy: 'Mme. Meriem', submittedAt: '2026-01-15' },
  { id: 'g6', studentId: '3', studentName: 'Youcef Kaci', subject: 'Mathématiques', trimester: 1, continuous: 9, test1: 10, test2: 11, final: 10, average: 10.2, status: 'submitted', submittedBy: 'Mme. Meriem', submittedAt: '2026-01-15' },
  { id: 'g7', studentId: '4', studentName: 'Imane Zerrouk', subject: 'SVT', trimester: 1, continuous: 18, test1: 17, test2: 18, final: 17, average: 17.5, status: 'published', submittedBy: 'Mme. Fatima', submittedAt: '2026-01-13' },
  { id: 'g8', studentId: '6', studentName: 'Lina Meziane', subject: 'Mathématiques', trimester: 1, continuous: 7, test1: 8, test2: 9, final: 10, average: 8.9, status: 'published', submittedBy: 'Mme. Meriem', submittedAt: '2026-01-15' },
];

// ── Attendance ──────────────────────────────────────────────
export const attendanceRecords: AttendanceRecord[] = [
  { id: 'a1', studentId: '1', studentName: 'Ahmed Benali', className: '1ère AS A', date: '2026-02-27', status: 'absent', excused: false },
  { id: 'a2', studentId: '2', studentName: 'Sara Hamid', className: '4ème A', date: '2026-02-27', status: 'late', excused: true },
  { id: 'a3', studentId: '3', studentName: 'Youcef Kaci', className: '5ème B', date: '2026-02-27', status: 'absent', excused: false },
  { id: 'a4', studentId: '4', studentName: 'Imane Zerrouk', className: 'CM2 A', date: '2026-02-27', status: 'absent', excused: true },
  { id: 'a5', studentId: '5', studentName: 'Rayan Bouab', className: 'CE1 B', date: '2026-02-27', status: 'late', excused: false },
  { id: 'a6', studentId: '7', studentName: 'Mohamed Boudiaf', className: '4ème A', date: '2026-02-27', status: 'absent', excused: false },
  { id: 'a7', studentId: '11', studentName: 'Amine Ferhat', className: 'CE1 B', date: '2026-02-27', status: 'absent', excused: false },
  { id: 'a8', studentId: '13', studentName: 'Karim Hadjadj', className: '4ème B', date: '2026-02-27', status: 'absent', excused: true },
  { id: 'a9', studentId: '19', studentName: 'Bilal Ouali', className: '5ème B', date: '2026-02-27', status: 'late', excused: false },
];

export const weeklyAttendance = [
  { day: 'Dimanche', rate: 94 },
  { day: 'Lundi', rate: 91 },
  { day: 'Mardi', rate: 96 },
  { day: 'Mercredi', rate: 89 },
  { day: 'Jeudi', rate: 92 },
];

// ── Announcements ───────────────────────────────────────────
export const announcements: Announcement[] = [
  { id: 'an1', title: 'Calendrier des examens — Trimestre 2', message: "Le calendrier officiel des examens du deuxième trimestre est maintenant disponible.", content: "Le calendrier officiel des examens du deuxième trimestre est maintenant disponible. Veuillez vérifier les dates et préparer vos enfants.", author: 'Direction', date: '26 Fév 2026', audience: 'Tous', type: 'Urgent', target: 'Tous', views: 342, urgent: true, icon: '📋' },
  { id: 'an2', title: 'Réunion parents-professeurs — 5 Mars 18h', message: "Une réunion parents-enseignants est prévue le 5 mars à 18h.", content: "Une réunion parents-enseignants est prévue le 5 mars à 18h. Votre présence est souhaitée.", author: 'Administration', date: '24 Fév 2026', audience: 'Parents', type: 'Événement', target: 'Parents', views: 218, urgent: false, icon: '👥' },
  { id: 'an3', title: "Sortie scolaire au Musée d'Alger — 12 Mars", message: "Organisation d'une sortie au Musée National le 12 mars.", content: "Organisation d'une sortie au Musée National le 12 mars. Autorisation parentale requise.", author: 'M. Yacine', date: '22 Fév 2026', audience: 'Élèves', type: 'Info', target: 'Élèves', views: 156, urgent: false, icon: '🏛️' },
  { id: 'an4', title: 'Nouvelles ressources disponibles en bibliothèque', message: "De nouvelles ressources pédagogiques sont disponibles.", content: "De nouvelles ressources pédagogiques sont disponibles en ligne dans la bibliothèque numérique.", author: 'Administration', date: '20 Fév 2026', audience: 'Tous', type: 'Rappel', target: 'Tous', views: 98, urgent: false, icon: '📚' },
];

// ── Conversations + Messages ────────────────────────────────
export const conversations: Conversation[] = [
  { id: 'cv1', name: 'Mme. Benali', contactName: 'Mme. Benali', role: "Parent d'Ahmed", lastMessage: 'Merci pour votre retour sur...', time: '2m', unread: 2, online: true, avatarColor: '#1A6BFF' },
  { id: 'cv2', name: 'M. Hamid', contactName: 'M. Hamid', role: 'Parent de Sara', lastMessage: 'Quand seront publiés les notes?', time: '15m', unread: 1, online: false, avatarColor: '#FF6B35' },
  { id: 'cv3', name: 'Ahmed Benali', contactName: 'Ahmed Benali', role: 'Élève · 1ère AS A', lastMessage: 'Madame, pouvez-vous expliquer...', time: '1h', unread: 0, online: true, avatarColor: '#7C3AED' },
  { id: 'cv4', name: 'Mme. Kaci', contactName: 'Mme. Kaci', role: 'Parent de Youcef', lastMessage: "D'accord, nous discuterons...", time: '3h', unread: 0, online: false, avatarColor: '#00C48C' },
  { id: 'cv5', name: 'M. Zerrouk', contactName: 'M. Zerrouk', role: "Parent d'Imane", lastMessage: 'Votre fille a bien progressé!', time: '1j', unread: 0, online: false, avatarColor: '#FFB800' },
];

export const chatMessages: Message[] = [
  { id: 'm1', conversationId: 'cv1', from: 'Mme. Benali', fromRole: 'parent', sender: 'contact', content: "Bonjour Madame Meriem. Je voulais vous contacter au sujet des résultats de mon fils Ahmed en mathématiques.", text: "Bonjour Madame Meriem. Je voulais vous contacter au sujet des résultats de mon fils Ahmed en mathématiques.", time: '10:30', direction: 'received' },
  { id: 'm2', conversationId: 'cv1', from: 'Mme. Meriem', fromRole: 'teacher', sender: 'admin', content: "Bonjour Madame Benali. Ahmed progresse très bien cette année. Sa dernière note est 16/20, ce qui est excellent!", text: "Bonjour Madame Benali. Ahmed progresse très bien cette année. Sa dernière note est 16/20, ce qui est excellent!", time: '10:35', direction: 'sent' },
  { id: 'm3', conversationId: 'cv1', from: 'Mme. Benali', fromRole: 'parent', sender: 'contact', content: "C'est très encourageant! Avez-vous des recommandations pour qu'il améliore encore davantage?", text: "C'est très encourageant! Avez-vous des recommandations pour qu'il améliore encore davantage?", time: '10:37', direction: 'received' },
  { id: 'm4', conversationId: 'cv1', from: 'Mme. Meriem', fromRole: 'teacher', sender: 'admin', content: "Je recommande qu'il fasse les exercices supplémentaires du manuel. Aussi, j'ai posté des ressources importantes dans l'application. 📚", text: "Je recommande qu'il fasse les exercices supplémentaires du manuel. Aussi, j'ai posté des ressources importantes dans l'application. 📚", time: '10:42', direction: 'sent' },
  { id: 'm5', conversationId: 'cv1', from: 'Mme. Benali', fromRole: 'parent', sender: 'contact', content: 'Merci beaucoup pour votre retour sur Ahmed. Nous allons l\'encourager!', text: 'Merci beaucoup pour votre retour sur Ahmed. Nous allons l\'encourager!', time: '10:45', direction: 'received' },
];

// ── Payments ─────────────────────────────────────────────────
export const payments: Payment[] = [
  { id: 'p1', studentId: '1', studentName: 'Ahmed Benali', className: '1ère AS A', totalFee: 64000, amount: 64000, paid: 64000, balance: 0, method: 'Virement', date: '15 Jan 2026', status: 'paid' },
  { id: 'p2', studentId: '2', studentName: 'Sara Hamid', className: '4ème A', totalFee: 50000, amount: 35000, paid: 35000, balance: 15000, method: 'Espèces', date: '20 Jan 2026', status: 'partial' },
  { id: 'p3', studentId: '3', studentName: 'Youcef Kaci', className: '5ème B', totalFee: 50000, amount: 0, paid: 0, balance: 50000, method: '—', date: '—', status: 'pending' },
  { id: 'p4', studentId: '4', studentName: 'Imane Zerrouk', className: 'CM2 A', totalFee: 50000, amount: 50000, paid: 50000, balance: 0, method: 'CCP', date: '10 Jan 2026', status: 'paid' },
  { id: 'p5', studentId: '5', studentName: 'Rayan Bouab', className: 'CE1 B', totalFee: 45000, amount: 30000, paid: 30000, balance: 15000, method: 'Espèces', date: '22 Jan 2026', status: 'partial' },
  { id: 'p6', studentId: '7', studentName: 'Mohamed Boudiaf', className: '4ème A', totalFee: 50000, amount: 50000, paid: 50000, balance: 0, method: 'Virement', date: '05 Jan 2026', status: 'paid' },
  { id: 'p7', studentId: '8', studentName: 'Amira Bensalah', className: '5ème B', totalFee: 50000, amount: 25000, paid: 25000, balance: 25000, method: 'Espèces', date: '18 Jan 2026', status: 'partial' },
  { id: 'p8', studentId: '9', studentName: 'Yassine Charef', className: 'CM2 A', totalFee: 50000, amount: 0, paid: 0, balance: 50000, method: '—', date: '—', status: 'overdue' },
];

// ── Dashboard activities ─────────────────────────────────────
export const recentActivities: Activity[] = [
  { icon: '📋', message: 'Mme. Meriem a soumis les notes de 4ème A — Maths', time: 'il y a 2 min', bgColor: '#E8F0FF' },
  { icon: '✅', message: 'Admin a publié les bulletins du Trimestre 1 — 3ème B', time: 'il y a 15 min', bgColor: '#E6FAF5' },
  { icon: '📢', message: 'Nouvelle annonce envoyée à tous les parents', time: 'il y a 1h', bgColor: '#FFF0EB' },
  { icon: '👤', message: 'Nouvel élève Ahmed Benali inscrit en 2ème AS', time: 'il y a 2h', bgColor: '#FFF8E6' },
  { icon: '📁', message: 'Import en masse : 42 élèves ajoutés — Niveau Primaire', time: 'Hier', bgColor: '#F3F4F6' },
];

// ── Timetable ────────────────────────────────────────────────
export const timetableSlots: TimetableSlot[] = [
  { id: 'ts1', day: 'Dimanche', startTime: '08:00', endTime: '09:30', subject: 'Mathématiques', teacher: 'Mme. Meriem', room: 'B12', color: '#1A6BFF' },
  { id: 'ts2', day: 'Dimanche', startTime: '09:30', endTime: '11:00', subject: 'Physique', teacher: 'M. Hamid', room: 'Lab 1', color: '#FF6B35' },
  { id: 'ts3', day: 'Lundi', startTime: '08:00', endTime: '09:30', subject: 'Français', teacher: 'Mme. Leila', room: 'A08', color: '#00C48C' },
  { id: 'ts4', day: 'Lundi', startTime: '11:00', endTime: '12:30', subject: 'Arabe', teacher: 'M. Karim', room: 'C05', color: '#FFB800' },
  { id: 'ts5', day: 'Mardi', startTime: '08:00', endTime: '09:30', subject: 'Anglais', teacher: 'Mme. Samia', room: 'A03', color: '#9B59B6' },
  { id: 'ts6', day: 'Mardi', startTime: '14:00', endTime: '15:30', subject: 'SVT', teacher: 'Mme. Fatima', room: 'Lab 2', color: '#E74C3C' },
  { id: 'ts7', day: 'Mercredi', startTime: '09:30', endTime: '11:00', subject: 'Histoire-Géo', teacher: 'M. Yacine', room: 'B05', color: '#1A6BFF' },
  { id: 'ts8', day: 'Mercredi', startTime: '11:00', endTime: '12:30', subject: 'Éd. islamique', teacher: 'M. Rachid', room: 'A10', color: '#FF6B35' },
  { id: 'ts9', day: 'Jeudi', startTime: '08:00', endTime: '09:30', subject: 'Mathématiques', teacher: 'Mme. Meriem', room: 'B12', color: '#1A6BFF' },
  { id: 'ts10', day: 'Jeudi', startTime: '09:30', endTime: '11:00', subject: 'Informatique', teacher: 'M. Omar', room: 'Info 1', color: '#00C48C' },
  { id: 'ts11', day: 'Jeudi', startTime: '14:00', endTime: '15:30', subject: 'Éd. physique', teacher: 'Mme. Naima', room: 'Gymnase', color: '#FFB800' },
];

// ── Analytics chart data ─────────────────────────────────────
export const classAveragesChart = [
  { name: '1ère AS A', average: 14.2 },
  { name: '4ème A', average: 12.8 },
  { name: '5ème B', average: 11.5 },
  { name: 'CM2 A', average: 15.1 },
  { name: 'CE1 B', average: 13.9 },
  { name: '4ème B', average: 12.1 },
];

export const trimesterEvolution = [
  { trimester: 'Trim. 1', Maths: 14.2, Physique: 13.5, Français: 12.8, Arabe: 14.0, SVT: 13.1 },
  { trimester: 'Trim. 2', Maths: 14.8, Physique: 14.1, Français: 13.2, Arabe: 14.3, SVT: 13.8 },
  { trimester: 'Trim. 3', Maths: 15.3, Physique: 14.6, Français: 13.9, Arabe: 14.7, SVT: 14.2 },
];

export const atRiskStudents = [
  { id: '6', name: 'Lina Meziane', class: '1ère AS A', className: '1ère AS A', average: 8.9, absences: 18, risk: 'high' as const, trend: 'down' as const },
  { id: '19', name: 'Bilal Ouali', class: '5ème B', className: '5ème B', average: 7.8, absences: 22, risk: 'high' as const, trend: 'down' as const },
  { id: '13', name: 'Karim Hadjadj', class: '4ème B', className: '4ème B', average: 9.4, absences: 14, risk: 'medium' as const, trend: 'stable' as const },
  { id: '3', name: 'Youcef Kaci', class: '5ème B', className: '5ème B', average: 10.1, absences: 16, risk: 'medium' as const, trend: 'up' as const },
  { id: '11', name: 'Amine Ferhat', class: 'CE1 B', className: 'CE1 B', average: 11.8, absences: 10, risk: 'low' as const, trend: 'up' as const },
];

// ── Wilayas ──────────────────────────────────────────────────
export const wilayas = [
  'Adrar','Chlef','Laghouat','Oum El Bouaghi','Batna','Béjaïa','Biskra','Béchar',
  'Blida','Bouira','Tamanrasset','Tébessa','Tlemcen','Tiaret','Tizi Ouzou','Alger',
  'Djelfa','Jijel','Sétif','Saïda','Skikda','Sidi Bel Abbès','Annaba','Guelma',
  'Constantine','Médéa','Mostaganem','M\'sila','Mascara','Ouargla','Oran',
  'El Bayadh','Illizi','Bordj Bou Arréridj','Boumerdès','El Tarf','Tindouf',
  'Tissemsilt','El Oued','Khenchela','Souk Ahras','Tipaza','Mila','Aïn Defla',
  'Naâma','Aïn Témouchent','Ghardaïa','Relizane','Timimoun','Bordj Badji Mokhtar',
  'Ouled Djellal','Béni Abbès','In Salah','In Guezzam','Touggourt','Djanet',
  'El M\'Ghair','El Meniaa',
];
