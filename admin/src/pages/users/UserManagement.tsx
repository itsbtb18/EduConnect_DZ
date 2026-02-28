import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Tag, Space,
  Card, Tooltip, Popconfirm, Badge, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined,
  SearchOutlined, UserOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useResetUserPassword, useSchools } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import './UserManagement.css';

const { Title, Text } = Typography;

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

  const columns = [
    {
      title: 'Utilisateur',
      key: 'user',
      render: (_: unknown, record: UserRecord) => (
        <div className="user-management__user-cell">
          <div
            className={`user-management__user-avatar user-management__user-avatar--${record.role.toLowerCase().replace('_', '-')}`}
          >
            {record.first_name?.[0]}{record.last_name?.[0]}
          </div>
          <div className="user-management__user-info">
            <span className="user-management__user-name">
              {record.first_name} {record.last_name}
            </span>
            <span className="user-management__user-phone">{record.phone_number}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '—',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={ROLE_COLORS[role] || 'default'} className="user-management__role-tag">
          {role.replace('_', ' ')}
        </Tag>
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            title: 'Ecole',
            key: 'school',
            render: (_: unknown, record: UserRecord) =>
              record.school_detail?.name || (record.role === 'SUPER_ADMIN' ? '—' : 'Non assignee'),
          },
        ]
      : []),
    {
      title: 'Statut',
      key: 'status',
      render: (_: unknown, record: UserRecord) => (
        <Space>
          <Badge status={record.is_active ? 'success' : 'error'} text={record.is_active ? 'Actif' : 'Inactif'} />
          {record.is_first_login && <Tag color="warning">1ere connexion</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: UserRecord) => (
        <div className="user-management__actions">
          <Tooltip title="Modifier">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title="Reinitialiser mot de passe">
            <Button type="text" icon={<KeyOutlined />} onClick={() => openResetPw(record)} />
          </Tooltip>
          {record.id !== currentUser?.id && (
            <Popconfirm
              title="Desactiver cet utilisateur ?"
              onConfirm={() => deleteUser.mutate(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Tooltip title="Desactiver">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="user-management">
      <div className="user-management__header">
        <div>
          <Title level={3} className="user-management__title">
            <UserOutlined /> Gestion des Utilisateurs
          </Title>
          <Text className="user-management__subtitle">
            {data?.count ?? 0} utilisateur{(data?.count ?? 0) > 1 ? 's' : ''} au total
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Actualiser
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            Nouvel Utilisateur
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card size="small">
        <div className="user-management__filters">
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            className="user-management__filter-search"
          />
          <Select
            placeholder="Filtrer par role"
            allowClear
            value={roleFilter}
            onChange={setRoleFilter}
            options={roleOptions}
            className="user-management__filter-role"
          />
          {isSuperAdmin && (
            <Select
              placeholder="Filtrer par ecole"
              allowClear
              value={schoolFilter}
              onChange={setSchoolFilter}
              options={schools.map((s: Record<string, unknown>) => ({
                value: s.id as string,
                label: s.name as string,
              }))}
              className="user-management__filter-school"
              showSearch
              filterOption={(input, option) =>
                (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
              }
            />
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table
          dataSource={(data?.results || []) as unknown as UserRecord[]}
          columns={columns}
          loading={isLoading}
          rowKey="id"
          pagination={{ pageSize: 20, showTotal: (t) => `${t} utilisateur(s)` }}
        />
      </Card>

      {/* ── Create User Modal ── */}
      <Modal
        title="Creer un Utilisateur"
        open={isCreateOpen}
        onCancel={() => { setIsCreateOpen(false); createForm.resetFields(); }}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="first_name" label="Prenom" rules={[{ required: true, message: 'Prenom requis' }]}>
            <Input placeholder="Prenom" />
          </Form.Item>
          <Form.Item name="last_name" label="Nom" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input placeholder="Nom de famille" />
          </Form.Item>
          <Form.Item
            name="phone_number"
            label="Numero de telephone"
            rules={[{ required: true, message: 'Telephone requis' }]}
          >
            <Input placeholder="05XXXXXXXX" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="email@example.com" type="email" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Role requis' }]}>
            <Select placeholder="Choisir un role" options={roleOptions} />
          </Form.Item>
          {isSuperAdmin && (
            <Form.Item
              noStyle
              shouldUpdate={(prev, cur) => prev.role !== cur.role}
            >
              {({ getFieldValue }) => {
                const role = getFieldValue('role');
                if (role === 'SUPER_ADMIN') return null;
                return (
                  <Form.Item
                    name="school"
                    label="Ecole"
                    rules={[{ required: true, message: 'Ecole requise pour ce role' }]}
                  >
                    <Select
                      placeholder="Choisir une ecole"
                      showSearch
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
          <Form.Item
            name="password"
            label="Mot de passe"
            rules={[
              { required: true, message: 'Mot de passe requis' },
              { min: 8, message: '8 caracteres minimum' },
            ]}
          >
            <Input.Password placeholder="Minimum 8 caracteres" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createUser.isPending} block>
              Creer l'utilisateur
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Edit User Modal ── */}
      <Modal
        title={`Modifier: ${editingUser?.first_name} ${editingUser?.last_name}`}
        open={isEditOpen}
        onCancel={() => { setIsEditOpen(false); setEditingUser(null); editForm.resetFields(); }}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="first_name" label="Prenom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="Nom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone_number" label="Telephone" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select options={roleOptions} />
          </Form.Item>
          {isSuperAdmin && (
            <Form.Item name="school" label="Ecole">
              <Select
                allowClear
                showSearch
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
          <Form.Item name="is_active" label="Statut">
            <Select
              options={[
                { value: true, label: 'Actif' },
                { value: false, label: 'Inactif' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateUser.isPending} block>
              Enregistrer
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Reset Password Modal ── */}
      <Modal
        title={`Reinitialiser: ${editingUser?.first_name} ${editingUser?.last_name}`}
        open={isResetPwOpen}
        onCancel={() => { setIsResetPwOpen(false); setEditingUser(null); resetPwForm.resetFields(); }}
        footer={null}
        width={420}
        destroyOnClose
      >
        <Text type="secondary" className="user-management__reset-hint">
          L'utilisateur devra changer son mot de passe a la prochaine connexion.
        </Text>
        <Form form={resetPwForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item
            name="new_password"
            label="Nouveau mot de passe"
            rules={[
              { required: true, message: 'Mot de passe requis' },
              { min: 8, message: '8 caracteres minimum' },
            ]}
          >
            <Input.Password placeholder="Minimum 8 caracteres" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={resetPassword.isPending} block>
              Reinitialiser
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
