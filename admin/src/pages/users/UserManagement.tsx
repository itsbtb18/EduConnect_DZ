import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag,
  Typography, Tooltip, Popconfirm, Row, Col,
  message as antMsg,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined,
  SearchOutlined, UserOutlined, ReloadOutlined,
  MailOutlined, PhoneOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useResetUserPassword, useSchools } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import {
  PageHeader,
  StatusBadge,
  DataCard,
  EmptyState,
  LoadingSkeleton,
} from '../../components/ui';
import './UserManagement.css';

const { Text } = Typography;

/* ── Constants ── */
const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SECTION_ADMIN', label: 'Chef de Section' },
  { value: 'TEACHER', label: 'Enseignant' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'STUDENT', label: 'Eleve' },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'red',
  ADMIN: 'blue',
  SECTION_ADMIN: 'purple',
  TEACHER: 'green',
  PARENT: 'orange',
  STUDENT: 'cyan',
};

const ROLE_GRADIENTS: Record<string, string> = {
  SUPER_ADMIN: 'linear-gradient(135deg, #EF4444, #DC2626)',
  ADMIN: 'linear-gradient(135deg, #3B82F6, #2563EB)',
  SECTION_ADMIN: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  TEACHER: 'linear-gradient(135deg, #10B981, #059669)',
  PARENT: 'linear-gradient(135deg, #F59E0B, #D97706)',
  STUDENT: 'linear-gradient(135deg, #06B6D4, #0891B2)',
};

interface UserRecord {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  role: string;
  school: string | null;
  school_detail?: { id: string; name: string; subdomain: string; subscription_plan: string } | null;
  is_active: boolean;
  is_first_login: boolean;
  created_at: string;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  // Filters
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [schoolFilter, setSchoolFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');

  // Query params
  const params: Record<string, unknown> = {};
  if (roleFilter) params.role = roleFilter;
  if (schoolFilter) params.school = schoolFilter;
  if (searchText) params.search = searchText;

  const { data, isLoading, refetch } = useUsers(params);
  const { data: schoolsData } = useSchools();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const resetPassword = useResetUserPassword();

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPwOpen, setIsResetPwOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [resetPwForm] = Form.useForm();

  const schools = schoolsData?.results || [];

  // All roles for superadmin, limited for school admins
  const roleOptions = isSuperAdmin
    ? [{ value: 'SUPER_ADMIN', label: 'Super Admin' }, ...ROLE_OPTIONS]
    : ROLE_OPTIONS;

  const handleCreate = async (values: Record<string, unknown>) => {
    await createUser.mutateAsync(values);
    setIsCreateOpen(false);
    createForm.resetFields();
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editingUser) return;
    await updateUser.mutateAsync({ id: editingUser.id, data: values });
    setIsEditOpen(false);
    setEditingUser(null);
    editForm.resetFields();
  };

  const handleResetPassword = async (values: { new_password: string }) => {
    if (!editingUser) return;
    await resetPassword.mutateAsync({ id: editingUser.id, new_password: values.new_password });
    setIsResetPwOpen(false);
    setEditingUser(null);
    resetPwForm.resetFields();
  };

  const openEdit = (record: UserRecord) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      first_name: record.first_name,
      last_name: record.last_name,
      phone_number: record.phone_number,
      email: record.email,
      role: record.role,
      school: record.school,
      is_active: record.is_active,
    });
    setIsEditOpen(true);
  };

  const openResetPw = (record: UserRecord) => {
    setEditingUser(record);
    resetPwForm.resetFields();
    setIsResetPwOpen(true);
  };

  /* ── Table columns ── */
  const columns: ColumnsType<UserRecord> = [
    {
      title: 'Utilisateur',
      key: 'user',
      sorter: (a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`),
      render: (_, record) => (
        <div className="um-cell">
          <div className="um-cell__avatar" style={{ background: ROLE_GRADIENTS[record.role] || ROLE_GRADIENTS.STUDENT }}>
            {record.first_name?.[0]}{record.last_name?.[0]}
          </div>
          <div className="um-cell__info">
            <span className="um-cell__name">{record.first_name} {record.last_name}</span>
            <span className="um-cell__sub">{record.phone_number}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || <span className="um-text-muted">—</span>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      filters: roleOptions.map(r => ({ text: r.label, value: r.value })),
      onFilter: (value, record) => record.role === value,
      render: (role: string) => (
        <Tag color={ROLE_COLORS[role] || 'default'} style={{ borderRadius: 12, fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {role.replace('_', ' ')}
        </Tag>
      ),
    },
    ...(isSuperAdmin
      ? [{
          title: 'Ecole',
          key: 'school',
          render: (_: unknown, record: UserRecord) =>
            record.school_detail?.name || (record.role === 'SUPER_ADMIN' ? <span className="um-text-muted">—</span> : <span className="um-text-muted">Non assignee</span>),
        }]
      : []),
    {
      title: 'Statut',
      key: 'status',
      filters: [{ text: 'Actif', value: true }, { text: 'Inactif', value: false }],
      onFilter: (value, record) => record.is_active === value,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusBadge status={record.is_active ? 'active' : 'inactive'} label={record.is_active ? 'Actif' : 'Inactif'} dot size="sm" />
          {record.is_first_login && <Tag color="warning" style={{ borderRadius: 12 }}>1ere connexion</Tag>}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, record) => (
        <div className="um-actions-row">
          <Tooltip title="Modifier">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title="Reinitialiser mot de passe">
            <Button type="text" size="small" icon={<KeyOutlined />} onClick={() => openResetPw(record)} />
          </Tooltip>
          {record.id !== currentUser?.id && (
            <Popconfirm
              title="Desactiver cet utilisateur ?"
              onConfirm={() => deleteUser.mutate(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Tooltip title="Desactiver">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="um-page">
      <PageHeader
        title="Gestion des Utilisateurs"
        subtitle={`${data?.count ?? 0} utilisateur${(data?.count ?? 0) > 1 ? 's' : ''} au total`}
        icon={<UserOutlined />}
        actions={
          <div className="um-header-actions">
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
              Nouvel Utilisateur
            </Button>
          </div>
        }
      />

      {/* ── Toolbar ── */}
      <div className="um-toolbar">
        <div className="um-toolbar__search">
          <Input
            placeholder="Rechercher par nom, telephone..."
            prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
          />
        </div>
        <div className="um-toolbar__filters">
          <Select
            placeholder="Role"
            allowClear
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleOptions}
            className="um-toolbar__select"
            style={{ minWidth: 160 }}
          />
          {isSuperAdmin && (
            <Select
              placeholder="Ecole"
              allowClear
              value={schoolFilter}
              onChange={setSchoolFilter}
              options={schools.map((s: Record<string, unknown>) => ({
                value: s.id as string,
                label: s.name as string,
              }))}
              className="um-toolbar__select"
              style={{ minWidth: 200 }}
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          )}
        </div>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <LoadingSkeleton variant="table" rows={8} />
      ) : !data?.results?.length ? (
        <EmptyState
          icon={<UserOutlined />}
          title="Aucun utilisateur"
          description="Aucun utilisateur ne correspond aux filtres."
          action={<Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>Creer un utilisateur</Button>}
        />
      ) : (
        <DataCard noPadding>
          <div className="um-dark-table">
            <Table
              dataSource={data.results as unknown as UserRecord[]}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 20, showTotal: (t) => `${t} utilisateur(s)`, showSizeChanger: true }}
            />
          </div>
        </DataCard>
      )}

      {/* ════════════════════════════════════════════════════════════════
           CREATE USER MODAL
         ════════════════════════════════════════════════════════════════ */}
      <Modal
        title={<span className="um-modal__title"><UserOutlined /> Creer un Utilisateur</span>}
        open={isCreateOpen}
        onCancel={() => { setIsCreateOpen(false); createForm.resetFields(); }}
        footer={null}
        width={560}
        destroyOnClose
        className="um-modal"
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="first_name" label="Prenom" rules={[{ required: true, message: 'Requis' }]}>
                <Input placeholder="Prenom" size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="Nom" rules={[{ required: true, message: 'Requis' }]}>
                <Input placeholder="Nom de famille" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="phone_number" label="Telephone" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="05XXXXXXXX" prefix={<PhoneOutlined />} size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="email@example.com" type="email" prefix={<MailOutlined />} size="large" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Requis' }]}>
                <Select placeholder="Choisir un role" options={roleOptions} size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              {isSuperAdmin && (
                <Form.Item noStyle shouldUpdate={(prev, cur) => prev.role !== cur.role}>
                  {({ getFieldValue }) => {
                    const role = getFieldValue('role');
                    if (role === 'SUPER_ADMIN') return null;
                    return (
                      <Form.Item name="school" label="Ecole" rules={[{ required: true, message: 'Requis' }]}>
                        <Select
                          placeholder="Choisir une ecole"
                          showSearch
                          size="large"
                          filterOption={(input, option) =>
                            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                          }
                          options={schools.map((s: Record<string, unknown>) => ({
                            value: s.id as string,
                            label: s.name as string,
                          }))}
                        />
                      </Form.Item>
                    );
                  }}
                </Form.Item>
              )}
            </Col>
          </Row>
          <Form.Item name="password" label="Mot de passe" rules={[{ required: true, message: 'Requis' }, { min: 8, message: '8 caracteres minimum' }]}>
            <Input.Password placeholder="Minimum 8 caracteres" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createUser.isPending} block size="large">
              Creer l'utilisateur
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
           EDIT USER MODAL
         ════════════════════════════════════════════════════════════════ */}
      <Modal
        title={<span className="um-modal__title"><EditOutlined /> Modifier: {editingUser?.first_name} {editingUser?.last_name}</span>}
        open={isEditOpen}
        onCancel={() => { setIsEditOpen(false); setEditingUser(null); editForm.resetFields(); }}
        footer={null}
        width={560}
        destroyOnClose
        className="um-modal"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="first_name" label="Prenom" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="last_name" label="Nom" rules={[{ required: true }]}>
                <Input size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="phone_number" label="Telephone" rules={[{ required: true }]}>
            <Input prefix={<PhoneOutlined />} size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" prefix={<MailOutlined />} size="large" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select options={roleOptions} size="large" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Statut">
                <Select size="large" options={[{ value: true, label: 'Actif' }, { value: false, label: 'Inactif' }]} />
              </Form.Item>
            </Col>
          </Row>
          {isSuperAdmin && (
            <Form.Item name="school" label="Ecole">
              <Select
                allowClear
                showSearch
                size="large"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={schools.map((s: Record<string, unknown>) => ({
                  value: s.id as string,
                  label: s.name as string,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateUser.isPending} block size="large">
              Enregistrer
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
           RESET PASSWORD MODAL
         ════════════════════════════════════════════════════════════════ */}
      <Modal
        title={<span className="um-modal__title"><KeyOutlined /> Reinitialiser: {editingUser?.first_name} {editingUser?.last_name}</span>}
        open={isResetPwOpen}
        onCancel={() => { setIsResetPwOpen(false); setEditingUser(null); resetPwForm.resetFields(); }}
        footer={null}
        width={420}
        destroyOnClose
        className="um-modal"
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          L'utilisateur devra changer son mot de passe a la prochaine connexion.
        </Text>
        <Form form={resetPwForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item name="new_password" label="Nouveau mot de passe" rules={[{ required: true, message: 'Requis' }, { min: 8, message: '8 caracteres minimum' }]}>
            <Input.Password placeholder="Minimum 8 caracteres" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={resetPassword.isPending} block size="large">
              Reinitialiser
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
