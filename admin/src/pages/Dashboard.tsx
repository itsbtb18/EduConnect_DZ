import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Spin, Card } from 'antd';
import {
  TeamOutlined,
  SolutionOutlined,
  BookOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  RiseOutlined,
  BellOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useDashboardStats, useClasses, useNotifications, useAnnouncements } from '../hooks/useApi';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { studentCount, teacherCount, classCount, paymentCount, isLoading } = useDashboardStats();
  const { data: classData, isLoading: classesLoading } = useClasses({ page_size: 5 });
  const { data: notifData } = useNotifications({ page_size: 5 });
  const { data: announcementData } = useAnnouncements({ page_size: 3 });

  const stats = [
    {
      label: 'Eleves',
      value: studentCount,
      icon: <TeamOutlined />,
      color: '#1A6BFF',
      bg: '#EBF2FF',
      route: '/students',
    },
    {
      label: 'Enseignants',
      value: teacherCount,
      icon: <SolutionOutlined />,
      color: '#10B981',
      bg: '#ECFDF5',
      route: '/teachers',
    },
    {
      label: 'Classes',
      value: classCount,
      icon: <BookOutlined />,
      color: '#F59E0B',
      bg: '#FFFBEB',
      route: '/grades',
    },
    {
      label: 'Paiements',
      value: paymentCount,
      icon: <DollarOutlined />,
      color: '#6366F1',
      bg: '#EEF2FF',
      route: '/financial',
    },
  ];

  const classColumns = [
    {
      title: 'Classe',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span style={{ fontWeight: 600 }}>{v || '—'}</span>,
    },
    {
      title: 'Niveau',
      dataIndex: 'level',
      key: 'level',
      render: (v: string) => <Tag color="blue">{v || '—'}</Tag>,
    },
    {
      title: 'Effectif',
      dataIndex: 'student_count',
      key: 'student_count',
      render: (v: number) => v ?? '—',
    },
  ];

  const quickActions = [
    { label: 'Gerer les eleves', icon: <TeamOutlined />, route: '/students' },
    { label: 'Voir les notes', icon: <BookOutlined />, route: '/grades' },
    { label: 'Suivi absences', icon: <CalendarOutlined />, route: '/attendance' },
    { label: 'Analytiques', icon: <RiseOutlined />, route: '/analytics' },
  ];

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__info">
          <h1>Tableau de bord</h1>
          <p>Vue d'ensemble de votre etablissement</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid stagger-children">
        {stats.map((s) => (
          <div
            key={s.label}
            className="stat-card card-interactive"
            style={{ '--accent-color': s.color } as React.CSSProperties}
            onClick={() => navigate(s.route)}
          >
            <div className="stat-card" style={{ border: 'none', boxShadow: 'none', padding: 0, cursor: 'pointer' }} onClick={() => navigate(s.route)}>
              <div className="stat-card__icon" style={{ background: s.bg, color: s.color }}>
                {s.icon}
              </div>
              <div className="stat-card__content">
                <div className="stat-card__label">{s.label}</div>
                <div className="stat-card__value">
                  {isLoading ? <Spin size="small" /> : s.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid-main">
        {/* Classes table */}
        <Card
          title={<span className="section-title"><BookOutlined /> Apercu des classes</span>}
          extra={<Button type="link" onClick={() => navigate('/grades')}>Voir tout <ArrowRightOutlined /></Button>}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={classColumns}
            dataSource={classData?.results || []}
            loading={classesLoading}
            pagination={false}
            rowKey={(r: Record<string, any>) => (r.id as string) || (r.name as string) || String(Math.random())}
            size="small"
            locale={{ emptyText: 'Aucune classe trouvee' }}
          />
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick actions */}
          <Card title={<span className="section-title">Actions rapides</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {quickActions.map((a) => (
                <Button
                  key={a.label}
                  icon={a.icon}
                  onClick={() => navigate(a.route)}
                  style={{ height: 42, fontWeight: 600, fontSize: 12 }}
                  block
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </Card>

          {/* Recent announcements */}
          <Card
            title={<span className="section-title"><BellOutlined /> Annonces recentes</span>}
            extra={<Button type="link" onClick={() => navigate('/announcements')}>Voir tout</Button>}
          >
            {announcementData?.results?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {announcementData.results.slice(0, 3).map((a: any, i: number) => (
                  <div
                    key={(a.id as string) || i}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: '3px solid var(--primary)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-900)', marginBottom: 2 }}>
                      {(a.title as string) || 'Sans titre'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                      {(a.created_at as string)?.slice(0, 10) || (a.date as string) || ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: 24 }}>
                <div className="empty-state__icon"><BellOutlined /></div>
                <div className="empty-state__title">Aucune annonce</div>
                <div className="empty-state__desc">Les annonces apparaitront ici</div>
              </div>
            )}
          </Card>

          {/* Notifications */}
          {notifData?.results && notifData.results.length > 0 && (
            <Card title={<span className="section-title"><BellOutlined /> Notifications</span>}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notifData.results.slice(0, 4).map((n: any, i: number) => (
                  <div
                    key={(n.id as string) || i}
                    style={{
                      padding: '8px 12px',
                      background: (n.is_read as boolean) ? 'transparent' : 'var(--primary-50)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 13,
                      color: 'var(--gray-700)',
                    }}
                  >
                    {(n.message as string) || (n.title as string) || 'Notification'}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
