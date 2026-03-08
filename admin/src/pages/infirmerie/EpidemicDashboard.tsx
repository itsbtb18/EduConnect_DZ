import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Card,
  Row, Col, Statistic, Space, Spin, Alert,
} from 'antd';
import {
  AlertOutlined, PlusOutlined, ReloadOutlined, WarningOutlined,
  CheckCircleOutlined, BugOutlined,
} from '@ant-design/icons';
import {
  useEpidemicAlerts, useCreateEpidemicAlert,
  useContagiousDiseases, useCreateContagiousDisease,
} from '../../hooks/useApi';
import dayjs from 'dayjs';

const ALERT_LEVELS = [
  { value: 'WATCH', label: 'Surveillance', color: 'blue' },
  { value: 'WARNING', label: 'Alerte', color: 'orange' },
  { value: 'CRITICAL', label: 'Critique', color: 'red' },
];
const DISEASE_STATUS = [
  { value: 'ACTIVE', label: 'Actif', color: 'red' },
  { value: 'EVICTED', label: 'Évincé', color: 'orange' },
  { value: 'CLEARED', label: 'Guéri', color: 'green' },
];

interface EpidemicItem {
  id: string;
  disease_name: string;
  case_count: number;
  alert_level: string;
  is_contagious: boolean;
  is_resolved: boolean;
  classroom_name?: string;
  created_at: string;
}
interface ContagiousItem {
  id: string;
  student_name?: string;
  student?: string;
  disease_name?: string;
  epidemic_alert?: string;
  status: string;
  onset_date: string;
  eviction_days?: number;
  authorized_return_date?: string;
}

const EpidemicDashboard: React.FC = () => {
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [alertForm] = Form.useForm();
  const [caseForm] = Form.useForm();

  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useEpidemicAlerts();
  const { data: casesData, isLoading: casesLoading, refetch: refetchCases } = useContagiousDiseases();
  const createAlert = useCreateEpidemicAlert();
  const createCase = useCreateContagiousDisease();

  const alerts = (alertsData?.results || alertsData || []) as EpidemicItem[];
  const cases = (casesData?.results || casesData || []) as ContagiousItem[];
  const activeAlerts = alerts.filter((a) => !a.is_resolved);
  const activeCases = cases.filter((c) => c.status !== 'CLEARED');

  const handleCreateAlert = async () => {
    try {
      const values = await alertForm.validateFields();
      await createAlert.mutateAsync(values);
      setAlertModalOpen(false);
      alertForm.resetFields();
    } catch { /* validation */ }
  };

  const handleCreateCase = async () => {
    try {
      const values = await caseForm.validateFields();
      await createCase.mutateAsync(values);
      setCaseModalOpen(false);
      caseForm.resetFields();
    } catch { /* validation */ }
  };

  const alertColumns = [
    {
      title: 'Maladie',
      dataIndex: 'disease_name',
      key: 'disease_name',
      render: (v: string) => <strong>{v}</strong>,
    },
    {
      title: 'Niveau',
      dataIndex: 'alert_level',
      key: 'alert_level',
      render: (v: string) => {
        const l = ALERT_LEVELS.find((a) => a.value === v);
        return <Tag color={l?.color || 'default'}>{l?.label || v}</Tag>;
      },
    },
    {
      title: 'Cas',
      dataIndex: 'case_count',
      key: 'case_count',
      render: (v: number) => <strong>{v}</strong>,
    },
    {
      title: 'Classe',
      dataIndex: 'classroom_name',
      key: 'classroom',
      render: (v: string) => v || 'Toutes',
    },
    {
      title: 'Contagieux',
      dataIndex: 'is_contagious',
      key: 'contagious',
      render: (v: boolean) => v ? <Tag color="red">Oui</Tag> : <Tag>Non</Tag>,
    },
    {
      title: 'Statut',
      dataIndex: 'is_resolved',
      key: 'resolved',
      render: (v: boolean) => v
        ? <Tag icon={<CheckCircleOutlined />} color="green">Résolu</Tag>
        : <Tag icon={<WarningOutlined />} color="red">Actif</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'date',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
  ];

  const caseColumns = [
    {
      title: 'Élève',
      key: 'student',
      render: (_: unknown, r: ContagiousItem) => r.student_name || r.student || '—',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const s = DISEASE_STATUS.find((d) => d.value === v);
        return <Tag color={s?.color || 'default'}>{s?.label || v}</Tag>;
      },
    },
    {
      title: 'Début',
      dataIndex: 'onset_date',
      key: 'onset',
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Jours d\'éviction',
      dataIndex: 'eviction_days',
      key: 'eviction',
      render: (v: number) => v ?? '—',
    },
    {
      title: 'Retour autorisé',
      dataIndex: 'authorized_return_date',
      key: 'return',
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><BugOutlined className="page-header__icon" style={{ color: '#faad14' }} /> Suivi épidémiologique</h1>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => { refetchAlerts(); refetchCases(); }}>
            Actualiser
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderLeft: '4px solid #ff4d4f' }}>
            <Statistic title="Alertes actives" value={activeAlerts.length} valueStyle={{ color: '#ff4d4f' }} prefix={<AlertOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderLeft: '4px solid #faad14' }}>
            <Statistic title="Cas actifs" value={activeCases.length} valueStyle={{ color: '#faad14' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic title="Alertes résolues" value={alerts.length - activeAlerts.length} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderLeft: '4px solid #1890ff' }}>
            <Statistic title="Total cas enregistrés" value={cases.length} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      {activeAlerts.some((a) => a.alert_level === 'CRITICAL') && (
        <Alert
          type="error"
          showIcon
          message="Alerte critique en cours !"
          description={activeAlerts.filter((a) => a.alert_level === 'CRITICAL').map((a) => a.disease_name).join(', ')}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Epidemic Alerts */}
      <Card
        title="Alertes épidémiques"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { alertForm.resetFields(); setAlertModalOpen(true); }}>
            Nouvelle alerte
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Table
          columns={alertColumns}
          dataSource={alerts}
          loading={alertsLoading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Aucune alerte' }}
        />
      </Card>

      {/* Contagious cases */}
      <Card
        title="Cas contagieux"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { caseForm.resetFields(); setCaseModalOpen(true); }}>
            Nouveau cas
          </Button>
        }
      >
        <Table
          columns={caseColumns}
          dataSource={cases}
          loading={casesLoading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Aucun cas enregistré' }}
        />
      </Card>

      {/* New alert modal */}
      <Modal
        title="Nouvelle alerte épidémique"
        open={alertModalOpen}
        onOk={handleCreateAlert}
        onCancel={() => setAlertModalOpen(false)}
        confirmLoading={createAlert.isPending}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form form={alertForm} layout="vertical">
          <Form.Item label="Maladie" name="disease_name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Nom de la maladie" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Nombre de cas" name="case_count" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Niveau d'alerte" name="alert_level" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={ALERT_LEVELS.map(({ value, label }) => ({ value, label }))} />
            </Form.Item>
          </div>
          <Form.Item label="Contagieux" name="is_contagious" valuePropName="checked">
            <Select options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
          </Form.Item>
        </Form>
      </Modal>

      {/* New case modal */}
      <Modal
        title="Nouveau cas contagieux"
        open={caseModalOpen}
        onOk={handleCreateCase}
        onCancel={() => setCaseModalOpen(false)}
        confirmLoading={createCase.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={caseForm} layout="vertical">
          <Form.Item label="Élève" name="student" rules={[{ required: true }]}>
            <Input placeholder="UUID de l'élève" />
          </Form.Item>
          <Form.Item label="Alerte épidémique" name="epidemic_alert">
            <Select
              placeholder="Rattacher à une alerte (optionnel)"
              allowClear
              options={activeAlerts.map((a) => ({
                value: a.id,
                label: `${a.disease_name} (${a.case_count} cas)`,
              }))}
            />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Jours d'éviction" name="eviction_days" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Statut" name="status" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={DISEASE_STATUS.map(({ value, label }) => ({ value, label }))} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default EpidemicDashboard;
