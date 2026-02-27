import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import ProgressBar from '../../components/ui/ProgressBar';
import { attendanceToday, weeklyAttendance } from '../../data/mockData';

// ─── Calendar data ────────────────────────────────────────────────────────────
// February 2026 starts on Sunday (day index 0)
// Color levels: 'low' | 'moderate' | 'high' | 'today' | 'empty'
type CellLevel = 'low' | 'moderate' | 'high' | 'today' | 'empty';

const CELL_LEVELS: Record<number, CellLevel> = {
  3:  'moderate',
  4:  'low',
  5:  'low',
  6:  'high',
  8:  'low',
  9:  'low',
  10: 'moderate',
  11: 'low',
  12: 'high',
  13: 'low',
  15: 'low',
  16: 'moderate',
  17: 'low',
  18: 'low',
  19: 'high',
  22: 'low',
  23: 'low',
  24: 'moderate',
  25: 'low',
  26: 'low',
  27: 'today',
};

const cellBg = (level: CellLevel): React.CSSProperties => {
  switch (level) {
    case 'high':     return { background: '#FFE8EA', color: '#FF4757' };
    case 'moderate': return { background: '#FFF8E6', color: '#92400E' };
    case 'low':      return { background: '#E6FAF5', color: '#065F46' };
    case 'today':    return { background: '#1A6BFF', color: '#fff', fontWeight: 700 };
    default:         return { background: 'transparent', color: '#D1D5DB' };
  }
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

// ─── Small buttons ────────────────────────────────────────────────────────────

const SmBtn: React.FC<{ label: string; onClick?: () => void }> = ({ label, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
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

const HdrBtn: React.FC<{ label: string }> = ({ label }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
        fontFamily: 'var(--font)', cursor: 'pointer', transition: 'background 0.15s',
        background: hov ? '#F3F4F6' : 'white',
        border: '1.5px solid #D1D5DB',
        color: '#374151',
      }}
    >
      {label}
    </button>
  );
};

const presenceColor = (rate: number) =>
  rate >= 92 ? '#00C48C' : rate >= 85 ? '#FFB800' : '#FF4757';

// ─── Calendar ────────────────────────────────────────────────────────────────

const Calendar: React.FC = () => {
  // Feb 2026 has 28 days, starts on Sunday (index 0)
  const DAY_HEADERS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu'];
  const TOTAL_DAYS  = 28;
  const START_DOW   = 0; // Sunday

  // Build 5 weeks × 5 days (Sun–Thu, Algerian school week)
  const weeks: (number | null)[][] = [];
  let dayNum = 1 - START_DOW; // could start negative, padded with null

  for (let w = 0; w < 5; w++) {
    const week: (number | null)[] = [];
    for (let d = 0; d < 5; d++) {
      const n = dayNum + w * 5 + d;
      week.push(n >= 1 && n <= TOTAL_DAYS ? n : null);
    }
    weeks.push(week);
  }

  // Recalculate using proper offset
  const cells: (number | null)[] = [];
  for (let i = 0; i < START_DOW; i++) cells.push(null);
  for (let d = 1; d <= TOTAL_DAYS; d++) cells.push(d);
  // pad to multiple of 5
  while (cells.length % 5 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 5) {
    rows.push(cells.slice(i, i + 5));
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 6 }}>
        {DAY_HEADERS.map((h) => (
          <div
            key={h}
            style={{
              textAlign: 'center', fontSize: 11, fontWeight: 700,
              color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px',
              padding: '4px 0',
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Date rows */}
      {rows.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 6 }}>
          {week.map((day, di) => {
            if (!day) {
              return <div key={di} style={{ width: 40, height: 40 }} />;
            }
            const level: CellLevel = CELL_LEVELS[day] ?? 'empty';
            const styles = cellBg(level);
            return (
              <div
                key={di}
                style={{
                  width: 40, height: 40, borderRadius: 8, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, cursor: level !== 'empty' ? 'pointer' : 'default',
                  margin: '0 auto',
                  ...styles,
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          { dot: '🟢', label: 'Faible (<5%)'    },
          { dot: '🟡', label: 'Modéré (5–10%)' },
          { dot: '🔴', label: 'Élevé (>10%)'   },
        ].map((item) => (
          <span key={item.label} style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
            {item.dot} {item.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const AttendancePage: React.FC = () => {
  const absentOrLate = attendanceToday.filter((r) => r.status === 'absent' || r.status === 'late');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <PageHeader
        title="Gestion des Absences"
        subtitle="Dimanche 27 Février 2026"
        actions={<HdrBtn label="📤 Exporter le rapport" />}
      />

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="PRÉSENTS AUJOURD'HUI" value="261" sub="92% de présence" subColor="#00C48C" borderColor="#00C48C" />
        <StatCard label="ABSENTS"              value="18"  sub="6.3% du total"   subColor="#FF4757" borderColor="#FF4757" />
        <StatCard label="EN RETARD"            value="5"   sub="1.7% du total"   subColor="#FFB800" borderColor="#FFB800" />
        <StatCard label="NON JUSTIFIÉS"        value="11"  sub="notifiés"        subColor="#FF6B35" borderColor="#FF6B35" />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Left — absence list */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
              Liste des absences — Aujourd'hui
            </span>
            <button
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: '#1A6BFF', fontFamily: 'var(--font)',
              }}
            >
              Notifier tous →
            </button>
          </div>

          {absentOrLate.map((record, i) => (
            <div
              key={record.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 0',
                borderBottom: i < absentOrLate.length - 1 ? '1px solid #F3F4F6' : 'none',
              }}
            >
              <Avatar name={record.studentName} size={32} colorIndex={i} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {record.studentName}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                  {record.className}
                </div>
              </div>

              <Badge
                label={record.status === 'absent' ? 'Absent' : 'En retard'}
                color={record.status === 'absent' ? 'red' : 'yellow'}
              />

              {record.excused
                ? <Badge label="Excusé" color="green" />
                : <SmBtn label="Notifier" />
              }
            </div>
          ))}
        </div>

        {/* Right — weekly attendance */}
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
            Taux de présence — Cette semaine
          </div>

          {weeklyAttendance.map((day) => (
            <div key={day.day} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{day.day}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: presenceColor(day.rate) }}>
                  {day.rate}%
                </span>
              </div>
              <ProgressBar value={day.rate} />
            </div>
          ))}
        </div>
      </div>

      {/* Calendar card */}
      <div style={card}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937', marginBottom: 16 }}>
          Calendrier d'absences — Février 2026
        </div>
        <Calendar />
      </div>
    </div>
  );
};

export default AttendancePage;
