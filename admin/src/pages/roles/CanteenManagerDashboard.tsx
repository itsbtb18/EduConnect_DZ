import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Spin, Tag } from 'antd';
import {
  CoffeeOutlined, TeamOutlined, CalendarOutlined,
  BarChartOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { useCanteenStudents, useCanteenMenus, useCanteenAttendance } from '../../hooks/useApi';
import './RoleDashboard.css';

const CanteenManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: studentsRaw, isLoading: studentsLoading } = useCanteenStudents({ page_size: 5 });
  const { data: menusRaw, isLoading: menusLoading } = useCanteenMenus({ page_size: 10 });
  const { data: attendanceRaw } = useCanteenAttendance({ page_size: 50 });

  const students = useMemo(() => {
    const d = studentsRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [studentsRaw]);

  const menus = useMemo(() => {
    const d = menusRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [menusRaw]);

  const attendance = useMemo(() => {
    const d = attendanceRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [attendanceRaw]);

  const totalEnrolled = (studentsRaw as any)?.count ?? students.length;
  const activeMenus = menus.filter((m: any) => m.is_published || m.status === 'ACTIVE').length;
  const todayPresent = attendance.filter((a: any) => a.present).length;
  const attendanceRate = attendance.length > 0
    ? Math.round((todayPresent / attendance.length) * 100) : 0;

  const statCards = [
    { label: 'Élèves inscrits', value: totalEnrolled, icon: <TeamOutlined />, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Menus actifs', value: activeMenus, icon: <UnorderedListOutlined />, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Présences aujourd\'hui', value: todayPresent, icon: <CalendarOutlined />, bg: '#ECFDF5', color: '#059669' },
    { label: 'Taux de présence', value: `${attendanceRate}%`, icon: <BarChartOutlined />, bg: '#FFF7ED', color: '#EA580C' },
  ];

  const menuColumns = [
    { title: 'Menu', dataIndex: 'name', key: 'name',
      render: (v: string, r: any) => v || r.title || '—' },
    { title: 'Date', dataIndex: 'date', key: 'date',
      render: (d: string) => d ? new Date(d).toLocaleDateString('fr-DZ') : '—' },
    { title: 'Statut', dataIndex: 'is_published', key: 'status',
      render: (pub: boolean) => (
        <Tag color={pub ? 'green' : 'default'}>
          {pub ? 'Publié' : 'Brouillon'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="rd-page">
      <div className="rd-header">
        <div className="rd-header__info">
          <h1><CoffeeOutlined style={{ color: '#EA580C' }} /> Tableau de bord Cantine</h1>
          <div className="rd-header__subtitle">
            Gestion des inscriptions, menus et présences de la cantine
          </div>
        </div>
      </div>

      {studentsLoading ? (
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
        <Button type="primary" icon={<TeamOutlined />} onClick={() => navigate('/cantine/enrollments')}>
          Inscriptions
        </Button>
        <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/cantine/menus')}>
          Menus
        </Button>
        <Button icon={<CalendarOutlined />} onClick={() => navigate('/cantine/attendance')}>
          Présences
        </Button>
        <Button icon={<BarChartOutlined />} onClick={() => navigate('/cantine/reports')}>
          Rapports
        </Button>
      </div>

      <div className="rd-section">
        <div className="rd-section__header">
          <h3 className="rd-section__title"><UnorderedListOutlined /> Menus récents</h3>
        </div>
        <div className="rd-section__body">
          <Table
            dataSource={menus}
            columns={menuColumns}
            rowKey="id"
            loading={menusLoading}
            pagination={false}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default CanteenManagerDashboard;
