import React, { useState } from 'react';
import { Modal } from 'antd';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { pendingGrades, classAverages } from '../../data/mockData';
import { Grade, BadgeColor } from '../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type LocalStatus = 'submitted' | 'published' | 'returned';

interface GradeRow {
  id: string;
  name: string;
  participation: number;
  compo1: number;
  compo2: number;
  exam: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const calcAvg = (r: GradeRow) =>
  +(r.participation * 0.2 + r.compo1 * 0.2 + r.compo2 * 0.2 + r.exam * 0.4).toFixed(2);

const avgColor = (v: number) =>
  v >= 14 ? '#00C48C' : v >= 12 ? '#1A6BFF' : '#FF6B35';

const barColor = (v: number) =>
  v >= 14 ? '#00C48C' : v >= 12 ? '#1A6BFF' : '#FF6B35';

// ─── Mock review rows ─────────────────────────────────────────────────────────

const MOCK_ROWS: GradeRow[] = [
  { id: 'r1', name: 'Ahmed Benali',     participation: 14.5, compo1: 16.0, compo2: 15.5, exam: 14.0 },
  { id: 'r2', name: 'Sara Hamid',       participation: 12.0, compo1: 13.5, compo2: 12.5, exam: 11.5 },
  { id: 'r3', name: 'Youcef Kaci',      participation: 10.0, compo1: 11.0, compo2: 10.5, exam: 9.5  },
  { id: 'r4', name: 'Nesrine Belhadj',  participation: 16.0, compo1: 17.5, compo2: 16.5, exam: 16.0 },
  { id: 'r5', name: 'Romaissa Slimani', participation: 11.5, compo1: 12.0, compo2: 11.0, exam: 10.5 },
  { id: 'r6', name: 'Meriem Boukhalfa', participation: 13.5, compo1: 14.0, compo2: 13.5, exam: 13.0 },
  { id: 'r7', name: 'Bilal Tebbal',     participation: 9.5,  compo1: 10.5, compo2: 10.0, exam: 8.5  },
  { id: 'r8', name: 'Cylia Adel',       participation: 14.0, compo1: 13.5, compo2: 14.5, exam: 13.5 },
];

// Extra published/returned rows for the bottom table
const EXTRA_ROWS: Array<Grade & { localStatus: LocalStatus }> = [
  { id: 'gx1', studentId: 'sx', studentName: '—', subject: 'Histoire-Géo',       trimester: 2, continuous: 13, test1: 14, test2: 13, final: 14, average: 13.8, status: 'published', submittedBy: 'M. Belkacem',   submittedAt: '20 Fév 2026 12:00', className: '3ème B',  localStatus: 'published' },
  { id: 'gx2', studentId: 'sx', studentName: '—', subject: 'Éducation Islamique', trimester: 2, continuous: 16, test1: 17, test2: 15, final: 16, average: 16.0, status: 'published', submittedBy: 'M. Larbaoui',   submittedAt: '19 Fév 2026 09:30', className: 'CM2 A',   localStatus: 'published' },
  { id: 'gx3', studentId: 'sx', studentName: '—', subject: 'Éducation Physique',  trimester: 2, continuous: 15, test1: 15, test2: 16, final: 14, average: 14.8, status: 'published', submittedBy: 'Mme. Zidane',   submittedAt: '18 Fév 2026 11:00', className: 'CE1 B',   localStatus: 'returned'  },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const th: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid #F3F4F6',
  background: '#F9FAFB',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '11px 14px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
  whiteSpace: 'nowrap',
};

const selectStyle: React.CSSProperties = {
  fontFamily: 'var(--font)',
};

// ─── Small buttons ────────────────────────────────────────────────────────────

interface SmBtnProps {
  label: string;
  color?: 'outline' | 'green' | 'secondary' | 'primary';
  onClick?: () => void;
}

const SmBtn: React.FC<SmBtnProps> = ({ label, color = 'secondary', onClick }) => {
  const [hov, setHov] = useState(false);

  const styles: Record<string, React.CSSProperties> = {
    outline:   { background: hov ? '#E8F0FF' : 'white',   border: '1.5px solid #1A6BFF', color: '#1A6BFF' },
    green:     { background: hov ? '#00a878' : '#00C48C', border: 'none',                color: '#fff'     },
    secondary: { background: hov ? '#F3F4F6' : '#F9FAFB', border: '1.5px solid #D1D5DB', color: '#374151'  },
    primary:   { background: hov ? '#1558d6' : '#1A6BFF', border: 'none',                color: '#fff'     },
  };

  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        padding: '5px 13px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'var(--font)',
        transition: 'background 0.15s',
        ...styles[color],
      }}
    >
      {label}
    </button>
  );
};

// ─── Header action buttons ────────────────────────────────────────────────────

const HdrBtn: React.FC<{ label: string; primary?: boolean }> = ({ label, primary }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        fontFamily: 'var(--font)', cursor: 'pointer', transition: 'background 0.15s',
        background: primary ? (hov ? '#1558d6' : '#1A6BFF') : (hov ? '#F3F4F6' : 'white'),
        border: primary ? 'none' : '1.5px solid #D1D5DB',
        color: primary ? 'white' : '#374151',
      }}
    >
      {label}
    </button>
  );
};

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal: React.FC<{
  grade: Grade | null;
  onClose: () => void;
  onPublish: (id: string) => void;
}> = ({ grade, onClose, onPublish }) => {
  const [comment, setComment] = useState('');

  if (!grade) return null;

  return (
    <Modal
      open={!!grade}
      onCancel={onClose}
      width={720}
      title={
        <span style={{ fontSize: 15, fontWeight: 700, color: '#1F2937' }}>
          Révision des notes — {grade.subject} — {grade.className}
        </span>
      }
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <input
            placeholder="Commentaire pour renvoi…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{
              flex: 1, minWidth: 180, padding: '6px 12px', borderRadius: 8,
              border: '1.5px solid #D1D5DB', fontSize: 13, fontFamily: 'var(--font)',
              outline: 'none',
            }}
          />
          <SmBtn label="Fermer" color="secondary" onClick={onClose} />
          <SmBtn label="Renvoyer à l'enseignant" color="outline" onClick={onClose} />
          <SmBtn label="Publier" color="green" onClick={() => { onPublish(grade.id); onClose(); }} />
        </div>
      }
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Élève', 'Participation (/20)', 'Compo 1 (/20)', 'Compo 2 (/20)', 'Examen (/20)', 'Moyenne'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_ROWS.map((row, i) => {
              const avg = calcAvg(row);
              return (
                <tr key={row.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                  <td style={{ ...td, fontWeight: 600, color: '#1F2937' }}>{row.name}</td>
                  {[row.participation, row.compo1, row.compo2, row.exam].map((v, j) => (
                    <td key={j} style={td}>
                      <input
                        readOnly
                        value={v}
                        style={{
                          width: 60, padding: '4px 8px', borderRadius: 6,
                          border: '1px solid #E5E7EB', fontSize: 13,
                          fontFamily: 'var(--font)', background: '#F9FAFB',
                          textAlign: 'center', color: '#374151',
                        }}
                      />
                    </td>
                  ))}
                  <td style={td}>
                    <span style={{ fontWeight: 700, color: avgColor(avg) }}>{avg}/20</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

// ─── Status badge map ─────────────────────────────────────────────────────────

const statusInfo: Record<LocalStatus, { label: string; color: BadgeColor }> = {
  submitted: { label: 'En attente', color: 'orange' },
  published: { label: 'Publié',     color: 'green'  },
  returned:  { label: 'Renvoyé',    color: 'red'    },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const GradeManagement: React.FC = () => {
  const [reviewing,    setReviewing]    = useState<Grade | null>(null);
  const [localStatus,  setLocalStatus]  = useState<Record<string, LocalStatus>>(
    () => Object.fromEntries(pendingGrades.map((g) => [g.id, 'submitted' as LocalStatus])),
  );

  const handlePublish = (id: string) => {
    setLocalStatus((prev) => ({ ...prev, [id]: 'published' }));
  };

  // Bottom table: pending + extra
  const allTableRows = [
    ...pendingGrades.map((g) => ({ ...g, localStatus: localStatus[g.id] ?? 'submitted' as LocalStatus })),
    ...EXTRA_ROWS,
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <PageHeader
        title="Notes & Bulletins"
        subtitle="Révision et publication des notes trimestrielles"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <HdrBtn label="📄 Générer les bulletins" />
            <HdrBtn label="✅ Tout publier" primary />
          </div>
        }
      />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="EN ATTENTE"        value="14"  sub="notes à réviser"      subColor="#FFB800" borderColor="#FFB800" />
        <StatCard label="PUBLIÉES"          value="187" sub="ce trimestre"          subColor="#00C48C" borderColor="#00C48C" />
        <StatCard label="BULLETINS PRÊTS"   value="58"  sub="prêts à imprimer"     subColor="#1A6BFF" borderColor="#1A6BFF" />
        <StatCard label="CLASSES COMPLÈTES" value="3/8" sub="toutes matières"       subColor="#FF6B35" borderColor="#FF6B35" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>

        {/* Left — pending queue */}
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>
            File d'attente — Notes à valider
          </div>

          {pendingGrades.slice(0, 4).map((g, i) => {
            const status = localStatus[g.id] ?? 'submitted';
            return (
              <div
                key={g.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 0',
                  borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none',
                  opacity: status === 'published' ? 0.5 : 1,
                  transition: 'opacity 0.3s',
                }}
              >
                <Avatar name={g.submittedBy} size={38} colorIndex={i} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {g.subject} — {g.className}
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    {g.submittedBy} · {g.className.includes('AS') || g.className.includes('ème') ? '28–32' : '22–25'} élèves · {g.submittedAt}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {status === 'published' ? (
                    <Badge label="Publié" color="green" />
                  ) : (
                    <>
                      <SmBtn label="Réviser" color="outline" onClick={() => setReviewing(g)} />
                      <SmBtn label="Publier" color="green"   onClick={() => handlePublish(g.id)} />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right — class averages */}
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
            Moyennes par classe — Trimestre 1
          </div>

          {classAverages.map((c) => (
            <div key={c.className} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.className}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: avgColor(c.average) }}>
                  {c.average.toFixed(1)}/20
                </span>
              </div>
              <ProgressBar value={Math.round(c.average * 5)} color={barColor(c.average)} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom — full-width submission table */}
      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
          Statut des soumissions par enseignant
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Enseignant', 'Matière', 'Classe', 'Soumis le', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allTableRows.map((g, i) => {
                const status = g.localStatus;
                return (
                  <tr key={g.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                    <td style={td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={g.submittedBy} size={28} colorIndex={i} />
                        <span style={{ fontWeight: 600 }}>{g.submittedBy}</span>
                      </div>
                    </td>
                    <td style={td}>{g.subject}</td>
                    <td style={td}>
                      <Badge label={g.className} color="blue" />
                    </td>
                    <td style={{ ...td, fontSize: 12, color: '#6B7280' }}>{g.submittedAt}</td>
                    <td style={td}>
                      <Badge label={statusInfo[status].label} color={statusInfo[status].color} />
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {status !== 'published' && (
                          <SmBtn label="Réviser" color="outline" onClick={() => {
                            // For extra rows find matching grade or use first
                            const match = pendingGrades.find((pg) => pg.id === g.id) ?? pendingGrades[0];
                            setReviewing(match);
                          }} />
                        )}
                        {status === 'submitted' && (
                          <SmBtn label="Publier" color="green" onClick={() => {
                            if (pendingGrades.find((pg) => pg.id === g.id)) {
                              handlePublish(g.id);
                            }
                          }} />
                        )}
                        {status === 'published' && (
                          <SmBtn label="Voir" color="secondary" />
                        )}
                        {status === 'returned' && (
                          <SmBtn label="Relancer" color="outline" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        grade={reviewing}
        onClose={() => setReviewing(null)}
        onPublish={handlePublish}
      />
    </div>
  );
};

export default GradeManagement;
