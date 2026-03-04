import React, { useState, useMemo, useCallback } from 'react';
import {
  Card, Button, Table, Tag, Modal, Form, Input, Select, DatePicker,
  Space, Tooltip, Badge, Drawer, Alert, Popover, Spin, Empty,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  BookOutlined,
  ReloadOutlined,
  FilterOutlined,
  DownloadOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  UserOutlined,
  ReadOutlined,
  TeamOutlined,
  LeftOutlined,
  RightOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  useHomework,
  useHomeworkStats,
  useHomeworkCalendar,
  useHomeworkOverload,
  useDeleteHomework,
  useClasses,
  useSubjects,
  useTeachers,
} from '../../hooks/useApi';
import { exportToCSV, exportToPDF } from '../../hooks/useExport';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import './HomeworkPage.css';

dayjs.locale('fr');

/* ──────────────────────── Types ──────────────────────────────── */
interface HomeworkRecord {
  id: string;
  title: string;
  description: string;
  assigned_date: string | null;
  due_date: string;
  estimated_duration_minutes: number | null;
  is_published: boolean;
  is_corrected: boolean;
  created_at: string;
  updated_at: string;
  class_obj?: string;
  class_name?: string;
  subject?: string;
  subject_name?: string;
  teacher?: string;
  teacher_name?: string;
  academic_year_name?: string;
  view_count?: number;
  attachments?: { id: string; file: string; file_type: string; file_name: string }[];
}

interface StatsData {
  total: number;
  this_week: number;
  this_month: number;
  overdue_count: number;
  corrected_count: number;
  most_active_teacher: string;
  busiest_class: string;
  overload_alerts: number;
}

interface CalendarDay {
  date: string;
  count: number;
  items: HomeworkRecord[];
}

interface OverloadItem {
  date: string;
  class_name: string;
  class_id: string;
  count: number;
  titles: string[];
}

/* ──────────────────────── Subject colors ─────────────────────── */
const SUBJECT_COLORS: Record<string, string> = {};
const PALETTE = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#06B6D4', '#EF4444', '#6366F1', '#14B8A6', '#F97316',
  '#84CC16', '#A855F7',
];
let colorIdx = 0;
function getSubjectColor(name: string): string {
  if (!SUBJECT_COLORS[name]) {
    SUBJECT_COLORS[name] = PALETTE[colorIdx % PALETTE.length];
    colorIdx++;
  }
  return SUBJECT_COLORS[name];
}

/* ═══════════════════════ Component ═══════════════════════════════ */
const HomeworkPage: React.FC = () => {
  /* ---------- State ---------- */
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(30);
  const [classFilter, setClassFilter] = useState<string | undefined>();
  const [teacherFilter, setTeacherFilter] = useState<string | undefined>();
  const [subjectFilter, setSubjectFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Calendar state
  const [calMonth, setCalMonth] = useState<dayjs.Dayjs>(dayjs());

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerRecord, setDrawerRecord] = useState<HomeworkRecord | null>(null);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<HomeworkRecord | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  /* ---------- API hooks ---------- */
  const listParams = useMemo(() => ({
    page,
    page_size: pageSize,
    class_id: classFilter,
    teacher_id: teacherFilter,
    subject_id: subjectFilter,
    search: searchText || undefined,
    due_date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
    due_date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
  }), [page, pageSize, classFilter, teacherFilter, subjectFilter, searchText, dateRange]);

  const { data, isLoading, refetch } = useHomework(listParams);
  const { data: statsRaw, isLoading: statsLoading } = useHomeworkStats();
  const { data: calendarRaw, isLoading: calendarLoading } = useHomeworkCalendar({
    month: calMonth.format('YYYY-MM'),
    class_id: classFilter,
    teacher_id: teacherFilter,
    subject_id: subjectFilter,
  });
  const { data: overloadRaw } = useHomeworkOverload({
    month: calMonth.format('YYYY-MM'),
  });

  const { data: classesData } = useClasses();
  const { data: subjectsData } = useSubjects();
  const { data: teachersData } = useTeachers({ page_size: 200 });
  const deleteMut = useDeleteHomework();

  /* ---------- Derived data ---------- */
  const stats = (statsRaw ?? {}) as StatsData;
  const records = ((data as Record<string, unknown>)?.results ?? []) as HomeworkRecord[];
  const totalCount = ((data as Record<string, unknown>)?.count as number) ?? records.length;
  const calendarDays = (calendarRaw ?? []) as CalendarDay[];
  const overloads = (overloadRaw ?? []) as OverloadItem[];

  const classes = ((classesData as Record<string, unknown>)?.results ?? classesData ?? []) as { id: string; name: string }[];
  const subjects = ((subjectsData as Record<string, unknown>)?.results ?? subjectsData ?? []) as { id: string; name: string }[];
  const teachers = ((teachersData as Record<string, unknown>)?.results ?? teachersData ?? []) as { id: string; first_name: string; last_name: string; full_name?: string }[];

  /* ---------- Build calendar grid ---------- */
  const calendarGrid = useMemo(() => {
    const startOfMonth = calMonth.startOf('month');
    const endOfMonth = calMonth.endOf('month');
    const startDay = startOfMonth.day(); // 0=Sun
    const daysInMonth = endOfMonth.date();

    // Map date string -> CalendarDay
    const dayMap: Record<string, CalendarDay> = {};
    for (const d of calendarDays) {
      dayMap[d.date] = d;
    }

    // Overload set: "YYYY-MM-DD|className"
    const overloadSet = new Set<string>();
    const overloadDateSet = new Set<string>();
    for (const o of overloads) {
      overloadSet.add(`${o.date}|${o.class_name}`);
      overloadDateSet.add(o.date);
    }

    // Build weeks
    const weeks: { day: number | null; date: string; data: CalendarDay | null; isOverload: boolean }[][] = [];
    let currentWeek: { day: number | null; date: string; data: CalendarDay | null; isOverload: boolean }[] = [];

    // Padding for start
    const offset = startDay === 0 ? 6 : startDay - 1; // Monday-based
    for (let i = 0; i < offset; i++) {
      currentWeek.push({ day: null, date: '', data: null, isOverload: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = calMonth.date(d).format('YYYY-MM-DD');
      const data = dayMap[dateStr] || null;
      const isOverload = overloadDateSet.has(dateStr);
      currentWeek.push({ day: d, date: dateStr, data, isOverload });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    // Pad last week
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push({ day: null, date: '', data: null, isOverload: false });
    }
    if (currentWeek.length) weeks.push(currentWeek);

    return weeks;
  }, [calMonth, calendarDays, overloads]);

  const isToday = useCallback((dateStr: string) => dateStr === dayjs().format('YYYY-MM-DD'), []);

  /* ---------- Handlers ---------- */
  const openDrawer = (record: HomeworkRecord) => {
    setDrawerRecord(record);
    setDrawerOpen(true);
  };

  const openDeleteModal = (record: HomeworkRecord) => {
    setDeleteRecord(record);
    setDeleteReason('');
    setDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (!deleteRecord) return;
    deleteMut.mutate(
      { id: deleteRecord.id, reason: deleteReason },
      {
        onSuccess: () => {
          setDeleteModalOpen(false);
          setDeleteRecord(null);
          setDrawerOpen(false);
        },
      },
    );
  };

  const resetFilters = () => {
    setClassFilter(undefined);
    setTeacherFilter(undefined);
    setSubjectFilter(undefined);
    setSearchText('');
    setDateRange(null);
    setPage(1);
  };

  const csvColumns = [
    { key: 'title', title: 'Titre' },
    { key: 'subject', title: 'Matière' },
    { key: 'teacher', title: 'Enseignant' },
    { key: 'class', title: 'Classe' },
    { key: 'assigned', title: 'Date assigné' },
    { key: 'due', title: 'Date limite' },
    { key: 'duration', title: 'Durée (min)' },
    { key: 'status', title: 'Statut' },
  ];

  const handleExportCSV = () => {
    const rows = records.map((r) => ({
      title: r.title,
      subject: r.subject_name || '',
      teacher: r.teacher_name || '',
      class: r.class_name || '',
      assigned: r.assigned_date || '',
      due: r.due_date || '',
      duration: r.estimated_duration_minutes ?? '',
      status: r.is_corrected ? 'Corrigé' : new Date(r.due_date) < new Date() ? 'En retard' : 'En cours',
    }));
    exportToCSV(rows, csvColumns, `devoirs_${dayjs().format('YYYY-MM-DD')}`);
  };

  const pdfColumns = [
    { key: 'title', title: 'Titre' },
    { key: 'subject', title: 'Matière' },
    { key: 'teacher', title: 'Enseignant' },
    { key: 'class', title: 'Classe' },
    { key: 'due', title: 'Date limite' },
    { key: 'status', title: 'Statut' },
  ];

  const handleExportPDF = () => {
    const rows = records.map((r) => ({
      title: r.title,
      subject: r.subject_name || '',
      teacher: r.teacher_name || '',
      class: r.class_name || '',
      due: r.due_date ? dayjs(r.due_date).format('DD/MM/YYYY') : '',
      status: r.is_corrected ? 'Corrigé' : 'En cours',
    }));
    exportToPDF(
      rows,
      pdfColumns,
      `devoirs_${dayjs().format('YYYY-MM-DD')}`,
      'Liste des devoirs',
    );
  };

  /* ---------- Status helper ---------- */
  const getStatus = (r: HomeworkRecord) => {
    if (r.is_corrected) return { label: 'Corrigé', color: 'green', icon: <CheckCircleOutlined /> };
    if (new Date(r.due_date) < new Date()) return { label: 'En retard', color: 'red', icon: <WarningOutlined /> };
    return { label: 'En cours', color: 'processing', icon: <ClockCircleOutlined /> };
  };

  /* ---------- Table columns ---------- */
  const columns: ColumnsType<HomeworkRecord> = [
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: HomeworkRecord) => (
        <div className="hw-title-cell">
          <div className="hw-title-cell__name">{text}</div>
          <div className="hw-title-cell__desc">
            {record.description?.slice(0, 80)}{record.description?.length > 80 ? '...' : ''}
          </div>
        </div>
      ),
    },
    {
      title: 'Matière',
      key: 'subject',
      width: 130,
      render: (_: unknown, r: HomeworkRecord) => (
        <Tag color="purple" className="hw-tag">{r.subject_name || '—'}</Tag>
      ),
      filters: subjects.map((s) => ({ text: s.name, value: s.id })),
      onFilter: (val, r) => r.subject === val,
    },
    {
      title: 'Enseignant',
      key: 'teacher',
      width: 150,
      render: (_: unknown, r: HomeworkRecord) => (
        <span className="hw-teacher"><UserOutlined className="hw-teacher__icon" /> {r.teacher_name || '—'}</span>
      ),
    },
    {
      title: 'Classe',
      key: 'class',
      width: 110,
      render: (_: unknown, r: HomeworkRecord) => (
        <Tag color="blue" className="hw-tag">{r.class_name || '—'}</Tag>
      ),
    },
    {
      title: 'Assigné',
      dataIndex: 'assigned_date',
      key: 'assigned_date',
      width: 110,
      render: (d: string) => d ? dayjs(d).format('DD/MM/YYYY') : '—',
      sorter: (a: HomeworkRecord, b: HomeworkRecord) =>
        new Date(a.assigned_date || a.created_at).getTime() - new Date(b.assigned_date || b.created_at).getTime(),
    },
    {
      title: 'Date limite',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (d: string, r: HomeworkRecord) => {
        const st = getStatus(r);
        return (
          <span className={st.color === 'red' ? 'hw-date--overdue' : ''}>
            <CalendarOutlined className="hw-date__icon" />
            {dayjs(d).format('DD/MM/YYYY')}
          </span>
        );
      },
      sorter: (a: HomeworkRecord, b: HomeworkRecord) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Durée',
      dataIndex: 'estimated_duration_minutes',
      key: 'duration',
      width: 80,
      render: (m: number | null) => m ? <span className="hw-duration"><ClockCircleOutlined /> {m} min</span> : <span className="hw-na">—</span>,
    },
    {
      title: 'Statut',
      key: 'status',
      width: 110,
      render: (_: unknown, r: HomeworkRecord) => {
        const st = getStatus(r);
        return <Tag icon={st.icon} color={st.color}>{st.label}</Tag>;
      },
      filters: [
        { text: 'En cours', value: 'pending' },
        { text: 'Corrigé', value: 'corrected' },
        { text: 'En retard', value: 'overdue' },
      ],
      onFilter: (val, r) => {
        if (val === 'corrected') return r.is_corrected;
        if (val === 'overdue') return !r.is_corrected && new Date(r.due_date) < new Date();
        return !r.is_corrected && new Date(r.due_date) >= new Date();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_: unknown, r: HomeworkRecord) => (
        <Space size={4}>
          <Tooltip title="Détails">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => openDrawer(r)} className="hw-action--view" />
          </Tooltip>
          <Tooltip title="Supprimer">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => openDeleteModal(r)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  /* ---------- Calendar day popover content ---------- */
  const renderDayPopover = (dayData: CalendarDay) => (
    <div className="hw-popover">
      <div className="hw-popover__header">
        <CalendarOutlined /> {dayjs(dayData.date).format('dddd DD MMMM YYYY')}
        <Badge count={dayData.count} style={{ marginLeft: 8, backgroundColor: '#00C9A7' }} />
      </div>
      <div className="hw-popover__list">
        {dayData.items.map((item) => (
          <div
            key={item.id}
            className="hw-popover__item"
            onClick={() => openDrawer(item)}
          >
            <div
              className="hw-popover__dot"
              style={{ backgroundColor: getSubjectColor(item.subject_name || 'Autre') }}
            />
            <div className="hw-popover__info">
              <div className="hw-popover__title">{item.title}</div>
              <div className="hw-popover__meta">
                {item.class_name} · {item.subject_name}
                {item.teacher_name && ` · ${item.teacher_name}`}
              </div>
            </div>
            {item.is_corrected && <CheckCircleOutlined style={{ color: '#10B981' }} />}
          </div>
        ))}
      </div>
    </div>
  );

  /* ═══════════════════════ RENDER ═══════════════════════════════ */
  return (
    <div className="hw-page">
      {/* ── Header ── */}
      <div className="hw-header">
        <div>
          <h1 className="hw-header__title">
            <BookOutlined style={{ marginRight: 10, color: '#00C9A7' }} />
            Devoirs
          </h1>
          <p className="hw-header__sub">Gérez les devoirs assignés aux classes</p>
        </div>
        <div className="hw-header__actions">
          <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>CSV</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportPDF}>PDF</Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div className="hw-stats">
        <div className="hw-stats__card hw-stats__card--week">
          <div className="hw-stats__icon"><CalendarOutlined /></div>
          <div>
            <div className="hw-stats__value">{statsLoading ? '—' : stats.this_week ?? 0}</div>
            <div className="hw-stats__label">Cette semaine</div>
          </div>
        </div>
        <div className="hw-stats__card hw-stats__card--month">
          <div className="hw-stats__icon"><ReadOutlined /></div>
          <div>
            <div className="hw-stats__value">{statsLoading ? '—' : stats.this_month ?? 0}</div>
            <div className="hw-stats__label">Ce mois</div>
          </div>
        </div>
        <div className="hw-stats__card hw-stats__card--teacher">
          <div className="hw-stats__icon"><UserOutlined /></div>
          <div>
            <div className="hw-stats__value hw-stats__value--name">
              {statsLoading ? '—' : stats.most_active_teacher || 'Aucun'}
            </div>
            <div className="hw-stats__label">Enseignant le plus actif</div>
          </div>
        </div>
        <div className="hw-stats__card hw-stats__card--alert">
          <div className="hw-stats__icon"><WarningOutlined /></div>
          <div>
            <div className="hw-stats__value">{statsLoading ? '—' : stats.overload_alerts ?? 0}</div>
            <div className="hw-stats__label">Alertes surcharge</div>
          </div>
        </div>
      </div>

      {/* ── Overload alert banner ── */}
      {overloads.length > 0 && (
        <Alert
          className="hw-alert"
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={`${overloads.length} surcharge${overloads.length > 1 ? 's' : ''} détectée${overloads.length > 1 ? 's' : ''}`}
          description={
            <div className="hw-alert__list">
              {overloads.slice(0, 5).map((o, i) => (
                <Tag key={i} color="warning" className="hw-alert__tag">
                  {o.class_name} — {dayjs(o.date).format('DD/MM')} ({o.count} devoirs)
                </Tag>
              ))}
              {overloads.length > 5 && <Tag>+{overloads.length - 5} autres</Tag>}
            </div>
          }
        />
      )}

      {/* ── View toggle + Filters bar ── */}
      <div className="hw-toolbar">
        <div className="hw-toolbar__tabs">
          <Button
            type={activeView === 'list' ? 'primary' : 'default'}
            icon={<UnorderedListOutlined />}
            onClick={() => setActiveView('list')}
            className={activeView === 'list' ? 'hw-toolbar__tab--active' : ''}
          >
            Liste
          </Button>
          <Button
            type={activeView === 'calendar' ? 'primary' : 'default'}
            icon={<CalendarOutlined />}
            onClick={() => setActiveView('calendar')}
            className={activeView === 'calendar' ? 'hw-toolbar__tab--active' : ''}
          >
            Calendrier
          </Button>
        </div>
        <div className="hw-filters">
          <FilterOutlined className="hw-filters__icon" />
          <Input
            prefix={<SearchOutlined />}
            placeholder="Rechercher..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
            allowClear
            className="hw-filters__search"
          />
          <Select
            placeholder="Classe"
            value={classFilter}
            onChange={(v) => { setClassFilter(v); setPage(1); }}
            allowClear
            className="hw-filters__select"
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Select
            placeholder="Enseignant"
            value={teacherFilter}
            onChange={(v) => { setTeacherFilter(v); setPage(1); }}
            allowClear
            showSearch
            optionFilterProp="label"
            className="hw-filters__select hw-filters__select--lg"
            options={teachers.map((t) => ({
              value: t.id,
              label: t.full_name || `${t.first_name} ${t.last_name}`,
            }))}
          />
          <Select
            placeholder="Matière"
            value={subjectFilter}
            onChange={(v) => { setSubjectFilter(v); setPage(1); }}
            allowClear
            className="hw-filters__select"
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(val) => { setDateRange(val as [dayjs.Dayjs, dayjs.Dayjs] | null); setPage(1); }}
            format="DD/MM/YYYY"
            placeholder={['Du', 'Au']}
            className="hw-filters__range"
          />
          {(classFilter || teacherFilter || subjectFilter || searchText || dateRange) && (
            <Button size="small" onClick={resetFilters}>Réinitialiser</Button>
          )}
        </div>
      </div>

      {/* ═══════════ LIST VIEW ═══════════ */}
      {activeView === 'list' && (
        <div className="hw-table-wrap">
          <Table
            className="hw-table"
            columns={columns}
            dataSource={records}
            rowKey={(r) => r.id}
            loading={isLoading}
            pagination={{
              current: page,
              pageSize,
              total: totalCount,
              onChange: (p) => setPage(p),
              showTotal: (t) => `${t} devoir${t > 1 ? 's' : ''}`,
              showSizeChanger: false,
            }}
            locale={{
              emptyText: (
                <div className="hw-empty">
                  <BookOutlined style={{ fontSize: 48, color: '#CBD5E1' }} />
                  <p>Aucun devoir trouvé</p>
                </div>
              ),
            }}
          />
        </div>
      )}

      {/* ═══════════ CALENDAR VIEW ═══════════ */}
      {activeView === 'calendar' && (
        <Card className="hw-cal-wrap">
          {/* Month navigation */}
          <div className="hw-cal__nav">
            <Button
              icon={<LeftOutlined />}
              onClick={() => setCalMonth(calMonth.subtract(1, 'month'))}
              type="text"
            />
            <h3 className="hw-cal__month-label">
              {calMonth.format('MMMM YYYY').replace(/^\w/, (c) => c.toUpperCase())}
            </h3>
            <Button
              icon={<RightOutlined />}
              onClick={() => setCalMonth(calMonth.add(1, 'month'))}
              type="text"
            />
            <Button
              size="small"
              onClick={() => setCalMonth(dayjs())}
              style={{ marginLeft: 12 }}
            >
              Aujourd&apos;hui
            </Button>
          </div>

          {calendarLoading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <Spin size="large" />
            </div>
          ) : (
            <div className="hw-cal__grid">
              {/* Day headers */}
              <div className="hw-cal__row hw-cal__row--header">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                  <div key={d} className="hw-cal__cell hw-cal__cell--header">{d}</div>
                ))}
              </div>

              {/* Weeks */}
              {calendarGrid.map((week, wi) => (
                <div key={wi} className="hw-cal__row">
                  {week.map((cell, ci) => {
                    if (cell.day === null) {
                      return <div key={ci} className="hw-cal__cell hw-cal__cell--empty" />;
                    }

                    const today = isToday(cell.date);
                    const hasItems = cell.data && cell.data.count > 0;
                    const overload = cell.isOverload;

                    const cellContent = (
                      <div
                        className={[
                          'hw-cal__cell',
                          today ? 'hw-cal__cell--today' : '',
                          overload ? 'hw-cal__cell--overload' : '',
                          hasItems ? 'hw-cal__cell--has-items' : '',
                        ].join(' ')}
                      >
                        <div className="hw-cal__day-num">
                          {cell.day}
                          {overload && <WarningOutlined className="hw-cal__overload-icon" />}
                        </div>
                        {hasItems && (
                          <div className="hw-cal__chips">
                            {cell.data!.items.slice(0, 3).map((item) => (
                              <div
                                key={item.id}
                                className="hw-cal__chip"
                                style={{
                                  backgroundColor: getSubjectColor(item.subject_name || 'Autre') + '18',
                                  borderLeft: `3px solid ${getSubjectColor(item.subject_name || 'Autre')}`,
                                }}
                              >
                                <span className="hw-cal__chip-text">{item.class_name}</span>
                              </div>
                            ))}
                            {cell.data!.count > 3 && (
                              <div className="hw-cal__chip hw-cal__chip--more">
                                +{cell.data!.count - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );

                    if (hasItems) {
                      return (
                        <Popover
                          key={ci}
                          content={renderDayPopover(cell.data!)}
                          trigger="click"
                          overlayClassName="hw-popover-overlay"
                          placement="bottom"
                        >
                          {cellContent}
                        </Popover>
                      );
                    }

                    return <React.Fragment key={ci}>{cellContent}</React.Fragment>;
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="hw-cal__legend">
            <span className="hw-cal__legend-item">
              <span className="hw-cal__legend-dot hw-cal__legend-dot--today" /> Aujourd&apos;hui
            </span>
            <span className="hw-cal__legend-item">
              <span className="hw-cal__legend-dot hw-cal__legend-dot--overload" /> Surcharge (3+ devoirs)
            </span>
            {Object.entries(SUBJECT_COLORS).slice(0, 6).map(([name, color]) => (
              <span key={name} className="hw-cal__legend-item">
                <span className="hw-cal__legend-dot" style={{ backgroundColor: color }} /> {name}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* ═══════════ DETAIL DRAWER ═══════════ */}
      <Drawer
        title="Détails du devoir"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        className="hw-drawer"
        extra={
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => drawerRecord && openDeleteModal(drawerRecord)}
          >
            Supprimer
          </Button>
        }
      >
        {drawerRecord && (
          <div className="hw-detail">
            {/* Title section */}
            <div className="hw-detail__section">
              <h3 className="hw-detail__title">{drawerRecord.title}</h3>
              <div style={{ marginTop: 8 }}>
                {(() => { const s = getStatus(drawerRecord); return <Tag icon={s.icon} color={s.color}>{s.label}</Tag>; })()}
                {!drawerRecord.is_published && <Tag color="default">Brouillon</Tag>}
              </div>
            </div>

            {/* Info rows */}
            <div className="hw-detail__section">
              <div className="hw-detail__heading"><FileTextOutlined /> Informations</div>

              <div className="hw-detail__row">
                <span className="hw-detail__label"><TeamOutlined /> Classe</span>
                <span className="hw-detail__value">{drawerRecord.class_name || '—'}</span>
              </div>
              <div className="hw-detail__row">
                <span className="hw-detail__label"><BookOutlined /> Matière</span>
                <span className="hw-detail__value">{drawerRecord.subject_name || '—'}</span>
              </div>
              <div className="hw-detail__row">
                <span className="hw-detail__label"><UserOutlined /> Enseignant</span>
                <span className="hw-detail__value">{drawerRecord.teacher_name || '—'}</span>
              </div>
              <div className="hw-detail__row">
                <span className="hw-detail__label"><CalendarOutlined /> Date assigné</span>
                <span className="hw-detail__value">
                  {drawerRecord.assigned_date ? dayjs(drawerRecord.assigned_date).format('DD/MM/YYYY') : '—'}
                </span>
              </div>
              <div className="hw-detail__row">
                <span className="hw-detail__label"><CalendarOutlined /> Date limite</span>
                <span className="hw-detail__value hw-detail__value--due">
                  {dayjs(drawerRecord.due_date).format('DD/MM/YYYY')}
                </span>
              </div>
              <div className="hw-detail__row">
                <span className="hw-detail__label"><ClockCircleOutlined /> Durée estimée</span>
                <span className="hw-detail__value">
                  {drawerRecord.estimated_duration_minutes ? `${drawerRecord.estimated_duration_minutes} min` : '—'}
                </span>
              </div>
              <div className="hw-detail__row">
                <span className="hw-detail__label"><EyeOutlined /> Vues</span>
                <span className="hw-detail__value">{drawerRecord.view_count ?? 0}</span>
              </div>
            </div>

            {/* Description */}
            <div className="hw-detail__section">
              <div className="hw-detail__heading"><ReadOutlined /> Description</div>
              <div className="hw-detail__description">
                {drawerRecord.description || 'Aucune description.'}
              </div>
            </div>

            {/* Attachments */}
            {drawerRecord.attachments && drawerRecord.attachments.length > 0 && (
              <div className="hw-detail__section">
                <div className="hw-detail__heading"><PaperClipOutlined /> Pièces jointes</div>
                {drawerRecord.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hw-detail__attachment"
                  >
                    <PaperClipOutlined /> {att.file_name}
                    <Tag style={{ marginLeft: 8, fontSize: 11 }}>{att.file_type}</Tag>
                  </a>
                ))}
              </div>
            )}

            {/* Timestamps */}
            <div className="hw-detail__section hw-detail__section--meta">
              <div className="hw-detail__meta">
                Créé le {dayjs(drawerRecord.created_at).format('DD/MM/YYYY à HH:mm')}
              </div>
              <div className="hw-detail__meta">
                Modifié le {dayjs(drawerRecord.updated_at).format('DD/MM/YYYY à HH:mm')}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ═══════════ DELETE MODAL ═══════════ */}
      <Modal
        title={
          <span>
            <ExclamationCircleOutlined style={{ color: '#DC2626', marginRight: 8 }} />
            Supprimer le devoir
          </span>
        }
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={handleDelete}
        confirmLoading={deleteMut.isPending}
        okText="Supprimer"
        okButtonProps={{ danger: true }}
        cancelText="Annuler"
      >
        {deleteRecord && (
          <div>
            <p>
              Êtes-vous sûr de vouloir supprimer <strong>&quot;{deleteRecord.title}&quot;</strong> ?
            </p>
            <p style={{ color: '#64748B', fontSize: 13 }}>
              {deleteRecord.class_name} · {deleteRecord.subject_name} · {deleteRecord.teacher_name}
            </p>
            <Input.TextArea
              rows={3}
              placeholder="Raison de la suppression (optionnel)..."
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              style={{ marginTop: 12 }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HomeworkPage;
