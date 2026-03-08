import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, InputNumber, Switch, TimePicker,
  Tag, Space, Spin, message, Card, List, Divider, Row, Col,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, EnvironmentOutlined, CarOutlined,
} from '@ant-design/icons';
import {
  useTransportLines, useCreateTransportLine, useUpdateTransportLine, useDeleteTransportLine,
  useTransportLine, useTransportStops, useCreateTransportStop, useUpdateTransportStop, useDeleteTransportStop,
  useTransportDrivers,
} from '../../hooks/useApi';
import type { TransportLineList, TransportLine, BusStop, BusDriver } from '../../types';
import dayjs from 'dayjs';

const TransportLinesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [stopModalOpen, setStopModalOpen] = useState(false);
  const [editStopId, setEditStopId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [stopForm] = Form.useForm();

  const { data, isLoading, refetch } = useTransportLines({ page, q: search || undefined });
  const { data: driversData } = useTransportDrivers({ active: true });
  const createLine = useCreateTransportLine();
  const updateLine = useUpdateTransportLine();
  const deleteLine = useDeleteTransportLine();

  const { data: lineDetail } = useTransportLine(selectedLineId || '');
  const { data: stopsData, refetch: refetchStops } = useTransportStops(
    selectedLineId ? { line: selectedLineId } : undefined
  );
  const createStop = useCreateTransportStop();
  const updateStop = useUpdateTransportStop();
  const deleteStop = useDeleteTransportStop();

  const lines = (data?.results || []) as TransportLineList[];
  const total = (data as Record<string, unknown>)?.count as number ?? lines.length;
  const drivers = (driversData?.results || []) as BusDriver[];
  const line = lineDetail as TransportLine | undefined;
  const stops = ((stopsData as Record<string, unknown>)?.results || stopsData || []) as BusStop[];

  const openEdit = (record: TransportLineList) => {
    setEditId(record.id);
    // Fetch full detail for editing
    form.setFieldsValue({
      ...record,
      departure_time: record.departure_time ? dayjs(record.departure_time, 'HH:mm:ss') : null,
      return_time: record.return_time ? dayjs(record.return_time, 'HH:mm:ss') : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        departure_time: values.departure_time?.format('HH:mm:ss') || null,
        return_time: values.return_time?.format('HH:mm:ss') || null,
      };
      if (editId) {
        await updateLine.mutateAsync({ id: editId, ...payload });
        message.success('Ligne mise à jour');
      } else {
        await createLine.mutateAsync(payload);
        message.success('Ligne créée');
      }
      setModalOpen(false);
      form.resetFields();
      setEditId(null);
    } catch { /* validation */ }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Supprimer cette ligne ?', okText: 'Supprimer', cancelText: 'Annuler', okType: 'danger',
      onOk: async () => { await deleteLine.mutateAsync(id); message.success('Ligne supprimée'); },
    });
  };

  // Stops management
  const openStopForm = (stop?: BusStop) => {
    if (stop) {
      setEditStopId(stop.id);
      stopForm.setFieldsValue({
        ...stop,
        estimated_time: stop.estimated_time ? dayjs(stop.estimated_time, 'HH:mm:ss') : null,
      });
    } else {
      setEditStopId(null);
      stopForm.resetFields();
      stopForm.setFieldsValue({ line: selectedLineId, order: stops.length + 1 });
    }
    setStopModalOpen(true);
  };

  const handleStopSubmit = async () => {
    try {
      const values = await stopForm.validateFields();
      const payload = {
        ...values,
        line: selectedLineId,
        estimated_time: values.estimated_time?.format('HH:mm:ss') || null,
      };
      if (editStopId) {
        await updateStop.mutateAsync({ id: editStopId, ...payload });
        message.success('Arrêt mis à jour');
      } else {
        await createStop.mutateAsync(payload);
        message.success('Arrêt ajouté');
      }
      setStopModalOpen(false);
      stopForm.resetFields();
      setEditStopId(null);
      refetchStops();
    } catch { /* validation */ }
  };

  const handleDeleteStop = (id: string) => {
    Modal.confirm({
      title: 'Supprimer cet arrêt ?', okText: 'Supprimer', cancelText: 'Annuler', okType: 'danger',
      onOk: async () => { await deleteStop.mutateAsync(id); message.success('Arrêt supprimé'); refetchStops(); },
    });
  };

  const columns = [
    { title: 'Ligne', dataIndex: 'name', key: 'name' },
    { title: 'Quartier', dataIndex: 'neighborhood', key: 'neighborhood' },
    { title: 'Chauffeur', dataIndex: 'driver_name', key: 'driver' },
    { title: 'Véhicule', dataIndex: 'vehicle_plate', key: 'plate' },
    {
      title: 'Occupation', key: 'seats',
      render: (_: unknown, r: TransportLineList) => {
        const pct = r.capacity > 0 ? Math.round((r.enrolled_count / r.capacity) * 100) : 0;
        return <span>{r.enrolled_count}/{r.capacity} <Tag color={pct > 90 ? 'red' : pct > 70 ? 'orange' : 'green'}>{pct}%</Tag></span>;
      },
    },
    {
      title: 'Actif', dataIndex: 'is_active', key: 'active',
      render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag color="red">Non</Tag>,
    },
    {
      title: '', key: 'actions', width: 160,
      render: (_: unknown, r: TransportLineList) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => setSelectedLineId(r.id)}>Arrêts</Button>
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
          <h1><EnvironmentOutlined className="page-header__icon" /> Lignes de transport</h1>
          <p>{total} lignes configurées</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setEditId(null); setModalOpen(true); }}>
            Nouvelle ligne
          </Button>
        </div>
      </div>

      <div className="filter-row" style={{ display: 'flex', gap: 12 }}>
        <Input prefix={<SearchOutlined />} placeholder="Rechercher..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} allowClear style={{ maxWidth: 320 }} />
      </div>

      <div className="card card--table">
        <Table columns={columns} dataSource={lines} loading={isLoading} rowKey="id"
          pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p), showTotal: (t) => `${t} lignes` }}
          locale={{ emptyText: 'Aucune ligne' }}
        />
      </div>

      {/* Stops side panel */}
      <Modal
        title={<><EnvironmentOutlined /> Arrêts — {line?.name || 'Ligne'}</>}
        open={!!selectedLineId}
        onCancel={() => setSelectedLineId(null)}
        footer={null}
        width={700}
      >
        {line && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}><strong>Chauffeur:</strong> {line.driver_detail?.full_name || '—'}</Col>
              <Col span={8}><strong>Véhicule:</strong> {line.vehicle_plate} ({line.vehicle_color})</Col>
              <Col span={8}><strong>Départ:</strong> {line.departure_time || '—'}</Col>
            </Row>
          </Card>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4>{stops.length} arrêt(s)</h4>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openStopForm()}>Ajouter</Button>
        </div>

        <List
          dataSource={stops.sort((a, b) => a.order - b.order)}
          renderItem={(stop) => (
            <List.Item
              actions={[
                <Button key="edit" type="text" size="small" icon={<EditOutlined />} onClick={() => openStopForm(stop)} />,
                <Button key="del" type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteStop(stop.id)} />,
              ]}
            >
              <List.Item.Meta
                avatar={<Tag color="blue">{stop.order}</Tag>}
                title={stop.name}
                description={stop.estimated_time ? `⏰ ${stop.estimated_time}` : undefined}
              />
            </List.Item>
          )}
          locale={{ emptyText: 'Aucun arrêt défini' }}
        />
      </Modal>

      {/* Line form modal */}
      <Modal
        title={editId ? 'Modifier la ligne' : 'Nouvelle ligne'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditId(null); }}
        confirmLoading={createLine.isPending || updateLine.isPending}
        okText={editId ? 'Mettre à jour' : 'Créer'} cancelText="Annuler" width={700}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Nom de la ligne" name="name" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <Input placeholder="Ex: Ligne 1 — Ben Aknoun" />
            </Form.Item>
            <Form.Item label="Quartier" name="neighborhood" style={{ flex: 1 }}>
              <Input placeholder="Ex: Ben Aknoun" />
            </Form.Item>
          </div>

          <Form.Item label="Chauffeur" name="driver">
            <Select placeholder="Sélectionner un chauffeur" allowClear
              options={drivers.map((d) => ({ value: d.id, label: d.full_name }))} />
          </Form.Item>

          <Divider plain>Véhicule</Divider>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Immatriculation" name="vehicle_plate" style={{ flex: 1 }}>
              <Input placeholder="Ex: 12345-200-16" />
            </Form.Item>
            <Form.Item label="Modèle" name="vehicle_model" style={{ flex: 1 }}>
              <Input placeholder="Ex: Hyundai County" />
            </Form.Item>
            <Form.Item label="Couleur" name="vehicle_color" style={{ flex: 1 }}>
              <Input placeholder="Jaune" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Année" name="vehicle_year" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={2000} max={2030} />
            </Form.Item>
            <Form.Item label="Capacité" name="capacity" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={1} max={80} />
            </Form.Item>
            <Form.Item label="Distance (km)" name="distance_km" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
            </Form.Item>
          </div>

          <Divider plain>Horaires</Divider>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Heure départ" name="departure_time" style={{ flex: 1 }}>
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
            <Form.Item label="Heure retour" name="return_time" style={{ flex: 1 }}>
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Actif" name="is_active" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Stop form modal */}
      <Modal
        title={editStopId ? 'Modifier l\'arrêt' : 'Ajouter un arrêt'}
        open={stopModalOpen}
        onOk={handleStopSubmit}
        onCancel={() => { setStopModalOpen(false); setEditStopId(null); }}
        confirmLoading={createStop.isPending || updateStop.isPending}
        okText={editStopId ? 'Mettre à jour' : 'Ajouter'} cancelText="Annuler"
      >
        <Form form={stopForm} layout="vertical">
          <Form.Item label="Nom de l'arrêt" name="name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Arrêt Mosquée" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Ordre" name="order" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item label="Heure estimée" name="estimated_time" style={{ flex: 1 }}>
              <TimePicker style={{ width: '100%' }} format="HH:mm" />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Latitude" name="latitude" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} step={0.000001} />
            </Form.Item>
            <Form.Item label="Longitude" name="longitude" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} step={0.000001} />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default TransportLinesPage;
