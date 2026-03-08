/**
 * Evaluations & Certificates — Training Center
 * Evaluation types, grading, certificate/attestation generation
 */
import React, { useState } from 'react';
import {
  Card, Table, Button, Tag, Drawer, Form, Select, Space,
  Row, Col, InputNumber, DatePicker, Input, Tabs, Modal,
  Popconfirm, Descriptions, message,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, FileTextOutlined,
  SafetyCertificateOutlined, EyeOutlined, CheckCircleOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import {
  usePlacementTests, useCreatePlacementTest, useValidatePlacementTest,
  useLevelPassages, useDecideLevelPassage,
  useCertificates, useCreateCertificate,
  useFormations, useTrainingGroups,
} from '../../hooks/useFormation';
import {
  EVALUATION_TYPE_OPTIONS, CERTIFICATE_TYPE_OPTIONS,
  PASSAGE_DECISION_OPTIONS,
} from '../../constants/training-center';
import type { PlacementTest, LevelPassage, Certificate, Formation } from '../../types/formation';
import dayjs from 'dayjs';

const EvaluationsCertificates: React.FC = () => {
  const [certDrawer, setCertDrawer] = useState(false);
  const [certForm] = Form.useForm();
  const [testModal, setTestModal] = useState(false);
  const [testForm] = Form.useForm();

  const { data: tests, refetch: refetchTests } = usePlacementTests();
  const { data: passages, refetch: refetchPassages } = useLevelPassages();
  const { data: certs, refetch: refetchCerts } = useCertificates();
  const { data: formations } = useFormations();

  const testList = (tests?.results || []) as PlacementTest[];
  const passageList = (passages?.results || []) as LevelPassage[];
  const certList = (certs?.results || []) as Certificate[];
  const formationList = (formations?.results || []) as Formation[];

  const createTest = useCreatePlacementTest();
  const validateTest = useValidatePlacementTest();
  const decidePassage = useDecideLevelPassage();
  const createCert = useCreateCertificate();

  const handleTestSubmit = async () => {
    const values = await testForm.validateFields();
    await createTest.mutateAsync({
      ...values,
      test_date: values.test_date?.format('YYYY-MM-DD'),
    });
    setTestModal(false);
    testForm.resetFields();
  };

  const handleCertSubmit = async () => {
    const values = await certForm.validateFields();
    await createCert.mutateAsync({
      ...values,
      issue_date: values.issue_date?.format('YYYY-MM-DD'),
    });
    setCertDrawer(false);
    certForm.resetFields();
  };

  const testColumns = [
    { title: 'Apprenant', dataIndex: 'learner_name', key: 'learner' },
    { title: 'Formation', dataIndex: 'formation_name', key: 'formation' },
    {
      title: 'Date', dataIndex: 'test_date', key: 'date',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'Score', key: 'score',
      render: (_: unknown, r: PlacementTest) => (
        <span style={{ fontWeight: 600 }}>
          {r.score}/{r.max_score}
          <span style={{ color: '#64748b', marginLeft: 4 }}>
            ({Math.round((r.score / r.max_score) * 100)}%)
          </span>
        </span>
      ),
    },
    { title: 'Niveau suggéré', dataIndex: 'suggested_level', key: 'level',
      render: (v: string) => <Tag color="blue">{v}</Tag> },
    {
      title: 'Validé', dataIndex: 'is_validated', key: 'validated',
      render: (v: boolean) => v
        ? <Tag color="green" icon={<CheckCircleOutlined />}>Validé</Tag>
        : <Tag color="orange">En attente</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 100,
      render: (_: unknown, r: PlacementTest) => !r.is_validated && (
        <Popconfirm title="Valider ce test ?" onConfirm={() => validateTest.mutateAsync(r.id)}>
          <Button type="link" size="small">Valider</Button>
        </Popconfirm>
      ),
    },
  ];

  const passageColumns = [
    { title: 'Apprenant', dataIndex: 'learner_name', key: 'learner' },
    { title: 'Formation', dataIndex: 'formation_name', key: 'formation' },
    { title: 'De', dataIndex: 'from_level', key: 'from', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Vers', dataIndex: 'to_level', key: 'to', render: (v: string) => <Tag color="blue">{v}</Tag> },
    {
      title: 'Présence', dataIndex: 'actual_attendance_pct', key: 'att',
      render: (v: number, r: LevelPassage) => v != null ? `${v}% (min: ${r.min_attendance_pct}%)` : '—',
    },
    {
      title: 'Note', dataIndex: 'actual_grade', key: 'grade',
      render: (v: number, r: LevelPassage) => v != null ? `${v} (min: ${r.min_grade})` : '—',
    },
    {
      title: 'Décision', dataIndex: 'decision', key: 'decision',
      render: (d: string) => {
        const opt = PASSAGE_DECISION_OPTIONS.find(o => o.value === d);
        return <Tag color={opt?.color}>{opt?.label || d}</Tag>;
      },
    },
    {
      title: 'Certificat', dataIndex: 'certificate_generated', key: 'cert',
      render: (v: boolean) => v ? <Tag color="green">Généré</Tag> : <Tag>Non</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 180,
      render: (_: unknown, r: LevelPassage) => r.decision === 'PENDING' && (
        <Space>
          <Button size="small" type="primary"
            onClick={() => decidePassage.mutateAsync({ id: r.id, data: { decision: 'PROMOTED' } })}>
            Promouvoir
          </Button>
          <Button size="small"
            onClick={() => decidePassage.mutateAsync({ id: r.id, data: { decision: 'MAINTAINED' } })}>
            Maintenir
          </Button>
        </Space>
      ),
    },
  ];

  const certColumns = [
    { title: 'Apprenant', dataIndex: 'learner_name', key: 'learner' },
    { title: 'Formation', dataIndex: 'formation_name', key: 'formation' },
    {
      title: 'Type', dataIndex: 'certificate_type', key: 'type',
      render: (v: string) => {
        const opt = CERTIFICATE_TYPE_OPTIONS.find(o => o.value === v);
        return <Tag color="purple">{opt?.label || v}</Tag>;
      },
    },
    { title: 'Niveau', dataIndex: 'level_achieved', key: 'level',
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '—' },
    { title: 'Réf.', dataIndex: 'reference_number', key: 'ref' },
    {
      title: 'Date', dataIndex: 'issue_date', key: 'date',
      render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
    },
    {
      title: 'PDF', key: 'pdf',
      render: (_: unknown, r: Certificate) => r.pdf_file ? (
        <Button type="link" icon={<DownloadOutlined />} href={r.pdf_file} target="_blank">
          Télécharger
        </Button>
      ) : '—',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Évaluations & Certificats</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Tests, passages de niveau et attestations</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { refetchTests(); refetchPassages(); refetchCerts(); }}>
            Actualiser
          </Button>
          <Button icon={<FileTextOutlined />} onClick={() => setTestModal(true)}>
            Nouveau test
          </Button>
          <Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => setCertDrawer(true)}>
            Générer un certificat
          </Button>
        </Space>
      </div>

      <Tabs defaultActiveKey="tests" items={[
        {
          key: 'tests',
          label: `Tests de placement (${testList.length})`,
          children: (
            <Card style={{ borderRadius: 12 }}>
              <Table dataSource={testList} columns={testColumns} rowKey="id" size="small"
                pagination={{ pageSize: 15 }} />
            </Card>
          ),
        },
        {
          key: 'passages',
          label: `Passages de niveau (${passageList.length})`,
          children: (
            <Card style={{ borderRadius: 12 }}>
              <Table dataSource={passageList} columns={passageColumns} rowKey="id" size="small"
                pagination={{ pageSize: 15 }} />
            </Card>
          ),
        },
        {
          key: 'certs',
          label: `Certificats (${certList.length})`,
          children: (
            <Card style={{ borderRadius: 12 }}>
              <Table dataSource={certList} columns={certColumns} rowKey="id" size="small"
                pagination={{ pageSize: 15 }} />
            </Card>
          ),
        },
      ]} />

      {/* New Test Modal */}
      <Modal
        title="Nouveau test de placement"
        open={testModal}
        onCancel={() => setTestModal(false)}
        onOk={handleTestSubmit}
        confirmLoading={createTest.isPending}
      >
        <Form form={testForm} layout="vertical">
          <Form.Item name="learner" label="Apprenant (ID)" rules={[{ required: true }]}>
            <Input placeholder="ID de l'apprenant" />
          </Form.Item>
          <Form.Item name="formation" label="Formation" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner">
              {formationList.map(f => (
                <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="test_date" label="Date du test" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="score" label="Score" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_score" label="Score maximum" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="suggested_level" label="Niveau suggéré" rules={[{ required: true }]}>
            <Input placeholder="Ex: A2, B1, Intermédiaire..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Generate Certificate Drawer */}
      <Drawer
        title="Générer un certificat"
        open={certDrawer}
        onClose={() => setCertDrawer(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setCertDrawer(false)}>Annuler</Button>
            <Button type="primary" onClick={handleCertSubmit} loading={createCert.isPending}>
              Générer
            </Button>
          </Space>
        }
      >
        <Form form={certForm} layout="vertical">
          <Form.Item name="learner" label="Apprenant (ID)" rules={[{ required: true }]}>
            <Input placeholder="ID de l'apprenant" />
          </Form.Item>
          <Form.Item name="formation" label="Formation" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner">
              {formationList.map(f => (
                <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="certificate_type" label="Type de certificat" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner">
              {CERTIFICATE_TYPE_OPTIONS.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="level_achieved" label="Niveau atteint">
            <Input placeholder="Ex: B1, Avancé..." />
          </Form.Item>
          <Form.Item name="issue_date" label="Date d'émission" rules={[{ required: true }]}
            initialValue={dayjs()}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="content" label="Contenu / Observations">
            <Input.TextArea rows={3} placeholder="Informations supplémentaires..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default EvaluationsCertificates;
