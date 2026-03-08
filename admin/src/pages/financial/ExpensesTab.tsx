import React, { useState } from 'react';
import {
  Button, Tag, Modal, Form, Input, InputNumber, Select, Space,
  Tooltip, Popconfirm, Table, Alert, Card, Statistic, Row, Col, Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, CheckCircleOutlined, CloseCircleOutlined,
  DeleteOutlined, WarningOutlined,
} from '@ant-design/icons';
import {
  useExpenseCategories, useCreateExpenseCategory, useDeleteExpenseCategory,
  useExpenses, useCreateExpense, useApproveExpense,
  useBudgets, useCreateBudget,
} from '../../hooks/useApi';
import dayjs from 'dayjs';

/* eslint-disable @typescript-eslint/no-explicit-any */

const EXPENSE_STATUS: Record<string, { color: string; label: string }> = {
  PENDING: { color: 'orange', label: 'En attente' },
  APPROVED: { color: 'green', label: 'Approuvée' },
  REJECTED: { color: 'red', label: 'Rejetée' },
};

const formatDA = (v: number | null | undefined) =>
  v != null ? `${Number(v).toLocaleString('fr-FR')} DA` : '—';

type SubTab = 'expenses' | 'categories' | 'budgets';

const ExpensesTab: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTab>('expenses');
  const [expenseModal, setExpenseModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);
  const [budgetModal, setBudgetModal] = useState(false);
  const [expenseForm] = Form.useForm();
  const [categoryForm] = Form.useForm();
  const [budgetForm] = Form.useForm();

  const { data: categoriesRaw, isLoading: categoriesLoading } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();
  const { data: expensesRaw, isLoading: expensesLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const approveExpense = useApproveExpense();
  const { data: budgetsRaw, isLoading: budgetsLoading } = useBudgets();
  const createBudget = useCreateBudget();

  const categories = ((categoriesRaw as any)?.results ?? []) as any[];
  const expenses = ((expensesRaw as any)?.results ?? []) as any[];
  const budgets = ((budgetsRaw as any)?.results ?? []) as any[];

  /* Derived stats */
  const totalApproved = expenses.filter((e: any) => e.status === 'APPROVED').reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalPending = expenses.filter((e: any) => e.status === 'PENDING').length;
  const overBudget = budgets.filter((b: any) => Number(b.consumption_pct || 0) > 90);

  /* ── Handlers ── */
  const handleExpenseSubmit = async () => {
    const vals = await expenseForm.validateFields();
    await createExpense.mutateAsync({ ...vals, date: vals.date?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD') });
    setExpenseModal(false);
  };

  const handleCategorySubmit = async () => {
    const vals = await categoryForm.validateFields();
    await createCategory.mutateAsync(vals);
    setCategoryModal(false);
  };

  const handleBudgetSubmit = async () => {
    const vals = await budgetForm.validateFields();
    await createBudget.mutateAsync(vals);
    setBudgetModal(false);
  };

  /* ── Columns ── */
  const expenseCols: ColumnsType<any> = [
    { title: 'Description', dataIndex: 'description', key: 'desc', width: 250, ellipsis: true },
    { title: 'Catégorie', dataIndex: 'category_name', key: 'cat', width: 150 },
    { title: 'Montant', dataIndex: 'amount', key: 'amount', width: 130, render: (v: number) => formatDA(v) },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { title: 'Soumis par', dataIndex: 'submitted_by_name', key: 'submitted', width: 150 },
    {
      title: 'Statut', dataIndex: 'status', key: 'status', width: 120, render: (v: string) => {
        const cfg = EXPENSE_STATUS[v] || { color: 'default', label: v };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Actions', key: 'actions', width: 120, render: (_: unknown, r: any) => r.status === 'PENDING' ? (
        <Space size={4}>
          <Tooltip title="Approuver">
            <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}
              onClick={() => approveExpense.mutate({ id: r.id, data: { action: 'approve' } })} />
          </Tooltip>
          <Tooltip title="Rejeter">
            <Button type="text" size="small" icon={<CloseCircleOutlined />} danger
              onClick={() => approveExpense.mutate({ id: r.id, data: { action: 'reject', rejection_reason: 'Rejeté par directeur' } })} />
          </Tooltip>
        </Space>
      ) : null,
    },
  ];

  const categoryCols: ColumnsType<any> = [
    { title: 'Nom', dataIndex: 'name', key: 'name', width: 200 },
    { title: 'Code', dataIndex: 'code', key: 'code', width: 120 },
    { title: 'Budget annuel', dataIndex: 'budget_annual', key: 'budget', width: 140, render: (v: number) => formatDA(v) },
    { title: 'Consommé', dataIndex: 'budget_consumed', key: 'consumed', width: 140, render: (v: number) => formatDA(v) },
    { title: 'Reste', dataIndex: 'budget_remaining', key: 'remaining', width: 140, render: (v: number) => formatDA(v) },
    {
      title: 'Actions', key: 'actions', width: 80, render: (_: unknown, r: any) => (
        <Popconfirm title="Supprimer cette catégorie ?" onConfirm={() => deleteCategory.mutate(r.id)}>
          <Button type="text" size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  const budgetCols: ColumnsType<any> = [
    { title: 'Catégorie', dataIndex: 'category_name', key: 'cat', width: 200 },
    { title: 'Année', dataIndex: 'year', key: 'year', width: 100 },
    { title: 'Budget prévu', dataIndex: 'amount', key: 'amount', width: 140, render: (v: number) => formatDA(v) },
    { title: 'Consommé', dataIndex: 'consumed', key: 'consumed', width: 140, render: (v: number) => formatDA(v) },
    {
      title: 'Progression', key: 'pct', width: 180, render: (_: unknown, r: any) => {
        const pct = Number(r.consumption_pct || 0);
        return <Progress percent={pct} status={pct > 90 ? 'exception' : pct > 70 ? 'active' : 'normal'} size="small" />;
      },
    },
    { title: 'Reste', dataIndex: 'remaining', key: 'remaining', width: 140, render: (v: number) => formatDA(v) },
  ];

  const subTabs: { key: SubTab; label: string }[] = [
    { key: 'expenses', label: 'Dépenses' },
    { key: 'categories', label: 'Catégories' },
    { key: 'budgets', label: 'Budget annuel' },
  ];

  return (
    <div>
      {/* Stats */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}><Card><Statistic title="Total approuvé" value={totalApproved} suffix="DA" /></Card></Col>
        <Col span={8}><Card><Statistic title="En attente" value={totalPending} /></Card></Col>
        <Col span={8}><Card><Statistic title="Budgets en dépassement" value={overBudget.length} valueStyle={overBudget.length ? { color: '#ff4d4f' } : {}} /></Card></Col>
      </Row>

      {overBudget.length > 0 && (
        <Alert type="warning" icon={<WarningOutlined />} showIcon style={{ marginBottom: 16 }}
          message={`${overBudget.length} budget(s) dépassent 90% : ${overBudget.map((b: any) => b.category_name).join(', ')}`} />
      )}

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {subTabs.map(t => (
          <Button key={t.key} type={subTab === t.key ? 'primary' : 'default'} onClick={() => setSubTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {/* Expenses */}
      {subTab === 'expenses' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Dépenses</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { expenseForm.resetFields(); setExpenseModal(true); }}>Nouvelle dépense</Button>
          </div>
          <Table columns={expenseCols} dataSource={expenses} loading={expensesLoading} rowKey="id"
            scroll={{ x: 1100 }} pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucune dépense' }} />
        </>
      )}

      {/* Categories */}
      {subTab === 'categories' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Catégories de dépenses</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { categoryForm.resetFields(); setCategoryModal(true); }}>Nouvelle catégorie</Button>
          </div>
          <Table columns={categoryCols} dataSource={categories} loading={categoriesLoading} rowKey="id"
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucune catégorie' }} />
        </>
      )}

      {/* Budgets */}
      {subTab === 'budgets' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Budget annuel par catégorie</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { budgetForm.resetFields(); setBudgetModal(true); }}>Nouveau budget</Button>
          </div>
          <Table columns={budgetCols} dataSource={budgets} loading={budgetsLoading} rowKey="id"
            pagination={{ pageSize: 20 }} locale={{ emptyText: 'Aucun budget' }} />
        </>
      )}

      {/* ── Modals ── */}

      {/* Expense Modal */}
      <Modal title="Nouvelle dépense" open={expenseModal}
        onOk={handleExpenseSubmit} onCancel={() => setExpenseModal(false)}
        confirmLoading={createExpense.isPending} okText="Soumettre" cancelText="Annuler" destroyOnClose>
        <Form form={expenseForm} layout="vertical">
          <Form.Item label="Catégorie" name="category" rules={[{ required: true, message: 'Requis' }]}>
            <Select options={categories.map((c: any) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item label="Montant (DA)" name="amount" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true, message: 'Requis' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Fournisseur" name="supplier">
            <Input placeholder="Nom du fournisseur" />
          </Form.Item>
          <Form.Item label="Référence facture" name="invoice_reference">
            <Input placeholder="N° de facture" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal title="Nouvelle catégorie" open={categoryModal}
        onOk={handleCategorySubmit} onCancel={() => setCategoryModal(false)}
        confirmLoading={createCategory.isPending} okText="Créer" cancelText="Annuler" destroyOnClose>
        <Form form={categoryForm} layout="vertical">
          <Form.Item label="Nom" name="name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Fournitures scolaires" />
          </Form.Item>
          <Form.Item label="Code" name="code" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: FOURNITURES" />
          </Form.Item>
          <Form.Item label="Budget annuel (DA)" name="budget_annual">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Budget Modal */}
      <Modal title="Nouveau budget annuel" open={budgetModal}
        onOk={handleBudgetSubmit} onCancel={() => setBudgetModal(false)}
        confirmLoading={createBudget.isPending} okText="Créer" cancelText="Annuler" destroyOnClose>
        <Form form={budgetForm} layout="vertical">
          <Form.Item label="Catégorie" name="category" rules={[{ required: true, message: 'Requis' }]}>
            <Select options={categories.map((c: any) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item label="Année" name="year" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={2020} max={2099} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Montant prévu (DA)" name="amount" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpensesTab;
