import React, { useState } from 'react';
import { Table, Button, Tag, Input, Modal, Form, Select, InputNumber, Popconfirm, Tooltip, Space, Card } from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useClasses, useCreateClass, useUpdateClass, useDeleteClass, useTeachers } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';

const ClassManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, refetch } = useClasses({ page, page_size: 20, search: debouncedSearch || undefined });
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();
  const { data: teachersData } = useTeachers({ page_size: 200 });

  const teachers = (teachersData?.results || []) as { id: string; first_name: string; last_name: string; user?: { first_name: string; last_name: string } }[];
  const results = (data?.results || data || []) as Record<string, unknown>[];
  const total = (data as Record<string, unknown>)?.count as number ?? results.length;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editId) {
        await updateClass.mutateAsync({ id: editId, data: values });
      } else {
        await createClass.mutateAsync(values);
      }
      setModalOpen(false);
      form.resetFields();
      setEditId(null);
    } catch { /* validation */ }
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditId(record.id as string);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const columns = [
    {
      title: 'Nom de la classe',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span className="font-semibold">{v || '—'}</span>,
    },
    {
      title: 'Niveau',
      dataIndex: 'level',
      key: 'level',
      render: (v: string | number) => v ? <Tag color="blue">{v}</Tag> : '—',
    },
    {
      title: 'Section',
      dataIndex: 'section_name',
      key: 'section_name',
      render: (v: string, r: Record<string, unknown>) => v || (r.section as string) || '—',
    },
    {
      title: 'Capacité',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (v: number) => v ?? '—',
    },
    {
      title: 'Effectif',
      dataIndex: 'student_count',
      key: 'student_count',
      render: (v: number, r: Record<string, unknown>) => {
        const count = v ?? (r.students_count as number) ?? 0;
        const cap = (r.capacity as number) ?? 0;
        const color = cap && count >= cap ? 'red' : count > 0 ? 'green' : 'default';
        return <Tag color={color}>{count}{cap ? ` / ${cap}` : ''}</Tag>;
      },
    },
    {
      title: 'Enseignant principal',
      dataIndex: 'homeroom_teacher_name',
      key: 'homeroom_teacher',
      render: (v: string, r: Record<string, unknown>) => v || (r.homeroom_teacher as string) || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space>
          <Tooltip title="Modifier">
            <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Supprimer cette classe ?" onConfirm={() => deleteClass.mutate(r.id as string)} okText="Oui" cancelText="Non">
            <Tooltip title="Supprimer">
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><TeamOutlined className="page-header__icon" /> Gestion des classes</h1>
          <p>{total} classes</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditId(null); form.resetFields(); setModalOpen(true); }}
          >
            Nouvelle classe
          </Button>
        </div>
      </div>

      <div className="filter-row">
        <Input
          prefix={<SearchOutlined className="search-icon" />}
          placeholder="Rechercher une classe..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          className="search-input"
        />
      </div>

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={results}
          loading={isLoading}
          rowKey={(r: Record<string, unknown>) => (r.id as string) || `class-${r.name}`}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (t) => `${t} classes`,
          }}
          locale={{ emptyText: 'Aucune classe trouvée' }}
        />
      </div>

      <Modal
        title={editId ? 'Modifier la classe' : 'Nouvelle classe'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditId(null); }}
        confirmLoading={createClass.isPending || updateClass.isPending}
        okText={editId ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Nom" name="name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: 3ème A" />
          </Form.Item>
          <div className="form-row">
            <Form.Item label="Niveau" name="level" className="form-row__item">
              <Select placeholder="Niveau" allowClear options={[
                { value: '1', label: '1ère année' },
                { value: '2', label: '2ème année' },
                { value: '3', label: '3ème année' },
                { value: '4', label: '4ème année' },
                { value: '5', label: '5ème année' },
              ]} />
            </Form.Item>
            <Form.Item label="Capacité" name="capacity" className="form-row__item">
              <InputNumber min={1} max={60} className="w-full" placeholder="30" />
            </Form.Item>
          </div>
          <Form.Item label="Enseignant principal" name="homeroom_teacher">
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner un enseignant"
              allowClear
              options={teachers.map((t) => ({
                value: t.id,
                label: t.user
                  ? `${t.user.first_name} ${t.user.last_name}`
                  : `${t.first_name} ${t.last_name}`,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassManagement;
