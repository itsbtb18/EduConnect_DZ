import React, { useState } from 'react';
import { Table, Tag, Select, Button, Card, Empty } from 'antd';
import { CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useScheduleSlots } from '../../hooks/useApi';

const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
];

const dayColors: Record<string, string> = {
  Dimanche: '#1A6BFF',
  Lundi: '#10B981',
  Mardi: '#F59E0B',
  Mercredi: '#EF4444',
  Jeudi: '#6366F1',
};

const TimetablePage: React.FC = () => {
  const { data, isLoading, refetch } = useScheduleSlots();

  const slots = data?.results || [];

  const columns = [
    {
      title: 'Jour',
      dataIndex: 'day',
      key: 'day',
      render: (v: string, r: Record<string, unknown>) => {
        const day = v || (r.day_of_week as string) || '—';
        return <Tag color={dayColors[day] ? 'blue' : 'default'} style={{ fontWeight: 600 }}>{day}</Tag>;
      },
    },
    {
      title: 'Debut',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (v: string) => <span className="font-mono">{v || '—'}</span>,
    },
    {
      title: 'Fin',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (v: string) => <span className="font-mono">{v || '—'}</span>,
    },
    {
      title: 'Matiere',
      dataIndex: 'subject',
      key: 'subject',
      render: (v: string, r: Record<string, unknown>) => (
        <span style={{ fontWeight: 600 }}>{v || (r.subject_name as string) || '—'}</span>
      ),
    },
    {
      title: 'Enseignant',
      dataIndex: 'teacher',
      key: 'teacher',
      render: (v: string, r: Record<string, unknown>) => v || (r.teacher_name as string) || '—',
    },
    {
      title: 'Salle',
      dataIndex: 'room',
      key: 'room',
      render: (v: string) => v ? <Tag>{v}</Tag> : '—',
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Emploi du temps</h1>
          <p>{data?.count ?? 0} creneaux</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
        </div>
      </div>

      {/* Schedule grid view */}
      {slots.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(5, 1fr)', gap: 2, minWidth: 700 }}>
            {/* Header */}
            <div style={{ padding: 8 }} />
            {days.map((d) => (
              <div
                key={d}
                style={{
                  padding: '10px 8px',
                  fontWeight: 700,
                  fontSize: 12,
                  textAlign: 'center',
                  color: 'var(--gray-700)',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {d}
              </div>
            ))}

            {/* Time rows */}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div style={{
                  padding: '8px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--gray-500)',
                  display: 'flex',
                  alignItems: 'center',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {time}
                </div>
                {days.map((day) => {
                  const slot = slots.find((s: Record<string, unknown>) =>
                    ((s.day as string) === day || (s.day_of_week as string) === day) &&
                    ((s.start_time as string) || '').startsWith(time)
                  );
                  if (slot) {
                    return (
                      <div
                        key={day}
                        style={{
                          padding: '8px',
                          background: `${dayColors[day] || '#1A6BFF'}10`,
                          borderLeft: `3px solid ${dayColors[day] || '#1A6BFF'}`,
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: 'var(--gray-900)' }}>
                          {(slot as Record<string, unknown>).subject_name as string || (slot as Record<string, unknown>).subject as string || '—'}
                        </div>
                        <div style={{ color: 'var(--gray-500)', fontSize: 11 }}>
                          {(slot as Record<string, unknown>).room as string || ''}
                        </div>
                      </div>
                    );
                  }
                  return <div key={day} style={{ padding: 8 }} />;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* List view */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={slots}
          loading={isLoading}
          rowKey={(r) => r.id || `${r.day}-${r.start_time}-${Math.random()}`}
          pagination={false}
          locale={{ emptyText: 'Aucun creneau' }}
        />
      </div>
    </div>
  );
};

export default TimetablePage;
