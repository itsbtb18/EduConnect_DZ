import React, { useState, useMemo } from 'react';
import { Table, Tag, Input, Select, DatePicker, Space, Button } from 'antd';
import {
  HistoryOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useSMSHistory } from '../../hooks/useApi';
import { PageHeader, LoadingSkeleton, EmptyState } from '../../components/ui';
import type { SMSMessage, PaginatedResponse } from '../../types';

const { RangePicker } = DatePicker;

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'SENT', label: 'Envoyé' },
  { value: 'DELIVERED', label: 'Livré' },
  { value: 'FAILED', label: 'Échoué' },
];

const eventTypeOptions = [
  { value: '', label: 'Tous les types' },
  { value: 'ABSENCE', label: 'Absence' },
  { value: 'ARRIVAL', label: 'Arrivée' },
  { value: 'LOW_GRADE', label: 'Note basse' },
  { value: 'PAYMENT_REMINDER', label: 'Rappel paiement' },
  { value: 'PAYMENT_OVERDUE', label: 'Retard paiement' },
  { value: 'URGENT_ANNOUNCEMENT', label: 'Annonce urgente' },
  { value: 'CAMPAIGN', label: 'Campagne' },
  { value: 'CUSTOM', label: 'Personnalisé' },
];

const statusColors: Record<string, string> = {
  PENDING: 'default',
  SENT: 'blue',
  DELIVERED: 'green',
  FAILED: 'red',
};

const SMSHistory: React.FC = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [eventType, setEventType] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const params = useMemo(() => {
    const p: Record<string, unknown> = { page };
    if (status) p.status = status;
    if (eventType) p.event_type = eventType;
    if (search) p.search = search;
    if (dateRange) {
      p.date_from = dateRange[0];
      p.date_to = dateRange[1];
    }
    return p;
  }, [page, status, eventType, search, dateRange]);

  const { data, isLoading } = useSMSHistory(params);
  const result = data as PaginatedResponse<SMSMessage> | undefined;

  const columns = [
    {
      title: 'Destinataire', key: 'recipient',
      render: (_: unknown, r: SMSMessage) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.recipient_name || '—'}</div>
          <div style={{ fontSize: 12, color: '#94A3B8' }}>{r.recipient_phone}</div>
        </div>
      ),
    },
    {
      title: 'Message', dataIndex: 'content', key: 'content',
      ellipsis: true,
      width: 300,
    },
    {
      title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string, r: SMSMessage) => (
        <div>
          <Tag color={statusColors[s]}>{r.status_display}</Tag>
          {r.error_message && (
            <div style={{ fontSize: 11, color: '#EF4444', marginTop: 2 }}>{r.error_message}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Type', dataIndex: 'event_type_display', key: 'event_type',
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'Coût', dataIndex: 'cost', key: 'cost',
      render: (c: number) => `${c} DA`,
    },
    {
      title: 'Date', dataIndex: 'created_at', key: 'date',
      render: (d: string) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      title: 'Livré le', dataIndex: 'delivered_at', key: 'delivered',
      render: (d: string | null) => d
        ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
        : '—',
    },
  ];

  const handleExport = () => {
    if (!result?.results?.length) return;
    const header = 'Destinataire,Téléphone,Statut,Type,Coût,Date\n';
    const rows = result.results.map(m =>
      `"${m.recipient_name}","${m.recipient_phone}","${m.status_display}","${m.event_type_display}","${m.cost}","${m.created_at}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !result) return <LoadingSkeleton variant="table" rows={8} />;

  return (
    <div className="sa-page">
      <PageHeader
        title="Historique SMS"
        subtitle="Consultez l'historique complet de vos messages envoyés"
        icon={<HistoryOutlined />}
        actions={
          <Button icon={<DownloadOutlined />} onClick={handleExport} disabled={!result?.results?.length}>
            Exporter CSV
          </Button>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder="Rechercher par nom ou téléphone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 260 }}
          allowClear
        />
        <Select
          prefix={<FilterOutlined />}
          options={statusOptions}
          value={status}
          onChange={(v) => { setStatus(v); setPage(1); }}
          style={{ width: 160 }}
        />
        <Select
          options={eventTypeOptions}
          value={eventType}
          onChange={(v) => { setEventType(v); setPage(1); }}
          style={{ width: 180 }}
        />
        <RangePicker
          format="DD/MM/YYYY"
          onChange={(_, dateStrings) => {
            if (dateStrings[0] && dateStrings[1]) {
              setDateRange(dateStrings as [string, string]);
            } else {
              setDateRange(null);
            }
            setPage(1);
          }}
        />
        {(status || eventType || search || dateRange) && (
          <Button onClick={() => { setStatus(''); setEventType(''); setSearch(''); setDateRange(null); setPage(1); }}>
            Réinitialiser
          </Button>
        )}
      </div>

      {result?.results?.length === 0 ? (
        <EmptyState
          icon={<HistoryOutlined />}
          title="Aucun message trouvé"
          description="Aucun SMS ne correspond à vos critères de recherche."
        />
      ) : (
        <Table
          dataSource={result?.results || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            total: result?.count || 0,
            pageSize: 20,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: (total) => `${total} message${total > 1 ? 's' : ''}`,
          }}
          scroll={{ x: 900 }}
        />
      )}
    </div>
  );
};

export default SMSHistory;
