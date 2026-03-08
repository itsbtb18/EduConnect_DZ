import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Spin, Tag } from 'antd';
import {
  DashboardOutlined, DollarOutlined, TeamOutlined,
  FileTextOutlined, BarChartOutlined, WalletOutlined,
} from '@ant-design/icons';
import { useFinanceStats, usePayments, usePaymentStats } from '../../hooks/useApi';
import './RoleDashboard.css';

const FinanceManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: statsRaw, isLoading: statsLoading } = useFinanceStats();
  const { data: paymentsRaw, isLoading: paymentsLoading } = usePayments({ page_size: 10 });
  const { data: paymentStatsRaw } = usePaymentStats();

  const stats = statsRaw as any;
  const payments = useMemo(() => {
    const d = paymentsRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [paymentsRaw]);
  const pStats = paymentStatsRaw as any;

  const statCards = [
    {
      label: 'Revenus totaux',
      value: stats?.total_revenue ?? pStats?.total_collected ?? '—',
      icon: <DollarOutlined />,
      bg: '#ECFDF5', color: '#059669',
    },
    {
      label: 'Paiements du mois',
      value: stats?.monthly_payments ?? pStats?.this_month ?? '—',
      icon: <WalletOutlined />,
      bg: '#EFF6FF', color: '#2563EB',
    },
    {
      label: 'Impayés',
      value: stats?.unpaid_count ?? pStats?.pending ?? '—',
      icon: <FileTextOutlined />,
      bg: '#FEF2F2', color: '#EF4444',
    },
    {
      label: 'Élèves inscrits',
      value: stats?.total_students ?? '—',
      icon: <TeamOutlined />,
      bg: '#FFF7ED', color: '#EA580C',
    },
  ];

  const columns = [
    { title: 'Élève', dataIndex: 'student_name', key: 'student_name' },
    { title: 'Montant', dataIndex: 'amount', key: 'amount',
      render: (v: number) => `${Number(v || 0).toLocaleString()} DA` },
    { title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'PAID' ? 'green' : s === 'PARTIAL' ? 'orange' : 'red'}>
          {s === 'PAID' ? 'Payé' : s === 'PARTIAL' ? 'Partiel' : 'En attente'}
        </Tag>
      ),
    },
    { title: 'Date', dataIndex: 'created_at', key: 'date',
      render: (d: string) => d ? new Date(d).toLocaleDateString('fr-DZ') : '—' },
  ];

  return (
    <div className="rd-page">
      <div className="rd-header">
        <div className="rd-header__info">
          <h1><DollarOutlined style={{ color: '#EA580C' }} /> Tableau de bord Finance</h1>
          <div className="rd-header__subtitle">
            Gestion des frais, paiements et finances de l'établissement
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
        <Button type="primary" icon={<DollarOutlined />} onClick={() => navigate('/financial')}>
          Gestion des paiements
        </Button>
        <Button icon={<TeamOutlined />} onClick={() => navigate('/students')}>
          Voir les élèves
        </Button>
      </div>

      <div className="rd-section">
        <div className="rd-section__header">
          <h3 className="rd-section__title"><BarChartOutlined /> Derniers paiements</h3>
        </div>
        <div className="rd-section__body">
          <Table
            dataSource={payments}
            columns={columns}
            rowKey="id"
            loading={paymentsLoading}
            pagination={false}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default FinanceManagerDashboard;
