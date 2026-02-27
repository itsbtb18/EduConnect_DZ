import React, { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { timetableSlots } from '../../data/mockData';

const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const subjectColors: Record<string, { bg: string; fg: string }> = {
  Mathématiques: { bg: '#DBEAFE', fg: '#1E40AF' },
  Physique: { bg: '#FCE7F3', fg: '#9D174D' },
  'Sciences Naturelles': { bg: '#D1FAE5', fg: '#065F46' },
  SVT: { bg: '#D1FAE5', fg: '#065F46' },
  'Langue Arabe': { bg: '#FEF3C7', fg: '#92400E' },
  Arabe: { bg: '#FEF3C7', fg: '#92400E' },
  Français: { bg: '#E0E7FF', fg: '#3730A3' },
  Anglais: { bg: '#CFFAFE', fg: '#155E75' },
  Histoire: { bg: '#FDE68A', fg: '#78350F' },
  'Histoire-Géo': { bg: '#FDE68A', fg: '#78350F' },
  Informatique: { bg: '#EDE9FE', fg: '#5B21B6' },
  'Éducation Physique': { bg: '#FFE4E6', fg: '#9F1239' },
  'Éd. physique': { bg: '#FFE4E6', fg: '#9F1239' },
  'Éducation Islamique': { bg: '#ECFDF5', fg: '#047857' },
  'Éd. islamique': { bg: '#ECFDF5', fg: '#047857' },
};

const TimetablePage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('1ère AS A');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Emploi du temps"
        subtitle={`Classe : ${selectedClass}`}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={selectStyle}
            >
              <option>1ère AS A</option>
              <option>1ère AS B</option>
              <option>2ème AS A</option>
              <option>3ème AS A</option>
            </select>
            <button style={btn('outline')}>📤 Exporter PDF</button>
            <button style={btn('primary')}>+ Modifier</button>
          </div>
        }
      />

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 80 }}>Horaire</th>
              {days.map((d) => (
                <th key={d} style={thStyle}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour}>
                <td style={{ ...cellStyle, fontWeight: 700, color: '#6B7280', fontSize: 12, textAlign: 'center' }}>
                  {hour}
                </td>
                {days.map((day) => {
                  const slot = timetableSlots.find(
                    (s) => s.day === day && s.startTime === hour,
                  );
                  if (!slot) {
                    return <td key={day} style={cellStyle} />;
                  }
                  const colors = subjectColors[slot.subject] || { bg: '#F3F4F6', fg: '#374151' };
                  return (
                    <td key={day} style={cellStyle}>
                      <div
                        style={{
                          background: colors.bg,
                          color: colors.fg,
                          borderRadius: 10,
                          padding: '8px 10px',
                          minHeight: 52,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          borderLeft: `3px solid ${colors.fg}`,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{slot.subject}</div>
                        <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{slot.teacher}</div>
                        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 1 }}>Salle {slot.room}</div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px', color: '#1F2937' }}>Légende des matières</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Object.entries(subjectColors).map(([subject, c]) => (
            <span
              key={subject}
              style={{
                padding: '4px 10px', borderRadius: 8, background: c.bg, color: c.fg,
                fontSize: 11, fontWeight: 600,
              }}
            >
              {subject}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = {
  textAlign: 'center', padding: '10px 8px', fontSize: 12, fontWeight: 700, color: '#6B7280',
  borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase',
};
const cellStyle: React.CSSProperties = {
  padding: 4, verticalAlign: 'top', borderBottom: '1px solid #F3F4F6',
};
const selectStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8, border: '1.5px solid #E5E7EB', fontSize: 13,
  fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#fff',
};

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

export default TimetablePage;
