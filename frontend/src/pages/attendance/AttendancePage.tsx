import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { attendanceRecords, weeklyAttendance } from '../../data/mockData';

const AttendancePage: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <PageHeader
      title="Gestion des Absences"
      subtitle="Aujourd'hui : Vendredi, 27 Février 2026"
      actions={<button style={btn('primary')}>📤 Exporter le rapport</button>}
    />

    {/* Stats */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
      <StatCard label="Présents aujourd'hui" value="261" sub="92% taux" borderColor="#00C48C" />
      <StatCard label="Absents aujourd'hui" value="18" sub="6.3% taux" subColor="#FF4757" borderColor="#FF4757" />
      <StatCard label="En retard aujourd'hui" value="5" sub="1.7% taux" subColor="#FFB800" borderColor="#FFB800" />
      <StatCard label="Non justifiés" value="11" sub="notifiés" subColor="#FF6B35" borderColor="#FF6B35" />
    </div>

    {/* Grid */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Today's absences */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={h2}>Liste des absences — Aujourd'hui</h2>
          <button style={btn('ghost')}>Notifier tous →</button>
        </div>
        {attendanceRecords
          .filter((a) => a.status !== 'present')
          .slice(0, 5)
          .map((s, i, arr) => (
            <div
              key={s.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <Avatar name={s.studentName} size={32} color="#6B7280" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{s.studentName}</div>
                <div style={{ fontSize: 11, color: '#6B7280' }}>{s.className}</div>
              </div>
              <Badge label={s.status === 'late' ? 'En retard' : 'Absent'} color={s.status === 'late' ? 'yellow' : 'red'} />
              {s.excused ? (
                <Badge label="Excusé" color="green" />
              ) : (
                <button style={btn('outline')}>Notifier</button>
              )}
            </div>
          ))}
      </div>

      {/* Weekly attendance */}
      <div className="card">
        <h2 style={{ ...h2, marginBottom: 14 }}>Taux de présence — Cette semaine</h2>
        {weeklyAttendance.map((day, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>{day.day}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: day.rate >= 92 ? '#00C48C' : '#FFB800' }}>
                {day.rate}%
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${day.rate}%`, background: day.rate >= 92 ? '#00C48C' : '#FFB800' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Calendar placeholder */}
    <div className="card">
      <h2 style={{ ...h2, marginBottom: 16 }}>📅 Calendrier des présences — Février 2026</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#6B7280', padding: 8 }}>
            {d}
          </div>
        ))}
        {Array.from({ length: 28 }, (_, i) => {
          const day = i + 1;
          const rate = 85 + Math.floor(Math.random() * 15);
          return (
            <div
              key={day}
              style={{
                textAlign: 'center',
                padding: 10,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                background: rate >= 95 ? '#E6FAF5' : rate >= 90 ? '#FFF8E6' : '#FFE8EA',
                color: rate >= 95 ? '#065F46' : rate >= 90 ? '#92400E' : '#991B1B',
              }}
            >
              {day}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const h2: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#1F2937', margin: 0 };

function btn(variant: string): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
  switch (variant) {
    case 'primary': return { ...base, background: '#1A6BFF', color: '#fff' };
    case 'outline': return { ...base, background: '#fff', color: '#1A6BFF', border: '1.5px solid #1A6BFF' };
    case 'ghost': return { ...base, background: 'transparent', color: '#1A6BFF' };
    default: return { ...base, background: '#F3F4F6', color: '#374151' };
  }
}

export default AttendancePage;
