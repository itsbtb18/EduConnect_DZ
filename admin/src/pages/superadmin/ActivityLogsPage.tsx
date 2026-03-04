import React, { useState } from 'react';
import { Table, Select, Input, Button, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AuditOutlined,
  SearchOutlined,
  ReloadOutlined,
  DownloadOutlined,
  BankOutlined,
  UserAddOutlined,
  StopOutlined,
  LoginOutlined,
  EyeOutlined,
  ExpandOutlined,
} from '@ant-design/icons';
import { useActivityLogs } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { exportToCSV } from '../../hooks/useExport';
import {
  PageHeader,
  DataCard,
  LoadingSkeleton,
  EmptyState,
  StatusBadge,
} from '../../components/ui';
import './SuperAdmin.css';

const ACTION_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  CREATE: { color: '#10B981', icon: <UserAddOutlined />, label: 'Création' },
  SCHOOL_CREATED: { color: '#00C9A7', icon: <BankOutlined />, label: 'École créée' },
  USER_CREATED: { color: '#3B82F6', icon: <UserAddOutlined />, label: 'Utilisateur créé' },
  UPDATE: { color: '#3B82F6', icon: <EyeOutlined />, label: 'Modification' },
  SCHOOL_UPDATED: { color: '#3B82F6', icon: <BankOutlined />, label: 'École modifiée' },
  DELETE: { color: '#EF4444', icon: <StopOutlined />, label: 'Suppression' },
  SCHOOL_DEACTIVATED: { color: '#EF4444', icon: <StopOutlined />, label: 'École désactivée' },
  LOGIN: { color: '#6B7280', icon: <LoginOutlined />, label: 'Connexion' },
  ADMIN_LOGIN: { color: '#6B7280', icon: <LoginOutlined />, label: 'Connexion admin' },
  LOGOUT: { color: '#6B7280', icon: <LoginOutlined />, label: 'Déconnexion' },
  VIEW: { color: '#A855F7', icon: <EyeOutlined />, label: 'Consultation' },
  EXPORT: { color: '#F59E0B', icon: <DownloadOutlined />, label: 'Export' },
  SUBSCRIPTION_CHANGED: { color: '#F59E0B', icon: <ExpandOutlined />, label: 'Abonnement modifié' },
  IMPERSONATION_STARTED: { color: '#F97316', icon: <EyeOutlined />, label: 'Impersonification' },
};

interface LogRecord {
  id: string;
  user_name?: string;
  user?: string;
  action: string;
  resource_type?: string;
  content_type?: string;
  description?: string;
  message?: string;
  ip_address?: string;
  created_at?: string;
  timestamp?: string;
  target?: string;
  payload?: Record<string, unknown>;
}

const ActivityLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch } = useActivityLogs({
    page,
    page_size: 25,
    search: debouncedSearch || undefined,
    action: actionFilter,
  });

  const results = (data?.results || []) as unknown as LogRecord[];

  const handleExport = () => {
    exportToCSV(
      results as unknown as Record<string, unknown>[],
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

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Il y a ${days}j`;
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  const columns: ColumnsType<LogRecord> = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 190,
      render: (v: string) => {
        const cfg = ACTION_CONFIG[v] || { color: '#6B7280', icon: <EyeOutlined />, label: v || '—' };
        return (
          <div className="al-action-cell">
            <span className="al-action-icon" style={{ color: cfg.color, background: `${cfg.color}15` }}>
              {cfg.icon}
            </span>
            <span className="al-action-label" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
        );
      },
      filters: Object.entries(ACTION_CONFIG).map(([k, v]) => ({ text: v.label, value: k })),
      onFilter: (value, record) => record.action === value,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string, r: LogRecord) => (
        <span style={{ color: 'var(--text-secondary)' }}>{v || r.message || '—'}</span>
      ),
    },
    {
      title: 'Effectué par',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 180,
      render: (v: string, r: LogRecord) => (
        <div className="al-user-cell">
          <div className="al-user-avatar">{(v || (r.user as string) || 'A')[0].toUpperCase()}</div>
          <span className="al-user-name">{v || (r.user as string) || '—'}</span>
        </div>
      ),
    },
    {
      title: 'Cible',
      dataIndex: 'target',
      key: 'target',
      width: 150,
      render: (v: string, r: LogRecord) => (
        <span style={{ color: 'var(--text-tertiary)' }}>{v || r.resource_type || r.content_type || '—'}</span>
      ),
    },
    {
      title: 'Adresse IP',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
      render: (v: string) => v ? <code className="al-ip">{v}</code> : <span className="al-muted">—</span>,
    },
    {
      title: 'Date & heure',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      render: (v: string, r: LogRecord) => {
        const d = v || r.timestamp;
        if (!d) return '—';
        return (
          <Tooltip title={new Date(d).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' })}>
            <div className="al-time-cell">
              <span className="al-time-abs">{new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span className="al-time-rel">{formatRelativeTime(d)}</span>
            </div>
          </Tooltip>
        );
      },
      sorter: (a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime(),
    },
  ];

  if (isLoading && !results.length) return <LoadingSkeleton variant="table" rows={8} />;

  return (
    <div className="sa-page al-page">
      <PageHeader
        title="Journal d'activité"
        subtitle={`${data?.count ?? 0} événements enregistrés`}
        icon={<AuditOutlined />}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>Exporter CSV</Button>
          </div>
        }
      />

      {/* ── Filters bar ── */}
      <div className="al-toolbar">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Rechercher action, utilisateur..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          className="al-search"
        />
        <Select
          placeholder="Type d'action"
          allowClear
          style={{ minWidth: 200 }}
          value={actionFilter}
          onChange={(v) => { setActionFilter(v); setPage(1); }}
          options={Object.entries(ACTION_CONFIG).map(([k, v]) => ({
            value: k,
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: v.color }}>{v.icon}</span> {v.label}
              </span>
            ),
          }))}
        />
      </div>

      {/* ── Table ── */}
      <DataCard noPadding>
        <div className="sa-dark-table">
          <Table
            columns={columns}
            dataSource={results}
            loading={isLoading}
            rowKey={(r) => r.id || `log-${r.created_at}`}
            pagination={{
              current: page,
              pageSize: 25,
              total: data?.count || 0,
              onChange: (p) => setPage(p),
              showSizeChanger: false,
              showTotal: (t) => `${t} événements`,
            }}
            locale={{ emptyText: <EmptyState icon={<AuditOutlined />} title="Aucune activité récente" description="Les événements apparaîtront ici." /> }}
            expandable={{
              expandedRowKeys: expandedRow ? [expandedRow] : [],
              onExpand: (expanded, record) => setExpandedRow(expanded ? (record.id || `log-${record.created_at}`) : null),
              expandedRowRender: (record) => (
                <div className="al-expanded">
                  <pre className="al-json">{JSON.stringify(record.payload || record, null, 2)}</pre>
                </div>
              ),
            }}
            size="small"
            onRow={(record) => ({
              onClick: () => {
                const key = record.id || `log-${record.created_at}`;
                setExpandedRow(expandedRow === key ? null : key);
              },
              style: { cursor: 'pointer' },
            })}
          />
        </div>
      </DataCard>
    </div>
  );
};

export default ActivityLogsPage;
