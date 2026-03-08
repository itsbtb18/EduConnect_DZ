/**
 * Formation Finance — Training Center
 * Per-formation pricing, payments, reminders, trainer salaries, profitability
 */
import React, { useState } from 'react';
import {
  Card, Table, Button, Tag, Drawer, Form, Select, Space,
  Row, Col, InputNumber, DatePicker, Input, Tabs, Statistic,
  Modal, Descriptions, message,
} from 'antd';
import {
  PlusOutlined, ReloadOutlined, DollarOutlined,
  DownloadOutlined, WalletOutlined, PieChartOutlined,
  UserOutlined, BankOutlined,
} from '@ant-design/icons';
import {
  useFeeStructures, useCreateFeeStructure,
  useLearnerPayments, useCreateLearnerPayment,
  useDiscounts, useCreateDiscount,
  useTrainerSalaryConfigs,
  usePayslips, useGeneratePayslip,
  useFormationFinanceStats, useFormations,
} from '../../hooks/useFormation';
import {
  PAYMENT_STATUS_OPTIONS, BILLING_CYCLE_OPTIONS,
  PAYSLIP_STATUS_OPTIONS,
} from '../../constants/training-center';
import type {
  FormationFeeStructure, LearnerPayment, Discount,
  TrainerPaySlip, FormationFinanceStats,
} from '../../types/formation';
import dayjs from 'dayjs';

const FormationFinance: React.FC = () => {
  // Fee structure state
  const [feeDrawer, setFeeDrawer] = useState(false);
  const [feeForm] = Form.useForm();
  // Payment state
  const [payDrawer, setPayDrawer] = useState(false);
  const [payForm] = Form.useForm();
  // Discount state
  const [discountModal, setDiscountModal] = useState(false);
  const [discountForm] = Form.useForm();
  // Payslip state
  const [payslipModal, setPayslipModal] = useState(false);
  const [payslipForm] = Form.useForm();

  const { data: stats } = useFormationFinanceStats();
  const { data: fees, refetch: refetchFees } = useFeeStructures();
  const { data: payments, refetch: refetchPay } = useLearnerPayments();
  const { data: discounts, refetch: refetchDisc } = useDiscounts();
  const { data: salaryConfigs } = useTrainerSalaryConfigs();
  const { data: payslips, refetch: refetchPayslips } = usePayslips();
  const { data: formations } = useFormations();

  const feeList = (fees?.results || []) as FormationFeeStructure[];
  const paymentList = (payments?.results || []) as LearnerPayment[];
  const discountList = (discounts?.results || []) as Discount[];
  const payslipList = (payslips?.results || []) as TrainerPaySlip[];
  const formationList = (formations?.results || []) as { id: string; name: string }[];
  const financeStats = (stats || {}) as FormationFinanceStats;

  const createFee = useCreateFeeStructure();
  const createPayment = useCreateLearnerPayment();
  const createDiscount = useCreateDiscount();
  const generatePayslip = useGeneratePayslip();

  const handleFeeSubmit = async () => {
    const values = await feeForm.validateFields();
    await createFee.mutateAsync(values);
    setFeeDrawer(false);
    feeForm.resetFields();
  };

  const handlePaySubmit = async () => {
    const values = await payForm.validateFields();
    await createPayment.mutateAsync({
      ...values,
      payment_date: values.payment_date?.format('YYYY-MM-DD'),
    });
    setPayDrawer(false);
    payForm.resetFields();
  };

  const handleDiscountSubmit = async () => {
    const values = await discountForm.validateFields();
    await createDiscount.mutateAsync({
      ...values,
      valid_from: values.valid_from?.format('YYYY-MM-DD'),
      valid_until: values.valid_until?.format('YYYY-MM-DD'),
    });
    setDiscountModal(false);
    discountForm.resetFields();
  };

  const handlePayslipGenerate = async () => {
    const values = await payslipForm.validateFields();
    await generatePayslip.mutateAsync(values);
    setPayslipModal(false);
    payslipForm.resetFields();
  };

  const totalRevenue = paymentList
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = paymentList
    .filter(p => p.status === 'PENDING')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPayroll = payslipList
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.net_salary || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>Finance — Formation</h1>
          <p style={{ color: '#64748b', margin: '4px 0 0' }}>Tarification, paiements, salaires et rentabilité</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { refetchFees(); refetchPay(); refetchDisc(); refetchPayslips(); }}>
            Actualiser
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Revenus encaissés" value={totalRevenue} suffix="DA"
              prefix={<DollarOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Paiements en attente" value={pendingAmount} suffix="DA"
              prefix={<WalletOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ color: '#F59E0B' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Masse salariale" value={totalPayroll} suffix="DA"
              prefix={<BankOutlined style={{ color: '#EF4444' }} />}
              valueStyle={{ color: '#EF4444' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic title="Résultat net" value={totalRevenue - totalPayroll} suffix="DA"
              prefix={<PieChartOutlined style={{ color: totalRevenue - totalPayroll >= 0 ? '#10B981' : '#EF4444' }} />}
              valueStyle={{ color: totalRevenue - totalPayroll >= 0 ? '#10B981' : '#EF4444' }} />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="fees" items={[
        {
          key: 'fees',
          label: 'Tarifications',
          children: (
            <Card style={{ borderRadius: 12 }}
              extra={<Button type="primary" size="small" icon={<PlusOutlined />}
                onClick={() => setFeeDrawer(true)}>Nouvelle tarification</Button>}>
              <Table
                dataSource={feeList}
                columns={[
                  { title: 'Nom', dataIndex: 'name', key: 'name' },
                  { title: 'Formation', dataIndex: 'formation_name', key: 'formation' },
                  { title: 'Montant', dataIndex: 'amount', key: 'amount',
                    render: (v: number) => `${v?.toLocaleString()} DA` },
                  { title: 'Cycle', dataIndex: 'billing_cycle', key: 'cycle',
                    render: (v: string) => BILLING_CYCLE_OPTIONS.find(o => o.value === v)?.label || v },
                  { title: 'Frais inscr.', dataIndex: 'registration_fee', key: 'reg',
                    render: (v: number) => `${v?.toLocaleString()} DA` },
                  { title: 'Actif', dataIndex: 'is_active', key: 'active',
                    render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Oui' : 'Non'}</Tag> },
                ]}
                rowKey="id" size="small" pagination={{ pageSize: 10 }}
              />
            </Card>
          ),
        },
        {
          key: 'payments',
          label: 'Paiements',
          children: (
            <Card style={{ borderRadius: 12 }}
              extra={<Button type="primary" size="small" icon={<PlusOutlined />}
                onClick={() => setPayDrawer(true)}>Enregistrer un paiement</Button>}>
              <Table
                dataSource={paymentList}
                columns={[
                  { title: 'Apprenant', dataIndex: 'learner_name', key: 'learner' },
                  { title: 'Groupe', dataIndex: 'group_name', key: 'group' },
                  { title: 'Montant', dataIndex: 'amount', key: 'amount',
                    render: (v: number) => `${v?.toLocaleString()} DA` },
                  { title: 'Date', dataIndex: 'payment_date', key: 'date',
                    render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                  { title: 'Méthode', dataIndex: 'payment_method', key: 'method' },
                  { title: 'N° Reçu', dataIndex: 'receipt_number', key: 'receipt' },
                  { title: 'Statut', dataIndex: 'status', key: 'status',
                    render: (s: string) => {
                      const opt = PAYMENT_STATUS_OPTIONS.find(o => o.value === s);
                      return <Tag color={opt?.color}>{opt?.label || s}</Tag>;
                    },
                  },
                  { title: 'Inscription', dataIndex: 'is_registration_fee', key: 'reg',
                    render: (v: boolean) => v ? <Tag color="blue">Frais d'inscr.</Tag> : null },
                ]}
                rowKey="id" size="small" pagination={{ pageSize: 15 }}
              />
            </Card>
          ),
        },
        {
          key: 'discounts',
          label: 'Remises',
          children: (
            <Card style={{ borderRadius: 12 }}
              extra={<Button type="primary" size="small" icon={<PlusOutlined />}
                onClick={() => setDiscountModal(true)}>Nouvelle remise</Button>}>
              <Table
                dataSource={discountList}
                columns={[
                  { title: 'Nom', dataIndex: 'name', key: 'name' },
                  { title: 'Type', dataIndex: 'discount_type', key: 'type',
                    render: (v: string) => v === 'PERCENTAGE' ? 'Pourcentage' : 'Montant fixe' },
                  { title: 'Valeur', dataIndex: 'value', key: 'value',
                    render: (v: number, r: Discount) =>
                      r.discount_type === 'PERCENTAGE' ? `${v}%` : `${v?.toLocaleString()} DA` },
                  { title: 'Conditions', dataIndex: 'conditions', key: 'cond', ellipsis: true },
                  { title: 'Actif', dataIndex: 'is_active', key: 'active',
                    render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Oui' : 'Non'}</Tag> },
                ]}
                rowKey="id" size="small" pagination={{ pageSize: 10 }}
              />
            </Card>
          ),
        },
        {
          key: 'payroll',
          label: 'Fiches de paie',
          children: (
            <Card style={{ borderRadius: 12 }}
              extra={<Button type="primary" size="small" icon={<PlusOutlined />}
                onClick={() => setPayslipModal(true)}>Générer une fiche</Button>}>
              <Table
                dataSource={payslipList}
                columns={[
                  { title: 'Formateur', dataIndex: 'trainer_name', key: 'trainer' },
                  { title: 'Mois/Année', key: 'period',
                    render: (_: unknown, r: TrainerPaySlip) => `${String(r.month).padStart(2, '0')}/${r.year}` },
                  { title: 'Heures', dataIndex: 'total_hours', key: 'hours' },
                  { title: 'Taux', dataIndex: 'hourly_rate', key: 'rate',
                    render: (v: number) => `${v} DA/h` },
                  { title: 'Brut', dataIndex: 'gross_salary', key: 'gross',
                    render: (v: number) => `${v?.toLocaleString()} DA` },
                  { title: 'Net', dataIndex: 'net_salary', key: 'net',
                    render: (v: number) => <strong>{v?.toLocaleString()} DA</strong> },
                  { title: 'Réf.', dataIndex: 'reference', key: 'ref' },
                  { title: 'Statut', dataIndex: 'status', key: 'status',
                    render: (s: string) => {
                      const opt = PAYSLIP_STATUS_OPTIONS.find(o => o.value === s);
                      return <Tag color={opt?.color}>{opt?.label || s}</Tag>;
                    },
                  },
                ]}
                rowKey="id" size="small" pagination={{ pageSize: 10 }}
              />
            </Card>
          ),
        },
        {
          key: 'profitability',
          label: 'Rentabilité',
          children: (
            <Card style={{ borderRadius: 12 }}>
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <h3 style={{ marginBottom: 16 }}>Revenus par formation</h3>
                  {financeStats.revenue_by_formation?.length ? (
                    <Table
                      dataSource={financeStats.revenue_by_formation}
                      columns={[
                        { title: 'Formation', dataIndex: 'formation', key: 'f' },
                        { title: 'Revenus', dataIndex: 'amount', key: 'a',
                          render: (v: number) => `${v?.toLocaleString()} DA` },
                      ]}
                      rowKey="formation" size="small" pagination={false}
                    />
                  ) : (
                    <p style={{ color: '#64748b' }}>Aucune donnée de rentabilité disponible</p>
                  )}
                </Col>
              </Row>
            </Card>
          ),
        },
      ]} />

      {/* Fee Structure Drawer */}
      <Drawer
        title="Nouvelle tarification"
        open={feeDrawer}
        onClose={() => setFeeDrawer(false)}
        width={460}
        extra={
          <Button type="primary" onClick={handleFeeSubmit} loading={createFee.isPending}>
            Créer
          </Button>
        }
      >
        <Form form={feeForm} layout="vertical">
          <Form.Item name="name" label="Nom" rules={[{ required: true }]}>
            <Input placeholder="Ex: Anglais Mensuel" />
          </Form.Item>
          <Form.Item name="formation" label="Formation" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner">
              {formationList.map(f => (
                <Select.Option key={f.id} value={f.id}>{f.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="Montant (DA)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="billing_cycle" label="Cycle" rules={[{ required: true }]}>
                <Select>
                  {BILLING_CYCLE_OPTIONS.map(o => (
                    <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="registration_fee" label="Frais d'inscription (DA)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Payment Drawer */}
      <Drawer
        title="Enregistrer un paiement"
        open={payDrawer}
        onClose={() => setPayDrawer(false)}
        width={460}
        extra={
          <Button type="primary" onClick={handlePaySubmit} loading={createPayment.isPending}>
            Enregistrer
          </Button>
        }
      >
        <Form form={payForm} layout="vertical">
          <Form.Item name="learner" label="Apprenant (ID)" rules={[{ required: true }]}>
            <Input placeholder="ID de l'apprenant" />
          </Form.Item>
          <Form.Item name="group" label="Groupe (ID)" rules={[{ required: true }]}>
            <Input placeholder="ID du groupe" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="Montant (DA)" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="payment_date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="payment_method" label="Méthode" rules={[{ required: true }]}>
            <Select placeholder="Sélectionner">
              {['Espèces', 'Virement', 'Chèque', 'CCP', 'BaridiMob', 'Dahabia'].map(m => (
                <Select.Option key={m} value={m}>{m}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="receipt_number" label="N° de reçu">
            <Input placeholder="Numéro de reçu" />
          </Form.Item>
          <Form.Item name="status" label="Statut" initialValue="PAID">
            <Select>
              {PAYMENT_STATUS_OPTIONS.map(o => (
                <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="is_registration_fee" label="Frais d'inscription ?" valuePropName="checked">
            <Select defaultValue={false}>
              <Select.Option value={false}>Non</Select.Option>
              <Select.Option value={true}>Oui</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* Discount Modal */}
      <Modal
        title="Nouvelle remise"
        open={discountModal}
        onCancel={() => setDiscountModal(false)}
        onOk={handleDiscountSubmit}
        confirmLoading={createDiscount.isPending}
      >
        <Form form={discountForm} layout="vertical">
          <Form.Item name="name" label="Nom de la remise" rules={[{ required: true }]}>
            <Input placeholder="Ex: Remise fratrie" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="discount_type" label="Type" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="PERCENTAGE">Pourcentage</Select.Option>
                  <Select.Option value="FIXED">Montant fixe</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="value" label="Valeur" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="conditions" label="Conditions">
            <Input.TextArea rows={2} placeholder="Conditions d'application" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="valid_from" label="Valide du">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="valid_until" label="Au">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Generate Payslip Modal */}
      <Modal
        title="Générer une fiche de paie"
        open={payslipModal}
        onCancel={() => setPayslipModal(false)}
        onOk={handlePayslipGenerate}
        confirmLoading={generatePayslip.isPending}
      >
        <Form form={payslipForm} layout="vertical">
          <Form.Item name="trainer" label="Formateur (ID)" rules={[{ required: true }]}>
            <Input placeholder="ID du formateur" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="month" label="Mois" rules={[{ required: true }]}>
                <Select>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Select.Option key={i + 1} value={i + 1}>
                      {dayjs().month(i).format('MMMM')}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="year" label="Année" rules={[{ required: true }]}
                initialValue={dayjs().year()}>
                <InputNumber min={2020} max={2030} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default FormationFinance;
