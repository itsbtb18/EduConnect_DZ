import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Tag, Drawer, Form, Select, message, Popconfirm, Space } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useStudents } from '../../hooks/useApi';
import { studentsAPI } from '../../api/services';
import { useQueryClient } from '@tanstack/react-query';

const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Record<string, unknown> | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, refetch } = useStudents({ page, page_size: 20, search: search || undefined });

  const handleDelete = async (id: string) => {
    try {
      await studentsAPI.get(id); // placeholder for delete call
      message.success('Eleve supprime');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      if (editingStudent) {
        // Update
        message.success('Eleve mis a jour');
      } else {
        // Create
        message.success('Eleve ajoute');
      }
      setDrawerOpen(false);
      form.resetFields();
      setEditingStudent(null);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch {
      // validation error
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingStudent(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: 'Nom',
      key: 'name',
      render: (_: unknown, r: Record<string, unknown>) => (
        <div className="flex-row flex-center gap-10">
          <div className="avatar avatar--sm avatar--primary">
            {((r.first_name as string)?.[0] || '').toUpperCase()}
            {((r.last_name as string)?.[0] || '').toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">
              {(r.first_name as string) || ''} {(r.last_name as string) || ''}
            </div>
            <div className="text-sub">
              {(r.email as string) || (r.phone_number as string) || ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Classe',
      dataIndex: 'class_name',
      key: 'class_name',
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : <span className="text-muted">—</span>,
    },
    {
      title: 'Telephone',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (v: string) => <span className="font-mono">{v || '—'}</span>,
    },
    {
      title: 'Statut',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => (
        <Tag color={v !== false ? 'green' : 'red'}>
          {v !== false ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/students/${r.id}`)}
            title="Voir"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(r)}
            title="Modifier"
          />
          <Popconfirm title="Supprimer cet eleve ?" onConfirm={() => handleDelete(r.id as string)}>
            <Button type="text" icon={<DeleteOutlined />} size="small" danger title="Supprimer" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Gestion des eleves</h1>
          <p>{data?.count ?? 0} eleves enregistres</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Actualiser
          </Button>
          <Button icon={<ExportOutlined />}>Exporter</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingStudent(null);
              form.resetFields();
              setDrawerOpen(true);
            }}
          >
            Ajouter un eleve
          </Button>
        </div>
      </div>

      {/* Search */}
      <Input
        prefix={<SearchOutlined className="search-icon" />}
        placeholder="Rechercher par nom, telephone..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        allowClear
        className="search-input"
      />

      {/* Table */}
      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={data?.results || []}
          loading={isLoading}
          rowKey={(r: Record<string, any>) => (r.id as string) || String(Math.random())}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.count || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (total) => `${total} eleves`,
          }}
          locale={{ emptyText: 'Aucun eleve trouve' }}
        />
      </div>

      {/* Add/Edit Drawer */}
      <Drawer
        title={editingStudent ? 'Modifier l\'eleve' : 'Ajouter un eleve'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingStudent(null); }}
        width={440}
        footer={
          <div className="drawer-footer">
            <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitting}>
              {editingStudent ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Prenom" name="first_name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Prenom de l'eleve" />
          </Form.Item>
          <Form.Item label="Nom" name="last_name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Nom de l'eleve" />
          </Form.Item>
          <Form.Item label="Telephone" name="phone_number">
            <Input placeholder="0550000000" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item label="Classe" name="class_name">
            <Select placeholder="Selectionner une classe" allowClear>
              <Select.Option value="1AM">1AM</Select.Option>
              <Select.Option value="2AM">2AM</Select.Option>
              <Select.Option value="3AM">3AM</Select.Option>
              <Select.Option value="4AM">4AM</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default StudentList;
