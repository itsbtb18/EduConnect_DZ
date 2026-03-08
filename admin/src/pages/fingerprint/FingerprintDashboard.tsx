import React from 'react';
import { Row, Col, Table, Tag, Badge } from 'antd';
import {
  ScanOutlined,
  TeamOutlined,
  DesktopOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { DataCard } from '../../components/ui/DataCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { useFingerprintDashboard } from '../../hooks/useApi';
import type { FingerprintDashboardData, BiometricAttendanceLog } from '../../types';

const FingerprintDashboard: React.FC = () => {
  const { data, isLoading } = useFingerprintDashboard();
  const dash = data as FingerprintDashboardData | undefined;

  if (isLoading) {
    return (
      <div className="page-container">
        <PageHeader title="Empreintes" subtitle="Tableau de bord biométrique" icon={<ScanOutlined />} />
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map(i => (
            <Col xs={24} sm={12} lg={6} key={i}><LoadingSkeleton variant="stat" /></Col>
          ))}
        </Row>
      </div>
    );
  }

  const logColumns = [
    {
      title: 'Élève',
      dataIndex: 'student_name',
      key: 'student_name',
    },
    {
      title: 'Type',
      dataIndex: 'event_label',
      key: 'event_label',
      render: (v: string, r: BiometricAttendanceLog) => (
        <Tag color={r.event_type === 'CHECK_IN' ? 'green' : 'blue'}>{v}</Tag>
      ),
    },
    {
      title: 'Heure',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (v: string) => new Date(v).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
    {
      title: 'Retard',
      key: 'late',
      render: (_: unknown, r: BiometricAttendanceLog) =>
        r.is_late ? <Tag color="orange">{r.late_minutes} min</Tag> : <Tag color="green">À l'heure</Tag>,
    },
    {
      title: 'Confiance',
      dataIndex: 'confidence_score',
      key: 'confidence_score',
      render: (v: number) => <Badge status={v >= 80 ? 'success' : v >= 50 ? 'warning' : 'error'} text={`${v}%`} />,
    },
    {
      title: 'Appareil',
      dataIndex: 'device_name',
      key: 'device_name',
    },
  ];

  const maxHourly = Math.max(...(dash?.hourly_chart?.map(h => h.count) ?? [1]), 1);

  return (
    <div className="page-container">
      <PageHeader title="Empreintes" subtitle="Tableau de bord biométrique" icon={<ScanOutlined />} />

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<DesktopOutlined />}
            label="Appareils"
            value={`${dash?.online_devices ?? 0} / ${dash?.total_devices ?? 0}`}
            sub="en ligne"
            variant="info"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<TeamOutlined />}
            label="Inscrits"
            value={`${dash?.enrolled_students ?? 0} / ${dash?.total_students ?? 0}`}
            sub="élèves"
            variant="accent"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<CheckCircleOutlined />}
            label="Scans aujourd'hui"
            value={dash?.today_scans ?? 0}
            sub={`Confiance moy. ${dash?.avg_confidence ?? 0}%`}
            variant="success"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            icon={<WarningOutlined />}
            label="Retards"
            value={dash?.today_late ?? 0}
            sub="aujourd'hui"
            variant="warning"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Hourly chart */}
        <Col xs={24} lg={10}>
          <DataCard title="Arrivées par heure" subtitle="Aujourd'hui" icon={<ClockCircleOutlined />}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160, padding: '12px 0' }}>
              {dash?.hourly_chart?.map(h => (
                <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, marginBottom: 4, color: '#64748b' }}>{h.count || ''}</span>
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 28,
                      height: `${Math.max((h.count / maxHourly) * 120, 4)}px`,
                      background: h.count > 0 ? 'linear-gradient(180deg, #00C9A7, #10B981)' : '#e2e8f0',
                      borderRadius: 4,
                    }}
                  />
                  <span style={{ fontSize: 9, marginTop: 4, color: '#94a3b8' }}>{h.hour.slice(0, 2)}h</span>
                </div>
              ))}
            </div>
          </DataCard>
        </Col>

        {/* Recent logs */}
        <Col xs={24} lg={14}>
          <DataCard title="Derniers passages" subtitle="10 derniers scans" icon={<ScanOutlined />}>
            <Table
              dataSource={dash?.recent_logs ?? []}
              columns={logColumns}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 550 }}
            />
          </DataCard>
        </Col>
      </Row>
    </div>
  );
};

export default FingerprintDashboard;
