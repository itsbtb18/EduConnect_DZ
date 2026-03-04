/* ══════════════════════════════════════════════════════════════════════
   ILMI — Student Full Profile Page
   Route: /students/:id/profile
   ══════════════════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  BookOpen,
  CreditCard,
  Users,
  UserCheck,
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
  TrendingUp,
  Award,
  ClipboardList,
  Filter,
  Eye,
  Printer,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import { GlassCard, LoadingSkeleton, StatusBadge } from '../../components/ui';
import { useStudentFullProfile, useStudentQRCode, useSchoolProfile } from '../../hooks/useApi';
import IDCard from '../../components/IDCard/IDCard';
import type { IDCardStudentData, IDCardSchoolInfo } from '../../components/IDCard/IDCard';
import { printStudentProfile } from '../../components/IDCard/printProfile';
import type {
  StudentFullProfile,
  ProfileSubjectAverage,
  ProfileTrimesterAverage,
  ProfileAbsenceRecord,
  ProfileAppealBrief,
  ProfilePaymentBrief,
  ProfileTeacherBrief,
  ProfileParentBrief,
  ProfileLevelSubject,
} from '../../types/student-profile';

import './StudentProfilePage.css';

/* ─────────────── Helpers ─────────────── */

/** Derive section gradient class from the section type string */
function sectionGradient(section?: string): string {
  if (!section) return 'sp-gradient--default';
  const s = section.toLowerCase();
  if (s.includes('primaire') || s.includes('primary')) return 'sp-gradient--primary';
  if (s.includes('moyen') || s.includes('cem') || s.includes('middle')) return 'sp-gradient--middle';
  if (s.includes('lycée') || s.includes('lycee') || s.includes('high')) return 'sp-gradient--high';
  return 'sp-gradient--default';
}

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

function paymentStatusColor(s: string): string {
  switch (s.toUpperCase()) {
    case 'PAID':
    case 'COMPLETED':
      return 'sp-badge--green';
    case 'PENDING':
      return 'sp-badge--amber';
    case 'OVERDUE':
    case 'FAILED':
      return 'sp-badge--red';
    default:
      return 'sp-badge--gray';
  }
}

function appealStatusColor(s: string): string {
  switch (s.toUpperCase()) {
    case 'APPROVED':
    case 'ACCEPTED':
      return 'sp-badge--green';
    case 'PENDING':
      return 'sp-badge--amber';
    case 'REJECTED':
      return 'sp-badge--red';
    default:
      return 'sp-badge--gray';
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

/* Number parser safe for "12.50" strings from DRF */
function num(v?: string | number | null): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

/* ═══════════════════════════════════════════════════════════════════════
   Skeleton loader for the whole profile page
   ═══════════════════════════════════════════════════════════════════════ */
const ProfileSkeleton: React.FC = () => (
  <div className="sp-page">
    {/* Header skeleton */}
    <div className="sp-header sp-gradient--default" style={{ minHeight: 180 }}>
      <div className="sp-header__inner">
        <div className="sp-header__avatar-skeleton" />
        <div className="sp-header__info-skeleton">
          <LoadingSkeleton variant="text" rows={2} />
        </div>
      </div>
    </div>
    {/* Body skeleton */}
    <div className="sp-body">
      <div className="sp-col-left">
        {[1, 2, 3].map(i => (
          <LoadingSkeleton key={i} variant="card" className="sp-skeleton-card" />
        ))}
      </div>
      <div className="sp-col-right">
        <LoadingSkeleton variant="table" rows={6} />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   Profile Header
   ═══════════════════════════════════════════════════════════════════════ */
interface ProfileHeaderProps {
  profile: StudentFullProfile;
  onBack: () => void;
  onPrint?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onBack, onPrint }) => {
  const { identity, academic_info } = profile;
  const section = academic_info.current_class?.section ?? '';
  const gradientClass = sectionGradient(section);

  return (
    <div className={`sp-header ${gradientClass}`}>
      <button className="sp-header__back" onClick={onBack} title="Retour">
        <ArrowLeft size={20} />
      </button>

      <div className="sp-header__inner">
        {/* Avatar */}
        <div className="sp-header__avatar">
          {identity.photo ? (
            <img src={identity.photo} alt={identity.full_name} />
          ) : (
            <span className="sp-header__avatar-initials">
              {identity.first_name?.[0]}
              {identity.last_name?.[0]}
            </span>
          )}
          <span className={`sp-header__online-dot ${identity.is_active ? 'active' : ''}`} />
        </div>

        {/* Info */}
        <div className="sp-header__info">
          <h1 className="sp-header__name">{identity.full_name}</h1>
          <div className="sp-header__meta">
            {identity.student_id && (
              <span className="sp-header__tag">
                <GraduationCap size={14} /> {identity.student_id}
              </span>
            )}
            {academic_info.current_class && (
              <span className="sp-header__tag">
                <BookOpen size={14} /> {academic_info.current_class.name}
              </span>
            )}
            {section && (
              <span className="sp-header__tag sp-header__tag--section">
                {section}
              </span>
            )}
          </div>
          <div className="sp-header__contact">
            {identity.phone_number && (
              <span><Phone size={14} /> {identity.phone_number}</span>
            )}
            {identity.email && (
              <span><Mail size={14} /> {identity.email}</span>
            )}
            {identity.date_of_birth && (
              <span><Calendar size={14} /> Né(e) le {formatDate(identity.date_of_birth)}</span>
            )}
          </div>
        </div>

        {/* Status badge + Print */}
        <div className="sp-header__status">
          <StatusBadge status={identity.is_active ? 'active' : 'inactive'} label={identity.is_active ? 'Actif' : 'Inactif'} />
          {onPrint && (
            <button className="sp-btn sp-btn--outline sp-btn--sm" onClick={onPrint} title="Imprimer le profil complet">
              <Printer size={15} /> Imprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Left Column Cards
   ═══════════════════════════════════════════════════════════════════════ */

/* ─── Scolarité Card ─── */
const CardScolarite: React.FC<{ profile: StudentFullProfile }> = ({ profile }) => {
  const { academic_info } = profile;
  const cls = academic_info.current_class;
  const subjects = academic_info.level_subjects;

  return (
    <GlassCard padding="md" className="sp-card">
      <div className="sp-card__header">
        <GraduationCap size={18} className="sp-card__icon sp-card__icon--blue" />
        <h3>Scolarité</h3>
      </div>
      {cls ? (
        <div className="sp-card__body">
          <InfoRow label="Classe" value={cls.name} />
          <InfoRow label="Niveau" value={`${cls.level} (${cls.level_code})`} />
          {cls.stream && <InfoRow label="Filière" value={cls.stream} />}
          <InfoRow label="Section" value={cls.section} />
          <InfoRow label="Année scolaire" value={cls.academic_year} />
          {subjects.length > 0 && (
            <div className="sp-card__subjects">
              <span className="sp-card__subjects-label">
                {subjects.length} matières &middot;{' '}
                Coeff. total: {subjects.reduce((s, m) => s + num(m.coefficient), 0).toFixed(0)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="sp-card__empty">Aucune classe assignée</p>
      )}
    </GlassCard>
  );
};

/* ─── Paiement Card ─── */
const CardPaiement: React.FC<{ profile: StudentFullProfile }> = ({ profile }) => {
  const { payment_info } = profile;
  return (
    <GlassCard padding="md" className="sp-card">
      <div className="sp-card__header">
        <CreditCard size={18} className="sp-card__icon sp-card__icon--emerald" />
        <h3>Paiement</h3>
      </div>
      <div className="sp-card__body">
        <div className="sp-card__stat-row">
          <div className="sp-card__stat">
            <span className="sp-card__stat-value">{num(payment_info.total_paid).toLocaleString('fr-DZ')} DA</span>
            <span className="sp-card__stat-label">Total payé</span>
          </div>
          <div className="sp-card__stat">
            <span className="sp-card__stat-value">{payment_info.payment_count}</span>
            <span className="sp-card__stat-label">Transactions</span>
          </div>
        </div>
        {payment_info.recent_payments.length > 0 && (
          <div className="sp-card__payments-list">
            {payment_info.recent_payments.slice(0, 3).map(p => (
              <div key={p.id} className="sp-card__payment-item">
                <span className="sp-card__payment-amount">{num(p.amount_paid).toLocaleString('fr-DZ')} DA</span>
                <span className={`sp-badge ${paymentStatusColor(p.status)}`}>{p.status}</span>
                <span className="sp-card__payment-date">{formatDate(p.payment_date)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
};

/* ─── Parents Card ─── */
const CardParents: React.FC<{ parents: ProfileParentBrief[] }> = ({ parents }) => (
  <GlassCard padding="md" className="sp-card">
    <div className="sp-card__header">
      <Users size={18} className="sp-card__icon sp-card__icon--violet" />
      <h3>Parents / Tuteurs</h3>
    </div>
    <div className="sp-card__body">
      {parents.length === 0 ? (
        <p className="sp-card__empty">Aucun parent associé</p>
      ) : (
        parents.map(p => (
          <div key={p.id} className="sp-card__parent-item">
            <div className="sp-card__parent-avatar">
              {p.full_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
            </div>
            <div className="sp-card__parent-info">
              <span className="sp-card__parent-name">{p.full_name}</span>
              <span className="sp-card__parent-rel">{p.relationship}</span>
              <a href={`tel:${p.phone_number}`} className="sp-card__parent-phone">
                <Phone size={12} /> {p.phone_number}
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  </GlassCard>
);

/* ─── Enseignants Card ─── */
const CardEnseignants: React.FC<{ teachers: ProfileTeacherBrief[] }> = ({ teachers }) => (
  <GlassCard padding="md" className="sp-card">
    <div className="sp-card__header">
      <UserCheck size={18} className="sp-card__icon sp-card__icon--amber" />
      <h3>Enseignants</h3>
    </div>
    <div className="sp-card__body">
      {teachers.length === 0 ? (
        <p className="sp-card__empty">Aucun enseignant</p>
      ) : (
        <div className="sp-card__teachers-list">
          {teachers.map(t => (
            <div key={t.id} className="sp-card__teacher-item">
              <span className="sp-card__teacher-name">{t.full_name}</span>
              <span className="sp-badge sp-badge--blue">{t.subject}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  </GlassCard>
);

/* ─── Carte d'Identité Scolaire (ID Card) ─── */
const CardIDCard: React.FC<{
  profile: StudentFullProfile;
  schoolInfo: IDCardSchoolInfo;
}> = ({ profile, schoolInfo }) => {
  const { identity, academic_info } = profile;
  const { data: qr, isLoading } = useStudentQRCode(identity.id);

  const cardData: IDCardStudentData = {
    id: identity.id,
    full_name: identity.full_name,
    photo: identity.photo,
    date_of_birth: identity.date_of_birth,
    student_id: identity.student_id,
    class_name: academic_info.current_class?.name,
    section: academic_info.current_class?.section,
    stream: academic_info.current_class?.stream,
    qr_code_base64: qr?.qr_code_base64 ?? null,
  };

  return (
    <GlassCard padding="md" className="sp-card">
      <div className="sp-card__header">
        <QrCode size={18} className="sp-card__icon sp-card__icon--rose" />
        <h3>Carte d'Identité Scolaire</h3>
      </div>
      <div className="sp-card__body" style={{ display: 'flex', justifyContent: 'center' }}>
        {isLoading ? (
          <LoadingSkeleton variant="card" />
        ) : (
          <IDCard type="student" data={cardData} schoolInfo={schoolInfo} />
        )}
      </div>
    </GlassCard>
  );
};

/* Helper: simple label/value row */
const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="sp-info-row">
    <span className="sp-info-row__label">{label}</span>
    <span className="sp-info-row__value">{value}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   Tab 1 — Notes & Moyennes
   ═══════════════════════════════════════════════════════════════════════ */
interface TabNotesProps {
  gradesHistory: StudentFullProfile['grades_history'];
  levelSubjects: ProfileLevelSubject[];
}

const TabNotes: React.FC<TabNotesProps> = ({ gradesHistory, levelSubjects }) => {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState<number>(0); // 0 = all

  const { subject_averages, trimester_averages, annual_average } = gradesHistory;

  /* ── Group subject averages by subject name ── */
  const subjectMap = useMemo(() => {
    const m: Record<string, ProfileSubjectAverage[]> = {};
    subject_averages.forEach(sa => {
      if (!m[sa.subject]) m[sa.subject] = [];
      m[sa.subject].push(sa);
    });
    return m;
  }, [subject_averages]);

  /* ── Filter by trimester ── */
  const filteredSubjects = useMemo(() => {
    if (selectedTrimester === 0) return subjectMap;
    const filtered: Record<string, ProfileSubjectAverage[]> = {};
    Object.entries(subjectMap).forEach(([subj, avgs]) => {
      const f = avgs.filter(a => a.trimester === selectedTrimester);
      if (f.length > 0) filtered[subj] = f;
    });
    return filtered;
  }, [subjectMap, selectedTrimester]);

  /* ── Chart data: trimester averages ── */
  const chartData = useMemo(() => {
    return trimester_averages
      .sort((a, b) => a.trimester - b.trimester)
      .map(t => ({
        name: `T${t.trimester}`,
        moyenne: num(t.average),
        rang: t.rank_in_class,
      }));
  }, [trimester_averages]);

  /* ── Get coefficient for a subject ── */
  const getCoeff = (subjectName: string): string => {
    const ls = levelSubjects.find(
      l => l.subject_name === subjectName
    );
    return ls ? String(num(ls.coefficient)) : '—';
  };

  return (
    <div className="sp-tab-notes">
      {/* Trimester summary cards */}
      <div className="sp-tab-notes__summary">
        {trimester_averages.map(t => (
          <div key={t.trimester} className="sp-trim-card">
            <span className="sp-trim-card__label">Trimestre {t.trimester}</span>
            <span className="sp-trim-card__avg">{t.average ?? '—'}</span>
            <span className="sp-trim-card__rank">Rang: {t.rank_in_class}</span>
            <span className="sp-trim-card__appr">{t.appreciation}</span>
          </div>
        ))}
        {annual_average && (
          <div className="sp-trim-card sp-trim-card--annual">
            <span className="sp-trim-card__label">Moyenne Annuelle</span>
            <span className="sp-trim-card__avg">{annual_average.average ?? '—'}</span>
            <span className="sp-trim-card__rank">
              Rang: {annual_average.rank_in_class} / Niveau: {annual_average.rank_in_level}
            </span>
            <span className="sp-trim-card__appr">{annual_average.appreciation}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <GlassCard padding="md" className="sp-tab-notes__chart-card">
          <h4 className="sp-section-title">
            <TrendingUp size={16} /> Évolution des Moyennes
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" fontSize={12} stroke="#94A3B8" />
              <YAxis domain={[0, 20]} fontSize={12} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="moyenne"
                name="Moyenne"
                stroke="#00C9A7"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#00C9A7' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      )}

      {/* Filter bar */}
      <div className="sp-tab-notes__filter">
        <Filter size={14} />
        <select
          value={selectedTrimester}
          onChange={e => setSelectedTrimester(Number(e.target.value))}
          className="sp-select"
        >
          <option value={0}>Tous les trimestres</option>
          <option value={1}>Trimestre 1</option>
          <option value={2}>Trimestre 2</option>
          <option value={3}>Trimestre 3</option>
        </select>
      </div>

      {/* Subject averages table */}
      <div className="sp-tab-notes__table-wrap">
        <table className="sp-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}></th>
              <th>Matière</th>
              <th>Coeff.</th>
              <th>T1</th>
              <th>T2</th>
              <th>T3</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(filteredSubjects).map(([subjectName, avgs]) => {
              const isExpanded = expandedSubject === subjectName;
              const t1 = avgs.find(a => a.trimester === 1);
              const t2 = avgs.find(a => a.trimester === 2);
              const t3 = avgs.find(a => a.trimester === 3);

              return (
                <React.Fragment key={subjectName}>
                  <tr
                    className={`sp-table__row ${isExpanded ? 'sp-table__row--expanded' : ''}`}
                    onClick={() => setExpandedSubject(isExpanded ? null : subjectName)}
                  >
                    <td>
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </td>
                    <td className="sp-table__subject">{subjectName}</td>
                    <td>{getCoeff(subjectName)}</td>
                    <td className={avgClass(t1?.average)}>{t1?.average ?? '—'}</td>
                    <td className={avgClass(t2?.average)}>{t2?.average ?? '—'}</td>
                    <td className={avgClass(t3?.average)}>{t3?.average ?? '—'}</td>
                  </tr>
                  {isExpanded && (
                    <tr className="sp-table__detail-row">
                      <td colSpan={6}>
                        <div className="sp-table__detail">
                          {avgs.map(a => (
                            <div key={`${a.subject}-${a.trimester}`} className="sp-table__detail-item">
                              <span>T{a.trimester} — {a.academic_year}</span>
                              <span className={`sp-table__detail-avg ${avgClass(a.average)}`}>
                                {a.average ?? '—'}/20
                              </span>
                              <span className={`sp-badge ${a.is_published ? 'sp-badge--green' : 'sp-badge--amber'}`}>
                                {a.is_published ? 'Publié' : 'Brouillon'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {Object.keys(filteredSubjects).length === 0 && (
          <div className="sp-empty">
            <BookOpen size={32} strokeWidth={1.5} />
            <p>Aucune note disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Returns a color class based on the average value */
function avgClass(v?: string | null): string {
  if (!v) return '';
  const n = parseFloat(v);
  if (isNaN(n)) return '';
  if (n >= 16) return 'sp-avg--excellent';
  if (n >= 12) return 'sp-avg--good';
  if (n >= 10) return 'sp-avg--average';
  return 'sp-avg--poor';
}

/* ═══════════════════════════════════════════════════════════════════════
   Tab 2 — Absences
   ═══════════════════════════════════════════════════════════════════════ */
const TabAbsences: React.FC<{ data: StudentFullProfile['absences_summary'] }> = ({ data }) => {
  const [filterJustified, setFilterJustified] = useState<string>('all');

  const filtered = useMemo(() => {
    if (filterJustified === 'all') return data.recent_absences;
    const just = filterJustified === 'justified';
    return data.recent_absences.filter(a => a.is_justified === just);
  }, [data.recent_absences, filterJustified]);

  return (
    <div className="sp-tab-absences">
      {/* Summary cards */}
      <div className="sp-tab-absences__summary">
        <div className="sp-mini-stat sp-mini-stat--red">
          <XCircle size={20} />
          <div>
            <span className="sp-mini-stat__value">{data.total_absences}</span>
            <span className="sp-mini-stat__label">Absences</span>
          </div>
        </div>
        <div className="sp-mini-stat sp-mini-stat--green">
          <CheckCircle2 size={20} />
          <div>
            <span className="sp-mini-stat__value">{data.justified}</span>
            <span className="sp-mini-stat__label">Justifiées</span>
          </div>
        </div>
        <div className="sp-mini-stat sp-mini-stat--amber">
          <AlertCircle size={20} />
          <div>
            <span className="sp-mini-stat__value">{data.unjustified}</span>
            <span className="sp-mini-stat__label">Non justifiées</span>
          </div>
        </div>
        <div className="sp-mini-stat sp-mini-stat--blue">
          <Clock size={20} />
          <div>
            <span className="sp-mini-stat__value">{data.late_count}</span>
            <span className="sp-mini-stat__label">Retards</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="sp-tab-absences__filter">
        <Filter size={14} />
        <select
          value={filterJustified}
          onChange={e => setFilterJustified(e.target.value)}
          className="sp-select"
        >
          <option value="all">Toutes</option>
          <option value="justified">Justifiées</option>
          <option value="unjustified">Non justifiées</option>
        </select>
      </div>

      {/* Table */}
      <div className="sp-tab-absences__table-wrap">
        <table className="sp-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Période</th>
              <th>Matière</th>
              <th>Statut</th>
              <th>Justifié</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id}>
                <td>{formatDate(a.date)}</td>
                <td>{a.period}</td>
                <td>{a.subject_name}</td>
                <td>
                  <span className={`sp-badge ${a.status === 'ABSENT' ? 'sp-badge--red' : 'sp-badge--amber'}`}>
                    {a.status}
                  </span>
                </td>
                <td>
                  {a.is_justified ? (
                    <CheckCircle2 size={16} className="sp-icon--green" />
                  ) : (
                    <XCircle size={16} className="sp-icon--red" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="sp-empty">
            <CheckCircle2 size={32} strokeWidth={1.5} />
            <p>Aucune absence enregistrée</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   Tab 3 — Documents
   ═══════════════════════════════════════════════════════════════════════ */
const TabDocuments: React.FC<{ documents: StudentFullProfile['documents'] }> = ({ documents }) => (
  <div className="sp-tab-documents">
    {documents.length === 0 ? (
      <div className="sp-empty sp-empty--large">
        <FileText size={48} strokeWidth={1.2} />
        <h4>Aucun document</h4>
        <p>Les documents de l'élève apparaîtront ici</p>
        <button className="sp-btn sp-btn--outline" disabled>
          <Upload size={16} /> Ajouter un document
        </button>
      </div>
    ) : (
      <div className="sp-doc-grid">
        {documents.map(doc => (
          <GlassCard key={doc.id} padding="sm" className="sp-doc-card">
            <FileText size={28} className="sp-doc-card__icon" />
            <span className="sp-doc-card__name">{doc.name}</span>
            <span className="sp-doc-card__type">{doc.type}</span>
            <span className="sp-doc-card__date">{formatDate(doc.uploaded_at)}</span>
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="sp-doc-card__action">
              <Eye size={14} /> Voir
            </a>
          </GlassCard>
        ))}
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   Tab 4 — Recours / Appeals
   ═══════════════════════════════════════════════════════════════════════ */
const TabRecours: React.FC<{ appeals: ProfileAppealBrief[] }> = ({ appeals }) => (
  <div className="sp-tab-recours">
    {appeals.length === 0 ? (
      <div className="sp-empty sp-empty--large">
        <AlertTriangle size={48} strokeWidth={1.2} />
        <h4>Aucun recours</h4>
        <p>Les recours de l'élève apparaîtront ici</p>
      </div>
    ) : (
      <div className="sp-recours-list">
        {appeals.map(a => (
          <GlassCard key={a.id} padding="sm" className="sp-recours-item">
            <div className="sp-recours-item__header">
              <span className={`sp-badge ${appealStatusColor(a.status)}`}>
                {appealStatusIcon(a.status)} {a.status}
              </span>
              <span className="sp-recours-item__type">{a.appeal_type}</span>
              <span className="sp-recours-item__date">{formatDateTime(a.created_at)}</span>
            </div>
            <p className="sp-recours-item__reason">{a.reason}</p>
            {a.responded_at && (
              <span className="sp-recours-item__response">
                Répondu le {formatDateTime(a.responded_at)}
              </span>
            )}
          </GlassCard>
        ))}
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   Tab 5 — Historique Scolaire (Timeline)
   ═══════════════════════════════════════════════════════════════════════ */
interface TabHistoriqueProps {
  gradesHistory: StudentFullProfile['grades_history'];
  identity: StudentFullProfile['identity'];
}

const TabHistorique: React.FC<TabHistoriqueProps> = ({ gradesHistory, identity }) => {
  /* Group trimester averages by academic year */
  const timeline = useMemo(() => {
    const byYear: Record<string, ProfileTrimesterAverage[]> = {};
    gradesHistory.trimester_averages.forEach(t => {
      if (!byYear[t.academic_year]) byYear[t.academic_year] = [];
      byYear[t.academic_year].push(t);
    });
    // Sort years descending
    return Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0]));
  }, [gradesHistory.trimester_averages]);

  return (
    <div className="sp-tab-historique">
      {timeline.length === 0 ? (
        <div className="sp-empty sp-empty--large">
          <History size={48} strokeWidth={1.2} />
          <h4>Pas d'historique</h4>
          <p>L'historique scolaire apparaîtra ici</p>
        </div>
      ) : (
        <div className="sp-timeline">
          {timeline.map(([year, trimesters]) => {
            const sorted = [...trimesters].sort((a, b) => a.trimester - b.trimester);
            // Compute year average from trimesters
            const avgs = sorted.map(t => num(t.average)).filter(n => n > 0);
            const yearAvg = avgs.length > 0 ? (avgs.reduce((a, b) => a + b, 0) / avgs.length).toFixed(2) : '—';

            return (
              <div key={year} className="sp-timeline__year">
                <div className="sp-timeline__year-header">
                  <div className="sp-timeline__dot" />
                  <h4>{year}</h4>
                  <span className="sp-timeline__year-avg">
                    <Award size={14} /> Moy: {yearAvg}
                  </span>
                </div>
                <div className="sp-timeline__year-body">
                  {sorted.map(t => (
                    <div key={t.trimester} className="sp-timeline__trimester">
                      <span className="sp-timeline__trim-label">Trimestre {t.trimester}</span>
                      <span className={`sp-timeline__trim-avg ${avgClass(t.average)}`}>
                        {t.average ?? '—'}/20
                      </span>
                      <span className="sp-timeline__trim-rank">Rang: {t.rank_in_class}</span>
                      <span className="sp-timeline__trim-appr">{t.appreciation}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enrollment info */}
      <div className="sp-timeline__footer">
        <Calendar size={14} />
        Inscrit depuis le {formatDate(identity.enrollment_date)}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   TAB NAVIGATION
   ═══════════════════════════════════════════════════════════════════════ */
type TabKey = 'notes' | 'absences' | 'documents' | 'recours' | 'historique';

interface TabDef {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
const StudentProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('notes');

  const { data, isLoading, isError, error } = useStudentFullProfile(id ?? '');
  const profile = data as StudentFullProfile | undefined;
  const { data: qrData } = useStudentQRCode(id ?? '');
  const { data: schoolData } = useSchoolProfile();

  /* Build school info for the ID card */
  const schoolInfo: IDCardSchoolInfo = useMemo(() => ({
    name: (schoolData as Record<string, unknown>)?.name as string ?? 'ILMI',
    logo: (schoolData as Record<string, unknown>)?.logo_url as string | undefined,
    address: (schoolData as Record<string, unknown>)?.wilaya as string | undefined,
    phone: (schoolData as Record<string, unknown>)?.phone as string | undefined,
    academic_year: profile?.academic_info.current_class?.academic_year,
  }), [schoolData, profile]);

  /* Print handler → opens 2-page A4 profile */
  const handlePrint = () => {
    if (!profile) return;
    printStudentProfile({
      profile,
      schoolName: schoolInfo.name,
      schoolLogo: schoolInfo.logo ?? undefined,
      schoolPhone: schoolInfo.phone,
      qrCodeBase64: qrData?.qr_code_base64,
    });
  };

  /* Tab definitions with live badges */
  const tabs: TabDef[] = useMemo(() => [
    { key: 'notes', label: 'Notes & Moyennes', icon: <ClipboardList size={16} /> },
    {
      key: 'absences',
      label: 'Absences',
      icon: <AlertCircle size={16} />,
      badge: profile?.absences_summary.total_absences,
    },
    { key: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    {
      key: 'recours',
      label: 'Recours',
      icon: <AlertTriangle size={16} />,
      badge: profile?.appeals.length,
    },
    { key: 'historique', label: 'Historique', icon: <History size={16} /> },
  ], [profile]);

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !profile) {
    return (
      <div className="sp-page">
        <div className="sp-error">
          <AlertTriangle size={48} strokeWidth={1.5} />
          <h2>Erreur de chargement</h2>
          <p>{(error as Error)?.message ?? 'Impossible de charger le profil'}</p>
          <button className="sp-btn sp-btn--primary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      {/* ── Header ── */}
      <ProfileHeader profile={profile} onBack={() => navigate('/students')} onPrint={handlePrint} />

      {/* ── Body: 2-column layout ── */}
      <div className="sp-body">
        {/* Left column — 35% */}
        <aside className="sp-col-left">
          <CardScolarite profile={profile} />
          <CardPaiement profile={profile} />
          <CardParents parents={profile.parents} />
          <CardEnseignants teachers={profile.teachers} />
          <CardIDCard profile={profile} schoolInfo={schoolInfo} />
        </aside>

        {/* Right column — 65% */}
        <main className="sp-col-right">
          {/* Tab bar */}
          <div className="sp-tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`sp-tabs__btn ${activeTab === tab.key ? 'sp-tabs__btn--active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="sp-tabs__badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="sp-tab-content">
            {activeTab === 'notes' && (
              <TabNotes
                gradesHistory={profile.grades_history}
                levelSubjects={profile.academic_info.level_subjects}
              />
            )}
            {activeTab === 'absences' && (
              <TabAbsences data={profile.absences_summary} />
            )}
            {activeTab === 'documents' && (
              <TabDocuments documents={profile.documents} />
            )}
            {activeTab === 'recours' && (
              <TabRecours appeals={profile.appeals} />
            )}
            {activeTab === 'historique' && (
              <TabHistorique
                gradesHistory={profile.grades_history}
                identity={profile.identity}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentProfilePage;
