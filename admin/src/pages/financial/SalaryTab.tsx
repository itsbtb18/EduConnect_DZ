import React, { useState, useCallback } from 'react';
import {
  Button, Tag, Modal, Form, Input, InputNumber, Select, Space,
  Tooltip, Popconfirm, Spin, Table, message, DatePicker, Card, Statistic, Row, Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FilePdfOutlined, DollarOutlined,
  UserOutlined, CalendarOutlined,
} from '@ant-design/icons';
import {
  useSalaryConfigs, useCreateSalaryConfig, useUpdateSalaryConfig,
  useDeductions, useCreateDeduction,
  useAdvances, useCreateAdvance, useApproveAdvance,
  usePayslips, useGeneratePayslip, useBulkGeneratePayslips, useUpdatePayslip,
  usePayrollStats, useTeachers,
} from '../../hooks/useApi';
import { financeAPI } from '../../api/services';
import dayjs from 'dayjs';

/* eslint-disable @typescript-eslint/no-explicit-any */

const QUAL_LABELS: Record<string, string> = {
  LICENCE: 'Licence', MASTER: 'Master', DOCTORAT: 'Doctorat',
  INGENIEUR: 'Ingénieur', PROFESSEUR: 'Professeur', VACATAIRE: 'Vacataire',
};

const ADVANCE_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'orange', label: 'En attente' },
  APPROVED: { color: 'blue', label: 'Approuvé' },
  REJECTED: { color: 'red', label: 'Rejeté' },
  REPAID: { color: 'green', label: 'Remboursé' },
};

const PAYSLIP_STATUS: Record<string, { color: string; label: string }> = {
  DRAFT: { color: 'default', label: 'Brouillon' },
  VALIDATED: { color: 'blue', label: 'Validé' },
  PAID: { color: 'green', label: 'Payé' },
};

const formatDA = (v: number | null | undefined) =>
  v != null ? `${Number(v).toLocaleString('fr-FR')} DA` : '—';

type SubTab = 'configs' | 'deductions' | 'advances' | 'payslips';

const SalaryTab: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('payslips');
  const [configModal, setConfigModal] = useState(false);
  const [editConfig, setEditConfig] = useState<any>(null);
  const [deductionModal, setDeductionModal] = useState(false);
  const [advanceModal, setAdvanceModal] = useState(false);
  const [generateModal, setGenerateModal] = useState(false);
  const [configForm] = Form.useForm();
  const [deductionForm] = Form.useForm();
  const [advanceForm] = Form.useForm();
  const [generateForm] = Form.useForm();

  const { data: configsRaw, isLoading: configsLoading } = useSalaryConfigs();
  const createConfig = useCreateSalaryConfig();
  const updateConfig = useUpdateSalaryConfig();
  const { data: deductionsRaw, isLoading: deductionsLoading } = useDeductions();
  const createDeduction = useCreateDeduction();
  const { data: advancesRaw, isLoading: advancesLoading } = useAdvances();
  const createAdvance = useCreateAdvance();
  const approveAdvance = useApproveAdvance();
  const { data: payslipsRaw, isLoading: payslipsLoading } = usePayslips();
  const generatePayslip = useGeneratePayslip();
  const bulkGenerate = useBulkGeneratePayslips();
  const updatePayslip = useUpdatePayslip();
  const { data: statsRaw } = usePayrollStats();
  const { data: teachersRaw } = useTeachers({ page_size: 500 });

  const configs = ((configsRaw as any)?.results ?? []) as any[];
  const deductions = ((deductionsRaw as any)?.results ?? []) as any[];
  const advances = ((advancesRaw as any)?.results ?? []) as any[];
  const payslips = ((payslipsRaw as any)?.results ?? []) as any[];
  const stats = (statsRaw ?? {}) as any;
  const teachers = ((teachersRaw as any)?.results ?? teachersRaw ?? []) as any[];

  /* ── Config handlers ── */
  const openConfigModal = useCallback((record?: any) => {
    configForm.resetFields();
    if (record) {
      setEditConfig(record);
      configForm.setFieldsValue({
        teacher: record.teacher,
        base_salary: record.base_salary,
        hourly_rate: record.hourly_rate,
        qualification: record.qualification,
        weekly_hours: record.weekly_hours,
        bank_account: record.bank_account,
        hire_date: record.hire_date ? dayjs(record.hire_date) : undefined,
      });
    } else {
      setEditConfig(null);
    }
    setConfigModal(true);
  }, [configForm]);

  const handleConfigSubmit = async () => {
    const vals = await configForm.validateFields();
    const payload = { ...vals, hire_date: vals.hire_date?.format('YYYY-MM-DD') };
    if (editConfig) {
      await updateConfig.mutateAsync({ id: editConfig.id, data: payload });
    } else {
      await createConfig.mutateAsync(payload);
    }
    setConfigModal(false);
    setEditConfig(null);
  };

  /* ── Deduction handler ── */
  const handleDeductionSubmit = async () => {
    const vals = await deductionForm.validateFields();
    await createDeduction.mutateAsync(vals);
    setDeductionModal(false);
  };

  /* ── Advance handler ── */
  const handleAdvanceSubmit = async () => {
    const vals = await advanceForm.validateFields();
    await createAdvance.mutateAsync(vals);
    setAdvanceModal(false);
  };

  /* ── Payslip PDF download ── */
  const downloadPayslipPdf = async (id: string, ref: string) => {
    try {
      const res = await financeAPI.payslipPdf(id);
      const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ref}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Erreur lors du téléchargement');
    }
  };

  /* ── Generate handler ── */
  const handleGenerate = async () => {
    const vals = await generateForm.validateFields();
    await generatePayslip.mutateAsync(vals);
    setGenerateModal(false);
  };

  /* ── Columns ── */
  const configCols: ColumnsType<any> = [
    { title: 'Enseignant', dataIndex: 'teacher_name', key: 'teacher_name', width: 200 },
    { title: 'Salaire de base', dataIndex: 'base_salary', key: 'base_salary', width: 140, render: (v: number) => formatDA(v) },
    { title: 'Taux horaire', dataIndex: 'hourly_rate', key: 'hourly_rate', width: 120, render: (v: number) => formatDA(v) },
    { title: 'Qualification', dataIndex: 'qualification', key: 'qualification', width: 120, render: (v: string) => QUAL_LABELS[v] || v },
    { title: 'Heures/sem', dataIndex: 'weekly_hours', key: 'weekly_hours', width: 100 },
    {
      title: 'Actions', key: 'actions', width: 100, render: (_: unknown, r: any) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openConfigModal(r)} />
      ),
    },
  ];

  const deductionCols: ColumnsType<any> = [
    { title: 'Nom', dataIndex: 'name', key: 'name', width: 200 },
    { title: 'Type', dataIndex: 'deduction_type_display', key: 'type', width: 140 },
    { title: 'Valeur', dataIndex: 'value', key: 'value', width: 120, render: (v: number, r: any) => r.deduction_type === 'PERCENTAGE' ? `${v}%` : formatDA(v) },
    { title: 'Actif', dataIndex: 'is_active', key: 'active', width: 80, render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag color="red">Non</Tag> },
  ];

  const advanceCols: ColumnsType<any> = [
    { title: 'Enseignant', dataIndex: 'teacher_name', key: 'teacher', width: 180 },
    { title: 'Montant', dataIndex: 'amount', key: 'amount', width: 120, render: (v: number) => formatDA(v) },
    { title: 'Mensualité', dataIndex: 'monthly_deduction', key: 'monthly', width: 120, render: (v: number) => formatDA(v) },
    { title: 'Reste', dataIndex: 'remaining', key: 'remaining', width: 120, render: (v: number) => formatDA(v) },
    { title: 'Statut', dataIndex: 'status', key: 'status', width: 120, render: (v: string) => {
      const cfg = ADVANCE_STATUS_CONFIG[v] || { color: 'default', label: v };
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    }},
    { title: 'Actions', key: 'actions', width: 120, render: (_: unknown, r: any) => r.status === 'PENDING' ? (
      <Space size={4}>
        <Tooltip title="Approuver">
          <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}
            onClick={() => approveAdvance.mutate({ id: r.id, data: { action: 'approve' } })} />
        </Tooltip>
        <Tooltip title="Rejeter">
          <Button type="text" size="small" icon={<CloseCircleOutlined />} danger
            onClick={() => approveAdvance.mutate({ id: r.id, data: { action: 'reject' } })} />
        </Tooltip>
      </Space>
    ) : null },
  ];

  const payslipCols: ColumnsType<any> = [
    { title: 'Enseignant', dataIndex: 'teacher_name', key: 'teacher', width: 180 },
    { title: 'Période', dataIndex: 'period', key: 'period', width: 150 },
    { title: 'Référence', dataIndex: 'reference', key: 'ref', width: 160 },
    { title: 'Brut', dataIndex: 'gross_salary', key: 'gross', width: 120, render: (v: number) => formatDA(v) },
    { title: 'Déductions', dataIndex: 'total_deductions', key: 'deductions', width: 120, render: (v: number) => formatDA(v) },
    { title: 'Net', dataIndex: 'net_salary', key: 'net', width: 120, render: (v: number) => <strong>{formatDA(v)}</strong> },
    { title: 'Statut', dataIndex: 'status', key: 'status', width: 110, render: (v: string) => {
      const cfg = PAYSLIP_STATUS[v] || { color: 'default', label: v };
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    }},
    { title: 'Actions', key: 'actions', width: 160, render: (_: unknown, r: any) => (
      <Space size={4}>
        <Tooltip title="Télécharger PDF">
          <Button type="text" size="small" icon={<FilePdfOutlined />} onClick={() => downloadPayslipPdf(r.id, r.reference)} />
        </Tooltip>
        {r.status === 'DRAFT' && (
          <Tooltip title="Valider">
            <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#1890ff' }}
              onClick={() => updatePayslip.mutate({ id: r.id, data: { status: 'VALIDATED' } })} />
          </Tooltip>
        )}
        {r.status === 'VALIDATED' && (
          <Tooltip title="Marquer payé">
            <Button type="text" size="small" icon={<DollarOutlined />} style={{ color: '#52c41a' }}
              onClick={() => updatePayslip.mutate({ id: r.id, data: { status: 'PAID', paid_on: dayjs().format('YYYY-MM-DD') } })} />
          </Tooltip>
        )}
      </Space>
    )},
  ];

  const subTabs: { key: SubTab; label: string }[] = [
    { key: 'payslips', label: 'Fiches de paie' },
    { key: 'configs', label: 'Grille salariale' },
    { key: 'deductions', label: 'Déductions' },
    { key: 'advances', label: 'Avances' },
  ];

  return (
    <div>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}><Card><Statistic title="Total brut" value={stats.total_gross || 0} suffix="DA" /></Card></Col>
        <Col span={6}><Card><Statistic title="Total net" value={stats.total_net || 0} suffix="DA" /></Card></Col>
        <Col span={6}><Card><Statistic title="Fiches ce mois" value={stats.total_payslips || 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="En attente" value={stats.draft || 0} /></Card></Col>
      </Row>

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {subTabs.map(t => (
          <Button key={t.key} type={subTab === t.key ? 'primary' : 'default'} onClick={() => setSubTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {/* Payslips */}
      {subTab === 'payslips' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Fiches de paie</span>
            <Space>
              <Button icon={<PlusOutlined />} onClick={() => setGenerateModal(true)}>Générer</Button>
              <Button onClick={() => bulkGenerate.mutate({ month: dayjs().subtract(1, 'month').month() + 1, year: dayjs().subtract(1, 'month').year() })}
                loading={bulkGenerate.isPending}>
                Générer tout (mois dernier)
              </Button>
            </Space>
          </div>
          <Table columns={payslipCols} dataSource={payslips} loading={payslipsLoading} rowKey="id"
            scroll={{ x: 1100 }} pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucune fiche de paie' }} />
        </>
      )}

      {/* Salary Configs */}
      {subTab === 'configs' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Grille salariale — {configs.length} configuration{configs.length !== 1 ? 's' : ''}</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openConfigModal()}>Nouvelle config</Button>
          </div>
          <Table columns={configCols} dataSource={configs} loading={configsLoading} rowKey="id"
            scroll={{ x: 900 }} pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucune configuration' }} />
        </>
      )}

      {/* Deductions */}
      {subTab === 'deductions' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Déductions</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { deductionForm.resetFields(); setDeductionModal(true); }}>Nouvelle déduction</Button>
          </div>
          <Table columns={deductionCols} dataSource={deductions} loading={deductionsLoading} rowKey="id"
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucune déduction' }} />
        </>
      )}

      {/* Advances */}
      {subTab === 'advances' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Avances sur salaire</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { advanceForm.resetFields(); setAdvanceModal(true); }}>Nouvelle avance</Button>
          </div>
          <Table columns={advanceCols} dataSource={advances} loading={advancesLoading} rowKey="id"
            scroll={{ x: 800 }} pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucune avance' }} />
        </>
      )}

      {/* ── Modals ── */}

      {/* Config Modal */}
      <Modal title={editConfig ? 'Modifier la configuration' : 'Nouvelle configuration salariale'} open={configModal}
        onOk={handleConfigSubmit} onCancel={() => { setConfigModal(false); setEditConfig(null); }}
        confirmLoading={createConfig.isPending || updateConfig.isPending}
        okText={editConfig ? 'Mettre à jour' : 'Créer'} cancelText="Annuler" width={600} destroyOnClose>
        <Form form={configForm} layout="vertical">
          <Form.Item label="Enseignant" name="teacher" rules={[{ required: true, message: 'Requis' }]}>
            <Select showSearch optionFilterProp="label" disabled={!!editConfig}
              options={teachers.map((t: any) => ({ value: t.id, label: t.full_name || `${t.first_name} ${t.last_name}` }))} />
          </Form.Item>
          <Form.Item label="Salaire de base (DA)" name="base_salary" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Taux horaire HS (DA)" name="hourly_rate">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Qualification" name="qualification">
            <Select options={Object.entries(QUAL_LABELS).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item label="Heures hebdomadaires" name="weekly_hours">
            <InputNumber min={1} max={40} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Compte bancaire (RIB/CCP)" name="bank_account">
            <Input />
          </Form.Item>
          <Form.Item label="Date d'embauche" name="hire_date">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Deduction Modal */}
      <Modal title="Nouvelle déduction" open={deductionModal}
        onOk={handleDeductionSubmit} onCancel={() => setDeductionModal(false)}
        confirmLoading={createDeduction.isPending} okText="Créer" cancelText="Annuler" destroyOnClose>
        <Form form={deductionForm} layout="vertical">
          <Form.Item label="Nom" name="name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: CNAS, IRG, Mutuelle" />
          </Form.Item>
          <Form.Item label="Type" name="deduction_type" rules={[{ required: true, message: 'Requis' }]}>
            <Select options={[{ value: 'FIXED', label: 'Montant fixe' }, { value: 'PERCENTAGE', label: 'Pourcentage' }]} />
          </Form.Item>
          <Form.Item label="Valeur" name="value" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Advance Modal */}
      <Modal title="Nouvelle avance sur salaire" open={advanceModal}
        onOk={handleAdvanceSubmit} onCancel={() => setAdvanceModal(false)}
        confirmLoading={createAdvance.isPending} okText="Demander" cancelText="Annuler" destroyOnClose>
        <Form form={advanceForm} layout="vertical">
          <Form.Item label="Enseignant" name="teacher" rules={[{ required: true, message: 'Requis' }]}>
            <Select showSearch optionFilterProp="label"
              options={teachers.map((t: any) => ({ value: t.id, label: t.full_name || `${t.first_name} ${t.last_name}` }))} />
          </Form.Item>
          <Form.Item label="Montant (DA)" name="amount" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Nombre de mois de remboursement" name="deduction_months" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={1} max={12} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Motif" name="reason">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Generate Payslip Modal */}
      <Modal title="Générer une fiche de paie" open={generateModal}
        onOk={handleGenerate} onCancel={() => setGenerateModal(false)}
        confirmLoading={generatePayslip.isPending} okText="Générer" cancelText="Annuler" destroyOnClose>
        <Form form={generateForm} layout="vertical">
          <Form.Item label="Enseignant" name="teacher" rules={[{ required: true, message: 'Requis' }]}>
            <Select showSearch optionFilterProp="label"
              options={teachers.map((t: any) => ({ value: t.id, label: t.full_name || `${t.first_name} ${t.last_name}` }))} />
          </Form.Item>
          <Form.Item label="Mois" name="month" rules={[{ required: true, message: 'Requis' }]}>
            <Select options={[
              { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
              { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
              { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
              { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
            ]} />
          </Form.Item>
          <Form.Item label="Année" name="year" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={2020} max={2099} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SalaryTab;
