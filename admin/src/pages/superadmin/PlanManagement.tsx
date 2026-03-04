import React, { useState } from 'react';
import { Tag, Table, Button, Modal, Select, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CrownOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  BankOutlined,
  EditOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { usePlatformStats, useSchools, useUpdateSchool } from '../../hooks/useApi';
import {
  PageHeader,
  StatCard,
  DataCard,
  StatusBadge,
  EmptyState,
  LoadingSkeleton,
  SectionHeader,
} from '../../components/ui';
import './SuperAdmin.css';

/* ── Plan config ── */
const planConfig = [
  {
    key: 'STARTER',
    name: 'Starter',
    icon: <RocketOutlined />,
    cssClass: 'sa-plan-card-item--starter',
    color: 'blue' as const,
    description: 'Plan de base pour les petites ecoles',
    features: [
      'Gestion des eleves et enseignants',
      'Notes et bulletins',
      'Suivi des absences',
      'Messagerie de base',
      'Jusqu\'a 200 utilisateurs',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    icon: <CrownOutlined />,
    cssClass: 'sa-plan-card-item--pro',
    color: 'gold' as const,
    description: 'Plan professionnel pour les ecoles moyennes',
    features: [
      'Tout du plan Starter',
      'Finance et paiements',
      'Notifications avancees',
      'Analytiques detaillees',
      'Jusqu\'a 1000 utilisateurs',
      'Support prioritaire',
    ],
  },
  {
    key: 'PRO_AI',
    name: 'Pro + AI',
    icon: <ThunderboltOutlined />,
    cssClass: 'sa-plan-card-item--pro-ai',
    color: 'purple' as const,
    description: 'Plan premium avec intelligence artificielle',
    features: [
      'Tout du plan Pro',
      'Assistant IA pour les eleves',
      'Analyses predictives',
      'Chatbot intelligent',
      'Utilisateurs illimites',
      'Support dedie 24/7',
    ],
  },
];

const PLAN_TAG_COLORS: Record<string, string> = {
  STARTER: 'blue',
  PRO: 'gold',
  PRO_AI: 'purple',
};
const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  PRO_AI: 'Pro + AI',
};

interface SchoolRow {
  id: string;
  name: string;
  subdomain: string;
  subscription_plan: string;
  subscription_active: boolean;
  is_active: boolean;
  max_students: number;
}

const PlanManagement: React.FC = () => {
  const { data: stats } = usePlatformStats();
  const { data: schoolData, isLoading: schoolsLoading } = useSchools();
  const updateSchool = useUpdateSchool();

  // Change plan modal
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolRow | null>(null);
  const [newPlan, setNewPlan] = useState<string | undefined>();

  const planDist = stats?.schools?.plan_distribution || [];
  const getCount = (plan: string) => {
    const found = planDist.find(
      (p: { subscription_plan: string; count: number }) => p.subscription_plan === plan,
    );
    return found ? found.count : 0;
  };

  const totalSchools = stats?.schools?.total || 0;

  const handleToggleSubscription = (schoolId: string, currentActive: boolean) => {
    updateSchool.mutate(
      { id: schoolId, data: { subscription_active: !currentActive } },
      { onSuccess: () => message.success(currentActive ? 'Abonnement desactive' : 'Abonnement active') },
    );
  };

  const openChangePlan = (record: SchoolRow) => {
    setSelectedSchool(record);
    setNewPlan(undefined);
    setChangePlanOpen(true);
  };

  const handleChangePlan = () => {
    if (!selectedSchool || !newPlan) return;
    updateSchool.mutate(
      { id: selectedSchool.id, data: { subscription_plan: newPlan } },
      {
        onSuccess: () => {
          message.success('Plan mis a jour');
          setChangePlanOpen(false);
          setSelectedSchool(null);
        },
      },
    );
  };

  /* ── Table columns ── */
  const schoolColumns: ColumnsType<SchoolRow> = [
    {
      title: 'Ecole',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => (
        <div className="sa-cell">
          <div className="sa-cell__avatar sa-cell__avatar--school">
            {record.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ fontSize: 11, opacity: 0.5, fontFamily: 'var(--font-mono)' }}>{record.subdomain}.ilmi.dz</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'subscription_plan',
      key: 'plan',
      filters: planConfig.map(p => ({ text: p.name, value: p.key })),
      onFilter: (value, record) => record.subscription_plan === value,
      render: (plan: string) => (
        <Tag color={PLAN_TAG_COLORS[plan] || 'default'} style={{ borderRadius: 12, fontWeight: 600 }}>
          {PLAN_LABELS[plan] || plan}
        </Tag>
      ),
    },
    {
      title: 'Capacite',
      dataIndex: 'max_students',
      key: 'capacity',
      sorter: (a, b) => a.max_students - b.max_students,
      render: (v: number) => <span>{v} eleves</span>,
    },
    {
      title: 'Statut abonnement',
      key: 'status',
      filters: [{ text: 'Actif', value: true }, { text: 'Inactif', value: false }],
      onFilter: (value, record) => record.subscription_active === value,
      render: (_, record) => (
        <StatusBadge
          status={record.subscription_active ? 'active' : 'inactive'}
          label={record.subscription_active ? 'Actif' : 'Inactif'}
          dot
          size="sm"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            type={record.subscription_active ? 'default' : 'primary'}
            danger={record.subscription_active}
            onClick={() => handleToggleSubscription(record.id, record.subscription_active)}
          >
            {record.subscription_active ? 'Desactiver' : 'Activer'}
          </Button>
          <Button
            size="small"
            icon={<SwapOutlined />}
            onClick={() => openChangePlan(record)}
          >
            Changer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="sa-page">
      <PageHeader
        title="Abonnements & Plans"
        subtitle="Gerez les abonnements et assignez des plans aux ecoles"
        icon={<CrownOutlined />}
      />

      {/* ── Stats row ── */}
      <div className="sa-stats-grid">
        {planConfig.map((plan) => (
          <StatCard
            key={plan.key}
            icon={plan.icon}
            label={`Plan ${plan.name}`}
            value={getCount(plan.key)}
            sub={`sur ${totalSchools} ecole${totalSchools > 1 ? 's' : ''}`}
            variant={plan.key === 'STARTER' ? 'info' : plan.key === 'PRO' ? 'warning' : 'pink'}
          />
        ))}
      </div>

      {/* ── Plan feature cards ── */}
      <div className="sa-plans-grid">
        {planConfig.map((plan) => (
          <div key={plan.key} className={`sa-plan-card-item ${plan.cssClass}`}>
            <div className="sa-plan-card-item__icon">{plan.icon}</div>
            <div className="sa-plan-card-item__name">{plan.name}</div>
            <div className="sa-plan-card-item__desc">{plan.description}</div>
            <div className="sa-plan-features">
              {plan.features.map((f) => (
                <div key={f} className="sa-plan-feature">
                  <CheckCircleOutlined /> {f}
                </div>
              ))}
            </div>
            <div className="sa-plan-schools-count">{getCount(plan.key)}</div>
            <div className="sa-plan-schools-label">
              <BankOutlined /> Ecole{getCount(plan.key) !== 1 ? 's' : ''} sur ce plan
            </div>
          </div>
        ))}
      </div>

      {/* ── Schools + subscriptions table ── */}
      <SectionHeader
        title="Ecoles et abonnements"
        subtitle={`${(schoolData?.results || []).length} ecole(s)`}
        icon={<BankOutlined />}
      />

      {schoolsLoading ? (
        <LoadingSkeleton variant="table" rows={6} />
      ) : !(schoolData?.results || []).length ? (
        <EmptyState icon={<BankOutlined />} title="Aucune ecole" description="Aucune ecole enregistree." />
      ) : (
        <DataCard noPadding>
          <div className="sa-dark-table">
            <Table
              columns={schoolColumns}
              dataSource={(schoolData?.results || []) as unknown as SchoolRow[]}
              rowKey="id"
              pagination={{ pageSize: 10, showTotal: (t) => `${t} ecole(s)` }}
            />
          </div>
        </DataCard>
      )}

      {/* ── Change plan modal ── */}
      <Modal
        title={<span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}><SwapOutlined /> Changer le plan: {selectedSchool?.name}</span>}
        open={changePlanOpen}
        onCancel={() => { setChangePlanOpen(false); setSelectedSchool(null); }}
        onOk={handleChangePlan}
        okText="Confirmer"
        cancelText="Annuler"
        confirmLoading={updateSchool.isPending}
        className="um-modal"
        width={420}
      >
        <div style={{ marginBottom: 12, color: 'var(--text-secondary)' }}>
          Plan actuel: <Tag color={PLAN_TAG_COLORS[selectedSchool?.subscription_plan || '']} style={{ borderRadius: 12 }}>
            {PLAN_LABELS[selectedSchool?.subscription_plan || ''] || selectedSchool?.subscription_plan}
          </Tag>
        </div>
        <Select
          placeholder="Choisir le nouveau plan"
          value={newPlan}
          onChange={setNewPlan}
          style={{ width: '100%' }}
          size="large"
          options={planConfig
            .filter(p => p.key !== selectedSchool?.subscription_plan)
            .map(p => ({ value: p.key, label: p.name }))}
        />
      </Modal>
    </div>
  );
};

export default PlanManagement;
