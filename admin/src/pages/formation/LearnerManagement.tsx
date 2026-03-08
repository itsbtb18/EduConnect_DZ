/**
 * Learner Management — Training Center
 * Profile, multi-enrollment, statuses, placement test
 */
import React, { useState } from 'react';
import {
  Card, Table, Button, Input, Tag, Drawer, Form, Select, Space,
  Popconfirm, message, Row, Col, Tabs, Descriptions, DatePicker, Badge,
  InputNumber, Modal,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  UserOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  useEnrollments, useCreateEnrollment, useUpdateEnrollment,
  usePlacementTests, useCreatePlacementTest, useValidatePlacementTest,
  useTrainingGroups, useFormations,
} from '../../hooks/useFormation';
import { ENROLLMENT_STATUS_OPTIONS, ENTRY_EVALUATION_OPTIONS } from '../../constants/training-center';
import type { TrainingEnrollment, PlacementTest } from '../../types/formation';
import dayjs from 'dayjs';

const LearnerManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingEnrollment | null>(null);
  const [detailDrawer, setDetailDrawer] = useState<TrainingEnrollment | null>(null);
  const [testModal, setTestModal] = useState(false);
  const [form] = Form.useForm();
  const [testForm] = Form.useForm();

  const { data: enrollments, isLoading, refetch } = useEnrollments({ page, page_size: 20, search });
  const { data: groups } = useTrainingGroups();
  const { data: formations } = useFormations();
  const { data: tests } = usePlacementTests();
  const createEnrollment = useCreateEnrollment();
  const updateEnrollment = useUpdateEnrollment();
  const createTest = useCreatePlacementTest();
  const validateTest = useValidatePlacementTest();

  const enrollmentList = (enrollments?.results || []) as TrainingEnrollment[];
  const groupList = (groups?.results || []) as { id: string; name: string; formation_name?: string }[];
  const formationList = (formations?.results || []) as { id: string; name: string; levels?: string[] }[];
  const testList = (tests?.results || []) as PlacementTest[];

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (record: TrainingEnrollment) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      enrollment_date: record.enrollment_date ? dayjs(record.enrollment_date) : undefined,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      enrollment_date: values.enrollment_date?.format('YYYY-MM-DD'),
    };
    if (editing) {
      await updateEnrollment.mutateAsync({ id: editing.id, data });
    } else {
      await createEnrollment.mutateAsync(data);
    }
    setDrawerOpen(false);
    form.resetFields();
  };

  const handleTestSubmit = async () => {
    const values = await testForm.validateFields();
    const data = {
      ...values,
      test_date: values.test_date?.format('YYYY-MM-DD'),
    };
    await createTest.mutateAsync(data);
    setTestModal(false);
    testForm.resetFields();
  };

  const columns = [
    {
      title: 'Apprenant', dataIndex: 'learner_name', key: 'learner',
      render: (name: string) => (
        <Space><UserOutlined style={{ color: '#8B5CF6' }} />{name || '—'}</Space>
      ),
    },
    { title: 'Groupe', dataIndex: 'group_name', key: 'group' },
    { title: 'Formation', dataIndex: 'formation_name', key: 'formation' },
    {
      title: 'Date inscription', dataIndex: 'enrollment_date', key: 'date',
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const opt = ENROLLMENT_STATUS_OPTIONS.find(o => o.value === s);
        return <Tag color={opt?.color || 'default'}>{opt?.label || s}</Tag>;
      },
    },
    {
      title: 'Actions', key: 'actions', width: 150,
      render: (_: unknown, record: TrainingEnrollment) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => setDetailDrawer(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gestion des Apprenants</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Inscriptions, suivi et tests de placement</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button icon={<FileTextOutlined />} onClick={() => setTestModal(true)}>Test de placement</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nouvelle inscription
          </Button>
        </Space>
      </div>

      {/* Stat row */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small"><Badge color="green" text={`Actifs: ${enrollmentList.filter(e => e.status === 'ACTIVE').length}`} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Badge color="gold" text={`Attente paiement: ${enrollmentList.filter(e => e.status === 'PENDING_PAYMENT').length}`} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Badge color="purple" text={`Liste d'attente: ${enrollmentList.filter(e => e.status === 'WAITLIST').length}`} /></Card>
        </Col>
        <Col span={6}>
          <Card size="small"><Badge color="blue" text={`Terminés: ${enrollmentList.filter(e => e.status === 'COMPLETED').length}`} /></Card>
        </Col>
      </Row>

      <Input
        placeholder="Rechercher un apprenant..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        style={{ marginBottom: 16, maxWidth: 400 }}
        allowClear
      />

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={enrollmentList}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total: enrollments?.count || 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      {/* Add / Edit Enrollment Drawer */}
      <Drawer
        title={editing ? 'Modifier l\'inscription' : 'Nouvelle inscription'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button type="primary" onClick={handleSubmit}
              loading={createEnrollment.isPending || updateEnrollment.isPending}>
              {editing ? 'Mettre à jour' : 'Inscrire'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {!editing && (
            <Form.Item name="learner" label="Apprenant (ID utilisateur)" rules={[{ required: true }]}>
              <Input placeholder="ID de l'apprenant" />
            </Form.Item>
          )}
          <Form.Item name="group" label="Groupe" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner un groupe">
              {groupList.map(g => (
                <Select.Option key={g.id} value={g.id}>{g.name} ({g.formation_name})</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="enrollment_date" label="Date d'inscription" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="status" label="Statut" rules={[{ required: true }]}
            initialValue="ACTIVE">
            <Select>
              {ENROLLMENT_STATUS_OPTIONS.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer
        title="Détails de l'inscription"
        open={!!detailDrawer}
        onClose={() => setDetailDrawer(null)}
        width={500}
      >
        {detailDrawer && (
          <Tabs defaultActiveKey="info" items={[
            {
              key: 'info', label: 'Informations',
              children: (
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Apprenant">{detailDrawer.learner_name}</Descriptions.Item>
                  <Descriptions.Item label="Groupe">{detailDrawer.group_name}</Descriptions.Item>
                  <Descriptions.Item label="Formation">{detailDrawer.formation_name}</Descriptions.Item>
                  <Descriptions.Item label="Date d'inscription">
                    {detailDrawer.enrollment_date ? dayjs(detailDrawer.enrollment_date).format('DD/MM/YYYY') : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Statut">
                    {(() => {
                      const opt = ENROLLMENT_STATUS_OPTIONS.find(o => o.value === detailDrawer.status);
                      return <Tag color={opt?.color}>{opt?.label}</Tag>;
                    })()}
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'tests', label: 'Tests de placement',
              children: (
                <Table
                  dataSource={testList.filter(t => t.learner === detailDrawer.learner)}
                  columns={[
                    { title: 'Formation', dataIndex: 'formation_name', key: 'f' },
                    { title: 'Score', key: 'score',
                      render: (_: unknown, r: PlacementTest) => `${r.score}/${r.max_score}` },
                    { title: 'Niveau', dataIndex: 'suggested_level', key: 'lv' },
                    { title: 'Validé', dataIndex: 'is_validated', key: 'v',
                      render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag color="orange">Non</Tag> },
                    { title: '', key: 'act',
                      render: (_: unknown, r: PlacementTest) => !r.is_validated && (
                        <Popconfirm title="Valider ce test ?" onConfirm={() => validateTest.mutateAsync(r.id)}>
                          <Button type="link" size="small">Valider</Button>
                        </Popconfirm>
                      ),
                    },
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              ),
            },
          ]} />
        )}
      </Drawer>

      {/* Placement Test Modal */}
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
          <Form.Item name="test_date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="score" label="Score" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="max_score" label="Score max" rules={[{ required: true }]}>
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="suggested_level" label="Niveau suggéré" rules={[{ required: true }]}>
            <Input placeholder="Ex: A2, B1..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LearnerManagement;
