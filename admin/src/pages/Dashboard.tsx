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
      colorClass: 'stat-card__icon--blue',
      route: '/students',
    },
    {
      label: 'Enseignants',
      value: teacherCount,
      icon: <SolutionOutlined />,
      colorClass: 'stat-card__icon--green',
      route: '/teachers',
    },
    {
      label: 'Classes',
      value: classCount,
      icon: <BookOutlined />,
      colorClass: 'stat-card__icon--yellow',
      route: '/grades',
    },
    {
      label: 'Paiements',
      value: paymentCount,
      icon: <DollarOutlined />,
      colorClass: 'stat-card__icon--purple',
      route: '/financial',
    },
  ];

  const classColumns = [
    {
      title: 'Classe',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => <span className="font-semibold">{v || '—'}</span>,
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
            onClick={() => navigate(s.route)}
          >
            <div className={`stat-card__icon ${s.colorClass}`}>
              {s.icon}
            </div>
            <div className="stat-card__content">
              <div className="stat-card__label">{s.label}</div>
              <div className="stat-card__value">
                {isLoading ? <Spin size="small" /> : s.value}
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
        <div className="flex-col gap-20">
          {/* Quick actions */}
          <Card title={<span className="section-title">Actions rapides</span>}>
            <div className="grid-quick-actions">
              {quickActions.map((a) => (
                <Button
                  key={a.label}
                  icon={a.icon}
                  onClick={() => navigate(a.route)}
                  className="btn-quick-action"
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
              <div className="flex-col gap-12">
                {announcementData.results.slice(0, 3).map((a: any, i: number) => (
                  <div
                    key={(a.id as string) || i}
                    className="announcement-item"
                  >
                    <div className="announcement-item__title">
                      {(a.title as string) || 'Sans titre'}
                    </div>
                    <div className="announcement-item__date">
                      {(a.created_at as string)?.slice(0, 10) || (a.date as string) || ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon"><BellOutlined /></div>
                <div className="empty-state__title">Aucune annonce</div>
                <div className="empty-state__desc">Les annonces apparaitront ici</div>
              </div>
            )}
          </Card>

          {/* Notifications */}
          {notifData?.results && notifData.results.length > 0 && (
            <Card title={<span className="section-title"><BellOutlined /> Notifications</span>}>
              <div className="flex-col gap-8">
                {notifData.results.slice(0, 4).map((n: any, i: number) => (
                  <div
                    key={(n.id as string) || i}
                    className={`notif-item ${!(n.is_read as boolean) ? 'notif-item--unread' : ''}`}
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
