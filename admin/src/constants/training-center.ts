/**
 * Training Center (Centre de Formation) — Terminology & Constants
 *
 * Dynamic terminology: when institution_type === 'TRAINING_CENTER',
 * every label in the UI is adapted (Élève → Apprenant, Classe → Groupe, etc.)
 */

// ── Term mapping school → training center ──
export const SCHOOL_TO_TRAINING_TERMS: Record<string, string> = {
  'Élève': 'Apprenant',
  'Élèves': 'Apprenants',
  'élève': 'apprenant',
  'élèves': 'apprenants',
  'Enseignant': 'Formateur',
  'Enseignants': 'Formateurs',
  'enseignant': 'formateur',
  'enseignants': 'formateurs',
  'Classe': 'Groupe',
  'Classes': 'Groupes',
  'classe': 'groupe',
  'classes': 'groupes',
  'Bulletin': 'Attestation',
  'Bulletins': 'Attestations',
  'bulletin': 'attestation',
  'bulletins': 'attestations',
  'Trimestre': 'Session',
  'Trimestres': 'Sessions',
  'trimestre': 'session',
  'trimestres': 'sessions',
  'Matière': 'Module',
  'Matières': 'Modules',
  'matière': 'module',
  'matières': 'modules',
  'Cours': 'Séance',
  'cours': 'séance',
  'Inscription': 'Inscription',
  'Note': 'Évaluation',
  'Notes': 'Évaluations',
  'note': 'évaluation',
  'notes': 'évaluations',
};

/**
 * Adapt a label string according to institution type.
 */
export function adaptLabel(label: string, isTrainingCenter: boolean): string {
  if (!isTrainingCenter) return label;
  let adapted = label;
  for (const [school, training] of Object.entries(SCHOOL_TO_TRAINING_TERMS)) {
    adapted = adapted.split(school).join(training);
  }
  return adapted;
}

/**
 * Get the term for a concept based on institution type.
 */
export function t(schoolTerm: string, isTrainingCenter: boolean): string {
  if (!isTrainingCenter) return schoolTerm;
  return SCHOOL_TO_TRAINING_TERMS[schoolTerm] || schoolTerm;
}

// ── Audience options ──
export const AUDIENCE_OPTIONS = [
  { value: 'CHILDREN', label: 'Enfants' },
  { value: 'TEENAGERS', label: 'Adolescents' },
  { value: 'ADULTS', label: 'Adultes' },
  { value: 'MIXED', label: 'Mixte' },
];

// ── Billing cycle options ──
export const BILLING_CYCLE_OPTIONS = [
  { value: 'MONTHLY', label: 'Mensuel' },
  { value: 'PER_SESSION', label: 'Par session' },
  { value: 'PER_MODULE', label: 'Par module' },
  { value: 'HOURLY', label: 'À l\'heure' },
  { value: 'FIXED', label: 'Forfait fixe' },
];

// ── Contract types ──
export const CONTRACT_TYPE_OPTIONS = [
  { value: 'PERMANENT', label: 'CDI' },
  { value: 'VACATAIRE', label: 'Vacataire' },
  { value: 'CONTRACT', label: 'CDD' },
];

// ── Enrollment statuses ──
export const ENROLLMENT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Actif', color: 'green' },
  { value: 'SUSPENDED', label: 'Suspendu', color: 'orange' },
  { value: 'PENDING_PAYMENT', label: 'Attente paiement', color: 'gold' },
  { value: 'COMPLETED', label: 'Terminé', color: 'blue' },
  { value: 'DROPPED', label: 'Abandonné', color: 'red' },
  { value: 'WAITLIST', label: 'Liste d\'attente', color: 'purple' },
];

// ── Group statuses ──
export const GROUP_STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Ouvert', color: 'green' },
  { value: 'FULL', label: 'Complet', color: 'orange' },
  { value: 'IN_PROGRESS', label: 'En cours', color: 'blue' },
  { value: 'COMPLETED', label: 'Terminé', color: 'default' },
  { value: 'CANCELLED', label: 'Annulé', color: 'red' },
];

// ── Session statuses ──
export const SESSION_STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Planifiée', color: 'blue' },
  { value: 'COMPLETED', label: 'Terminée', color: 'green' },
  { value: 'CANCELLED', label: 'Annulée', color: 'red' },
  { value: 'MAKEUP', label: 'Rattrapage', color: 'purple' },
];

// ── Attendance statuses ──
export const SESSION_ATTENDANCE_OPTIONS = [
  { value: 'PRESENT', label: 'Présent', color: 'green' },
  { value: 'ABSENT', label: 'Absent', color: 'red' },
  { value: 'LATE', label: 'En retard', color: 'orange' },
  { value: 'EXCUSED', label: 'Excusé', color: 'blue' },
];

// ── Level passage decisions ──
export const PASSAGE_DECISION_OPTIONS = [
  { value: 'PROMOTED', label: 'Promu', color: 'green' },
  { value: 'MAINTAINED', label: 'Maintenu', color: 'orange' },
  { value: 'PENDING', label: 'En attente', color: 'default' },
];

// ── Certificate types ──
export const CERTIFICATE_TYPE_OPTIONS = [
  { value: 'ATTENDANCE', label: 'Attestation de présence' },
  { value: 'COMPLETION', label: 'Attestation de fin de formation' },
  { value: 'LEVEL', label: 'Certificat de niveau' },
];

// ── Entry evaluation modes ──
export const ENTRY_EVALUATION_OPTIONS = [
  { value: 'PLACEMENT_TEST', label: 'Test de placement' },
  { value: 'INTERVIEW', label: 'Entretien' },
  { value: 'SELF_ASSESSMENT', label: 'Auto-évaluation' },
  { value: 'NONE', label: 'Aucun' },
];

// ── Payment statuses ──
export const PAYMENT_STATUS_OPTIONS = [
  { value: 'PAID', label: 'Payé', color: 'green' },
  { value: 'PARTIAL', label: 'Partiel', color: 'orange' },
  { value: 'PENDING', label: 'En attente', color: 'gold' },
  { value: 'REFUNDED', label: 'Remboursé', color: 'red' },
];

// ── Payslip statuses ──
export const PAYSLIP_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Brouillon', color: 'default' },
  { value: 'VALIDATED', label: 'Validé', color: 'blue' },
  { value: 'PAID', label: 'Payé', color: 'green' },
];

// ── Evaluation types for training centers ──
export const EVALUATION_TYPE_OPTIONS = [
  { value: 'PLACEMENT', label: 'Test de placement (début)' },
  { value: 'CONTINUOUS', label: 'Évaluation continue' },
  { value: 'INTERMEDIATE', label: 'Évaluation intermédiaire' },
  { value: 'FINAL', label: 'Évaluation finale' },
  { value: 'MOCK', label: 'Examen blanc' },
];

// ── Colors for departments ──
export const DEPARTMENT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

// ── Training type labels ──
export const TRAINING_TYPE_LABELS: Record<string, string> = {
  SUPPORT_COURSES: 'Cours de soutien',
  LANGUAGES: 'Langues',
  PROFESSIONAL: 'Formation professionnelle',
  EXAM_PREP: 'Préparation aux examens',
  COMPUTING: 'Informatique',
  OTHER: 'Autre',
};

// ── Days of week ──
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
  { value: 2, label: 'Mardi' },
  { value: 3, label: 'Mercredi' },
  { value: 4, label: 'Jeudi' },
];

// ── Default time slots for training centers ──
export const DEFAULT_TIME_SLOTS = [
  { label: 'Matin 1', start: '08:00', end: '09:30' },
  { label: 'Matin 2', start: '09:45', end: '11:15' },
  { label: 'Matin 3', start: '11:30', end: '13:00' },
  { label: 'Après-midi 1', start: '14:00', end: '15:30' },
  { label: 'Après-midi 2', start: '15:45', end: '17:15' },
  { label: 'Soir 1', start: '17:30', end: '19:00' },
  { label: 'Soir 2', start: '19:15', end: '20:45' },
];
