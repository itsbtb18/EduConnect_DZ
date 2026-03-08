/**
 * Formation Schedule — Training Center
 * Calendar views, session management, conflict detection
 * Views: by day/week, by room, by trainer, by group
 */
import React, { useState, useMemo } from 'react';
import {
  Card, Table, Button, Tag, Drawer, Form, Select, Space,
  Row, Col, DatePicker, TimePicker, Input, Popconfirm,
  Segmented, Alert, Tabs, Calendar, Badge, Modal, message,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, CalendarOutlined,
  EditOutlined, DeleteOutlined, WarningOutlined,
  LeftOutlined, RightOutlined,
} from '@ant-design/icons';
import {
  useTrainingSessions, useCreateSession, useUpdateSession, useDeleteSession,
  useTrainingGroups, useCheckScheduleConflicts,
} from '../../hooks/useFormation';
import { SESSION_STATUS_OPTIONS } from '../../constants/training-center';
import type { TrainingSession, TrainingGroup } from '../../types/formation';
import dayjs, { Dayjs } from 'dayjs';

type ViewMode = 'list' | 'day' | 'week';
type GroupBy = 'none' | 'room' | 'trainer' | 'group';

const FormationSchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingSession | null>(null);
  const [conflictResult, setConflictResult] = useState<{ has_conflicts: boolean; conflicts: { type: string; message: string }[] } | null>(null);
  const [form] = Form.useForm();

  const weekStart = selectedDate.startOf('week');
  const weekEnd = selectedDate.endOf('week');

  const dateParams = viewMode === 'week'
    ? { date_from: weekStart.format('YYYY-MM-DD'), date_to: weekEnd.format('YYYY-MM-DD') }
    : viewMode === 'day'
      ? { date: selectedDate.format('YYYY-MM-DD') }
      : {};

  const { data: sessions, isLoading, refetch } = useTrainingSessions(dateParams);
  const { data: groups } = useTrainingGroups();

  const sessionList = (sessions?.results || []) as TrainingSession[];
  const groupList = (groups?.results || []) as TrainingGroup[];

  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const deleteSession = useDeleteSession();
  const checkConflicts = useCheckScheduleConflicts();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ date: selectedDate, status: 'SCHEDULED' });
    setConflictResult(null);
    setDrawerOpen(true);
  };

  const openEdit = (record: TrainingSession) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
      start_time: dayjs(record.start_time, 'HH:mm'),
      end_time: dayjs(record.end_time, 'HH:mm'),
    });
    setConflictResult(null);
    setDrawerOpen(true);
  };

  const handleCheckConflicts = async () => {
    const values = await form.validateFields();
    const data = {
      group: values.group,
      date: values.date?.format('YYYY-MM-DD'),
      start_time: values.start_time?.format('HH:mm'),
      end_time: values.end_time?.format('HH:mm'),
      room: values.room,
      exclude_session: editing?.id,
    };
    const result = await checkConflicts.mutateAsync(data);
    setConflictResult(result);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      date: values.date?.format('YYYY-MM-DD'),
      start_time: values.start_time?.format('HH:mm'),
      end_time: values.end_time?.format('HH:mm'),
    };
    if (editing) {
      await updateSession.mutateAsync({ id: editing.id, data });
    } else {
      await createSession.mutateAsync(data);
    }
    setDrawerOpen(false);
    form.resetFields();
  };

  // Group sessions for different views
  const groupedSessions = useMemo(() => {
    if (groupBy === 'none') return { 'Toutes les séances': sessionList };
    const key = groupBy === 'room' ? 'room_name' : groupBy === 'trainer' ? 'trainer_name' : 'group_name';
    const grouped: Record<string, TrainingSession[]> = {};
    sessionList.forEach(s => {
      const k = (s as unknown as Record<string, unknown>)[key] as string || 'Non assigné';
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(s);
    });
    return grouped;
  }, [sessionList, groupBy]);

  const navigate = (dir: number) => {
    if (viewMode === 'week') setSelectedDate(d => d.add(dir * 7, 'day'));
    else setSelectedDate(d => d.add(dir, 'day'));
  };

  const sessionColumns = [
    {
      title: 'Groupe', dataIndex: 'group_name', key: 'group',
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: 'Date', dataIndex: 'date', key: 'date',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Horaire', key: 'time',
      render: (_: unknown, r: TrainingSession) =>
        `${r.start_time?.slice(0, 5)} - ${r.end_time?.slice(0, 5)}`,
    },
    { title: 'Salle', dataIndex: 'room_name', key: 'room', render: (v: string) => v || '—' },
    { title: 'Formateur', dataIndex: 'trainer_name', key: 'trainer', render: (v: string) => v || '—' },
    { title: 'Sujet', dataIndex: 'topic', key: 'topic', render: (v: string) => v || '—' },
    {
      title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const opt = SESSION_STATUS_OPTIONS.find(o => o.value === s);
        return <Tag color={opt?.color || 'default'}>{opt?.label || s}</Tag>;
      },
    },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, record: TrainingSession) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Supprimer cette séance ?" onConfirm={() => deleteSession.mutateAsync(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Planning des Séances</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Gestion et visualisation du planning</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nouvelle séance</Button>
        </Space>
      </div>

      {/* Controls */}
      <Row gutter={16} style={{ marginBottom: 16 }} align="middle">
        <Col>
          <Segmented
            value={viewMode}
            onChange={v => setViewMode(v as ViewMode)}
            options={[
              { label: 'Liste', value: 'list' },
              { label: 'Jour', value: 'day' },
              { label: 'Semaine', value: 'week' },
            ]}
          />
        </Col>
        <Col>
          <Select
            value={groupBy}
            onChange={setGroupBy}
            style={{ width: 180 }}
            options={[
              { label: 'Sans regroupement', value: 'none' },
              { label: 'Par salle', value: 'room' },
              { label: 'Par formateur', value: 'trainer' },
              { label: 'Par groupe', value: 'group' },
            ]}
          />
        </Col>
        {viewMode !== 'list' && (
          <Col>
            <Space>
              <Button icon={<LeftOutlined />} onClick={() => navigate(-1)} />
              <DatePicker
                value={selectedDate}
                onChange={d => d && setSelectedDate(d)}
                format="DD/MM/YYYY"
                allowClear={false}
              />
              <Button icon={<RightOutlined />} onClick={() => navigate(1)} />
              <Button onClick={() => setSelectedDate(dayjs())}>Aujourd'hui</Button>
            </Space>
          </Col>
        )}
        <Col flex="auto" style={{ textAlign: 'right' }}>
          <Tag color="blue">{sessionList.length} séance(s)</Tag>
          <Tag color="red">{sessionList.filter(s => s.status === 'CANCELLED').length} annulée(s)</Tag>
        </Col>
      </Row>

      {/* Session Tables */}
      {Object.entries(groupedSessions).map(([label, items]) => (
        <Card
          key={label}
          title={groupBy !== 'none' ? label : undefined}
          style={{ borderRadius: 12, marginBottom: 16 }}
          size={groupBy !== 'none' ? 'small' : 'default'}
        >
          <Table
            dataSource={items}
            columns={sessionColumns}
            rowKey="id"
            loading={isLoading}
            size="small"
            pagination={items.length > 20 ? { pageSize: 20 } : false}
          />
        </Card>
      ))}

      {/* Create / Edit Drawer */}
      <Drawer
        title={editing ? 'Modifier la séance' : 'Nouvelle séance'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button onClick={handleCheckConflicts} loading={checkConflicts.isPending}
              icon={<WarningOutlined />}>
              Vérifier conflits
            </Button>
            <Button type="primary" onClick={handleSubmit}
              loading={createSession.isPending || updateSession.isPending}>
              {editing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </Space>
        }
      >
        {conflictResult && (
          <Alert
            type={conflictResult.has_conflicts ? 'error' : 'success'}
            message={conflictResult.has_conflicts ? 'Conflits détectés' : 'Pas de conflits'}
            description={conflictResult.has_conflicts
              ? conflictResult.conflicts.map((c, i) => <div key={i}>⚠ {c.message}</div>)
              : 'Le créneau est disponible'}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        <Form form={form} layout="vertical">
          <Form.Item name="group" label="Groupe" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner un groupe">
              {groupList.map(g => (
                <Select.Option key={g.id} value={g.id}>
                  {g.name} ({g.formation_name} - {g.level})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_time" label="Début" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_time" label="Fin" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={5} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="room" label="Salle">
            <Input placeholder="Nom de la salle" />
          </Form.Item>
          <Form.Item name="trainer" label="Formateur (ID)">
            <Input placeholder="ID du formateur (optionnel, hérite du groupe)" />
          </Form.Item>
          <Form.Item name="topic" label="Sujet / Thème">
            <Input.TextArea rows={2} placeholder="Sujet de la séance" />
          </Form.Item>
          <Form.Item name="status" label="Statut" initialValue="SCHEDULED">
            <Select>
              {SESSION_STATUS_OPTIONS.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="cancellation_reason"
            label="Motif d'annulation"
            dependencies={['status']}
          >
            <Input.TextArea rows={2} placeholder="Motif si annulée" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default FormationSchedule;
