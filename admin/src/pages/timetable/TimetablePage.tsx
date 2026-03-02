import React, { useState } from 'react';
import { Table, Tag, Button, Modal, Form, Select, TimePicker, Input, Popconfirm, Tooltip, Space } from 'antd';
import {
  ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useScheduleSlots, useCreateScheduleSlot, useUpdateScheduleSlot, useDeleteScheduleSlot, useSubjects, useClasses } from '../../hooks/useApi';
import dayjs from 'dayjs';

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

const dayOptions = days.map((d) => ({ value: d, label: d }));

const TimetablePage: React.FC = () => {
  const { data, isLoading, refetch } = useScheduleSlots();
  const createSlot = useCreateScheduleSlot();
  const updateSlot = useUpdateScheduleSlot();
  const deleteSlot = useDeleteScheduleSlot();
  const { data: subjectsData } = useSubjects();
  const { data: classesData } = useClasses();

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const slots = data?.results || [];
  const subjects = (subjectsData?.results || subjectsData || []) as { id: string; name: string }[];
  const classes = (classesData?.results || classesData || []) as { id: string; name: string }[];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        start_time: values.start_time?.format('HH:mm'),
        end_time: values.end_time?.format('HH:mm'),
      };
      if (editId) {
        await updateSlot.mutateAsync({ id: editId, data: payload });
      } else {
        await createSlot.mutateAsync(payload);
      }
      setModalOpen(false);
      form.resetFields();
      setEditId(null);
    } catch { /* validation */ }
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditId(record.id as string);
    form.setFieldsValue({
      ...record,
      day: record.day || record.day_of_week,
      start_time: record.start_time ? dayjs(record.start_time as string, 'HH:mm') : undefined,
      end_time: record.end_time ? dayjs(record.end_time as string, 'HH:mm') : undefined,
    });
    setModalOpen(true);
  };

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
      title: 'Début',
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
      title: 'Matière',
      dataIndex: 'subject',
      key: 'subject',
      render: (v: string, r: Record<string, unknown>) => (
        <span className="font-semibold">{v || (r.subject_name as string) || '—'}</span>
      ),
    },
    {
      title: 'Classe',
      dataIndex: 'class_assigned',
      key: 'class_assigned',
      render: (v: string, r: Record<string, unknown>) => {
        const name = v || (r.class_name as string);
        return name ? <Tag color="purple">{name}</Tag> : '—';
      },
    },
    {
      title: 'Salle',
      dataIndex: 'room',
      key: 'room',
      render: (v: string) => v ? <Tag>{v}</Tag> : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space>
          <Tooltip title="Modifier">
            <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Supprimer ce créneau ?" onConfirm={() => deleteSlot.mutate(r.id as string)} okText="Oui" cancelText="Non">
            <Tooltip title="Supprimer">
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Emploi du temps</h1>
          <p>{data?.count ?? 0} créneaux</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditId(null); form.resetFields(); setModalOpen(true); }}>
            Ajouter un créneau
          </Button>
        </div>
      </div>

      {/* Schedule grid view */}
      {slots.length > 0 && (
        <div className="card timetable-grid-wrapper">
          <div className="timetable-grid">
            <div className="timetable-empty-cell" />
            {days.map((d) => (
              <div key={d} className="timetable-day-header">{d}</div>
            ))}
            {timeSlots.map((time) => (
              <React.Fragment key={time}>
                <div className="timetable-time-cell">{time}</div>
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
                        onClick={() => openEdit(slot as Record<string, unknown>)}
                        title="Cliquer pour modifier"
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
          rowKey={(r) => r.id || `${r.day}-${r.start_time}-${r.subject}`}
          pagination={false}
          locale={{ emptyText: 'Aucun créneau' }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={editId ? 'Modifier le créneau' : 'Ajouter un créneau'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditId(null); }}
        confirmLoading={createSlot.isPending || updateSlot.isPending}
        okText={editId ? 'Enregistrer' : 'Ajouter'}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Jour" name="day" rules={[{ required: true, message: 'Requis' }]}>
            <Select placeholder="Sélectionner le jour" options={dayOptions} />
          </Form.Item>
          <div className="form-row">
            <Form.Item label="Début" name="start_time" rules={[{ required: true, message: 'Requis' }]} className="form-row__item">
              <TimePicker format="HH:mm" minuteStep={5} className="w-full" />
            </Form.Item>
            <Form.Item label="Fin" name="end_time" rules={[{ required: true, message: 'Requis' }]} className="form-row__item">
              <TimePicker format="HH:mm" minuteStep={5} className="w-full" />
            </Form.Item>
          </div>
          <Form.Item label="Matière" name="subject" rules={[{ required: true, message: 'Requis' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Matière" options={subjects.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
          <Form.Item label="Classe" name="class_assigned">
            <Select showSearch optionFilterProp="label" placeholder="Classe" allowClear options={classes.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item label="Salle" name="room">
            <Input placeholder="Ex: Salle 12" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TimetablePage;
