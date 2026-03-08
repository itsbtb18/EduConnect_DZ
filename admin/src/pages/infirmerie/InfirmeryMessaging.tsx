import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, Badge, Space, Tooltip,
} from 'antd';
import {
  MessageOutlined, PlusOutlined, ReloadOutlined, MailOutlined, CheckOutlined,
} from '@ant-design/icons';
import { useInfirmerieMessages, useSendInfirmerieMessage } from '../../hooks/useApi';
import dayjs from 'dayjs';

const TEMPLATES = [
  { value: 'CONSULTATION_REPORT', label: 'Rapport de consultation' },
  { value: 'ABSENCE_NOTICE', label: 'Avis d\'absence' },
  { value: 'MEDICATION_REMINDER', label: 'Rappel médicament' },
  { value: 'VACCINATION_REMINDER', label: 'Rappel vaccination' },
  { value: 'EMERGENCY_ALERT', label: 'Alerte urgence' },
  { value: 'ALLERGY_INFO', label: 'Info allergie' },
  { value: 'GENERAL', label: 'Général' },
];

interface MessageItem {
  id: string;
  student_name?: string;
  student?: string;
  sender_name?: string;
  recipient_name?: string;
  template: string;
  subject: string;
  body: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

const InfirmeryMessaging: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailMsg, setDetailMsg] = useState<MessageItem | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useInfirmerieMessages({
    page, page_size: 20, template: filter,
  });
  const sendMessage = useSendInfirmerieMessage();

  const results = (data?.results || data || []) as MessageItem[];
  const total = (data as Record<string, unknown>)?.count as number ?? results.length;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await sendMessage.mutateAsync(values);
      setModalOpen(false);
      form.resetFields();
    } catch { /* validation */ }
  };

  const columns = [
    {
      title: '',
      key: 'read',
      width: 30,
      render: (_: unknown, r: MessageItem) => r.is_read ? null : <Badge status="processing" />,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'date',
      width: 140,
      render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Élève',
      key: 'student',
      render: (_: unknown, r: MessageItem) => r.student_name || r.student || '—',
    },
    {
      title: 'Sujet',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
      render: (v: string, r: MessageItem) => (
        <span style={{ fontWeight: r.is_read ? 'normal' : 'bold' }}>{v}</span>
      ),
    },
    {
      title: 'Template',
      dataIndex: 'template',
      key: 'template',
      render: (v: string) => {
        const t = TEMPLATES.find((tp) => tp.value === v);
        return <Tag>{t?.label || v}</Tag>;
      },
    },
    {
      title: 'Lu',
      dataIndex: 'is_read',
      key: 'is_read',
      width: 60,
      render: (v: boolean) => v ? <CheckOutlined style={{ color: '#52c41a' }} /> : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, r: MessageItem) => (
        <Tooltip title="Voir">
          <Button type="text" icon={<MailOutlined />} size="small" onClick={() => setDetailMsg(r)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><MessageOutlined className="page-header__icon" /> Messagerie Infirmerie</h1>
          <p>{total} messages</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            Nouveau message
          </Button>
        </div>
      </div>

      <div className="filter-row">
        <Select
          placeholder="Filtrer par template"
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1); }}
          allowClear
          style={{ width: 220 }}
          options={TEMPLATES}
        />
      </div>

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={results}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page, pageSize: 20, total,
            onChange: (p) => setPage(p),
            showTotal: (t) => `${t} messages`,
          }}
          locale={{ emptyText: 'Aucun message' }}
        />
      </div>

      {/* Compose modal */}
      <Modal
        title="Nouveau message"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={sendMessage.isPending}
        okText="Envoyer"
        cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="UUID de l'élève" />
          </Form.Item>
          <Form.Item label="Destinataire" name="recipient" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="UUID du destinataire (parent)" />
          </Form.Item>
          <Form.Item label="Template" name="template" rules={[{ required: true }]}>
            <Select options={TEMPLATES} placeholder="Sélectionner" />
          </Form.Item>
          <Form.Item label="Sujet" name="subject" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Sujet du message" />
          </Form.Item>
          <Form.Item label="Message" name="body" rules={[{ required: true, message: 'Requis' }]}>
            <Input.TextArea rows={5} placeholder="Contenu du message..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Message detail modal */}
      <Modal
        title={detailMsg?.subject || 'Message'}
        open={!!detailMsg}
        onCancel={() => setDetailMsg(null)}
        footer={null}
        width={600}
      >
        {detailMsg && (
          <div>
            <div style={{ marginBottom: 12, color: '#888' }}>
              <div>Élève : {detailMsg.student_name || detailMsg.student}</div>
              <div>De : {detailMsg.sender_name || '—'} → {detailMsg.recipient_name || '—'}</div>
              <div>Date : {dayjs(detailMsg.created_at).format('DD/MM/YYYY HH:mm')}</div>
              {detailMsg.read_at && <div>Lu le : {dayjs(detailMsg.read_at).format('DD/MM/YYYY HH:mm')}</div>}
            </div>
            <div style={{ whiteSpace: 'pre-wrap', padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
              {detailMsg.body}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InfirmeryMessaging;
