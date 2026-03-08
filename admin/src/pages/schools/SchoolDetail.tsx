import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Tabs, Descriptions, Tag, Button, Statistic, Row, Col, Table, Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  BankOutlined,
  TeamOutlined,
  CrownOutlined,
  BarChartOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useSchool, useUsers, useSubscription } from '../../hooks/useApi';
import { PageHeader, DataCard, LoadingSkeleton } from '../../components/ui';
import type { SchoolSubscription } from '../../types';
import '../superadmin/SuperAdmin.css';

const { Text } = Typography;

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  PRO_AI: 'Pro + AI',
};

const PLAN_TAG_COLORS: Record<string, string> = {
  STARTER: 'blue',
  PRO: 'gold',
  PRO_AI: 'purple',
};

const SchoolDetail: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const { data: school, isLoading } = useSchool(schoolId || '');
  const { data: subscription } = useSubscription(schoolId || '') as { data: SchoolSubscription | undefined };
  const { data: usersData } = useUsers(schoolId ? { school: schoolId } : undefined);

  if (isLoading) return <LoadingSkeleton variant="table" rows={10} />;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = school as any;
  if (!s) return null;

  const users = usersData?.results || [];
  const sections = [
    s.has_primary && 'Primaire',
    s.has_middle && 'CEM',
    s.has_high && 'Lycée',
  ].filter(Boolean);

  const activeModules = subscription
    ? [
        subscription.module_pedagogique && 'Pédagogique',
        subscription.module_empreintes && 'Empreintes',
        subscription.module_finance && 'Finance',
        subscription.module_cantine && 'Cantine',
        subscription.module_transport && 'Transport',
        subscription.module_auto_education && 'Auto-éducation',
        subscription.module_sms && 'SMS',
        subscription.module_bibliotheque && 'Bibliothèque',
        subscription.module_infirmerie && 'Infirmerie',
        subscription.module_mobile_apps && 'Apps Mobile',
        subscription.module_ai_chatbot && 'AI Chatbot',
      ].filter(Boolean)
    : [];

  const userColumns = [
    {
      title: 'Nom',
      key: 'name',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: unknown, r: any) => `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—',
    },
    { title: 'Téléphone', dataIndex: 'phone_number', key: 'phone' },
    {
      title: 'Rôle',
      dataIndex: 'role',
      key: 'role',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (role: any) => <Tag>{role}</Tag>,
    },
    {
      title: 'Actif',
      dataIndex: 'is_active',
      key: 'active',
      render: (a: boolean) => <Tag color={a ? 'green' : 'red'}>{a ? 'Oui' : 'Non'}</Tag>,
    },
  ];

  return (
    <div className="sa-page">
      <PageHeader
        title={s.name}
        subtitle={`${s.wilaya || ''} · ${s.school_category === 'TRAINING_CENTER' ? 'Centre de formation' : 'École privée'}`}
        icon={<BankOutlined />}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/platform/schools')}>
              Retour
            </Button>
            <Button
              type="primary"
              icon={<CrownOutlined />}
              onClick={() => navigate(`/platform/schools/${schoolId}/subscription`)}
            >
              Gérer l'abonnement
            </Button>
          </div>
        }
      />

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: (
              <span><BankOutlined /> Aperçu</span>
            ),
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* KPIs */}
                <Row gutter={16}>
                  <Col span={6}>
                    <DataCard>
                      <Statistic
                        title="Utilisateurs"
                        value={users.length}
                        prefix={<TeamOutlined />}
                      />
                    </DataCard>
                  </Col>
                  <Col span={6}>
                    <DataCard>
                      <Statistic
                        title="Plan"
                        value={PLAN_LABELS[s.subscription_plan] || s.subscription_plan}
                        prefix={<CrownOutlined />}
                      />
                    </DataCard>
                  </Col>
                  <Col span={6}>
                    <DataCard>
                      <Statistic
                        title="Modules actifs"
                        value={activeModules.length}
                        suffix="/ 11"
                      />
                    </DataCard>
                  </Col>
                  <Col span={6}>
                    <DataCard>
                      <Statistic
                        title="Statut"
                        value={s.is_active ? 'Actif' : 'Inactif'}
                        valueStyle={{ color: s.is_active ? '#10B981' : '#EF4444' }}
                      />
                    </DataCard>
                  </Col>
                </Row>

                {/* School Info */}
                <DataCard>
                  <Descriptions
                    title="Informations de l'école"
                    bordered
                    column={2}
                    size="small"
                  >
                    <Descriptions.Item label="Nom">{s.name}</Descriptions.Item>
                    <Descriptions.Item label="Sous-domaine">{s.subdomain}</Descriptions.Item>
                    <Descriptions.Item label={<><EnvironmentOutlined /> Adresse</>}>
                      {s.address || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label={<><EnvironmentOutlined /> Wilaya</>}>
                      {s.wilaya || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label={<><PhoneOutlined /> Tél.</>}>
                      {s.phone || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label={<><MailOutlined /> Email</>}>
                      {s.email || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label={<><GlobalOutlined /> Site web</>}>
                      {s.website || '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Catégorie">
                      {s.school_category === 'TRAINING_CENTER' ? 'Centre de formation' : 'École privée'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Sections">
                      {sections.length > 0
                        ? sections.map((sec) => <Tag key={String(sec)}>{String(sec)}</Tag>)
                        : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Max élèves">{s.max_students}</Descriptions.Item>
                    <Descriptions.Item label="Créé le">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('fr-FR') : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Setup">
                      <Tag color={s.setup_completed ? 'green' : 'orange'}>
                        {s.setup_completed ? 'Terminé' : 'En cours'}
                      </Tag>
                    </Descriptions.Item>
                    {s.notes && (
                      <Descriptions.Item label="Notes" span={2}>
                        <Text type="secondary">{s.notes}</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </DataCard>
              </div>
            ),
          },
          {
            key: 'subscription',
            label: (
              <span><CrownOutlined /> Abonnement</span>
            ),
            children: subscription ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <DataCard>
                  <Descriptions bordered column={2} size="small" title="Détails de l'abonnement">
                    <Descriptions.Item label="Plan">
                      <Tag color={PLAN_TAG_COLORS[s.subscription_plan]}>
                        {PLAN_LABELS[s.subscription_plan] || s.subscription_plan}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Statut">
                      <Tag color={subscription.is_active ? 'green' : 'red'}>
                        {subscription.is_active ? 'Actif' : 'Suspendu'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Début">
                      {subscription.subscription_start
                        ? new Date(subscription.subscription_start).toLocaleDateString('fr-FR')
                        : '—'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Fin">
                      {subscription.subscription_end
                        ? new Date(subscription.subscription_end).toLocaleDateString('fr-FR')
                        : 'Illimité'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total mensuel">
                      <Text strong>{subscription.monthly_total} DA</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Modules actifs">
                      {activeModules.length} / 11
                    </Descriptions.Item>
                  </Descriptions>
                </DataCard>

                <DataCard>
                  <div style={{ marginBottom: 12 }}>
                    <Text strong style={{ fontSize: 16 }}>Modules activés</Text>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {activeModules.length > 0
                      ? activeModules.map((m) => (
                          <Tag key={String(m)} color="green">{String(m)}</Tag>
                        ))
                      : <Text type="secondary">Aucun module activé</Text>}
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <Button
                      type="primary"
                      icon={<CrownOutlined />}
                      onClick={() => navigate(`/platform/schools/${schoolId}/subscription`)}
                    >
                      Gérer les modules
                    </Button>
                  </div>
                </DataCard>
              </div>
            ) : (
              <DataCard>
                <Text type="secondary">Aucun abonnement trouvé.</Text>
              </DataCard>
            ),
          },
          {
            key: 'users',
            label: (
              <span><TeamOutlined /> Utilisateurs ({users.length})</span>
            ),
            children: (
              <DataCard noPadding>
                <Table
                  columns={userColumns}
                  dataSource={users}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                  size="small"
                  className="sa-dark-table"
                  locale={{
                    emptyText: 'Aucun utilisateur pour cette école',
                  }}
                />
              </DataCard>
            ),
          },
          {
            key: 'stats',
            label: (
              <span><BarChartOutlined /> Statistiques</span>
            ),
            children: (
              <DataCard>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic title="Utilisateurs" value={users.length} />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Administrateurs"
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      value={users.filter((u: any) => u.role === 'ADMIN').length}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Enseignants"
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      value={users.filter((u: any) => u.role === 'TEACHER').length}
                    />
                  </Col>
                </Row>
              </DataCard>
            ),
          },
        ]}
      />
    </div>
  );
};

export default SchoolDetail;
