import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { classAveragesChart, trimesterEvolution, atRiskStudents } from '../../data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';

const AnalyticsPage: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <PageHeader
      title="Analytiques & Rapports"
      subtitle="Vue d'ensemble des performances de l'établissement"
      actions={<button style={btn('primary')}>📤 Exporter le rapport</button>}
    />

    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
      <StatCard label="Moyenne générale" value="13.4/20" sub="+0.5 vs T1" borderColor="#1A6BFF" />
      <StatCard label="Taux de réussite" value="78%" sub="au-dessus de 10/20" borderColor="#00C48C" />
      <StatCard label="Taux d'assiduité" value="92%" sub="cette semaine" borderColor="#FFB800" />
      <StatCard label="Élèves en difficulté" value="23" sub="moyenne < 10" subColor="#FF4757" borderColor="#FF4757" />
    </div>

    {/* Charts */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Bar chart: Class averages */}
      <div className="card">
        <h2 style={h2}>Moyennes par classe</h2>
        <div style={{ height: 260, marginTop: 14 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classAveragesChart}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="average" fill="#1A6BFF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line chart: Trimester evolution */}
      <div className="card">
        <h2 style={h2}>Évolution trimestrielle</h2>
        <div style={{ height: 260, marginTop: 14 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trimesterEvolution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trimester" tick={{ fontSize: 11 }} />
              <YAxis domain={[8, 18]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Maths" stroke="#1A6BFF" strokeWidth={2} />
              <Line type="monotone" dataKey="Physique" stroke="#FF6B35" strokeWidth={2} />
              <Line type="monotone" dataKey="SVT" stroke="#00C48C" strokeWidth={2} />
              <Line type="monotone" dataKey="Arabe" stroke="#FFB800" strokeWidth={2} />
              <Line type="monotone" dataKey="Français" stroke="#9333EA" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* At-risk students */}
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={h2}>🚨 Élèves en difficulté</h2>
        <button style={btn('outline')}>Voir tout</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['Élève', 'Classe', 'Moyenne', 'Absences', 'Tendance', 'Action'].map((h) => (
              <th key={h} style={thStyle}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {atRiskStudents.map((s) => (
            <tr key={s.name}>
              <td style={tdStyle}><span style={{ fontWeight: 600 }}>{s.name}</span></td>
              <td style={tdStyle}>{s.className}</td>
              <td style={{ ...tdStyle, fontWeight: 700, color: s.average < 8 ? '#FF4757' : '#FFB800' }}>{s.average.toFixed(2)}/20</td>
              <td style={tdStyle}>{s.absences} jours</td>
              <td style={tdStyle}>
                <Badge
                  label={s.trend === 'down' ? '↓ Baisse' : s.trend === 'up' ? '↑ Hausse' : '→ Stable'}
                  color={s.trend === 'down' ? 'red' : s.trend === 'up' ? 'green' : 'yellow'}
                />
              </td>
              <td style={tdStyle}>
                <button style={btn('outline')}>Contacter</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0 };
const thStyle: React.CSSProperties = { textAlign: 'left', padding: '10px 12px', fontSize: 11, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', borderBottom: '1px solid #E5E7EB' };
const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid #F3F4F6' };

function btn(variant: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
  switch (variant) {
    case 'primary': return { ...base, background: '#1A6BFF', color: '#fff' };
    case 'outline': return { ...base, background: '#fff', color: '#1A6BFF', border: '1.5px solid #1A6BFF' };
    default: return base;
  }
}

export default AnalyticsPage;
