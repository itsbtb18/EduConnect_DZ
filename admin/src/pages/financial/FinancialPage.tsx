import React, { useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, Card, Statistic, Space, Tabs, Popconfirm, message } from 'antd';
import {
  DollarOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  UnorderedListOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { usePayments, useCreatePayment, useUpdatePayment, useStudents, useFinanceStats, useFees, useCreateFee, useDeleteFee } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { exportToCSV, exportToPDF } from '../../hooks/useExport';
import './FinancialPage.css';

const FinancialPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [form] = Form.useForm();
  const [feeForm] = Form.useForm();

  const { data, isLoading, refetch } = usePayments({ page, page_size: 20, search: debouncedSearch || undefined });
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const { data: studentsData } = useStudents({ page_size: 200 });
  const { data: stats } = useFinanceStats();
  const { data: feesData, isLoading: feesLoading } = useFees();
  const createFee = useCreateFee();
  const deleteFee = useDeleteFee();

  const students = (studentsData?.results || []) as {
    id: string;
    first_name: string;
    last_name: string;
    user?: { first_name: string; last_name: string };
  }[];

  const fees = (feesData?.results || feesData || []) as { id: string; name: string; amount: number; description?: string }[];

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createPayment.mutateAsync(values);
      setModalOpen(false);
      form.resetFields();
    } catch { /* validation */ }
  };

  const handleCreateFee = async () => {
    try {
      const values = await feeForm.validateFields();
      await createFee.mutateAsync(values);
      setFeeModalOpen(false);
      feeForm.resetFields();
    } catch { /* validation */ }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await updatePayment.mutateAsync({ id, data: { status: 'paid' } });
    } catch { /* error handled by hook */ }
  };

  const handleExport = () => {
    const cols = [
      { key: 'student_name', title: 'Élève' },
      { key: 'amount', title: 'Montant (DA)' },
      { key: 'method', title: 'Méthode' },
      { key: 'date', title: 'Date' },
      { key: 'status', title: 'Statut' },
    ];
    exportToCSV(data?.results || [], cols, 'paiements');
  };

  const handleExportPDF = () => {
    const records = data?.results || [];
    if (records.length === 0) { message.warning('Aucune donnée'); return; }
    exportToPDF(
      records as Record<string, unknown>[],
      [
        { key: 'student_name', title: 'Élève' },
        { key: 'amount', title: 'Montant (DA)' },
        { key: 'payment_method', title: 'Méthode' },
        { key: 'date', title: 'Date' },
        { key: 'status', title: 'Statut' },
      ],
      'paiements',
      'Rapport financier — Paiements',
    );
  };

  const statusColors: Record<string, string> = {
    paid: 'green',
    partial: 'orange',
    pending: 'blue',
    overdue: 'red',
    unpaid: 'default',
  };

  const statusLabels: Record<string, string> = {
    paid: 'Payé',
    partial: 'Partiel',
    pending: 'En attente',
    overdue: 'En retard',
    unpaid: 'Non payé',
  };

  const methodLabels: Record<string, string> = {
    cash: 'Espèces',
    bank_transfer: 'Virement bancaire',
    check: 'Chèque',
    ccp: 'CCP',
    baridimob: 'BaridiMob',
  };

  // Use aggregate stats from API, fallback to page-level computation
  const results = data?.results || [];
  const statsObj = stats as Record<string, unknown> | null;
  const totalPaid = (statsObj?.total_paid as number) ?? results.reduce((sum: number, p: Record<string, unknown>) => sum + ((p.amount as number) || 0), 0);
  const paidCount = (statsObj?.paid_count as number) ?? results.filter((p: Record<string, unknown>) => p.status === 'paid').length;
  const pendingCount = (statsObj?.pending_count as number) ?? results.filter((p: Record<string, unknown>) => p.status === 'pending' || p.status === 'unpaid').length;

  const paymentColumns = [
    {
      title: 'Élève',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (v: string, r: Record<string, unknown>) =>
        <span className="font-semibold">{v || (r.student as string) || '—'}</span>,
    },
    {
      title: 'Frais',
      dataIndex: 'fee_name',
      key: 'fee_name',
      render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '—',
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => v != null ? <span className="font-mono font-bold">{v.toLocaleString()} DA</span> : '—',
    },
    {
      title: 'Méthode',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (v: string, r: Record<string, unknown>) => {
        const method = v || (r.method as string) || '';
        return <Tag>{methodLabels[method] || method || '—'}</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (v: string, r: Record<string, unknown>) => {
        const d = v || (r.created_at as string) || '';
        return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v || '—'}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_: unknown, r: Record<string, unknown>) => {
        if (r.status === 'paid') return <Tag color="green" icon={<CheckCircleOutlined />}>Payé</Tag>;
        return (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleMarkAsPaid(r.id as string)}
            loading={updatePayment.isPending}
          >
            Marquer payé
          </Button>
        );
      },
    },
  ];

  const feeColumns = [
    {
      title: 'Nom du frais',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span className="font-semibold">{v}</span>,
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => v != null ? <span className="font-mono font-bold">{v.toLocaleString()} DA</span> : '—',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => v || '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Popconfirm title="Supprimer ce frais ?" onConfirm={() => deleteFee.mutate(r.id as string)}>
          <Button type="text" icon={<DeleteOutlined />} size="small" danger />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Gestion financière</h1>
          <p>{data?.count ?? 0} transactions</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>PDF</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>CSV</Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { form.resetFields(); setModalOpen(true); }}
          >
            Nouveau paiement
          </Button>
        </div>
      </div>

      {/* Summary cards with aggregate stats */}
      <div className="stats-grid stats-grid--3 stagger-children">
        <Card>
          <Statistic
            title="Total perçu"
            value={totalPaid}
            suffix="DA"
            prefix={<DollarOutlined className="color-success" />}
            valueStyle={{ color: 'var(--success)', fontWeight: 700 }}
          />
        </Card>
        <Card>
          <Statistic
            title="Paiements confirmés"
            value={paidCount}
            prefix={<CheckCircleOutlined className="color-primary" />}
            valueStyle={{ fontWeight: 700 }}
          />
        </Card>
        <Card>
          <Statistic
            title="En attente"
            value={pendingCount}
            prefix={<ClockCircleOutlined className="color-warning" />}
            valueStyle={{ color: 'var(--warning)', fontWeight: 700 }}
          />
        </Card>
      </div>

      <Tabs items={[
        {
          key: 'payments',
          label: <span><UnorderedListOutlined /> Paiements</span>,
          children: (
            <>
              <div className="filter-row">
                <Input
                  prefix={<SearchOutlined className="search-icon" />}
                  placeholder="Rechercher un paiement..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  allowClear
                  className="search-input"
                />
              </div>

              <div className="card card--table">
                <Table
                  columns={paymentColumns}
                  dataSource={results}
                  loading={isLoading}
                  rowKey={(r: Record<string, unknown>) => (r.id as string) || `pay-${r.student}-${r.date}`}
                  pagination={{
                    current: page,
                    pageSize: 20,
                    total: data?.count || 0,
                    onChange: (p) => setPage(p),
                    showSizeChanger: false,
                  }}
                  locale={{ emptyText: 'Aucune transaction' }}
                />
              </div>
            </>
          ),
        },
        {
          key: 'fees',
          label: <span><SettingOutlined /> Structure de frais</span>,
          children: (
            <>
              <div className="financial__fee-actions">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => { feeForm.resetFields(); setFeeModalOpen(true); }}
                >
                  Nouveau frais
                </Button>
              </div>
              <Card>
                <Table
                  columns={feeColumns}
                  dataSource={fees}
                  loading={feesLoading}
                  rowKey={(r: Record<string, unknown>) => (r.id as string) || `fee-${r.name}`}
                  pagination={false}
                  locale={{ emptyText: 'Aucune structure de frais définie' }}
                />
              </Card>
            </>
          ),
        },
      ]} />

      {/* Payment modal */}
      <Modal
        title="Nouveau paiement"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => setModalOpen(false)}
        confirmLoading={createPayment.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner un élève"
              options={students.map((s) => ({
                value: s.id,
                label: s.user
                  ? `${s.user.first_name} ${s.user.last_name}`
                  : `${s.first_name} ${s.last_name}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Frais" name="fee" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner un type de frais"
              options={fees.map((f) => ({
                value: f.id,
                label: `${f.name} — ${f.amount?.toLocaleString() || '?'} DA`,
              }))}
              notFoundContent="Aucun frais défini. Créez-en un dans l'onglet 'Structure de frais'."
            />
          </Form.Item>
          <Form.Item label="Montant (DA)" name="amount" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} className="w-full" placeholder="Montant" />
          </Form.Item>
          <Form.Item label="Méthode de paiement" name="payment_method" initialValue="cash">
            <Select>
              <Select.Option value="cash">Espèces</Select.Option>
              <Select.Option value="bank_transfer">Virement bancaire</Select.Option>
              <Select.Option value="check">Chèque</Select.Option>
              <Select.Option value="ccp">CCP</Select.Option>
              <Select.Option value="baridimob">BaridiMob</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Fee structure modal */}
      <Modal
        title="Nouveau type de frais"
        open={feeModalOpen}
        onOk={handleCreateFee}
        onCancel={() => setFeeModalOpen(false)}
        confirmLoading={createFee.isPending}
        okText="Créer"
        cancelText="Annuler"
      >
        <Form form={feeForm} layout="vertical" className="modal-form">
          <Form.Item label="Nom du frais" name="name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Frais de scolarité, Inscription..." />
          </Form.Item>
          <Form.Item label="Montant (DA)" name="amount" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} className="w-full" placeholder="Montant par défaut" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Description optionnelle..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinancialPage;
