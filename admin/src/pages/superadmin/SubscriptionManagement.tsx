import React, { useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Switch,
  Modal,
  Input,
  Space,
  Descriptions,
  Spin,
  Select,
  DatePicker,
  Typography,
  Tabs,
  Timeline,
  Statistic,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { SchoolSubscription, ModuleActivationLog, SubscriptionInvoice, ModuleSlug } from '../../types';
import {
  useSubscription,
  useActivateModule,
  useDeactivateModule,
  useSuspendSchool,
  useSchoolInvoices,
  useGenerateInvoice,
  useMarkInvoicePaid,
  useModuleLogs,
} from '../../hooks/useApi';

const { Text, Title } = Typography;
const { TextArea } = Input;

const MODULE_LABELS: Record<ModuleSlug, string> = {
  pedagogique: 'Pédagogique (inclus)',
  empreintes: 'Empreintes digitales',
  finance: 'Finance & Paiements',
  cantine: 'Cantine',
  transport: 'Transport scolaire',
  auto_education: 'Auto-éducation',
  sms: 'SMS & Notifications',
  bibliotheque: 'Bibliothèque',
  infirmerie: 'Infirmerie',
  mobile_apps: 'Applications mobiles',
  ai_chatbot: 'Chatbot IA',
};

const MODULE_PRICES: Record<string, number> = {
  pedagogique: 0,
  empreintes: 2000,
  finance: 3000,
  cantine: 1500,
  transport: 2000,
  auto_education: 1000,
  sms: 500,
  bibliotheque: 1000,
  infirmerie: 1000,
  mobile_apps: 2000,
  ai_chatbot: 5000,
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  SENT: 'blue',
  PAID: 'green',
  OVERDUE: 'red',
  CANCELLED: 'gray',
};

const SubscriptionManagement: React.FC = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();

  const { data: subscription, isLoading } = useSubscription(schoolId || '');
  const { data: invoices } = useSchoolInvoices(schoolId || '');
  const { data: logs } = useModuleLogs(schoolId || '');

  const activateModule = useActivateModule();
  const deactivateModule = useDeactivateModule();
  const suspendSchool = useSuspendSchool();
  const generateInvoice = useGenerateInvoice();
  const markPaid = useMarkInvoicePaid();

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoicePeriod, setInvoicePeriod] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [moduleActionReason, setModuleActionReason] = useState('');
  const [confirmModule, setConfirmModule] = useState<{ slug: ModuleSlug; active: boolean } | null>(null);

  if (!schoolId) return null;
  if (isLoading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  const sub = subscription as SchoolSubscription | undefined;
  if (!sub) return <Text type="danger">Abonnement introuvable.</Text>;

  const handleModuleToggle = (slug: ModuleSlug, currentActive: boolean) => {
    if (slug === 'pedagogique') return;
    setConfirmModule({ slug, active: currentActive });
    setModuleActionReason('');
  };

  const confirmModuleAction = () => {
    if (!confirmModule) return;
    const fn = confirmModule.active ? deactivateModule : activateModule;
    fn.mutate(
      { schoolId, module: confirmModule.slug, reason: moduleActionReason },
      { onSuccess: () => setConfirmModule(null) }
    );
  };

  const handleSuspend = () => {
    suspendSchool.mutate(
      { schoolId, reason: suspendReason },
      { onSuccess: () => { setSuspendModalOpen(false); setSuspendReason(''); } }
    );
  };

  const handleGenerateInvoice = () => {
    if (!invoicePeriod[0] || !invoicePeriod[1]) return;
    generateInvoice.mutate(
      {
        schoolId,
        data: {
          period_start: invoicePeriod[0].format('YYYY-MM-DD'),
          period_end: invoicePeriod[1].format('YYYY-MM-DD'),
        },
      },
      { onSuccess: () => { setInvoiceModalOpen(false); setInvoicePeriod([null, null]); } }
    );
  };

  const moduleKeys = Object.keys(MODULE_LABELS) as ModuleSlug[];
  const activeCount = sub.active_modules?.length || 0;
  const monthlyTotal = moduleKeys.reduce((acc, slug) => {
    const field = `module_${slug}` as keyof SchoolSubscription;
    return acc + ((sub[field] as boolean) ? (MODULE_PRICES[slug] || 0) : 0);
  }, 0);

  const invoiceColumns = [
    { title: 'N°', dataIndex: 'invoice_number', key: 'invoice_number' },
    { title: 'Période', key: 'period', render: (_: unknown, r: SubscriptionInvoice) => `${r.period_start} → ${r.period_end}` },
    { title: 'Montant', dataIndex: 'total_amount', key: 'total_amount', render: (v: string) => `${v} DA` },
    { title: 'Statut', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={INVOICE_STATUS_COLORS[s] || 'default'}>{s}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: SubscriptionInvoice) =>
        record.status !== 'PAID' && record.status !== 'CANCELLED' ? (
          <Button
            size="small"
            type="primary"
            onClick={() => markPaid.mutate({ schoolId, invoiceId: record.id })}
            loading={markPaid.isPending}
          >
            Marquer payée
          </Button>
        ) : null,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/platform/schools')}>
          Retour
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          Gestion de l'abonnement — {sub.school_name}
        </Title>
      </Space>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: 'Vue d\'ensemble',
            icon: <ThunderboltOutlined />,
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 24 }}>
                  <Col span={6}>
                    <Card>
                      <Statistic title="Plan" value={sub.plan_name} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic
                        title="Statut"
                        value={sub.is_active ? 'Actif' : 'Suspendu'}
                        valueStyle={{ color: sub.is_active ? '#10B981' : '#EF4444' }}
                      />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic title="Modules actifs" value={`${activeCount} / ${moduleKeys.length}`} />
                    </Card>
                  </Col>
                  <Col span={6}>
                    <Card>
                      <Statistic title="Total mensuel" value={`${monthlyTotal.toLocaleString()} DA`} />
                    </Card>
                  </Col>
                </Row>

                <Card
                  title="Détails de l'abonnement"
                  extra={
                    <Space>
                      {sub.is_active && (
                        <Button danger icon={<StopOutlined />} onClick={() => setSuspendModalOpen(true)}>
                          Suspendre
                        </Button>
                      )}
                    </Space>
                  }
                >
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Début">{sub.subscription_start}</Descriptions.Item>
                    <Descriptions.Item label="Fin">{sub.subscription_end || 'Non définie'}</Descriptions.Item>
                    <Descriptions.Item label="Max étudiants">{sub.max_students}</Descriptions.Item>
                    <Descriptions.Item label="Raison suspension">{sub.suspension_reason || '—'}</Descriptions.Item>
                  </Descriptions>
                </Card>
              </>
            ),
          },
          {
            key: 'modules',
            label: 'Modules',
            icon: <ThunderboltOutlined />,
            children: (
              <Card title="Gestion des modules">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {moduleKeys.map((slug) => {
                    const field = `module_${slug}` as keyof SchoolSubscription;
                    const isActive = sub[field] as boolean;
                    const isCore = slug === 'pedagogique';
                    return (
                      <Card
                        key={slug}
                        size="small"
                        style={{
                          borderColor: isActive ? '#10B981' : '#E2E8F0',
                          borderWidth: 2,
                        }}
                      >
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <div>
                            <Text strong>{MODULE_LABELS[slug]}</Text>
                            <br />
                            <Text type="secondary">{MODULE_PRICES[slug]?.toLocaleString() || '0'} DA/mois</Text>
                          </div>
                          <Switch
                            checked={isActive}
                            disabled={isCore}
                            loading={activateModule.isPending || deactivateModule.isPending}
                            onChange={() => handleModuleToggle(slug, isActive)}
                          />
                        </Space>
                        {isActive ? (
                          <Tag color="green" icon={<CheckCircleOutlined />} style={{ marginTop: 8 }}>Actif</Tag>
                        ) : (
                          <Tag color="default" icon={<CloseCircleOutlined />} style={{ marginTop: 8 }}>Inactif</Tag>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </Card>
            ),
          },
          {
            key: 'invoices',
            label: 'Factures',
            icon: <FileTextOutlined />,
            children: (
              <Card
                title="Factures"
                extra={
                  <Button type="primary" onClick={() => setInvoiceModalOpen(true)}>
                    Générer une facture
                  </Button>
                }
              >
                <Table
                  dataSource={Array.isArray(invoices) ? invoices : []}
                  columns={invoiceColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
          {
            key: 'logs',
            label: 'Historique',
            icon: <HistoryOutlined />,
            children: (
              <Card title="Journal des activations">
                <Timeline
                  items={(Array.isArray(logs) ? logs : []).map((log: ModuleActivationLog) => ({
                    color: log.action === 'ACTIVATED' ? 'green' : 'red',
                    children: (
                      <div key={log.id}>
                        <Text strong>{MODULE_LABELS[log.module_name as ModuleSlug] || log.module_name}</Text>
                        {' — '}
                        <Tag color={log.action === 'ACTIVATED' ? 'green' : 'red'}>{log.action}</Tag>
                        <br />
                        <Text type="secondary">
                          Par {log.activated_by_name} — {dayjs(log.created_at).format('DD/MM/YYYY HH:mm')}
                        </Text>
                        {log.reason && <><br /><Text italic>Raison: {log.reason}</Text></>}
                        {log.prorata_amount !== '0.00' && (
                          <><br /><Text>Prorata: {log.prorata_amount} DA</Text></>
                        )}
                      </div>
                    ),
                  }))}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* ── Module confirmation modal ── */}
      <Modal
        title={confirmModule?.active ? 'Désactiver le module' : 'Activer le module'}
        open={!!confirmModule}
        onCancel={() => setConfirmModule(null)}
        onOk={confirmModuleAction}
        confirmLoading={activateModule.isPending || deactivateModule.isPending}
        okText={confirmModule?.active ? 'Désactiver' : 'Activer'}
        okButtonProps={confirmModule?.active ? { danger: true } : {}}
      >
        <p>
          {confirmModule?.active
            ? `Voulez-vous désactiver le module "${MODULE_LABELS[confirmModule.slug]}" ?`
            : `Voulez-vous activer le module "${confirmModule ? MODULE_LABELS[confirmModule.slug] : ''}" ?`}
        </p>
        <TextArea
          rows={3}
          placeholder="Raison (optionnelle)"
          value={moduleActionReason}
          onChange={(e) => setModuleActionReason(e.target.value)}
        />
      </Modal>

      {/* ── Suspend modal ── */}
      <Modal
        title="Suspendre l'école"
        open={suspendModalOpen}
        onCancel={() => setSuspendModalOpen(false)}
        onOk={handleSuspend}
        confirmLoading={suspendSchool.isPending}
        okText="Suspendre"
        okButtonProps={{ danger: true }}
      >
        <p>Cette action désactivera l'accès de l'école à la plateforme.</p>
        <TextArea
          rows={3}
          placeholder="Raison de la suspension (min 5 caractères)"
          value={suspendReason}
          onChange={(e) => setSuspendReason(e.target.value)}
        />
      </Modal>

      {/* ── Generate invoice modal ── */}
      <Modal
        title="Générer une facture"
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        onOk={handleGenerateInvoice}
        confirmLoading={generateInvoice.isPending}
        okText="Générer"
        okButtonProps={{ disabled: !invoicePeriod[0] || !invoicePeriod[1] }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text>Date de début</Text>
            <DatePicker
              style={{ width: '100%' }}
              value={invoicePeriod[0]}
              onChange={(d) => setInvoicePeriod([d, invoicePeriod[1]])}
            />
          </div>
          <div>
            <Text>Date de fin</Text>
            <DatePicker
              style={{ width: '100%' }}
              value={invoicePeriod[1]}
              onChange={(d) => setInvoicePeriod([invoicePeriod[0], d])}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default SubscriptionManagement;
