import React, { useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, Select, Popconfirm, Space, message } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  NotificationOutlined,
} from '@ant-design/icons';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement } from '../../hooks/useApi';

const AnnouncementsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useAnnouncements({ page, page_size: 20 });
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createAnnouncement.mutateAsync(values);
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation
    }
  };

  const handleDelete = async (id: string) => {
    await deleteAnnouncement.mutateAsync(id);
  };

  const columns = [
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      render: (v: string) => <span className="font-semibold">{v || '—'}</span>,
    },
    {
      title: 'Audience',
      dataIndex: 'audience',
      key: 'audience',
      render: (v: string, r: Record<string, unknown>) => (
        <Tag color="blue">{v || (r.target as string) || 'Tous'}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string, r: Record<string, unknown>) => (v || (r.date as string) || '—')?.toString().slice(0, 10),
    },
    {
      title: 'Urgent',
      dataIndex: 'urgent',
      key: 'urgent',
      render: (v: boolean) => v ? <Tag color="red">Urgent</Tag> : <Tag>Normal</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space size={4}>
          <Button type="text" icon={<EditOutlined />} size="small" title="Modifier" />
          <Popconfirm title="Supprimer cette annonce ?" onConfirm={() => handleDelete(r.id as string)}>
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
          <h1>Annonces</h1>
          <p>{data?.count ?? 0} annonces publiees</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { form.resetFields(); setModalOpen(true); }}
          >
            Nouvelle annonce
          </Button>
        </div>
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
          locale={{ emptyText: 'Aucune annonce' }}
        />
      </div>

      <Modal
        title="Nouvelle annonce"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createAnnouncement.isPending}
        okText="Publier"
        cancelText="Annuler"
        width={560}
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Titre" name="title" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Titre de l'annonce" />
          </Form.Item>
          <Form.Item label="Contenu" name="content" rules={[{ required: true, message: 'Requis' }]}>
            <Input.TextArea rows={4} placeholder="Contenu de l'annonce..." />
          </Form.Item>
          <Form.Item label="Audience" name="audience" initialValue="all">
            <Select>
              <Select.Option value="all">Tous</Select.Option>
              <Select.Option value="parents">Parents</Select.Option>
              <Select.Option value="students">Eleves</Select.Option>
              <Select.Option value="teachers">Enseignants</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Urgence" name="urgent" initialValue={false}>
            <Select>
              <Select.Option value={false}>Normal</Select.Option>
              <Select.Option value={true}>Urgent</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AnnouncementsPage;
