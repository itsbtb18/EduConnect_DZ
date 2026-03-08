import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, InputNumber, Tag, Space,
  Spin, Tooltip, DatePicker, Switch, Divider, Card, Descriptions,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, SearchOutlined, HeartOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useConsultations, useCreateConsultation } from '../../hooks/useApi';
import dayjs from 'dayjs';

const REASONS = [
  { value: 'HEADACHE', label: 'Maux de tête' },
  { value: 'STOMACH', label: 'Maux de ventre' },
  { value: 'FEVER', label: 'Fièvre' },
  { value: 'INJURY', label: 'Blessure' },
  { value: 'ALLERGY_REACTION', label: 'Réaction allergique' },
  { value: 'ASTHMA', label: 'Crise d\'asthme' },
  { value: 'DIABETES', label: 'Malaise diabétique' },
  { value: 'EPILEPSY', label: 'Épilepsie' },
  { value: 'NAUSEA', label: 'Nausée' },
  { value: 'DIZZINESS', label: 'Vertige' },
  { value: 'EYE', label: 'Oculaire' },
  { value: 'DENTAL', label: 'Dentaire' },
  { value: 'SKIN', label: 'Cutané' },
  { value: 'PSYCHOLOGICAL', label: 'Psychologique' },
  { value: 'MEDICATION_ADMIN', label: 'Administration de médicament' },
  { value: 'FOLLOW_UP', label: 'Suivi' },
  { value: 'OTHER', label: 'Autre' },
];

const OUTCOMES = [
  { value: 'RETURNED_CLASS', label: 'Retour en classe', color: 'green' },
  { value: 'REST_INFIRMARY', label: 'Repos à l\'infirmerie', color: 'blue' },
  { value: 'CONTACT_PARENT', label: 'Parent contacté', color: 'orange' },
  { value: 'SENT_HOME', label: 'Renvoyé à la maison', color: 'gold' },
  { value: 'EMERGENCY', label: 'Urgence médicale', color: 'red' },
  { value: 'HOSPITAL', label: 'Transfert hôpital', color: 'magenta' },
  { value: 'FOLLOW_UP_NEEDED', label: 'Suivi nécessaire', color: 'purple' },
];

interface ConsultItem {
  id: string;
  student_name?: string;
  student?: string;
  nurse_name?: string;
  reason: string;
  outcome: string;
  temperature?: number;
  blood_pressure?: string;
  spo2?: number;
  pulse?: number;
  care_provided?: string;
  notes?: string;
  parent_contacted: boolean;
  created_at: string;
}

const ConsultationPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<ConsultItem | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useConsultations({
    page, page_size: 20,
    search: search || undefined,
    reason: reasonFilter,
  });
  const createConsultation = useCreateConsultation();

  const results = (data?.results || data || []) as ConsultItem[];
  const total = (data as Record<string, unknown>)?.count as number ?? results.length;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await createConsultation.mutateAsync(values);
      setModalOpen(false);
      form.resetFields();
    } catch { /* validation */ }
  };

  const columns = [
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
      render: (_: unknown, r: ConsultItem) => r.student_name || r.student || '—',
    },
    {
      title: 'Motif',
      dataIndex: 'reason',
      key: 'reason',
      render: (v: string) => REASONS.find((r) => r.value === v)?.label || v,
    },
    {
      title: 'Issue',
      dataIndex: 'outcome',
      key: 'outcome',
      render: (v: string) => {
        const o = OUTCOMES.find((oc) => oc.value === v);
        return <Tag color={o?.color || 'default'}>{o?.label || v}</Tag>;
      },
    },
    {
      title: 'T°',
      dataIndex: 'temperature',
      key: 'temperature',
      width: 70,
      render: (v: number) => v ? `${v}°` : '—',
    },
    {
      title: 'Parent',
      dataIndex: 'parent_contacted',
      key: 'parent_contacted',
      width: 70,
      render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, r: ConsultItem) => (
        <Tooltip title="Détails">
          <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => setDetailItem(r)} />
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><HeartOutlined className="page-header__icon" /> Consultations</h1>
          <p>{total} consultations</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            Nouvelle consultation
          </Button>
        </div>
      </div>

      <div className="filter-row" style={{ display: 'flex', gap: 12 }}>
        <Input
          prefix={<SearchOutlined className="search-icon" />}
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          className="search-input"
          style={{ maxWidth: 320 }}
        />
        <Select
          placeholder="Filtrer par motif"
          value={reasonFilter}
          onChange={(v) => { setReasonFilter(v); setPage(1); }}
          allowClear
          style={{ width: 200 }}
          options={REASONS}
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
            showTotal: (t) => `${t} consultations`,
          }}
          locale={{ emptyText: 'Aucune consultation trouvée' }}
        />
      </div>

      {/* New consultation modal */}
      <Modal
        title="Nouvelle consultation"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createConsultation.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
        width={700}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="ID Élève" name="student" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <Input placeholder="UUID de l'élève" />
            </Form.Item>
            <Form.Item label="Motif" name="reason" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <Select options={REASONS} placeholder="Sélectionner" />
            </Form.Item>
          </div>

          <Divider plain>Signes vitaux</Divider>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Form.Item label="Température (°C)" name="temperature">
              <InputNumber min={34} max={43} step={0.1} style={{ width: 130 }} />
            </Form.Item>
            <Form.Item label="Tension" name="blood_pressure">
              <Input placeholder="12/8" style={{ width: 100 }} />
            </Form.Item>
            <Form.Item label="SpO2 (%)" name="spo2">
              <InputNumber min={0} max={100} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item label="Pouls" name="pulse">
              <InputNumber min={30} max={250} style={{ width: 100 }} />
            </Form.Item>
            <Form.Item label="Glycémie" name="blood_sugar">
              <InputNumber min={0} step={0.1} style={{ width: 100 }} />
            </Form.Item>
          </div>

          <Divider plain>Soins et issue</Divider>
          <Form.Item label="Soins prodigués" name="care_provided">
            <Input.TextArea rows={2} placeholder="Décrire les soins..." />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Issue" name="outcome" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <Select options={OUTCOMES.map(({ value, label }) => ({ value, label }))} placeholder="Sélectionner" />
            </Form.Item>
            <Form.Item label="Parent contacté" name="parent_contacted" valuePropName="checked" style={{ flex: 0 }}>
              <Switch />
            </Form.Item>
          </div>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Observations..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail modal */}
      <Modal
        title="Détails de la consultation"
        open={!!detailItem}
        onCancel={() => setDetailItem(null)}
        footer={null}
        width={600}
      >
        {detailItem && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Élève">{detailItem.student_name || detailItem.student}</Descriptions.Item>
            <Descriptions.Item label="Date">{dayjs(detailItem.created_at).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="Motif">{REASONS.find((r) => r.value === detailItem.reason)?.label}</Descriptions.Item>
            <Descriptions.Item label="Issue">
              {(() => {
                const o = OUTCOMES.find((oc) => oc.value === detailItem.outcome);
                return <Tag color={o?.color}>{o?.label}</Tag>;
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="Température">{detailItem.temperature ? `${detailItem.temperature}°C` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Tension">{detailItem.blood_pressure || '—'}</Descriptions.Item>
            <Descriptions.Item label="SpO2">{detailItem.spo2 ? `${detailItem.spo2}%` : '—'}</Descriptions.Item>
            <Descriptions.Item label="Pouls">{detailItem.pulse || '—'}</Descriptions.Item>
            <Descriptions.Item label="Soins" span={2}>{detailItem.care_provided || '—'}</Descriptions.Item>
            <Descriptions.Item label="Notes" span={2}>{detailItem.notes || '—'}</Descriptions.Item>
            <Descriptions.Item label="Parent contacté">{detailItem.parent_contacted ? 'Oui' : 'Non'}</Descriptions.Item>
            <Descriptions.Item label="Infirmier(e)">{detailItem.nurse_name || '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ConsultationPage;
