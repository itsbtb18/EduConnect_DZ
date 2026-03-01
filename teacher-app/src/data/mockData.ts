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
  Notification,
} from '../types';

export const currentTeacher: TeacherProfile = {
  id: 'T001',
  firstName: 'Meriem',
  lastName: 'Hadj',
  email: 'meriem.hadj@lycee-ibnadis.dz',
  phone: '0550 123 456',
  subject: 'Mathématiques',
  schoolName: 'École Privée Ibn Badis',
};

export const myClasses: ClassRoom[] = [
  {
    id: 'C1', name: '4ème A', level: 'Collège', subject: 'Mathématiques',
    studentCount: 28, room: 'Salle B12', averageGrade: 13.2,
    schedule: [
      { id: 'S1', day: 'Dimanche', startTime: '08:00', endTime: '09:30', classId: 'C1', className: '4ème A', subject: 'Mathématiques', room: 'B12' },
      { id: 'S2', day: 'Mardi',    startTime: '10:00', endTime: '11:30', classId: 'C1', className: '4ème A', subject: 'Mathématiques', room: 'B12' },
      { id: 'S3', day: 'Jeudi',    startTime: '14:00', endTime: '15:30', classId: 'C1', className: '4ème A', subject: 'Mathématiques', room: 'B12' },
    ],
  },
  {
    id: 'C2', name: '5ème B', level: 'Collège', subject: 'Mathématiques',
    studentCount: 30, room: 'Salle A08', averageGrade: 11.8,
    schedule: [
      { id: 'S4', day: 'Lundi',    startTime: '09:30', endTime: '11:00', classId: 'C2', className: '5ème B', subject: 'Mathématiques', room: 'A08' },
      { id: 'S5', day: 'Mercredi', startTime: '08:00', endTime: '09:30', classId: 'C2', className: '5ème B', subject: 'Mathématiques', room: 'A08' },
    ],
  },
  {
    id: 'C3', name: '4ème B', level: 'Collège', subject: 'Mathématiques',
    studentCount: 27, room: 'Salle C05', averageGrade: 12.5,
    schedule: [
      { id: 'S6', day: 'Lundi',    startTime: '14:00', endTime: '15:30', classId: 'C3', className: '4ème B', subject: 'Mathématiques', room: 'C05' },
      { id: 'S7', day: 'Jeudi',    startTime: '08:00', endTime: '09:30', classId: 'C3', className: '4ème B', subject: 'Mathématiques', room: 'C05' },
    ],
  },
];

export const myStudents: Student[] = [
  // 4ème A (C1)
  { id: 'ST01', firstName: 'Ahmed',   lastName: 'Benali',    classId: 'C1', className: '4ème A', average: 16.0, attendanceRate: 96, parentName: 'Mme. Benali',   parentPhone: '0550 111 222', status: 'active' },
  { id: 'ST02', firstName: 'Sara',    lastName: 'Hamid',     classId: 'C1', className: '4ème A', average: 14.5, attendanceRate: 91, parentName: 'M. Hamid',      parentPhone: '0661 333 444', status: 'active' },
  { id: 'ST03', firstName: 'Youcef',  lastName: 'Kaci',      classId: 'C1', className: '4ème A', average: 9.5,  attendanceRate: 72, parentName: 'Mme. Kaci',     parentPhone: '0770 555 666', status: 'watch' },
  { id: 'ST04', firstName: 'Imane',   lastName: 'Zerrouk',   classId: 'C1', className: '4ème A', average: 17.5, attendanceRate: 98, parentName: 'M. Zerrouk',    parentPhone: '0555 777 888', status: 'active' },
  { id: 'ST05', firstName: 'Rayan',   lastName: 'Bouab',     classId: 'C1', className: '4ème A', average: 13.0, attendanceRate: 89, parentName: 'Mme. Bouab',    parentPhone: '0699 999 000', status: 'active' },
  { id: 'ST06', firstName: 'Lina',    lastName: 'Meziane',   classId: 'C1', className: '4ème A', average: 11.5, attendanceRate: 85, parentName: 'M. Meziane',    parentPhone: '0556 111 333', status: 'active' },
  { id: 'ST07', firstName: 'Karim',   lastName: 'Bouras',    classId: 'C1', className: '4ème A', average: 8.0,  attendanceRate: 65, parentName: 'Mme. Bouras',   parentPhone: '0770 222 444', status: 'watch' },
  { id: 'ST08', firstName: 'Nour',    lastName: 'Aissou',    classId: 'C1', className: '4ème A', average: 15.0, attendanceRate: 94, parentName: 'M. Aissou',     parentPhone: '0550 333 555', status: 'active' },
  { id: 'ST09', firstName: 'Amine',   lastName: 'Larbi',     classId: 'C1', className: '4ème A', average: 12.5, attendanceRate: 90, parentName: 'Mme. Larbi',    parentPhone: '0661 444 666', status: 'active' },
  { id: 'ST10', firstName: 'Sonia',   lastName: 'Belmadi',   classId: 'C1', className: '4ème A', average: 14.0, attendanceRate: 92, parentName: 'M. Belmadi',    parentPhone: '0699 555 777', status: 'active' },
  { id: 'ST11', firstName: 'Walid',   lastName: 'Cherif',    classId: 'C1', className: '4ème A', average: 10.5, attendanceRate: 78, parentName: 'Mme. Cherif',   parentPhone: '0550 666 888', status: 'active' },
  { id: 'ST12', firstName: 'Asma',    lastName: 'Rahmani',   classId: 'C1', className: '4ème A', average: 16.5, attendanceRate: 97, parentName: 'M. Rahmani',    parentPhone: '0770 777 999', status: 'active' },
  { id: 'ST13', firstName: 'Bilal',   lastName: 'Bouchama',  classId: 'C1', className: '4ème A', average: 13.5, attendanceRate: 88, parentName: 'Mme. Bouchama', parentPhone: '0555 888 000', status: 'active' },
  { id: 'ST14', firstName: 'Houda',   lastName: 'Ziane',     classId: 'C1', className: '4ème A', average: 15.5, attendanceRate: 95, parentName: 'M. Ziane',      parentPhone: '0556 999 111', status: 'active' },
  { id: 'ST15', firstName: 'Tarek',   lastName: 'Benabbas',  classId: 'C1', className: '4ème A', average: 7.5,  attendanceRate: 60, parentName: 'Mme. Benabbas', parentPhone: '0661 000 222', status: 'suspended' },
  // 5ème B (C2)
  { id: 'ST16', firstName: 'Ryma',    lastName: 'Taleb',     classId: 'C2', className: '5ème B', average: 12.0, attendanceRate: 90, parentName: 'M. Taleb',      parentPhone: '0699 111 333', status: 'active' },
  { id: 'ST17', firstName: 'Omar',    lastName: 'Mansouri',  classId: 'C2', className: '5ème B', average: 9.0,  attendanceRate: 75, parentName: 'Mme. Mansouri', parentPhone: '0550 222 444', status: 'watch' },
  { id: 'ST18', firstName: 'Fatima',  lastName: 'Chibane',   classId: 'C2', className: '5ème B', average: 14.5, attendanceRate: 93, parentName: 'M. Chibane',    parentPhone: '0770 333 555', status: 'active' },
  { id: 'ST19', firstName: 'Zakaria', lastName: 'Mebarki',   classId: 'C2', className: '5ème B', average: 11.5, attendanceRate: 87, parentName: 'Mme. Mebarki',  parentPhone: '0555 444 666', status: 'active' },
  { id: 'ST20', firstName: 'Meriem',  lastName: 'Bensaid',   classId: 'C2', className: '5ème B', average: 13.5, attendanceRate: 92, parentName: 'M. Bensaid',    parentPhone: '0556 555 777', status: 'active' },
  // 4ème B (C3)
  { id: 'ST21', firstName: 'Ines',    lastName: 'Belaidi',   classId: 'C3', className: '4ème B', average: 15.0, attendanceRate: 96, parentName: 'Mme. Belaidi',  parentPhone: '0661 666 888', status: 'active' },
  { id: 'ST22', firstName: 'Sofiane', lastName: 'Amrani',    classId: 'C3', className: '4ème B', average: 12.0, attendanceRate: 83, parentName: 'M. Amrani',     parentPhone: '0699 777 999', status: 'active' },
  { id: 'ST23', firstName: 'Nadia',   lastName: 'Kettaf',    classId: 'C3', className: '4ème B', average: 10.0, attendanceRate: 79, parentName: 'Mme. Kettaf',   parentPhone: '0550 888 000', status: 'watch' },
  { id: 'ST24', firstName: 'Adel',    lastName: 'Bouzid',    classId: 'C3', className: '4ème B', average: 14.0, attendanceRate: 91, parentName: 'M. Bouzid',     parentPhone: '0770 999 111', status: 'active' },
  { id: 'ST25', firstName: 'Yasmine', lastName: 'Guerfi',    classId: 'C3', className: '4ème B', average: 16.5, attendanceRate: 97, parentName: 'Mme. Guerfi',   parentPhone: '0555 000 222', status: 'active' },
];

export const homeworkPosts: HomeworkPost[] = [
  {
    id: 'HW1', classId: 'C1', className: '4ème A', subject: 'Mathématiques',
    title: 'Exercices sur les équations du second degré',
    description: 'Résoudre les exercices 1 à 15 page 127 du manuel. Montrer toutes les étapes de résolution. Rendre sur feuille double.',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [{ id: 'A1', name: 'exercices_ch3.pdf', fileType: 'pdf', fileSize: '1.2 Mo', fileUrl: '#' }],
    viewCount: 22, isCorrected: false,
  },
  {
    id: 'HW2', classId: 'C2', className: '5ème B', subject: 'Mathématiques',
    title: 'Révision : Fractions et proportionnalité',
    description: 'Compléter la fiche de révision distribuée en classe. Tous les exercices sont obligatoires.',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [],
    viewCount: 18, isCorrected: false,
  },
  {
    id: 'HW3', classId: 'C1', className: '4ème A', subject: 'Mathématiques',
    title: "Problème : Géométrie dans l'espace",
    description: "Résoudre le problème de géométrie distribué. Utiliser les théorèmes de Pythagore et Thalès.",
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: [{ id: 'A2', name: 'probleme_geo.pdf', fileType: 'pdf', fileSize: '800 Ko', fileUrl: '#' }],
    viewCount: 28, isCorrected: true,
  },
  {
    id: 'HW4', classId: 'C3', className: '4ème B', subject: 'Mathématiques',
    title: 'Exercices : Statistiques et représentations graphiques',
    description: 'Exercices 1 à 8 page 95. Tracer les graphiques sur papier millimétré.',
    dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    attachments: [],
    viewCount: 5, isCorrected: false,
  },
];

export const resources: Resource[] = [
  { id: 'R1', classId: 'C1', className: '4ème A', subject: 'Mathématiques', title: 'Cours Chapitre 3 — Équations', description: 'Cours complet avec exemples résolus', fileType: 'pdf', fileUrl: '#', fileSize: '2.4 Mo', chapter: 'Chapitre 3', uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), downloadCount: 24 },
  { id: 'R2', classId: 'C1', className: '4ème A', subject: 'Mathématiques', title: 'Présentation : Introduction aux fonctions', fileType: 'pptx', fileUrl: '#', fileSize: '5.1 Mo', chapter: 'Chapitre 4', uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), downloadCount: 19 },
  { id: 'R3', classId: 'C1', className: '4ème A', subject: 'Mathématiques', title: 'Vidéo : Loi de Pythagore expliquée', fileType: 'video', fileUrl: 'https://youtube.com', chapter: 'Chapitre 2', uploadedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), downloadCount: 31 },
  { id: 'R4', classId: 'C2', className: '5ème B', subject: 'Mathématiques', title: 'Fiche de révision — Fractions', fileType: 'pdf', fileUrl: '#', fileSize: '1.8 Mo', chapter: 'Révisions', uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), downloadCount: 28 },
  { id: 'R5', classId: 'C3', className: '4ème B', subject: 'Mathématiques', title: 'Cours Chapitre 5 — Statistiques', fileType: 'pdf', fileUrl: '#', fileSize: '3.2 Mo', chapter: 'Chapitre 5', uploadedAt: new Date().toISOString(), downloadCount: 2 },
];

export const gradeSessions: GradeSession[] = [
  {
    id: 'GS1', classId: 'C1', className: '4ème A', subject: 'Mathématiques',
    trimester: 1, examType: 'TEST_1', status: 'published',
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    grades: [
      { id: 'G1',  studentId: 'ST01', studentName: 'Ahmed Benali',   classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 16, maxValue: 20, status: 'published' },
      { id: 'G2',  studentId: 'ST02', studentName: 'Sara Hamid',     classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 14, maxValue: 20, status: 'published' },
      { id: 'G3',  studentId: 'ST03', studentName: 'Youcef Kaci',    classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 9,  maxValue: 20, status: 'published' },
      { id: 'G4',  studentId: 'ST04', studentName: 'Imane Zerrouk',  classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 18, maxValue: 20, status: 'published' },
      { id: 'G5',  studentId: 'ST05', studentName: 'Rayan Bouab',    classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 13, maxValue: 20, status: 'published' },
      { id: 'G6',  studentId: 'ST06', studentName: 'Lina Meziane',   classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 11, maxValue: 20, status: 'published' },
      { id: 'G7',  studentId: 'ST07', studentName: 'Karim Bouras',   classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 7,  maxValue: 20, status: 'published' },
      { id: 'G8',  studentId: 'ST08', studentName: 'Nour Aissou',    classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 15, maxValue: 20, status: 'published' },
      { id: 'G9',  studentId: 'ST09', studentName: 'Amine Larbi',    classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 12, maxValue: 20, status: 'published' },
      { id: 'G10', studentId: 'ST10', studentName: 'Sonia Belmadi',  classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 14, maxValue: 20, status: 'published' },
    ],
  },
  {
    id: 'GS2', classId: 'C1', className: '4ème A', subject: 'Mathématiques',
    trimester: 1, examType: 'TEST_2', status: 'submitted',
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    grades: [
      { id: 'G11', studentId: 'ST01', studentName: 'Ahmed Benali',   classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_2', value: 17, maxValue: 20, status: 'submitted' },
      { id: 'G12', studentId: 'ST02', studentName: 'Sara Hamid',     classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_2', value: 15, maxValue: 20, status: 'submitted' },
      { id: 'G13', studentId: 'ST03', studentName: 'Youcef Kaci',    classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_2', value: 10, maxValue: 20, status: 'submitted' },
      { id: 'G14', studentId: 'ST04', studentName: 'Imane Zerrouk',  classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_2', value: 19, maxValue: 20, status: 'submitted' },
      { id: 'G15', studentId: 'ST05', studentName: 'Rayan Bouab',    classId: 'C1', subject: 'Mathématiques', trimester: 1, examType: 'TEST_2', value: 12, maxValue: 20, status: 'submitted' },
    ],
  },
  {
    id: 'GS3', classId: 'C2', className: '5ème B', subject: 'Mathématiques',
    trimester: 1, examType: 'TEST_1', status: 'draft',
    grades: [
      { id: 'G21', studentId: 'ST16', studentName: 'Ryma Taleb',     classId: 'C2', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 12, maxValue: 20, status: 'draft' },
      { id: 'G22', studentId: 'ST17', studentName: 'Omar Mansouri',  classId: 'C2', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 9,  maxValue: 20, status: 'draft' },
      { id: 'G23', studentId: 'ST18', studentName: 'Fatima Chibane', classId: 'C2', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 15, maxValue: 20, status: 'draft' },
      { id: 'G24', studentId: 'ST19', studentName: 'Zakaria Mebarki',classId: 'C2', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 11, maxValue: 20, status: 'draft' },
      { id: 'G25', studentId: 'ST20', studentName: 'Meriem Bensaid', classId: 'C2', subject: 'Mathématiques', trimester: 1, examType: 'TEST_1', value: 13, maxValue: 20, status: 'draft' },
    ],
  },
];

export const attendanceSessions: AttendanceSession[] = [
  {
    id: 'AS1', classId: 'C1', className: '4ème A',
    subject: 'Mathématiques', date: new Date().toISOString(),
    slot: '08:00 – 09:30', isSubmitted: false,
    records: myStudents.filter(s => s.classId === 'C1').map(s => ({
      studentId: s.id,
      studentName: s.firstName + ' ' + s.lastName,
      status: 'present' as AttendanceStatus,
    })),
  },
];

export const chatRooms: ChatRoom[] = [
  {
    id: 'CR1', type: 'TEACHER_PARENT',
    relatedStudentId: 'ST01', relatedStudentName: 'Ahmed Benali',
    className: '4ème A', participantName: 'Mme. Benali', participantRole: 'parent',
    lastMessage: 'Merci pour votre retour sur Ahmed.',
    lastTime: 'il y a 2h', unreadCount: 0, isOnline: true,
    messages: [
      { id: 'M1', roomId: 'CR1', senderId: 'P1', senderName: 'Mme. Benali', senderRole: 'parent', content: "Bonjour Madame Meriem, je voulais vous parler des résultats d'Ahmed en mathématiques ce trimestre.", messageType: 'text', sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), isRead: true },
      { id: 'M2', roomId: 'CR1', senderId: 'T001', senderName: 'Mme. Hadj', senderRole: 'teacher', content: 'Bonjour Madame Benali. Ahmed progresse très bien ! Sa dernière note est 17/20, ce qui est excellent.', messageType: 'text', sentAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(), isRead: true },
      { id: 'M3', roomId: 'CR1', senderId: 'P1', senderName: 'Mme. Benali', senderRole: 'parent', content: "C'est très encourageant ! Y a-t-il des points sur lesquels il devrait travailler davantage ?", messageType: 'text', sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), isRead: true },
      { id: 'M4', roomId: 'CR1', senderId: 'T001', senderName: 'Mme. Hadj', senderRole: 'teacher', content: "Il devrait revoir les exercices sur les fonctions du chapitre 4. Je lui ai uploadé des ressources supplémentaires dans l'application.", messageType: 'text', sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(), isRead: true },
      { id: 'M5', roomId: 'CR1', senderId: 'P1', senderName: 'Mme. Benali', senderRole: 'parent', content: 'Merci pour votre retour sur Ahmed.', messageType: 'text', sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(), isRead: true },
    ],
  },
  {
    id: 'CR2', type: 'TEACHER_PARENT',
    relatedStudentId: 'ST03', relatedStudentName: 'Youcef Kaci',
    className: '4ème A', participantName: 'M. Kaci', participantRole: 'parent',
    lastMessage: 'Quand seront publiées les notes ?',
    lastTime: 'il y a 4h', unreadCount: 2, isOnline: false,
    messages: [
      { id: 'M6', roomId: 'CR2', senderId: 'P2', senderName: 'M. Kaci', senderRole: 'parent', content: 'Bonjour, mon fils Youcef semble avoir du mal avec les mathématiques. Que puis-je faire pour l\'aider ?', messageType: 'text', sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), isRead: true },
      { id: 'M7', roomId: 'CR2', senderId: 'T001', senderName: 'Mme. Hadj', senderRole: 'teacher', content: 'Bonjour M. Kaci. En effet, Youcef a quelques difficultés notamment sur les équations. Je vous recommande de lui faire revoir les cours du chapitre 3 que j\'ai mis en ligne.', messageType: 'text', sentAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(), isRead: true },
      { id: 'M8', roomId: 'CR2', senderId: 'P2', senderName: 'M. Kaci', senderRole: 'parent', content: 'Quand seront publiées les notes ?', messageType: 'text', sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), isRead: false },
    ],
  },
  {
    id: 'CR3', type: 'TEACHER_STUDENT',
    relatedStudentId: 'ST04', relatedStudentName: 'Imane Zerrouk',
    className: '4ème A', participantName: 'Imane Zerrouk', participantRole: 'student',
    lastMessage: "Merci Madame, j'ai compris !",
    lastTime: 'Hier', unreadCount: 0, isOnline: true,
    messages: [
      { id: 'M9',  roomId: 'CR3', senderId: 'ST04', senderName: 'Imane Zerrouk', senderRole: 'student', content: "Bonjour Madame, j'ai une question sur l'exercice 5 du devoir. Je ne comprends pas comment factoriser l'expression.", messageType: 'text', sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), isRead: true },
      { id: 'M10', roomId: 'CR3', senderId: 'T001', senderName: 'Mme. Hadj', senderRole: 'teacher', content: "Bonjour Imane ! Pour factoriser, commence par identifier le facteur commun. Dans cet exercice c'est 3x. Tu mets 3x en évidence et tu divises chaque terme.", messageType: 'text', sentAt: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), isRead: true },
      { id: 'M11', roomId: 'CR3', senderId: 'ST04', senderName: 'Imane Zerrouk', senderRole: 'student', content: "Merci Madame, j'ai compris !", messageType: 'text', sentAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(), isRead: true },
    ],
  },
  {
    id: 'CR4', type: 'TEACHER_PARENT',
    relatedStudentId: 'ST07', relatedStudentName: 'Karim Bouras',
    className: '4ème A', participantName: 'Mme. Bouras', participantRole: 'parent',
    lastMessage: 'Nous allons en discuter avec lui.',
    lastTime: 'il y a 2j', unreadCount: 1, isOnline: false,
    messages: [
      { id: 'M12', roomId: 'CR4', senderId: 'T001', senderName: 'Mme. Hadj', senderRole: 'teacher', content: 'Bonjour Mme. Bouras. Je souhaitais vous informer que Karim a des absences répétées et cela affecte sa progression. Sa moyenne est actuellement de 8/20.', messageType: 'text', sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isRead: true },
      { id: 'M13', roomId: 'CR4', senderId: 'P4', senderName: 'Mme. Bouras', senderRole: 'parent', content: 'Nous allons en discuter avec lui.', messageType: 'text', sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), isRead: false },
    ],
  },
];

export const notifications: Notification[] = [
  { id: 'N1', type: 'grade_returned',    title: 'Notes renvoyées',       body: "L'admin a renvoyé les notes de Composition 2 — 4ème A avec un commentaire.", isRead: false, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: 'N2', type: 'new_message',        title: 'Nouveau message',        body: 'M. Kaci vous a envoyé un message concernant Youcef.',                          isRead: false, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  { id: 'N3', type: 'absence_justified',  title: 'Absence justifiée',      body: "L'absence d'Ahmed Benali du 20/02 a été justifiée par l'administration.",     isRead: true,  createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'N4', type: 'announcement',       title: 'Réunion pédagogique',    body: 'Réunion du conseil pédagogique jeudi 6 mars à 16h30 — Salle des professeurs.', isRead: true,  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'N5', type: 'reminder',           title: 'Rappel : Notes en attente', body: 'Vous avez des notes en brouillon pour 5ème B — Composition 1. Pensez à les soumettre.', isRead: false, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
];

export const messageTemplates = [
  { id: 'T1', category: 'academic_concern', title: 'Difficulté académique', body: 'Bonjour, je souhaitais vous informer que {student_name} rencontre des difficultés en {subject}. Sa moyenne actuelle est de {average}/20. Je vous recommande de le/la faire réviser régulièrement le soir.' },
  { id: 'T2', category: 'positive',          title: 'Félicitations',         body: "Bonjour, je suis heureuse de vous annoncer que {student_name} a fait d'excellents progrès en {subject} ce trimestre. Sa dernière note est de {grade}/20. Continuez à l'encourager !" },
  { id: 'T3', category: 'absence',           title: "Suivi d'absence",       body: "{student_name} était absent(e) lors du cours de {subject} du {date}. Merci de fournir un justificatif d'absence au secrétariat." },
  { id: 'T4', category: 'behavior',          title: 'Comportement en classe', body: 'Bonjour, je souhaitais vous parler du comportement de {student_name} en cours de {subject}. Certaines attitudes perturbent le bon déroulement du cours. Pourriez-vous avoir une discussion avec votre enfant ?' },
  { id: 'T5', category: 'meeting',           title: 'Demande de rendez-vous', body: 'Bonjour, je souhaiterais vous rencontrer afin de discuter de la situation scolaire de {student_name}. Seriez-vous disponible pour un rendez-vous ?' },
];
