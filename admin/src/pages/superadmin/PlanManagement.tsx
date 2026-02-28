import React from 'react';
import { Card, Tag, Table, Badge, Button, message } from 'antd';
import {
  CrownOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  BankOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { usePlatformStats, useSchools, useUpdateSchool } from '../../hooks/useApi';
import './SuperAdmin.css';

const planConfig = [
  {
    key: 'STARTER',
    name: 'Starter',
    icon: <RocketOutlined />,
    cssClass: 'sa-plan-card-item--starter',
    color: 'blue',
    description: 'Plan de base pour les petites écoles',
    features: [
      'Gestion des élèves et enseignants',
      'Notes et bulletins',
      'Suivi des absences',
      'Messagerie de base',
      'Jusqu\'à 200 utilisateurs',
    ],
  },
  {
    key: 'PRO',
    name: 'Pro',
    icon: <CrownOutlined />,
    cssClass: 'sa-plan-card-item--pro',
    color: 'gold',
    description: 'Plan professionnel pour les écoles moyennes',
    features: [
      'Tout du plan Starter',
      'Finance et paiements',
      'Notifications avancées',
      'Analytiques détaillées',
      'Jusqu\'à 1000 utilisateurs',
      'Support prioritaire',
    ],
  },
  {
    key: 'PRO_AI',
    name: 'Pro + AI',
    icon: <ThunderboltOutlined />,
    cssClass: 'sa-plan-card-item--pro-ai',
    color: 'purple',
    description: 'Plan premium avec intelligence artificielle',
    features: [
      'Tout du plan Pro',
      'Assistant IA pour les élèves',
      'Analyses prédictives',
      'Chatbot intelligent',
      'Utilisateurs illimités',
      'Support dédié 24/7',
    ],
  },
];

const PlanManagement: React.FC = () => {
  const { data: stats } = usePlatformStats();
  const { data: schoolData, isLoading: schoolsLoading } = useSchools();
  const updateSchool = useUpdateSchool();

  const planDist = stats?.schools?.plan_distribution || [];
  const getCount = (plan: string) => {
    const found = planDist.find(
      (p: { subscription_plan: string; count: number }) =>
        p.subscription_plan === plan,
    );
    return found ? found.count : 0;
  };

  const handleToggleSubscription = (schoolId: string, currentActive: boolean) => {
    updateSchool.mutate(
      { id: schoolId, data: { subscription_active: !currentActive } },
      {
        onSuccess: () => {
          message.success(
            currentActive ? 'Abonnement désactivé' : 'Abonnement activé',
          );
        },
      },
    );
  };

  const handleChangePlan = (schoolId: string, newPlan: string) => {
    updateSchool.mutate(
      { id: schoolId, data: { subscription_plan: newPlan } },
      {
        onSuccess: () => {
          message.success('Plan mis à jour');
        },
      },
    );
  };

  const schoolColumns = [
    {
      title: 'École',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-semibold">{name}</span>,
    },
    {
      title: 'Plan actuel',
      dataIndex: 'subscription_plan',
      key: 'plan',
      render: (plan: string) => {
        const cfg = planConfig.find((p) => p.key === plan);
        return (
          <Tag color={cfg?.color || 'default'}>
            {cfg?.name || plan}
          </Tag>
        );
      },
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
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Record<string, unknown>) => (
        <div className="flex gap-8">
          <Button
            size="small"
            type={record.subscription_active ? 'default' : 'primary'}
            danger={record.subscription_active as boolean}
            onClick={() =>
              handleToggleSubscription(
                record.id as string,
                record.subscription_active as boolean,
              )
            }
          >
            {record.subscription_active ? 'Désactiver' : 'Activer'}
          </Button>
          {planConfig
            .filter((p) => p.key !== record.subscription_plan)
            .map((p) => (
              <Button
                key={p.key}
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleChangePlan(record.id as string, p.key)}
              >
                → {p.name}
              </Button>
            ))}
        </div>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Gestion des plans</h1>
          <p>Gérez les abonnements et assignez des plans aux écoles</p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="sa-plans-grid stagger-children">
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
              <BankOutlined /> École{getCount(plan.key) !== 1 ? 's' : ''} sur ce plan
            </div>
          </div>
        ))}
      </div>

      {/* Schools table */}
      <Card
        title={
          <span className="section-title">
            <BankOutlined /> Écoles et abonnements
          </span>
        }
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={schoolColumns}
          dataSource={schoolData?.results || []}
          loading={schoolsLoading}
          rowKey={(r: Record<string, unknown>) => r.id as string}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Aucune école' }}
        />
      </Card>
    </div>
  );
};

export default PlanManagement;
