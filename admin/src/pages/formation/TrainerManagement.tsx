/**
 * Trainer Management — Training Center
 * Profile, contract types, availability, multi-institution detection
 */
import React, { useState } from 'react';
import {
  Card, Table, Button, Input, Tag, Drawer, Form, Select, Space,
  Descriptions, Row, Col, InputNumber, DatePicker, Tabs, Badge, List,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ReloadOutlined,
  EditOutlined, EyeOutlined, UserSwitchOutlined,
} from '@ant-design/icons';
import {
  useTrainerSalaryConfigs, useCreateSalaryConfig,
  useTrainingSessions, useTrainingGroups,
} from '../../hooks/useFormation';
import { CONTRACT_TYPE_OPTIONS, SESSION_STATUS_OPTIONS } from '../../constants/training-center';
import type { TrainerSalaryConfig, TrainingGroup, TrainingSession } from '../../types/formation';
import dayjs from 'dayjs';

const TrainerManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TrainerSalaryConfig | null>(null);
  const [detailDrawer, setDetailDrawer] = useState<TrainerSalaryConfig | null>(null);
  const [form] = Form.useForm();

  const { data: configs, isLoading, refetch } = useTrainerSalaryConfigs({ page, page_size: 20, search });
  const { data: groups } = useTrainingGroups();
  const { data: sessions } = useTrainingSessions({});

  const trainerList = (configs?.results || []) as TrainerSalaryConfig[];
  const groupList = (groups?.results || []) as TrainingGroup[];
  const sessionList = (sessions?.results || []) as TrainingSession[];

  const createConfig = useCreateSalaryConfig();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (record: TrainerSalaryConfig) => {
    setEditing(record);
    form.setFieldsValue({
      ...record,
      hire_date: record.hire_date ? dayjs(record.hire_date) : undefined,
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      hire_date: values.hire_date?.format('YYYY-MM-DD'),
    };
    await createConfig.mutateAsync(data);
    setDrawerOpen(false);
    form.resetFields();
  };

  const getTrainerGroupCount = (trainerId: string) =>
    groupList.filter(g => g.trainer === trainerId).length;

  const getTrainerHoursThisMonth = (trainerId: string) => {
    const now = dayjs();
    return sessionList.filter(s =>
      s.trainer === trainerId &&
      dayjs(s.date).month() === now.month() &&
      dayjs(s.date).year() === now.year() &&
      s.status === 'COMPLETED'
    ).length;
  };

  const columns = [
    {
      title: 'Formateur', dataIndex: 'trainer_name', key: 'name',
      render: (name: string) => (
        <Space><UserSwitchOutlined style={{ color: '#3B82F6' }} />{name || '—'}</Space>
      ),
    },
    {
      title: 'Contrat', dataIndex: 'contract_type', key: 'contract',
      render: (v: string) => {
        const opt = CONTRACT_TYPE_OPTIONS.find(o => o.value === v);
        return <Tag>{opt?.label || v}</Tag>;
      },
    },
    {
      title: 'Taux horaire', dataIndex: 'hourly_rate', key: 'rate',
      render: (v: number) => v ? `${v.toLocaleString()} DA/h` : '—',
    },
    {
      title: 'Salaire de base', dataIndex: 'base_salary', key: 'salary',
      render: (v: number) => v ? `${v.toLocaleString()} DA` : '—',
    },
    {
      title: 'Groupes', key: 'groups',
      render: (_: unknown, r: TrainerSalaryConfig) => (
        <Badge count={getTrainerGroupCount(r.trainer)} showZero style={{ backgroundColor: '#3B82F6' }} />
      ),
    },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, record: TrainerSalaryConfig) => (
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Gestion des Formateurs</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Profils, contrats, disponibilité et charge</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Ajouter un formateur
          </Button>
        </Space>
      </div>

      <Input
        placeholder="Rechercher un formateur..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }}
        style={{ marginBottom: 16, maxWidth: 400 }}
        allowClear
      />

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={trainerList}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total: configs?.count || 0,
            onChange: setPage,
            showSizeChanger: false,
          }}
        />
      </Card>

      {/* Add / Edit Drawer */}
      <Drawer
        title={editing ? 'Modifier le formateur' : 'Nouveau formateur'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button type="primary" onClick={handleSubmit} loading={createConfig.isPending}>
              {editing ? 'Mettre à jour' : 'Enregistrer'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          {!editing && (
            <Form.Item name="trainer" label="Formateur (ID utilisateur)" rules={[{ required: true }]}>
              <Input placeholder="ID utilisateur du formateur" />
            </Form.Item>
          )}
          <Form.Item name="contract_type" label="Type de contrat" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner">
              {CONTRACT_TYPE_OPTIONS.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="base_salary" label="Salaire de base (DA)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hourly_rate" label="Taux horaire (DA)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="hire_date" label="Date d'embauche">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="bank_account" label="Compte bancaire">
            <Input placeholder="RIB / Numéro de compte" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer
        title="Profil du formateur"
        open={!!detailDrawer}
        onClose={() => setDetailDrawer(null)}
        width={560}
      >
        {detailDrawer && (
          <Tabs defaultActiveKey="info" items={[
            {
              key: 'info', label: 'Informations',
              children: (
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Nom">{detailDrawer.trainer_name}</Descriptions.Item>
                  <Descriptions.Item label="Contrat">
                    {CONTRACT_TYPE_OPTIONS.find(c => c.value === detailDrawer.contract_type)?.label}
                  </Descriptions.Item>
                  <Descriptions.Item label="Taux horaire">{detailDrawer.hourly_rate} DA/h</Descriptions.Item>
                  <Descriptions.Item label="Salaire de base">{detailDrawer.base_salary?.toLocaleString()} DA</Descriptions.Item>
                  <Descriptions.Item label="Date d'embauche">
                    {detailDrawer.hire_date ? dayjs(detailDrawer.hire_date).format('DD/MM/YYYY') : '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Compte bancaire">{detailDrawer.bank_account || '—'}</Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'groups', label: `Groupes (${getTrainerGroupCount(detailDrawer.trainer)})`,
              children: (
                <List
                  dataSource={groupList.filter(g => g.trainer === detailDrawer.trainer)}
                  renderItem={(g: TrainingGroup) => (
                    <List.Item>
                      <List.Item.Meta
                        title={g.name}
                        description={`${g.formation_name} · Niveau ${g.level} · ${g.enrolled_count || 0} apprenants`}
                      />
                      <Tag color={g.status === 'IN_PROGRESS' ? 'blue' : g.status === 'OPEN' ? 'green' : 'default'}>
                        {g.status}
                      </Tag>
                    </List.Item>
                  )}
                  locale={{ emptyText: 'Aucun groupe assigné' }}
                />
              ),
            },
            {
              key: 'workload', label: 'Charge de travail',
              children: (
                <div>
                  <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
                    <Descriptions.Item label="Séances ce mois">
                      {getTrainerHoursThisMonth(detailDrawer.trainer)} séances complétées
                    </Descriptions.Item>
                    <Descriptions.Item label="Groupes actifs">
                      {groupList.filter(g => g.trainer === detailDrawer.trainer && g.status === 'IN_PROGRESS').length}
                    </Descriptions.Item>
                  </Descriptions>
                  <h4>Prochaines séances</h4>
                  <Table
                    dataSource={sessionList.filter(s =>
                      s.trainer === detailDrawer.trainer &&
                      dayjs(s.date).isAfter(dayjs().subtract(1, 'day')) &&
                      s.status === 'SCHEDULED'
                    ).slice(0, 5)}
                    columns={[
                      { title: 'Date', dataIndex: 'date', key: 'd',
                        render: (v: string) => dayjs(v).format('DD/MM') },
                      { title: 'Horaire', key: 't',
                        render: (_: unknown, r: TrainingSession) => `${r.start_time?.slice(0, 5)}-${r.end_time?.slice(0, 5)}` },
                      { title: 'Groupe', dataIndex: 'group_name', key: 'g' },
                    ]}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                </div>
              ),
            },
          ]} />
        )}
      </Drawer>
    </div>
  );
};

export default TrainerManagement;
