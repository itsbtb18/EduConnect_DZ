import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { teachers } from '../../data/mockData';

const AVATAR_COLORS = ['#1A6BFF', '#FF6B35', '#00C48C', '#FFB800', '#9B59B6', '#E74C3C'];

const TeacherList: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <PageHeader
      title="Enseignants"
      subtitle="28 enseignants actifs"
      actions={<button style={btn('primary')}>+ Ajouter un enseignant</button>}
    />

    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
      <StatCard label="Enseignants actifs" value="28" borderColor="#1A6BFF" />
      <StatCard label="Notes soumises" value="47" borderColor="#FF6B35" />
      <StatCard label="Taux de soumission" value="84%" borderColor="#00C48C" />
      <StatCard label="Classes assignées" value="32" borderColor="#FFB800" />
    </div>

    {/* Table */}
    <div className="card">
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Enseignant', 'Spécialité', 'Classes assignées', 'Notes soumises', 'Dernière activité', 'Statut', 'Actions'].map(
              (h) => (
                <th key={h} style={th}>{h}</th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {teachers.map((t, i) => (
            <tr key={t.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
              <td style={td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={`${t.firstName} ${t.lastName}`} size={34} color={AVATAR_COLORS[i % 6]} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1F2937', fontSize: 13 }}>
                      {t.lastName === 'Hadj' || t.lastName === 'Amrani' || t.lastName === 'Belkacem' || t.lastName === 'Touati' || t.lastName === 'Berkani'
                        ? 'Mme.'
                        : 'M.'}{' '}
                      {t.firstName} {t.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{t.email}</div>
                  </div>
                </div>
              </td>
              <td style={td}>
                <Badge label={t.subject} color="blue" />
              </td>
              <td style={{ ...td, fontSize: 12 }}>{t.classes.join(', ')}</td>
              <td style={td}>
                <span style={{ fontWeight: 600 }}>{t.gradesSubmitted}</span>
                <span style={{ color: '#6B7280' }}>/{t.totalGrades}</span>
              </td>
              <td style={{ ...td, fontSize: 12, color: '#6B7280' }}>{t.lastActivity}</td>
              <td style={td}>
                <Badge label={t.status === 'active' ? 'Actif' : 'Inactif'} color={t.status === 'active' ? 'green' : 'gray'} />
              </td>
              <td style={td}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={btn('outline')}>Voir</button>
                  <button style={btn('secondary')}>⋯</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const th: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB',
};
const td: React.CSSProperties = {
  padding: '12px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6',
};

function btn(variant: 'primary' | 'outline' | 'ghost' | 'secondary' = 'primary'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
  switch (variant) {
    case 'primary': return { ...base, background: '#1A6BFF', color: '#fff' };
    case 'outline': return { ...base, background: '#fff', color: '#1A6BFF', border: '1.5px solid #1A6BFF' };
    case 'ghost': return { ...base, background: 'transparent', color: '#1A6BFF' };
    case 'secondary': return { ...base, background: '#F3F4F6', color: '#374151' };
  }
}

export default TeacherList;
