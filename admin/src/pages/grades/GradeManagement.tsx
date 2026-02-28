import React, { useState } from 'react';
import { Table, Button, Tag, Select, Input, Modal, Form, InputNumber, Space, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useGrades, useCreateGrade, useUpdateGrade } from '../../hooks/useApi';

const GradeManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useGrades({ page, page_size: 20, search: search || undefined });
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editId) {
        await updateGrade.mutateAsync({ id: editId, data: values });
      } else {
        await createGrade.mutateAsync(values);
      }
      setModalOpen(false);
      form.resetFields();
      setEditId(null);
    } catch {
      // validation
    }
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditId(record.id as string);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const statusColors: Record<string, string> = {
    draft: 'default',
    submitted: 'blue',
    published: 'green',
  };

  const columns = [
    {
      title: 'Eleve',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (v: string, r: Record<string, unknown>) =>
        <span className="font-semibold">{v || (r.student as string) || '—'}</span>,
    },
    {
      title: 'Matiere',
      dataIndex: 'subject',
      key: 'subject',
      render: (v: string, r: Record<string, unknown>) =>
        <Tag color="blue">{v || (r.subject_name as string) || '—'}</Tag>,
    },
    {
      title: 'Trimestre',
      dataIndex: 'trimester',
      key: 'trimester',
      width: 100,
      render: (v: number) => v ? `T${v}` : '—',
    },
    {
      title: 'Note',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (v: number, r: Record<string, unknown>) => {
        const score = v ?? (r.average as number) ?? (r.grade as number);
        if (score == null) return '—';
        return <span className={score >= 10 ? 'score--pass' : 'score--fail'}>{score}/20</span>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={statusColors[v] || 'default'}>{v || '—'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Notes & Bulletins</h1>
          <p>{data?.count ?? 0} notes enregistrees</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditId(null); form.resetFields(); setModalOpen(true); }}
          >
            Ajouter une note
          </Button>
        </div>
      </div>

      <div className="filter-row">
        <Input
          prefix={<SearchOutlined className="search-icon" />}
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          className="search-input"
        />
      </div>

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
          }}
          locale={{ emptyText: 'Aucune note trouvee' }}
        />
      </div>

      <Modal
        title={editId ? 'Modifier la note' : 'Ajouter une note'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditId(null); }}
        confirmLoading={createGrade.isPending || updateGrade.isPending}
        okText={editId ? 'Enregistrer' : 'Ajouter'}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Eleve" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="ID de l'eleve" />
          </Form.Item>
          <Form.Item label="Matiere" name="subject" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="ID de la matiere" />
          </Form.Item>
          <Form.Item label="Trimestre" name="trimester">
            <Select placeholder="Trimestre">
              <Select.Option value={1}>Trimestre 1</Select.Option>
              <Select.Option value={2}>Trimestre 2</Select.Option>
              <Select.Option value={3}>Trimestre 3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Note" name="score" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} max={20} step={0.5} style={{ width: '100%' }} placeholder="Note sur 20" />
          </Form.Item>
          <Form.Item label="Statut" name="status">
            <Select placeholder="Statut">
              <Select.Option value="draft">Brouillon</Select.Option>
              <Select.Option value="submitted">Soumis</Select.Option>
              <Select.Option value="published">Publie</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GradeManagement;
