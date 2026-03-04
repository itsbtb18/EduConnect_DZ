import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, Spin, Card, Progress, Tooltip, Badge } from 'antd';
import {
  TeamOutlined,
  SolutionOutlined,
  BookOutlined,
  DollarOutlined,
  ArrowRightOutlined,
  RiseOutlined,
  BellOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  NotificationOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useDashboardStats, useClasses, useNotifications, useAnnouncements, useAttendance, useConversations } from '../hooks/useApi';
import './Dashboard.css';

const REFRESH_INTERVAL = 60_000; // Auto-refresh every 60 seconds

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { studentCount, teacherCount, classCount, paymentCount, isLoading } = useDashboardStats();
  const { data: classData, isLoading: classesLoading } = useClasses({ page_size: 5 });
  const { data: notifData } = useNotifications({ page_size: 5 });
  const { data: announcementData } = useAnnouncements({ page_size: 5 });
  const { data: chatData } = useConversations();

  // Today's attendance for the attendance rate stat — auto-refresh every 60s
  const today = new Date().toISOString().split('T')[0];
  const { data: attendanceData } = useAttendance({ date: today, page_size: 200 });
  const attendanceRecords = attendanceData?.results || [];
  const totalRecords = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r: Record<string, unknown>) =>
    r.status === 'present' || r.status === 'PRESENT'
  ).length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  // Unread messages count
  const unreadMessages = useMemo(() => {
    const convs = (Array.isArray(chatData) ? chatData : chatData?.results || []) as Record<string, unknown>[];
    return convs.reduce((sum, c) => sum + ((c.unread_count_admin as number) || 0), 0);
  }, [chatData]);

  // Today's announcements count
  const todayAnnouncements = useMemo(() => {
    const all = (announcementData?.results || []) as Record<string, unknown>[];
    return all.filter((a) => {
      const d = (a.created_at as string) || (a.date as string) || '';
      return d.startsWith(today);
    }).length;
  }, [announcementData, today]);

  // Unread notifications count
  const unreadNotifs = useMemo(() => {
    const all = (notifData?.results || []) as Record<string, unknown>[];
    return all.filter((n) => !(n.is_read as boolean)).length;
  }, [notifData]);

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const formattedDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const stats = [
    {
      label: 'Élèves inscrits',
      value: studentCount,
      icon: <TeamOutlined />,
      colorClass: 'stat-card__icon--blue',
      route: '/students',
      description: 'Total des élèves',
    },
    {
      label: 'Enseignants',
      value: teacherCount,
      icon: <SolutionOutlined />,
      colorClass: 'stat-card__icon--green',
      route: '/teachers',
      description: 'Enseignants actifs',
    },
    {
      label: 'Classes',
      value: classCount,
      icon: <BookOutlined />,
      colorClass: 'stat-card__icon--yellow',
      route: '/grades',
      description: 'Classes ouvertes',
    },
    {
      label: 'Présence aujourd\'hui',
      value: totalRecords > 0 ? `${attendanceRate}%` : '—',
      icon: <CheckCircleOutlined />,
      colorClass: attendanceRate >= 80 ? 'stat-card__icon--green' : attendanceRate >= 50 ? 'stat-card__icon--yellow' : 'stat-card__icon--red',
      route: '/attendance',
      description: totalRecords > 0 ? `${presentCount}/${totalRecords} présents` : 'Aucune donnée',
    },
    {
      label: 'Messages non lus',
      value: unreadMessages,
      icon: <MessageOutlined />,
      colorClass: unreadMessages > 0 ? 'stat-card__icon--pink' : 'stat-card__icon--blue',
      route: '/messaging',
      description: unreadMessages > 0 ? 'Messages en attente' : 'Tout est lu',
    },
    {
      label: 'Annonces du jour',
      value: todayAnnouncements,
      icon: <NotificationOutlined />,
      colorClass: 'stat-card__icon--purple',
      route: '/announcements',
      description: `${announcementData?.count ?? 0} annonces au total`,
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
    {
      title: 'Moyenne',
      dataIndex: 'average',
      key: 'average',
      render: (v: number) =>
        v != null ? (
          <span className={v >= 10 ? 'score--pass' : 'score--fail'}>{Number(v).toFixed(1)}/20</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  const quickActions = [
    { label: 'Gérer les élèves', icon: <TeamOutlined />, route: '/students', color: 'blue' },
    { label: 'Voir les notes', icon: <BookOutlined />, route: '/grades', color: 'green' },
    { label: 'Suivi absences', icon: <CalendarOutlined />, route: '/attendance', color: 'orange' },
    { label: 'Messagerie', icon: <MessageOutlined />, route: '/messaging', color: 'purple' },
    { label: 'Emploi du temps', icon: <ClockCircleOutlined />, route: '/timetable', color: 'cyan' },
    { label: 'Devoirs', icon: <FileTextOutlined />, route: '/homework', color: 'magenta' },
    { label: 'Analytiques', icon: <RiseOutlined />, route: '/analytics', color: 'gold' },
    { label: 'Paramètres', icon: <SettingOutlined />, route: '/settings', color: 'default' },
  ];

  return (
    <div className="page animate-fade-in">
      {/* Header with greeting */}
      <div className="page-header">
        <div className="page-header__info">
          <h1>{greeting}</h1>
          <p className="dashboard__date">
            <CalendarOutlined /> {formattedDate}
            <span className="dashboard__auto-refresh">
              <Tooltip title="Les données se mettent à jour automatiquement toutes les 60 secondes">
                <Tag color="green" className="dashboard__live-tag">● EN DIRECT</Tag>
              </Tooltip>
            </span>
          </p>
        </div>
        <div className="page-header__actions">
          {unreadNotifs > 0 && (
            <Badge count={unreadNotifs} size="small">
              <Button icon={<BellOutlined />} onClick={() => navigate('/announcements')}>
                Notifications
              </Button>
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid stagger-children">
        {stats.map((s) => (
          <Tooltip key={s.label} title={s.description} placement="bottom">
            <div
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
                <div className="stat-card__sub">{s.description}</div>
              </div>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid-main">
        {/* Left column */}
        <div className="flex-col gap-20">
          {/* Classes table */}
          <Card
            title={<span className="section-title"><BookOutlined /> Aperçu des classes</span>}
            extra={<Button type="link" onClick={() => navigate('/grades')}>Voir tout <ArrowRightOutlined /></Button>}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              columns={classColumns}
              dataSource={classData?.results || []}
              loading={classesLoading}
              pagination={false}
              rowKey={(r: Record<string, unknown>) => (r.id as string) || (r.name as string) || `class-${r.level}`}
              size="small"
              locale={{ emptyText: 'Aucune classe trouvée' }}
            />
          </Card>

          {/* Attendance overview card */}
          <Card title={<span className="section-title"><CalendarOutlined /> Présence du jour</span>}>
            {totalRecords > 0 ? (
              <div className="dashboard__attendance-overview">
                <div className="dashboard__attendance-progress">
                  <Progress
                    type="dashboard"
                    percent={attendanceRate}
                    strokeColor={attendanceRate >= 80 ? '#10B981' : attendanceRate >= 50 ? '#F59E0B' : '#EF4444'}
                    format={(pct) => <span className="dashboard__attendance-pct">{pct}%</span>}
                    size={120}
                  />
                </div>
                <div className="dashboard__attendance-stats">
                  <div className="dashboard__attendance-stat">
                    <span className="dashboard__attendance-dot dashboard__attendance-dot--present" />
                    Présents: <strong>{presentCount}</strong>
                  </div>
                  <div className="dashboard__attendance-stat">
                    <span className="dashboard__attendance-dot dashboard__attendance-dot--absent" />
                    Absents: <strong>{totalRecords - presentCount}</strong>
                  </div>
                  <div className="dashboard__attendance-stat">
                    Total: <strong>{totalRecords}</strong> enregistrements
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__desc">Aucune donnée de présence pour aujourd'hui</div>
                <Button type="primary" size="small" onClick={() => navigate('/attendance')} className="mt-8">
                  Saisir la présence
                </Button>
              </div>
            )}
          </Card>
        </div>

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
            title={
              <span className="section-title">
                <BellOutlined /> Annonces récentes
                {todayAnnouncements > 0 && (
                  <Badge count={todayAnnouncements} size="small" className="dashboard__badge-inline" />
                )}
              </span>
            }
            extra={<Button type="link" onClick={() => navigate('/announcements')}>Voir tout</Button>}
          >
            {announcementData?.results?.length ? (
              <div className="flex-col gap-12">
                {announcementData.results.slice(0, 4).map((a: Record<string, unknown>, i: number) => (
                  <div
                    key={(a.id as string) || i}
                    className="announcement-item"
                  >
                    <div className="announcement-item__left">
                      {(a.pinned as boolean) && <Tag color="gold" className="announcement-item__pin">Épinglée</Tag>}
                      <div className="announcement-item__title">
                        {(a.title as string) || 'Sans titre'}
                      </div>
                      <div className="announcement-item__excerpt">
                        {((a.content as string) || '').slice(0, 80)}
                        {((a.content as string) || '').length > 80 ? '...' : ''}
                      </div>
                    </div>
                    <div className="announcement-item__date">
                      {(a.created_at as string)
                        ? new Date(a.created_at as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                        : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon"><BellOutlined /></div>
                <div className="empty-state__title">Aucune annonce</div>
                <div className="empty-state__desc">Les annonces apparaîtront ici</div>
              </div>
            )}
          </Card>

          {/* Notifications */}
          {notifData?.results && notifData.results.length > 0 && (
            <Card title={<span className="section-title"><BellOutlined /> Notifications</span>}>
              <div className="flex-col gap-8">
                {notifData.results.slice(0, 5).map((n: Record<string, unknown>, i: number) => (
                  <div
                    key={(n.id as string) || i}
                    className={`notif-item ${!(n.is_read as boolean) ? 'notif-item--unread' : ''}`}
                  >
                    <div className="notif-item__content">
                      {(n.message as string) || (n.title as string) || 'Notification'}
                    </div>
                    {(n.created_at as string) ? (
                      <div className="notif-item__time">
                        {new Date(n.created_at as string).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : null}
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
