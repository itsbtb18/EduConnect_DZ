import React from 'react';
import { Card, Spin, Empty } from 'antd';
import {
  TeamOutlined,
  SolutionOutlined,
  BookOutlined,
  DollarOutlined,
  RiseOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts';
import { useDashboardStats, useClasses, usePayments } from '../../hooks/useApi';

const COLORS = ['#1A6BFF', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'];

const AnalyticsPage: React.FC = () => {
  const { studentCount, teacherCount, classCount, paymentCount, isLoading } = useDashboardStats();
  const { data: classData, isLoading: classesLoading } = useClasses();
  const { data: paymentData } = usePayments({ page_size: 100 });

  const overviewData = [
    { name: 'Eleves', value: studentCount, icon: <TeamOutlined />, color: '#1A6BFF' },
    { name: 'Enseignants', value: teacherCount, icon: <SolutionOutlined />, color: '#10B981' },
    { name: 'Classes', value: classCount, icon: <BookOutlined />, color: '#F59E0B' },
    { name: 'Paiements', value: paymentCount, icon: <DollarOutlined />, color: '#6366F1' },
  ];

  // Build class distribution for charts
  const classResults = classData?.results || [];
  const classChartData = classResults.slice(0, 8).map((c: any) => ({
    name: (c.name as string) || 'Classe',
    effectif: (c.student_count as number) || 0,
  }));

  // Payment summary
  const payments = paymentData?.results || [];
  const paymentStatusData = [
    { name: 'Payes', value: payments.filter((p: any) => p.status === 'paid').length },
    { name: 'En attente', value: payments.filter((p: any) => p.status === 'pending' || p.status === 'unpaid').length },
    { name: 'Partiels', value: payments.filter((p: any) => p.status === 'partial').length },
    { name: 'En retard', value: payments.filter((p: any) => p.status === 'overdue').length },
  ].filter((d) => d.value > 0);

  if (isLoading) {
    return (
      <div className="page loading-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Analytiques</h1>
          <p>Statistiques et indicateurs de performance</p>
        </div>
      </div>

      {/* Overview numbers */}
      <div className="stats-grid stagger-children">
        {overviewData.map((item) => (
          <div key={item.name} className="stat-card">
            <div className="stat-card__icon" style={{ background: `${item.color}15`, color: item.color }}>
              {item.icon}
            </div>
            <div className="stat-card__content">
              <div className="stat-card__label">{item.name}</div>
              <div className="stat-card__value">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Effectif par classe */}
        <Card title={<span className="section-title"><BarChartOutlined /> Effectif par classe</span>}>
          {classChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={classChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="effectif" fill="#1A6BFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Aucune donnee de classe" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        {/* Payment distribution */}
        <Card title={<span className="section-title"><DollarOutlined /> Repartition des paiements</span>}>
          {paymentStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {paymentStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Aucune donnee de paiement" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;
