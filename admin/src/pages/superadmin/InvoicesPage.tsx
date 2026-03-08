import React, { useState } from 'react';
import { Card, Table, Tag, Select, DatePicker, Space, Typography, Statistic, Row, Col } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { SubscriptionInvoice, InvoiceStatus } from '../../types';
import { useAllInvoices, useMarkInvoicePaid } from '../../hooks/useApi';
import { Button } from 'antd';

const { Title } = Typography;

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyée',
  PAID: 'Payée',
  OVERDUE: 'En retard',
  CANCELLED: 'Annulée',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  SENT: 'blue',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
};

const InvoicesPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [dateFrom, setDateFrom] = useState<dayjs.Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<dayjs.Dayjs | null>(null);

  const params: Record<string, unknown> = {};
  if (statusFilter) params.status = statusFilter;
  if (dateFrom) params.date_from = dateFrom.format('YYYY-MM-DD');
  if (dateTo) params.date_to = dateTo.format('YYYY-MM-DD');

  const { data, isLoading } = useAllInvoices(params);
  const markPaid = useMarkInvoicePaid();

  const invoices: SubscriptionInvoice[] = Array.isArray(data) ? data : [];

  const totalAmount = invoices.reduce((s, i) => s + parseFloat(i.total_amount || '0'), 0);
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;
  const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;

  const columns = [
    { title: 'N° Facture', dataIndex: 'invoice_number', key: 'invoice_number', width: 220 },
    { title: 'École', dataIndex: 'school_name', key: 'school_name' },
    {
      title: 'Période',
      key: 'period',
      render: (_: unknown, r: SubscriptionInvoice) => `${r.period_start} → ${r.period_end}`,
    },
    {
      title: 'Montant HT',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: string) => `${parseFloat(v).toLocaleString()} DA`,
    },
    {
      title: 'TVA',
      dataIndex: 'tax_amount',
      key: 'tax_amount',
      render: (v: string) => `${parseFloat(v).toLocaleString()} DA`,
    },
    {
      title: 'Total TTC',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v: string) => <strong>{parseFloat(v).toLocaleString()} DA</strong>,
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (s: InvoiceStatus) => (
        <Tag color={STATUS_COLORS[s]}>{STATUS_LABELS[s] || s}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SubscriptionInvoice) =>
        record.status !== 'PAID' && record.status !== 'CANCELLED' ? (
          <Button
            size="small"
            type="primary"
            loading={markPaid.isPending}
            onClick={() => markPaid.mutate({ schoolId: record.school, invoiceId: record.id })}
          >
            Marquer payée
          </Button>
        ) : null,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>
        <FileTextOutlined /> Toutes les factures
      </Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="Total facturé" value={`${totalAmount.toLocaleString()} DA`} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Payées" value={paidCount} valueStyle={{ color: '#10B981' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="En retard" value={overdueCount} valueStyle={{ color: '#EF4444' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            allowClear
            placeholder="Filtrer par statut"
            style={{ width: 180 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
          <DatePicker placeholder="Du" value={dateFrom} onChange={setDateFrom} />
          <DatePicker placeholder="Au" value={dateTo} onChange={setDateTo} />
        </Space>

        <Table
          dataSource={invoices}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 15 }}
        />
      </Card>
    </div>
  );
};

export default InvoicesPage;
