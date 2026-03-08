import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Progress } from 'antd';
import {
  CarOutlined, TeamOutlined, EnvironmentOutlined, ClockCircleOutlined,
  CheckCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTransportLines, useTransportDrivers, useTransportReport } from '../../hooks/useApi';
import type { TransportLineList, TransportReport } from '../../types';

const TransportDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: linesData, isLoading: loadingLines } = useTransportLines({ active: true });
  const { data: driversData, isLoading: loadingDrivers } = useTransportDrivers({ active: true });
  const { data: reportData, isLoading: loadingReport } = useTransportReport();

  const lines = (linesData?.results || []) as TransportLineList[];
  const drivers = (driversData?.results || []) as { id: string }[];
  const report = reportData as TransportReport | undefined;

  const totalCapacity = lines.reduce((sum, l) => sum + (l.capacity || 0), 0);
  const totalEnrolled = lines.reduce((sum, l) => sum + (l.enrolled_count || 0), 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  if (loadingLines || loadingDrivers || loadingReport) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>🚌 Transport scolaire</h1>
          <p>Vue d'ensemble du réseau de transport</p>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/transport/lines')} style={{ borderLeft: '4px solid #3B82F6' }}>
            <Statistic title="Lignes actives" value={lines.length} prefix={<EnvironmentOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/transport/drivers')} style={{ borderLeft: '4px solid #00C9A7' }}>
            <Statistic title="Chauffeurs" value={drivers.length} prefix={<CarOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/transport/assignments')} style={{ borderLeft: '4px solid #F59E0B' }}>
            <Statistic title="Élèves transportés" value={totalEnrolled} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/transport/reports')} style={{ borderLeft: '4px solid #10B981' }}>
            <Statistic
              title="Ponctualité"
              value={report?.on_time_rate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Occupancy */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card title="Taux d'occupation global">
            <Progress
              type="dashboard"
              percent={occupancyRate}
              strokeColor={occupancyRate > 90 ? '#EF4444' : occupancyRate > 70 ? '#F59E0B' : '#10B981'}
            />
            <p style={{ textAlign: 'center', marginTop: 8 }}>
              {totalEnrolled} / {totalCapacity} places
            </p>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Performance des trajets" className="card card--table">
            {report && (
              <Row gutter={16}>
                <Col span={6}><Statistic title="Total trajets" value={report.total_trips} /></Col>
                <Col span={6}><Statistic title="À l'heure" value={report.on_time_count} valueStyle={{ color: '#10B981' }} /></Col>
                <Col span={6}><Statistic title="En retard" value={report.delayed_count} valueStyle={{ color: '#F59E0B' }} /></Col>
                <Col span={6}><Statistic title="Retard moyen" value={report.avg_delay_minutes} suffix="min" /></Col>
              </Row>
            )}
          </Card>
        </Col>
      </Row>

      {/* Lines overview */}
      <Card title="📋 Aperçu des lignes" className="card card--table">
        <Table
          dataSource={lines}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            { title: 'Ligne', dataIndex: 'name', key: 'name' },
            { title: 'Quartier', dataIndex: 'neighborhood', key: 'neighborhood' },
            { title: 'Chauffeur', dataIndex: 'driver_name', key: 'driver' },
            { title: 'Véhicule', dataIndex: 'vehicle_plate', key: 'plate' },
            {
              title: 'Occupation', key: 'occupation',
              render: (_: unknown, r: TransportLineList) => {
                const pct = r.capacity > 0 ? Math.round((r.enrolled_count / r.capacity) * 100) : 0;
                return (
                  <span>
                    {r.enrolled_count}/{r.capacity}
                    {' '}
                    <Tag color={pct > 90 ? 'red' : pct > 70 ? 'orange' : 'green'}>{pct}%</Tag>
                  </span>
                );
              },
            },
            {
              title: 'Départ', dataIndex: 'departure_time', key: 'departure',
              render: (v: string | null) => v ? <Tag icon={<ClockCircleOutlined />}>{v}</Tag> : '—',
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default TransportDashboard;
