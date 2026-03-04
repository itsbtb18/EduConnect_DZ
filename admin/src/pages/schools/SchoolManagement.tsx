import React, { useState, useMemo } from 'react';
import {
  Button, Modal, Form, Input, Select, Tag, Table,
  Typography, Tooltip, Popconfirm, Steps, Upload, Radio,
  Checkbox, DatePicker, InputNumber, Divider, Alert, Row, Col,
  message as antMsg, Result, Segmented,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, BankOutlined,
  PhoneOutlined, MailOutlined, EnvironmentOutlined, GlobalOutlined,
  UserAddOutlined, ReloadOutlined, SearchOutlined,
  CloudUploadOutlined, CrownOutlined, TeamOutlined,
  BookOutlined,
  CheckCircleOutlined, SafetyCertificateOutlined,
  EyeOutlined, EyeInvisibleOutlined, LockOutlined, CopyOutlined,
  AppstoreOutlined, UnorderedListOutlined, FilterOutlined,
} from '@ant-design/icons';
import type { UploadFile, RcFile } from 'antd/es/upload';
import {
  useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool,
  useUsers, useCreateUser,
} from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { wilayas } from '../../data/mockData';
import {
  PageHeader,
  StatusBadge,
  DataCard,
  EmptyState,
  LoadingSkeleton,
} from '../../components/ui';
import './SchoolManagement.css';

const { Text } = Typography;
const { TextArea } = Input;

/** Normalise a logo URL so the Vite /media proxy can serve it.
 *  Absolute URLs → strip to pathname; relative paths → ensure leading /.
 */
const normalizeLogoUrl = (url: string | null | undefined): string | null => {
  if (!url || url.trim() === '') return null;
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url.startsWith('/') ? url : `/${url}`;
  }
};

/* ── Constants ── */
const PLAN_OPTIONS = [
  { value: 'STARTER', label: 'Starter', desc: 'Jusqu\'a 100 eleves' },
  { value: 'PRO', label: 'Pro', desc: 'Jusqu\'a 500 eleves' },
  { value: 'PRO_AI', label: 'Pro + AI', desc: 'Illimite + IA' },
];

const PLAN_COLORS: Record<string, string> = {
  STARTER: '#3B82F6',
  PRO: '#F59E0B',
  PRO_AI: '#A855F7',
};

const PLAN_TAG_COLORS: Record<string, string> = {
  STARTER: 'blue',
  PRO: 'gold',
  PRO_AI: 'purple',
};

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  PRO_AI: 'Pro + AI',
};

const CATEGORY_OPTIONS = [
  { value: 'PRIVATE_SCHOOL', label: 'Ecole Privee', icon: <BankOutlined /> },
  { value: 'TRAINING_CENTER', label: 'Centre de Formation', icon: <BookOutlined /> },
];

const TRAINING_TYPES = [
  { value: 'SUPPORT_COURSES', label: 'Cours de Soutien Scolaire' },
  { value: 'LANGUAGES', label: 'Ecole de Langues' },
  { value: 'PROFESSIONAL', label: 'Formation Professionnelle' },
  { value: 'EXAM_PREP', label: 'Preparation aux Examens (BEM/BAC)' },
  { value: 'COMPUTING', label: 'Informatique & Bureautique' },
  { value: 'OTHER', label: 'Autre' },
];

const WILAYA_OPTIONS = wilayas.map((w, i) => ({
  value: w,
  label: `${String(i + 1).padStart(2, '0')} - ${w}`,
}));

const SECTION_OPTIONS = [
  { key: 'has_primary', label: 'Ecole Primaire', icon: 'P' },
  { key: 'has_middle', label: 'CEM (Moyen)', icon: 'M' },
  { key: 'has_high', label: 'Lycee (Secondaire)', icon: 'L' },
];

const CREATE_STEPS = [
  { title: 'Identite', icon: <BankOutlined /> },
  { title: 'Categorie', icon: <BookOutlined /> },
  { title: 'Abonnement', icon: <CrownOutlined /> },
  { title: 'Administrateur', icon: <TeamOutlined /> },
];

interface SchoolRecord {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  subdomain: string;
  subscription_plan: string;
  subscription_active: boolean;
  is_active: boolean;
  school_category: string;
  has_primary: boolean;
  has_middle: boolean;
  has_high: boolean;
  training_type?: string;
  wilaya?: string;
  website?: string;
  motto?: string;
  logo_url?: string;
  max_students: number;
  subscription_start?: string;
  subscription_end?: string;
  setup_completed: boolean;
  notes?: string;
  created_at: string;
}

/* ══════════════════════════════════════════════════════════════════════ */

const SchoolManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  /* ── View / filter state ── */
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('schools-view') as 'grid' | 'list') || 'grid';
  });
  const [searchText, setSearchText] = useState('');
  const [planFilter, setPlanFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const params: Record<string, unknown> = {};
  if (searchText) params.search = searchText;

  const { data, isLoading, refetch } = useSchools(params);
  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool();
  const deleteSchool = useDeleteSchool();
  const createUser = useCreateUser();

  /* ── Create modal state ── */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [createForm] = Form.useForm();
  const [logoFile, setLogoFile] = useState<UploadFile[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [createdCreds, setCreatedCreds] = useState<{
    phone_number: string;
    password: string;
    first_name: string;
    last_name: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  /* ── Logo error tracking ── */
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set());
  const markLogoError = (id: string) => setLogoErrors((prev) => new Set(prev).add(id));

  /* ── Edit modal state ── */
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolRecord | null>(null);
  const [editForm] = Form.useForm();

  /* ── Add Admin modal state ── */
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [addAdminForm] = Form.useForm();

  const { data: schoolAdmins } = useUsers(
    selectedSchoolId ? { school: selectedSchoolId, role: 'ADMIN' } : undefined
  );

  const allSchools = (data?.results || []) as unknown as SchoolRecord[];
  const watchCategory = Form.useWatch('school_category', createForm);
  const watchHasHigh = Form.useWatch('has_high', createForm);

  /* ── Client-side filtering ── */
  const schools = useMemo(() => {
    let result = allSchools;
    if (planFilter) result = result.filter((s) => s.subscription_plan === planFilter);
    if (statusFilter === 'active') result = result.filter((s) => s.is_active);
    if (statusFilter === 'inactive') result = result.filter((s) => !s.is_active);
    if (categoryFilter) result = result.filter((s) => s.school_category === categoryFilter);
    return result;
  }, [allSchools, planFilter, statusFilter, categoryFilter]);

  /* ── Logo upload handler ── */
  const handleLogoUpload = (file: RcFile) => {
    if (!file.type.includes('png')) {
      antMsg.error('Seuls les fichiers PNG sont acceptes');
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      antMsg.error('Le logo ne doit pas depasser 2 Mo');
      return false;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setLogoFile([{ uid: '-1', name: file.name, status: 'done', originFileObj: file }]);
    return false;
  };

  const removeLogo = () => { setLogoFile([]); setLogoPreview(null); };

  /* ── Subdomain auto-suggest ── */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const currentSubdomain = createForm.getFieldValue('subdomain');
    if (!currentSubdomain || currentSubdomain === '') {
      const slug = name
        .toLowerCase()
        .replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e')
        .replace(/[ïî]/g, 'i').replace(/[ôö]/g, 'o')
        .replace(/[ùûü]/g, 'u').replace(/[ç]/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        .slice(0, 30);
      createForm.setFieldValue('subdomain', slug);
    }
  };

  /* ── Generate password ── */
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    createForm.setFieldValue('admin_password', pass);
  };

  /* ── Step validation ── */
  const validateStep = async (step: number): Promise<boolean> => {
    try {
      const fieldMap: Record<number, string[]> = {
        0: ['name', 'subdomain', 'wilaya'],
        1: ['school_category'],
        2: ['subscription_plan'],
        3: [],
      };
      const fields = fieldMap[step] || [];
      if (fields.length > 0) await createForm.validateFields(fields);

      if (step === 1) {
        const cat = createForm.getFieldValue('school_category');
        if (cat === 'PRIVATE_SCHOOL') {
          const p = createForm.getFieldValue('has_primary');
          const m = createForm.getFieldValue('has_middle');
          const h = createForm.getFieldValue('has_high');
          if (!p && !m && !h) { antMsg.error('Veuillez selectionner au moins un cycle'); return false; }
        }
        if (cat === 'TRAINING_CENTER') {
          const tt = createForm.getFieldValue('training_type');
          if (!tt) { antMsg.error('Veuillez choisir le type de formation'); return false; }
        }
      }
      return true;
    } catch { return false; }
  };

  const nextStep = async () => { const valid = await validateStep(createStep); if (valid) setCreateStep(createStep + 1); };
  const prevStep = () => setCreateStep(createStep - 1);

  /* ── Submit create ── */
  const handleCreate = async () => {
    const values = createForm.getFieldsValue(true);
    const formData = new FormData();
    formData.append('name', values.name);
    formData.append('subdomain', values.subdomain);
    if (values.address) formData.append('address', values.address);
    if (values.wilaya) formData.append('wilaya', values.wilaya);
    if (values.phone) formData.append('phone', values.phone);
    if (values.email) formData.append('email', values.email);
    if (values.website) formData.append('website', values.website);
    if (values.motto) formData.append('motto', values.motto);
    if (logoFile.length > 0 && logoFile[0].originFileObj) formData.append('logo', logoFile[0].originFileObj);
    formData.append('school_category', values.school_category || 'PRIVATE_SCHOOL');
    if (values.school_category === 'PRIVATE_SCHOOL') {
      formData.append('has_primary', values.has_primary ? 'true' : 'false');
      formData.append('has_middle', values.has_middle ? 'true' : 'false');
      formData.append('has_high', values.has_high ? 'true' : 'false');
      if (values.has_high && values.available_streams?.length > 0) {
        formData.append('available_streams', JSON.stringify(values.available_streams));
      }
    }
    if (values.school_category === 'TRAINING_CENTER' && values.training_type) formData.append('training_type', values.training_type);
    formData.append('subscription_plan', values.subscription_plan || 'STARTER');
    if (values.subscription_start) formData.append('subscription_start', values.subscription_start.format('YYYY-MM-DD'));
    if (values.subscription_end) formData.append('subscription_end', values.subscription_end.format('YYYY-MM-DD'));
    if (values.max_students) formData.append('max_students', String(values.max_students));
    if (values.notes) formData.append('notes', values.notes);
    if (values.admin_first_name) formData.append('admin_first_name', values.admin_first_name);
    if (values.admin_last_name) formData.append('admin_last_name', values.admin_last_name);
    if (values.admin_phone) formData.append('admin_phone', values.admin_phone);
    if (values.admin_email) formData.append('admin_email', values.admin_email);
    if (values.admin_password) formData.append('admin_password', values.admin_password);

    try {
      const res = await createSchool.mutateAsync(formData);
      const resData = (res as { data?: { admin_credentials?: typeof createdCreds } })?.data;
      if (resData?.admin_credentials) { setCreatedCreds(resData.admin_credentials); setCreateStep(4); }
      else closeCreateModal();
    } catch { /* handled by hook */ }
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false); setCreateStep(0); createForm.resetFields();
    setLogoFile([]); setLogoPreview(null); setCreatedCreds(null); setShowPassword(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    antMsg.success('Copie dans le presse-papier');
  };

  /* ── Edit ── */
  const openEdit = (record: SchoolRecord) => {
    setEditingSchool(record);
    editForm.setFieldsValue({
      name: record.name, address: record.address, phone: record.phone,
      email: record.email, subdomain: record.subdomain, wilaya: record.wilaya,
      website: record.website, motto: record.motto, subscription_plan: record.subscription_plan,
      school_category: record.school_category, max_students: record.max_students,
      is_active: record.is_active, notes: record.notes,
    });
    setIsEditOpen(true);
  };

  const handleEdit = async (values: Record<string, unknown>) => {
    if (!editingSchool) return;
    await updateSchool.mutateAsync({ id: editingSchool.id, data: values });
    setIsEditOpen(false); setEditingSchool(null); editForm.resetFields();
  };

  /* ── Add Admin ── */
  const openAddAdmin = (schoolId: string) => {
    setSelectedSchoolId(schoolId); addAdminForm.resetFields(); setIsAddAdminOpen(true);
  };

  const handleAddAdmin = async (values: Record<string, unknown>) => {
    if (!selectedSchoolId) return;
    await createUser.mutateAsync({ ...values, role: 'ADMIN', school: selectedSchoolId });
    setIsAddAdminOpen(false); addAdminForm.resetFields(); setSelectedSchoolId(null);
  };

  /* ── Helpers ── */
  const categoryLabel = (cat: string) => cat === 'TRAINING_CENTER' ? 'Centre de Formation' : 'Ecole Privee';

  const sectionBadges = (s: SchoolRecord) => {
    const badges: string[] = [];
    if (s.school_category === 'PRIVATE_SCHOOL') {
      if (s.has_primary) badges.push('Primaire');
      if (s.has_middle) badges.push('Moyen');
      if (s.has_high) badges.push('Secondaire');
    }
    return badges;
  };

  const handleViewChange = (val: string | number) => {
    const v = val as 'grid' | 'list';
    setViewMode(v);
    localStorage.setItem('schools-view', v);
  };

  const schoolCount = data?.count ?? 0;
  const activeCount = useMemo(() => allSchools.filter((s) => s.is_active).length, [allSchools]);
  const hasActiveFilters = !!(planFilter || statusFilter || categoryFilter);

  /* ── Table columns for list view ── */
  const listColumns: ColumnsType<SchoolRecord> = [
    {
      title: 'École',
      key: 'name',
      render: (_, record) => {
        const logoSrc = normalizeLogoUrl(record.logo_url);
        const hasError = logoErrors.has(record.id);
        return (
        <div className="sm-cell">
          <div className="sm-cell__avatar">
            {logoSrc && !hasError
              ? <img src={logoSrc} alt="" className="sm-cell__logo-img" onError={() => markLogoError(record.id)} />
              : record.name.substring(0, 2).toUpperCase()
            }
          </div>
          <div>
            <div className="sm-cell__name">{record.name}</div>
            <div className="sm-cell__sub">{record.subdomain}.ilmi.dz</div>
          </div>
        </div>
        );
      },
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Plan',
      dataIndex: 'subscription_plan',
      key: 'plan',
      width: 100,
      render: (plan: string) => (
        <Tag color={PLAN_COLORS[plan]} style={{ borderRadius: 20, fontWeight: 600, border: 'none' }}>
          {PLAN_LABELS[plan] || plan}
        </Tag>
      ),
    },
    {
      title: 'Catégorie',
      dataIndex: 'school_category',
      key: 'category',
      width: 160,
      render: (cat: string) => (
        <Tag color={cat === 'TRAINING_CENTER' ? 'orange' : 'cyan'} style={{ borderRadius: 16 }}>
          {categoryLabel(cat)}
        </Tag>
      ),
    },
    {
      title: 'Wilaya',
      dataIndex: 'wilaya',
      key: 'wilaya',
      width: 130,
      render: (w: string) => w || <span className="sm-text-muted">—</span>,
    },
    {
      title: 'Statut',
      dataIndex: 'is_active',
      key: 'status',
      width: 100,
      render: (active: boolean) => (
        <StatusBadge status={active ? 'active' : 'inactive'} label={active ? 'Actif' : 'Inactif'} />
      ),
    },
    {
      title: 'Créée le',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 110,
      render: (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—',
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <div className="sm-actions-row">
          <Tooltip title="Modifier">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title="Ajouter admin">
            <Button type="text" size="small" icon={<UserAddOutlined />} onClick={() => openAddAdmin(record.id)} />
          </Tooltip>
          <Popconfirm
            title="Supprimer cette ecole ?"
            description="Cette action est irreversible."
            onConfirm={() => deleteSchool.mutate(record.id)}
            okText="Oui" cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  /* ── Guard ── */
  if (!isSuperAdmin) {
    return (
      <div className="sm-page">
        <EmptyState title="Accès restreint" description="Seuls les Super Admins peuvent gerer les ecoles." />
      </div>
    );
  }

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <div className="sm-page">
      {/* ── Page header ── */}
      <PageHeader
        title="Gestion des Écoles"
        subtitle={`${schoolCount} ecole${schoolCount > 1 ? 's' : ''} · ${activeCount} active${activeCount > 1 ? 's' : ''}`}
        icon={<BankOutlined />}
        actions={
          <div className="sm-header-actions">
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              Actualiser
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => setIsCreateOpen(true)}
            >
              Nouvelle Ecole
            </Button>
          </div>
        }
      />

      {/* ── Toolbar: search + filters + view toggle ── */}
      <div className="sm-toolbar">
        <Input
          placeholder="Rechercher une ecole..."
          prefix={<SearchOutlined style={{ color: 'var(--text-tertiary)' }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          className="sm-toolbar__search"
        />
        <div className="sm-toolbar__filters">
          <Select
            placeholder={<><FilterOutlined /> Plan</>}
            value={planFilter}
            onChange={setPlanFilter}
            allowClear
            className="sm-toolbar__select"
            options={PLAN_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
          />
          <Select
            placeholder="Statut"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            className="sm-toolbar__select"
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'inactive', label: 'Inactif' },
            ]}
          />
          <Select
            placeholder="Catégorie"
            value={categoryFilter}
            onChange={setCategoryFilter}
            allowClear
            className="sm-toolbar__select"
            options={CATEGORY_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
          />
          {hasActiveFilters && (
            <Button
              type="link"
              size="small"
              onClick={() => { setPlanFilter(null); setStatusFilter(null); setCategoryFilter(null); }}
            >
              Effacer
            </Button>
          )}
        </div>
        <Segmented
          value={viewMode}
          onChange={handleViewChange}
          options={[
            { value: 'grid', icon: <AppstoreOutlined /> },
            { value: 'list', icon: <UnorderedListOutlined /> },
          ]}
          className="sm-toolbar__toggle"
        />
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="sm-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => <LoadingSkeleton key={i} variant="card" />)}
        </div>
      ) : schools.length === 0 ? (
        <EmptyState
          title="Aucune ecole trouvee"
          description={hasActiveFilters ? 'Essayez de modifier les filtres' : 'Creez votre premiere ecole'}
          action={
            !hasActiveFilters && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
                Nouvelle Ecole
              </Button>
            )
          }
        />
      ) : viewMode === 'list' ? (
        /* ── LIST view ── */
        <DataCard noPadding>
          <Table<SchoolRecord>
            columns={listColumns}
            dataSource={schools}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 15, showSizeChanger: false, showTotal: (t) => `${t} ecole${t > 1 ? 's' : ''}` }}
            className="sm-dark-table"
          />
        </DataCard>
      ) : (
        /* ── GRID view ── */
        <div className="sm-grid">
          {schools.map((school) => {
            const logoSrc = normalizeLogoUrl(school.logo_url);
            const hasError = logoErrors.has(school.id);
            return (
            <div key={school.id} className="sm-card">
              {/* Card header */}
              <div className="sm-card__header">
                <div className="sm-card__avatar">
                  {logoSrc && !hasError
                    ? <img src={logoSrc} alt="" className="sm-card__logo-img" onError={() => markLogoError(school.id)} />
                    : school.name.substring(0, 2).toUpperCase()
                  }
                </div>
                <div className="sm-card__identity">
                  <h3 className="sm-card__name">{school.name}</h3>
                  <span className="sm-card__subdomain">{school.subdomain}.ilmi.dz</span>
                </div>
                <StatusBadge
                  status={school.is_active ? 'active' : 'inactive'}
                  label={school.is_active ? 'Actif' : 'Inactif'}
                />
              </div>

              {/* Tags */}
              <div className="sm-card__tags">
                <Tag color={PLAN_TAG_COLORS[school.subscription_plan] || 'default'} style={{ borderRadius: 16, fontWeight: 600 }}>
                  {PLAN_LABELS[school.subscription_plan] || school.subscription_plan}
                </Tag>
                <Tag color={school.school_category === 'TRAINING_CENTER' ? 'orange' : 'cyan'} style={{ borderRadius: 16 }}>
                  {categoryLabel(school.school_category)}
                </Tag>
                {!school.setup_completed && (
                  <Tag color="warning" style={{ borderRadius: 16 }}>Config. en attente</Tag>
                )}
              </div>

              {/* Section badges */}
              {sectionBadges(school).length > 0 && (
                <div className="sm-card__sections">
                  {sectionBadges(school).map((b) => (
                    <span key={b} className="sm-card__section-badge">{b}</span>
                  ))}
                </div>
              )}

              {/* Details */}
              <div className="sm-card__details">
                {school.wilaya && (
                  <div className="sm-card__detail"><EnvironmentOutlined /> {school.wilaya}</div>
                )}
                {school.phone && (
                  <div className="sm-card__detail"><PhoneOutlined /> {school.phone}</div>
                )}
                {school.email && (
                  <div className="sm-card__detail"><MailOutlined /> {school.email}</div>
                )}
                <div className="sm-card__detail"><TeamOutlined /> {school.max_students} eleves max</div>
              </div>

              {/* Actions */}
              <div className="sm-card__actions">
                <Tooltip title="Modifier">
                  <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(school)} />
                </Tooltip>
                <Tooltip title="Ajouter admin">
                  <Button type="text" icon={<UserAddOutlined />} onClick={() => openAddAdmin(school.id)} />
                </Tooltip>
                <Popconfirm
                  title="Supprimer cette ecole ?"
                  description="Cette action est irreversible."
                  onConfirm={() => deleteSchool.mutate(school.id)}
                  okText="Oui" cancelText="Non"
                >
                  <Tooltip title="Supprimer">
                    <Button type="text" danger icon={<DeleteOutlined />} />
                  </Tooltip>
                </Popconfirm>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
           CREATE SCHOOL MODAL — Multi-step premium wizard
         ════════════════════════════════════════════════════════════════ */}
      <Modal
        title={null}
        open={isCreateOpen}
        onCancel={closeCreateModal}
        footer={null}
        width={720}
        destroyOnClose
        className="sm-modal"
        centered
      >
        {createStep === 4 && createdCreds ? (
          <div className="sm-modal__success">
            <Result
              status="success"
              icon={<CheckCircleOutlined style={{ color: 'var(--accent)' }} />}
              title="Ecole creee avec succes !"
              subTitle="Voici les identifiants de l'administrateur initial"
            />
            <div className="sm-creds">
              <div className="sm-creds__row">
                <span className="sm-creds__label">Nom</span>
                <span className="sm-creds__value">{createdCreds.first_name} {createdCreds.last_name}</span>
              </div>
              <div className="sm-creds__row">
                <span className="sm-creds__label">Telephone</span>
                <span className="sm-creds__value">{createdCreds.phone_number}</span>
                <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(createdCreds.phone_number)} />
              </div>
              <div className="sm-creds__row">
                <span className="sm-creds__label">Mot de passe</span>
                <span className="sm-creds__value sm-creds__value--mono">
                  {showPassword ? createdCreds.password : '••••••••••'}
                </span>
                <Button size="small" type="text" icon={showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setShowPassword(!showPassword)} />
                <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(createdCreds.password)} />
              </div>
            </div>
            <Alert type="warning" showIcon message="Conservez ces identifiants ! Le mot de passe ne sera plus visible apres fermeture." style={{ marginTop: 16 }} />
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button type="primary" size="large" onClick={closeCreateModal}>Fermer</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="sm-modal__header">
              <div className="sm-modal__icon"><BankOutlined /></div>
              <div>
                <h3 className="sm-modal__title">Creer une nouvelle ecole</h3>
                <p className="sm-modal__subtitle">Remplissez les informations pour inscrire un nouvel etablissement</p>
              </div>
            </div>

            <Steps current={createStep} size="small" className="sm-modal__steps" items={CREATE_STEPS} />

            <Form
              form={createForm}
              layout="vertical"
              initialValues={{
                school_category: 'PRIVATE_SCHOOL',
                subscription_plan: 'STARTER',
                max_students: 500,
                has_primary: false, has_middle: false, has_high: false,
              }}
            >
              {/* ── Step 0: Identity ── */}
              {createStep === 0 && (
                <div className="sm-step">
                  <div className="sm-step__section-title">
                    <SafetyCertificateOutlined /> Informations de l'etablissement
                  </div>
                  <div className="sm-logo-area">
                    <Upload
                      listType="picture-card"
                      fileList={logoFile}
                      beforeUpload={handleLogoUpload}
                      onRemove={removeLogo}
                      accept=".png"
                      maxCount={1}
                      className="sm-logo-upload"
                    >
                      {logoFile.length === 0 && (
                        <div className="sm-logo-upload__placeholder">
                          <CloudUploadOutlined style={{ fontSize: 28, color: 'var(--accent)' }} />
                          <div style={{ marginTop: 4, fontSize: 12 }}>Logo (PNG, 2Mo)</div>
                        </div>
                      )}
                    </Upload>
                    {logoPreview && (
                      <span className="sm-logo-upload__ok"><CheckCircleOutlined /> Logo charge</span>
                    )}
                  </div>
                  <Row gutter={16}>
                    <Col span={16}>
                      <Form.Item name="name" label="Nom de l'etablissement" rules={[{ required: true, message: 'Le nom est requis' }]}>
                        <Input placeholder="Ex: Ecole Ibn Khaldoun" size="large" onChange={handleNameChange} />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="subdomain" label="Sous-domaine" rules={[{ required: true, message: 'Requis' }, { pattern: /^[a-z0-9-]+$/, message: 'Minuscules, chiffres, tirets' }]}>
                        <Input placeholder="ibn-khaldoun" suffix=".ilmi.dz" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="wilaya" label="Wilaya" rules={[{ required: true, message: 'Selectionner une wilaya' }]}>
                        <Select placeholder="Choisir la wilaya" options={WILAYA_OPTIONS} showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="phone" label="Telephone">
                        <Input placeholder="05XXXXXXXX" prefix={<PhoneOutlined />} size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="address" label="Adresse">
                    <TextArea rows={2} placeholder="Adresse complete de l'etablissement" />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="email" label="Email">
                        <Input placeholder="contact@ecole.dz" prefix={<MailOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="website" label="Site web">
                        <Input placeholder="www.ecole.dz" prefix={<GlobalOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="motto" label="Devise / Slogan">
                    <Input placeholder="Ex: L'excellence au service de l'education" />
                  </Form.Item>
                </div>
              )}

              {/* ── Step 1: Category ── */}
              {createStep === 1 && (
                <div className="sm-step">
                  <div className="sm-step__section-title"><BookOutlined /> Type d'etablissement</div>
                  <Form.Item name="school_category" label="Categorie">
                    <Radio.Group className="sm-category-radios">
                      {CATEGORY_OPTIONS.map((opt) => (
                        <Radio.Button key={opt.value} value={opt.value} className="sm-category-btn">
                          <span className="sm-category-btn__icon">{opt.icon}</span>
                          <span>{opt.label}</span>
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                  {watchCategory === 'PRIVATE_SCHOOL' && (
                    <>
                      <Divider titlePlacement="left" plain>Cycles d'enseignement</Divider>
                      <Alert type="info" showIcon message="Selectionnez les cycles proposes. Les sections seront creees automatiquement." style={{ marginBottom: 16 }} />
                      <div className="sm-section-checks">
                        {SECTION_OPTIONS.map((sec) => (
                          <Form.Item key={sec.key} name={sec.key} valuePropName="checked" className="sm-section-checks__item">
                            <Checkbox className="sm-section-check">
                              <span className="sm-section-check__icon">{sec.icon}</span>
                              <span>{sec.label}</span>
                            </Checkbox>
                          </Form.Item>
                        ))}
                      </div>
                      {watchHasHigh && (
                        <>
                          <Divider titlePlacement="left" plain>Filières du Lycée</Divider>
                          <Alert
                            type="info"
                            showIcon
                            message="Sélectionnez les filières proposées par cet établissement. Les élèves seront orientés vers ces filières en 2ème et 3ème AS."
                            style={{ marginBottom: 16 }}
                          />
                          <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 13, color: '#666' }}>Troncs Communs (1ère AS)</div>
                          <Form.Item name="available_streams" initialValue={[]}>
                            <Checkbox.Group style={{ width: '100%' }}>
                              <Row gutter={[8, 8]}>
                                <Col span={12}>
                                  <Checkbox value="TC_SCI" style={{ fontWeight: 500 }}>
                                    <Tag color="#3b82f6">TC Sciences</Tag> Sciences et Technologies
                                  </Checkbox>
                                </Col>
                                <Col span={12}>
                                  <Checkbox value="TC_LET" style={{ fontWeight: 500 }}>
                                    <Tag color="#a855f7">TC Lettres</Tag> Lettres
                                  </Checkbox>
                                </Col>
                              </Row>
                              <div style={{ marginTop: 12, marginBottom: 8, fontWeight: 600, fontSize: 13, color: '#666' }}>Filières (2ème & 3ème AS)</div>
                              <Row gutter={[8, 8]}>
                                <Col span={8}>
                                  <Checkbox value="SE">
                                    <Tag color="#10b981">Sc. Exp.</Tag> Sciences Expérimentales
                                  </Checkbox>
                                </Col>
                                <Col span={8}>
                                  <Checkbox value="MATH">
                                    <Tag color="#3b82f6">Maths</Tag> Mathématiques
                                  </Checkbox>
                                </Col>
                                <Col span={8}>
                                  <Checkbox value="TM">
                                    <Tag color="#06b6d4">Tech Math</Tag> Technique Mathématiques
                                  </Checkbox>
                                </Col>
                                <Col span={8}>
                                  <Checkbox value="LPH">
                                    <Tag color="#a855f7">Lettres/Philo</Tag> Lettres et Philosophie
                                  </Checkbox>
                                </Col>
                                <Col span={8}>
                                  <Checkbox value="LE">
                                    <Tag color="#ec4899">Langues</Tag> Langues Étrangères
                                  </Checkbox>
                                </Col>
                                <Col span={8}>
                                  <Checkbox value="GE">
                                    <Tag color="#f59e0b">Gestion</Tag> Gestion et Économie
                                  </Checkbox>
                                </Col>
                              </Row>
                            </Checkbox.Group>
                          </Form.Item>
                        </>
                      )}
                    </>
                  )}
                  {watchCategory === 'TRAINING_CENTER' && (
                    <>
                      <Divider titlePlacement="left" plain>Type de formation</Divider>
                      <Form.Item name="training_type" label="Specialite principale" rules={[{ required: true, message: 'Requis' }]}>
                        <Select placeholder="Choisir le type de formation" options={TRAINING_TYPES} size="large" />
                      </Form.Item>
                    </>
                  )}
                </div>
              )}

              {/* ── Step 2: Subscription ── */}
              {createStep === 2 && (
                <div className="sm-step">
                  <div className="sm-step__section-title"><CrownOutlined /> Abonnement & Capacite</div>
                  <Form.Item name="subscription_plan" label="Plan d'abonnement" rules={[{ required: true }]}>
                    <Radio.Group className="sm-plan-radios">
                      {PLAN_OPTIONS.map((plan) => (
                        <Radio.Button key={plan.value} value={plan.value} className="sm-plan-btn">
                          <div className="sm-plan-btn__content">
                            <CrownOutlined style={{ fontSize: 20 }} />
                            <strong>{plan.label}</strong>
                            <Text type="secondary" style={{ fontSize: 12 }}>{plan.desc}</Text>
                          </div>
                        </Radio.Button>
                      ))}
                    </Radio.Group>
                  </Form.Item>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item name="max_students" label="Capacite (eleves)">
                        <InputNumber min={10} max={10000} style={{ width: '100%' }} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="subscription_start" label="Debut">
                        <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="subscription_end" label="Fin">
                        <DatePicker style={{ width: '100%' }} size="large" format="DD/MM/YYYY" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="notes" label="Notes internes">
                    <TextArea rows={2} placeholder="Notes visibles uniquement par les super admins" />
                  </Form.Item>
                </div>
              )}

              {/* ── Step 3: Admin ── */}
              {createStep === 3 && (
                <div className="sm-step">
                  <div className="sm-step__section-title"><TeamOutlined /> Administrateur initial</div>
                  <Alert type="info" showIcon message="Creez le compte administrateur. Ces champs sont optionnels — vous pouvez ajouter l'admin plus tard." style={{ marginBottom: 20 }} />
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="admin_first_name" label="Prenom">
                        <Input placeholder="Prenom" size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="admin_last_name" label="Nom">
                        <Input placeholder="Nom de famille" size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="admin_phone" label="Telephone (identifiant)">
                        <Input placeholder="05XXXXXXXX" prefix={<PhoneOutlined />} size="large" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="admin_email" label="Email">
                        <Input placeholder="admin@ecole.dz" prefix={<MailOutlined />} size="large" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item name="admin_password" label="Mot de passe">
                    <Input.Search
                      placeholder="Mot de passe initial"
                      enterButton={<Button icon={<LockOutlined />}>Generer</Button>}
                      onSearch={generatePassword}
                      size="large"
                    />
                  </Form.Item>
                </div>
              )}
            </Form>

            {/* ── Footer buttons ── */}
            <div className="sm-modal__footer">
              {createStep > 0 && <Button size="large" onClick={prevStep}>Precedent</Button>}
              <div style={{ flex: 1 }} />
              {createStep < 3 ? (
                <Button type="primary" size="large" onClick={nextStep}>Suivant</Button>
              ) : (
                <Button type="primary" size="large" loading={createSchool.isPending} onClick={handleCreate} icon={<CheckCircleOutlined />}>
                  Creer l'ecole
                </Button>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
           EDIT SCHOOL MODAL
         ════════════════════════════════════════════════════════════════ */}
      <Modal
        title={<span className="sm-modal__edit-title"><EditOutlined /> Modifier: {editingSchool?.name}</span>}
        open={isEditOpen}
        onCancel={() => { setIsEditOpen(false); setEditingSchool(null); editForm.resetFields(); }}
        footer={null}
        width={640}
        destroyOnClose
        className="sm-modal"
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="Nom" rules={[{ required: true }]}><Input size="large" /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="subdomain" label="Sous-domaine" rules={[{ required: true }]}><Input suffix=".ilmi.dz" size="large" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="wilaya" label="Wilaya">
                <Select options={WILAYA_OPTIONS} showSearch filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="Telephone"><Input prefix={<PhoneOutlined />} /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="Adresse"><TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="email" label="Email"><Input type="email" prefix={<MailOutlined />} /></Form.Item></Col>
            <Col span={12}><Form.Item name="website" label="Site web"><Input prefix={<GlobalOutlined />} /></Form.Item></Col>
          </Row>
          <Form.Item name="motto" label="Devise"><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="subscription_plan" label="Plan" rules={[{ required: true }]}>
                <Select options={PLAN_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="max_students" label="Capacite">
                <InputNumber min={10} max={10000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="is_active" label="Actif" valuePropName="checked">
                <Checkbox>Ecole active</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes internes"><TextArea rows={2} /></Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={updateSchool.isPending} block size="large">
              Enregistrer les modifications
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════
           ADD ADMIN MODAL
         ════════════════════════════════════════════════════════════════ */}
      <Modal
        title={<span className="sm-modal__edit-title"><UserAddOutlined /> Ajouter un Administrateur</span>}
        open={isAddAdminOpen}
        onCancel={() => { setIsAddAdminOpen(false); setSelectedSchoolId(null); addAdminForm.resetFields(); }}
        footer={null}
        width={520}
        destroyOnClose
        className="sm-modal"
      >
        {selectedSchoolId && schoolAdmins && schoolAdmins.results.length > 0 && (
          <div className="sm-admin-existing">
            <Text type="secondary" strong>Admins existants:</Text>
            <div className="sm-admin-existing__tags">
              {schoolAdmins.results.map((admin: Record<string, unknown>) => (
                <Tag key={admin.id as string} color="blue" style={{ borderRadius: 16 }}>
                  {admin.first_name as string} {admin.last_name as string}
                </Tag>
              ))}
            </div>
          </div>
        )}
        <Form form={addAdminForm} layout="vertical" onFinish={handleAddAdmin}>
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
            <Input placeholder="admin@ecole.dz" type="email" prefix={<MailOutlined />} size="large" />
          </Form.Item>
          <Form.Item name="password" label="Mot de passe" rules={[{ required: true, message: 'Requis' }, { min: 8, message: '8 caracteres minimum' }]}>
            <Input.Password placeholder="Minimum 8 caracteres" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createUser.isPending} block size="large">
              Ajouter comme Administrateur
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolManagement;
