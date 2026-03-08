import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Tag, Input, Select, DatePicker, Space, Button, Typography, Row, Col, Tooltip,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, FilterOutlined, DownloadOutlined,
  LoginOutlined, LogoutOutlined, EditOutlined, DeleteOutlined,
  PlusOutlined, LockOutlined, SafetyOutlined, WarningOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { auditLogsAPI } from '../../api/securityService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface AuditLogEntry {
  id: string;
  user: string;
  user_id: string | null;
  action: string;
  model_name: string | null;
  object_id: string | null;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  role: string | null;
  school: string | null;
  timestamp: string;
}

const ACTION_COLOR: Record<string, string> = {
  LOGIN: 'green',
  LOGOUT: 'default',
  LOGIN_FAILED: 'red',
  ACCOUNT_LOCKED: 'volcano',
  ACCOUNT_SUSPENDED: 'orange',
  CREATE: 'blue',
  UPDATE: 'geekblue',
  DELETE: 'red',
  SOFT_DELETE: 'orange',
  RESTORE: 'cyan',
  PASSWORD_CHANGE: 'purple',
  PASSWORD_RESET: 'purple',
  ROLE_CHANGE: 'magenta',
  PERMISSION_CHANGE: 'magenta',
  EXPORT_DATA: 'gold',
  IMPORT_DATA: 'gold',
  OTP_VERIFIED: 'green',
  TOTP_VERIFIED: 'green',
  DEVICE_REVOKED: 'orange',
  SESSION_REVOKED: 'orange',
  ALL_SESSIONS_REVOKED: 'red',
  ACCESS_DENIED: 'red',
};

const ACTION_ICON: Record<string, React.ReactNode> = {
  LOGIN: <LoginOutlined />,
  LOGOUT: <LogoutOutlined />,
  LOGIN_FAILED: <WarningOutlined />,
  ACCOUNT_LOCKED: <LockOutlined />,
  CREATE: <PlusOutlined />,
  UPDATE: <EditOutlined />,
  DELETE: <DeleteOutlined />,
  ACCESS_DENIED: <SafetyOutlined />,
};

const ACTION_OPTIONS = [
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'ACCOUNT_LOCKED', 'ACCOUNT_SUSPENDED',
  'CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE',
  'PASSWORD_CHANGE', 'PASSWORD_RESET', 'ROLE_CHANGE', 'PERMISSION_CHANGE',
  'EXPORT_DATA', 'IMPORT_DATA', 'OTP_VERIFIED', 'TOTP_VERIFIED',
  'DEVICE_REVOKED', 'SESSION_REVOKED', 'ALL_SESSIONS_REVOKED', 'ACCESS_DENIED',
];

const ROLE_OPTIONS = [
  'SUPER_ADMIN', 'ADMIN', 'SECTION_ADMIN', 'GENERAL_SUPERVISOR',
  'TEACHER', 'PARENT', 'STUDENT', 'DRIVER',
  'FINANCE_MANAGER', 'LIBRARIAN', 'CANTEEN_MANAGER', 'TRANSPORT_MANAGER', 'HR_MANAGER',
  'TRAINER', 'TRAINEE', 'PARENT_FORMATION',
];

const AuditLogPage: React.FC = () => {
  const [data, setData] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
      };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (roleFilter) params.role = roleFilter;
      if (dateRange?.[0]) params.date_from = dateRange[0].format('YYYY-MM-DD');
      if (dateRange?.[1]) params.date_to = dateRange[1].format('YYYY-MM-DD');

      const { data: resp } = await auditLogsAPI.list(params);
      setData(resp.results || resp);
      setTotal(resp.count ?? resp.length);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, actionFilter, roleFilter, dateRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = () => {
    if (!data.length) return;
    const headers = ['Timestamp', 'User', 'Action', 'Role', 'IP', 'Model', 'School'];
    const rows = data.map((log) => [
      log.timestamp, log.user, log.action, log.role || '', log.ip_address || '',
      log.model_name || '', log.school || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${dayjs().format('YYYY-MM-DD')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<AuditLogEntry> = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      width: 180,
      render: (ts: string) => (
        <Text style={{ fontSize: 13 }}>{dayjs(ts).format('DD/MM/YYYY HH:mm:ss')}</Text>
      ),
    },
    {
      title: 'Utilisateur',
      dataIndex: 'user',
      width: 160,
      ellipsis: true,
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 180,
      render: (action: string) => (
        <Tag color={ACTION_COLOR[action] || 'default'} icon={ACTION_ICON[action]}>
          {action}
        </Tag>
      ),
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      width: 140,
      render: (role: string | null) => role ? <Tag>{role}</Tag> : '-',
    },
    {
      title: 'Modèle',
      dataIndex: 'model_name',
      width: 120,
      render: (v: string | null) => v || '-',
    },
    {
      title: 'Adresse IP',
      dataIndex: 'ip_address',
      width: 130,
      render: (ip: string | null) => ip || '-',
    },
    {
      title: 'École',
      dataIndex: 'school',
      width: 150,
      ellipsis: true,
      render: (v: string | null) => v || '-',
    },
    {
      title: 'Détails',
      dataIndex: 'metadata',
      width: 200,
      ellipsis: true,
      render: (meta: Record<string, unknown> | null) => {
        if (!meta || !Object.keys(meta).length) return '-';
        return (
          <Tooltip title={<pre style={{ margin: 0, fontSize: 12 }}>{JSON.stringify(meta, null, 2)}</pre>}>
            <Text style={{ fontSize: 12, cursor: 'pointer' }}>
              {JSON.stringify(meta).slice(0, 60)}…
            </Text>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>
            <SafetyOutlined style={{ marginRight: 8 }} />
            Journal d'audit
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchLogs}>Actualiser</Button>
            <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>Exporter CSV</Button>
          </Space>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              allowClear
            />
          </Col>
          <Col xs={12} sm={5}>
            <Select
              placeholder="Action"
              value={actionFilter}
              onChange={(v) => { setActionFilter(v); setPage(1); }}
              allowClear
              style={{ width: '100%' }}
              suffixIcon={<FilterOutlined />}
              options={ACTION_OPTIONS.map((a) => ({ label: a, value: a }))}
            />
          </Col>
          <Col xs={12} sm={5}>
            <Select
              placeholder="Rôle"
              value={roleFilter}
              onChange={(v) => { setRoleFilter(v); setPage(1); }}
              allowClear
              style={{ width: '100%' }}
              options={ROLE_OPTIONS.map((r) => ({ label: r, value: r }))}
            />
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange as [Dayjs, Dayjs] | null}
              onChange={(dates) => { setDateRange(dates); setPage(1); }}
              format="DD/MM/YYYY"
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            showTotal: (t) => `${t} entrées`,
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default AuditLogPage;
