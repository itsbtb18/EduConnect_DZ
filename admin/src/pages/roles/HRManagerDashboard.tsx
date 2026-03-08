import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Spin, Tag } from 'antd';
import {
  IdcardOutlined, TeamOutlined, CalendarOutlined,
  BarChartOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { useStaffMembers, useStaffStats, useStaffLeaves } from '../../hooks/useApi';
import './RoleDashboard.css';

const HRManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: statsRaw, isLoading: statsLoading } = useStaffStats();
  const { data: membersRaw, isLoading: membersLoading } = useStaffMembers({ page_size: 10 });
  const { data: leavesRaw } = useStaffLeaves({ page_size: 20 });

  const stats = statsRaw as any;

  const members = useMemo(() => {
    const d = membersRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [membersRaw]);

  const leaves = useMemo(() => {
    const d = leavesRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [leavesRaw]);

  const totalStaff = stats?.total_staff ?? (membersRaw as any)?.count ?? members.length;
  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
  const presentToday = stats?.present_today ?? '—';
  const teacherCount = stats?.teachers ?? members.filter((m: any) => m.role === 'TEACHER' || m.position === 'TEACHER').length;

  const statCards = [
    { label: 'Total personnel', value: totalStaff, icon: <TeamOutlined />, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Enseignants', value: teacherCount, icon: <IdcardOutlined />, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Présents aujourd\'hui', value: presentToday, icon: <CalendarOutlined />, bg: '#ECFDF5', color: '#059669' },
    { label: 'Congés en attente', value: pendingLeaves, icon: <FileTextOutlined />, bg: '#FFF7ED', color: '#EA580C' },
  ];

  const memberColumns = [
    { title: 'Nom', dataIndex: 'full_name', key: 'name',
      render: (v: string, r: any) => v || `${r.first_name ?? ''} ${r.last_name ?? ''}`.trim() || '—' },
    { title: 'Poste', dataIndex: 'position', key: 'position',
      render: (v: string) => v || '—' },
    { title: 'Département', dataIndex: 'department', key: 'department',
      render: (v: string, r: any) => v || r.department_name || '—' },
    { title: 'Statut', dataIndex: 'is_active', key: 'status',
      render: (active: boolean) => (
        <Tag color={active !== false ? 'green' : 'default'}>
          {active !== false ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="rd-page">
      <div className="rd-header">
        <div className="rd-header__info">
          <h1><IdcardOutlined style={{ color: '#7C3AED' }} /> Tableau de bord RH</h1>
          <div className="rd-header__subtitle">
            Gestion du personnel, pointage, congés et documents administratifs
          </div>
        </div>
      </div>

      {statsLoading ? (
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
        <Button type="primary" icon={<TeamOutlined />} onClick={() => navigate('/staff')}>
          Personnel
        </Button>
        <Button icon={<CalendarOutlined />} onClick={() => navigate('/staff/attendance')}>
          Pointage
        </Button>
        <Button icon={<FileTextOutlined />} onClick={() => navigate('/staff/leaves')}>
          Congés ({pendingLeaves})
        </Button>
        <Button icon={<BarChartOutlined />} onClick={() => navigate('/staff/reports')}>
          Rapports
        </Button>
      </div>

      <div className="rd-section">
        <div className="rd-section__header">
          <h3 className="rd-section__title"><TeamOutlined /> Personnel</h3>
        </div>
        <div className="rd-section__body">
          <Table
            dataSource={members}
            columns={memberColumns}
            rowKey="id"
            loading={membersLoading}
            pagination={false}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default HRManagerDashboard;
