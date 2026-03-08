import React, { useState } from 'react';
import { Row, Col, Table, Tag, DatePicker, Button, Space, Badge } from 'antd';
import {
  FileTextOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DesktopOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { DataCard } from '../../components/ui/DataCard';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { useTardinessReport, useFingerprintDiagnostics, useBiometricLogs } from '../../hooks/useApi';
import type { TardinessReport, DeviceDiagnostic, BiometricAttendanceLog } from '../../types';

const { RangePicker } = DatePicker;

const FingerprintReports: React.FC = () => {
  const [range, setRange] = useState<[string, string] | null>(null);
  const [logDate, setLogDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

  const { data: tardinessData, isLoading: tardLoading } = useTardinessReport(
    range ? { start: range[0], end: range[1] } : undefined,
  );
  const tardiness = tardinessData as TardinessReport | undefined;

  const { data: diagData, isLoading: diagLoading, refetch: runDiag } = useFingerprintDiagnostics();
  const diagnostics = (Array.isArray(diagData) ? diagData : []) as DeviceDiagnostic[];

  const { data: logsData, isLoading: logsLoading } = useBiometricLogs({ date: logDate });
  const logs = (Array.isArray(logsData) ? logsData : []) as BiometricAttendanceLog[];

  // Tardiness top students columns
  const topColumns = [
    { title: 'Élève', dataIndex: 'name', key: 'name' },
    {
      title: 'Retards',
      dataIndex: 'late_count',
      key: 'late_count',
      render: (v: number) => <Tag color="orange">{v}</Tag>,
    },
    {
      title: 'Total (min)',
      dataIndex: 'total_minutes',
      key: 'total_minutes',
      render: (v: number) => `${v} min`,
    },
  ];

  // Daily logs columns
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
    {
      title: 'Mode',
      key: 'mode',
      render: (_: unknown, r: BiometricAttendanceLog) =>
        r.is_manual_fallback ? <Tag color="volcano">Manuel</Tag> : <Tag color="cyan">Biométrique</Tag>,
    },
  ];

  // Diagnostics columns
  const diagColumns = [
    { title: 'Appareil', dataIndex: 'name', key: 'name' },
    {
      title: 'Statut',
      dataIndex: 'online',
      key: 'online',
      render: (v: boolean) =>
        v ? <Tag icon={<CheckCircleOutlined />} color="success">En ligne</Tag>
          : <Tag icon={<CloseCircleOutlined />} color="error">Hors ligne</Tag>,
    },
    { title: 'Firmware', dataIndex: 'firmware', key: 'firmware', render: (v: string) => v || '—' },
    {
      title: 'Capteur',
      dataIndex: 'sensor_quality',
      key: 'sensor_quality',
      render: (v: number) => (
        <Badge status={v >= 80 ? 'success' : v >= 50 ? 'warning' : 'error'} text={`${v}%`} />
      ),
    },
    { title: 'N° série', dataIndex: 'serial', key: 'serial', render: (v: string) => v || '—' },
    {
      title: 'Erreur',
      dataIndex: 'error',
      key: 'error',
      render: (v: string) => v ? <Tag color="red">{v}</Tag> : '—',
    },
  ];

  // Daily trend chart
  const maxTrend = Math.max(...(tardiness?.daily_trend?.map(d => d.total) ?? [1]), 1);

  return (
    <div className="page-container">
      <PageHeader
        title="Rapports biométriques"
        subtitle="Retards, journaux et diagnostics"
        icon={<FileTextOutlined />}
      />

      {/* ── Tardiness Report ── */}
      <DataCard
        title="Rapport de retards"
        subtitle="Analyse des retards par période"
        icon={<ClockCircleOutlined />}
      >
        <div style={{ marginBottom: 16 }}>
          <RangePicker
            onChange={(_, strings) => {
              if (strings[0] && strings[1]) setRange([strings[0], strings[1]]);
              else setRange(null);
            }}
            style={{ width: 300 }}
          />
        </div>

        {tardLoading ? (
          <LoadingSkeleton variant="stat" />
        ) : !tardiness ? (
          <EmptyState icon={<ClockCircleOutlined />} title="Aucune donnée" description="Sélectionnez une période." />
        ) : (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={12} sm={6}>
                <StatCard icon={<CheckCircleOutlined />} label="Total arrivées" value={tardiness.total_checkins} variant="info" />
              </Col>
              <Col xs={12} sm={6}>
                <StatCard icon={<WarningOutlined />} label="Retards" value={tardiness.late_count} variant="warning" />
              </Col>
              <Col xs={12} sm={6}>
                <StatCard icon={<ClockCircleOutlined />} label="Taux retard" value={`${tardiness.late_rate}%`} variant="danger" />
              </Col>
              <Col xs={12} sm={6}>
                <StatCard icon={<ClockCircleOutlined />} label="Moy. retard" value={`${tardiness.avg_late_minutes} min`} variant="accent" />
              </Col>
            </Row>

            {/* Daily trend mini-chart */}
            {tardiness.daily_trend.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 8, color: '#0F2044' }}>Tendance quotidienne</h4>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 100 }}>
                  {tardiness.daily_trend.map(d => (
                    <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '80%',
                            maxWidth: 20,
                            height: `${Math.max((d.late / maxTrend) * 80, 2)}px`,
                            background: '#F59E0B',
                            borderRadius: '4px 4px 0 0',
                          }}
                        />
                        <div
                          style={{
                            width: '80%',
                            maxWidth: 20,
                            height: `${Math.max(((d.total - d.late) / maxTrend) * 80, 2)}px`,
                            background: '#10B981',
                            borderRadius: '0 0 4px 4px',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 8, color: '#94a3b8', marginTop: 2 }}>
                        {d.date.slice(5)}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                  <Space><div style={{ width: 12, height: 12, background: '#10B981', borderRadius: 2 }} /> <span style={{ fontSize: 12 }}>À l'heure</span></Space>
                  <Space><div style={{ width: 12, height: 12, background: '#F59E0B', borderRadius: 2 }} /> <span style={{ fontSize: 12 }}>En retard</span></Space>
                </div>
              </div>
            )}

            <h4 style={{ marginBottom: 8, color: '#0F2044' }}>Top élèves en retard</h4>
            <Table
              dataSource={tardiness.top_late_students}
              columns={topColumns}
              rowKey="student_id"
              size="small"
              pagination={false}
            />
          </>
        )}
      </DataCard>

      {/* ── Daily logs ── */}
      <DataCard
        title="Journal des passages"
        subtitle="Scans biométriques par jour"
        icon={<FileTextOutlined />}
      >
        <div style={{ marginBottom: 16 }}>
          <DatePicker
            value={dayjs(logDate)}
            onChange={d => setLogDate(d?.format('YYYY-MM-DD') ?? dayjs().format('YYYY-MM-DD'))}
          />
        </div>
        {logsLoading ? (
          <LoadingSkeleton variant="table" />
        ) : logs.length === 0 ? (
          <EmptyState icon={<FileTextOutlined />} title="Aucun passage" description="Aucun scan pour cette date." />
        ) : (
          <Table
            dataSource={logs}
            columns={logColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 700 }}
          />
        )}
      </DataCard>

      {/* ── Device diagnostics ── */}
      <DataCard
        title="Diagnostics des lecteurs"
        subtitle="État des appareils biométriques"
        icon={<DesktopOutlined />}
      >
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={diagLoading}
            onClick={() => runDiag()}
          >
            Lancer le diagnostic
          </Button>
        </div>
        {diagnostics.length > 0 ? (
          <Table
            dataSource={diagnostics}
            columns={diagColumns}
            rowKey="device_id"
            size="small"
            pagination={false}
          />
        ) : (
          <EmptyState
            icon={<DesktopOutlined />}
            title="Aucun diagnostic"
            description="Cliquez sur le bouton pour lancer le diagnostic."
          />
        )}
      </DataCard>
    </div>
  );
};

export default FingerprintReports;
