import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, DatePicker, Switch, Tag, Space,
  message, Descriptions, InputNumber,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined,
  SearchOutlined, CarOutlined, IdcardOutlined,
} from '@ant-design/icons';
import {
  useTransportDrivers, useCreateTransportDriver, useUpdateTransportDriver,
  useDeleteTransportDriver, useDriverIdCard,
} from '../../hooks/useApi';
import type { BusDriver, LicenseType } from '../../types';
import dayjs from 'dayjs';

const LICENSE_OPTIONS: { value: LicenseType; label: string }[] = [
  { value: 'B', label: 'Permis B' },
  { value: 'C', label: 'Permis C' },
  { value: 'D', label: 'Permis D (Transport)' },
  { value: 'E', label: 'Permis E' },
];

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DriversPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailDriver, setDetailDriver] = useState<BusDriver | null>(null);
  const [cardDriverId, setCardDriverId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useTransportDrivers({ page, q: search || undefined });
  const createMut = useCreateTransportDriver();
  const updateMut = useUpdateTransportDriver();
  const deleteMut = useDeleteTransportDriver();
  const { data: cardData } = useDriverIdCard(cardDriverId || '');

  const results = (data?.results || []) as BusDriver[];
  const total = (data as Record<string, unknown>)?.count as number ?? results.length;

  const openEdit = (record: BusDriver) => {
    setEditId(record.id);
    form.setFieldsValue({
      ...record,
      date_of_birth: record.date_of_birth ? dayjs(record.date_of_birth) : null,
      license_expiry: record.license_expiry ? dayjs(record.license_expiry) : null,
      hire_date: record.hire_date ? dayjs(record.hire_date) : null,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth?.format('YYYY-MM-DD') || null,
        license_expiry: values.license_expiry?.format('YYYY-MM-DD') || null,
        hire_date: values.hire_date?.format('YYYY-MM-DD') || null,
      };
      if (editId) {
        await updateMut.mutateAsync({ id: editId, ...payload });
        message.success('Chauffeur mis à jour');
      } else {
        await createMut.mutateAsync(payload);
        message.success('Chauffeur ajouté');
      }
      setModalOpen(false);
      form.resetFields();
      setEditId(null);
    } catch { /* validation */ }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Supprimer ce chauffeur ?', okText: 'Supprimer', cancelText: 'Annuler', okType: 'danger',
      onOk: async () => { await deleteMut.mutateAsync(id); message.success('Chauffeur supprimé'); },
    });
  };

  const columns = [
    { title: 'Nom', key: 'name', render: (_: unknown, r: BusDriver) => r.full_name },
    { title: 'Téléphone', dataIndex: 'phone', key: 'phone' },
    {
      title: 'Permis', key: 'license',
      render: (_: unknown, r: BusDriver) => (
        <span>
          <Tag>{r.license_type || '—'}</Tag>
          {r.license_valid ? <Tag color="green">Valide</Tag> : <Tag color="red">Expiré</Tag>}
        </span>
      ),
    },
    {
      title: 'Actif', dataIndex: 'is_active', key: 'active',
      render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag color="red">Non</Tag>,
    },
    {
      title: 'Embauché', dataIndex: 'hire_date', key: 'hire',
      render: (v: string | null) => v ? dayjs(v).format('DD/MM/YYYY') : '—',
    },
    {
      title: '', key: 'actions', width: 160,
      render: (_: unknown, r: BusDriver) => (
        <Space size="small">
          <Button type="text" size="small" icon={<IdcardOutlined />} onClick={() => setCardDriverId(r.id)} title="Carte ID" />
          <Button type="text" size="small" onClick={() => setDetailDriver(r)}>Détails</Button>
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
          <h1><CarOutlined className="page-header__icon" /> Chauffeurs</h1>
          <p>{total} chauffeurs enregistrés</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setEditId(null); setModalOpen(true); }}>
            Nouveau chauffeur
          </Button>
        </div>
      </div>

      <div className="filter-row" style={{ display: 'flex', gap: 12 }}>
        <Input prefix={<SearchOutlined />} placeholder="Rechercher..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} allowClear style={{ maxWidth: 320 }} />
      </div>

      <div className="card card--table">
        <Table columns={columns} dataSource={results} loading={isLoading} rowKey="id"
          pagination={{ current: page, pageSize: 20, total, onChange: (p) => setPage(p), showTotal: (t) => `${t} chauffeurs` }}
          locale={{ emptyText: 'Aucun chauffeur' }}
        />
      </div>

      {/* Detail modal */}
      <Modal title="Détails du chauffeur" open={!!detailDriver} onCancel={() => setDetailDriver(null)} footer={null} width={600}>
        {detailDriver && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Nom complet">{detailDriver.full_name}</Descriptions.Item>
            <Descriptions.Item label="Téléphone">{detailDriver.phone}</Descriptions.Item>
            <Descriptions.Item label="N° identité">{detailDriver.national_id}</Descriptions.Item>
            <Descriptions.Item label="Date de naissance">{detailDriver.date_of_birth ? dayjs(detailDriver.date_of_birth).format('DD/MM/YYYY') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Groupe sanguin">{detailDriver.blood_type || '—'}</Descriptions.Item>
            <Descriptions.Item label="Adresse">{detailDriver.address || '—'}</Descriptions.Item>
            <Descriptions.Item label="Permis">{detailDriver.license_number} ({detailDriver.license_type})</Descriptions.Item>
            <Descriptions.Item label="Expiration permis">{detailDriver.license_expiry ? dayjs(detailDriver.license_expiry).format('DD/MM/YYYY') : '—'}</Descriptions.Item>
            <Descriptions.Item label="Contact urgence">{detailDriver.emergency_contact_name} — {detailDriver.emergency_contact_phone}</Descriptions.Item>
            <Descriptions.Item label="Date embauche">{detailDriver.hire_date ? dayjs(detailDriver.hire_date).format('DD/MM/YYYY') : '—'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* ID Card modal */}
      <Modal title="Carte d'identité chauffeur" open={!!cardDriverId} onCancel={() => setCardDriverId(null)} footer={null}>
        {cardData && (
          <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(cardData, null, 2)}
          </pre>
        )}
      </Modal>

      {/* Driver form modal */}
      <Modal
        title={editId ? 'Modifier le chauffeur' : 'Nouveau chauffeur'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditId(null); }}
        confirmLoading={createMut.isPending || updateMut.isPending}
        okText={editId ? 'Mettre à jour' : 'Ajouter'} cancelText="Annuler" width={700}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Prénom" name="first_name" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Nom" name="last_name" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Téléphone" name="phone" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <Input placeholder="+213..." />
            </Form.Item>
            <Form.Item label="N° identité nationale" name="national_id" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Date de naissance" name="date_of_birth" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Groupe sanguin" name="blood_type" style={{ flex: 1 }}>
              <Select placeholder="Sélectionner" allowClear options={BLOOD_TYPES.map((b) => ({ value: b, label: b }))} />
            </Form.Item>
          </div>
          <Form.Item label="Adresse" name="address">
            <Input.TextArea rows={2} />
          </Form.Item>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="N° permis" name="license_number" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Type permis" name="license_type" style={{ flex: 1 }}>
              <Select placeholder="Sélectionner" options={LICENSE_OPTIONS} />
            </Form.Item>
            <Form.Item label="Expiration permis" name="license_expiry" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Contact urgence (nom)" name="emergency_contact_name" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Contact urgence (tél)" name="emergency_contact_phone" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Date embauche" name="hire_date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item label="Actif" name="is_active" valuePropName="checked" initialValue={true} style={{ flex: 1 }}>
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default DriversPage;
