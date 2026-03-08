import React, { useMemo } from 'react';
import { Tag, Table, Progress, Tooltip } from 'antd';
import {
  MessageOutlined,
  SendOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  BarChartOutlined,
  RiseOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useSMSAnalytics } from '../../hooks/useApi';
import { PageHeader, StatCard, DataCard, LoadingSkeleton, EmptyState, SectionHeader } from '../../components/ui';
import type { SMSAnalytics, SMSCampaign } from '../../types';

const eventTypeLabels: Record<string, string> = {
  ABSENCE: 'Absence',
  ARRIVAL: 'Arrivée',
  LOW_GRADE: 'Note basse',
  PAYMENT_REMINDER: 'Rappel paiement',
  PAYMENT_OVERDUE: 'Retard paiement',
  URGENT_ANNOUNCEMENT: 'Annonce urgente',
  EVENT_REMINDER: 'Rappel événement',
  WELCOME: 'Bienvenue',
  CAMPAIGN: 'Campagne',
  CUSTOM: 'Personnalisé',
};

const SMSDashboard: React.FC = () => {
  const { data: analytics, isLoading } = useSMSAnalytics();

  const stats = useMemo<SMSAnalytics | null>(() => analytics as SMSAnalytics | null, [analytics]);

  if (isLoading) return <LoadingSkeleton variant="table" rows={6} />;
  if (!stats) return <EmptyState icon={<MessageOutlined />} title="Aucune donnée SMS" description="Configurez votre passerelle SMS pour commencer." />;

  const balancePercent = stats.balance.quota > 0
    ? Math.round(((stats.balance.quota - stats.balance.remaining) / stats.balance.quota) * 100)
    : 0;

  const campaignColumns = [
    { title: 'Titre', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const colors: Record<string, string> = { DRAFT: 'default', SCHEDULED: 'blue', SENDING: 'processing', COMPLETED: 'green', CANCELLED: 'red' };
        return <Tag color={colors[s] || 'default'}>{s}</Tag>;
      },
    },
    { title: 'Destinataires', dataIndex: 'total_recipients', key: 'total_recipients' },
    {
      title: 'Livraison', dataIndex: 'delivery_rate', key: 'delivery_rate',
      render: (v: number) => <Progress percent={v} size="small" status={v > 80 ? 'success' : v > 50 ? 'normal' : 'exception'} />,
    },
    { title: 'Date', dataIndex: 'created_at', key: 'date', render: (d: string) => new Date(d).toLocaleDateString('fr-FR') },
  ];

  const eventColumns = [
    {
      title: 'Type', dataIndex: 'event_type', key: 'event_type',
      render: (t: string) => eventTypeLabels[t] || t,
    },
    { title: 'Nombre', dataIndex: 'count', key: 'count' },
  ];

  return (
    <div className="sa-page">
      <PageHeader
        title="SMS — Tableau de bord"
        subtitle="Vue d'ensemble de votre messagerie SMS"
        icon={<MessageOutlined />}
      />

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Solde SMS"
          value={stats.balance.remaining}
          sub={`/ ${stats.balance.quota}`}
          icon={<MessageOutlined />}
          variant={stats.balance.is_low ? 'danger' : 'success'}
        />
        <StatCard
          label="Envoyés ce mois"
          value={stats.monthly.total}
          icon={<SendOutlined />}
          variant="info"
        />
        <StatCard
          label="Taux de livraison"
          value={`${stats.monthly.delivery_rate}%`}
          icon={<CheckCircleOutlined />}
          variant={stats.monthly.delivery_rate > 80 ? 'success' : 'warning'}
        />
        <StatCard
          label="Coût mensuel"
          value={`${stats.monthly.total_cost.toLocaleString('fr-FR')} DA`}
          icon={<DollarOutlined />}
          variant="accent"
        />
      </div>

      {/* Balance bar */}
      {stats.balance.is_low && (
        <DataCard title="⚠️ Alerte solde bas" icon={<WarningOutlined />}>
          <p style={{ color: '#EF4444', fontWeight: 600 }}>
            Votre solde SMS est bas ({stats.balance.remaining} restant). Rechargez pour continuer à envoyer.
          </p>
        </DataCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <DataCard title="Consommation mensuelle" icon={<BarChartOutlined />}>
          <Tooltip title={`${stats.balance.quota - stats.balance.remaining} / ${stats.balance.quota} SMS utilisés`}>
            <Progress
              percent={balancePercent}
              strokeColor={balancePercent > 80 ? '#EF4444' : balancePercent > 50 ? '#F59E0B' : '#10B981'}
              format={() => `${balancePercent}%`}
              style={{ marginBottom: 16 }}
            />
          </Tooltip>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981' }}>{stats.monthly.delivered}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Livrés</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#3B82F6' }}>{stats.monthly.sent}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Envoyés</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#EF4444' }}>{stats.monthly.failed}</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>Échoués</div>
            </div>
          </div>
        </DataCard>

        <DataCard title="Évolution quotidienne" icon={<RiseOutlined />}>
          {stats.daily_chart.length === 0 ? (
            <EmptyState icon={<BarChartOutlined />} title="Pas encore de données" description="Les données apparaîtront ici après vos premiers envois." />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120 }}>
              {stats.daily_chart.map((d, i) => {
                const max = Math.max(...stats.daily_chart.map(x => x.count), 1);
                const h = Math.max((d.count / max) * 100, 4);
                return (
                  <Tooltip key={i} title={`${d.date}: ${d.count} SMS`}>
                    <div
                      style={{
                        flex: 1,
                        height: h,
                        backgroundColor: '#00C9A7',
                        borderRadius: 4,
                        minWidth: 8,
                      }}
                    />
                  </Tooltip>
                );
              })}
            </div>
          )}
        </DataCard>
      </div>

      {/* By event type */}
      <SectionHeader title="Répartition par type d'événement" />
      <DataCard>
        <Table
          dataSource={stats.by_event_type}
          columns={eventColumns}
          rowKey="event_type"
          pagination={false}
          size="small"
        />
      </DataCard>

      {/* Recent campaigns */}
      <SectionHeader title="Campagnes récentes" />
      <DataCard icon={<FileTextOutlined />}>
        {stats.recent_campaigns.length === 0 ? (
          <EmptyState icon={<SendOutlined />} title="Aucune campagne" description="Créez votre première campagne SMS." />
        ) : (
          <Table
            dataSource={stats.recent_campaigns as SMSCampaign[]}
            columns={campaignColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </DataCard>
    </div>
  );
};

export default SMSDashboard;
