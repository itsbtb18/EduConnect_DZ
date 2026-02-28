import React, { useState } from 'react';
import {
  Card, Button, Modal, Form, Input, Select, Tag, Space,
  Typography, Tooltip, Popconfirm, Empty, Spin, Badge,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined, GlobalOutlined,
  UserAddOutlined, ReloadOutlined, SearchOutlined,
} from '@ant-design/icons';
import {
  useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool,
  useUsers, useCreateUser,
} from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import './SchoolManagement.css';

const { Title, Text } = Typography;

const PLAN_OPTIONS = [
  { value: 'STARTER', label: 'Starter' },
  { value: 'PRO', label: 'Pro' },
  { value: 'PRO_AI', label: 'Pro + AI' },
];

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'default',
  PRO: 'blue',
  PRO_AI: 'purple',
};

interface SchoolRecord {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  subdomain: string;
  subscription_plan: string;
  subscription_active: boolean;
  created_at: string;
}

const SchoolManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [searchText, setSearchText] = useState('');
  const params: Record<string, unknown> = {};
  if (searchText) params.search = searchText;

  const { data, isLoading, refetch } = useSchools(params);
  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool();
  const deleteSchool = useDeleteSchool();
  const createUser = useCreateUser();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolRecord | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [addAdminForm] = Form.useForm();

  // Fetch admins for the selected school
  const { data: schoolAdmins } = useUsers(
    selectedSchoolId ? { school: selectedSchoolId, role: 'ADMIN' } : undefined
  );

  const schools = (data?.results || []) as unknown as SchoolRecord[];

  const handleCreate = async (values: Record<string, unknown>) => {
    await createSchool.mutateAsync(values);
    setIsCreateOpen(false);
    createForm.resetFields();
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editingSchool) return;
    await updateSchool.mutateAsync({ id: editingSchool.id, data: values });
    setIsEditOpen(false);
    setEditingSchool(null);
    editForm.resetFields();
  };

  const handleAddAdmin = async (values: Record<string, unknown>) => {
    if (!selectedSchoolId) return;
    await createUser.mutateAsync({
      ...values,
      role: 'ADMIN',
      school: selectedSchoolId,
    });
    setIsAddAdminOpen(false);
    addAdminForm.resetFields();
    setSelectedSchoolId(null);
  };

  const openEdit = (record: SchoolRecord) => {
    setEditingSchool(record);
    editForm.setFieldsValue({
      name: record.name,
      address: record.address,
      phone: record.phone,
      email: record.email,
      subdomain: record.subdomain,
      subscription_plan: record.subscription_plan,
    });
    setIsEditOpen(true);
  };

  const openAddAdmin = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    addAdminForm.resetFields();
    setIsAddAdminOpen(true);
  };

  if (!isSuperAdmin) {
    return (
      <div className="school-management">
        <Card>
          <Empty description="Seuls les Super Admins peuvent gerer les ecoles." />
        </Card>
      </div>
    );
  }

  return (
    <div className="school-management">
      <div className="school-management__header">
        <div>
          <Title level={3} className="school-management__title">
            <BankOutlined /> Gestion des Ecoles
          </Title>
          <Text className="school-management__subtitle">
            {data?.count ?? 0} ecole{(data?.count ?? 0) > 1 ? 's' : ''} enregistree{(data?.count ?? 0) > 1 ? 's' : ''}
          </Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Actualiser
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            Nouvelle Ecole
          </Button>
        </Space>
      </div>

      {/* Search */}
      <Card size="small">
        <Input
          placeholder="Rechercher une ecole..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className="school-management__search-input"
        />
      </Card>

      {/* School cards */}
      {isLoading ? (
        <div className="school-management__loading"><Spin size="large" /></div>
      ) : schools.length === 0 ? (
        <Card><Empty description="Aucune ecole trouvee" /></Card>
      ) : (
        <div className="school-management__grid">
          {schools.map((school) => (
            <Card key={school.id} className="school-card">
              <div className="school-card__header">
                <div className="school-card__avatar">
                  {school.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="school-card__name">{school.name}</h3>
                  <span className="school-card__subdomain">{school.subdomain}.educonnect.dz</span>
                </div>
                <div className="school-card__status">
                  <Badge
                    status={school.subscription_active ? 'success' : 'error'}
                    text={school.subscription_active ? 'Actif' : 'Inactif'}
                  />
                </div>
              </div>

              <div className="school-card__details">
                <Tag color={PLAN_COLORS[school.subscription_plan] || 'default'}>
                  {school.subscription_plan}
                </Tag>
                {school.address && (
                  <div className="school-card__detail-row">
                    <EnvironmentOutlined /> {school.address}
                  </div>
                )}
                {school.phone && (
                  <div className="school-card__detail-row">
                    <PhoneOutlined /> {school.phone}
                  </div>
                )}
                {school.email && (
                  <div className="school-card__detail-row">
                    <MailOutlined /> {school.email}
                  </div>
                )}
                <div className="school-card__detail-row">
                  <GlobalOutlined /> {school.subdomain}
                </div>
              </div>

              <div className="school-card__actions">
                <Tooltip title="Modifier">
                  <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(school)} />
                </Tooltip>
                <Tooltip title="Ajouter un admin">
                  <Button type="text" icon={<UserAddOutlined />} onClick={() => openAddAdmin(school.id)} />
                </Tooltip>
                <Popconfirm
                  title="Supprimer cette ecole ?"
                  description="Cette action est irreversible."
                  onConfirm={() => deleteSchool.mutate(school.id)}
                  okText="Oui"
                  cancelText="Non"
                >
                  <Tooltip title="Supprimer">
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create School Modal ── */}
      <Modal
        title="Creer une Ecole"
        open={isCreateOpen}
        onCancel={() => { setIsCreateOpen(false); createForm.resetFields(); }}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="name" label="Nom de l'ecole" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input placeholder="Ex: Ecole Ibn Khaldoun" />
          </Form.Item>
          <Form.Item
            name="subdomain"
            label="Sous-domaine"
            rules={[
              { required: true, message: 'Sous-domaine requis' },
              { pattern: /^[a-z0-9-]+$/, message: 'Lettres minuscules, chiffres et tirets uniquement' },
            ]}
          >
            <Input placeholder="ibn-khaldoun" suffix=".educonnect.dz" />
          </Form.Item>
          <Form.Item name="address" label="Adresse">
            <Input.TextArea rows={2} placeholder="Adresse de l'ecole" />
          </Form.Item>
          <Form.Item name="phone" label="Telephone">
            <Input placeholder="05XXXXXXXX" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="contact@ecole.dz" type="email" />
          </Form.Item>
          <Form.Item name="subscription_plan" label="Plan d'abonnement" rules={[{ required: true }]}>
            <Select placeholder="Choisir un plan" options={PLAN_OPTIONS} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createSchool.isPending} block>
              Creer l'ecole
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Edit School Modal ── */}
      <Modal
        title={`Modifier: ${editingSchool?.name}`}
        open={isEditOpen}
        onCancel={() => { setIsEditOpen(false); setEditingSchool(null); editForm.resetFields(); }}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item name="name" label="Nom" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subdomain" label="Sous-domaine" rules={[{ required: true }]}>
            <Input suffix=".educonnect.dz" />
          </Form.Item>
          <Form.Item name="address" label="Adresse">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="phone" label="Telephone">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="subscription_plan" label="Plan" rules={[{ required: true }]}>
            <Select options={PLAN_OPTIONS} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateSchool.isPending} block>
              Enregistrer
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Add Admin to School Modal ── */}
      <Modal
        title="Ajouter un Administrateur"
        open={isAddAdminOpen}
        onCancel={() => { setIsAddAdminOpen(false); setSelectedSchoolId(null); addAdminForm.resetFields(); }}
        footer={null}
        width={520}
        destroyOnClose
      >
        {selectedSchoolId && schoolAdmins && schoolAdmins.results.length > 0 && (
          <div className="school-management__admin-section">
            <Text type="secondary" strong>Admins existants:</Text>
            <div className="school-management__admin-tags">
              {schoolAdmins.results.map((admin: Record<string, unknown>) => (
                <Tag key={admin.id as string} color="blue">
                  {admin.first_name as string} {admin.last_name as string}
                </Tag>
              ))}
            </div>
          </div>
        )}
        <Form form={addAdminForm} layout="vertical" onFinish={handleAddAdmin}>
          <Form.Item name="first_name" label="Prenom" rules={[{ required: true, message: 'Prenom requis' }]}>
            <Input placeholder="Prenom" />
          </Form.Item>
          <Form.Item name="last_name" label="Nom" rules={[{ required: true, message: 'Nom requis' }]}>
            <Input placeholder="Nom de famille" />
          </Form.Item>
          <Form.Item name="phone_number" label="Telephone" rules={[{ required: true, message: 'Telephone requis' }]}>
            <Input placeholder="05XXXXXXXX" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="admin@ecole.dz" type="email" />
          </Form.Item>
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
              Ajouter comme Admin
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolManagement;
