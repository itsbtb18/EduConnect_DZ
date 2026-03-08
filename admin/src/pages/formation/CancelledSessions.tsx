/**
 * Cancelled Sessions — Training Center
 * Quick shortcut to cancel sessions with reason and auto-notification
 */
import React, { useState } from 'react';
import {
  Card, Table, Button, Tag, Space, Select, Input, Modal,
  Form, DatePicker, Row, Col, Empty, message, Alert,
} from 'antd';
import {
  ReloadOutlined, StopOutlined, CalendarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  useTrainingSessions, useUpdateSession, useTrainingGroups,
} from '../../hooks/useFormation';
import { SESSION_STATUS_OPTIONS } from '../../constants/training-center';
import type { TrainingSession, TrainingGroup } from '../../types/formation';
import dayjs from 'dayjs';

const CancelledSessions: React.FC = () => {
  const [cancelModal, setCancelModal] = useState(false);
  const [form] = Form.useForm();
  const [groupFilter, setGroupFilter] = useState<string | undefined>();

  const { data: sessions, isLoading, refetch } = useTrainingSessions({ status: 'CANCELLED' });
  const { data: scheduledSessions } = useTrainingSessions({ status: 'SCHEDULED' });
  const { data: groups } = useTrainingGroups();

  const cancelledList = (sessions?.results || []) as TrainingSession[];
  const scheduledList = (scheduledSessions?.results || []) as TrainingSession[];
  const groupList = (groups?.results || []) as TrainingGroup[];

  const updateSession = useUpdateSession();

  const upcomingForGroup = groupFilter
    ? scheduledList.filter(s => s.group === groupFilter)
    : scheduledList;

  const handleCancel = async () => {
    const values = await form.validateFields();
    await updateSession.mutateAsync({
      id: values.session,
      data: {
        status: 'CANCELLED',
        cancellation_reason: values.reason,
      },
    });
    setCancelModal(false);
    form.resetFields();
    refetch();
  };

  const columns = [
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
    {
      title: 'Motif', dataIndex: 'cancellation_reason', key: 'reason',
      render: (v: string) => v || <span style={{ color: '#94a3b8' }}>Non spécifié</span>,
      ellipsis: true,
    },
    {
      title: 'Statut', key: 'status',
      render: () => <Tag color="red" icon={<StopOutlined />}>Annulée</Tag>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Séances Annulées</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Annuler rapidement une séance avec notification</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" danger icon={<StopOutlined />} onClick={() => setCancelModal(true)}>
            Annuler une séance
          </Button>
        </Space>
      </div>

      <Alert
        message="Annulation rapide"
        description="Sélectionnez un groupe et une séance ci-dessous pour l'annuler avec un motif. Les apprenants concernés seront notifiés automatiquement."
        type="info"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: 16, borderRadius: 8 }}
      />

      <Card
        title={<span><CalendarOutlined style={{ marginRight: 8 }} /> Historique des séances annulées ({cancelledList.length})</span>}
        style={{ borderRadius: 12 }}
      >
        <Table
          dataSource={cancelledList}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="small"
          pagination={{ pageSize: 15 }}
          locale={{ emptyText: <Empty description="Aucune séance annulée" /> }}
        />
      </Card>

      {/* Cancel Session Modal */}
      <Modal
        title="Annuler une séance"
        open={cancelModal}
        onCancel={() => { setCancelModal(false); setGroupFilter(undefined); }}
        onOk={handleCancel}
        confirmLoading={updateSession.isPending}
        okText="Annuler la séance"
        okButtonProps={{ danger: true }}
        cancelText="Fermer"
        width={520}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Filtrer par groupe">
            <Select
              placeholder="Sélectionner un groupe"
              value={groupFilter}
              onChange={v => { setGroupFilter(v); form.setFieldValue('session', undefined); }}
              allowClear
              style={{ width: '100%' }}
            >
              {groupList.map(g => (
                <Select.Option key={g.id} value={g.id}>
                  {g.name} ({g.formation_name})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="session" label="Séance à annuler" rules={[{ required: true, message: 'Sélectionnez une séance' }]}>
            <Select placeholder="Sélectionner une séance planifiée">
              {upcomingForGroup.map(s => (
                <Select.Option key={s.id} value={s.id}>
                  {s.group_name} — {dayjs(s.date).format('DD/MM/YYYY')} {s.start_time?.slice(0, 5)}-{s.end_time?.slice(0, 5)}
                  {s.room_name ? ` (${s.room_name})` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="reason" label="Motif d'annulation" rules={[{ required: true, message: 'Précisez le motif' }]}>
            <Input.TextArea rows={3} placeholder="Ex: Absence du formateur, problème technique, jour férié..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CancelledSessions;
