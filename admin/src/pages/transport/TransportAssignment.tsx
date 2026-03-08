import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, DatePicker, Switch, Tag, Space, message,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, SwapOutlined,
} from '@ant-design/icons';
import {
  useStudentTransports, useCreateStudentTransport, useUpdateStudentTransport,
  useDeleteStudentTransport, useTransportLines, useTransportStops,
} from '../../hooks/useApi';
import type { StudentTransport, TransportLineList, BusStop } from '../../types';
import dayjs from 'dayjs';

const TransportAssignment: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lineFilter, setLineFilter] = useState<string>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string>();
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useStudentTransports({
    page, q: search || undefined, line: lineFilter,
  });
  const { data: linesData } = useTransportLines({ active: true });
  const { data: stopsData } = useTransportStops(selectedLine ? { line: selectedLine } : undefined);
  const createMut = useCreateStudentTransport();
  const updateMut = useUpdateStudentTransport();
  const deleteMut = useDeleteStudentTransport();

  const results = (data?.results || []) as StudentTransport[];
  const total = (data as Record<string, unknown>)?.count as number ?? results.length;
  const lines = (linesData?.results || []) as TransportLineList[];
  const stops = ((stopsData as Record<string, unknown>)?.results || stopsData || []) as BusStop[];

  const openEdit = (record: StudentTransport) => {
    setEditId(record.id);
    setSelectedLine(record.line);
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
        message.success('Affectation mise à jour');
      } else {
        await createMut.mutateAsync(payload);
        message.success('Élève affecté à la ligne');
      }
      setModalOpen(false);
      form.resetFields();
      setEditId(null);
      setSelectedLine(undefined);
    } catch { /* validation */ }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Supprimer cette affectation ?', okText: 'Supprimer', cancelText: 'Annuler', okType: 'danger',
      onOk: async () => { await deleteMut.mutateAsync(id); message.success('Affectation supprimée'); },
    });
  };

  const columns = [
    { title: 'Élève', dataIndex: 'student_name', key: 'student' },
    { title: 'Ligne', dataIndex: 'line_name', key: 'line' },
    { title: 'Arrêt montée', dataIndex: 'pickup_stop_name', key: 'pickup' },
    { title: 'Arrêt descente', dataIndex: 'dropoff_stop_name', key: 'dropoff' },
    {
      title: 'Actif', dataIndex: 'is_active', key: 'active',
      render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag color="red">Non</Tag>,
    },
    {
      title: 'Période', key: 'dates',
      render: (_: unknown, r: StudentTransport) =>
        `${dayjs(r.start_date).format('DD/MM/YYYY')} — ${r.end_date ? dayjs(r.end_date).format('DD/MM/YYYY') : '∞'}`,
    },
    {
      title: '', key: 'actions', width: 100,
      render: (_: unknown, r: StudentTransport) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><SwapOutlined className="page-header__icon" /> Affectation transport</h1>
          <p>{total} élèves affectés</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setEditId(null); setSelectedLine(undefined); setModalOpen(true); }}>
            Affecter un élève
          </Button>
        </div>
      </div>

      <div className="filter-row" style={{ display: 'flex', gap: 12 }}>
        <Input prefix={<SearchOutlined />} placeholder="Rechercher un élève..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} allowClear style={{ maxWidth: 320 }} />
        <Select placeholder="Filtrer par ligne" value={lineFilter}
          onChange={(v) => { setLineFilter(v); setPage(1); }} allowClear style={{ width: 220 }}
          options={lines.map((l) => ({ value: l.id, label: l.name }))} />
      </div>

      <div className="card card--table">
        <Table columns={columns} dataSource={results} loading={isLoading} rowKey="id"
          pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p), showTotal: (t) => `${t} affectations` }}
          locale={{ emptyText: 'Aucune affectation' }}
        />
      </div>

      <Modal
        title={editId ? 'Modifier l\'affectation' : 'Affecter un élève'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditId(null); setSelectedLine(undefined); }}
        confirmLoading={createMut.isPending || updateMut.isPending}
        okText={editId ? 'Mettre à jour' : 'Affecter'} cancelText="Annuler" width={600}
      >
        <Form form={form} layout="vertical">
          {!editId && (
            <Form.Item label="ID Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
              <Input placeholder="UUID de l'élève" />
            </Form.Item>
          )}

          <Form.Item label="Ligne" name="line" rules={[{ required: true, message: 'Requis' }]}>
            <Select placeholder="Sélectionner une ligne"
              options={lines.map((l) => ({ value: l.id, label: `${l.name} (${l.enrolled_count}/${l.capacity})` }))}
              onChange={(v) => setSelectedLine(v as string)} />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Arrêt de montée" name="pickup_stop" style={{ flex: 1 }}>
              <Select placeholder="Sélectionner" allowClear
                options={stops.sort((a, b) => a.order - b.order).map((s) => ({
                  value: s.id, label: `${s.order}. ${s.name}`,
                }))} />
            </Form.Item>
            <Form.Item label="Arrêt de descente" name="dropoff_stop" style={{ flex: 1 }}>
              <Select placeholder="Sélectionner" allowClear
                options={stops.sort((a, b) => a.order - b.order).map((s) => ({
                  value: s.id, label: `${s.order}. ${s.name}`,
                }))} />
            </Form.Item>
          </div>

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

export default TransportAssignment;
