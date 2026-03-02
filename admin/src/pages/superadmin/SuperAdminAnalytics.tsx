import React from 'react';
import { Card, Spin, Tag, Progress, Table, Empty } from 'antd';
import {
  BarChartOutlined,
  RiseOutlined,
  TeamOutlined,
  BankOutlined,
  CrownOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { usePlatformStats, useSchools } from '../../hooks/useApi';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#10b981', '#f59e0b', '#ef4444'];

interface SchoolRecord {
  id: string;
  name: string;
  subscription_plan?: string;
  is_active?: boolean;
  student_count?: number;
  teacher_count?: number;
  created_at?: string;
}

const SuperAdminAnalytics: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: schoolsData, isLoading: schoolsLoading } = useSchools({ page_size: 100 });

  const isLoading = statsLoading || schoolsLoading;
  const schools = (schoolsData?.results || []) as unknown as SchoolRecord[];

  // Plan distribution data
  const planCounts: Record<string, number> = {};
  schools.forEach((s) => {
    const plan = s.subscription_plan || 'FREE';
    planCounts[plan] = (planCounts[plan] || 0) + 1;
  });
  const planData = Object.entries(planCounts).map(([name, value]) => ({ name, value }));

  // Active vs inactive
  const activeCount = schools.filter((s) => s.is_active !== false).length;
  const inactiveCount = schools.length - activeCount;
  const statusData = [
    { name: 'Actives', value: activeCount },
    { name: 'Inactives', value: inactiveCount },
  ];

  // Schools by month (from created_at)
  const monthMap: Record<string, number> = {};
  schools.forEach((s) => {
    if (s.created_at) {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    }
  });
  const growthData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      schools: count,
    }));

  // Student/Teacher distribution
  const sizeData = schools
    .filter((s) => s.student_count || s.teacher_count)
    .slice(0, 15)
    .map((s) => ({
      name: s.name?.slice(0, 15) || 'Ecole',
      étudiants: s.student_count || 0,
      enseignants: s.teacher_count || 0,
    }));

  // Role breakdown from stats
  const roleBreakdown = stats?.role_breakdown || stats?.roles || {};
  const roleData = Object.entries(roleBreakdown).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/^\w/, (c: string) => c.toUpperCase()),
    value: value as number,
  }));

  // Top schools by student count
  const topSchools = [...schools]
    .sort((a, b) => (b.student_count || 0) - (a.student_count || 0))
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="page sa-analytics-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>
            <BarChartOutlined style={{ marginRight: 10 }} />
            Analytiques Plateforme
          </h1>
          <p>Vue d'ensemble des métriques de la plateforme ILMI</p>
        </div>
      </div>

      {/* KPI row */}
      <div className="stat-grid">
        <Card size="small" className="stat-card">
          <BankOutlined style={{ fontSize: 28, color: 'var(--primary)', marginBottom: 8 }} />
          <div className="stat-value">{stats?.total_schools ?? schools.length}</div>
          <div className="stat-label">Écoles</div>
        </Card>
        <Card size="small" className="stat-card">
          <TeamOutlined style={{ fontSize: 28, color: 'var(--secondary)', marginBottom: 8 }} />
          <div className="stat-value">{stats?.total_users ?? '—'}</div>
          <div className="stat-label">Utilisateurs</div>
        </Card>
        <Card size="small" className="stat-card">
          <CrownOutlined style={{ fontSize: 28, color: '#f59e0b', marginBottom: 8 }} />
          <div className="stat-value">{stats?.active_subscriptions ?? activeCount}</div>
          <div className="stat-label">Abonnements actifs</div>
        </Card>
        <Card size="small" className="stat-card">
          <RiseOutlined style={{ fontSize: 28, color: 'var(--success)', marginBottom: 8 }} />
          <div className="stat-value">
            {stats?.growth_rate ? `${stats.growth_rate}%` : growthData.length > 1 ? `+${growthData[growthData.length - 1]?.schools || 0}` : '—'}
          </div>
          <div className="stat-label">Croissance récente</div>
        </Card>
      </div>

      {/* Charts row 1: Growth + Plan Pie */}
      <div className="sa-grid-2-1">
        <Card title={<><GlobalOutlined style={{ marginRight: 8 }} />Croissance des inscriptions</>}>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorSchools" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="schools"
                  name="Écoles inscrites"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorSchools)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Pas encore de données" />
          )}
        </Card>

        <Card title="Répartition des plans">
          {planData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={planData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {planData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun plan trouvé" />
          )}
        </Card>
      </div>

      {/* Charts row 2: School Size Distribution + Role Breakdown */}
      <div className="sa-grid-1-1">
        <Card title="Distribution étudiants / enseignants par école">
          {sizeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sizeData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="étudiants" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="enseignants" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Données insuffisantes" />
          )}
        </Card>

        <Card title="Répartition des rôles">
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="sa-padded-empty">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucune donnée de rôle" />
            </div>
          )}
        </Card>
      </div>

      {/* School activity + plan bars */}
      <div className="sa-grid-1-1">
        {/* Activity status */}
        <Card title="Statut des écoles">
          <div className="sa-sub-row">
            <div className="flex-1">
              <div className="sa-sub-label">Actives</div>
              <Progress
                percent={schools.length ? Math.round((activeCount / schools.length) * 100) : 0}
                strokeColor="#10b981"
                size="small"
              />
            </div>
            <div className="flex-1">
              <div className="sa-sub-label">Inactives</div>
              <Progress
                percent={schools.length ? Math.round((inactiveCount / schools.length) * 100) : 0}
                strokeColor="#ef4444"
                size="small"
              />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#ef4444" />
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Plan tier breakdown */}
        <Card title="Détails des plans">
          <div className="sa-plan-col">
            {['STARTER', 'PRO', 'PRO_AI'].map((plan) => {
              const count = planCounts[plan] || 0;
              const pct = schools.length ? Math.round((count / schools.length) * 100) : 0;
              const colorMap: Record<string, string> = {
                STARTER: '#6366f1',
                PRO: '#f59e0b',
                PRO_AI: '#10b981',
              };
              const labelMap: Record<string, string> = {
                STARTER: 'Starter',
                PRO: 'Pro',
                PRO_AI: 'Pro + AI',
              };
              return (
                <div key={plan}>
                  <div className="sa-plan-bar-row">
                    <span className="font-medium">{labelMap[plan] || plan}</span>
                    <span className="text-gray">
                      {count} école{count !== 1 ? 's' : ''} ({pct}%)
                    </span>
                  </div>
                  <Progress
                    percent={pct}
                    showInfo={false}
                    strokeColor={colorMap[plan] || '#6366f1'}
                    size="small"
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Top schools table */}
      <Card title="Top 10 Écoles par nombre d'étudiants" style={{ marginBottom: 20 }}>
        <Table
          dataSource={topSchools}
          rowKey={(r) => r.id}
          pagination={false}
          size="small"
          columns={[
            {
              title: '#',
              width: 50,
              render: (_: unknown, __: unknown, i: number) => i + 1,
            },
            {
              title: 'École',
              dataIndex: 'name',
              key: 'name',
              render: (n: string) => <span className="font-medium">{n}</span>,
            },
            {
              title: 'Plan',
              dataIndex: 'subscription_plan',
              key: 'plan',
              render: (p: string) => {
                const colorMap: Record<string, string> = {
                  STARTER: 'blue',
                  PRO: 'gold',
                  PRO_AI: 'green',
                };
                const labelMap: Record<string, string> = {
                  STARTER: 'Starter',
                  PRO: 'Pro',
                  PRO_AI: 'Pro + AI',
                };
                return <Tag color={colorMap[p] || 'default'}>{labelMap[p] || p || 'Starter'}</Tag>;
              },
            },
            {
              title: 'Étudiants',
              dataIndex: 'student_count',
              key: 'students',
              render: (v: number) => v ?? 0,
              sorter: (a: SchoolRecord, b: SchoolRecord) => (a.student_count || 0) - (b.student_count || 0),
            },
            {
              title: 'Enseignants',
              dataIndex: 'teacher_count',
              key: 'teachers',
              render: (v: number) => v ?? 0,
            },
            {
              title: 'Statut',
              dataIndex: 'is_active',
              key: 'active',
              render: (v: boolean) =>
                v !== false ? (
                  <Tag color="success">Active</Tag>
                ) : (
                  <Tag color="error">Inactive</Tag>
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default SuperAdminAnalytics;