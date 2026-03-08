import React, { useState, useMemo } from 'react';
import {
  Card, Statistic, Row, Col, Select, Table, Tag, Button, Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowUpOutlined, ArrowDownOutlined, FileExcelOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useFinancialReports } from '../../hooks/useApi';
import { exportToCSV, exportToPDF } from '../../hooks/useExport';
import dayjs from 'dayjs';

/* eslint-disable @typescript-eslint/no-explicit-any */

const MONTHS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

const formatDA = (v: number | null | undefined) =>
  v != null ? `${Number(v).toLocaleString('fr-FR')} DA` : '0 DA';

const ReportsTab: React.FC = () => {
  const currentYear = dayjs().year();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | undefined>(undefined);

  const { data: reportRaw, isLoading } = useFinancialReports({ year, month });
  const report = (reportRaw ?? {}) as any;

  const totalRevenue = Number(report.total_revenue || 0);
  const totalDeposits = Number(report.total_deposits || 0);
  const totalExpenses = Number(report.total_expenses || 0);
  const totalPayroll = Number(report.total_payroll || 0);
  const netCashflow = Number(report.net_cashflow || 0);
  const unpaidAmount = Number(report.unpaid_amount || 0);
  const unpaidStudents = Number(report.unpaid_students || 0);
  const revenueByMethod = (report.revenue_by_method || []) as any[];
  const expensesByCategory = (report.expenses_by_category || []) as any[];
  const monthlyBreakdown = (report.monthly_breakdown || []) as any[];
  const unpaidList = (report.unpaid_list || []) as any[];

  /* Method rendering */
  const METHOD_LABELS: Record<string, string> = {
    CASH: 'Espèces', CHECK: 'Chèque', BANK_TRANSFER: 'Virement',
    CCP: 'CCP', ONLINE: 'En ligne', OTHER: 'Autre',
  };

  /* Monthly breakdown table columns */
  const monthlyColumns: ColumnsType<any> = [
    { title: 'Mois', dataIndex: 'month', key: 'month', width: 100, render: (v: number) => MONTHS.find(m => m.value === v)?.label || v },
    { title: 'Recettes', dataIndex: 'revenue', key: 'revenue', width: 140, render: (v: number) => formatDA(v) },
    { title: 'Dépenses', dataIndex: 'expenses', key: 'expenses', width: 140, render: (v: number) => formatDA(v) },
    { title: 'Masse salariale', dataIndex: 'payroll', key: 'payroll', width: 140, render: (v: number) => formatDA(v) },
    {
      title: 'Solde', key: 'balance', width: 140, render: (_: unknown, r: any) => {
        const bal = Number(r.revenue || 0) - Number(r.expenses || 0) - Number(r.payroll || 0);
        return <span style={{ color: bal >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 600 }}>{formatDA(bal)}</span>;
      },
    },
  ];

  /* Revenue by method columns */
  const revenueMethodCols: ColumnsType<any> = [
    { title: 'Méthode', dataIndex: 'payment_method', key: 'method', render: (v: string) => METHOD_LABELS[v] || v },
    { title: 'Montant', dataIndex: 'total', key: 'total', render: (v: number) => formatDA(v) },
  ];

  /* Expenses by category columns */
  const expenseCatCols: ColumnsType<any> = [
    { title: 'Catégorie', dataIndex: 'category__name', key: 'cat' },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number) => formatDA(v) },
  ];

  /* Unpaid students columns */
  const unpaidCols: ColumnsType<any> = [
    { title: 'Élève', dataIndex: 'student_name', key: 'student', width: 200 },
    { title: 'Classe', dataIndex: 'class_name', key: 'class', width: 150 },
    { title: 'Montant dû', dataIndex: 'amount_due', key: 'amount', width: 140, render: (v: number) => formatDA(v) },
    { title: 'Payé', dataIndex: 'amount_paid', key: 'paid', width: 140, render: (v: number) => formatDA(v) },
    { title: 'Reste', key: 'rest', width: 140, render: (_: unknown, r: any) => {
      const rest = Number(r.amount_due || 0) - Number(r.amount_paid || 0);
      return <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{formatDA(rest)}</span>;
    }},
  ];

  const reportColumns = [
    { key: 'Mois', title: 'Mois' },
    { key: 'Recettes', title: 'Recettes' },
    { key: 'Dépenses', title: 'Dépenses' },
    { key: 'MasseSalariale', title: 'Masse salariale' },
    { key: 'Solde', title: 'Solde' },
  ];

  const exportableData = useMemo(() => {
    if (monthlyBreakdown.length === 0) return [];
    return monthlyBreakdown.map((m: any) => ({
      Mois: MONTHS.find(mo => mo.value === m.month)?.label || String(m.month),
      Recettes: m.revenue,
      Dépenses: m.expenses,
      MasseSalariale: m.payroll,
      Solde: Number(m.revenue || 0) - Number(m.expenses || 0) - Number(m.payroll || 0),
    }));
  }, [monthlyBreakdown]);

  const handleExportCSV = () => {
    exportToCSV(exportableData, reportColumns, `rapport-financier-${year}`);
  };

  const handleExportPDF = () => {
    exportToPDF(exportableData, reportColumns, `rapport-financier-${year}`, `Rapport Financier ${year}`);
  };

  const yearOptions = Array.from({ length: 6 }, (_, i) => ({ value: currentYear - i, label: `${currentYear - i}` }));

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>Période :</span>
        <Select value={year} onChange={setYear} options={yearOptions} style={{ width: 120 }} />
        <Select value={month} onChange={setMonth} allowClear placeholder="Tous les mois" options={MONTHS} style={{ width: 160 }} />
        <div style={{ flex: 1 }} />
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={handleExportCSV} disabled={!monthlyBreakdown.length}>Export CSV</Button>
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF} disabled={!monthlyBreakdown.length}>Export PDF</Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card><Statistic title="Recettes" value={totalRevenue} suffix="DA" valueStyle={{ color: '#52c41a' }}
            prefix={<ArrowUpOutlined />} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Droits d'inscription" value={totalDeposits} suffix="DA" /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Dépenses" value={totalExpenses} suffix="DA" valueStyle={{ color: '#ff4d4f' }}
            prefix={<ArrowDownOutlined />} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Masse salariale" value={totalPayroll} suffix="DA" /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Cashflow net" value={netCashflow} suffix="DA"
            valueStyle={{ color: netCashflow >= 0 ? '#52c41a' : '#ff4d4f' }} /></Card>
        </Col>
        <Col span={4}>
          <Card><Statistic title="Impayés" value={unpaidAmount} suffix="DA"
            valueStyle={{ color: unpaidAmount > 0 ? '#ff4d4f' : '#52c41a' }} /></Card>
        </Col>
      </Row>

      {/* Monthly Breakdown */}
      {!month && monthlyBreakdown.length > 0 && (
        <Card title="Évolution mensuelle" style={{ marginBottom: 24 }}>
          <Table columns={monthlyColumns} dataSource={monthlyBreakdown} rowKey="month"
            pagination={false} size="small" loading={isLoading} />
        </Card>
      )}

      {/* Revenue & Expenses Breakdown */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Recettes par méthode de paiement" size="small">
            <Table columns={revenueMethodCols} dataSource={revenueByMethod} rowKey="payment_method"
              pagination={false} size="small" loading={isLoading} locale={{ emptyText: 'Aucune donnée' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Dépenses par catégorie" size="small">
            <Table columns={expenseCatCols} dataSource={expensesByCategory} rowKey="category__name"
              pagination={false} size="small" loading={isLoading} locale={{ emptyText: 'Aucune donnée' }} />
          </Card>
        </Col>
      </Row>

      {/* Unpaid Students */}
      {unpaidStudents > 0 && (
        <Card title={`Élèves en retard de paiement (${unpaidStudents})`} style={{ marginBottom: 24 }}>
          <Table columns={unpaidCols} dataSource={unpaidList} rowKey="student_id"
            pagination={{ pageSize: 10 }} size="small" loading={isLoading}
            locale={{ emptyText: 'Aucun impayé' }} scroll={{ x: 800 }} />
        </Card>
      )}
    </div>
  );
};

export default ReportsTab;
