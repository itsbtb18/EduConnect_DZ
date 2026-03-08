import React, { useState } from 'react';
import {
  Card, Table, Button, Tag, Space, Modal, Form, Input, Select, Tabs, Popconfirm, Spin, Empty,
} from 'antd';
import {
  PlusOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined,
  BookOutlined, ShoppingCartOutlined,
} from '@ant-design/icons';
import {
  useReservations, useCreateReservation, useCancelReservation,
  useLibraryRequests, useCreateLibraryRequest, useResolveLibraryRequest,
  useBooks,
} from '../../hooks/useApi';
import type { Reservation, LibraryRequest, Book } from '../../types';

const RES_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'orange' },
  FULFILLED: { label: 'Honorée', color: 'green' },
  CANCELLED: { label: 'Annulée', color: 'default' },
  EXPIRED: { label: 'Expirée', color: 'red' },
};

const REQ_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'orange' },
  APPROVED: { label: 'Approuvée', color: 'green' },
  REJECTED: { label: 'Rejetée', color: 'red' },
};

const REQ_TYPES: { value: string; label: string }[] = [
  { value: 'PURCHASE', label: 'Achat' },
  { value: 'SUGGESTION', label: 'Suggestion' },
  { value: 'OTHER', label: 'Autre' },
];

const BookRequests: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reservations' | 'requests'>('reservations');
  const [resModal, setResModal] = useState(false);
  const [reqModal, setReqModal] = useState(false);
  const [resolveModal, setResolveModal] = useState<LibraryRequest | null>(null);
  const [resForm] = Form.useForm();
  const [reqForm] = Form.useForm();
  const [resolveForm] = Form.useForm();

  const { data: reservationsData, isLoading: loadingRes } = useReservations();
  const reservations = (reservationsData?.results || reservationsData || []) as Reservation[];

  const { data: requestsData, isLoading: loadingReq } = useLibraryRequests();
  const requests = (requestsData?.results || requestsData || []) as LibraryRequest[];

  const { data: booksData } = useBooks();
  const allBooks = (booksData?.results || booksData || []) as Book[];

  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();
  const createRequest = useCreateLibraryRequest();
  const resolveRequest = useResolveLibraryRequest();

  const handleCreateReservation = async () => {
    const values = await resForm.validateFields();
    await createReservation.mutateAsync(values);
    setResModal(false);
    resForm.resetFields();
  };

  const handleCreateRequest = async () => {
    const values = await reqForm.validateFields();
    await createRequest.mutateAsync(values);
    setReqModal(false);
    reqForm.resetFields();
  };

  const handleResolve = async (action: 'approve' | 'reject') => {
    const values = await resolveForm.validateFields();
    if (resolveModal) {
      await resolveRequest.mutateAsync({
        id: resolveModal.id,
        data: { action, admin_response: values.admin_response },
      });
    }
    setResolveModal(null);
    resolveForm.resetFields();
  };

  const resCols = [
    { title: 'Livre', dataIndex: 'book_title', ellipsis: true },
    { title: 'Utilisateur', dataIndex: 'user_name', ellipsis: true },
    {
      title: 'Date',
      dataIndex: 'reserved_date',
      width: 110,
      render: (d: string) => new Date(d).toLocaleDateString('fr-FR'),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 110,
      render: (s: string) => <Tag color={RES_STATUS[s]?.color}>{RES_STATUS[s]?.label || s}</Tag>,
    },
    { title: 'Notes', dataIndex: 'notes', ellipsis: true, responsive: ['lg'] as ('lg')[] },
    {
      title: 'Actions',
      width: 100,
      render: (_: unknown, r: Reservation) =>
        r.status === 'PENDING' ? (
          <Popconfirm title="Annuler cette réservation ?" onConfirm={() => cancelReservation.mutate(r.id)}>
            <Button size="small" danger icon={<CloseOutlined />}>Annuler</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const reqCols = [
    {
      title: 'Type',
      dataIndex: 'request_type',
      width: 100,
      render: (t: string) => <Tag>{REQ_TYPES.find(x => x.value === t)?.label || t}</Tag>,
    },
    { title: 'Titre', dataIndex: 'title', ellipsis: true },
    { title: 'Auteur', dataIndex: 'author', ellipsis: true },
    { title: 'Demandeur', dataIndex: 'requester_name', ellipsis: true },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 110,
      render: (s: string) => <Tag color={REQ_STATUS[s]?.color}>{REQ_STATUS[s]?.label || s}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      width: 110,
      render: (d: string) => new Date(d).toLocaleDateString('fr-FR'),
    },
    {
      title: 'Actions',
      width: 100,
      render: (_: unknown, r: LibraryRequest) =>
        r.status === 'PENDING' ? (
          <Button size="small" icon={<CheckOutlined />} onClick={() => { setResolveModal(r); resolveForm.resetFields(); }}>
            Traiter
          </Button>
        ) : (
          r.admin_response ? <span style={{ color: '#666', fontSize: 12 }}>{r.admin_response}</span> : null
        ),
    },
  ];

  const loading = loadingRes || loadingReq;
  if (loading) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  const pendingResCount = reservations.filter(r => r.status === 'PENDING').length;
  const pendingReqCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>📩 Réservations &amp; Demandes</h1>
          <p>Gestion des réservations de livres et demandes d&apos;achat</p>
        </div>
        <Space>
          {activeTab === 'reservations' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setResModal(true)}>
              Nouvelle réservation
            </Button>
          )}
          {activeTab === 'requests' && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setReqModal(true)}>
              Nouvelle demande
            </Button>
          )}
        </Space>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={k => setActiveTab(k as 'reservations' | 'requests')}
          style={{ padding: '0 16px' }}
          items={[
            {
              key: 'reservations',
              label: (
                <Space>
                  <BookOutlined /> Réservations
                  {pendingResCount > 0 && <Tag color="orange">{pendingResCount}</Tag>}
                </Space>
              ),
            },
            {
              key: 'requests',
              label: (
                <Space>
                  <ShoppingCartOutlined /> Demandes
                  {pendingReqCount > 0 && <Tag color="orange">{pendingReqCount}</Tag>}
                </Space>
              ),
            },
          ]}
        />

        {activeTab === 'reservations' ? (
          <Table
            dataSource={reservations.map(r => ({ ...r, key: r.id }))}
            columns={resCols}
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="Aucune réservation" /> }}
          />
        ) : (
          <Table
            dataSource={requests.map(r => ({ ...r, key: r.id }))}
            columns={reqCols}
            pagination={{ pageSize: 20 }}
            locale={{ emptyText: <Empty description="Aucune demande" /> }}
          />
        )}
      </Card>

      {/* Reservation Modal */}
      <Modal
        title="Nouvelle réservation"
        open={resModal}
        onCancel={() => setResModal(false)}
        onOk={handleCreateReservation}
        confirmLoading={createReservation.isPending}
      >
        <Form form={resForm} layout="vertical">
          <Form.Item name="book" label="Livre" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner un livre"
              options={allBooks.map(b => ({ value: b.id, label: `${b.title} — ${b.author}` }))}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      {/* Request Modal */}
      <Modal
        title="Nouvelle demande"
        open={reqModal}
        onCancel={() => setReqModal(false)}
        onOk={handleCreateRequest}
        confirmLoading={createRequest.isPending}
      >
        <Form form={reqForm} layout="vertical">
          <Form.Item name="request_type" label="Type" rules={[{ required: true }]}>
            <Select options={REQ_TYPES} />
          </Form.Item>
          <Form.Item name="title" label="Titre du livre" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="author" label="Auteur"><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      {/* Resolve Request Modal */}
      <Modal
        title={`Traiter la demande : ${resolveModal?.title || ''}`}
        open={!!resolveModal}
        onCancel={() => setResolveModal(null)}
        footer={[
          <Button key="cancel" onClick={() => setResolveModal(null)}>Fermer</Button>,
          <Popconfirm key="reject" title="Rejeter cette demande ?" onConfirm={() => handleResolve('reject')}>
            <Button danger icon={<CloseOutlined />} loading={resolveRequest.isPending}>Rejeter</Button>
          </Popconfirm>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            loading={resolveRequest.isPending}
            onClick={() => handleResolve('approve')}
          >
            Approuver
          </Button>,
        ]}
      >
        {resolveModal && (
          <>
            <p><strong>Type :</strong> {REQ_TYPES.find(t => t.value === resolveModal.request_type)?.label}</p>
            <p><strong>Titre :</strong> {resolveModal.title}</p>
            <p><strong>Auteur :</strong> {resolveModal.author || '—'}</p>
            <p><strong>Description :</strong> {resolveModal.description || '—'}</p>
            <p><strong>Demandeur :</strong> {resolveModal.requester_name}</p>
            <Form form={resolveForm} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item name="admin_response" label="Réponse de l'administration">
                <Input.TextArea rows={3} placeholder="Commentaire optionnel..." />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default BookRequests;
