import React, { useState } from 'react';
import { Table, Button, Input, Tag, Drawer, Form, Select, Space, Popconfirm, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTeachers } from '../../hooks/useApi';
import { useQueryClient } from '@tanstack/react-query';

const TeacherList: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Record<string, unknown> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, refetch } = useTeachers({ page, page_size: 20, search: search || undefined });

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setSubmitting(true);
      message.success('Enseignant enregistre');
      setDrawerOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    } catch {
      // validation
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Enseignant',
      key: 'name',
      render: (_: unknown, r: Record<string, unknown>) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {((r.first_name as string)?.[0] || '').toUpperCase()}
            {((r.last_name as string)?.[0] || '').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
              {(r.first_name as string) || ''} {(r.last_name as string) || ''}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
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
      render: (v: string) => v ? <Tag color="green">{v}</Tag> : <span style={{ color: 'var(--gray-400)' }}>—</span>,
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
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space size={4}>
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
              form.setFieldsValue(r);
              setDrawerOpen(true);
            }}
            title="Modifier"
          />
          <Popconfirm title="Supprimer ?" onConfirm={() => message.info('Suppression non disponible')}>
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { form.resetFields(); setDrawerOpen(true); }}
          >
            Ajouter un enseignant
          </Button>
        </div>
      </div>

      <Input
        prefix={<SearchOutlined style={{ color: 'var(--gray-400)' }} />}
        placeholder="Rechercher par nom..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        allowClear
        style={{ maxWidth: 400, height: 40 }}
      />

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
            showTotal: (total) => `${total} enseignants`,
          }}
          locale={{ emptyText: 'Aucun enseignant trouve' }}
        />
      </div>

      {/* Add/Edit Drawer */}
      <Drawer
        title="Enseignant"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={440}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button type="primary" onClick={handleSubmit} loading={submitting}>Enregistrer</Button>
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
          <Form.Item label="Matiere" name="subject">
            <Select placeholder="Selectionner">
              <Select.Option value="Mathematiques">Mathematiques</Select.Option>
              <Select.Option value="Physique">Physique</Select.Option>
              <Select.Option value="Francais">Francais</Select.Option>
              <Select.Option value="Arabe">Arabe</Select.Option>
              <Select.Option value="Anglais">Anglais</Select.Option>
              <Select.Option value="Sciences">Sciences</Select.Option>
              <Select.Option value="Histoire">Histoire</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Detail Drawer */}
      <Drawer
        title="Detail enseignant"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={440}
      >
        {selectedTeacher && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {((t.first_name as string)?.[0] || '').toUpperCase()}
                {((t.last_name as string)?.[0] || '').toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gray-900)' }}>
                  {(t.first_name as string) || ''} {(t.last_name as string) || ''}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                  {(t.subject as string) || 'Enseignant'}
                </div>
              </div>
            </div>
            <div style={{ background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', padding: 16 }}>
              <div style={{ display: 'grid', gap: 12 }}>
                <div><span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Telephone</span><br /><span className="font-mono">{(t.phone_number as string) || '—'}</span></div>
                <div><span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Email</span><br />{(t.email as string) || '—'}</div>
                <div><span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600 }}>Statut</span><br /><Tag color={(t.is_active as boolean) !== false ? 'green' : 'default'}>{(t.is_active as boolean) !== false ? 'Actif' : 'Inactif'}</Tag></div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default TeacherList;
