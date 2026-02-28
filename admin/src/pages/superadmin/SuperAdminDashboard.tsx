import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Spin, Button, Progress, Badge, Avatar, Tooltip } from 'antd';
import {
  BankOutlined,
  TeamOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { usePlatformStats } from '../../hooks/useApi';
import './SuperAdmin.css';

const planColors: Record<string, string> = {
  STARTER: 'blue',
  PRO: 'gold',
  PRO_AI: 'purple',
};

const planLabels: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  PRO_AI: 'Pro + AI',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Administrateur',
  SECTION_ADMIN: 'Admin Section',
  TEACHER: 'Enseignant',
  PARENT: 'Parent',
  STUDENT: 'Élève',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'red',
  ADMIN: 'blue',
  SECTION_ADMIN: 'cyan',
  TEACHER: 'green',
  PARENT: 'orange',
  STUDENT: 'purple',
};

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = usePlatformStats();

  if (isLoading) {
    return (
      <div className="sa-loading">
        <Spin size="large" />
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  const totalSchools = stats?.schools?.total ?? 0;
  const activeSubscriptions = stats?.schools?.active_subscriptions ?? 0;
  const totalUsers = stats?.users?.total ?? 0;
  const newUsers30d = stats?.users?.new_last_30d ?? 0;
  const newUsers7d = stats?.users?.new_last_7d ?? 0;
  const newSchools7d = stats?.schools?.new_last_7d ?? 0;

  const subscriptionRate = totalSchools > 0
    ? Math.round((activeSubscriptions / totalSchools) * 100)
    : 0;

  const statCards = [
    {
      label: 'Écoles',
      value: totalSchools,
      icon: <BankOutlined />,
      colorClass: 'sa-stat--schools',
      route: '/platform/schools',
      subtitle: `+${newSchools7d} cette semaine`,
    },
    {
      label: 'Utilisateurs',
      value: totalUsers,
      icon: <TeamOutlined />,
      colorClass: 'sa-stat--users',
      route: '/platform/users',
      subtitle: `+${newUsers30d} ce mois`,
    },
    {
      label: 'Abonnements actifs',
      value: activeSubscriptions,
      icon: <CrownOutlined />,
      colorClass: 'sa-stat--subscriptions',
      route: '/platform/schools',
      subtitle: `${subscriptionRate}% actifs`,
    },
    {
      label: 'Nouveaux (7j)',
      value: newUsers7d,
      icon: <RiseOutlined />,
      colorClass: 'sa-stat--growth',
      route: '/platform/users',
      subtitle: 'Dernière semaine',
    },
  ];

  const schoolColumns = [
    {
      title: 'École',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Record<string, unknown>) => (
        <div className="sa-school-cell">
          <Avatar className="sa-school-avatar" size="small">
            {(name || '?')[0].toUpperCase()}
          </Avatar>
          <div>
            <div className="sa-school-name">{name}</div>
            <div className="sa-school-subdomain">{record.subdomain as string}.educonnect.dz</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'subscription_plan',
      key: 'plan',
      render: (plan: string) => (
        <Tag color={planColors[plan] || 'default'} className="sa-plan-tag">
          {planLabels[plan] || plan}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'subscription_active',
      key: 'status',
      render: (active: boolean) =>
        active ? (
          <Badge status="success" text="Actif" />
        ) : (
          <Badge status="error" text="Inactif" />
        ),
    },
    {
      title: 'Créée le',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString('fr-FR') : '—',
    },
  ];

  const userColumns = [
    {
      title: 'Utilisateur',
      key: 'name',
      render: (_: unknown, record: Record<string, unknown>) => (
        <div className="sa-user-cell">
          <Avatar className="sa-user-avatar" size="small">
            {((record.first_name as string) || '?')[0].toUpperCase()}
          </Avatar>
          <span>{record.first_name as string} {record.last_name as string}</span>
        </div>
      ),
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColors[role] || 'default'}>
          {roleLabels[role] || role}
        </Tag>
      ),
    },
    {
      title: 'École',
      dataIndex: 'school__name',
      key: 'school',
      render: (name: string) => name || <span className="sa-muted">Plateforme</span>,
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone_number',
      key: 'phone',
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString('fr-FR') : '—',
    },
  ];

  const quickActions = [
    {
      label: 'Ajouter une école',
      icon: <PlusOutlined />,
      route: '/platform/schools',
      desc: 'Créer un nouvel établissement',
    },
    {
      label: 'Gérer les utilisateurs',
      icon: <UserAddOutlined />,
      route: '/platform/users',
      desc: 'Administrer les comptes',
    },
    {
      label: 'Abonnements',
      icon: <CrownOutlined />,
      route: '/platform/plans',
      desc: 'Gérer les plans',
    },
    {
      label: 'Paramètres',
      icon: <SettingOutlined />,
      route: '/platform/settings',
      desc: 'Configuration plateforme',
    },
  ];

  return (
    <div className="page animate-fade-in">
      {/* Header */}
      <div className="sa-dashboard-header">
        <div className="sa-dashboard-header__info">
          <div className="sa-dashboard-header__badge">
            <SafetyCertificateOutlined /> Super Admin
          </div>
          <h1>Tableau de bord plateforme</h1>
          <p>Vue d&apos;ensemble de la plateforme EduConnect Algeria</p>
        </div>
        <div className="sa-dashboard-header__actions">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/platform/schools')}
          >
            Nouvelle école
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="sa-stats-grid stagger-children">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`sa-stat-card card-interactive ${s.colorClass}`}
            onClick={() => navigate(s.route)}
          >
            <div className="sa-stat-card__icon">{s.icon}</div>
            <div className="sa-stat-card__content">
              <div className="sa-stat-card__value">{s.value}</div>
              <div className="sa-stat-card__label">{s.label}</div>
              <div className="sa-stat-card__subtitle">{s.subtitle}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: Plan distribution + Quick actions */}
      <div className="sa-middle-grid">
        {/* Plan distribution */}
        <Card
          title={
            <span className="section-title">
              <CrownOutlined /> Distribution des plans
            </span>
          }
          className="sa-plan-card"
        >
          <div className="sa-plan-distribution">
            {(stats?.schools?.plan_distribution || []).map(
              (p: { subscription_plan: string; count: number }) => {
                const pct = totalSchools > 0 ? Math.round((p.count / totalSchools) * 100) : 0;
                return (
                  <div key={p.subscription_plan} className="sa-plan-item">
                    <div className="sa-plan-item__header">
                      <Tag color={planColors[p.subscription_plan] || 'default'}>
                        {planLabels[p.subscription_plan] || p.subscription_plan}
                      </Tag>
                      <span className="sa-plan-item__count">
                        {p.count} école{p.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Progress
                      percent={pct}
                      strokeColor={
                        p.subscription_plan === 'PRO_AI'
                          ? '#722ed1'
                          : p.subscription_plan === 'PRO'
                            ? '#faad14'
                            : '#1677ff'
                      }
                      showInfo={true}
                      size="small"
                    />
                  </div>
                );
              },
            )}
            {(!stats?.schools?.plan_distribution || stats.schools.plan_distribution.length === 0) && (
              <div className="sa-empty-mini">Aucune école enregistrée</div>
            )}
          </div>

          {/* Subscription health */}
          <div className="sa-subscription-health">
            <div className="sa-health-item sa-health-item--active">
              <CheckCircleOutlined />
              <span>{activeSubscriptions} actifs</span>
            </div>
            <div className="sa-health-item sa-health-item--inactive">
              <CloseCircleOutlined />
              <span>{stats?.schools?.inactive_subscriptions ?? 0} inactifs</span>
            </div>
          </div>
        </Card>

        {/* Quick actions */}
        <Card
          title={
            <span className="section-title">
              <ThunderboltOutlined /> Actions rapides
            </span>
          }
          className="sa-actions-card"
        >
          <div className="sa-quick-actions">
            {quickActions.map((a) => (
              <Tooltip key={a.label} title={a.desc}>
                <div
                  className="sa-quick-action card-interactive"
                  onClick={() => navigate(a.route)}
                >
                  <div className="sa-quick-action__icon">{a.icon}</div>
                  <div className="sa-quick-action__label">{a.label}</div>
                </div>
              </Tooltip>
            ))}
          </div>

          {/* Users by role summary */}
          <div className="sa-role-summary">
            <h4>
              <TeamOutlined /> Répartition par rôle
            </h4>
            <div className="sa-role-tags">
              {(stats?.users?.by_role || []).map(
                (r: { role: string; count: number }) => (
                  <Tag
                    key={r.role}
                    color={roleColors[r.role] || 'default'}
                    className="sa-role-tag"
                  >
                    {roleLabels[r.role] || r.role}: {r.count}
                  </Tag>
                ),
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Tables row */}
      <div className="sa-tables-grid">
        {/* Recent schools */}
        <Card
          title={
            <span className="section-title">
              <BankOutlined /> Écoles récentes
            </span>
          }
          extra={
            <Button
              type="link"
              onClick={() => navigate('/platform/schools')}
            >
              Voir tout <ArrowRightOutlined />
            </Button>
          }
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={schoolColumns}
            dataSource={stats?.recent_schools || []}
            pagination={false}
            rowKey={(r: Record<string, unknown>) => r.id as string}
            size="small"
            locale={{ emptyText: 'Aucune école trouvée' }}
          />
        </Card>

        {/* Recent users */}
        <Card
          title={
            <span className="section-title">
              <TeamOutlined /> Utilisateurs récents
            </span>
          }
          extra={
            <Button
              type="link"
              onClick={() => navigate('/platform/users')}
            >
              Voir tout <ArrowRightOutlined />
            </Button>
          }
          styles={{ body: { padding: 0 } }}
        >
          <Table
            columns={userColumns}
            dataSource={stats?.recent_users || []}
            pagination={false}
            rowKey={(r: Record<string, unknown>) => r.id as string}
            size="small"
            locale={{ emptyText: 'Aucun utilisateur' }}
          />
        </Card>
      </div>

      {/* Platform info footer */}
      <Card className="sa-platform-info">
        <div className="sa-platform-info__content">
          <GlobalOutlined className="sa-platform-info__icon" />
          <div>
            <h3>EduConnect Algeria</h3>
            <p>
              Plateforme de gestion scolaire multi-établissement — {totalSchools} école{totalSchools !== 1 ? 's' : ''},{' '}
              {totalUsers} utilisateur{totalUsers !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
