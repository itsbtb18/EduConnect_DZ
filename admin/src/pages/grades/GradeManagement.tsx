import React, { useState } from 'react';
import { Modal } from 'antd';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { gradeSubmissions, classes, grades } from '../../data/mockData';
import type { GradeSubmission } from '../../types';

const AVATAR_COLORS = ['#1A6BFF', '#FF6B35', '#00C48C', '#9B59B6'];

const GradeManagement: React.FC = () => {
  const [reviewItem, setReviewItem] = useState<GradeSubmission | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Gestion des Notes"
        subtitle="Révision et publication des notes trimestrielles"
        actions={
          <>
            <button style={btn('accent')}>📄 Générer les bulletins</button>
            <button style={btn('primary')}>✅ Tout publier</button>
          </>
        }
      />

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'En attente', value: '14', icon: '⏳', color: '#FFB800' },
          { label: 'Publiées', value: '187', icon: '✅', color: '#00C48C' },
          { label: 'Bulletins prêts', value: '58', icon: '📄', color: '#1A6BFF' },
          { label: 'Classes complètes', value: '3/8', icon: '🏫', color: '#FF6B35' },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: s.color + '18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {s.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* Pending queue */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0, marginBottom: 16 }}>
            File d'attente — Notes à valider
          </h2>
          {gradeSubmissions.map((g, i) => (
            <div
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 0',
                borderBottom: i < gradeSubmissions.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <Avatar name={g.teacher} size={38} color={AVATAR_COLORS[i]} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>
                  {g.subject} — {g.className}
                </div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>
                  {g.teacher} · {g.studentCount} élèves · {g.submittedAt}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={btn('outline')} onClick={() => setReviewItem(g)}>
                  Réviser
                </button>
                <button style={btn('success')}>Publier</button>
              </div>
            </div>
          ))}
        </div>

        {/* Class averages */}
        <div className="card">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0, marginBottom: 14 }}>
            Moyennes par classe — Trimestre 1
          </h2>
          {classes.slice(0, 5).map((c, i) => {
            const color = c.average >= 14 ? '#00C48C' : c.average >= 12 ? '#1A6BFF' : '#FFB800';
            return (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{c.name}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{c.average}/20</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${c.average * 5}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        open={!!reviewItem}
        onCancel={() => setReviewItem(null)}
        title={reviewItem ? `Réviser — ${reviewItem.subject} · ${reviewItem.className}` : ''}
        width={800}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button style={btn('secondary')} onClick={() => setReviewItem(null)}>Enregistrer brouillon</button>
            <button style={btn('primary')}>Soumettre à l'admin</button>
          </div>
        }
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              {['Nom', 'Participation', 'Comp. 1', 'Comp. 2', 'Examen', 'Moyenne'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grades.slice(0, 5).map((g) => (
              <tr key={g.id}>
                <td style={{ ...td, fontWeight: 600 }}>{g.studentName}</td>
                <td style={td}><input defaultValue={g.continuous} style={inputStyle} /></td>
                <td style={td}><input defaultValue={g.test1} style={inputStyle} /></td>
                <td style={td}><input defaultValue={g.test2} style={inputStyle} /></td>
                <td style={td}><input defaultValue={g.final} style={inputStyle} /></td>
                <td style={{ ...td, fontWeight: 700, color: g.average >= 14 ? '#00C48C' : g.average >= 10 ? '#1A6BFF' : '#FF4757' }}>
                  {g.average}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  );
};

const th: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB',
};
const td: React.CSSProperties = {
  padding: '12px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6',
};
const inputStyle: React.CSSProperties = {
  width: 60, padding: '6px 10px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 13,
  textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif",
};

function btn(variant: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
  switch (variant) {
    case 'primary': return { ...base, background: '#1A6BFF', color: '#fff' };
    case 'accent': return { ...base, background: '#FF6B35', color: '#fff' };
    case 'success': return { ...base, background: '#00C48C', color: '#fff' };
    case 'outline': return { ...base, background: '#fff', color: '#1A6BFF', border: '1.5px solid #1A6BFF' };
    case 'secondary': return { ...base, background: '#F3F4F6', color: '#374151' };
    default: return { ...base, background: '#1A6BFF', color: '#fff' };
  }
}

export default GradeManagement;
