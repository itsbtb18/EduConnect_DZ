import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';

// ─── Subject colours ──────────────────────────────────────────────────────────

const SUBJECT_COLOR: Record<string, string> = {
  'Mathématiques':      '#1A6BFF',
  'Physique-Chimie':    '#FF6B35',
  'Français':           '#00C48C',
  'Arabe':              '#9B59B6',
  'SVT':                '#27AE60',
  'Histoire-Géo':       '#E67E22',
  'Anglais':            '#2980B9',
  'Éducation Physique': '#16A085',
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const CLASSES = ['1ère AS A', '4ème A', '5ème B', 'CM2 A', 'CE1 B', '3ème B'];

interface Lesson { subject: string; teacher: string; room: string; }
type DayMap = Record<number, Lesson | null>;

const SCHEDULE: Record<string, DayMap> = {
  '08:00': {
    0: { subject: 'Mathématiques',      teacher: 'M. Bouzid',     room: 'Salle A1' },
    1: { subject: 'Français',           teacher: 'Mme. Saadi',    room: 'Salle B2' },
    2: { subject: 'Physique-Chimie',    teacher: 'M. Hamdi',      room: 'Lab PC'   },
    3: { subject: 'Arabe',              teacher: 'M. Meziane',    room: 'Salle A1' },
    4: { subject: 'Mathématiques',      teacher: 'M. Bouzid',     room: 'Salle A1' },
  },
  '09:30': {
    0: { subject: 'Physique-Chimie',    teacher: 'M. Hamdi',      room: 'Lab PC'   },
    1: { subject: 'Mathématiques',      teacher: 'M. Bouzid',     room: 'Salle A1' },
    2: { subject: 'Arabe',              teacher: 'M. Meziane',    room: 'Salle A1' },
    3: { subject: 'Français',           teacher: 'Mme. Saadi',    room: 'Salle B2' },
    4: { subject: 'SVT',                teacher: 'Mme. Rahali',   room: 'Lab SVT'  },
  },
  '11:15': {
    0: { subject: 'Anglais',            teacher: 'Mme. Kerouche', room: 'Salle B3' },
    1: { subject: 'SVT',                teacher: 'Mme. Rahali',   room: 'Lab SVT'  },
    2: { subject: 'Mathématiques',      teacher: 'M. Bouzid',     room: 'Salle A1' },
    3: { subject: 'Histoire-Géo',       teacher: 'M. Kamel',      room: 'Salle C1' },
    4: { subject: 'Physique-Chimie',    teacher: 'M. Hamdi',      room: 'Lab PC'   },
  },
  '14:00': {
    0: { subject: 'Arabe',              teacher: 'M. Meziane',    room: 'Salle A1' },
    1: { subject: 'Histoire-Géo',       teacher: 'M. Kamel',      room: 'Salle C1' },
    2: { subject: 'Français',           teacher: 'Mme. Saadi',    room: 'Salle B2' },
    3: null,
    4: { subject: 'Anglais',            teacher: 'Mme. Kerouche', room: 'Salle B3' },
  },
  '15:30': {
    0: { subject: 'Histoire-Géo',       teacher: 'M. Kamel',      room: 'Salle C1' },
    1: { subject: 'Éducation Physique', teacher: 'M. Djaafri',    room: 'Terrain'  },
    2: null,
    3: null,
    4: null,
  },
};

// Lesson slots in display order
const TIME_SLOTS: { key: string; display: string }[] = [
  { key: '08:00', display: '08:00\n09:30' },
  { key: '09:30', display: '09:30\n11:00' },
  { key: '11:15', display: '11:15\n12:45' },
  { key: '14:00', display: '14:00\n15:30' },
  { key: '15:30', display: '15:30\n17:00' },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  padding: '12px 8px',
  fontSize: 12,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  textAlign: 'center',
  background: '#F9FAFB',
  borderBottom: '1px solid #F3F4F6',
  borderRight: '1px solid #F3F4F6',
};

const TIME_CELL: React.CSSProperties = {
  minWidth: 80,
  width: 80,
  fontSize: 11,
  color: '#9CA3AF',
  textAlign: 'right',
  paddingRight: 12,
  verticalAlign: 'middle' as const,
  borderRight: '1px solid #F3F4F6',
  borderBottom: '1px solid #F3F4F6',
  whiteSpace: 'pre-line',
  lineHeight: 1.6,
};

const DAY_CELL: React.CSSProperties = {
  borderRight: '1px solid #F3F4F6',
  borderBottom: '1px solid #F3F4F6',
  padding: 6,
  minHeight: 80,
  verticalAlign: 'top' as const,
  position: 'relative',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const LessonCard: React.FC<{ lesson: Lesson }> = ({ lesson }) => {
  const bg = SUBJECT_COLOR[lesson.subject] ?? '#6B7280';
  return (
    <div
      style={{
        borderRadius: 10,
        padding: '8px 10px',
        height: '100%',
        background: bg,
        boxSizing: 'border-box',
        minHeight: 68,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 4 }}>
        {lesson.subject}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>
        {lesson.teacher}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
        📍 {lesson.room}
      </div>
    </div>
  );
};

const EmptyCell: React.FC<{ hovered: boolean; onEnter: () => void; onLeave: () => void }> = ({
  hovered, onEnter, onLeave,
}) => (
  <div
    onMouseEnter={onEnter}
    onMouseLeave={onLeave}
    style={{
      borderRadius: 10,
      minHeight: 68,
      background: hovered ? '#F0F4FF' : '#F9FAFB',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.15s',
      cursor: 'pointer',
    }}
  >
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: '#E8F0FF',
        color: '#1A6BFF',
        fontSize: 16,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.15s',
      }}
    >
      +
    </div>
  </div>
);

const BreakRow: React.FC<{ time: string; label: string }> = ({ time, label }) => (
  <tr style={{ background: '#F0F4FF' }}>
    <td style={{ ...TIME_CELL, color: '#9CA3AF', verticalAlign: 'middle', textAlign: 'right' }}>
      {time}
    </td>
    <td
      colSpan={5}
      style={{
        borderBottom: '1px solid #F3F4F6',
        borderRight: '1px solid #F3F4F6',
        textAlign: 'center',
        padding: '10px 0',
        fontSize: 13,
        fontStyle: 'italic',
        color: '#9CA3AF',
        fontWeight: 500,
      }}
    >
      {label}
    </td>
  </tr>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const TimetablePage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('1ère AS A');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const cellKey = (slot: string, day: number) => `${slot}-${day}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Emploi du Temps"
        subtitle={`Classe : ${selectedClass} — 2025/2026`}
        actions={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: '1.5px solid #D1D5DB',
                fontSize: 13,
                fontFamily: 'var(--font)',
                color: '#374151',
                outline: 'none',
                background: 'white',
                cursor: 'pointer',
              }}
            >
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                border: '1.5px solid #1A6BFF',
                background: 'white',
                color: '#1A6BFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              📥 Exporter PDF
            </button>
          </div>
        }
      />

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          padding: '12px 16px',
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        {Object.entries(SUBJECT_COLOR).map(([subj, color]) => (
          <div key={subj} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>{subj}</span>
          </div>
        ))}
      </div>

      {/* Grid wrapper */}
      <div
        style={{
          overflowX: 'auto',
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #F3F4F6',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            minWidth: 680,
          }}
        >
          {/* Column widths */}
          <colgroup>
            <col style={{ width: 80 }} />
            {DAYS.map((d) => <col key={d} />)}
          </colgroup>

          {/* Header */}
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, textAlign: 'right', paddingRight: 12 }}></th>
              {DAYS.map((d) => (
                <th key={d} style={HEADER_CELL}>{d}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* 08:00 – 09:30 */}
            <tr>
              <td style={TIME_CELL}>08:00{'\n'}09:30</td>
              {[0, 1, 2, 3, 4].map((day) => {
                const lesson = SCHEDULE['08:00'][day];
                const key = cellKey('08:00', day);
                return (
                  <td key={day} style={DAY_CELL}>
                    {lesson
                      ? <LessonCard lesson={lesson} />
                      : <EmptyCell
                          hovered={hoveredCell === key}
                          onEnter={() => setHoveredCell(key)}
                          onLeave={() => setHoveredCell(null)}
                        />
                    }
                  </td>
                );
              })}
            </tr>

            {/* 09:30 – 11:00 */}
            <tr>
              <td style={TIME_CELL}>09:30{'\n'}11:00</td>
              {[0, 1, 2, 3, 4].map((day) => {
                const lesson = SCHEDULE['09:30'][day];
                const key = cellKey('09:30', day);
                return (
                  <td key={day} style={DAY_CELL}>
                    {lesson
                      ? <LessonCard lesson={lesson} />
                      : <EmptyCell
                          hovered={hoveredCell === key}
                          onEnter={() => setHoveredCell(key)}
                          onLeave={() => setHoveredCell(null)}
                        />
                    }
                  </td>
                );
              })}
            </tr>

            {/* RÉCRÉATION */}
            <BreakRow time="11:00 – 11:15" label="☕ Récréation" />

            {/* 11:15 – 12:45 */}
            <tr>
              <td style={TIME_CELL}>11:15{'\n'}12:45</td>
              {[0, 1, 2, 3, 4].map((day) => {
                const lesson = SCHEDULE['11:15'][day];
                const key = cellKey('11:15', day);
                return (
                  <td key={day} style={DAY_CELL}>
                    {lesson
                      ? <LessonCard lesson={lesson} />
                      : <EmptyCell
                          hovered={hoveredCell === key}
                          onEnter={() => setHoveredCell(key)}
                          onLeave={() => setHoveredCell(null)}
                        />
                    }
                  </td>
                );
              })}
            </tr>

            {/* PAUSE DÉJEUNER */}
            <BreakRow time="12:45 – 14:00" label="🍽 Pause Déjeuner" />

            {/* 14:00 – 15:30 */}
            <tr>
              <td style={TIME_CELL}>14:00{'\n'}15:30</td>
              {[0, 1, 2, 3, 4].map((day) => {
                const lesson = SCHEDULE['14:00'][day];
                const key = cellKey('14:00', day);
                return (
                  <td key={day} style={DAY_CELL}>
                    {lesson
                      ? <LessonCard lesson={lesson} />
                      : <EmptyCell
                          hovered={hoveredCell === key}
                          onEnter={() => setHoveredCell(key)}
                          onLeave={() => setHoveredCell(null)}
                        />
                    }
                  </td>
                );
              })}
            </tr>

            {/* 15:30 – 17:00 */}
            <tr>
              <td style={{ ...TIME_CELL, borderBottom: 'none' }}>15:30{'\n'}17:00</td>
              {[0, 1, 2, 3, 4].map((day) => {
                const lesson = SCHEDULE['15:30'][day];
                const key = cellKey('15:30', day);
                return (
                  <td key={day} style={{ ...DAY_CELL, borderBottom: 'none' }}>
                    {lesson
                      ? <LessonCard lesson={lesson} />
                      : <EmptyCell
                          hovered={hoveredCell === key}
                          onEnter={() => setHoveredCell(key)}
                          onLeave={() => setHoveredCell(null)}
                        />
                    }
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Stats footer */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Total heures / semaine', value: '27h', color: '#1A6BFF' },
          { label: 'Cours le matin',          value: '15h', color: '#00C48C' },
          { label: 'Cours l\'après-midi',     value: '12h', color: '#FF6B35' },
          { label: 'Enseignants concernés',   value: '8',   color: '#9B59B6' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: '1 1 160px',
              background: '#fff',
              borderRadius: 12,
              padding: '14px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${s.color}`,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginBottom: 2 }}>
              {s.value}
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetablePage;
