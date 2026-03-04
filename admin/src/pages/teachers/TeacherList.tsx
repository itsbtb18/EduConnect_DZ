import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Tag, Drawer, Form, Select, Space, Popconfirm, message, Card, Descriptions, Tooltip, Progress } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExportOutlined,
  FilePdfOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher, useSubjects } from '../../hooks/useApi';
import { exportToCSV, exportToPDF } from '../../hooks/useExport';
import { useQueryClient } from '@tanstack/react-query';

const TeacherList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Record<string, unknown> | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, unknown> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useTeachers({ page, page_size: 20, search: search || undefined });
  const createTeacher = useCreateTeacher();
  const updateTeacher = useUpdateTeacher();
  const deleteTeacher = useDeleteTeacher();
  const { data: subjectsData } = useSubjects();
  const subjects = (subjectsData?.results || subjectsData || []) as { id: string; name: string }[];

  const handleExport = () => {
    const cols = [
      { key: 'first_name', title: 'Prénom' },
      { key: 'last_name', title: 'Nom' },
      { key: 'phone_number', title: 'Téléphone' },
      { key: 'email', title: 'Email' },
      { key: 'subject', title: 'Matière' },
      { key: 'last_login', title: 'Dernière connexion' },
    ];
    exportToCSV(data?.results || [], cols, 'enseignants');
  };

  const handleExportPDF = () => {
    const cols = [
      { key: 'first_name', title: 'Prénom' },
      { key: 'last_name', title: 'Nom' },
      { key: 'phone_number', title: 'Téléphone' },
      { key: 'subject', title: 'Matière' },
      { key: 'last_login', title: 'Dernière connexion' },
    ];
    exportToPDF(data?.results || [], cols, 'enseignants', 'Liste des enseignants — ILMI');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingTeacher) {
        await updateTeacher.mutateAsync({ id: editingTeacher.id as string, data: values });
      } else {
        await createTeacher.mutateAsync({ ...values, role: 'TEACHER' });
      }
      setDrawerOpen(false);
      form.resetFields();
      setEditingTeacher(null);
    } catch {
      // validation or API errors handled by hooks
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTeacher.mutateAsync(id);
    } catch {
      // error handled by hook
    }
  };

  const columns = [
    {
      title: 'Enseignant',
      key: 'name',
      render: (_: unknown, r: Record<string, unknown>) => (
        <div className="flex-row flex-center gap-10">
          <div className="avatar avatar--sm avatar--green">
            {((r.first_name as string)?.[0] || '').toUpperCase()}
            {((r.last_name as string)?.[0] || '').toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">
              {(r.first_name as string) || ''} {(r.last_name as string) || ''}
            </div>
            <div className="text-sub">
              {(r.email as string) || ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Telephone',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (v: string) => <span className="font-mono">{v || '—'}</span>,
    },
    {
      title: 'Matiere',
      dataIndex: 'subject',
      key: 'subject',
      render: (v: string) => v ? <Tag color="green">{v}</Tag> : <span className="text-muted">—</span>,
    },
    {
      title: 'Classes',
      dataIndex: 'classes_assigned',
      key: 'classes_assigned',
      render: (v: string[] | string) => {
        if (!v) return <span className="text-muted">—</span>;
        const items = Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((s) => s.trim()) : [];
        return items.length > 0 ? (
          <Space size={2} wrap>
            {items.slice(0, 3).map((c) => <Tag key={c} color="blue">{c}</Tag>)}
            {items.length > 3 && <Tag>+{items.length - 3}</Tag>}
          </Space>
        ) : <span className="text-muted">—</span>;
      },
      responsive: ['lg'] as ('lg')[],
    },
    {
      title: 'Statut',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => (
        <Tag color={v !== false ? 'green' : 'default'}>
          {v !== false ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Dernière connexion',
      dataIndex: 'last_login',
      key: 'last_login',
      render: (v: string) => {
        if (!v) return <span className="text-muted">Jamais</span>;
        const loginDate = new Date(v);
        const daysSince = Math.floor((Date.now() - loginDate.getTime()) / 86400000);
        const formatted = loginDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
        if (daysSince <= 1) return <Tooltip title="Actif récemment"><Tag color="green" icon={<CheckCircleOutlined />}>{formatted}</Tag></Tooltip>;
        if (daysSince <= 3) return <Tooltip title={`Dernière connexion il y a ${daysSince} jours`}><Tag color="orange" icon={<ClockCircleOutlined />}>{formatted}</Tag></Tooltip>;
        return <Tooltip title={`Inactif depuis ${daysSince} jours — suivi recommandé`}><Tag color="red" icon={<WarningOutlined />}>{formatted}</Tag></Tooltip>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 170,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<UserOutlined />}
            size="small"
            onClick={() => navigate(`/teachers/${r.id}/profile`)}
            title="Profil complet"
          />
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => { setSelectedTeacher(r); setDetailOpen(true); }}
            title="Voir"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => {
              setEditingTeacher(r);
              form.setFieldsValue(r);
              setDrawerOpen(true);
            }}
            title="Modifier"
          />
          <Popconfirm title="Supprimer ?" onConfirm={() => handleDelete(r.id as string)}>
            <Button type="text" icon={<DeleteOutlined />} size="small" danger title="Supprimer" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const t = selectedTeacher || {};

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Gestion des enseignants</h1>
          <p>{data?.count ?? 0} enseignants</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>CSV</Button>
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>PDF</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingTeacher(null); form.resetFields(); setDrawerOpen(true); }}
          >
            Ajouter un enseignant
          </Button>
        </div>
      </div>

      <Input
        prefix={<SearchOutlined className="search-icon" />}
        placeholder="Rechercher par nom..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        allowClear
        className="search-input"
      />

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={data?.results || []}
          loading={isLoading}
          rowKey={(r: Record<string, any>) => (r.id as string) || `tch-${r.first_name}-${r.last_name}`}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.count || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (total) => `${total} enseignants`,
          }}
          locale={{ emptyText: 'Aucun enseignant trouve' }}
        />
      </div>

      {/* Add/Edit Drawer */}
      <Drawer
        title={editingTeacher ? "Modifier l'enseignant" : 'Ajouter un enseignant'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingTeacher(null); }}
        width={440}
        footer={
          <div className="drawer-footer">
            <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button type="primary" onClick={handleSubmit} loading={createTeacher.isPending || updateTeacher.isPending}>
              {editingTeacher ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Prenom" name="first_name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Prenom" />
          </Form.Item>
          <Form.Item label="Nom" name="last_name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Nom" />
          </Form.Item>
          <Form.Item label="Telephone" name="phone_number" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="0550000000" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item label="Matière" name="subject">
            <Select
              placeholder="Sélectionner"
              showSearch
              optionFilterProp="label"
              allowClear
              options={subjects.length > 0
                ? subjects.map((s) => ({ value: s.name, label: s.name }))
                : [
                    { value: 'Mathématiques', label: 'Mathématiques' },
                    { value: 'Physique', label: 'Physique' },
                    { value: 'Français', label: 'Français' },
                    { value: 'Arabe', label: 'Arabe' },
                    { value: 'Anglais', label: 'Anglais' },
                    { value: 'Sciences', label: 'Sciences' },
                    { value: 'Histoire-Géo', label: 'Histoire-Géo' },
                  ]
              }
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer
        title="Détail enseignant"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={480}
      >
        {selectedTeacher && (
          <div className="flex-col gap-16">
            <div className="flex-row flex-center gap-14">
              <div className="avatar avatar--lg avatar--green">
                {((t.first_name as string)?.[0] || '').toUpperCase()}
                {((t.last_name as string)?.[0] || '').toUpperCase()}
              </div>
              <div>
                <div className="detail-name detail-name--lg">
                  {(t.first_name as string) || ''} {(t.last_name as string) || ''}
                </div>
                <div className="text-sub">
                  {(t.subject as string) || 'Enseignant'}
                </div>
                <Tag color={(t.is_active as boolean) !== false ? 'green' : 'default'} className="mt-4">
                  {(t.is_active as boolean) !== false ? 'Actif' : 'Inactif'}
                </Tag>
              </div>
            </div>

            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Téléphone">
                <span className="font-mono">{(t.phone_number as string) || '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {(t.email as string) || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Matière">
                {(t.subject as string) ? <Tag color="green">{t.subject as string}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Classes assignées">
                {(() => {
                  const classes = t.classes_assigned;
                  if (!classes) return '—';
                  const items = Array.isArray(classes) ? classes : typeof classes === 'string' ? (classes as string).split(',').map((s: string) => s.trim()) : [];
                  return items.length > 0 ? (
                    <Space size={2} wrap>
                      {items.map((c: string) => <Tag key={c} color="blue">{c}</Tag>)}
                    </Space>
                  ) : '—';
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Dernière connexion">
                {(() => {
                  const v = t.last_login as string;
                  if (!v) return <Tag color="default">Jamais connecté</Tag>;
                  const daysSince = Math.floor((Date.now() - new Date(v).getTime()) / 86400000);
                  return (
                    <Space>
                      <span>{new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {daysSince > 3 && <Tag color="red" icon={<WarningOutlined />}>Inactif {daysSince}j</Tag>}
                    </Space>
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Date d'inscription">
                {(t.created_at as string)
                  ? new Date(t.created_at as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TeacherList;
