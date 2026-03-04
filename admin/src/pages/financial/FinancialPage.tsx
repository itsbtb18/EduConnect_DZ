import React, { useState, useMemo, useCallback } from 'react';
import {
  Button, Tag, Modal, Form, Input, InputNumber, Select, Tabs,
  Space, Tooltip, Popconfirm, Drawer, Alert, DatePicker, Spin,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Table from 'antd/es/table';
import {
  DollarOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  UnorderedListOutlined,
  SettingOutlined,
  EyeOutlined,
  BellOutlined,
  FilterOutlined,
  WarningOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  WalletOutlined,
  CreditCardOutlined,
  BankOutlined,
  UserDeleteOutlined,
} from '@ant-design/icons';
import {
  usePayments, useCreatePayment, useUpdatePayment, useDeletePayment,
  usePaymentStats, useExpiringSoon, useSendReminder, useBulkReminder,
  useFees, useCreateFee, useUpdateFee, useDeleteFee,
  useStudents, useClasses,
} from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { exportToCSV, exportToPDF } from '../../hooks/useExport';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import './FinancialPage.css';

dayjs.locale('fr');

/* ──────────────────────── Types ──────────────────────── */
interface PaymentRecord {
  id: string;
  student: string;
  student_name: string;
  student_photo: string | null;
  class_name: string | null;
  class_id: string | null;
  fee_structure: string;
  fee_structure_name: string;
  payment_type: string;
  amount_paid: number;
  payment_date: string;
  period_start: string;
  period_end: string;
  payment_method: string;
  receipt_number: string;
  notes: string;
  recorded_by: string;
  recorded_by_name: string;
  status: string;
  days_overdue: number | null;
  created_at: string;
  updated_at: string;
}

interface FeeRecord {
  id: string;
  name: string;
  academic_year: string | null;
  academic_year_name: string | null;
  amount_monthly: number | null;
  amount_trimester: number | null;
  amount_annual: number | null;
  description: string;
  created_at: string;
}

interface StatsData {
  total_this_month: number;
  total_this_year: number;
  active_count: number;
  expired_count: number;
  never_paid_count: number;
  expired_students: {
    student_id: string;
    student_name: string;
    class_name: string | null;
    period_end: string;
    days_overdue: number;
    receipt_number: string;
  }[];
}

interface ExpiringSoonRecord {
  id: string;
  student_name: string;
  class_name: string | null;
  fee_structure_name: string;
  period_end: string;
  days_remaining: number;
  amount_paid: number;
}

/* ──────────────────────── Constants ──────────────────── */
const PAYMENT_TYPE_LABELS: Record<string, string> = {
  mensuel: 'Mensuel',
  trimestriel: 'Trimestriel',
  annuel: 'Annuel',
};

const PAYMENT_TYPE_COLORS: Record<string, string> = {
  mensuel: 'blue',
  trimestriel: 'purple',
  annuel: 'cyan',
};

const METHOD_LABELS: Record<string, string> = {
  especes: 'Espèces',
  baridimob: 'BaridiMob',
  cib: 'CIB',
  virement: 'Virement',
};

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  actif:  { color: 'green', icon: <CheckCircleOutlined />, label: 'Actif' },
  expire: { color: 'red',   icon: <CloseCircleOutlined />, label: 'Expiré' },
};

/* ═══════════════════════ Component ═══════════════════════ */
const FinancialPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  /* ---------- State ---------- */
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchText, setSearchText] = useState('');
  const debouncedSearch = useDebounce(searchText, 300);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    searchParams.get('status') || undefined
  );
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [classFilter, setClassFilter] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Modals / Drawer
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payEditRecord, setPayEditRecord] = useState<PaymentRecord | null>(null);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [feeEditRecord, setFeeEditRecord] = useState<FeeRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<PaymentRecord | null>(null);

  const [payForm] = Form.useForm();
  const [feeForm] = Form.useForm();

  /* ---------- API hooks ---------- */
  const listParams = useMemo(() => ({
    page,
    page_size: pageSize,
    student: debouncedSearch || undefined,
    status: statusFilter,
    payment_type: typeFilter,
    class: classFilter,
    date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
    date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
  }), [page, pageSize, debouncedSearch, statusFilter, typeFilter, classFilter, dateRange]);

  const { data, isLoading, refetch } = usePayments(listParams);
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const deletePayment = useDeletePayment();

  const { data: statsRaw, isLoading: statsLoading } = usePaymentStats();
  const { data: expRaw } = useExpiringSoon();
  const sendReminder = useSendReminder();
  const bulkReminder = useBulkReminder();

  const { data: feesData, isLoading: feesLoading } = useFees();
  const createFee = useCreateFee();
  const updateFee = useUpdateFee();
  const deleteFee = useDeleteFee();

  const { data: studentsData } = useStudents({ page_size: 500 });
  const { data: classesData } = useClasses();

  /* ---------- Derived data ---------- */
  const records = ((data as Record<string, unknown>)?.results ?? []) as PaymentRecord[];
  const totalCount = (data as Record<string, unknown>)?.count as number ?? records.length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsAny = (statsRaw ?? {}) as any;
  const stats: StatsData = {
    total_this_month: statsAny.total_this_month ?? 0,
    total_this_year: statsAny.total_this_year ?? 0,
    active_count: statsAny.active_count ?? 0,
    expired_count: statsAny.expired_count ?? 0,
    never_paid_count: statsAny.never_paid_count ?? 0,
    expired_students: statsAny.expired_students ?? [],
  };

  const expiringSoon = ((expRaw as Record<string, unknown>)?.results ?? []) as ExpiringSoonRecord[];
  const fees = ((feesData as Record<string, unknown>)?.results ?? feesData ?? []) as FeeRecord[];
  const students = ((studentsData as Record<string, unknown>)?.results ?? studentsData ?? []) as { id: string; first_name: string; last_name: string; full_name?: string; user?: { first_name: string; last_name: string } }[];
  const classes = ((classesData as Record<string, unknown>)?.results ?? classesData ?? []) as { id: string; name: string }[];

  /* ---------- Helpers ---------- */
  const getStudentLabel = useCallback((s: typeof students[0]) => {
    if (s.full_name) return s.full_name;
    if (s.user) return `${s.user.first_name} ${s.user.last_name}`;
    return `${s.first_name} ${s.last_name}`;
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] ?? '?').toUpperCase();
  };

  const formatDA = (v: number | null | undefined) =>
    v != null ? `${v.toLocaleString('fr-FR')} DA` : '—';

  const formatDate = (d: string | null | undefined) =>
    d ? dayjs(d).format('DD/MM/YYYY') : '—';

  /* ---------- Auto-fill amount from fee structure ---------- */
  const handleFeeStructureChange = useCallback((feeId: string) => {
    const fee = fees.find((f) => f.id === feeId);
    if (!fee) return;
    const pt = payForm.getFieldValue('payment_type') as string;
    let amt: number | null = null;
    if (pt === 'mensuel') amt = fee.amount_monthly;
    else if (pt === 'trimestriel') amt = fee.amount_trimester;
    else if (pt === 'annuel') amt = fee.amount_annual;
    if (amt) payForm.setFieldValue('amount_paid', amt);
  }, [fees, payForm]);

  const handlePaymentTypeChange = useCallback((pt: string) => {
    payForm.setFieldValue('payment_type', pt);
    const feeId = payForm.getFieldValue('fee_structure') as string;
    const fee = fees.find((f) => f.id === feeId);
    if (!fee) return;
    let amt: number | null = null;
    if (pt === 'mensuel') amt = fee.amount_monthly;
    else if (pt === 'trimestriel') amt = fee.amount_trimester;
    else if (pt === 'annuel') amt = fee.amount_annual;
    if (amt) payForm.setFieldValue('amount_paid', amt);

    // Auto-calculate period_end from period_start
    const startVal = payForm.getFieldValue('period_start');
    if (startVal) {
      const start = dayjs(startVal);
      let end = start;
      if (pt === 'mensuel') end = start.add(1, 'month').subtract(1, 'day');
      else if (pt === 'trimestriel') end = start.add(3, 'month').subtract(1, 'day');
      else if (pt === 'annuel') end = start.add(1, 'year').subtract(1, 'day');
      payForm.setFieldValue('period_end', end);
    }
  }, [fees, payForm]);

  const handlePeriodStartChange = useCallback((start: dayjs.Dayjs | null) => {
    if (!start) return;
    const pt = payForm.getFieldValue('payment_type') as string;
    let end = start;
    if (pt === 'mensuel') end = start.add(1, 'month').subtract(1, 'day');
    else if (pt === 'trimestriel') end = start.add(3, 'month').subtract(1, 'day');
    else if (pt === 'annuel') end = start.add(1, 'year').subtract(1, 'day');
    payForm.setFieldValue('period_end', end);
  }, [payForm]);

  /* ---------- Handlers ---------- */
  const openPayModal = useCallback((record?: PaymentRecord) => {
    payForm.resetFields();
    if (record) {
      setPayEditRecord(record);
      payForm.setFieldsValue({
        student: record.student,
        fee_structure: record.fee_structure,
        payment_type: record.payment_type,
        amount_paid: record.amount_paid,
        payment_method: record.payment_method,
        payment_date: dayjs(record.payment_date),
        period_start: dayjs(record.period_start),
        period_end: dayjs(record.period_end),
        notes: record.notes,
      });
    } else {
      setPayEditRecord(null);
      payForm.setFieldsValue({
        payment_type: 'mensuel',
        payment_method: 'especes',
        payment_date: dayjs(),
      });
    }
    setPayModalOpen(true);
  }, [payForm]);

  const handlePaySubmit = async () => {
    try {
      const values = await payForm.validateFields();
      const payload = {
        ...values,
        payment_date: values.payment_date?.format('YYYY-MM-DD'),
        period_start: values.period_start?.format('YYYY-MM-DD'),
        period_end: values.period_end?.format('YYYY-MM-DD'),
      };

      if (payEditRecord) {
        await updatePayment.mutateAsync({ id: payEditRecord.id, data: payload });
      } else {
        const res = await createPayment.mutateAsync(payload);
        const receipt = (res as { data?: { receipt_number?: string } })?.data?.receipt_number;
        if (receipt) {
          message.success(`Paiement enregistré — Reçu N° ${receipt}`);
        } else {
          message.success('Paiement enregistré avec succès');
        }
      }
      setPayModalOpen(false);
      payForm.resetFields();
      setPayEditRecord(null);
    } catch { /* validation error */ }
  };

  const openFeeModal = useCallback((record?: FeeRecord) => {
    feeForm.resetFields();
    if (record) {
      setFeeEditRecord(record);
      feeForm.setFieldsValue({
        name: record.name,
        academic_year: record.academic_year,
        amount_monthly: record.amount_monthly,
        amount_trimester: record.amount_trimester,
        amount_annual: record.amount_annual,
        description: record.description,
      });
    } else {
      setFeeEditRecord(null);
    }
    setFeeModalOpen(true);
  }, [feeForm]);

  const handleFeeSubmit = async () => {
    try {
      const values = await feeForm.validateFields();
      if (feeEditRecord) {
        await updateFee.mutateAsync({ id: feeEditRecord.id, data: values });
      } else {
        await createFee.mutateAsync(values);
      }
      setFeeModalOpen(false);
      feeForm.resetFields();
      setFeeEditRecord(null);
    } catch { /* validation error */ }
  };

  const handleSendReminder = useCallback(async (record: PaymentRecord) => {
    try {
      await sendReminder.mutateAsync(record.id);
      message.success(`Notification envoyée aux parents de ${record.student_name}`);
    } catch { /* handled in hook */ }
  }, [sendReminder]);

  const handleBulkReminder = useCallback(async () => {
    await bulkReminder.mutateAsync();
  }, [bulkReminder]);

  const openDrawer = useCallback((record: PaymentRecord) => {
    setDrawerRecord(record);
    setDrawerOpen(true);
  }, []);

  /* ---------- Exports ---------- */
  const exportCols = [
    { key: 'student_name', title: 'Élève' },
    { key: 'class_name', title: 'Classe' },
    { key: 'payment_type', title: 'Type' },
    { key: 'amount_paid', title: 'Montant (DA)' },
    { key: 'payment_method', title: 'Méthode' },
    { key: 'payment_date', title: 'Date' },
    { key: 'period_start', title: 'Début période' },
    { key: 'period_end', title: 'Fin période' },
    { key: 'status', title: 'Statut' },
    { key: 'receipt_number', title: 'N° Reçu' },
  ];

  const handleExportCSV = () => {
    if (!records.length) { message.warning('Aucune donnée à exporter'); return; }
    exportToCSV(records as unknown as Record<string, unknown>[], exportCols, 'paiements');
  };

  const handleExportPDF = () => {
    if (!records.length) { message.warning('Aucune donnée à exporter'); return; }
    exportToPDF(
      records as unknown as Record<string, unknown>[],
      exportCols.map((c) => ({ ...c, width: 60 })),
      'paiements',
      'Rapport des paiements',
    );
  };

  /* ---------- Filter status from URL ---------- */
  const handleStatusFilterChange = (v: string | undefined) => {
    setStatusFilter(v);
    setPage(1);
    if (v) {
      setSearchParams({ status: v }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  /* ──────────────────── Payment columns ──────────────────── */
  const paymentColumns: ColumnsType<PaymentRecord> = [
    {
      title: 'Élève',
      key: 'student',
      width: 200,
      render: (_, r) => (
        <div className="pay-student-cell">
          <div className="pay-student-cell__avatar">
            {r.student_photo
              ? <img src={r.student_photo} alt="" />
              : getInitials(r.student_name)}
          </div>
          <div>
            <div className="pay-student-cell__name">{r.student_name || '—'}</div>
            {r.class_name && <div className="pay-student-cell__class">{r.class_name}</div>}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'payment_type',
      key: 'payment_type',
      width: 100,
      render: (v: string) => (
        <Tag color={PAYMENT_TYPE_COLORS[v] || 'default'} className="pay-tag">
          {PAYMENT_TYPE_LABELS[v] || v}
        </Tag>
      ),
    },
    {
      title: 'Montant',
      dataIndex: 'amount_paid',
      key: 'amount_paid',
      width: 120,
      render: (v: number) => <span className="pay-amount">{formatDA(v)}</span>,
    },
    {
      title: 'Méthode',
      dataIndex: 'payment_method',
      key: 'payment_method',
      width: 100,
      render: (v: string) => (
        <span className="pay-method">{METHOD_LABELS[v] || v}</span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
      width: 100,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Période',
      key: 'period',
      width: 160,
      render: (_, r) => (
        <span className="pay-period">
          {formatDate(r.period_start)} → {formatDate(r.period_end)}
        </span>
      ),
    },
    {
      title: 'Statut',
      key: 'status',
      width: 130,
      render: (_, r) => {
        const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.actif;
        return (
          <span>
            <Tag icon={cfg.icon} color={cfg.color} className={`pay-tag pay-tag--${r.status}`}>
              {cfg.label}
            </Tag>
            {r.status === 'expire' && r.days_overdue != null && r.days_overdue > 0 && (
              <span className="pay-overdue">+{r.days_overdue}j</span>
            )}
          </span>
        );
      },
    },
    {
      title: 'N° Reçu',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      width: 140,
      render: (v: string) => v ? <span className="pay-receipt">{v}</span> : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Détail">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(r)} />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openPayModal(r)} />
          </Tooltip>
          <Popconfirm title="Supprimer ce paiement ?" onConfirm={() => deletePayment.mutate(r.id)}>
            <Tooltip title="Supprimer">
              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
          {r.status === 'expire' && (
            <Tooltip title="Notifier les parents">
              <Button
                type="text"
                size="small"
                icon={<BellOutlined />}
                onClick={() => handleSendReminder(r)}
                loading={sendReminder.isPending}
                style={{ color: '#D97706' }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  /* ──────────────────── Render ──────────────────── */
  return (
    <div className="pay-page animate-fade-in">
      {/* ── Header ── */}
      <div className="pay-header">
        <div>
          <h1 className="pay-header__title">Gestion des paiements</h1>
          <p className="pay-header__sub">{totalCount} paiement{totalCount !== 1 ? 's' : ''} enregistré{totalCount !== 1 ? 's' : ''}</p>
        </div>
        <div className="pay-header__actions">
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>PDF</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>CSV</Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openPayModal()}>
            Nouveau paiement
          </Button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="pay-stats pay-animate">
        <div className="pay-stats__card pay-stats__card--teal">
          <div className="pay-stats__icon"><DollarOutlined /></div>
          <div>
            <div className="pay-stats__value">
              {statsLoading ? <Spin size="small" /> : formatDA(stats.total_this_month)}
            </div>
            <div className="pay-stats__label">Ce mois</div>
          </div>
        </div>

        <div className="pay-stats__card pay-stats__card--navy">
          <div className="pay-stats__icon"><WalletOutlined /></div>
          <div>
            <div className="pay-stats__value">
              {statsLoading ? <Spin size="small" /> : formatDA(stats.total_this_year)}
            </div>
            <div className="pay-stats__label">Cette année</div>
          </div>
        </div>

        <div className="pay-stats__card pay-stats__card--green">
          <div className="pay-stats__icon"><CheckCircleOutlined /></div>
          <div>
            <div className="pay-stats__value">{statsLoading ? <Spin size="small" /> : stats.active_count}</div>
            <div className="pay-stats__label">Paiements actifs</div>
          </div>
        </div>

        <div className="pay-stats__card pay-stats__card--red">
          <div className="pay-stats__icon"><ExclamationCircleOutlined /></div>
          <div>
            <div className="pay-stats__value">{statsLoading ? <Spin size="small" /> : stats.expired_count}</div>
            <div className="pay-stats__label">Paiements expirés</div>
          </div>
        </div>

        <div className="pay-stats__card pay-stats__card--orange">
          <div className="pay-stats__icon"><UserDeleteOutlined /></div>
          <div>
            <div className="pay-stats__value">{statsLoading ? <Spin size="small" /> : stats.never_paid_count}</div>
            <div className="pay-stats__label">Jamais payé</div>
          </div>
        </div>
      </div>

      {/* ── Alert: expired ── */}
      {stats.expired_count > 0 && (
        <Alert
          className="pay-alert"
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={`${stats.expired_count} paiement${stats.expired_count > 1 ? 's' : ''} expiré${stats.expired_count > 1 ? 's' : ''}`}
          description={
            <div>
              <div className="pay-alert__list">
                {stats.expired_students.slice(0, 8).map((s) => (
                  <Tag key={s.student_id} className="pay-alert__tag" color="red">
                    {s.student_name}{s.class_name ? ` (${s.class_name})` : ''} — +{s.days_overdue}j
                  </Tag>
                ))}
                {stats.expired_students.length > 8 && (
                  <Tag className="pay-alert__tag">+{stats.expired_students.length - 8} autres</Tag>
                )}
              </div>
              <div className="pay-alert__actions">
                <Button
                  size="small"
                  type="primary"
                  danger
                  onClick={() => handleStatusFilterChange('expire')}
                >
                  Voir tous les expirés
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* ── Alert: expiring soon ── */}
      {expiringSoon.length > 0 && (
        <Alert
          className="pay-alert"
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`${expiringSoon.length} paiement${expiringSoon.length > 1 ? 's' : ''} expire${expiringSoon.length > 1 ? 'nt' : ''} dans les 7 prochains jours`}
          description={
            <div>
              <div className="pay-alert__list">
                {expiringSoon.slice(0, 6).map((e) => (
                  <Tag key={e.id} className="pay-alert__tag" color="orange">
                    {e.student_name} — {e.days_remaining}j restant{e.days_remaining > 1 ? 's' : ''}
                  </Tag>
                ))}
              </div>
              <div className="pay-alert__actions">
                <Button
                  size="small"
                  icon={<BellOutlined />}
                  onClick={handleBulkReminder}
                  loading={bulkReminder.isPending}
                >
                  Envoyer rappels aux parents
                </Button>
              </div>
            </div>
          }
        />
      )}

      {/* ── Tabs ── */}
      <Tabs
        className="pay-tabs"
        items={[
          {
            key: 'payments',
            label: <span><UnorderedListOutlined /> Paiements</span>,
            children: (
              <>
                {/* Filters */}
                <div className="pay-filters">
                  <FilterOutlined className="pay-filters__icon" />
                  <Input
                    prefix={<SearchOutlined />}
                    placeholder="Rechercher un élève..."
                    value={searchText}
                    onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                    allowClear
                    className="pay-filters__search"
                  />
                  <Select
                    placeholder="Type"
                    allowClear
                    value={typeFilter}
                    onChange={(v) => { setTypeFilter(v); setPage(1); }}
                    className="pay-filters__select"
                    options={[
                      { value: 'mensuel', label: 'Mensuel' },
                      { value: 'trimestriel', label: 'Trimestriel' },
                      { value: 'annuel', label: 'Annuel' },
                    ]}
                  />
                  <Select
                    placeholder="Statut"
                    allowClear
                    value={statusFilter}
                    onChange={handleStatusFilterChange}
                    className="pay-filters__select"
                    options={[
                      { value: 'actif', label: 'Actif' },
                      { value: 'expire', label: 'Expiré' },
                    ]}
                  />
                  <Select
                    placeholder="Classe"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    value={classFilter}
                    onChange={(v) => { setClassFilter(v); setPage(1); }}
                    className="pay-filters__select"
                    options={classes.map((c) => ({ value: c.id, label: c.name }))}
                  />
                  <DatePicker.RangePicker
                    value={dateRange}
                    onChange={(v) => { setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null); setPage(1); }}
                    format="DD/MM/YYYY"
                    placeholder={['Date début', 'Date fin']}
                    className="pay-filters__range"
                  />
                </div>

                {/* Table */}
                <div className="pay-table-wrap">
                  <Table<PaymentRecord>
                    className="pay-table"
                    columns={paymentColumns}
                    dataSource={records}
                    loading={isLoading}
                    rowKey="id"
                    scroll={{ x: 1200 }}
                    pagination={{
                      current: page,
                      pageSize,
                      total: totalCount,
                      onChange: (p) => setPage(p),
                      showSizeChanger: false,
                      showTotal: (total) => `${total} paiement${total > 1 ? 's' : ''}`,
                    }}
                    locale={{ emptyText: 'Aucun paiement trouvé' }}
                  />
                </div>
              </>
            ),
          },
          {
            key: 'fees',
            label: <span><SettingOutlined /> Structure de frais</span>,
            children: (
              <>
                <div className="pay-fee-header">
                  <span className="pay-fee-header__info">{fees.length} structure{fees.length !== 1 ? 's' : ''} de frais</span>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openFeeModal()}>
                    Nouvelle structure
                  </Button>
                </div>

                {feesLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div>
                ) : fees.length === 0 ? (
                  <div className="pay-empty">
                    <div className="pay-empty__icon"><SettingOutlined /></div>
                    <div className="pay-empty__text">Aucune structure de frais définie. Cliquez sur « Nouvelle structure » pour commencer.</div>
                  </div>
                ) : (
                  <div className="pay-fee-grid">
                    {fees.map((f) => (
                      <div key={f.id} className="pay-fee-card">
                        <div className="pay-fee-card__header">
                          <span className="pay-fee-card__name">{f.name}</span>
                          {f.academic_year_name && (
                            <span className="pay-fee-card__year">{f.academic_year_name}</span>
                          )}
                        </div>
                        <div className="pay-fee-card__amounts">
                          {f.amount_monthly != null && (
                            <div className="pay-fee-card__amount">
                              <div className="pay-fee-card__amount-label">Mensuel</div>
                              <div className="pay-fee-card__amount-value">{f.amount_monthly.toLocaleString('fr-FR')}</div>
                            </div>
                          )}
                          {f.amount_trimester != null && (
                            <div className="pay-fee-card__amount">
                              <div className="pay-fee-card__amount-label">Trimestriel</div>
                              <div className="pay-fee-card__amount-value">{f.amount_trimester.toLocaleString('fr-FR')}</div>
                            </div>
                          )}
                          {f.amount_annual != null && (
                            <div className="pay-fee-card__amount">
                              <div className="pay-fee-card__amount-label">Annuel</div>
                              <div className="pay-fee-card__amount-value">{f.amount_annual.toLocaleString('fr-FR')}</div>
                            </div>
                          )}
                          {f.amount_monthly == null && f.amount_trimester == null && f.amount_annual == null && (
                            <div className="pay-fee-card__amount">
                              <div className="pay-fee-card__amount-label">Montant</div>
                              <div className="pay-fee-card__amount-value">—</div>
                            </div>
                          )}
                        </div>
                        {f.description && <div className="pay-fee-card__desc">{f.description}</div>}
                        <div className="pay-fee-card__actions">
                          <Button size="small" icon={<EditOutlined />} onClick={() => openFeeModal(f)}>Modifier</Button>
                          <Popconfirm title="Supprimer cette structure ?" onConfirm={() => deleteFee.mutate(f.id)}>
                            <Button size="small" icon={<DeleteOutlined />} danger>Supprimer</Button>
                          </Popconfirm>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ),
          },
        ]}
      />

      {/* ═══════════════ Payment Modal ═══════════════ */}
      <Modal
        title={payEditRecord ? 'Modifier le paiement' : 'Nouveau paiement'}
        open={payModalOpen}
        onOk={handlePaySubmit}
        onCancel={() => { setPayModalOpen(false); setPayEditRecord(null); }}
        confirmLoading={createPayment.isPending || updatePayment.isPending}
        okText={payEditRecord ? 'Mettre à jour' : 'Enregistrer'}
        cancelText="Annuler"
        width={600}
        className="pay-modal"
        destroyOnClose
      >
        <Form form={payForm} layout="vertical">
          <Form.Item label="Élève" name="student" rules={[{ required: true, message: 'Sélectionnez un élève' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Rechercher un élève..."
              disabled={!!payEditRecord}
              options={students.map((s) => ({
                value: s.id,
                label: getStudentLabel(s),
              }))}
            />
          </Form.Item>

          <Form.Item label="Structure de frais" name="fee_structure" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner une structure"
              onChange={handleFeeStructureChange}
              options={fees.map((f) => ({
                value: f.id,
                label: f.name,
              }))}
              notFoundContent="Aucune structure de frais. Créez-en dans l'onglet 'Structure de frais'."
            />
          </Form.Item>

          <Form.Item label="Type de paiement" name="payment_type" rules={[{ required: true, message: 'Requis' }]}>
            <div className="pay-type-toggle">
              {(['mensuel', 'trimestriel', 'annuel'] as const).map((t) => (
                <Button
                  key={t}
                  className={`pay-type-toggle__btn ${payForm.getFieldValue('payment_type') === t ? 'pay-type-toggle__btn--active' : ''}`}
                  onClick={() => handlePaymentTypeChange(t)}
                >
                  {PAYMENT_TYPE_LABELS[t]}
                </Button>
              ))}
            </div>
          </Form.Item>

          <Form.Item label="Montant (DA)" name="amount_paid" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} className="w-full" placeholder="Montant" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Méthode de paiement" name="payment_method" rules={[{ required: true, message: 'Requis' }]}>
            <div className="pay-method-toggle">
              {(['especes', 'baridimob', 'cib', 'virement'] as const).map((m) => (
                <Button
                  key={m}
                  className={`pay-method-toggle__btn ${payForm.getFieldValue('payment_method') === m ? 'pay-method-toggle__btn--active' : ''}`}
                  onClick={() => payForm.setFieldValue('payment_method', m)}
                >
                  {METHOD_LABELS[m]}
                </Button>
              ))}
            </div>
          </Form.Item>

          <Form.Item label="Date de paiement" name="payment_date" rules={[{ required: true, message: 'Requis' }]}>
            <DatePicker format="DD/MM/YYYY" className="w-full" style={{ width: '100%' }} />
          </Form.Item>

          <Space style={{ width: '100%' }} size={16}>
            <Form.Item label="Début de période" name="period_start" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <DatePicker
                format="DD/MM/YYYY"
                style={{ width: '100%' }}
                onChange={handlePeriodStartChange}
              />
            </Form.Item>
            <Form.Item label="Fin de période" name="period_end" rules={[{ required: true, message: 'Requis' }]} style={{ flex: 1 }}>
              <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Notes optionnelles..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ═══════════════ Fee Structure Modal ═══════════════ */}
      <Modal
        title={feeEditRecord ? 'Modifier la structure de frais' : 'Nouvelle structure de frais'}
        open={feeModalOpen}
        onOk={handleFeeSubmit}
        onCancel={() => { setFeeModalOpen(false); setFeeEditRecord(null); }}
        confirmLoading={createFee.isPending || updateFee.isPending}
        okText={feeEditRecord ? 'Mettre à jour' : 'Créer'}
        cancelText="Annuler"
        className="pay-modal"
        destroyOnClose
      >
        <Form form={feeForm} layout="vertical">
          <Form.Item label="Nom" name="name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Frais de scolarité, Transport..." />
          </Form.Item>
          <Form.Item label="Montant mensuel (DA)" name="amount_monthly">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Montant mensuel" />
          </Form.Item>
          <Form.Item label="Montant trimestriel (DA)" name="amount_trimester">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Montant trimestriel" />
          </Form.Item>
          <Form.Item label="Montant annuel (DA)" name="amount_annual">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Montant annuel" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} placeholder="Description optionnelle..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ═══════════════ Detail Drawer ═══════════════ */}
      <Drawer
        title="Détail du paiement"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDrawerRecord(null); }}
        width={480}
        extra={
          drawerRecord && (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => { setDrawerOpen(false); openPayModal(drawerRecord); }}>
                Modifier
              </Button>
              {drawerRecord.status === 'expire' && (
                <Button
                  icon={<BellOutlined />}
                  onClick={() => handleSendReminder(drawerRecord)}
                  loading={sendReminder.isPending}
                >
                  Rappel
                </Button>
              )}
            </Space>
          )
        }
      >
        {drawerRecord && (
          <div className="pay-detail">
            {/* Student header */}
            <div className="pay-detail__header">
              <div className="pay-detail__avatar">
                {drawerRecord.student_photo
                  ? <img src={drawerRecord.student_photo} alt="" />
                  : getInitials(drawerRecord.student_name)}
              </div>
              <div>
                <div className="pay-detail__name">{drawerRecord.student_name}</div>
                {drawerRecord.class_name && (
                  <div className="pay-detail__class">{drawerRecord.class_name}</div>
                )}
              </div>
            </div>

            {/* Info rows */}
            <div className="pay-detail__row">
              <span className="pay-detail__label">N° Reçu</span>
              <span className="pay-detail__value">
                <span className="pay-receipt">{drawerRecord.receipt_number}</span>
              </span>
            </div>
            <div className="pay-detail__row">
              <span className="pay-detail__label">Statut</span>
              <span className="pay-detail__value">
                <Tag
                  icon={STATUS_CONFIG[drawerRecord.status]?.icon}
                  color={STATUS_CONFIG[drawerRecord.status]?.color}
                  className={`pay-tag pay-tag--${drawerRecord.status}`}
                >
                  {STATUS_CONFIG[drawerRecord.status]?.label || drawerRecord.status}
                </Tag>
                {drawerRecord.status === 'expire' && drawerRecord.days_overdue != null && drawerRecord.days_overdue > 0 && (
                  <span className="pay-overdue">+{drawerRecord.days_overdue} jour{drawerRecord.days_overdue > 1 ? 's' : ''} de retard</span>
                )}
              </span>
            </div>
            <div className="pay-detail__row">
              <span className="pay-detail__label">Structure</span>
              <span className="pay-detail__value">{drawerRecord.fee_structure_name || '—'}</span>
            </div>
            <div className="pay-detail__row">
              <span className="pay-detail__label">Type</span>
              <span className="pay-detail__value">
                <Tag color={PAYMENT_TYPE_COLORS[drawerRecord.payment_type]}>
                  {PAYMENT_TYPE_LABELS[drawerRecord.payment_type] || drawerRecord.payment_type}
                </Tag>
              </span>
            </div>
            <div className="pay-detail__row">
              <span className="pay-detail__label">Montant</span>
              <span className="pay-detail__value pay-amount">{formatDA(drawerRecord.amount_paid)}</span>
            </div>
            <div className="pay-detail__row">
              <span className="pay-detail__label">Méthode</span>
              <span className="pay-detail__value">
                <span className="pay-method">{METHOD_LABELS[drawerRecord.payment_method] || drawerRecord.payment_method}</span>
              </span>
            </div>
            <div className="pay-detail__row">
              <span className="pay-detail__label">Date paiement</span>
              <span className="pay-detail__value">{formatDate(drawerRecord.payment_date)}</span>
            </div>
            <div className="pay-detail__row">
              <span className="pay-detail__label">Période</span>
              <span className="pay-detail__value">
                {formatDate(drawerRecord.period_start)} → {formatDate(drawerRecord.period_end)}
              </span>
            </div>
            <div className="pay-detail__row">
              <span className="pay-detail__label">Enregistré par</span>
              <span className="pay-detail__value">{drawerRecord.recorded_by_name || '—'}</span>
            </div>
            {drawerRecord.notes && (
              <div className="pay-detail__row">
                <span className="pay-detail__label">Notes</span>
                <span className="pay-detail__value">{drawerRecord.notes}</span>
              </div>
            )}
            <div className="pay-detail__row">
              <span className="pay-detail__label">Créé le</span>
              <span className="pay-detail__value">{dayjs(drawerRecord.created_at).format('DD/MM/YYYY HH:mm')}</span>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default FinancialPage;
