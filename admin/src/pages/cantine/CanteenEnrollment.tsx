import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, DatePicker, Switch, Tag, Space, Spin, message,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, SearchOutlined, TeamOutlined, EditOutlined, DeleteOutlined,
} from '@ant-design/icons';
import {
  useCanteenStudents, useCreateCanteenStudent, useUpdateCanteenStudent, useDeleteCanteenStudent,
} from '../../hooks/useApi';
import type { CanteenStudent, NutritionalStatus, DietaryRestriction } from '../../types';
import dayjs from 'dayjs';

const NUTRITIONAL_OPTIONS: { value: NutritionalStatus; label: string; color: string }[] = [
  { value: 'NORMAL', label: 'Normal', color: 'green' },
  { value: 'UNDERWEIGHT', label: 'Insuffisance pondérale', color: 'orange' },
  { value: 'OVERWEIGHT', label: 'Surpoids', color: 'gold' },
  { value: 'OBESE', label: 'Obésité', color: 'red' },
];

const DIET_OPTIONS: { value: DietaryRestriction; label: string; color: string }[] = [
  { value: 'NONE', label: 'Aucune', color: 'default' },
  { value: 'DIABETIC', label: 'Diabétique', color: 'red' },
  { value: 'CELIAC', label: 'Cœliaque', color: 'orange' },
  { value: 'LACTOSE', label: 'Intolérant lactose', color: 'gold' },
  { value: 'ALLERGY', label: 'Allergie alimentaire', color: 'magenta' },
  { value: 'VEGETARIAN', label: 'Végétarien', color: 'green' },
  { value: 'OTHER', label: 'Autre', color: 'blue' },
];

const CanteenEnrollment: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useCanteenStudents({
    page, page_size: 20, q: search || undefined, dietary_restriction: dietFilter,
  });
  const createMut = useCreateCanteenStudent();
  const updateMut = useUpdateCanteenStudent();
  const deleteMut = useDeleteCanteenStudent();

  const results = (data?.results || []) as CanteenStudent[];
  const total = (data as Record<string, unknown>)?.count as number ?? results.length;

  const openEdit = (record: CanteenStudent) => {
    setEditId(record.id);
    form.setFieldsValue({
      ...record,
      start_date: record.start_date ? dayjs(record.start_date) : null,
      end_date: record.end_date ? dayjs(record.end_date) : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD') || null,
      };
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...payload });
        message.success('Inscription mise à jour');
      } else {
        await createMut.mutateAsync(payload);
        message.success('Élève inscrit à la cantine');
      }
      setModalOpen(false);
      form.resetFields();
      setEditId(null);
    } catch { /* validation */ }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Supprimer l\'inscription ?',
      content: 'L\'élève sera désinscrit de la cantine.',
      okText: 'Supprimer', cancelText: 'Annuler', okType: 'danger',
      onOk: async () => {
        await deleteMut.mutateAsync(id);
        message.success('Inscription supprimée');
      },
    });
  };

  const columns = [
    { title: 'Élève', dataIndex: 'student_name', key: 'name' },
    {
      title: 'Statut nutritionnel', dataIndex: 'nutritional_status', key: 'nutritional',
      render: (v: NutritionalStatus) => {
        const opt = NUTRITIONAL_OPTIONS.find((o) => o.value === v);
        return <Tag color={opt?.color || 'default'}>{opt?.label || v}</Tag>;
      },
    },
    {
      title: 'Restriction', dataIndex: 'dietary_restriction', key: 'diet',
      render: (v: DietaryRestriction) => {
        const opt = DIET_OPTIONS.find((o) => o.value === v);
        return <Tag color={opt?.color || 'default'}>{opt?.label || v}</Tag>;
      },
    },
    { title: 'Détails allergies', dataIndex: 'allergy_details', key: 'allergy', ellipsis: true },
    {
      title: 'Actif', dataIndex: 'is_active', key: 'active',
      render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag color="red">Non</Tag>,
    },
    {
      title: 'Début', dataIndex: 'start_date', key: 'start',
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: '', key: 'actions', width: 100,
      render: (_: unknown, r: CanteenStudent) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><TeamOutlined className="page-header__icon" /> Inscriptions cantine</h1>
          <p>{total} élèves inscrits</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setEditId(null); setModalOpen(true); }}>
            Inscrire un élève
          </Button>
        </div>
      </div>

      <div className="filter-row" style={{ display: 'flex', gap: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Rechercher un élève..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear style={{ maxWidth: 320 }}
        />
        <Select
          placeholder="Restriction alimentaire"
          value={dietFilter}
          onChange={(v) => { setDietFilter(v); setPage(1); }}
          allowClear style={{ width: 220 }}
          options={DIET_OPTIONS}
        />
      </div>

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={results}
          loading={isLoading}
          rowKey="id"
          pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p), showTotal: (t) => `${t} inscrits` }}
          locale={{ emptyText: 'Aucun élève inscrit' }}
        />
      </div>

      <Modal
        title={editId ? 'Modifier l\'inscription' : 'Inscrire un élève'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditId(null); }}
        confirmLoading={createMut.isPending || updateMut.isPending}
        okText={editId ? 'Mettre à jour' : 'Inscrire'}
        cancelText="Annuler"
        width={650}
      >
        <Form form={form} layout="vertical">
          {!editId && (
            <Form.Item label="ID Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
              <Input placeholder="UUID de l'élève" />
            </Form.Item>
          )}

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Statut nutritionnel" name="nutritional_status" initialValue="NORMAL" style={{ flex: 1 }}>
              <Select options={NUTRITIONAL_OPTIONS} />
            </Form.Item>
            <Form.Item label="Restriction alimentaire" name="dietary_restriction" initialValue="NONE" style={{ flex: 1 }}>
              <Select options={DIET_OPTIONS} />
            </Form.Item>
          </div>

          <Form.Item label="Détails allergies" name="allergy_details">
            <Input.TextArea rows={2} placeholder="Préciser les allergies connues..." />
          </Form.Item>
          <Form.Item label="Note médicale" name="medical_note">
            <Input.TextArea rows={2} placeholder="Remarques médicales..." />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Date début" name="start_date" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Date fin" name="end_date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item label="Actif" name="is_active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CanteenEnrollment;
