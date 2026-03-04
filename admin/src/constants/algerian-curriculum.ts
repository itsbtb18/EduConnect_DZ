/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ALGERIAN CURRICULUM — Données de référence MEN (Ministère de          ║
 * ║  l'Éducation Nationale) pour le système éducatif algérien.             ║
 * ║                                                                         ║
 * ║  Ces données sont des suggestions pré-remplies. L'admin peut les       ║
 * ║  modifier librement selon les spécificités de son établissement.       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ─── Cycle Colors ────────────────────────────────────────────────────────
export const CYCLE_COLORS = {
  PRIMARY: { bg: '#10b981', light: '#d1fae5', text: '#065f46', label: 'Primaire' },
  MIDDLE:  { bg: '#f59e0b', light: '#fef3c7', text: '#92400e', label: 'CEM (Moyen)' },
  HIGH:    { bg: '#ef4444', light: '#fee2e2', text: '#991b1b', label: 'Lycée' },
} as const;

export type CycleType = keyof typeof CYCLE_COLORS;

// ─── Filières (Streams) Lycée ────────────────────────────────────────────
export interface StreamDef {
  code: string;
  name: string;
  shortName: string;
  isTroncCommun: boolean;
  color: string;
}

export const TRONC_COMMUN_STREAMS: StreamDef[] = [
  { code: 'TC_SCI', name: 'Sciences et Technologies', shortName: 'TC Sciences', isTroncCommun: true, color: '#3b82f6' },
  { code: 'TC_LET', name: 'Lettres', shortName: 'TC Lettres', isTroncCommun: true, color: '#a855f7' },
];

export const LYCEE_STREAMS: StreamDef[] = [
  { code: 'SE',   name: 'Sciences Expérimentales',  shortName: 'Sc. Exp.',    isTroncCommun: false, color: '#10b981' },
  { code: 'MATH', name: 'Mathématiques',            shortName: 'Maths',       isTroncCommun: false, color: '#3b82f6' },
  { code: 'TM',   name: 'Technique Mathématiques',  shortName: 'Tech Maths',  isTroncCommun: false, color: '#06b6d4' },
  { code: 'LPH',  name: 'Lettres et Philosophie',   shortName: 'Lettres/Philo', isTroncCommun: false, color: '#a855f7' },
  { code: 'LE',   name: 'Langues Étrangères',       shortName: 'Langues Étr.', isTroncCommun: false, color: '#ec4899' },
  { code: 'GE',   name: 'Gestion et Économie',      shortName: 'Gestion/Éco', isTroncCommun: false, color: '#f59e0b' },
];

export const ALL_STREAMS = [...TRONC_COMMUN_STREAMS, ...LYCEE_STREAMS];

// ─── Levels / Niveaux ────────────────────────────────────────────────────
export interface LevelDef {
  code: string;
  name: string;
  cycle: CycleType;
  order: number;
  maxGrade: number;
  passingGrade: number;
  hasStreams: boolean;
  /** stream codes that apply to this level */
  streamCodes?: string[];
}

export const LEVELS: LevelDef[] = [
  // ── Primaire (/10, seuil 5)
  { code: 'PREP', name: 'Préparatoire',            cycle: 'PRIMARY', order: 0, maxGrade: 10, passingGrade: 5, hasStreams: false },
  { code: '1AP',  name: '1ère Année Primaire',     cycle: 'PRIMARY', order: 1, maxGrade: 10, passingGrade: 5, hasStreams: false },
  { code: '2AP',  name: '2ème Année Primaire',     cycle: 'PRIMARY', order: 2, maxGrade: 10, passingGrade: 5, hasStreams: false },
  { code: '3AP',  name: '3ème Année Primaire',     cycle: 'PRIMARY', order: 3, maxGrade: 10, passingGrade: 5, hasStreams: false },
  { code: '4AP',  name: '4ème Année Primaire',     cycle: 'PRIMARY', order: 4, maxGrade: 10, passingGrade: 5, hasStreams: false },
  { code: '5AP',  name: '5ème Année Primaire',     cycle: 'PRIMARY', order: 5, maxGrade: 10, passingGrade: 5, hasStreams: false },
  // ── Moyen (/20, seuil 10)
  { code: '1AM',  name: '1ère Année Moyenne',      cycle: 'MIDDLE', order: 1, maxGrade: 20, passingGrade: 10, hasStreams: false },
  { code: '2AM',  name: '2ème Année Moyenne',      cycle: 'MIDDLE', order: 2, maxGrade: 20, passingGrade: 10, hasStreams: false },
  { code: '3AM',  name: '3ème Année Moyenne',      cycle: 'MIDDLE', order: 3, maxGrade: 20, passingGrade: 10, hasStreams: false },
  { code: '4AM',  name: '4ème Année Moyenne',      cycle: 'MIDDLE', order: 4, maxGrade: 20, passingGrade: 10, hasStreams: false },
  // ── Lycée (/20, seuil 10)
  { code: '1AS',  name: '1ère Année Secondaire',   cycle: 'HIGH', order: 1, maxGrade: 20, passingGrade: 10, hasStreams: true, streamCodes: ['TC_SCI', 'TC_LET'] },
  { code: '2AS',  name: '2ème Année Secondaire',   cycle: 'HIGH', order: 2, maxGrade: 20, passingGrade: 10, hasStreams: true, streamCodes: ['SE', 'MATH', 'TM', 'LPH', 'LE', 'GE'] },
  { code: '3AS',  name: '3ème Année Secondaire',   cycle: 'HIGH', order: 3, maxGrade: 20, passingGrade: 10, hasStreams: true, streamCodes: ['SE', 'MATH', 'TM', 'LPH', 'LE', 'GE'] },
];

export const LEVELS_BY_CYCLE = {
  PRIMARY: LEVELS.filter(l => l.cycle === 'PRIMARY'),
  MIDDLE:  LEVELS.filter(l => l.cycle === 'MIDDLE'),
  HIGH:    LEVELS.filter(l => l.cycle === 'HIGH'),
};

// ─── Subject Catalog ──────────────────────────────────────────────────────
export interface SubjectDef {
  code: string;
  name: string;
  arabicName: string;
  color: string;
}

export const SUBJECTS: Record<string, SubjectDef> = {
  ARAB:  { code: 'ARAB', name: 'Langue Arabe',             arabicName: 'اللغة العربية',      color: '#4CAF50' },
  MATH:  { code: 'MATH', name: 'Mathématiques',            arabicName: 'الرياضيات',          color: '#2196F3' },
  FR:    { code: 'FR',   name: 'Langue Française',         arabicName: 'اللغة الفرنسية',     color: '#FF9800' },
  EN:    { code: 'EN',   name: 'Langue Anglaise',          arabicName: 'اللغة الإنجليزية',    color: '#E91E63' },
  SCI:   { code: 'SCI',  name: 'Sciences Naturelles',      arabicName: 'علوم الطبيعة و الحياة', color: '#8BC34A' },
  PHY:   { code: 'PHY',  name: 'Sciences Physiques',       arabicName: 'العلوم الفيزيائية',    color: '#00BCD4' },
  HIS:   { code: 'HIS',  name: 'Histoire',                 arabicName: 'التاريخ',             color: '#795548' },
  GEO:   { code: 'GEO',  name: 'Géographie',              arabicName: 'الجغرافيا',           color: '#607D8B' },
  EDC:   { code: 'EDC',  name: 'Éducation Civique',        arabicName: 'التربية المدنية',     color: '#9C27B0' },
  EIS:   { code: 'EIS',  name: 'Éducation Islamique',      arabicName: 'التربية الإسلامية',   color: '#009688' },
  EPS:   { code: 'EPS',  name: 'Éducation Physique',       arabicName: 'التربية البدنية',     color: '#FF5722' },
  ART:   { code: 'ART',  name: 'Éducation Artistique',     arabicName: 'التربية الفنية',      color: '#FFEB3B' },
  MUS:   { code: 'MUS',  name: 'Éducation Musicale',       arabicName: 'التربية الموسيقية',   color: '#AB47BC' },
  TEC:   { code: 'TEC',  name: 'Éducation Technologique',  arabicName: 'التربية التكنولوجية', color: '#3F51B5' },
  INF:   { code: 'INF',  name: 'Informatique',             arabicName: 'الإعلام الآلي',       color: '#1565C0' },
  PHI:   { code: 'PHI',  name: 'Philosophie',              arabicName: 'الفلسفة',             color: '#6D4C41' },
  ECO:   { code: 'ECO',  name: 'Économie et Gestion',      arabicName: 'التسيير المحاسبي',    color: '#43A047' },
  GES:   { code: 'GES',  name: 'Comptabilité',             arabicName: 'المحاسبة',            color: '#558B2F' },
  DRT:   { code: 'DRT',  name: 'Droit',                    arabicName: 'القانون',             color: '#455A64' },
  ESP:   { code: 'ESP',  name: 'Langue Espagnole',         arabicName: 'اللغة الإسبانية',     color: '#D32F2F' },
  TAM:   { code: 'TAM',  name: 'Tamazight',                arabicName: 'اللغة الأمازيغية',    color: '#00897B' },
};

// ─── Subject Assignments per Level (subjectCode, coefficient, isMandatory) ──
export type SubjectAssignment = [
  subjectCode: string,
  coefficient: number,
  isMandatory: boolean,
];

// ── PRIMAIRE ─────────────────────────────────────────────────────────
export const PRIMAIRE_SUBJECTS: Record<string, SubjectAssignment[]> = {
  PREP: [
    ['ARAB', 1, true], ['MATH', 1, true], ['EIS', 1, true],
    ['EDC', 1, true], ['ART', 1, true], ['EPS', 1, true],
  ],
  '1AP': [
    ['ARAB', 1, true], ['MATH', 1, true], ['EIS', 1, true],
    ['EDC', 1, true], ['ART', 1, true], ['EPS', 1, true],
  ],
  '2AP': [
    ['ARAB', 1, true], ['MATH', 1, true], ['EIS', 1, true],
    ['EDC', 1, true], ['ART', 1, true], ['EPS', 1, true],
  ],
  '3AP': [
    ['ARAB', 1, true], ['FR', 1, true], ['MATH', 1, true],
    ['EIS', 1, true], ['EDC', 1, true], ['SCI', 1, true],
    ['ART', 1, true], ['EPS', 1, true],
  ],
  '4AP': [
    ['ARAB', 1, true], ['FR', 1, true], ['MATH', 1, true],
    ['EIS', 1, true], ['EDC', 1, true], ['SCI', 1, true],
    ['HIS', 1, true], ['GEO', 1, true], ['ART', 1, true], ['EPS', 1, true],
  ],
  '5AP': [
    ['ARAB', 1, true], ['FR', 1, true], ['MATH', 1, true],
    ['EIS', 1, true], ['EDC', 1, true], ['SCI', 1, true],
    ['HIS', 1, true], ['GEO', 1, true], ['ART', 1, true], ['EPS', 1, true],
  ],
};

// ── MOYEN (CEM) — même programme pour 1AM→4AM ──────────────────────
const CEM_COMMON: SubjectAssignment[] = [
  ['ARAB', 5, true], ['FR', 4, true], ['EN', 2, true],
  ['MATH', 5, true], ['SCI', 3, true], ['PHY', 3, true],
  ['HIS', 2, true], ['GEO', 2, true], ['EDC', 1, true],
  ['EIS', 2, true], ['TEC', 1, true], ['INF', 1, true],
  ['EPS', 1, true], ['ART', 1, true], ['MUS', 1, true],
];
export const MOYEN_SUBJECTS: Record<string, SubjectAssignment[]> = {
  '1AM': CEM_COMMON,
  '2AM': CEM_COMMON,
  '3AM': CEM_COMMON,
  '4AM': CEM_COMMON,
};

// ── LYCÉE 1AS — Troncs Communs ──────────────────────────────────────
export const LYCEE_1AS_SUBJECTS: Record<string, SubjectAssignment[]> = {
  TC_SCI: [
    ['ARAB', 3, true], ['FR', 3, true], ['EN', 2, true],
    ['MATH', 5, true], ['SCI', 4, true], ['PHY', 4, true],
    ['HIS', 2, true], ['GEO', 2, true], ['EIS', 2, true],
    ['PHI', 2, true], ['INF', 1, true], ['EPS', 1, true],
  ],
  TC_LET: [
    ['ARAB', 5, true], ['FR', 4, true], ['EN', 3, true],
    ['MATH', 3, true], ['SCI', 2, true], ['PHY', 2, true],
    ['HIS', 3, true], ['GEO', 2, true], ['EIS', 2, true],
    ['PHI', 3, true], ['INF', 1, true], ['EPS', 1, true],
  ],
};

// ── LYCÉE 2AS/3AS — Par Filière (coefficients BAC officiels) ────────
export const LYCEE_FILIERE_SUBJECTS: Record<string, SubjectAssignment[]> = {
  SE: [
    ['MATH', 5, true], ['PHY', 5, true], ['SCI', 4, true],
    ['ARAB', 2, true], ['FR', 2, true], ['EN', 2, true],
    ['EIS', 2, true], ['HIS', 1, true], ['GEO', 1, true], ['EPS', 1, true],
  ],
  MATH: [
    ['MATH', 6, true], ['PHY', 5, true],
    ['ARAB', 2, true], ['FR', 2, true], ['EN', 2, true],
    ['EIS', 2, true], ['PHI', 2, true], ['EPS', 1, true],
  ],
  TM: [
    ['MATH', 5, true], ['TEC', 5, true], ['PHY', 4, true],
    ['ARAB', 2, true], ['FR', 2, true], ['EN', 2, true],
    ['EIS', 2, true], ['EPS', 1, true],
  ],
  LPH: [
    ['PHI', 5, true], ['ARAB', 5, true], ['HIS', 3, true], ['GEO', 3, false],
    ['FR', 3, true], ['EN', 2, true], ['EIS', 2, true], ['EPS', 1, true],
  ],
  LE: [
    ['ARAB', 4, true], ['FR', 4, true], ['EN', 4, true],
    ['HIS', 2, true], ['GEO', 2, false], ['PHI', 2, true],
    ['EIS', 2, true], ['ESP', 3, false], ['EPS', 1, true],
  ],
  GE: [
    ['ECO', 4, true], ['GES', 4, true], ['MATH', 3, true],
    ['ARAB', 2, true], ['FR', 2, true], ['EN', 2, true],
    ['EIS', 2, true], ['HIS', 1, true], ['GEO', 1, false], ['EPS', 1, true],
  ],
};

// ─── Helper: get subjects for a level + optional stream ──────────────
export function getSubjectsForLevel(
  levelCode: string,
  streamCode?: string | null,
): SubjectAssignment[] {
  // Primaire
  if (PRIMAIRE_SUBJECTS[levelCode]) return PRIMAIRE_SUBJECTS[levelCode];
  // Moyen
  if (MOYEN_SUBJECTS[levelCode]) return MOYEN_SUBJECTS[levelCode];
  // Lycée 1AS
  if (levelCode === '1AS' && streamCode && LYCEE_1AS_SUBJECTS[streamCode]) {
    return LYCEE_1AS_SUBJECTS[streamCode];
  }
  // Lycée 2AS/3AS
  if ((levelCode === '2AS' || levelCode === '3AS') && streamCode && LYCEE_FILIERE_SUBJECTS[streamCode]) {
    return LYCEE_FILIERE_SUBJECTS[streamCode];
  }
  return [];
}

// ─── Default class naming ────────────────────────────────────────────
/**
 * Generate default class names for a given level/stream.
 * e.g. levelCode=3AM, count=2 → ["3AM-1", "3AM-2"]
 * e.g. levelCode=2AS, streamCode=SE, count=2 → ["2AS-SC-1", "2AS-SC-2"]
 */
export function generateClassNames(
  levelCode: string,
  count: number,
  streamCode?: string | null,
): string[] {
  const streamPrefix = streamCode
    ? `-${streamCode.replace('TC_', '')}`
    : '';
  return Array.from({ length: count }, (_, i) =>
    `${levelCode}${streamPrefix}-${i + 1}`,
  );
}

// ─── Default trimester dates ─────────────────────────────────────────
export function getDefaultTrimesters(startYear: number) {
  return [
    { number: 1, label: 'Trimestre 1', startDate: `${startYear}-09-01`, endDate: `${startYear + 1}-01-15` },
    { number: 2, label: 'Trimestre 2', startDate: `${startYear + 1}-01-16`, endDate: `${startYear + 1}-04-15` },
    { number: 3, label: 'Trimestre 3', startDate: `${startYear + 1}-04-16`, endDate: `${startYear + 1}-06-30` },
  ];
}

// ─── Grading formula descriptions ────────────────────────────────────
export const GRADING_FORMULAS = {
  trimester: 'Moyenne trimestrielle = Σ(note × coeff) ÷ Σ(coefficients)',
  annual: 'Moyenne annuelle = (T1 + T2 + T3) ÷ 3',
};
