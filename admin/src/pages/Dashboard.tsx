import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import SearchBar from '../components/ui/SearchBar';
import ColorBox from '../components/ui/ColorBox';
import { classes, recentActivities } from '../data/mockData';

const Dashboard: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    {/* Header */}
    <PageHeader
      title="Tableau de bord"
      subtitle="École Privée Ibn Khaldoun — 2025/2026"
      actions={
        <>
          <button style={btn('outline')}>📥 Exporter</button>
          <button style={btn('primary')}>+ Nouvel élève</button>
        </>
      }
    />

    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
      <StatCard label="TOTAL ÉLÈVES" value="284" sub="+12 ce mois" borderColor="#1A6BFF" />
      <StatCard label="ENSEIGNANTS" value="28" sub="4 matières auj." subColor="#FF6B35" borderColor="#FF6B35" />
      <StatCard label="PARENTS ACTIFS" value="231" sub="88% engagés" borderColor="#00C48C" />
      <StatCard label="REVENUS MENSUEL" value="50K" sub="DZD 50,000" subColor="#FFB800" borderColor="#FFB800" />
    </div>

    {/* Main grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
      {/* Recent Activity */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={h2}>Activité Récente</h2>
          <button style={btn('ghost')}>Voir tout →</button>
        </div>
        {recentActivities.map((a, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              padding: '10px 0',
              borderBottom: i < recentActivities.length - 1 ? '1px solid #F3F4F6' : 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: a.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {a.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#374151' }}>{a.message}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Quick Actions */}
        <div className="card">
          <h2 style={{ ...h2, marginBottom: 14 }}>Actions rapides</h2>
          {[
            { icon: '📊', label: 'Publier les notes' },
            { icon: '👥', label: 'Gérer les utilisateurs' },
            { icon: '📢', label: 'Envoyer une annonce' },
            { icon: '📄', label: 'Générer les bulletins' },
          ].map((a, i) => (
            <button
              key={i}
              style={{
                ...btn('ghost'),
                width: '100%',
                justifyContent: 'flex-start',
                padding: '10px 12px',
                marginBottom: 6,
                background: '#F9FAFB',
                color: '#374151',
                borderRadius: 10,
              }}
            >
              <span style={{ fontSize: 16 }}>{a.icon}</span> {a.label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        <div className="card">
          <h2 style={{ ...h2, marginBottom: 12 }}>⚠️ Alertes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ColorBox variant="warning">
              <strong>14 notes en attente de validation</strong> de 3 enseignants
            </ColorBox>
            <ColorBox variant="danger">
              <strong>8 élèves</strong> avec 3+ absences cette semaine
            </ColorBox>
          </div>
        </div>
      </div>
    </div>

    {/* Class Overview */}
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={h2}>Aperçu des classes</h2>
        <SearchBar placeholder="Rechercher une classe..." />
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Classe', 'Niveau', 'Enseignant principal', 'Élèves', 'Moy. Générale', 'Présence', 'Statut'].map(
              (h) => (
                <th key={h} style={th}>
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {classes.slice(0, 5).map((c, i) => (
            <tr key={c.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
              <td style={{ ...td, fontWeight: 600, color: '#1F2937' }}>{c.name}</td>
              <td style={td}>
                <Badge
                  label={c.level}
                  color={c.level === 'Lycée' ? 'blue' : c.level === 'Collège' ? 'orange' : 'green'}
                />
              </td>
              <td style={td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={c.mainTeacher} size={28} />
                  {c.mainTeacher}
                </div>
              </td>
              <td style={td}>{c.studentCount}</td>
              <td
                style={{
                  ...td,
                  fontWeight: 700,
                  color: c.average >= 14 ? '#00C48C' : c.average >= 12 ? '#1A6BFF' : '#FFB800',
                }}
              >
                {c.average}/20
              </td>
              <td style={td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="progress-track" style={{ flex: 1 }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${c.attendanceRate}%`,
                        background: c.attendanceRate >= 92 ? '#00C48C' : '#FFB800',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.attendanceRate}%</span>
                </div>
              </td>
              <td style={td}>
                <Badge
                  label={c.status === 'good' ? 'Bon' : 'Attention'}
                  color={c.status === 'good' ? 'green' : 'yellow'}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ── Helper styles ────────────────────────────────────── */

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0 };
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
};
const td: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
};

function btn(variant: 'primary' | 'outline' | 'ghost' | 'secondary' = 'primary'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 14px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    transition: 'all 0.2s',
  };
  switch (variant) {
    case 'primary':
      return { ...base, background: '#1A6BFF', color: '#fff' };
    case 'outline':
      return { ...base, background: '#fff', color: '#1A6BFF', border: '1.5px solid #1A6BFF' };
    case 'ghost':
      return { ...base, background: 'transparent', color: '#1A6BFF' };
    case 'secondary':
      return { ...base, background: '#F3F4F6', color: '#374151' };
  }
}

export default Dashboard;
