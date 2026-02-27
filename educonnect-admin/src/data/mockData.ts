import {
  Student, Teacher, ClassRoom, Grade,
  AttendanceRecord, Announcement, Conversation, Message, Payment,
} from '../types';

// ── Students ─────────────────────────────────────────────────────────────────

export const students: Student[] = [
  { id: 's1',  firstName: 'Ahmed',    lastName: 'Benali',    studentId: 'EL-2024-001', classId: 'c1', className: '1ère AS A', level: 'Lycée',   parentName: 'Karim Benali',     parentPhone: '0555 12 34 56', attendanceRate: 95, average: 15.8, status: 'active' },
  { id: 's2',  firstName: 'Sara',     lastName: 'Hamid',     studentId: 'EL-2024-002', classId: 'c1', className: '1ère AS A', level: 'Lycée',   parentName: 'Nadia Hamid',      parentPhone: '0661 98 76 54', attendanceRate: 88, average: 13.2, status: 'active' },
  { id: 's3',  firstName: 'Youcef',   lastName: 'Kaci',      studentId: 'EL-2024-003', classId: 'c1', className: '1ère AS A', level: 'Lycée',   parentName: 'Omar Kaci',        parentPhone: '0770 45 67 89', attendanceRate: 72, average: 10.5, status: 'watch' },
  { id: 's4',  firstName: 'Imane',    lastName: 'Zerrouk',   studentId: 'EL-2024-004', classId: 'c2', className: '4ème A',   level: 'Collège', parentName: 'Hocine Zerrouk',   parentPhone: '0555 22 33 44', attendanceRate: 97, average: 17.1, status: 'active' },
  { id: 's5',  firstName: 'Rayan',    lastName: 'Bouab',     studentId: 'EL-2024-005', classId: 'c2', className: '4ème A',   level: 'Collège', parentName: 'Fatima Bouab',     parentPhone: '0661 55 66 77', attendanceRate: 65, average: 9.4,  status: 'watch' },
  { id: 's6',  firstName: 'Lina',     lastName: 'Meziane',   studentId: 'EL-2024-006', classId: 'c3', className: '5ème B',   level: 'Collège', parentName: 'Samir Meziane',    parentPhone: '0770 11 22 33', attendanceRate: 92, average: 14.6, status: 'active' },
  { id: 's7',  firstName: 'Mohamed',  lastName: 'Boudiaf',   studentId: 'EL-2024-007', classId: 'c3', className: '5ème B',   level: 'Collège', parentName: 'Rachid Boudiaf',   parentPhone: '0555 88 99 00', attendanceRate: 55, average: 8.9,  status: 'suspended' },
  { id: 's8',  firstName: 'Amira',    lastName: 'Bensalah',  studentId: 'EL-2024-008', classId: 'c4', className: 'CM2 A',   level: 'Primaire',parentName: 'Leila Bensalah',   parentPhone: '0661 33 44 55', attendanceRate: 98, average: 18.5, status: 'active' },
  { id: 's9',  firstName: 'Yassine',  lastName: 'Charef',    studentId: 'EL-2024-009', classId: 'c4', className: 'CM2 A',   level: 'Primaire',parentName: 'Djamel Charef',    parentPhone: '0770 66 77 88', attendanceRate: 90, average: 15.3, status: 'active' },
  { id: 's10', firstName: 'Soumia',   lastName: 'Ferhat',    studentId: 'EL-2024-010', classId: 'c5', className: 'CE1 B',   level: 'Primaire',parentName: 'Amel Ferhat',      parentPhone: '0555 44 55 66', attendanceRate: 85, average: 13.9, status: 'active' },
  { id: 's11', firstName: 'Amine',    lastName: 'Ouali',     studentId: 'EL-2024-011', classId: 'c5', className: 'CE1 B',   level: 'Primaire',parentName: 'Mustapha Ouali',   parentPhone: '0661 77 88 99', attendanceRate: 78, average: 11.8, status: 'watch' },
  { id: 's12', firstName: 'Djihane',  lastName: 'Merbah',    studentId: 'EL-2024-012', classId: 'c6', className: '3ème B',  level: 'Collège', parentName: 'Nasser Merbah',    parentPhone: '0770 00 11 22', attendanceRate: 93, average: 12.7, status: 'active' },
  { id: 's13', firstName: 'Karim',    lastName: 'Hadjadj',   studentId: 'EL-2024-013', classId: 'c6', className: '3ème B',  level: 'Collège', parentName: 'Souad Hadjadj',    parentPhone: '0555 66 77 88', attendanceRate: 80, average: 10.2, status: 'watch' },
  { id: 's14', firstName: 'Nesrine',  lastName: 'Belhadj',   studentId: 'EL-2024-014', classId: 'c1', className: '1ère AS A', level: 'Lycée',   parentName: 'Abdelkrim Belhadj',parentPhone: '0661 99 00 11', attendanceRate: 96, average: 16.4, status: 'active' },
  { id: 's15', firstName: 'Bilal',    lastName: 'Tebbal',    studentId: 'EL-2024-015', classId: 'c2', className: '4ème A',   level: 'Collège', parentName: 'Malika Tebbal',    parentPhone: '0770 33 44 55', attendanceRate: 69, average: 9.8,  status: 'watch' },
  { id: 's16', firstName: 'Meriem',   lastName: 'Boukhalfa', studentId: 'EL-2024-016', classId: 'c3', className: '5ème B',   level: 'Collège', parentName: 'Ismail Boukhalfa', parentPhone: '0555 55 66 77', attendanceRate: 91, average: 14.1, status: 'active' },
  { id: 's17', firstName: 'Abdelhak', lastName: 'Guenifi',   studentId: 'EL-2024-017', classId: 'c4', className: 'CM2 A',   level: 'Primaire',parentName: 'Zineb Guenifi',    parentPhone: '0661 22 33 44', attendanceRate: 87, average: 16.0, status: 'active' },
  { id: 's18', firstName: 'Cylia',    lastName: 'Adel',      studentId: 'EL-2024-018', classId: 'c6', className: '3ème B',  level: 'Collège', parentName: 'Tahar Adel',       parentPhone: '0770 88 99 00', attendanceRate: 94, average: 13.5, status: 'active' },
  { id: 's19', firstName: 'Mahdi',    lastName: 'Brahimi',   studentId: 'EL-2024-019', classId: 'c5', className: 'CE1 B',   level: 'Primaire',parentName: 'Yasmine Brahimi',  parentPhone: '0555 11 22 33', attendanceRate: 82, average: 12.3, status: 'active' },
  { id: 's20', firstName: 'Romaissa', lastName: 'Slimani',   studentId: 'EL-2024-020', classId: 'c1', className: '1ère AS A', level: 'Lycée',   parentName: 'Nabil Slimani',    parentPhone: '0661 44 55 66', attendanceRate: 75, average: 11.0, status: 'watch' },
];

// ── Teachers ──────────────────────────────────────────────────────────────────

export const teachers: Teacher[] = [
  { id: 't1',  firstName: 'Meriem',    lastName: 'Saadi',    subject: 'Mathématiques',       classes: ['1ère AS A', '3ème B'],         gradesSubmitted: 48, lastActivity: 'il y a 2 min',  status: 'active' },
  { id: 't2',  firstName: 'Hamid',     lastName: 'Bouzid',   subject: 'Physique-Chimie',     classes: ['1ère AS A', '4ème A'],         gradesSubmitted: 36, lastActivity: 'il y a 30 min', status: 'active' },
  { id: 't3',  firstName: 'Leila',     lastName: 'Mansouri', subject: 'Français',            classes: ['4ème A', '5ème B', '3ème B'],  gradesSubmitted: 54, lastActivity: 'il y a 1h',     status: 'active' },
  { id: 't4',  firstName: 'Karim',     lastName: 'Chaoui',   subject: 'Arabe',               classes: ['CM2 A', 'CE1 B'],              gradesSubmitted: 40, lastActivity: 'Hier',           status: 'active' },
  { id: 't5',  firstName: 'Fatima',    lastName: 'Aoudia',   subject: 'SVT',                 classes: ['5ème B', '4ème A'],            gradesSubmitted: 30, lastActivity: 'il y a 3h',     status: 'active' },
  { id: 't6',  firstName: 'Yacine',    lastName: 'Belkacem', subject: 'Histoire-Géo',        classes: ['3ème B', '5ème B'],            gradesSubmitted: 28, lastActivity: 'il y a 2j',     status: 'active' },
  { id: 't7',  firstName: 'Samia',     lastName: 'Hadj',     subject: 'Anglais',             classes: ['1ère AS A', '4ème A'],         gradesSubmitted: 24, lastActivity: 'il y a 5h',     status: 'active' },
  { id: 't8',  firstName: 'Rachid',    lastName: 'Larbaoui', subject: 'Éducation Islamique', classes: ['CM2 A', '3ème B', '5ème B'],   gradesSubmitted: 18, lastActivity: 'Hier',           status: 'inactive' },
  { id: 't9',  firstName: 'Omar',      lastName: 'Benamara', subject: 'Informatique',        classes: ['1ère AS A'],                   gradesSubmitted: 16, lastActivity: 'il y a 4h',     status: 'active' },
  { id: 't10', firstName: 'Naima',     lastName: 'Zidane',   subject: 'Éducation Physique',  classes: ['4ème A', '5ème B', 'CE1 B'],   gradesSubmitted: 12, lastActivity: 'il y a 1j',     status: 'active' },
];

// ── Classrooms ────────────────────────────────────────────────────────────────

export const classrooms: ClassRoom[] = [
  { id: 'c1', name: '1ère AS A', level: 'Lycée',   teacher: 'Mme. Saadi',    studentCount: 32, average: 14.2, attendanceRate: 93 },
  { id: 'c2', name: '4ème A',   level: 'Collège', teacher: 'Mme. Mansouri', studentCount: 30, average: 12.8, attendanceRate: 88 },
  { id: 'c3', name: '5ème B',   level: 'Collège', teacher: 'M. Belkacem',   studentCount: 28, average: 11.5, attendanceRate: 85 },
  { id: 'c4', name: 'CM2 A',   level: 'Primaire',teacher: 'M. Chaoui',     studentCount: 25, average: 15.5, attendanceRate: 97 },
  { id: 'c5', name: 'CE1 B',   level: 'Primaire',teacher: 'Mme. Zidane',   studentCount: 22, average: 13.9, attendanceRate: 91 },
  { id: 'c6', name: '3ème B',  level: 'Collège', teacher: 'M. Bouzid',     studentCount: 29, average: 12.1, attendanceRate: 87 },
  { id: 'c7', name: '2ème AS A',level: 'Lycée',  teacher: 'Mme. Hadj',     studentCount: 31, average: 13.4, attendanceRate: 90 },
  { id: 'c8', name: 'CE2 A',   level: 'Primaire',teacher: 'Mme. Aoudia',   studentCount: 24, average: 14.8, attendanceRate: 95 },
];

// ── Pending Grades ────────────────────────────────────────────────────────────

export const pendingGrades: Grade[] = [
  { id: 'g1',  studentId: 's1',  studentName: 'Ahmed Benali',    subject: 'Mathématiques',   trimester: 2, continuous: 14.5, test1: 16.0, test2: 15.5, final: 14.0, average: 15.0, status: 'submitted', submittedBy: 'Mme. Saadi',    submittedAt: '27 Fév 2026 09:15', className: '1ère AS A' },
  { id: 'g2',  studentId: 's4',  studentName: 'Imane Zerrouk',   subject: 'Physique-Chimie', trimester: 2, continuous: 16.0, test1: 17.5, test2: 16.5, final: 18.0, average: 17.0, status: 'submitted', submittedBy: 'M. Bouzid',     submittedAt: '27 Fév 2026 08:50', className: '4ème A' },
  { id: 'g3',  studentId: 's6',  studentName: 'Lina Meziane',    subject: 'Français',        trimester: 2, continuous: 13.5, test1: 14.0, test2: 15.0, final: 13.0, average: 13.9, status: 'submitted', submittedBy: 'Mme. Mansouri', submittedAt: '26 Fév 2026 17:30', className: '5ème B' },
  { id: 'g4',  studentId: 's8',  studentName: 'Amira Bensalah',  subject: 'Arabe',            trimester: 2, continuous: 18.0, test1: 19.0, test2: 18.5, final: 19.0, average: 18.6, status: 'submitted', submittedBy: 'M. Chaoui',     submittedAt: '26 Fév 2026 16:00', className: 'CM2 A' },
  { id: 'g5',  studentId: 's12', studentName: 'Djihane Merbah',  subject: 'SVT',              trimester: 2, continuous: 12.0, test1: 13.5, test2: 12.5, final: 12.0, average: 12.5, status: 'submitted', submittedBy: 'Mme. Aoudia',  submittedAt: '25 Fév 2026 14:45', className: '3ème B' },
  { id: 'g6',  studentId: 's14', studentName: 'Nesrine Belhadj', subject: 'Anglais',          trimester: 2, continuous: 15.5, test1: 16.5, test2: 17.0, final: 16.0, average: 16.3, status: 'submitted', submittedBy: 'Mme. Hadj',    submittedAt: '25 Fév 2026 11:20', className: '1ère AS A' },
  { id: 'g7',  studentId: 's16', studentName: 'Meriem Boukhalfa',subject: 'Histoire-Géo',    trimester: 2, continuous: 13.0, test1: 14.5, test2: 13.5, final: 14.0, average: 13.8, status: 'submitted', submittedBy: 'M. Belkacem',   submittedAt: '24 Fév 2026 15:10', className: '5ème B' },
  { id: 'g8',  studentId: 's10', studentName: 'Soumia Ferhat',   subject: 'Informatique',     trimester: 2, continuous: 14.0, test1: 13.0, test2: 14.5, final: 13.5, average: 13.8, status: 'submitted', submittedBy: 'M. Benamara',   submittedAt: '24 Fév 2026 10:30', className: 'CE1 B' },
];

// ── Attendance Today ──────────────────────────────────────────────────────────

export const attendanceToday: AttendanceRecord[] = [
  { id: 'a1',  studentId: 's3',  studentName: 'Youcef Kaci',      className: '1ère AS A', date: '27/02/2026', status: 'absent', excused: false },
  { id: 'a2',  studentId: 's5',  studentName: 'Rayan Bouab',      className: '4ème A',   date: '27/02/2026', status: 'absent', excused: true  },
  { id: 'a3',  studentId: 's7',  studentName: 'Mohamed Boudiaf',  className: '5ème B',   date: '27/02/2026', status: 'absent', excused: false },
  { id: 'a4',  studentId: 's11', studentName: 'Amine Ouali',      className: 'CE1 B',   date: '27/02/2026', status: 'late',   excused: false },
  { id: 'a5',  studentId: 's13', studentName: 'Karim Hadjadj',    className: '3ème B',  date: '27/02/2026', status: 'absent', excused: false },
  { id: 'a6',  studentId: 's15', studentName: 'Bilal Tebbal',     className: '4ème A',   date: '27/02/2026', status: 'late',   excused: true  },
  { id: 'a7',  studentId: 's20', studentName: 'Romaissa Slimani', className: '1ère AS A', date: '27/02/2026', status: 'absent', excused: false },
  { id: 'a8',  studentId: 's2',  studentName: 'Sara Hamid',       className: '1ère AS A', date: '27/02/2026', status: 'late',   excused: false },
  { id: 'a9',  studentId: 's9',  studentName: 'Yassine Charef',   className: 'CM2 A',   date: '27/02/2026', status: 'absent', excused: true  },
  { id: 'a10', studentId: 's16', studentName: 'Meriem Boukhalfa', className: '5ème B',   date: '27/02/2026', status: 'late',   excused: false },
  { id: 'a11', studentId: 's18', studentName: 'Cylia Adel',       className: '3ème B',  date: '27/02/2026', status: 'absent', excused: false },
  { id: 'a12', studentId: 's19', studentName: 'Mahdi Brahimi',    className: 'CE1 B',   date: '27/02/2026', status: 'late',   excused: true  },
  { id: 'a13', studentId: 's12', studentName: 'Djihane Merbah',   className: '3ème B',  date: '27/02/2026', status: 'absent', excused: false },
  { id: 'a14', studentId: 's17', studentName: 'Abdelhak Guenifi', className: 'CM2 A',   date: '27/02/2026', status: 'absent', excused: true  },
  { id: 'a15', studentId: 's6',  studentName: 'Lina Meziane',     className: '5ème B',   date: '27/02/2026', status: 'late',   excused: false },
];

// ── Announcements ─────────────────────────────────────────────────────────────

export const announcements: Announcement[] = [
  {
    id: 'an1',
    title: 'Calendrier des examens du 2ème trimestre',
    body: 'Les examens du deuxième trimestre se dérouleront du 10 au 20 mars 2026. Veuillez consulter le planning détaillé affiché dans chaque classe et sur le portail parents.',
    author: 'Direction',
    date: '27 Fév 2026',
    audience: 'Tous',
    urgent: true,
    icon: '📋',
  },
  {
    id: 'an2',
    title: 'Réunion parents-enseignants — 5 Mars à 18h',
    body: "Une réunion avec les parents d'élèves est prévue le jeudi 5 mars 2026 à 18h00 dans la grande salle. La présence de tous les parents est vivement souhaitée.",
    author: 'Administration',
    date: '25 Fév 2026',
    audience: 'Parents',
    urgent: false,
    icon: '👥',
  },
  {
    id: 'an3',
    title: 'Sortie pédagogique — Musée National d\'Alger',
    body: "Une sortie scolaire au Musée National d'Alger est organisée le 12 mars pour les classes de 3ème et 4ème. Merci de retourner les autorisations parentales avant le 5 mars.",
    author: 'M. Belkacem',
    date: '24 Fév 2026',
    audience: 'Élèves',
    urgent: false,
    icon: '🏛️',
  },
  {
    id: 'an4',
    title: 'Perturbation des cours — Jeudi 27 Fév',
    body: "En raison d'une formation pédagogique, les cours de l'après-midi sont annulés pour les niveaux Collège uniquement. Les cours du matin se déroulent normalement.",
    author: 'Direction',
    date: '26 Fév 2026',
    audience: 'Tous',
    urgent: true,
    icon: '⚠️',
  },
  {
    id: 'an5',
    title: 'Nouveaux manuels scolaires disponibles',
    body: "Les nouveaux manuels de Physique-Chimie pour la 1ère AS sont disponibles à la bibliothèque à partir du lundi 2 mars. Les élèves peuvent les retirer avec leur carte scolaire.",
    author: 'M. Bouzid',
    date: '22 Fév 2026',
    audience: 'Élèves',
    urgent: false,
    icon: '📚',
  },
  {
    id: 'an6',
    title: 'Rappel — Paiement 2ème tranche des frais',
    body: "Nous rappelons aux familles que la deuxième tranche des frais de scolarité est due avant le 15 mars 2026. Passé ce délai, des pénalités de retard s'appliqueront.",
    author: 'Administration',
    date: '20 Fév 2026',
    audience: 'Parents',
    urgent: false,
    icon: '💳',
  },
];

// ── Conversations & Messages ──────────────────────────────────────────────────

const makeMessage = (id: string, senderId: string, senderName: string, senderRole: Message['senderRole'], content: string, sentAt: string, read: boolean): Message =>
  ({ id, senderId, senderName, senderRole, content, sentAt, read });

export const conversations: Conversation[] = [
  {
    id: 'cv1',
    participantName: 'Mme. Benali',
    participantRole: "Parent d'Ahmed Benali",
    relatedStudent: 'Ahmed Benali',
    lastMessage: 'Merci pour votre retour, à bientôt !',
    lastTime: 'il y a 2 min',
    unreadCount: 2,
    online: true,
    messages: [
      makeMessage('m1a', 'p1', 'Mme. Benali',  'parent', 'Bonjour, j\'aimerais avoir des nouvelles sur les résultats de mon fils Ahmed en mathématiques.', '09:10', true),
      makeMessage('m1b', 'admin', 'Admin',      'admin',  'Bonjour Mme. Benali ! Ahmed se débrouille très bien. Sa moyenne en maths est de 15,8/20 ce trimestre.', '09:14', true),
      makeMessage('m1c', 'p1', 'Mme. Benali',  'parent', 'C\'est une excellente nouvelle ! Est-ce qu\'il participe bien en classe ?', '09:18', true),
      makeMessage('m1d', 'admin', 'Admin',      'admin',  'Oui, il est très actif et sérieux. Nous sommes très contents de lui.', '09:22', true),
      makeMessage('m1e', 'p1', 'Mme. Benali',  'parent', 'Merci pour votre retour, à bientôt !', '09:25', false),
    ],
  },
  {
    id: 'cv2',
    participantName: 'M. Zerrouk',
    participantRole: "Parent d'Imane Zerrouk",
    relatedStudent: 'Imane Zerrouk',
    lastMessage: 'D\'accord, nous en parlerons à la réunion.',
    lastTime: 'il y a 45 min',
    unreadCount: 1,
    online: false,
    messages: [
      makeMessage('m2a', 'p2', 'M. Zerrouk',  'parent', 'Bonjour, ma fille Imane est-elle toujours en tête de classe ?', '08:30', true),
      makeMessage('m2b', 'admin', 'Admin',     'admin',  'Bonjour M. Zerrouk ! Oui, Imane est l\'une de nos meilleures élèves avec une moyenne de 17,1/20.', '08:35', true),
      makeMessage('m2c', 'p2', 'M. Zerrouk',  'parent', 'Excellent ! Y a-t-il des domaines où elle pourrait encore progresser ?', '08:40', true),
      makeMessage('m2d', 'admin', 'Admin',     'admin',  'Elle peut encore améliorer un peu son expression écrite en Français. Sinon, elle est exemplaire.', '08:50', true),
      makeMessage('m2e', 'p2', 'M. Zerrouk',  'parent', 'D\'accord, nous en parlerons à la réunion.', '09:05', false),
    ],
  },
  {
    id: 'cv3',
    participantName: 'Mme. Bouab',
    participantRole: "Parent de Rayan Bouab",
    relatedStudent: 'Rayan Bouab',
    lastMessage: 'Nous allons renforcer son suivi à la maison.',
    lastTime: 'il y a 2h',
    unreadCount: 0,
    online: false,
    messages: [
      makeMessage('m3a', 'p3', 'Mme. Bouab', 'parent', 'Bonsoir, j\'ai reçu un avertissement concernant les absences de Rayan. Pouvez-vous me donner plus de détails ?', '17:00', true),
      makeMessage('m3b', 'admin', 'Admin',    'admin',  'Bonsoir Mme. Bouab. En effet, Rayan a été absent 8 fois ce mois-ci sans justificatif. Son taux de présence est à 65%.', '17:05', true),
      makeMessage('m3c', 'p3', 'Mme. Bouab', 'parent', 'Je suis désolée, il y a eu des problèmes familiaux. Nous allons régler cela rapidement.', '17:10', true),
      makeMessage('m3d', 'admin', 'Admin',    'admin',  'Je comprends. N\'hésitez pas à nous fournir des justificatifs. Un suivi renforcé est mis en place.', '17:15', true),
      makeMessage('m3e', 'p3', 'Mme. Bouab', 'parent', 'Nous allons renforcer son suivi à la maison.', '17:20', true),
      makeMessage('m3f', 'admin', 'Admin',    'admin',  'Très bien, nous comptons sur vous. Bonne soirée !', '17:22', true),
    ],
  },
  {
    id: 'cv4',
    participantName: 'Ahmed Benali',
    participantRole: 'Élève — 1ère AS A',
    relatedStudent: 'Ahmed Benali',
    lastMessage: 'Merci M. je vais réviser ça ce soir.',
    lastTime: 'Hier',
    unreadCount: 0,
    online: true,
    messages: [
      makeMessage('m4a', 's1', 'Ahmed Benali', 'teacher', 'Monsieur, j\'ai une question sur l\'exercice 5 de la feuille de physique distribuée aujourd\'hui.', '14:00', true),
      makeMessage('m4b', 'admin', 'Admin',      'admin',   'Bien sûr Ahmed. De quel aspect de l\'exercice as-tu du mal à comprendre ?', '14:10', true),
      makeMessage('m4c', 's1', 'Ahmed Benali', 'teacher', 'Je ne comprends pas comment appliquer la loi de Lenz dans la partie b).', '14:15', true),
      makeMessage('m4d', 'admin', 'Admin',      'admin',   'La loi de Lenz dit que le courant induit s\'oppose à la variation du flux. Dans la partie b), le flux augmente donc le courant s\'oppose à cette augmentation.', '14:25', true),
      makeMessage('m4e', 's1', 'Ahmed Benali', 'teacher', 'Merci M. je vais réviser ça ce soir.', '14:30', true),
    ],
  },
  {
    id: 'cv5',
    participantName: 'Mme. Merbah',
    participantRole: "Parent de Djihane Merbah",
    relatedStudent: 'Djihane Merbah',
    lastMessage: 'Je viendrai passer vous voir vendredi matin.',
    lastTime: 'il y a 3j',
    unreadCount: 0,
    online: false,
    messages: [
      makeMessage('m5a', 'p5', 'Mme. Merbah', 'parent', 'Bonjour, je voudrais prendre rendez-vous pour discuter du dossier de Djihane.', '10:00', true),
      makeMessage('m5b', 'admin', 'Admin',     'admin',  'Bonjour Mme. Merbah. Bien sûr, nous sommes disponibles du lundi au jeudi de 8h à 16h.', '10:15', true),
      makeMessage('m5c', 'p5', 'Mme. Merbah', 'parent', 'Est-ce que vendredi matin serait possible ?', '10:30', true),
      makeMessage('m5d', 'admin', 'Admin',     'admin',  'Oui, vendredi de 9h à 12h convient parfaitement.', '10:45', true),
      makeMessage('m5e', 'p5', 'Mme. Merbah', 'parent', 'Je viendrai passer vous voir vendredi matin.', '11:00', true),
    ],
  },
  {
    id: 'cv6',
    participantName: 'M. Hadjadj',
    participantRole: "Parent de Karim Hadjadj",
    relatedStudent: 'Karim Hadjadj',
    lastMessage: 'On compte sur vous pour l\'aider à remonter.',
    lastTime: 'il y a 5j',
    unreadCount: 3,
    online: false,
    messages: [
      makeMessage('m6a', 'p6', 'M. Hadjadj', 'parent', 'Bonjour, la moyenne de Karim est très basse ce trimestre. Qu\'est-ce qui se passe ?', '15:00', true),
      makeMessage('m6b', 'admin', 'Admin',    'admin',  'Bonjour M. Hadjadj. Karim a du mal à se concentrer en classe et ses devoirs sont souvent incomplets.', '15:10', true),
      makeMessage('m6c', 'p6', 'M. Hadjadj', 'parent', 'Nous ne l\'avons pas remarqué à la maison. Y a-t-il eu des incidents particuliers ?', '15:20', true),
      makeMessage('m6d', 'admin', 'Admin',    'admin',  'Pas d\'incidents, mais il semble distrait. Nous suggérons un suivi avec notre psychologue scolaire.', '15:35', true),
      makeMessage('m6e', 'p6', 'M. Hadjadj', 'parent', 'C\'est une bonne idée. Merci pour votre attention.', '15:50', false),
      makeMessage('m6f', 'p6', 'M. Hadjadj', 'parent', 'On compte sur vous pour l\'aider à remonter.', '15:52', false),
    ],
  },
];

// ── Payments ──────────────────────────────────────────────────────────────────

export const payments: Payment[] = [
  { id: 'py1',  studentId: 's1',  studentName: 'Ahmed Benali',    className: '1ère AS A', totalFee: 64000, paid: 64000, balance: 0,     status: 'paid'    },
  { id: 'py2',  studentId: 's2',  studentName: 'Sara Hamid',      className: '1ère AS A', totalFee: 64000, paid: 32000, balance: 32000, status: 'partial' },
  { id: 'py3',  studentId: 's3',  studentName: 'Youcef Kaci',     className: '1ère AS A', totalFee: 64000, paid: 0,     balance: 64000, status: 'unpaid'  },
  { id: 'py4',  studentId: 's4',  studentName: 'Imane Zerrouk',   className: '4ème A',   totalFee: 52000, paid: 52000, balance: 0,     status: 'paid'    },
  { id: 'py5',  studentId: 's5',  studentName: 'Rayan Bouab',     className: '4ème A',   totalFee: 52000, paid: 26000, balance: 26000, status: 'partial' },
  { id: 'py6',  studentId: 's6',  studentName: 'Lina Meziane',    className: '5ème B',   totalFee: 52000, paid: 52000, balance: 0,     status: 'paid'    },
  { id: 'py7',  studentId: 's7',  studentName: 'Mohamed Boudiaf', className: '5ème B',   totalFee: 52000, paid: 0,     balance: 52000, status: 'unpaid'  },
  { id: 'py8',  studentId: 's8',  studentName: 'Amira Bensalah',  className: 'CM2 A',   totalFee: 38000, paid: 38000, balance: 0,     status: 'paid'    },
  { id: 'py9',  studentId: 's9',  studentName: 'Yassine Charef',  className: 'CM2 A',   totalFee: 38000, paid: 19000, balance: 19000, status: 'partial' },
  { id: 'py10', studentId: 's10', studentName: 'Soumia Ferhat',   className: 'CE1 B',   totalFee: 30000, paid: 30000, balance: 0,     status: 'paid'    },
  { id: 'py11', studentId: 's11', studentName: 'Amine Ouali',     className: 'CE1 B',   totalFee: 30000, paid: 0,     balance: 30000, status: 'unpaid'  },
  { id: 'py12', studentId: 's12', studentName: 'Djihane Merbah',  className: '3ème B',  totalFee: 52000, paid: 52000, balance: 0,     status: 'paid'    },
  { id: 'py13', studentId: 's13', studentName: 'Karim Hadjadj',   className: '3ème B',  totalFee: 52000, paid: 26000, balance: 26000, status: 'partial' },
  { id: 'py14', studentId: 's14', studentName: 'Nesrine Belhadj', className: '1ère AS A', totalFee: 64000, paid: 64000, balance: 0,     status: 'paid'    },
  { id: 'py15', studentId: 's15', studentName: 'Bilal Tebbal',    className: '4ème A',   totalFee: 52000, paid: 0,     balance: 52000, status: 'unpaid'  },
];

// ── Chart Data ────────────────────────────────────────────────────────────────

export const weeklyAttendance = [
  { day: 'Dimanche', rate: 94 },
  { day: 'Lundi',    rate: 91 },
  { day: 'Mardi',    rate: 96 },
  { day: 'Mercredi', rate: 89 },
  { day: 'Jeudi',    rate: 92 },
];

export const classAverages = [
  { className: '1ère AS A', average: 14.2 },
  { className: '4ème A',    average: 12.8 },
  { className: '5ème B',    average: 11.5 },
  { className: 'CM2 A',     average: 15.1 },
  { className: 'CE1 B',     average: 13.9 },
  { className: '3ème B',    average: 12.1 },
];
