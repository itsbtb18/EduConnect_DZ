import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Tooltip } from 'antd';
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
  SettingOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { usePlatformStats } from '../../hooks/useApi';
import {
  StatCard,
  DataCard,
  SectionHeader,
  StatusBadge,
  PageHeader,
  LoadingSkeleton,
  GlassCard,
} from '../../components/ui';
import './SuperAdmin.css';

/* ─── Label / Color maps ─── */
const planColors: Record<string, string> = {
  STARTER: '#3B82F6',
  PRO: '#F59E0B',
  PRO_AI: '#A855F7',
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

/* ─── Component ─── */
const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = usePlatformStats();

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="sa-page">
        <div className="sa-stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <LoadingSkeleton key={i} variant="stat" />
          ))}
        </div>
        <div className="sa-middle-grid">
          <LoadingSkeleton variant="card" />
          <LoadingSkeleton variant="card" />
        </div>
      </div>
    );
  }

  /* ── Derived values ── */
  const totalSchools = stats?.schools?.total ?? 0;
  const activeSubscriptions = stats?.schools?.active_subscriptions ?? 0;
  const inactiveSubscriptions = stats?.schools?.inactive_subscriptions ?? 0;
  const totalUsers = stats?.users?.total ?? 0;
  const newUsers30d = stats?.users?.new_last_30d ?? 0;
  const newUsers7d = stats?.users?.new_last_7d ?? 0;
  const newSchools7d = stats?.schools?.new_last_7d ?? 0;

  const subscriptionRate =
    totalSchools > 0 ? Math.round((activeSubscriptions / totalSchools) * 100) : 0;

  /* ── Chart data ── */
  const chartData = (stats?.schools?.plan_distribution || []).map(
    (p: { subscription_plan: string; count: number }) => ({
      name: planLabels[p.subscription_plan] || p.subscription_plan,
      value: p.count,
      fill: planColors[p.subscription_plan] || '#3B82F6',
    }),
  );

  /* ── Quick actions ── */
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

  /* ── Table columns ── */
  const schoolColumns = [
    {
      title: 'École',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Record<string, unknown>) => (
        <div className="sa-cell">
          <div className="sa-cell__avatar sa-cell__avatar--school">
            {(name || '?')[0].toUpperCase()}
          </div>
          <div>
            <div className="sa-cell__name">{name}</div>
            <div className="sa-cell__sub">{record.subdomain as string}.ilmi.dz</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'subscription_plan',
      key: 'plan',
      render: (plan: string) => (
        <Tag
          color={planColors[plan] || '#3B82F6'}
          style={{ borderRadius: 20, fontWeight: 600, border: 'none' }}
        >
          {planLabels[plan] || plan}
        </Tag>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'subscription_active',
      key: 'status',
      render: (active: boolean) => (
        <StatusBadge
          status={active ? 'active' : 'inactive'}
          label={active ? 'Actif' : 'Inactif'}
        />
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
        <div className="sa-cell">
          <div className="sa-cell__avatar sa-cell__avatar--user">
            {((record.first_name as string) || '?')[0].toUpperCase()}
          </div>
          <span className="sa-cell__name">
            {record.first_name as string} {record.last_name as string}
          </span>
        </div>
      ),
    },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColors[role] || 'default'} style={{ borderRadius: 20, fontWeight: 600 }}>
          {roleLabels[role] || role}
        </Tag>
      ),
    },
    {
      title: 'École',
      dataIndex: 'school__name',
      key: 'school',
      render: (name: string) =>
        name || <span className="sa-text-muted">Plateforme</span>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString('fr-FR') : '—',
    },
  ];

  /* ══════════════ RENDER ══════════════ */
  return (
    <div className="sa-page">
      {/* ── Page header ── */}
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la plateforme ILMI"
        icon={<ThunderboltOutlined />}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => navigate('/platform/schools')}
          >
            Nouvelle école
          </Button>
        }
      />

      {/* ── Stat Cards ── */}
      <div className="sa-stats-grid">
        <StatCard
          icon={<BankOutlined />}
          label="Écoles"
          value={totalSchools}
          sub={<span className="sa-stat-up">+{newSchools7d} cette semaine</span>}
          variant="info"
          onClick={() => navigate('/platform/schools')}
        />
        <StatCard
          icon={<TeamOutlined />}
          label="Utilisateurs"
          value={totalUsers}
          sub={<span className="sa-stat-up">+{newUsers30d} ce mois</span>}
          variant="success"
          onClick={() => navigate('/platform/users')}
        />
        <StatCard
          icon={<CrownOutlined />}
          label="Abonnements actifs"
          value={activeSubscriptions}
          sub={<span>{subscriptionRate}% actifs</span>}
          variant="warning"
          onClick={() => navigate('/platform/plans')}
        />
        <StatCard
          icon={<RiseOutlined />}
          label="Nouveaux (7j)"
          value={newUsers7d}
          sub={<span>Dernière semaine</span>}
          variant="pink"
          onClick={() => navigate('/platform/users')}
        />
      </div>

      {/* ── Middle row: Chart + Quick actions ── */}
      <div className="sa-middle-grid">
        {/* Plan distribution chart */}
        <DataCard
          title="Distribution des plans"
          icon={<CrownOutlined />}
          extra={
            <div className="sa-health-pills">
              <span className="sa-health-pill sa-health-pill--active">
                <CheckCircleOutlined /> {activeSubscriptions} actifs
              </span>
              <span className="sa-health-pill sa-health-pill--inactive">
                <CloseCircleOutlined /> {inactiveSubscriptions} inactifs
              </span>
            </div>
          }
        >
          {chartData.length > 0 ? (
            <div className="sa-chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barSize={48} barGap={8}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.04)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#5A6A85', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      background: '#0F2044',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      color: '#F7F9FC',
                      fontSize: 13,
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    formatter={(value) => [`${value} école${Number(value) !== 1 ? 's' : ''}`, '']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry: { name: string; value: number; fill: string }, idx: number) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="sa-empty-mini">Aucune école enregistrée</div>
          )}
        </DataCard>

        {/* Quick actions + role summary */}
        <DataCard
          title="Actions rapides"
          icon={<ThunderboltOutlined />}
        >
          <div className="sa-quick-actions">
            {quickActions.map((a) => (
              <Tooltip key={a.label} title={a.desc}>
                <div className="sa-quick-action" onClick={() => navigate(a.route)}>
                  <div className="sa-quick-action__icon">{a.icon}</div>
                  <div className="sa-quick-action__label">{a.label}</div>
                </div>
              </Tooltip>
            ))}
          </div>

          {/* Users by role */}
          <div className="sa-role-summary">
            <SectionHeader title="Répartition par rôle" icon={<TeamOutlined />} />
            <div className="sa-role-tags">
              {(stats?.users?.by_role || []).map(
                (r: { role: string; count: number }) => (
                  <Tag
                    key={r.role}
                    color={roleColors[r.role] || 'default'}
                    style={{ borderRadius: 16, fontWeight: 600 }}
                  >
                    {roleLabels[r.role] || r.role}: {r.count}
                  </Tag>
                ),
              )}
            </div>
          </div>
        </DataCard>
      </div>

      {/* ── Tables row ── */}
      <div className="sa-tables-grid">
        <DataCard
          title="Écoles récentes"
          icon={<BankOutlined />}
          noPadding
          extra={
            <Button type="link" onClick={() => navigate('/platform/schools')}>
              Voir tout <ArrowRightOutlined />
            </Button>
          }
        >
          <Table
            columns={schoolColumns}
            dataSource={stats?.recent_schools || []}
            pagination={false}
            rowKey={(r: Record<string, unknown>) => r.id as string}
            size="small"
            locale={{ emptyText: 'Aucune école trouvée' }}
            className="sa-dark-table"
          />
        </DataCard>

        <DataCard
          title="Utilisateurs récents"
          icon={<TeamOutlined />}
          noPadding
          extra={
            <Button type="link" onClick={() => navigate('/platform/users')}>
              Voir tout <ArrowRightOutlined />
            </Button>
          }
        >
          <Table
            columns={userColumns}
            dataSource={stats?.recent_users || []}
            pagination={false}
            rowKey={(r: Record<string, unknown>) => r.id as string}
            size="small"
            locale={{ emptyText: 'Aucun utilisateur' }}
            className="sa-dark-table"
          />
        </DataCard>
      </div>

      {/* ── Platform footer ── */}
      <GlassCard className="sa-platform-footer">
        <div className="sa-platform-footer__inner">
          <div className="sa-platform-footer__logo">ILMI</div>
          <p className="sa-platform-footer__text">
            Plateforme de gestion scolaire multi-établissement — {totalSchools} école
            {totalSchools !== 1 ? 's' : ''}, {totalUsers} utilisateur
            {totalUsers !== 1 ? 's' : ''}
          </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default SuperAdminDashboard;
