import React, { useState } from 'react';
import { Table, Tag, Select, Button, Card, Empty } from 'antd';
import { CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useScheduleSlots } from '../../hooks/useApi';

const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00',
];

const daySlotClasses: Record<string, string> = {
  Dimanche: 'timetable-slot--dimanche',
  Lundi: 'timetable-slot--lundi',
  Mardi: 'timetable-slot--mardi',
  Mercredi: 'timetable-slot--mercredi',
  Jeudi: 'timetable-slot--jeudi',
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
        return <Tag color={daySlotClasses[day] ? 'blue' : 'default'} className="font-semibold">{day}</Tag>;
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
        <span className="font-semibold">{v || (r.subject_name as string) || '—'}</span>
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
        <div className="card timetable-grid-wrapper">
          <div className="timetable-grid">
            {/* Header */}
            <div className="timetable-empty-cell" />
            {days.map((d) => (
              <div key={d} className="timetable-day-header">
                {d}
              </div>
            ))}

            {/* Time rows */}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="timetable-time-cell">
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
                        className={`timetable-slot ${daySlotClasses[day] || 'timetable-slot--default'}`}
                      >
                        <div className="timetable-slot__subject">
                          {(slot as Record<string, unknown>).subject_name as string || (slot as Record<string, unknown>).subject as string || '—'}
                        </div>
                        <div className="timetable-slot__room">
                          {(slot as Record<string, unknown>).room as string || ''}
                        </div>
                      </div>
                    );
                  }
                  return <div key={day} className="timetable-empty-cell" />;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* List view */}
      <div className="card card--table">
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
