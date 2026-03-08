import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Select, DatePicker, Space, Button, Modal, Form, Input, message } from 'antd';
import {
  WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  SmileOutlined, BarChartOutlined, PlusOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  useIncidents, useCreateIncident, useIncidentWorkflow, useDisciplineStats,
  useWarningCounter, useClassComparison, useClasses, useStudents,
} from '../../hooks/useApi';
import type { Incident, DisciplineStats, WarningCount, ClassComparison } from '../../types';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SEVERITY_COLORS: Record<string, string> = { POSITIVE: 'green', WARNING: 'orange', SERIOUS: 'red' };
const STATUS_COLORS: Record<string, string> = { REPORTED: 'blue', UNDER_REVIEW: 'orange', VALIDATED: 'cyan', RESOLVED: 'green', DISMISSED: 'default' };

const DisciplineDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Incident | null>(null);
  const [form] = Form.useForm();

  const { data: statsData, isLoading: loadingStats } = useDisciplineStats(filters);
  const { data: incidentsData, isLoading: loadingIncidents } = useIncidents(filters);
  const { data: warningsData } = useWarningCounter({ trimester: 'Trimestre 1' });
  const { data: comparisonData } = useClassComparison(filters);
  const { data: classesData } = useClasses();
  const { data: studentsData } = useStudents();
  const createIncident = useCreateIncident();
  const workflowAction = useIncidentWorkflow();

  const stats = statsData as DisciplineStats | undefined;
  const incidents = (Array.isArray(incidentsData) ? incidentsData : incidentsData?.results || []) as Incident[];
  const warnings = (warningsData || []) as WarningCount[];
  const classComp = (comparisonData || []) as ClassComparison[];
  const classes = (Array.isArray(classesData) ? classesData : classesData?.results || []) as Array<{ id: string; name: string }>;
  const students = (Array.isArray(studentsData) ? studentsData : studentsData?.results || []) as Array<{ id: string; user: { first_name: string; last_name: string } }>;

  const handleCreate = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      date: (values.date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
      time: (values.time as dayjs.Dayjs)?.format('HH:mm'),
    };
    await createIncident.mutateAsync(payload);
    setShowCreate(false);
    form.resetFields();
  };

  const handleWorkflow = async (id: string, action: string) => {
    const note = action === 'resolve' || action === 'dismiss' ? (window.prompt('Note de résolution :') || '') : undefined;
    await workflowAction.mutateAsync({ id, action, resolution_note: note });
    setShowDetail(null);
  };

  if (loadingStats || loadingIncidents) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  const incidentColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 100 },
    { title: 'Élève', dataIndex: 'student_name', key: 'student_name' },
    { title: 'Classe', dataIndex: 'class_name', key: 'class_name', width: 100 },
    { title: 'Titre', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Gravité', dataIndex: 'severity', key: 'severity', width: 120,
      render: (s: string, r: Incident) => <Tag color={SEVERITY_COLORS[s]}>{r.severity_label}</Tag>,
    },
    {
      title: 'Statut', dataIndex: 'status', key: 'status', width: 120,
      render: (s: string, r: Incident) => <Tag color={STATUS_COLORS[s]}>{r.status_label}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 80,
      render: (_: unknown, r: Incident) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => setShowDetail(r)} />
      ),
    },
  ];

  const warningColumns = [
    { title: 'Élève', dataIndex: 'student_name', key: 'student_name' },
    { title: 'Classe', dataIndex: 'class_name', key: 'class_name' },
    { title: 'Avertissements', dataIndex: 'warning_count', key: 'warning_count' },
    { title: 'Seuil', dataIndex: 'threshold', key: 'threshold' },
    {
      title: 'Statut', key: 'exceeded',
      render: (_: unknown, r: WarningCount) => r.exceeded
        ? <Tag color="red">Seuil dépassé</Tag>
        : <Tag color="green">OK</Tag>,
    },
  ];

  const comparisonColumns = [
    { title: 'Classe', dataIndex: 'class_name', key: 'class_name' },
    { title: 'Total', dataIndex: 'total_incidents', key: 'total' },
    { title: 'Positifs', dataIndex: 'positive', key: 'positive', render: (v: number) => <Tag color="green">{v}</Tag> },
    { title: 'Avertissements', dataIndex: 'warnings', key: 'warnings', render: (v: number) => <Tag color="orange">{v}</Tag> },
    { title: 'Graves', dataIndex: 'serious', key: 'serious', render: (v: number) => <Tag color="red">{v}</Tag> },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-header__info">
          <h1>⚖️ Discipline</h1>
          <p>Suivi disciplinaire des élèves</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreate(true)}>
          Signaler un incident
        </Button>
      </div>

      {/* Filters */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear placeholder="Gravité" style={{ width: 160 }}
          onChange={(v) => setFilters(f => ({ ...f, severity: v }))}
          options={[
            { value: 'POSITIVE', label: 'Bon comportement' },
            { value: 'WARNING', label: 'Avertissement' },
            { value: 'SERIOUS', label: 'Grave' },
          ]}
        />
        <Select
          allowClear placeholder="Statut" style={{ width: 160 }}
          onChange={(v) => setFilters(f => ({ ...f, status: v }))}
          options={[
            { value: 'REPORTED', label: 'Signalé' },
            { value: 'UNDER_REVIEW', label: 'En cours' },
            { value: 'VALIDATED', label: 'Validé' },
            { value: 'RESOLVED', label: 'Résolu' },
            { value: 'DISMISSED', label: 'Classé' },
          ]}
        />
        <Select
          allowClear placeholder="Classe" style={{ width: 160 }}
          onChange={(v) => setFilters(f => ({ ...f, class_id: v }))}
          options={classes.map(c => ({ value: c.id, label: c.name }))}
        />
        <RangePicker
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setFilters(f => ({ ...f, date_from: dates[0]!.format('YYYY-MM-DD'), date_to: dates[1]!.format('YYYY-MM-DD') }));
            } else {
              setFilters(f => { const n = { ...f }; delete n.date_from; delete n.date_to; return n; });
            }
          }}
        />
      </Space>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #3B82F6' }}>
            <Statistic title="Total incidents" value={stats?.total_incidents || 0} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #F59E0B' }}>
            <Statistic title="En attente" value={stats?.pending || 0} prefix={<WarningOutlined />} valueStyle={stats?.pending ? { color: '#F59E0B' } : undefined} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #10B981' }}>
            <Statistic title="Bons comportements" value={stats?.by_severity?.POSITIVE || 0} prefix={<SmileOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #EF4444' }}>
            <Statistic title="Total sanctions" value={stats?.sanctions_total || 0} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Incidents Table */}
      <Card title="Incidents récents" style={{ marginBottom: 24 }}>
        <Table dataSource={incidents} columns={incidentColumns} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
      </Card>

      {/* Warning Counter + Class Comparison side by side */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="⚠️ Compteur d'avertissements (Trimestre 1)">
            <Table dataSource={warnings} columns={warningColumns} rowKey="student_id" pagination={{ pageSize: 5 }} size="small" />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<><BarChartOutlined /> Comparaison par classe</>}>
            <Table dataSource={classComp} columns={comparisonColumns} rowKey="class_id" pagination={{ pageSize: 5 }} size="small" />
          </Card>
        </Col>
      </Row>

      {/* Create Incident Modal */}
      <Modal
        title="Signaler un incident"
        open={showCreate}
        onCancel={() => { setShowCreate(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createIncident.isPending}
        width={640}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="student" label="Élève" rules={[{ required: true }]}>
                <Select
                  showSearch placeholder="Sélectionner un élève"
                  filterOption={(input, option) => (option?.label as string || '').toLowerCase().includes(input.toLowerCase())}
                  options={students.map(s => ({ value: s.id, label: `${s.user.last_name} ${s.user.first_name}` }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="severity" label="Gravité" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'POSITIVE', label: 'Bon comportement' },
                  { value: 'WARNING', label: 'Avertissement' },
                  { value: 'SERIOUS', label: 'Grave' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="Titre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="Lieu">
                <Input placeholder="Salle de classe, cour, etc." />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="witnesses" label="Témoins">
            <Input placeholder="Noms séparés par des virgules" />
          </Form.Item>
          <Form.Item name="immediate_action" label="Action immédiate">
            <Input.TextArea rows={2} placeholder="Action prise sur place" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Incident Detail Modal */}
      <Modal
        title={showDetail ? `Incident — ${showDetail.title}` : ''}
        open={!!showDetail}
        onCancel={() => setShowDetail(null)}
        footer={showDetail ? (
          <Space>
            {showDetail.status === 'REPORTED' && (
              <Button type="primary" onClick={() => handleWorkflow(showDetail.id, 'validate')}>Valider</Button>
            )}
            {['REPORTED', 'UNDER_REVIEW', 'VALIDATED'].includes(showDetail.status) && (
              <Button onClick={() => handleWorkflow(showDetail.id, 'notify_parent')}>Notifier parent</Button>
            )}
            {showDetail.status === 'VALIDATED' && (
              <>
                <Button type="primary" style={{ background: '#10B981' }} onClick={() => handleWorkflow(showDetail.id, 'resolve')}>Résoudre</Button>
                <Button danger onClick={() => handleWorkflow(showDetail.id, 'dismiss')}>Classer</Button>
              </>
            )}
            <Button onClick={() => setShowDetail(null)}>Fermer</Button>
          </Space>
        ) : null}
        width={600}
      >
        {showDetail && (
          <div>
            <p><strong>Élève :</strong> {showDetail.student_name} ({showDetail.class_name})</p>
            <p><strong>Date :</strong> {showDetail.date} {showDetail.time || ''}</p>
            <p><strong>Gravité :</strong> <Tag color={SEVERITY_COLORS[showDetail.severity]}>{showDetail.severity_label}</Tag></p>
            <p><strong>Statut :</strong> <Tag color={STATUS_COLORS[showDetail.status]}>{showDetail.status_label}</Tag></p>
            <p><strong>Lieu :</strong> {showDetail.location || '—'}</p>
            <p><strong>Description :</strong> {showDetail.description || '—'}</p>
            <p><strong>Témoins :</strong> {showDetail.witnesses || '—'}</p>
            <p><strong>Action immédiate :</strong> {showDetail.immediate_action || '—'}</p>
            <p><strong>Signalé par :</strong> {showDetail.reported_by_name}</p>
            {showDetail.parent_notified && <p><strong>Parent notifié :</strong> {showDetail.parent_notified_at || 'Oui'}</p>}
            {showDetail.validated_at && <p><strong>Validé le :</strong> {showDetail.validated_at}</p>}
            {showDetail.resolution_note && <p><strong>Note de résolution :</strong> {showDetail.resolution_note}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DisciplineDashboard;
