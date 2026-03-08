/**
 * Group Management — Training Center
 * CRUD, enrollment management, conflict detection, waitlists, level passage
 */
import React, { useState } from 'react';
import {
  Card, Table, Button, Input, Tag, Drawer, Form, Select, Space,
  Popconfirm, Row, Col, InputNumber, DatePicker, Tabs, Modal,
  Progress, List, Badge, Descriptions, message,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined, TeamOutlined,
  SwapOutlined, UserAddOutlined,
} from '@ant-design/icons';
import {
  useTrainingGroups, useCreateGroup, useUpdateGroup, useDeleteGroup,
  useFormations, useEnrollments, useCreateEnrollment, useUpdateEnrollment,
  useLevelPassages, useCreateLevelPassage, useDecideLevelPassage,
  useCheckScheduleConflicts,
} from '../../hooks/useFormation';
import {
  GROUP_STATUS_OPTIONS, ENROLLMENT_STATUS_OPTIONS,
  PASSAGE_DECISION_OPTIONS,
} from '../../constants/training-center';
import type { TrainingGroup, TrainingEnrollment, LevelPassage, Formation } from '../../types/formation';
import dayjs from 'dayjs';

const GroupManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingGroup | null>(null);
  const [detailDrawer, setDetailDrawer] = useState<TrainingGroup | null>(null);
  const [enrollModal, setEnrollModal] = useState(false);
  const [passageModal, setPassageModal] = useState(false);
  const [form] = Form.useForm();
  const [enrollForm] = Form.useForm();
  const [passageForm] = Form.useForm();

  const { data: groups, isLoading, refetch } = useTrainingGroups({ page, page_size: 20, search, status: statusFilter });
  const { data: formations } = useFormations();
  const { data: enrollments } = useEnrollments(detailDrawer ? { group: detailDrawer.id } : undefined);
  const { data: passages } = useLevelPassages(detailDrawer ? { group: detailDrawer.id } : undefined);

  const groupList = (groups?.results || []) as TrainingGroup[];
  const formationList = (formations?.results || []) as Formation[];
  const enrollmentList = (enrollments?.results || []) as TrainingEnrollment[];
  const passageList = (passages?.results || []) as LevelPassage[];

  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const createEnrollment = useCreateEnrollment();
  const updateEnrollment = useUpdateEnrollment();
  const createPassage = useCreateLevelPassage();
  const decidePassage = useDecideLevelPassage();
  const checkConflicts = useCheckScheduleConflicts();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (record: TrainingGroup) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      start_date: record.start_date ? dayjs(record.start_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : undefined,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      start_date: values.start_date?.format('YYYY-MM-DD'),
      end_date: values.end_date?.format('YYYY-MM-DD'),
    };
    if (editing) {
      await updateGroup.mutateAsync({ id: editing.id, data });
    } else {
      await createGroup.mutateAsync(data);
    }
    setDrawerOpen(false);
    form.resetFields();
  };

  const handleEnroll = async () => {
    const values = await enrollForm.validateFields();
    await createEnrollment.mutateAsync({
      ...values,
      group: detailDrawer!.id,
      enrollment_date: dayjs().format('YYYY-MM-DD'),
    });
    setEnrollModal(false);
    enrollForm.resetFields();
  };

  const handlePassage = async () => {
    const values = await passageForm.validateFields();
    await createPassage.mutateAsync(values);
    setPassageModal(false);
    passageForm.resetFields();
  };

  const selectedFormation = Form.useWatch('formation', form);
  const formationLevels = formationList.find(f => f.id === selectedFormation)?.levels || [];

  const columns = [
    {
      title: 'Groupe', dataIndex: 'name', key: 'name',
      render: (name: string, r: TrainingGroup) => (
        <Space>
          <TeamOutlined style={{ color: '#3B82F6' }} />
          <div>
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>{r.formation_name}</div>
          </div>
        </Space>
      ),
    },
    { title: 'Niveau', dataIndex: 'level', key: 'level', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Formateur', dataIndex: 'trainer_name', key: 'trainer', render: (v: string) => v || '—' },
    {
      title: 'Remplissage', key: 'fill',
      render: (_: unknown, r: TrainingGroup) => (
        <Progress
          percent={r.capacity ? Math.round(((r.enrolled_count || 0) / r.capacity) * 100) : 0}
          size="small"
          format={() => `${r.enrolled_count || 0}/${r.capacity}`}
          style={{ width: 120 }}
        />
      ),
    },
    {
      title: 'Dates', key: 'dates',
      render: (_: unknown, r: TrainingGroup) => (
        <span style={{ fontSize: 12 }}>
          {dayjs(r.start_date).format('DD/MM/YY')}
          {r.end_date ? ` → ${dayjs(r.end_date).format('DD/MM/YY')}` : ''}
        </span>
      ),
    },
    {
      title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const opt = GROUP_STATUS_OPTIONS.find(o => o.value === s);
        return <Tag color={opt?.color || 'default'}>{opt?.label || s}</Tag>;
      },
    },
    {
      title: 'Actions', key: 'actions', width: 150,
      render: (_: unknown, record: TrainingGroup) => (
        <Space size="small">
          <Button type="link" icon={<EyeOutlined />} onClick={() => setDetailDrawer(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Supprimer ce groupe ?" onConfirm={() => deleteGroup.mutateAsync(record.id)}>
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gestion des Groupes</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Créer, gérer et suivre les groupes de formation</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Nouveau groupe</Button>
        </Space>
      </div>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select
            placeholder="Filtrer par statut"
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPage(1); }}
            style={{ width: '100%' }}
            allowClear
          >
            {GROUP_STATUS_OPTIONS.map(o => (
              <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={groupList}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page, pageSize: 20,
            total: groups?.count || 0, onChange: setPage, showSizeChanger: false,
          }}
        />
      </Card>

      {/* Create / Edit Drawer */}
      <Drawer
        title={editing ? 'Modifier le groupe' : 'Nouveau groupe'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button type="primary" onClick={handleSubmit}
              loading={createGroup.isPending || updateGroup.isPending}>
              {editing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nom du groupe" rules={[{ required: true }]}>
            <Input placeholder="Ex: Anglais A2 - Groupe 1" />
          </Form.Item>
          <Form.Item name="formation" label="Formation" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner une formation">
              {formationList.map(f => (
                <Select.Option key={f.id} value={f.id}>{f.name} ({f.department_name})</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="level" label="Niveau" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner un niveau">
              {formationLevels.map(l => (
                <Select.Option key={l} value={l}>{l}</Select.Option>
              ))}
              <Select.Option value="custom">Autre...</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="trainer" label="Formateur (ID)">
            <Input placeholder="ID utilisateur du formateur" />
          </Form.Item>
          <Form.Item name="room" label="Salle">
            <Input placeholder="Nom de la salle" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="capacity" label="Capacité" rules={[{ required: true }]}>
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sessions_per_week" label="Séances/semaine" rules={[{ required: true }]}>
                <InputNumber min={1} max={14} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="start_date" label="Date de début" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="end_date" label="Date de fin">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="status" label="Statut" initialValue="OPEN">
            <Select>
              {GROUP_STATUS_OPTIONS.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Group Detail Drawer */}
      <Drawer
        title={detailDrawer?.name || 'Détails du groupe'}
        open={!!detailDrawer}
        onClose={() => setDetailDrawer(null)}
        width={640}
        extra={
          <Space>
            <Button icon={<UserAddOutlined />} onClick={() => setEnrollModal(true)}>
              Inscrire
            </Button>
            <Button icon={<SwapOutlined />} onClick={() => setPassageModal(true)}>
              Passage
            </Button>
          </Space>
        }
      >
        {detailDrawer && (
          <Tabs defaultActiveKey="info" items={[
            {
              key: 'info', label: 'Informations',
              children: (
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Formation">{detailDrawer.formation_name}</Descriptions.Item>
                  <Descriptions.Item label="Niveau">{detailDrawer.level}</Descriptions.Item>
                  <Descriptions.Item label="Formateur">{detailDrawer.trainer_name || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Salle">{detailDrawer.room_name || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Capacité">{detailDrawer.enrolled_count || 0}/{detailDrawer.capacity}</Descriptions.Item>
                  <Descriptions.Item label="Séances/sem.">{detailDrawer.sessions_per_week}</Descriptions.Item>
                  <Descriptions.Item label="Début">{dayjs(detailDrawer.start_date).format('DD/MM/YYYY')}</Descriptions.Item>
                  <Descriptions.Item label="Fin">{detailDrawer.end_date ? dayjs(detailDrawer.end_date).format('DD/MM/YYYY') : '—'}</Descriptions.Item>
                  <Descriptions.Item label="Statut" span={2}>
                    <Tag color={GROUP_STATUS_OPTIONS.find(o => o.value === detailDrawer.status)?.color}>
                      {GROUP_STATUS_OPTIONS.find(o => o.value === detailDrawer.status)?.label}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'learners', label: `Apprenants (${enrollmentList.length})`,
              children: (
                <Table
                  dataSource={enrollmentList}
                  columns={[
                    { title: 'Apprenant', dataIndex: 'learner_name', key: 'name' },
                    { title: 'Date', dataIndex: 'enrollment_date', key: 'date',
                      render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
                    { title: 'Statut', dataIndex: 'status', key: 'status',
                      render: (s: string) => (
                        <Tag color={ENROLLMENT_STATUS_OPTIONS.find(o => o.value === s)?.color}>
                          {ENROLLMENT_STATUS_OPTIONS.find(o => o.value === s)?.label}
                        </Tag>
                      ),
                    },
                    { title: '', key: 'action',
                      render: (_: unknown, r: TrainingEnrollment) => (
                        <Select
                          value={r.status}
                          size="small"
                          style={{ width: 140 }}
                          onChange={(v) => updateEnrollment.mutateAsync({ id: r.id, data: { status: v } })}
                        >
                          {ENROLLMENT_STATUS_OPTIONS.map(o => (
                            <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                          ))}
                        </Select>
                      ),
                    },
                  ]}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              ),
            },
            {
              key: 'passages', label: 'Passages de niveau',
              children: (
                <Table
                  dataSource={passageList}
                  columns={[
                    { title: 'Apprenant', dataIndex: 'learner_name', key: 'name' },
                    { title: 'De', dataIndex: 'from_level', key: 'from' },
                    { title: 'Vers', dataIndex: 'to_level', key: 'to' },
                    { title: 'Décision', dataIndex: 'decision', key: 'dec',
                      render: (d: string) => (
                        <Tag color={PASSAGE_DECISION_OPTIONS.find(o => o.value === d)?.color}>
                          {PASSAGE_DECISION_OPTIONS.find(o => o.value === d)?.label}
                        </Tag>
                      ),
                    },
                    { title: '', key: 'act',
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

      {/* Enroll Modal */}
      <Modal
        title="Inscrire un apprenant"
        open={enrollModal}
        onCancel={() => setEnrollModal(false)}
        onOk={handleEnroll}
        confirmLoading={createEnrollment.isPending}
      >
        <Form form={enrollForm} layout="vertical">
          <Form.Item name="learner" label="Apprenant (ID)" rules={[{ required: true }]}>
            <Input placeholder="ID utilisateur de l'apprenant" />
          </Form.Item>
          <Form.Item name="status" label="Statut" initialValue="ACTIVE">
            <Select>
              {ENROLLMENT_STATUS_OPTIONS.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Level Passage Modal */}
      <Modal
        title="Passage de niveau"
        open={passageModal}
        onCancel={() => setPassageModal(false)}
        onOk={handlePassage}
        confirmLoading={createPassage.isPending}
      >
        <Form form={passageForm} layout="vertical">
          <Form.Item name="learner" label="Apprenant (ID)" rules={[{ required: true }]}>
            <Input placeholder="ID utilisateur de l'apprenant" />
          </Form.Item>
          <Form.Item name="formation" label="Formation" rules={[{ required: true }]}>
            <Select>
              {formationList.map(f => (
                <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="from_level" label="Niveau actuel" rules={[{ required: true }]}>
                <Input placeholder="Ex: A1" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="to_level" label="Niveau cible" rules={[{ required: true }]}>
                <Input placeholder="Ex: A2" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="min_attendance_pct" label="Présence min (%)" rules={[{ required: true }]}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="min_grade" label="Note min" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default GroupManagement;
