import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Spin, Tag } from 'antd';
import {
  CarOutlined, TeamOutlined, EnvironmentOutlined,
  BarChartOutlined, NodeIndexOutlined,
} from '@ant-design/icons';
import { useTransportLines, useTransportDrivers, useStudentTransports } from '../../hooks/useApi';
import './RoleDashboard.css';

const TransportManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: linesRaw, isLoading: linesLoading } = useTransportLines();
  const { data: driversRaw, isLoading: driversLoading } = useTransportDrivers();
  const { data: studentsRaw } = useStudentTransports();

  const lines = useMemo(() => {
    const d = linesRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [linesRaw]);

  const drivers = useMemo(() => {
    const d = driversRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [driversRaw]);

  const studentTransports = useMemo(() => {
    const d = studentsRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [studentsRaw]);

  const totalLines = (linesRaw as any)?.count ?? lines.length;
  const activeDrivers = drivers.filter((d: any) => d.is_active !== false).length;
  const assignedStudents = (studentsRaw as any)?.count ?? studentTransports.length;

  const statCards = [
    { label: 'Lignes de transport', value: totalLines, icon: <NodeIndexOutlined />, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Chauffeurs actifs', value: activeDrivers, icon: <CarOutlined />, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Élèves affectés', value: assignedStudents, icon: <TeamOutlined />, bg: '#ECFDF5', color: '#059669' },
    { label: 'Arrêts', value: lines.reduce((sum: number, l: any) => sum + (l.stops_count ?? l.stops?.length ?? 0), 0), icon: <EnvironmentOutlined />, bg: '#FFF7ED', color: '#EA580C' },
  ];

  const lineColumns = [
    { title: 'Ligne', dataIndex: 'name', key: 'name' },
    { title: 'Chauffeur', dataIndex: 'driver_name', key: 'driver',
      render: (v: string, r: any) => v || r.driver?.name || '—' },
    { title: 'Arrêts', dataIndex: 'stops_count', key: 'stops',
      render: (v: number, r: any) => v ?? r.stops?.length ?? '—' },
    { title: 'Statut', dataIndex: 'is_active', key: 'status',
      render: (active: boolean) => (
        <Tag color={active !== false ? 'green' : 'default'}>
          {active !== false ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="rd-page">
      <div className="rd-header">
        <div className="rd-header__info">
          <h1><CarOutlined style={{ color: '#2563EB' }} /> Tableau de bord Transport</h1>
          <div className="rd-header__subtitle">
            Gestion des lignes, chauffeurs et affectations de transport scolaire
          </div>
        </div>
      </div>

      {linesLoading || driversLoading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <div className="rd-stats">
          {statCards.map((c) => (
            <div className="rd-stat-card" key={c.label}>
              <div className="rd-stat-card__icon" style={{ background: c.bg, color: c.color }}>
                {c.icon}
              </div>
              <div>
                <div className="rd-stat-card__value">{c.value}</div>
                <div className="rd-stat-card__label">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rd-actions">
        <Button type="primary" icon={<NodeIndexOutlined />} onClick={() => navigate('/transport/lines')}>
          Lignes
        </Button>
        <Button icon={<CarOutlined />} onClick={() => navigate('/transport/drivers')}>
          Chauffeurs
        </Button>
        <Button icon={<TeamOutlined />} onClick={() => navigate('/transport/assignments')}>
          Affectations
        </Button>
        <Button icon={<BarChartOutlined />} onClick={() => navigate('/transport/reports')}>
          Rapports
        </Button>
      </div>

      <div className="rd-section">
        <div className="rd-section__header">
          <h3 className="rd-section__title"><NodeIndexOutlined /> Lignes de transport</h3>
        </div>
        <div className="rd-section__body">
          <Table
            dataSource={lines}
            columns={lineColumns}
            rowKey="id"
            loading={linesLoading}
            pagination={false}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default TransportManagerDashboard;
