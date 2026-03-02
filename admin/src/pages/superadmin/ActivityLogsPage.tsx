import React, { useState } from 'react';
import { Table, Tag, Select, Input, Card, Button, Space } from 'antd';
import {
  AuditOutlined, SearchOutlined, ReloadOutlined, FilterOutlined,
  UserOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useActivityLogs } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { exportToCSV } from '../../hooks/useExport';

const actionColors: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  LOGIN: 'cyan',
  LOGOUT: 'default',
  VIEW: 'purple',
  EXPORT: 'orange',
};

const ActivityLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useActivityLogs({
    page,
    page_size: 25,
    search: debouncedSearch || undefined,
    action: actionFilter,
  });

  const results = (data?.results || []) as Record<string, unknown>[];

  const handleExport = () => {
    exportToCSV(
      results,
      [
        { key: 'user_name', title: 'Utilisateur' },
        { key: 'action', title: 'Action' },
        { key: 'resource_type', title: 'Ressource' },
        { key: 'description', title: 'Description' },
        { key: 'ip_address', title: 'IP' },
        { key: 'created_at', title: 'Date' },
      ],
      'activity-logs',
    );
  };

  const columns = [
    {
      title: 'Utilisateur',
      dataIndex: 'user_name',
      key: 'user_name',
      render: (v: string, r: Record<string, unknown>) => (
        <Space>
          <UserOutlined />
          <span className="font-semibold">{v || (r.user as string) || '—'}</span>
        </Space>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (v: string) => (
        <Tag color={actionColors[v] || 'default'}>{v || '—'}</Tag>
      ),
    },
    {
      title: 'Ressource',
      dataIndex: 'resource_type',
      key: 'resource_type',
      render: (v: string, r: Record<string, unknown>) => v || (r.content_type as string) || '—',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string, r: Record<string, unknown>) => v || (r.message as string) || '—',
    },
    {
      title: 'Adresse IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (v: string) => v ? <code className="font-mono">{v}</code> : '—',
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string, r: Record<string, unknown>) => {
        const d = v || (r.timestamp as string);
        return d ? new Date(d).toLocaleString('fr-FR') : '—';
      },
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime(),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><AuditOutlined className="page-header__icon" /> Journal d'activité</h1>
          <p>{data?.count ?? 0} événements</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button onClick={handleExport}>Exporter CSV</Button>
        </div>
      </div>

      <Card className="filter-card">
        <Space wrap>
          <FilterOutlined className="filter-icon" />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            allowClear
            className="search-input"
          />
          <Select
            placeholder="Par action"
            allowClear
            className="filter-select"
            value={actionFilter}
            onChange={(v) => { setActionFilter(v); setPage(1); }}
            options={Object.keys(actionColors).map((a) => ({ value: a, label: a }))}
          />
        </Space>
      </Card>

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={results}
          loading={isLoading}
          rowKey={(r: Record<string, unknown>) => (r.id as string) || `log-${r.created_at}`}
          pagination={{
            current: page,
            pageSize: 25,
            total: data?.count || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (t) => `${t} événements`,
          }}
          locale={{ emptyText: 'Aucun événement' }}
        />
      </div>
    </div>
  );
};

export default ActivityLogsPage;
