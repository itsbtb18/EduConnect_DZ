import React, { useState, useMemo } from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BarChartOutlined,
  RiseOutlined,
  TeamOutlined,
  BankOutlined,
  CrownOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { usePlatformStats, useSchools } from '../../hooks/useApi';
import {
  PageHeader,
  StatCard,
  DataCard,
  LoadingSkeleton,
  EmptyState,
  SectionHeader,
} from '../../components/ui';
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';
import './SuperAdmin.css';

const PLAN_COLORS: Record<string, string> = {
  STARTER: '#3B82F6',
  PRO: '#F59E0B',
  PRO_AI: '#A855F7',
  FREE: '#6B7280',
};
const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  PRO_AI: 'Pro + AI',
  FREE: 'Gratuit',
};

type RangePreset = '7d' | '30d' | '3m' | '1y' | 'all';

interface SchoolRecord {
  id: string;
  name: string;
  subscription_plan?: string;
  is_active?: boolean;
  student_count?: number;
  teacher_count?: number;
  created_at?: string;
  wilaya?: string;
}

const SuperAdminAnalytics: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: schoolsData, isLoading: schoolsLoading } = useSchools({ page_size: 100 });
  const [rangePreset, setRangePreset] = useState<RangePreset>('all');

  const isLoading = statsLoading || schoolsLoading;
  const schools = (schoolsData?.results || []) as unknown as SchoolRecord[];

  /* ── Date filtering ── */
  const filteredSchools = useMemo(() => {
    if (rangePreset === 'all') return schools;
    const now = new Date();
    const cutoff = new Date(now);
    if (rangePreset === '7d') cutoff.setDate(now.getDate() - 7);
    else if (rangePreset === '30d') cutoff.setDate(now.getDate() - 30);
    else if (rangePreset === '3m') cutoff.setMonth(now.getMonth() - 3);
    else if (rangePreset === '1y') cutoff.setFullYear(now.getFullYear() - 1);
    return schools.filter((s) => s.created_at && new Date(s.created_at) >= cutoff);
  }, [schools, rangePreset]);

  /* ── Plan distribution ── */
  const planCounts: Record<string, number> = {};
  schools.forEach((s) => {
    const plan = s.subscription_plan || 'STARTER';
    planCounts[plan] = (planCounts[plan] || 0) + 1;
  });
  const planData = Object.entries(planCounts).map(([name, value]) => ({
    name: PLAN_LABELS[name] || name,
    value,
    fill: PLAN_COLORS[name] || '#6B7280',
  }));

  /* ── Active vs inactive ── */
  const activeCount = schools.filter((s) => s.is_active !== false).length;
  const activePct = schools.length ? Math.round((activeCount / schools.length) * 100) : 0;

  /* ── Growth by month — two lines: schools and users ── */
  const monthMap: Record<string, { schools: number; users: number }> = {};
  schools.forEach((s) => {
    if (s.created_at) {
      const d = new Date(s.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap[key]) monthMap[key] = { schools: 0, users: 0 };
      monthMap[key].schools += 1;
      monthMap[key].users += (s.student_count || 0) + (s.teacher_count || 0);
    }
  });
  const growthData = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({
      month: new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      écoles: counts.schools,
      utilisateurs: counts.users,
    }));

  /* ── Schools by wilaya (horizontal bar) ── */
  const wilayaMap: Record<string, number> = {};
  schools.forEach((s) => {
    const w = s.wilaya || 'Non spécifiée';
    wilayaMap[w] = (wilayaMap[w] || 0) + 1;
  });
  const wilayaData = Object.entries(wilayaMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  /* ── Subscription lifecycle (stacked area) ── */
  const lifecycleData = growthData.map((d, i) => ({
    month: d.month,
    actives: d.écoles + (i > 0 ? (growthData[i - 1]?.écoles || 0) : 0),
    nouvelles: d.écoles,
    désactivées: 0,
  }));

  /* ── Top schools table ── */
  const topSchools = [...schools]
    .sort((a, b) => (b.student_count || 0) - (a.student_count || 0))
    .slice(0, 10);

  const topColumns: ColumnsType<SchoolRecord> = [
    { title: '#', width: 50, render: (_: unknown, __: unknown, i: number) => <span className="an-rank">{i + 1}</span> },
    {
      title: 'École',
      dataIndex: 'name',
      key: 'name',
      render: (n: string) => <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{n}</span>,
    },
    {
      title: 'Plan',
      dataIndex: 'subscription_plan',
      key: 'plan',
      render: (p: string) => (
        <Tag color={p === 'PRO_AI' ? 'purple' : p === 'PRO' ? 'gold' : 'blue'}>
          {PLAN_LABELS[p] || p || 'Starter'}
        </Tag>
      ),
    },
    {
      title: 'Étudiants',
      dataIndex: 'student_count',
      key: 'students',
      render: (v: number) => v ?? 0,
      sorter: (a, b) => (a.student_count || 0) - (b.student_count || 0),
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
      render: (v: boolean) => (
        <span className={`ui-status-badge ui-status-badge--${v !== false ? 'success' : 'danger'}`}>
          {v !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  /* ── Custom dark tooltip ── */
  const DarkTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="an-tooltip">
        <div className="an-tooltip__label">{label}</div>
        {payload.map((p: any, i: number) => (
          <div key={i} className="an-tooltip__row">
            <span className="an-tooltip__dot" style={{ background: p.color || p.stroke }} />
            <span>{p.name}: <strong>{p.value}</strong></span>
          </div>
        ))}
      </div>
    );
  };

  if (isLoading) return <LoadingSkeleton variant="table" rows={8} />;

  return (
    <div className="sa-page an-page">
      <PageHeader
        title="Analytiques Plateforme"
        subtitle="Vue d'ensemble des métriques et tendances"
        icon={<BarChartOutlined />}
        actions={
          <div className="an-date-bar">
            {(['7d', '30d', '3m', '1y', 'all'] as RangePreset[]).map((p) => (
              <button
                key={p}
                className={`an-date-btn ${rangePreset === p ? 'an-date-btn--active' : ''}`}
                onClick={() => setRangePreset(p)}
              >
                {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : p === '3m' ? '3 mois' : p === '1y' ? 'Cette année' : 'Tout'}
              </button>
            ))}
          </div>
        }
      />

      {/* ── Row 1: KPI Cards ── */}
      <div className="sa-stats-grid an-stats-5">
        <StatCard
          label="Total inscriptions"
          value={stats?.total_schools ?? schools.length}
          icon={<BankOutlined />}
          variant="info"
        />
        <StatCard
          label="Nouveaux ce mois"
          value={filteredSchools.length}
          icon={<CalendarOutlined />}
          variant="success"
          sub={rangePreset !== 'all' ? `(${rangePreset})` : undefined}
        />
        <StatCard
          label="Abonnements actifs"
          value={`${activePct}%`}
          icon={<CrownOutlined />}
          variant="warning"
          sub={`${activeCount}/${schools.length}`}
        />
        <StatCard
          label="Élèves totaux"
          value={stats?.total_students ?? schools.reduce((acc, s) => acc + (s.student_count || 0), 0)}
          icon={<TeamOutlined />}
          variant="pink"
        />
        <StatCard
          label="Croissance récente"
          value={stats?.growth_rate ? `${stats.growth_rate}%` : growthData.length > 1 ? `+${growthData[growthData.length - 1]?.écoles || 0}` : '—'}
          icon={<RiseOutlined />}
          variant="info"
        />
      </div>

      {/* ── Row 2: Growth Chart ── */}
      <DataCard title="Croissance mensuelle" icon={<RiseOutlined />} className="" >
        {growthData.length > 0 ? (
          <div className="an-chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={growthData}>
                <defs>
                  <linearGradient id="gradSchools" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#5A6A85', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                <YAxis yAxisId="left" tick={{ fill: '#5A6A85', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#5A6A85', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 13, paddingTop: 8 }} />
                <Line yAxisId="left" type="monotone" dataKey="écoles" name="Nouvelles écoles" stroke="#00C9A7" strokeWidth={2.5} dot={{ r: 4, fill: '#00C9A7' }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="utilisateurs" name="Nouveaux utilisateurs" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon={<BarChartOutlined />} title="Pas encore de données" description="Les tendances apparaîtront ici." />
        )}
      </DataCard>

      {/* ── Row 3: Wilaya bar + Plan donut ── */}
      <div className="an-grid-60-40">
        <DataCard title="Écoles par wilaya" icon={<BankOutlined />}>
          {wilayaData.length > 0 ? (
            <div className="an-chart-wrap">
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={wilayaData} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#5A6A85', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} width={120} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="count" name="Écoles" fill="#00C9A7" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState icon={<BarChartOutlined />} title="Aucune donnée wilaya" />
          )}
        </DataCard>

        <DataCard title="Répartition des plans" icon={<CrownOutlined />}>
          {planData.length > 0 ? (
            <div className="an-chart-wrap an-donut-wrap">
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="45%" innerRadius={65} outerRadius={100} paddingAngle={4} dataKey="value">
                    {planData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ color: '#94A3B8', fontSize: 13, paddingTop: 12 }}
                    formatter={(value: string) => {
                      const item = planData.find((d) => d.name === value);
                      const pct = schools.length ? Math.round(((item?.value || 0) / schools.length) * 100) : 0;
                      return `${value} — ${item?.value || 0} (${pct}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="an-donut-center">
                <span className="an-donut-center__num">{schools.length}</span>
                <span className="an-donut-center__label">Total</span>
              </div>
            </div>
          ) : (
            <EmptyState icon={<CrownOutlined />} title="Aucun plan trouvé" />
          )}
        </DataCard>
      </div>

      {/* ── Row 4: Subscription lifecycle ── */}
      <DataCard title="Cycle de vie des abonnements" icon={<RiseOutlined />}>
        {lifecycleData.length > 0 ? (
          <div className="an-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={lifecycleData}>
                <defs>
                  <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradChurn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#5A6A85', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                <YAxis tick={{ fill: '#5A6A85', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ color: '#94A3B8', fontSize: 13, paddingTop: 8 }} />
                <Area type="monotone" dataKey="actives" name="Actifs" stroke="#00C9A7" fill="url(#gradActive)" strokeWidth={2} />
                <Area type="monotone" dataKey="nouvelles" name="Nouveaux" stroke="#10B981" fill="url(#gradNew)" strokeWidth={2} />
                <Area type="monotone" dataKey="désactivées" name="Désactivés" stroke="#EF4444" fill="url(#gradChurn)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon={<BarChartOutlined />} title="Données insuffisantes" />
        )}
      </DataCard>

      {/* ── Top schools table ── */}
      <SectionHeader title="Top 10 Écoles par nombre d'étudiants" />
      <DataCard noPadding>
        <div className="sa-dark-table">
          <Table
            dataSource={topSchools}
            columns={topColumns}
            rowKey={(r) => r.id}
            pagination={false}
            size="small"
            locale={{ emptyText: <EmptyState icon={<BankOutlined />} title="Aucune école" /> }}
          />
        </div>
      </DataCard>
    </div>
  );
};

export default SuperAdminAnalytics;
