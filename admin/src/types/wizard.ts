/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  Setup Wizard — TypeScript types for the 9-step school admin wizard    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import type { CycleType } from '../constants/algerian-curriculum';

// ─── Step Definitions ─────────────────────────────────────────────────
export const WIZARD_STEPS = [
  { key: 'profile',     label: 'Profil',                 icon: 'School' },
  { key: 'academic',    label: 'Année Scolaire',         icon: 'Calendar' },
  { key: 'sections',    label: 'Sections',               icon: 'Layers' },
  { key: 'levels',      label: 'Niveaux & Classes',      icon: 'GraduationCap' },
  { key: 'subjects',    label: 'Matières & Coefficients', icon: 'BookOpen' },
  { key: 'teachers',    label: 'Enseignants',            icon: 'Users' },
  { key: 'students',    label: 'Élèves',                  icon: 'UserPlus' },
  { key: 'summary',     label: 'Récapitulatif',          icon: 'ClipboardCheck' },
  { key: 'finish',      label: 'Terminer',               icon: 'Rocket' },
] as const;

export type WizardStepKey = typeof WIZARD_STEPS[number]['key'];

// ─── Per-Step Data ────────────────────────────────────────────────────

export interface ProfileData {
  name: string;
  address: string;
  wilaya: string;
  phone: string;
  email: string;
  website: string;
  motto: string;
  logo?: File | string | null;
}

export interface TrimesterConfig {
  number: 1 | 2 | 3;
  label: string;
  startDate: string;
  endDate: string;
}

export interface AcademicYearData {
  name: string;
  startDate: string;
  endDate: string;
  trimesters: TrimesterConfig[];
}

export interface SectionConfig {
  type: 'PRIMARY' | 'MIDDLE' | 'HIGH';
  enabled: boolean;
  gradingMax: number;
  passingGrade: number;
}

/** Custom stream/group added by the admin (not from MEN curriculum) */
export interface CustomStream {
  tempId: string;
  name: string;
  code: string;
  color: string;
  classCount: number;
}

export interface LevelConfig {
  code: string;
  name: string;
  cycle: CycleType;
  enabled: boolean;
  /** Number of classes — for levels without streams */
  classCount: number;
  /** Custom names for auto-generated classes, keyed by default name e.g. "1AM-1" */
  classNames: Record<string, string>;
  /** For levels with streams: how many classes per stream */
  streamClasses: Record<string, number>;
  /** Custom names for stream classes, keyed by default name e.g. "1AS-SCI-1" */
  streamClassNames: Record<string, string>;
  /** Which streams are enabled for this level */
  enabledStreams: string[];
  /** Custom streams/groups added by the admin */
  customStreams: CustomStream[];
}

export interface SubjectConfig {
  subjectCode: string;
  subjectName: string;
  arabicName: string;
  coefficient: number;
  isMandatory: boolean;
  color: string;
  /** True for admin-created subjects (not from MEN curriculum) */
  isCustom?: boolean;
}

export interface LevelSubjectConfig {
  levelCode: string;
  streamCode?: string | null;
  subjects: SubjectConfig[];
}

export interface TeacherEntry {
  tempId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  /** Sections the teacher teaches in: 'PRIMARY' | 'MIDDLE' | 'HIGH' */
  sectionTypes: string[];
  subjectCodes: string[];
  /** Class IDs (from savedEntities.classIds keys) the teacher is assigned to */
  classAssignments: string[];
  password: string;
}

export interface StudentEntry {
  tempId: string;
  firstName: string;
  lastName: string;
  phone: string;
  parentPhone: string;
  classAssignment: string; // class name
  dateOfBirth?: string;
}

// ─── Aggregate Wizard State ──────────────────────────────────────────

export interface WizardState {
  currentStep: number;
  /** Sub-step within step 4 (levels): 'select' | 'classes' */
  levelsSubStep: 'select' | 'classes';
  profile: ProfileData;
  academic: AcademicYearData;
  sections: SectionConfig[];
  levels: LevelConfig[];
  subjects: LevelSubjectConfig[];
  teachers: TeacherEntry[];
  students: StudentEntry[];
  /** IDs of entities already saved to the backend */
  savedEntities: {
    academicYearId?: string;
    sectionIds: Record<string, string>;
    levelIds: Record<string, string>;
    streamIds: Record<string, string>;
    classIds: Record<string, string>;
    subjectIds: Record<string, string>;
    levelSubjectIds: string[];
    teacherIds: string[];
    studentIds: string[];
  };
  /** Dirty flags for incremental saving */
  dirty: Record<WizardStepKey, boolean>;
}

// ─── Wizard Context ──────────────────────────────────────────────────
export interface WizardContextType {
  state: WizardState;
  // Navigation
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  canGoNext: boolean;
  // Step 4 sub-navigation
  setLevelsSubStep: (sub: 'select' | 'classes') => void;
  // Data setters
  updateProfile: (data: Partial<ProfileData>) => void;
  updateAcademic: (data: Partial<AcademicYearData>) => void;
  updateSections: (sections: SectionConfig[]) => void;
  updateLevel: (code: string, data: Partial<LevelConfig>) => void;
  updateSubjects: (levelCode: string, streamCode: string | null, subjects: SubjectConfig[]) => void;
  resetSubjectsToMEN: (levelCode: string, streamCode: string | null) => void;
  addTeacher: (teacher: TeacherEntry) => void;
  updateTeacher: (tempId: string, data: Partial<TeacherEntry>) => void;
  removeTeacher: (tempId: string) => void;
  addStudent: (student: StudentEntry) => void;
  removeStudent: (tempId: string) => void;
  // Persistence
  saving: boolean;
  saveCurrentStep: () => Promise<void>;
  completeSetup: () => Promise<void>;
  // School info
  school: {
    has_primary: boolean;
    has_middle: boolean;
    has_high: boolean;
    available_streams?: string[];
  };
}
