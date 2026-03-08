import React, { useState } from 'react';
import {
  Button, Tag, Modal, Form, Input, InputNumber, Select, Space,
  Tooltip, Popconfirm, Table, Card, Row, Col,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, DeleteOutlined,
} from '@ant-design/icons';
import {
  useDiscounts, useCreateDiscount, useDeleteDiscount,
  usePenalties, useCreatePenalty, useDeletePenalty,
  useDeposits, useCreateDeposit,
  useExtraFees, useCreateExtraFee, useDeleteExtraFee,
  useStudents,
} from '../../hooks/useApi';
import dayjs from 'dayjs';

/* eslint-disable @typescript-eslint/no-explicit-any */

const DISCOUNT_TYPE: Record<string, string> = {
  FRATRIE: 'Fratrie', BOURSIER: 'Boursier', EXCEPTIONNEL: 'Exceptionnel',
};

const CALC_TYPE: Record<string, string> = {
  FIXED: 'Montant fixe', PERCENTAGE: 'Pourcentage',
};

const EXTRA_FEE_TYPE: Record<string, string> = {
  CANTEEN: 'Cantine', TRANSPORT: 'Transport', UNIFORM: 'Uniforme',
  BOOKS: 'Livres', ACTIVITIES: 'Activités', OTHER: 'Autre',
};

const DEPOSIT_STATUS: Record<string, { color: string; label: string }> = {
  PAID: { color: 'green', label: 'Payé' },
  UNPAID: { color: 'orange', label: 'Non payé' },
};

const formatDA = (v: number | null | undefined) =>
  v != null ? `${Number(v).toLocaleString('fr-FR')} DA` : '—';

type SubTab = 'discounts' | 'penalties' | 'deposits' | 'extras';

const FeeConfigTab: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('discounts');
  const [discountModal, setDiscountModal] = useState(false);
  const [penaltyModal, setPenaltyModal] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [extraFeeModal, setExtraFeeModal] = useState(false);
  const [discountForm] = Form.useForm();
  const [penaltyForm] = Form.useForm();
  const [depositForm] = Form.useForm();
  const [extraFeeForm] = Form.useForm();

  const { data: discountsRaw, isLoading: discountsLoading } = useDiscounts();
  const createDiscount = useCreateDiscount();
  const deleteDiscount = useDeleteDiscount();
  const { data: penaltiesRaw, isLoading: penaltiesLoading } = usePenalties();
  const createPenalty = useCreatePenalty();
  const deletePenalty = useDeletePenalty();
  const { data: depositsRaw, isLoading: depositsLoading } = useDeposits();
  const createDeposit = useCreateDeposit();
  const { data: extrasRaw, isLoading: extrasLoading } = useExtraFees();
  const createExtraFee = useCreateExtraFee();
  const deleteExtraFee = useDeleteExtraFee();
  const { data: studentsRaw } = useStudents({ page_size: 500 });

  const discounts = ((discountsRaw as any)?.results ?? []) as any[];
  const penalties = ((penaltiesRaw as any)?.results ?? []) as any[];
  const deposits = ((depositsRaw as any)?.results ?? []) as any[];
  const extras = ((extrasRaw as any)?.results ?? []) as any[];
  const students = ((studentsRaw as any)?.results ?? studentsRaw ?? []) as any[];

  /* ── Handlers ── */
  const handleDiscountSubmit = async () => {
    const vals = await discountForm.validateFields();
    await createDiscount.mutateAsync(vals);
    setDiscountModal(false);
  };

  const handlePenaltySubmit = async () => {
    const vals = await penaltyForm.validateFields();
    await createPenalty.mutateAsync(vals);
    setPenaltyModal(false);
  };

  const handleDepositSubmit = async () => {
    const vals = await depositForm.validateFields();
    await createDeposit.mutateAsync(vals);
    setDepositModal(false);
  };

  const handleExtraFeeSubmit = async () => {
    const vals = await extraFeeForm.validateFields();
    await createExtraFee.mutateAsync(vals);
    setExtraFeeModal(false);
  };

  /* ── Columns ── */
  const discountCols: ColumnsType<any> = [
    { title: 'Nom', dataIndex: 'name', key: 'name', width: 180 },
    { title: 'Type', dataIndex: 'discount_type', key: 'type', width: 120, render: (v: string) => <Tag>{DISCOUNT_TYPE[v] || v}</Tag> },
    { title: 'Calcul', dataIndex: 'calculation_type', key: 'calc', width: 120, render: (v: string) => CALC_TYPE[v] || v },
    { title: 'Valeur', dataIndex: 'value', key: 'value', width: 120, render: (v: number, r: any) => r.calculation_type === 'PERCENTAGE' ? `${v}%` : formatDA(v) },
    { title: 'Actif', dataIndex: 'is_active', key: 'active', width: 80, render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag color="red">Non</Tag> },
    {
      title: 'Actions', key: 'actions', width: 80, render: (_: unknown, r: any) => (
        <Popconfirm title="Supprimer cette réduction ?" onConfirm={() => deleteDiscount.mutate(r.id)}>
          <Button type="text" size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  const penaltyCols: ColumnsType<any> = [
    { title: 'Nom', dataIndex: 'name', key: 'name', width: 180 },
    { title: 'Jours de grâce', dataIndex: 'grace_days', key: 'grace', width: 120 },
    { title: 'Calcul', dataIndex: 'calculation_type', key: 'calc', width: 120, render: (v: string) => CALC_TYPE[v] || v },
    { title: 'Valeur', dataIndex: 'value', key: 'value', width: 120, render: (v: number, r: any) => r.calculation_type === 'PERCENTAGE' ? `${v}%` : formatDA(v) },
    { title: 'Actif', dataIndex: 'is_active', key: 'active', width: 80, render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag color="red">Non</Tag> },
    {
      title: 'Actions', key: 'actions', width: 80, render: (_: unknown, r: any) => (
        <Popconfirm title="Supprimer cette pénalité ?" onConfirm={() => deletePenalty.mutate(r.id)}>
          <Button type="text" size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  const depositCols: ColumnsType<any> = [
    { title: 'Élève', dataIndex: 'student_name', key: 'student', width: 200 },
    { title: 'Année scolaire', dataIndex: 'academic_year', key: 'year', width: 120 },
    { title: 'Montant', dataIndex: 'amount', key: 'amount', width: 130, render: (v: number) => formatDA(v) },
    { title: 'Reçu', dataIndex: 'receipt_number', key: 'receipt', width: 160 },
    { title: 'Statut', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => {
      const cfg = DEPOSIT_STATUS[v] || { color: 'default', label: v };
      return <Tag color={cfg.color}>{cfg.label}</Tag>;
    }},
    { title: 'Date', dataIndex: 'paid_on', key: 'date', width: 120, render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
  ];

  const extraFeeCols: ColumnsType<any> = [
    { title: 'Nom', dataIndex: 'name', key: 'name', width: 180 },
    { title: 'Type', dataIndex: 'fee_type', key: 'type', width: 120, render: (v: string) => <Tag>{EXTRA_FEE_TYPE[v] || v}</Tag> },
    { title: 'Montant', dataIndex: 'amount', key: 'amount', width: 130, render: (v: number) => formatDA(v) },
    { title: 'Obligatoire', dataIndex: 'mandatory', key: 'mandatory', width: 100, render: (v: boolean) => v ? <Tag color="red">Oui</Tag> : <Tag>Non</Tag> },
    { title: 'Actif', dataIndex: 'is_active', key: 'active', width: 80, render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag color="red">Non</Tag> },
    {
      title: 'Actions', key: 'actions', width: 80, render: (_: unknown, r: any) => (
        <Popconfirm title="Supprimer ce frais ?" onConfirm={() => deleteExtraFee.mutate(r.id)}>
          <Button type="text" size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  const subTabs: { key: SubTab; label: string }[] = [
    { key: 'discounts', label: 'Réductions' },
    { key: 'penalties', label: 'Pénalités de retard' },
    { key: 'deposits', label: 'Droits d\'inscription' },
    { key: 'extras', label: 'Frais supplémentaires' },
  ];

  return (
    <div>
      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {subTabs.map(t => (
          <Button key={t.key} type={subTab === t.key ? 'primary' : 'default'} onClick={() => setSubTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {/* Discounts */}
      {subTab === 'discounts' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Réductions — {discounts.length} configurée{discounts.length !== 1 ? 's' : ''}</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { discountForm.resetFields(); setDiscountModal(true); }}>Nouvelle réduction</Button>
          </div>
          <Table columns={discountCols} dataSource={discounts} loading={discountsLoading} rowKey="id"
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucune réduction' }} />
        </>
      )}

      {/* Penalties */}
      {subTab === 'penalties' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Pénalités de retard</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { penaltyForm.resetFields(); setPenaltyModal(true); }}>Nouvelle pénalité</Button>
          </div>
          <Table columns={penaltyCols} dataSource={penalties} loading={penaltiesLoading} rowKey="id"
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucune pénalité' }} />
        </>
      )}

      {/* Deposits */}
      {subTab === 'deposits' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Droits d'inscription</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { depositForm.resetFields(); setDepositModal(true); }}>Nouvel enregistrement</Button>
          </div>
          <Table columns={depositCols} dataSource={deposits} loading={depositsLoading} rowKey="id"
            scroll={{ x: 900 }} pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucun droit d\'inscription' }} />
        </>
      )}

      {/* Extra Fees */}
      {subTab === 'extras' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Frais supplémentaires</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { extraFeeForm.resetFields(); setExtraFeeModal(true); }}>Nouveau frais</Button>
          </div>
          <Table columns={extraFeeCols} dataSource={extras} loading={extrasLoading} rowKey="id"
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucun frais supplémentaire' }} />
        </>
      )}

      {/* ── Modals ── */}

      {/* Discount Modal */}
      <Modal title="Nouvelle réduction" open={discountModal}
        onOk={handleDiscountSubmit} onCancel={() => setDiscountModal(false)}
        confirmLoading={createDiscount.isPending} okText="Créer" cancelText="Annuler" destroyOnClose>
        <Form form={discountForm} layout="vertical">
          <Form.Item label="Nom" name="name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Réduction 2ème enfant" />
          </Form.Item>
          <Form.Item label="Type de réduction" name="discount_type" rules={[{ required: true, message: 'Requis' }]}>
            <Select options={Object.entries(DISCOUNT_TYPE).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item label="Mode de calcul" name="calculation_type" rules={[{ required: true, message: 'Requis' }]}>
            <Select options={Object.entries(CALC_TYPE).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item label="Valeur" name="value" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Penalty Modal */}
      <Modal title="Nouvelle pénalité de retard" open={penaltyModal}
        onOk={handlePenaltySubmit} onCancel={() => setPenaltyModal(false)}
        confirmLoading={createPenalty.isPending} okText="Créer" cancelText="Annuler" destroyOnClose>
        <Form form={penaltyForm} layout="vertical">
          <Form.Item label="Nom" name="name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Pénalité retard > 15 jours" />
          </Form.Item>
          <Form.Item label="Jours de grâce" name="grace_days" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Mode de calcul" name="calculation_type" rules={[{ required: true, message: 'Requis' }]}>
            <Select options={Object.entries(CALC_TYPE).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item label="Valeur" name="value" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Deposit Modal */}
      <Modal title="Nouveau droit d'inscription" open={depositModal}
        onOk={handleDepositSubmit} onCancel={() => setDepositModal(false)}
        confirmLoading={createDeposit.isPending} okText="Créer" cancelText="Annuler" destroyOnClose>
        <Form form={depositForm} layout="vertical">
          <Form.Item label="Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Select showSearch optionFilterProp="label"
              options={students.map((s: any) => ({ value: s.id, label: s.full_name || `${s.first_name} ${s.last_name}` }))} />
          </Form.Item>
          <Form.Item label="Année scolaire" name="academic_year" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: 2024/2025" />
          </Form.Item>
          <Form.Item label="Montant (DA)" name="amount" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Extra Fee Modal */}
      <Modal title="Nouveau frais supplémentaire" open={extraFeeModal}
        onOk={handleExtraFeeSubmit} onCancel={() => setExtraFeeModal(false)}
        confirmLoading={createExtraFee.isPending} okText="Créer" cancelText="Annuler" destroyOnClose>
        <Form form={extraFeeForm} layout="vertical">
          <Form.Item label="Nom" name="name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Frais de cantine T1" />
          </Form.Item>
          <Form.Item label="Type" name="fee_type" rules={[{ required: true, message: 'Requis' }]}>
            <Select options={Object.entries(EXTRA_FEE_TYPE).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item label="Montant (DA)" name="amount" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Obligatoire" name="mandatory" initialValue={false}>
            <Select options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeeConfigTab;
