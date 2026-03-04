/* ══════════════════════════════════════════════════════════════════════
   ILMI — Teacher Full Profile Page
   Route: /teachers/:id/profile
   ══════════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  GraduationCap,
  QrCode,
  FileText,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  UserCheck,
  BarChart3,
  ClipboardList,
  Eye,
  Printer,
  Edit,
  School,
  Layers,
} from 'lucide-react';

import { GlassCard, LoadingSkeleton, StatusBadge } from '../../components/ui';
import {
  useTeacherFullProfile,
  useTeacherQRCode,
  useSchoolProfile,
} from '../../hooks/useApi';
import IDCard from '../../components/IDCard/IDCard';
import type { IDCardTeacherData, IDCardSchoolInfo } from '../../components/IDCard/IDCard';
import type {
  TeacherFullProfile,
  TeacherSubject,
  TeacherClassroom,
  TeacherScheduleSlot,
  TeacherDocument,
} from '../../types/teacher-profile';

import './TeacherProfilePage.css';

/* ─────────────── Helpers ─────────────── */

function formatDate(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-DZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(d?: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-DZ', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function appealStatusColor(s: string): string {
  switch (s.toUpperCase()) {
    case 'APPROVED':
    case 'ACCEPTED':
      return 'tp-badge--green';
    case 'PENDING':
      return 'tp-badge--amber';
    case 'REJECTED':
      return 'tp-badge--red';
    default:
      return 'tp-badge--gray';
  }
}

function appealStatusIcon(s: string) {
  switch (s.toUpperCase()) {
    case 'APPROVED':
    case 'ACCEPTED':
      return <CheckCircle2 size={14} />;
    case 'PENDING':
      return <Clock size={14} />;
    case 'REJECTED':
      return <XCircle size={14} />;
    default:
      return <AlertCircle size={14} />;
  }
}

/** Section colour dot */
function sectionDotColor(level?: string): string {
  if (!level) return '#0EA5E9';
  const s = level.toLowerCase();
  if (s.includes('primaire') || s.includes('primary')) return '#10b981';
  if (s.includes('moyen') || s.includes('cem') || s.includes('middle')) return '#f59e0b';
  if (s.includes('lycée') || s.includes('lycee') || s.includes('high') || s.includes('secondaire')) return '#ef4444';
  return '#0EA5E9';
}

/** Deduce section labels from classrooms */
function deriveSections(classrooms: TeacherClassroom[]): { label: string; color: string }[] {
  const seen = new Set<string>();
  const result: { label: string; color: string }[] = [];
  classrooms.forEach(c => {
    const lvl = c.level?.toLowerCase() ?? '';
    let label = '';
    let color = '#0EA5E9';
    if (lvl.includes('primaire') || lvl.includes('primary')) {
      label = 'Primaire'; color = '#10b981';
    } else if (lvl.includes('moyen') || lvl.includes('cem') || lvl.includes('middle')) {
      label = 'CEM (Moyen)'; color = '#f59e0b';
    } else if (lvl.includes('lycée') || lvl.includes('lycee') || lvl.includes('high') || lvl.includes('secondaire')) {
      label = 'Lycée (Secondaire)'; color = '#ef4444';
    } else {
      label = c.level || 'Autre'; color = '#0EA5E9';
    }
    if (!seen.has(label)) {
      seen.add(label);
      result.push({ label, color });
    }
  });
  return result;
}

/* ═══════════════════════════════════════════════════════════════════════
   Skeleton loader
   ═══════════════════════════════════════════════════════════════════════ */
const ProfileSkeleton: React.FC = () => (
  <div className="tp-page">
    <div className="tp-header tp-header--navy" style={{ minHeight: 180 }}>
      <div className="tp-header__inner">
        <div className="tp-header__avatar-skeleton" />
        <div className="tp-header__info-skeleton">
          <LoadingSkeleton variant="text" rows={2} />
        </div>
      </div>
    </div>
    <div className="tp-body">
      <div className="tp-col-left">
        {[1, 2, 3].map(i => (
          <LoadingSkeleton key={i} variant="card" className="tp-skeleton-card" />
        ))}
      </div>
      <div className="tp-col-right">
        <LoadingSkeleton variant="table" rows={6} />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   Profile Header — navy blue #1e3a5f
   ═══════════════════════════════════════════════════════════════════════ */
interface ProfileHeaderProps {
  profile: TeacherFullProfile;
  onBack: () => void;
  onPrint?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onBack, onPrint }) => {
  const { identity } = profile;

  return (
    <div className="tp-header tp-header--navy">
      <button className="tp-header__back" onClick={onBack} title="Retour">
        <ArrowLeft size={20} />
      </button>

      <div className="tp-header__inner">
        {/* Avatar */}
        <div className="tp-header__avatar">
          {identity.photo ? (
            <img src={identity.photo} alt={identity.full_name} />
          ) : (
            <span className="tp-header__avatar-initials">
              {identity.first_name?.[0]}
              {identity.last_name?.[0]}
            </span>
          )}
          <span className={`tp-header__online-dot ${identity.is_active ? 'active' : ''}`} />
        </div>

        {/* Info */}
        <div className="tp-header__info">
          <h1 className="tp-header__name">{identity.full_name}</h1>
          <div className="tp-header__meta">
            {identity.specialization && (
              <span className="tp-header__tag">
                <GraduationCap size={14} /> {identity.specialization}
              </span>
            )}
            {identity.created_at && (
              <span className="tp-header__tag">
                <Calendar size={14} /> Recruté le {formatDate(identity.created_at)}
              </span>
            )}
          </div>
          <div className="tp-header__contact">
            {identity.phone_number && (
              <span><Phone size={14} /> {identity.phone_number}</span>
            )}
            {identity.email && (
              <span><Mail size={14} /> {identity.email}</span>
            )}
          </div>
        </div>

        {/* Status + Actions */}
        <div className="tp-header__status">
          <StatusBadge status={identity.is_active ? 'active' : 'inactive'} label={identity.is_active ? 'Actif' : 'Inactif'} />
          <div className="tp-header__actions">
            {onPrint && (
              <button className="tp-btn tp-btn--outline tp-btn--sm" onClick={onPrint} title="Imprimer le profil complet">
                <Printer size={15} /> PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Left Column Cards
   ═══════════════════════════════════════════════════════════════════════ */

/* ─── Sections Card ─── */
const CardSections: React.FC<{ classrooms: TeacherClassroom[] }> = ({ classrooms }) => {
  const sections = deriveSections(classrooms);
  return (
    <GlassCard padding="md" className="tp-card">
      <div className="tp-card__header">
        <Layers size={18} className="tp-card__icon tp-card__icon--blue" />
        <h3>Sections enseignées</h3>
      </div>
      <div className="tp-card__body">
        {sections.length === 0 ? (
          <p className="tp-card__empty">Aucune section</p>
        ) : (
          <div className="tp-card__section-list">
            {sections.map(s => (
              <div key={s.label} className="tp-card__section-item">
                <span className="tp-card__section-dot" style={{ background: s.color }} />
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

/* ─── Matières Card ─── */
const CardSubjects: React.FC<{ subjects: TeacherSubject[]; classrooms: TeacherClassroom[] }> = ({ subjects, classrooms }) => (
  <GlassCard padding="md" className="tp-card">
    <div className="tp-card__header">
      <BookOpen size={18} className="tp-card__icon tp-card__icon--emerald" />
      <h3>Matières enseignées</h3>
    </div>
    <div className="tp-card__body">
      {subjects.length === 0 ? (
        <p className="tp-card__empty">Aucune matière assignée</p>
      ) : (
        <div className="tp-card__subject-list">
          {subjects.map(sub => {
            /* match classrooms for this subject by checking assignments */
            const levels = [...new Set(classrooms.map(c => c.level))].filter(Boolean);
            return (
              <div key={sub.id} className="tp-card__subject-item">
                <span className="tp-card__subject-name">{sub.name}</span>
                {levels.length > 0 && (
                  <span className="tp-card__subject-levels">
                    {levels.map(l => (
                      <span key={l} className="tp-badge tp-badge--blue" style={{ fontSize: '10px' }}>{l}</span>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  </GlassCard>
);

/* ─── Stats Card ─── */
const CardStats: React.FC<{ stats: TeacherFullProfile['teaching_stats'] }> = ({ stats }) => (
  <GlassCard padding="md" className="tp-card">
    <div className="tp-card__header">
      <BarChart3 size={18} className="tp-card__icon tp-card__icon--amber" />
      <h3>Statistiques</h3>
    </div>
    <div className="tp-card__body">
      <div className="tp-stats-grid">
        <div className="tp-stat">
          <span className="tp-stat__value">{stats.total_students}</span>
          <span className="tp-stat__label">Élèves total</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat__value">{stats.total_classes}</span>
          <span className="tp-stat__label">Classes</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat__value">{stats.total_subjects}</span>
          <span className="tp-stat__label">Matières</span>
        </div>
        <div className="tp-stat">
          <span className="tp-stat__value">{stats.total_weekly_hours}h</span>
          <span className="tp-stat__label">Heures/sem</span>
        </div>
      </div>
    </div>
  </GlassCard>
);

/* ─── Carte Enseignant (ID Card) ─── */
const CardIDCard: React.FC<{
  profile: TeacherFullProfile;
  schoolInfo: IDCardSchoolInfo;
}> = ({ profile, schoolInfo }) => {
  const { identity, subjects } = profile;
  const { data: qr, isLoading } = useTeacherQRCode(identity.id);

  const cardData: IDCardTeacherData = {
    id: identity.id,
    full_name: identity.full_name,
    photo: identity.photo,
    employee_id: identity.id.slice(0, 8).toUpperCase(),
    hire_date: identity.created_at,
    subjects: subjects.map(s => ({ name: s.name })),
    qr_code_base64: qr?.qr_code_base64 ?? null,
  };

  return (
    <GlassCard padding="md" className="tp-card">
      <div className="tp-card__header">
        <QrCode size={18} className="tp-card__icon tp-card__icon--rose" />
        <h3>Carte Enseignant</h3>
      </div>
      <div className="tp-card__body" style={{ display: 'flex', justifyContent: 'center' }}>
        {isLoading ? (
          <LoadingSkeleton variant="card" />
        ) : (
          <IDCard type="teacher" data={cardData} schoolInfo={schoolInfo} />
        )}
      </div>
    </GlassCard>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Tab 1 — Classes & Élèves
   ═══════════════════════════════════════════════════════════════════════ */
const TabClasses: React.FC<{ classrooms: TeacherClassroom[] }> = ({ classrooms }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (classrooms.length === 0) {
    return (
      <GlassCard padding="lg" className="tp-empty-tab">
        <School size={48} strokeWidth={1.2} />
        <h3>Aucune classe assignée</h3>
        <p>Cet enseignant n'a pas encore de classes assignées.</p>
      </GlassCard>
    );
  }

  return (
    <div className="tp-classes-list">
      {classrooms.map(cls => (
        <GlassCard key={cls.id} padding="md" className="tp-class-card">
          <div className="tp-class-card__header">
            <div className="tp-class-card__left">
              <span className="tp-class-card__dot" style={{ background: sectionDotColor(cls.level) }} />
              <span className="tp-class-card__name">{cls.name}</span>
              <span className="tp-badge tp-badge--blue">{cls.level}</span>
              {cls.stream && <span className="tp-badge tp-badge--gray">{cls.stream}</span>}
            </div>
            <div className="tp-class-card__right">
              <span className="tp-class-card__count">
                <Users size={14} /> {cls.student_count} élèves
              </span>
            </div>
          </div>

          {/* Expand toggle */}
          <button className="tp-class-card__toggle" onClick={() => toggle(cls.id)}>
            {expanded.has(cls.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            {expanded.has(cls.id) ? 'Masquer les détails' : 'Voir les détails'}
          </button>

          {expanded.has(cls.id) && (
            <div className="tp-class-card__details">
              <div className="tp-class-card__detail-row">
                <span className="tp-class-card__detail-label">Niveau</span>
                <span>{cls.level}</span>
              </div>
              {cls.stream && (
                <div className="tp-class-card__detail-row">
                  <span className="tp-class-card__detail-label">Filière</span>
                  <span>{cls.stream}</span>
                </div>
              )}
              <div className="tp-class-card__detail-row">
                <span className="tp-class-card__detail-label">Effectif</span>
                <span>{cls.student_count} élèves</span>
              </div>
            </div>
          )}
        </GlassCard>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Tab 2 — Emploi du Temps (Week grid)
   ═══════════════════════════════════════════════════════════════════════ */

const DAYS = [
  { num: 0, name: 'Dimanche' },
  { num: 1, name: 'Lundi' },
  { num: 2, name: 'Mardi' },
  { num: 3, name: 'Mercredi' },
  { num: 4, name: 'Jeudi' },
];

/** Generate 30-min time slots from 08:00 to 17:00 */
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h < 17; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  slots.push('17:00');
  return slots;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const TabSchedule: React.FC<{ schedule: TeacherScheduleSlot[] }> = ({ schedule }) => {
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  if (schedule.length === 0) {
    return (
      <GlassCard padding="lg" className="tp-empty-tab">
        <Calendar size={48} strokeWidth={1.2} />
        <h3>Emploi du temps vide</h3>
        <p>Aucun créneau n'est encore défini pour cet enseignant.</p>
      </GlassCard>
    );
  }

  /* Group by day */
  const byDay = new Map<number, TeacherScheduleSlot[]>();
  schedule.forEach(s => {
    if (!byDay.has(s.day_of_week)) byDay.set(s.day_of_week, []);
    byDay.get(s.day_of_week)!.push(s);
  });

  return (
    <div className="tp-schedule">
      <div className="tp-schedule__grid">
        {/* Time column */}
        <div className="tp-schedule__time-col">
          <div className="tp-schedule__corner" />
          {timeSlots.map(t => (
            <div key={t} className="tp-schedule__time-cell">{t}</div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map(day => {
          const daySlots = byDay.get(day.num) ?? [];
          return (
            <div key={day.num} className="tp-schedule__day-col">
              <div className="tp-schedule__day-header">{day.name}</div>
              <div className="tp-schedule__day-body">
                {/* Render grid cells for each time slot */}
                {timeSlots.map(t => {
                  const tMin = timeToMinutes(t);
                  const slot = daySlots.find(s => {
                    const sMin = timeToMinutes(s.start_time.slice(0, 5));
                    const eMin = timeToMinutes(s.end_time.slice(0, 5));
                    return tMin >= sMin && tMin < eMin;
                  });
                  const isStart = slot && timeToMinutes(slot.start_time.slice(0, 5)) === tMin;

                  if (slot && isStart) {
                    const sMin = timeToMinutes(slot.start_time.slice(0, 5));
                    const eMin = timeToMinutes(slot.end_time.slice(0, 5));
                    const spanCells = Math.max(1, Math.round((eMin - sMin) / 30));
                    return (
                      <div
                        key={t}
                        className="tp-schedule__slot"
                        style={{
                          gridRow: `span ${spanCells}`,
                          background: sectionDotColor(slot.classroom) + '18',
                          borderLeft: `3px solid ${sectionDotColor(slot.classroom)}`,
                        }}
                      >
                        <span className="tp-schedule__slot-subject">{slot.subject}</span>
                        <span className="tp-schedule__slot-class">{slot.classroom}</span>
                        {slot.room_name && (
                          <span className="tp-schedule__slot-room">Salle : {slot.room_name}</span>
                        )}
                      </div>
                    );
                  }

                  if (slot && !isStart) {
                    return null; // occupied by spanning slot
                  }

                  return <div key={t} className="tp-schedule__empty-cell" />;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Tab 3 — Absences
   ═══════════════════════════════════════════════════════════════════════ */

const TabAbsences: React.FC = () => {
  /* Teacher absences are not part of the current backend serializer
     — render a placeholder ready for future integration */
  return (
    <GlassCard padding="lg" className="tp-empty-tab">
      <AlertCircle size={48} strokeWidth={1.2} />
      <h3>Absences de l'enseignant</h3>
      <p>Le suivi des absences enseignant sera disponible prochainement.</p>
    </GlassCard>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Tab 4 — Recours reçus
   ═══════════════════════════════════════════════════════════════════════ */

const TabRecours: React.FC = () => {
  /* Appeals received by this teacher — requires backend linkage
     by teacher assignment → subject → student appeals            */
  return (
    <GlassCard padding="lg" className="tp-empty-tab">
      <AlertTriangle size={48} strokeWidth={1.2} />
      <h3>Recours reçus</h3>
      <p>Les recours soumis par les élèves seront affichés ici.</p>
    </GlassCard>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Tab 5 — Documents
   ═══════════════════════════════════════════════════════════════════════ */
const TabDocuments: React.FC<{ documents: TeacherDocument[] }> = ({ documents }) => {
  if (!documents || documents.length === 0) {
    return (
      <GlassCard padding="lg" className="tp-empty-tab">
        <FileText size={48} strokeWidth={1.2} />
        <h3>Aucun document</h3>
        <p>Les diplômes, contrats et autres documents seront listés ici.</p>
        <button className="tp-btn tp-btn--primary tp-btn--sm">
          <Upload size={14} /> Ajouter un document
        </button>
      </GlassCard>
    );
  }

  return (
    <div className="tp-documents-list">
      {documents.map(doc => (
        <GlassCard key={doc.id} padding="sm" className="tp-document-item">
          <FileText size={20} className="tp-document-item__icon" />
          <div className="tp-document-item__info">
            <span className="tp-document-item__name">{doc.name}</span>
            <span className="tp-document-item__meta">
              {doc.type} • Ajouté le {formatDate(doc.uploaded_at)}
            </span>
          </div>
          <a href={doc.url} download className="tp-btn tp-btn--outline tp-btn--sm">
            <Download size={14} />
          </a>
        </GlassCard>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Tab keys & definitions
   ═══════════════════════════════════════════════════════════════════════ */
type TabKey = 'classes' | 'schedule' | 'absences' | 'recours' | 'documents';

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
const TeacherProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('classes');

  const { data, isLoading, isError, error } = useTeacherFullProfile(id ?? '');
  const profile = data as TeacherFullProfile | undefined;
  const { data: schoolData } = useSchoolProfile();

  /* Build school info for the ID card */
  const schoolInfo: IDCardSchoolInfo = useMemo(() => ({
    name: (schoolData as Record<string, unknown>)?.name as string ?? 'ILMI',
    logo: (schoolData as Record<string, unknown>)?.logo_url as string | undefined,
    address: (schoolData as Record<string, unknown>)?.wilaya as string | undefined,
    phone: (schoolData as Record<string, unknown>)?.phone as string | undefined,
  }), [schoolData]);

  /* Print handler → basic window.print() approach */
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  /* Tab definitions */
  const tabs: TabDef[] = useMemo(() => [
    {
      key: 'classes',
      label: 'Classes & Élèves',
      icon: <School size={16} />,
      badge: profile?.classrooms.length,
    },
    {
      key: 'schedule',
      label: 'Emploi du Temps',
      icon: <Calendar size={16} />,
    },
    {
      key: 'absences',
      label: 'Absences',
      icon: <AlertCircle size={16} />,
    },
    {
      key: 'recours',
      label: 'Recours reçus',
      icon: <AlertTriangle size={16} />,
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: <FileText size={16} />,
    },
  ], [profile]);

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !profile) {
    return (
      <div className="tp-page">
        <div className="tp-error">
          <AlertTriangle size={48} strokeWidth={1.5} />
          <h2>Erreur de chargement</h2>
          <p>{(error as Error)?.message ?? 'Impossible de charger le profil'}</p>
          <button className="tp-btn tp-btn--primary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      {/* ── Header ── */}
      <ProfileHeader profile={profile} onBack={() => navigate('/teachers')} onPrint={handlePrint} />

      {/* ── Body: 2-column layout ── */}
      <div className="tp-body">
        {/* Left column — 35% */}
        <aside className="tp-col-left">
          <CardSections classrooms={profile.classrooms} />
          <CardSubjects subjects={profile.subjects} classrooms={profile.classrooms} />
          <CardStats stats={profile.teaching_stats} />
          <CardIDCard profile={profile} schoolInfo={schoolInfo} />
        </aside>

        {/* Right column — 65% */}
        <main className="tp-col-right">
          {/* Tab bar */}
          <div className="tp-tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`tp-tabs__btn ${activeTab === tab.key ? 'tp-tabs__btn--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="tp-tabs__badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="tp-tab-content">
            {activeTab === 'classes' && (
              <TabClasses classrooms={profile.classrooms} />
            )}
            {activeTab === 'schedule' && (
              <TabSchedule schedule={profile.current_week_schedule} />
            )}
            {activeTab === 'absences' && (
              <TabAbsences />
            )}
            {activeTab === 'recours' && (
              <TabRecours />
            )}
            {activeTab === 'documents' && (
              <TabDocuments documents={profile.documents} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
