import React, { useState, useMemo, useCallback } from 'react';
import {
  Table, Button, Tag, DatePicker, Select, Modal, Form, Card,
  Space, Tabs, Tooltip, Input, Drawer, Popconfirm, Spin, Badge, Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  FilterOutlined,
  DownloadOutlined,
  TeamOutlined,
  CalendarOutlined,
  FilePdfOutlined,
  TableOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  CheckOutlined,
  DeleteOutlined,
  WarningOutlined,
  SearchOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import {
  useAttendance, useMarkAttendance, useBulkMarkAttendance,
  useStudents, useClasses, useAbsenceStats, useJustifyAbsence, useCancelAbsence,
} from '../../hooks/useApi';
import { attendanceAPI } from '../../api/services';
import { exportToCSV, exportToPDF } from '../../hooks/useExport';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import './AttendancePage.css';

dayjs.extend(isoWeek);

/* ──────────────────────── Types ──────────────────────────────── */
interface AttendanceRow {
  id: string;
  student_name: string;
  student_id_number: string;
  class_name: string;
  date: string;
  period: string;
  status: string;
  note: string;
  is_justified: boolean;
  justification_note: string;
  teacher_name: string;
  justified_by_name: string;
  justified_at: string | null;
  student_phone: string;
  parent_phone: string;
  student: string;
  class_obj: string;
  marked_by: string;
}

interface StatsData {
  today_count: number;
  week_count: number;
  month_count: number;
  at_risk_students: { student_id: string; student_name: string; absence_count: number }[];
  teachers_not_marked: string[];
}

/* ──────────────────────── Status helpers ─────────────────────── */
const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  PRESENT: { color: 'green', icon: <CheckCircleOutlined />, label: 'Présent' },
  ABSENT:  { color: 'red',   icon: <CloseCircleOutlined />, label: 'Absent' },
  LATE:    { color: 'orange', icon: <ClockCircleOutlined />, label: 'En retard' },
};

const periodLabels: Record<string, string> = {
  MORNING: 'Matin',
  AFTERNOON: 'Après-midi',
};

/* ═══════════════════════ Component ═══════════════════════════════ */
const AttendancePage: React.FC = () => {
  /* ---------- State ---------- */
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [classFilter, setClassFilter] = useState<string | undefined>();
  const [justifiedFilter, setJustifiedFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // Modals & drawers
  const [markModalOpen, setMarkModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [justifyModalOpen, setJustifyModalOpen] = useState(false);
  const [justifyRecord, setJustifyRecord] = useState<AttendanceRow | null>(null);
  const [justifyNote, setJustifyNote] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<AttendanceRow | null>(null);

  // Bulk marking
  const [bulkClass, setBulkClass] = useState<string>('');
  const [bulkDate, setBulkDate] = useState<dayjs.Dayjs>(dayjs());
  const [bulkStatuses, setBulkStatuses] = useState<Record<string, string>>({});
  const [form] = Form.useForm();

  // Grid view
  const [gridWeek, setGridWeek] = useState<dayjs.Dayjs>(dayjs());

  /* ---------- API hooks ---------- */
  const listParams = useMemo(() => ({
    page,
    page_size: pageSize,
    status: statusFilter,
    class_id: classFilter,
    is_justified: justifiedFilter,
    search: searchText || undefined,
    date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
    date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
  }), [page, pageSize, statusFilter, classFilter, justifiedFilter, searchText, dateRange]);

  const { data, isLoading, refetch } = useAttendance(listParams);
  const { data: statsRaw, isLoading: statsLoading } = useAbsenceStats();
  const { data: studentsData } = useStudents({ page_size: 200 });
  const { data: classesData } = useClasses();
  const markAttendance = useMarkAttendance();
  const bulkMark = useBulkMarkAttendance();
  const justifyMut = useJustifyAbsence();
  const cancelMut = useCancelAbsence();

  /* ---------- Derived data ---------- */
  const stats = (statsRaw ?? {}) as StatsData;
  const records = ((data as Record<string, unknown>)?.results ?? data ?? []) as AttendanceRow[];
  const totalCount = (data as Record<string, unknown>)?.count as number ?? records.length;
  const students = ((studentsData as Record<string, unknown>)?.results ?? studentsData ?? []) as Record<string, unknown>[];
  const classes = ((classesData as Record<string, unknown>)?.results ?? classesData ?? []) as { id: string; name: string }[];

  // Bulk-filtered students
  const bulkStudents = bulkClass
    ? students.filter((s) => s.class_assigned === bulkClass)
    : students;

  /* ---------- Grid logic ---------- */
  const weekStart = gridWeek.startOf('isoWeek');
  const weekEnd = gridWeek.endOf('isoWeek');
  const weekDays = Array.from({ length: 6 }, (_, i) => weekStart.add(i, 'day'));

  const { data: gridData, isLoading: gridLoading } = useAttendance({
    page_size: 5000,
    date_from: weekStart.format('YYYY-MM-DD'),
    date_to: weekEnd.format('YYYY-MM-DD'),
  });

  const gridMatrix = useMemo(() => {
    const recs = ((gridData as Record<string, unknown>)?.results ?? gridData ?? []) as AttendanceRow[];
    const matrix: Record<string, Record<string, {
      present: number; absent: number; late: number; total: number; records: AttendanceRow[];
    }>> = {};
    for (const r of recs) {
      const cn = r.class_name || 'Inconnue';
      const dk = dayjs(r.date).format('YYYY-MM-DD');
      if (!matrix[cn]) matrix[cn] = {};
      if (!matrix[cn][dk]) matrix[cn][dk] = { present: 0, absent: 0, late: 0, total: 0, records: [] };
      const c = matrix[cn][dk];
      c.total += 1;
      c.records.push(r);
      if (r.status === 'PRESENT') c.present += 1;
      else if (r.status === 'ABSENT') c.absent += 1;
      else if (r.status === 'LATE') c.late += 1;
    }
    return matrix;
  }, [gridData]);

  const gridClassNames = Object.keys(gridMatrix).sort();

  /* ---------- Cell detail modal (grid) ---------- */
  const [cellDetailOpen, setCellDetailOpen] = useState(false);
  const [cellTitle, setCellTitle] = useState('');
  const [cellRecords, setCellRecords] = useState<AttendanceRow[]>([]);

  const handleCellClick = (cn: string, dk: string) => {
    const cell = gridMatrix[cn]?.[dk];
    if (!cell || cell.total === 0) return;
    setCellTitle(`${cn} — ${dayjs(dk).format('dddd DD/MM/YYYY')}`);
    setCellRecords(cell.records);
    setCellDetailOpen(true);
  };

  /* ---------- Handlers ---------- */
  const openJustifyModal = (record: AttendanceRow) => {
    setJustifyRecord(record);
    setJustifyNote('');
    setJustifyModalOpen(true);
  };

  const handleJustify = async () => {
    if (!justifyRecord) return;
    await justifyMut.mutateAsync({ id: justifyRecord.id, note: justifyNote });
    setJustifyModalOpen(false);
  };

  const handleCancel = async (id: string) => {
    await cancelMut.mutateAsync(id);
  };

  const openDrawer = (record: AttendanceRow) => {
    setDrawerRecord(record);
    setDrawerOpen(true);
  };

  const handleMark = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        class_id: values.class_id,
        date: values.date?.format('YYYY-MM-DD'),
        period: values.period || 'MORNING',
        records: [{
          student_id: values.student,
          status: values.status,
          note: values.note || '',
        }],
      };
      await markAttendance.mutateAsync(payload);
      setMarkModalOpen(false);
      form.resetFields();
    } catch { /* validation */ }
  };

  const handleBulkMark = async () => {
    const recs = Object.entries(bulkStatuses)
      .filter(([, s]) => !!s)
      .map(([sid, s]) => ({ student_id: sid, status: s }));
    if (recs.length === 0) return;
    await bulkMark.mutateAsync({
      class_id: bulkClass,
      date: bulkDate.format('YYYY-MM-DD'),
      records: recs,
    });
    setBulkModalOpen(false);
    setBulkStatuses({});
  };

  const markAllPresent = () => {
    const s: Record<string, string> = {};
    bulkStudents.forEach((st) => { s[st.id as string] = 'PRESENT'; });
    setBulkStatuses(s);
  };

  /* ---------- Export ---------- */
  const handleExportCSV = useCallback(async () => {
    try {
      const res = await attendanceAPI.report({
        class_id: classFilter,
        status: statusFilter,
        is_justified: justifiedFilter,
        date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
        date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
      });
      const blob = new Blob([res.data as BlobPart], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `absences_${dayjs().format('YYYY-MM-DD')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback to client-side export
      exportToCSV(records as unknown as Record<string, unknown>[], [
        { key: 'student_name', title: 'Élève' },
        { key: 'class_name', title: 'Classe' },
        { key: 'date', title: 'Date' },
        { key: 'status', title: 'Statut' },
        { key: 'is_justified', title: 'Justifié' },
      ], 'absences');
    }
  }, [classFilter, statusFilter, justifiedFilter, dateRange, records]);

  const handleExportPDF = () => {
    exportToPDF(records as unknown as Record<string, unknown>[], [
      { key: 'student_name', title: 'Élève' },
      { key: 'class_name', title: 'Classe' },
      { key: 'date', title: 'Date' },
      { key: 'period', title: 'Période' },
      { key: 'status', title: 'Statut' },
      { key: 'is_justified', title: 'Justifié' },
    ], 'absences', 'Suivi des absences');
  };

  /* ---------- Table columns ---------- */
  const columns: ColumnsType<AttendanceRow> = [
    {
      title: 'Élève',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 220,
      render: (v: string, r) => (
        <div className="att-student-cell">
          <div className="att-student-cell__avatar">
            {v ? v.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?'}
          </div>
          <div>
            <div className="att-student-cell__name">{v || '—'}</div>
            <div className="att-student-cell__class">{r.class_name || ''}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 140,
      render: (v: string) => v ? dayjs(v).format('DD MMM YYYY') : '—',
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Période',
      dataIndex: 'period',
      key: 'period',
      width: 110,
      render: (v: string) => (
        <Tag color="default">{periodLabels[v] || v || '—'}</Tag>
      ),
    },
    {
      title: 'Marqué par',
      dataIndex: 'teacher_name',
      key: 'teacher_name',
      width: 160,
      render: (v: string) => v || '—',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: string) => {
        const cfg = statusConfig[v] || statusConfig.PRESENT;
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Justifié',
      key: 'justified',
      width: 110,
      render: (_, r) => r.is_justified
        ? <Tag color="blue" icon={<CheckCircleOutlined />}>Oui</Tag>
        : r.status === 'ABSENT'
          ? <Tag color="default">Non</Tag>
          : <span className="att-na">—</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Détails">
            <Button type="text" size="small" icon={<EyeOutlined />}
              onClick={() => openDrawer(r)} />
          </Tooltip>
          {r.status === 'ABSENT' && !r.is_justified && (
            <Tooltip title="Justifier">
              <Button type="text" size="small" icon={<CheckOutlined />}
                className="att-action--justify"
                onClick={() => openJustifyModal(r)} />
            </Tooltip>
          )}
          <Popconfirm
            title="Supprimer cet enregistrement ?"
            description="Cette action est irréversible."
            onConfirm={() => handleCancel(r.id)}
            okText="Supprimer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Supprimer">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ---------- Bulk columns ---------- */
  const bulkColumns: ColumnsType<Record<string, unknown>> = [
    {
      title: 'Élève',
      key: 'name',
      render: (_, r) => {
        const u = r.user as Record<string, string> | undefined;
        return <span style={{ fontWeight: 600 }}>
          {u ? `${u.first_name} ${u.last_name}` : `${r.first_name} ${r.last_name}`}
        </span>;
      },
    },
    {
      title: 'Statut',
      key: 'status',
      width: 200,
      render: (_, r) => (
        <Select
          value={bulkStatuses[r.id as string] || undefined}
          onChange={(v) => setBulkStatuses(prev => ({ ...prev, [r.id as string]: v }))}
          placeholder="Sélectionner"
          className="att-bulk-select"
          allowClear
        >
          <Select.Option value="PRESENT"><Tag color="green">Présent</Tag></Select.Option>
          <Select.Option value="ABSENT"><Tag color="red">Absent</Tag></Select.Option>
          <Select.Option value="LATE"><Tag color="orange">En retard</Tag></Select.Option>
        </Select>
      ),
    },
  ];

  /* ──────────────────────── RENDER ──────────────────────────── */
  return (
    <div className="att-page animate-fade-in">
      {/* ── Page header ── */}
      <div className="att-header">
        <div className="att-header__info">
          <h1 className="att-header__title">Suivi des absences</h1>
          <p className="att-header__sub">{totalCount} enregistrements</p>
        </div>
        <div className="att-header__actions">
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>PDF</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>CSV</Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
          <Button icon={<TeamOutlined />} onClick={() => { setBulkStatuses({}); setBulkModalOpen(true); }}>
            Marquage en masse
          </Button>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { form.resetFields(); setMarkModalOpen(true); }}>
            Marquer
          </Button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="att-stats">
        <div className="att-stats__card att-stats__card--danger">
          <div className="att-stats__icon"><CloseCircleOutlined /></div>
          <div>
            <div className="att-stats__value">
              {statsLoading ? <Spin size="small" /> : (stats.today_count ?? 0)}
            </div>
            <div className="att-stats__label">Absences aujourd'hui</div>
          </div>
        </div>
        <div className="att-stats__card att-stats__card--warning">
          <div className="att-stats__icon"><CalendarOutlined /></div>
          <div>
            <div className="att-stats__value">
              {statsLoading ? <Spin size="small" /> : (stats.week_count ?? 0)}
            </div>
            <div className="att-stats__label">Cette semaine</div>
          </div>
        </div>
        <div className="att-stats__card att-stats__card--risk">
          <div className="att-stats__icon"><WarningOutlined /></div>
          <div>
            <div className="att-stats__value">
              {statsLoading ? <Spin size="small" /> : (stats.at_risk_students?.length ?? 0)}
            </div>
            <div className="att-stats__label">Élèves à risque</div>
          </div>
        </div>
        <div className="att-stats__card att-stats__card--info">
          <div className="att-stats__icon"><ExclamationCircleOutlined /></div>
          <div>
            <div className="att-stats__value">
              {statsLoading ? <Spin size="small" /> : (stats.teachers_not_marked?.length ?? 0)}
            </div>
            <div className="att-stats__label">Profs — non marqué</div>
          </div>
        </div>
      </div>

      {/* ── At-risk alert ── */}
      {stats.at_risk_students && stats.at_risk_students.length > 0 && (
        <Alert
          className="att-alert"
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="Élèves à risque (≥5 absences non-justifiées ce mois)"
          description={
            <div className="att-alert__list">
              {stats.at_risk_students.map(s => (
                <Tag key={s.student_id} color="volcano" className="att-alert__tag">
                  {s.student_name} — {s.absence_count} abs.
                </Tag>
              ))}
            </div>
          }
        />
      )}

      {/* ── Teachers not marked alert ── */}
      {stats.teachers_not_marked && stats.teachers_not_marked.length > 0 && (
        <Alert
          className="att-alert"
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Enseignants n'ayant pas encore marqué la présence aujourd'hui"
          description={
            <div className="att-alert__list">
              {stats.teachers_not_marked.map((name, i) => (
                <Tag key={i} color="blue" className="att-alert__tag">{name}</Tag>
              ))}
            </div>
          }
        />
      )}

      {/* ── Tabs: List + Grid ── */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="att-tabs" items={[
        {
          key: 'list',
          label: <span><UnorderedListOutlined /> Liste</span>,
          children: (
            <>
              {/* Filters */}
              <div className="att-filters">
                <FilterOutlined className="att-filters__icon" />
                <Input
                  placeholder="Rechercher un élève…"
                  prefix={<SearchOutlined />}
                  className="att-filters__search"
                  value={searchText}
                  onChange={e => { setSearchText(e.target.value); setPage(1); }}
                  allowClear
                />
                <Select
                  placeholder="Statut"
                  allowClear
                  className="att-filters__select"
                  value={statusFilter}
                  onChange={v => { setStatusFilter(v); setPage(1); }}
                  options={[
                    { value: 'PRESENT', label: 'Présent' },
                    { value: 'ABSENT', label: 'Absent' },
                    { value: 'LATE', label: 'En retard' },
                  ]}
                />
                <Select
                  placeholder="Classe"
                  allowClear showSearch optionFilterProp="label"
                  className="att-filters__select att-filters__select--lg"
                  value={classFilter}
                  onChange={v => { setClassFilter(v); setPage(1); }}
                  options={classes.map(c => ({ value: c.id, label: c.name }))}
                />
                <Select
                  placeholder="Justification"
                  allowClear
                  className="att-filters__select"
                  value={justifiedFilter}
                  onChange={v => { setJustifiedFilter(v); setPage(1); }}
                  options={[
                    { value: 'true', label: 'Justifié' },
                    { value: 'false', label: 'Non justifié' },
                  ]}
                />
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={dates => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                  format="DD/MM/YYYY"
                  placeholder={['Date début', 'Date fin']}
                  className="att-filters__range"
                />
              </div>

              {/* Table */}
              <div className="att-table-wrap">
                <Table<AttendanceRow>
                  columns={columns}
                  dataSource={records}
                  loading={isLoading}
                  rowKey={r => r.id || `${r.student}-${r.date}`}
                  pagination={{
                    current: page,
                    pageSize,
                    total: totalCount,
                    onChange: p => setPage(p),
                    showSizeChanger: false,
                    showTotal: t => `${t} enregistrements`,
                  }}
                  size="middle"
                  locale={{ emptyText: 'Aucun enregistrement trouvé' }}
                  className="att-table"
                />
              </div>
            </>
          ),
        },
        {
          key: 'grid',
          label: <span><TableOutlined /> Grille</span>,
          children: (
            <>
              <div className="att-filters" style={{ marginBottom: 16 }}>
                <CalendarOutlined />
                <span className="att-grid__week-label">
                  Semaine du {weekStart.format('DD/MM/YYYY')} au {weekEnd.format('DD/MM/YYYY')}
                </span>
                <DatePicker
                  picker="week" value={gridWeek}
                  onChange={d => d && setGridWeek(d)}
                  format="[Semaine] ww - YYYY"
                />
                <Button size="small" onClick={() => setGridWeek(dayjs())}>Aujourd&apos;hui</Button>
              </div>

              <div className="att-table-wrap">
                {gridLoading ? (
                  <div className="att-empty"><Spin /></div>
                ) : gridClassNames.length === 0 ? (
                  <div className="att-empty">Aucune donnée de présence pour cette semaine</div>
                ) : (
                  <div className="att-grid__scroll">
                    <table className="att-grid__table">
                      <thead>
                        <tr>
                          <th className="att-grid__th">Classe</th>
                          {weekDays.map(d => (
                            <th key={d.format('YYYY-MM-DD')} className="att-grid__th att-grid__th--day">
                              {d.format('ddd DD/MM')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gridClassNames.map(cn => (
                          <tr key={cn}>
                            <td className="att-grid__class">{cn}</td>
                            {weekDays.map(d => {
                              const dk = d.format('YYYY-MM-DD');
                              const cell = gridMatrix[cn]?.[dk];
                              const pct = cell && cell.total > 0
                                ? Math.round((cell.present / cell.total) * 100) : null;
                              const bg = pct === null ? 'att-grid__cell--none'
                                : pct >= 90 ? 'att-grid__cell--green'
                                : pct >= 75 ? 'att-grid__cell--yellow'
                                : pct >= 50 ? 'att-grid__cell--orange'
                                : 'att-grid__cell--red';
                              return (
                                <td key={dk}
                                  className={`att-grid__cell ${bg} ${cell?.total ? 'att-grid__cell--click' : ''}`}
                                  onClick={() => handleCellClick(cn, dk)}>
                                  {pct !== null ? (
                                    <Tooltip title={`${cell!.present}P / ${cell!.absent}A / ${cell!.late}R`}>
                                      <div className={`att-grid__pct ${pct >= 90 ? 'att-grid__pct--good' : pct >= 75 ? 'att-grid__pct--warn' : 'att-grid__pct--bad'}`}>
                                        {pct}%
                                      </div>
                                      <div className="att-grid__sub">
                                        {cell!.absent > 0 && <span>{cell!.absent} abs</span>}
                                        {cell!.late > 0 && <span> {cell!.late} ret</span>}
                                      </div>
                                    </Tooltip>
                                  ) : <span className="att-grid__na">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ),
        },
      ]} />

      {/* ═══════════ Modals & Drawers ═══════════ */}

      {/* ── Single mark modal ── */}
      <Modal
        title="Marquer la présence"
        open={markModalOpen}
        onOk={handleMark}
        onCancel={() => setMarkModalOpen(false)}
        confirmLoading={markAttendance.isPending}
        okText="Enregistrer" cancelText="Annuler"
        className="att-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Classe" name="class_id" rules={[{ required: true, message: 'Requis' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Sélectionner"
              options={classes.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item label="Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Select showSearch optionFilterProp="label" placeholder="Sélectionner"
              options={students.map(s => {
                const u = s.user as Record<string, string> | undefined;
                return {
                  value: s.id as string,
                  label: u ? `${u.first_name} ${u.last_name}` : `${s.first_name} ${s.last_name}`,
                };
              })} />
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Requis' }]}>
            <DatePicker format="DD/MM/YYYY" className="att-full-width" />
          </Form.Item>
          <Space>
            <Form.Item label="Statut" name="status" rules={[{ required: true, message: 'Requis' }]}>
              <Select placeholder="Statut" style={{ width: 160 }}>
                <Select.Option value="PRESENT">Présent</Select.Option>
                <Select.Option value="ABSENT">Absent</Select.Option>
                <Select.Option value="LATE">En retard</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Période" name="period" initialValue="MORNING">
              <Select style={{ width: 160 }}>
                <Select.Option value="MORNING">Matin</Select.Option>
                <Select.Option value="AFTERNOON">Après-midi</Select.Option>
              </Select>
            </Form.Item>
          </Space>
          <Form.Item label="Note" name="note">
            <Input.TextArea rows={2} placeholder="Note optionnelle…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Bulk marking modal ── */}
      <Modal
        title="Marquage en masse"
        open={bulkModalOpen}
        onOk={handleBulkMark}
        onCancel={() => setBulkModalOpen(false)}
        confirmLoading={bulkMark.isPending}
        okText={`Enregistrer (${Object.values(bulkStatuses).filter(Boolean).length})`}
        cancelText="Annuler" width={700}
        className="att-modal"
      >
        <Space style={{ marginBottom: 12 }}>
          <Select placeholder="Classe" className="att-filters__select--lg"
            value={bulkClass || undefined}
            onChange={v => { setBulkClass(v); setBulkStatuses({}); }}
            options={classes.map(c => ({ value: c.id, label: c.name }))} allowClear />
          <DatePicker value={bulkDate} onChange={d => d && setBulkDate(d)} format="DD/MM/YYYY" />
          <Button size="small" onClick={markAllPresent}>Tous présents</Button>
        </Space>
        <Table
          columns={bulkColumns}
          dataSource={bulkStudents as Record<string, unknown>[]}
          rowKey={r => r.id as string}
          pagination={false} size="small"
          scroll={{ y: 400 }}
          locale={{ emptyText: 'Sélectionnez une classe' }}
        />
      </Modal>

      {/* ── Justify modal ── */}
      <Modal
        title="Justifier l'absence"
        open={justifyModalOpen}
        onOk={handleJustify}
        onCancel={() => setJustifyModalOpen(false)}
        confirmLoading={justifyMut.isPending}
        okText="Justifier" cancelText="Annuler"
        className="att-modal"
      >
        {justifyRecord && (
          <div className="att-justify">
            <div className="att-justify__info">
              <strong>{justifyRecord.student_name}</strong>
              <span>{dayjs(justifyRecord.date).format('DD MMM YYYY')}</span>
              <span>{periodLabels[justifyRecord.period] || justifyRecord.period}</span>
            </div>
            <Input.TextArea
              rows={3}
              placeholder="Motif de justification…"
              value={justifyNote}
              onChange={e => setJustifyNote(e.target.value)}
              maxLength={1000}
              showCount
            />
          </div>
        )}
      </Modal>

      {/* ── Grid cell detail modal ── */}
      <Modal
        title={cellTitle}
        open={cellDetailOpen}
        onCancel={() => setCellDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setCellDetailOpen(false)}>Fermer</Button>,
          <Button key="csv" icon={<DownloadOutlined />} onClick={() => {
            exportToCSV(cellRecords as unknown as Record<string, unknown>[], [
              { key: 'student_name', title: 'Élève' },
              { key: 'status', title: 'Statut' },
              { key: 'is_justified', title: 'Justifié' },
            ], 'detail-absences');
          }}>CSV</Button>,
        ]}
        width={620}
      >
        <Table<AttendanceRow>
          columns={[
            { title: 'Élève', dataIndex: 'student_name', key: 'sn', render: (v: string) => <strong>{v || '—'}</strong> },
            { title: 'Statut', dataIndex: 'status', key: 'st', render: (v: string) => {
              const cfg = statusConfig[v] || statusConfig.PRESENT;
              return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
            }},
            { title: 'Justifié', key: 'j', render: (_, r) => r.is_justified ? <Tag color="blue">Oui</Tag> : <Tag>Non</Tag> },
          ]}
          dataSource={cellRecords}
          rowKey={r => r.id}
          pagination={false} size="small"
        />
      </Modal>

      {/* ── Detail drawer ── */}
      <Drawer
        title="Détail de l'enregistrement"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        className="att-drawer"
      >
        {drawerRecord && (
          <div className="att-detail">
            {/* Student info */}
            <div className="att-detail__section">
              <h3 className="att-detail__heading"><UserOutlined /> Élève</h3>
              <div className="att-detail__row">
                <span className="att-detail__label">Nom</span>
                <span className="att-detail__value">{drawerRecord.student_name}</span>
              </div>
              {drawerRecord.student_id_number && (
                <div className="att-detail__row">
                  <span className="att-detail__label">N° Élève</span>
                  <span className="att-detail__value">{drawerRecord.student_id_number}</span>
                </div>
              )}
              <div className="att-detail__row">
                <span className="att-detail__label">Classe</span>
                <span className="att-detail__value">{drawerRecord.class_name}</span>
              </div>
              {drawerRecord.student_phone && (
                <div className="att-detail__row">
                  <span className="att-detail__label"><PhoneOutlined /> Tél. élève</span>
                  <span className="att-detail__value">{drawerRecord.student_phone}</span>
                </div>
              )}
              {drawerRecord.parent_phone && (
                <div className="att-detail__row">
                  <span className="att-detail__label"><PhoneOutlined /> Tél. parent</span>
                  <span className="att-detail__value">{drawerRecord.parent_phone}</span>
                </div>
              )}
            </div>

            {/* Attendance info */}
            <div className="att-detail__section">
              <h3 className="att-detail__heading"><CalendarOutlined /> Détail</h3>
              <div className="att-detail__row">
                <span className="att-detail__label">Date</span>
                <span className="att-detail__value">{dayjs(drawerRecord.date).format('DD MMMM YYYY')}</span>
              </div>
              <div className="att-detail__row">
                <span className="att-detail__label">Période</span>
                <span className="att-detail__value">{periodLabels[drawerRecord.period] || drawerRecord.period}</span>
              </div>
              <div className="att-detail__row">
                <span className="att-detail__label">Statut</span>
                <span className="att-detail__value">
                  {(() => {
                    const cfg = statusConfig[drawerRecord.status] || statusConfig.PRESENT;
                    return <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag>;
                  })()}
                </span>
              </div>
              <div className="att-detail__row">
                <span className="att-detail__label">Marqué par</span>
                <span className="att-detail__value">{drawerRecord.teacher_name || '—'}</span>
              </div>
              {drawerRecord.note && (
                <div className="att-detail__row">
                  <span className="att-detail__label">Note</span>
                  <span className="att-detail__value">{drawerRecord.note}</span>
                </div>
              )}
            </div>

            {/* Justification info */}
            <div className="att-detail__section">
              <h3 className="att-detail__heading"><CheckCircleOutlined /> Justification</h3>
              <div className="att-detail__row">
                <span className="att-detail__label">Justifié</span>
                <span className="att-detail__value">
                  {drawerRecord.is_justified
                    ? <Badge status="success" text="Oui" />
                    : <Badge status="default" text="Non" />}
                </span>
              </div>
              {drawerRecord.is_justified && (
                <>
                  <div className="att-detail__row">
                    <span className="att-detail__label">Par</span>
                    <span className="att-detail__value">{drawerRecord.justified_by_name}</span>
                  </div>
                  {drawerRecord.justified_at && (
                    <div className="att-detail__row">
                      <span className="att-detail__label">Le</span>
                      <span className="att-detail__value">{dayjs(drawerRecord.justified_at).format('DD/MM/YYYY HH:mm')}</span>
                    </div>
                  )}
                  {drawerRecord.justification_note && (
                    <div className="att-detail__row">
                      <span className="att-detail__label">Motif</span>
                      <span className="att-detail__value">{drawerRecord.justification_note}</span>
                    </div>
                  )}
                </>
              )}
              {drawerRecord.status === 'ABSENT' && !drawerRecord.is_justified && (
                <Button type="primary" icon={<CheckOutlined />}
                  className="att-detail__justify-btn"
                  onClick={() => { setDrawerOpen(false); openJustifyModal(drawerRecord); }}>
                  Justifier cette absence
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default AttendancePage;
