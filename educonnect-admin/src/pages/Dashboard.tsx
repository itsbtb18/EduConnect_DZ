import React, { useState } from 'react';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import SearchBar from '../components/ui/SearchBar';
import ProgressBar from '../components/ui/ProgressBar';
import PageHeader from '../components/ui/PageHeader';
import { classrooms } from '../data/mockData';
import { BadgeColor } from '../types';

const activities = [
  { bg: '#E8F0FF', emoji: '📋', text: "Mme. Meriem a soumis les notes de 4ème A — Maths",      time: 'il y a 2 min'  },
  { bg: '#E6FAF5', emoji: '✅', text: "Admin a publié les bulletins T1 pour 3ème B",             time: 'il y a 15 min' },
  { bg: '#FFF0EB', emoji: '📢', text: "Nouvelle annonce envoyée à tous les parents",             time: 'il y a 1h'     },
  { bg: '#FFF8E6', emoji: '👤', text: "Nouvel élève Ahmed Benali inscrit en 2ème AS",            time: 'il y a 2h'     },
  { bg: '#F3F4F6', emoji: '📁', text: "Import en masse : 42 élèves ajoutés — Primaire",         time: 'Hier'          },
];

const quickActions = [
  { emoji: '📊', label: 'Publier les notes' },
  { emoji: '👥', label: 'Gérer les utilisateurs' },
  { emoji: '📢', label: 'Envoyer une annonce' },
  { emoji: '📄', label: 'Générer les bulletins' },
];

const levelColor: Record<string, BadgeColor> = {
  Lycée:    'blue',
  Collège:  'orange',
  Primaire: 'green',
};

const avgColor = (avg: number) => {
  if (avg >= 14) return '#00C48C';
  if (avg >= 12) return '#1A6BFF';
  return '#FFB800';
};

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const Dashboard: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = classrooms.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.teacher.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Tableau de bord"
        subtitle="Bienvenue, voici un aperçu de votre établissement."
      />

      {/* Section 1 — Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="TOTAL ÉLÈVES"   value="284" sub="+12 ce mois"     subColor="#00C48C" borderColor="#1A6BFF" />
        <StatCard label="ENSEIGNANTS"    value="28"  sub="4 matières auj." subColor="#FF6B35" borderColor="#FF6B35" />
        <StatCard label="PARENTS ACTIFS" value="231" sub="88% engagés"     subColor="#00C48C" borderColor="#00C48C" />
        <StatCard label="REVENUS MENSUEL"value="50K" sub="DZD / mois"      subColor="#FFB800" borderColor="#FFB800" />
      </div>

      {/* Section 2 — Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>

        {/* Left — Activité Récente */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>Activité Récente</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#1A6BFF', fontFamily: 'var(--font)' }}>
              Voir tout →
            </button>
          </div>

          {activities.map((a, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < activities.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: a.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {a.emoji}
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#374151' }}>{a.text}</div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Card A — Actions rapides */}
          <div style={card}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
              Actions rapides
            </div>
            {quickActions.map((a, i) => (
              <QuickActionBtn key={i} emoji={a.emoji} label={a.label} />
            ))}
          </div>

          {/* Card B — Alertes */}
          <div style={card}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 12 }}>
              ⚠️ Alertes
            </div>
            <div
              style={{
                padding: '10px 12px',
                background: '#FFF8E6',
                borderRadius: 10,
                fontSize: 12,
                color: '#92400E',
                marginBottom: 8,
              }}
            >
              14 notes en attente de validation par 3 enseignants
            </div>
            <div
              style={{
                padding: '10px 12px',
                background: '#FFE8EA',
                borderRadius: 10,
                fontSize: 12,
                color: '#991B1B',
              }}
            >
              8 élèves avec 3+ absences cette semaine
            </div>
          </div>
        </div>
      </div>

      {/* Section 3 — Aperçu des classes */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>Aperçu des classes</span>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une classe…" maxWidth={260} />
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Classe', 'Niveau', 'Enseignant principal', 'Élèves', 'Moy. Générale', 'Présence', 'Statut'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#6B7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid #F3F4F6',
                    background: '#F9FAFB',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((cls, i) => (
              <tr key={cls.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                <td style={td}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{cls.name}</span>
                </td>
                <td style={td}>
                  <Badge label={cls.level} color={levelColor[cls.level]} />
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={cls.teacher} size={28} colorIndex={i} />
                    <span>{cls.teacher}</span>
                  </div>
                </td>
                <td style={td}>{cls.studentCount}</td>
                <td style={td}>
                  <span style={{ fontWeight: 700, color: avgColor(cls.average) }}>
                    {cls.average.toFixed(1)}/20
                  </span>
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 80 }}>
                      <ProgressBar value={cls.attendanceRate} />
                    </div>
                    <span style={{ fontSize: 12, color: '#374151' }}>{cls.attendanceRate}%</span>
                  </div>
                </td>
                <td style={td}>
                  <Badge
                    label={cls.attendanceRate >= 90 && cls.average >= 12 ? 'Bon' : 'Attention'}
                    color={cls.attendanceRate >= 90 && cls.average >= 12 ? 'green' : 'yellow'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const td: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
};

const QuickActionBtn: React.FC<{ emoji: string; label: string }> = ({ emoji, label }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        background: hovered ? '#F3F4F6' : '#F9FAFB',
        border: 'none',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: 600,
        color: '#374151',
        marginBottom: 6,
        fontFamily: 'var(--font)',
        textAlign: 'left',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ fontSize: 16 }}>{emoji}</span>
      {label}
    </button>
  );
};

export default Dashboard;
