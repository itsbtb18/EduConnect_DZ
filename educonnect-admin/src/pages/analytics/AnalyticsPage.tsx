import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, LineChart, Line, Legend,
} from 'recharts';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { classAverages } from '../../data/mockData';
import { BadgeColor } from '../../types';

// ─── Chart data ───────────────────────────────────────────────────────────────

const trendData = [
  { trimestre: 'Trim. 1', Maths: 13.2, Français: 12.8, Arabe: 14.1, Physique: 11.9 },
  { trimestre: 'Trim. 2', Maths: 14.1, Français: 13.5, Arabe: 14.8, Physique: 13.2 },
  { trimestre: 'Trim. 3', Maths: 14.8, Français: 14.2, Arabe: 15.1, Physique: 14.0 },
];

const LINE_COLORS: Record<string, string> = {
  Maths:    '#1A6BFF',
  Français: '#FF6B35',
  Arabe:    '#00C48C',
  Physique: '#FFB800',
};

// ─── At-risk students ────────────────────────────────────────────────────────

interface AtRisk {
  id: string;
  name: string;
  className: string;
  average: number;
  absences: number;
}

const atRiskStudents: AtRisk[] = [
  { id: 'r1', name: 'Mohamed Boudiaf', className: '5ème B',   average: 7.2,  absences: 12 },
  { id: 'r2', name: 'Rayan Bouab',     className: '4ème A',   average: 9.4,  absences: 8  },
  { id: 'r3', name: 'Youcef Kaci',     className: '1ère AS A',average: 10.5, absences: 6  },
  { id: 'r4', name: 'Bilal Tebbal',    className: '4ème A',   average: 9.8,  absences: 5  },
  { id: 'r5', name: 'Karim Hadjadj',   className: '3ème B',   average: 7.8,  absences: 11 },
];

const riskLevel = (s: AtRisk): { label: string; color: BadgeColor } =>
  s.average < 8 || s.absences > 10
    ? { label: 'Critique',     color: 'red'    }
    : { label: 'À surveiller', color: 'yellow' };

// ─── Shared styles ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const cardTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#1F2937',
  marginBottom: 16,
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

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const CustomTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({
  active, payload, label,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 8,
        padding: '8px 12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        fontSize: 12,
        color: '#374151',
        border: '1px solid #F3F4F6',
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: '#1F2937' }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} style={{ color: entry.color ?? entry.fill }}>
          {entry.name ?? 'Valeur'}: <strong>{entry.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── Small buttons ────────────────────────────────────────────────────────────

const OutlineSmBtn: React.FC<{ label: string }> = ({ label }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background 0.15s',
        background: hov ? '#E8F0FF' : 'white',
        border: '1.5px solid #1A6BFF',
        color: '#1A6BFF',
      }}
    >
      {label}
    </button>
  );
};

const GhostSmBtn: React.FC<{ label: string }> = ({ label }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12, color: hov ? '#1558d6' : '#6B7280',
        fontFamily: 'var(--font)', padding: '0 4px',
      }}
    >
      {label}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AnalyticsPage: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

    {/* Header */}
    <PageHeader
      title="Analytiques Académiques"
      subtitle="Vue d'ensemble — Année scolaire 2025/2026"
    />

    {/* Stats row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      <StatCard label="MOYENNE ÉCOLE"    value="13.4/20" borderColor="#1A6BFF" />
      <StatCard label="TAUX DE RÉUSSITE" value="78%"     sub="+4% vs trimestre 1"   subColor="#00C48C" borderColor="#00C48C" />
      <StatCard label="ÉLÈVES À RISQUE"  value="23"      sub="nécessitent un suivi" subColor="#FF4757" borderColor="#FF4757" />
      <StatCard label="MEILLEUR ÉLÈVE"   value="18.2/20" sub="Imane Zerrouk"        subColor="#FFB800" borderColor="#FFB800" />
    </div>

    {/* Charts grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

      {/* Bar chart */}
      <div style={card}>
        <div style={cardTitle}>Moyennes par classe</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={classAverages} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="className"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 20]}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0F4FF' }} />
            <Bar dataKey="average" name="Moyenne" fill="#1A6BFF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart */}
      <div style={card}>
        <div style={cardTitle}>Évolution trimestrielle</div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={trendData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="#F3F4F6" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="trimestre"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[10, 16]}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
            {Object.entries(LINE_COLORS).map(([key, color]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2.5}
                dot={{ r: 4, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* At-risk table */}
    <div style={card}>
      <div style={cardTitle}>🚨 Élèves à risque — Nécessitent un suivi immédiat</div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Élève', 'Classe', 'Moyenne actuelle', 'Absences ce mois', 'Risque', 'Action'].map((h) => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {atRiskStudents.map((s, i) => {
              const risk = riskLevel(s);
              const avgColor = s.average < 8 ? '#FF4757' : '#FFB800';
              return (
                <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar name={s.name} size={30} colorIndex={i} />
                      <span style={{ fontWeight: 600, color: '#1F2937' }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={td}>{s.className}</td>
                  <td style={td}>
                    <span style={{ fontWeight: 700, color: avgColor }}>{s.average}/20</span>
                  </td>
                  <td style={td}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: s.absences > 10 ? '#FF4757' : s.absences > 6 ? '#FFB800' : '#374151',
                      }}
                    >
                      {s.absences} absences
                    </span>
                  </td>
                  <td style={td}>
                    <Badge label={risk.label} color={risk.color} />
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <OutlineSmBtn label="Notifier les parents" />
                      <GhostSmBtn  label="Voir le profil" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AnalyticsPage;
