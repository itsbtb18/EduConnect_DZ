import React, { useState } from 'react';
import { Table, Button, Tag, Modal, Form, Input, InputNumber, Select, Card, Statistic, Space } from 'antd';
import {
  DollarOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { usePayments, useCreatePayment } from '../../hooks/useApi';

const FinancialPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = usePayments({ page, page_size: 20 });
  const createPayment = useCreatePayment();

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createPayment.mutateAsync(values);
      setModalOpen(false);
      form.resetFields();
    } catch {
      // validation
    }
  };

  const statusColors: Record<string, string> = {
    paid: 'green',
    partial: 'orange',
    pending: 'blue',
    overdue: 'red',
    unpaid: 'default',
  };

  const statusLabels: Record<string, string> = {
    paid: 'Paye',
    partial: 'Partiel',
    pending: 'En attente',
    overdue: 'En retard',
    unpaid: 'Non paye',
  };

  const results = data?.results || [];
  const totalPaid = results.reduce((sum: number, p: any) => sum + ((p.amount as number) || 0), 0);
  const paidCount = results.filter((p: any) => p.status === 'paid').length;
  const pendingCount = results.filter((p: any) => p.status === 'pending' || p.status === 'unpaid').length;

  const columns = [
    {
      title: 'Eleve',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (v: string, r: Record<string, unknown>) =>
        <span className="font-semibold">{v || (r.student as string) || '—'}</span>,
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => v != null ? <span className="font-mono font-bold">{v.toLocaleString()} DA</span> : '—',
    },
    {
      title: 'Methode',
      dataIndex: 'method',
      key: 'method',
      render: (v: string, r: Record<string, unknown>) =>
        <Tag>{v || (r.payment_method as string) || '—'}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (v: string, r: Record<string, unknown>) => (v || (r.created_at as string) || '—')?.toString().slice(0, 10),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={statusColors[v] || 'default'}>{statusLabels[v] || v || '—'}</Tag>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Gestion financiere</h1>
          <p>{data?.count ?? 0} transactions</p>
        </div>
        <div className="page-header__actions">
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

      {/* Summary cards */}
      <div className="stats-grid stats-grid--3 stagger-children">
        <Card>
          <Statistic
            title="Total percu"
            value={totalPaid}
            suffix="DA"
            prefix={<DollarOutlined style={{ color: 'var(--success)' }} />}
            valueStyle={{ color: 'var(--success)', fontWeight: 700 }}
          />
        </Card>
        <Card>
          <Statistic
            title="Paiements confirmes"
            value={paidCount}
            prefix={<CheckCircleOutlined style={{ color: 'var(--primary)' }} />}
            valueStyle={{ fontWeight: 700 }}
          />
        </Card>
        <Card>
          <Statistic
            title="En attente"
            value={pendingCount}
            prefix={<ClockCircleOutlined style={{ color: 'var(--warning)' }} />}
            valueStyle={{ color: 'var(--warning)', fontWeight: 700 }}
          />
        </Card>
      </div>

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={results}
          loading={isLoading}
          rowKey={(r: Record<string, any>) => (r.id as string) || String(Math.random())}
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
          <Form.Item label="Eleve" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="ID de l'eleve" />
          </Form.Item>
          <Form.Item label="Frais" name="fee" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="ID du frais" />
          </Form.Item>
          <Form.Item label="Montant (DA)" name="amount" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Montant" />
          </Form.Item>
          <Form.Item label="Methode" name="payment_method" initialValue="cash">
            <Select>
              <Select.Option value="cash">Especes</Select.Option>
              <Select.Option value="bank_transfer">Virement bancaire</Select.Option>
              <Select.Option value="check">Cheque</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FinancialPage;
