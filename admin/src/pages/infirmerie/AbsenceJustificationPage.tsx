import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Tag, Space, Tooltip, DatePicker, Upload,
  Popconfirm, Card, Descriptions,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, SearchOutlined, FileTextOutlined,
  CheckCircleOutlined, CloseCircleOutlined, UploadOutlined, EyeOutlined,
} from '@ant-design/icons';
import {
  useAbsenceJustifications, useCreateJustification, useValidateJustification,
} from '../../hooks/useApi';
import dayjs from 'dayjs';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'orange' },
  VALIDATED: { label: 'Validée', color: 'green' },
  REJECTED: { label: 'Rejetée', color: 'red' },
};

interface JustificationItem {
  id: string;
  student_name?: string;
  student?: string;
  submitted_by_name?: string;
  absence_date_start: string;
  absence_date_end: string;
  reason: string;
  medical_certificate?: string;
  status: string;
  rejection_reason?: string;
  validated_by_name?: string;
  created_at: string;
}

const AbsenceJustificationPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<JustificationItem | null>(null);
  const [detailItem, setDetailItem] = useState<JustificationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useAbsenceJustifications({
    page, page_size: 20, search: search || undefined,
  });
  const createJustification = useCreateJustification();
  const validateJustification = useValidateJustification();

  const results = (data?.results || data || []) as JustificationItem[];
  const total = (data as Record<string, unknown>)?.count as number ?? results.length;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (key === 'medical_certificate' && value) {
          const fileList = (value as { fileList: { originFileObj: File }[] }).fileList;
          if (fileList?.[0]?.originFileObj) {
            formData.append(key, fileList[0].originFileObj);
          }
        } else if (key === 'absence_date_start' || key === 'absence_date_end') {
          formData.append(key, (value as dayjs.Dayjs).format('YYYY-MM-DD'));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      await createJustification.mutateAsync(formData as unknown as Record<string, unknown>);
      setModalOpen(false);
      form.resetFields();
    } catch { /* validation */ }
  };

  const handleValidate = async (id: string) => {
    await validateJustification.mutateAsync({ id, data: { action: 'validate' } });
  };

  const handleReject = async () => {
    if (!selectedItem) return;
    await validateJustification.mutateAsync({
      id: selectedItem.id,
      data: { action: 'reject', rejection_reason: rejectReason },
    });
    setRejectModalOpen(false);
    setSelectedItem(null);
    setRejectReason('');
  };

  const columns = [
    {
      title: 'Date',
      key: 'dates',
      render: (_: unknown, r: JustificationItem) =>
        `${dayjs(r.absence_date_start).format('DD/MM')} - ${dayjs(r.absence_date_end).format('DD/MM/YYYY')}`,
    },
    {
      title: 'Élève',
      key: 'student',
      render: (_: unknown, r: JustificationItem) => r.student_name || r.student || '—',
    },
    {
      title: 'Motif',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Certificat',
      dataIndex: 'medical_certificate',
      key: 'certificate',
      width: 90,
      render: (v: string) => v ? <Tag color="blue">Oui</Tag> : <Tag>Non</Tag>,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const s = STATUS_MAP[v];
        return <Tag color={s?.color || 'default'}>{s?.label || v}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, r: JustificationItem) => (
        <Space>
          <Tooltip title="Détails">
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => setDetailItem(r)} />
          </Tooltip>
          {r.status === 'PENDING' && (
            <>
              <Popconfirm title="Valider cette justification ?" onConfirm={() => handleValidate(r.id)} okText="Oui" cancelText="Non">
                <Tooltip title="Valider">
                  <Button type="text" icon={<CheckCircleOutlined />} size="small" style={{ color: '#52c41a' }} />
                </Tooltip>
              </Popconfirm>
              <Tooltip title="Rejeter">
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  size="small"
                  danger
                  onClick={() => { setSelectedItem(r); setRejectModalOpen(true); }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><FileTextOutlined className="page-header__icon" /> Justifications d'absence</h1>
          <p>{total} justifications</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            Nouvelle justification
          </Button>
        </div>
      </div>

      <div className="filter-row">
        <Input
          prefix={<SearchOutlined className="search-icon" />}
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          className="search-input"
          style={{ maxWidth: 320 }}
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
            showTotal: (t) => `${t} justifications`,
          }}
          locale={{ emptyText: 'Aucune justification trouvée' }}
        />
      </div>

      {/* Create modal */}
      <Modal
        title="Nouvelle justification d'absence"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createJustification.isPending}
        okText="Soumettre"
        cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Élève" name="student" rules={[{ required: true }]}>
            <Input placeholder="UUID de l'élève" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Date début" name="absence_date_start" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Date fin" name="absence_date_end" rules={[{ required: true }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>
          <Form.Item label="Motif" name="reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Raison de l'absence..." />
          </Form.Item>
          <Form.Item label="Certificat médical" name="medical_certificate">
            <Upload maxCount={1} beforeUpload={() => false} accept=".pdf,.jpg,.jpeg,.png">
              <Button icon={<UploadOutlined />}>Joindre un fichier</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject modal */}
      <Modal
        title="Rejeter la justification"
        open={rejectModalOpen}
        onOk={handleReject}
        onCancel={() => { setRejectModalOpen(false); setSelectedItem(null); }}
        confirmLoading={validateJustification.isPending}
        okText="Rejeter"
        okButtonProps={{ danger: true }}
        cancelText="Annuler"
      >
        <p>Motif du rejet :</p>
        <Input.TextArea
          rows={3}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="Raison du rejet..."
        />
      </Modal>

      {/* Detail modal */}
      <Modal
        title="Détails de la justification"
        open={!!detailItem}
        onCancel={() => setDetailItem(null)}
        footer={null}
        width={600}
      >
        {detailItem && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Élève">{detailItem.student_name || detailItem.student}</Descriptions.Item>
            <Descriptions.Item label="Soumis par">{detailItem.submitted_by_name || '—'}</Descriptions.Item>
            <Descriptions.Item label="Période">
              {dayjs(detailItem.absence_date_start).format('DD/MM/YYYY')} — {dayjs(detailItem.absence_date_end).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              {(() => {
                const s = STATUS_MAP[detailItem.status];
                return <Tag color={s?.color}>{s?.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Motif" span={2}>{detailItem.reason}</Descriptions.Item>
            <Descriptions.Item label="Certificat">{detailItem.medical_certificate ? 'Oui' : 'Non'}</Descriptions.Item>
            <Descriptions.Item label="Validé par">{detailItem.validated_by_name || '—'}</Descriptions.Item>
            {detailItem.rejection_reason && (
              <Descriptions.Item label="Motif rejet" span={2}>{detailItem.rejection_reason}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default AbsenceJustificationPage;
