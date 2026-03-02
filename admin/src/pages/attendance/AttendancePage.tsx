import React, { useState, useMemo } from 'react';
import { Table, Button, Tag, DatePicker, Select, Modal, Form, Card, Space, Tabs, Tooltip, message } from 'antd';
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
} from '@ant-design/icons';
import { useAttendance, useMarkAttendance, useBulkMarkAttendance, useStudents, useClasses } from '../../hooks/useApi';
import { exportToCSV, exportToPDF } from '../../hooks/useExport';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import './AttendancePage.css';

dayjs.extend(isoWeek);

const statusMap: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  present: { color: 'green', icon: <CheckCircleOutlined />, label: 'Présent' },
  absent: { color: 'red', icon: <CloseCircleOutlined />, label: 'Absent' },
  late: { color: 'orange', icon: <ClockCircleOutlined />, label: 'En retard' },
};

const AttendancePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [classFilter, setClassFilter] = useState<string | undefined>();
  const [bulkClass, setBulkClass] = useState<string>('');
  const [bulkDate, setBulkDate] = useState<dayjs.Dayjs>(dayjs());
  const [bulkStatuses, setBulkStatuses] = useState<Record<string, string>>({});
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useAttendance({
    page,
    page_size: 20,
    status: statusFilter,
    class_id: classFilter,
    date_from: dateRange?.[0]?.format('YYYY-MM-DD'),
    date_to: dateRange?.[1]?.format('YYYY-MM-DD'),
  });
  const markAttendance = useMarkAttendance();
  const bulkMark = useBulkMarkAttendance();
  const { data: studentsData } = useStudents({ page_size: 200 });
  const { data: classesData } = useClasses();

  const students = (studentsData?.results || []) as {
    id: string;
    first_name: string;
    last_name: string;
    class_assigned?: string;
    user?: { first_name: string; last_name: string };
  }[];
  const classes = (classesData?.results || classesData || []) as { id: string; name: string }[];

  // Students filtered by bulk class
  const bulkStudents = bulkClass
    ? students.filter((s) => s.class_assigned === bulkClass)
    : students;

  // --- Grid View ---
  const [activeTab, setActiveTab] = useState<string>('list');
  const [gridWeek, setGridWeek] = useState<dayjs.Dayjs>(dayjs());
  const [cellDetailOpen, setCellDetailOpen] = useState(false);
  const [cellDetailTitle, setCellDetailTitle] = useState('');
  const [cellDetailRecords, setCellDetailRecords] = useState<Record<string, unknown>[]>([]);

  // Compute the week start/end for grid
  const weekStart = gridWeek.startOf('isoWeek');
  const weekEnd = gridWeek.endOf('isoWeek');
  const weekDays = Array.from({ length: 6 }, (_, i) => weekStart.add(i, 'day')); // Mon-Sat (Algerian school week)

  // Fetch attendance for the whole week with large page size
  const { data: gridData, isLoading: gridLoading } = useAttendance({
    page_size: 5000,
    date_from: weekStart.format('YYYY-MM-DD'),
    date_to: weekEnd.format('YYYY-MM-DD'),
  });

  // Build grid: class -> day -> { present, absent, late, total, records[] }
  const gridMatrix = useMemo(() => {
    const records = (gridData?.results || []) as Record<string, unknown>[];
    const matrix: Record<string, Record<string, { present: number; absent: number; late: number; total: number; records: Record<string, unknown>[] }>> = {};

    for (const r of records) {
      const className = (r.class_name as string) || 'Inconnue';
      const dateStr = r.date as string;
      if (!dateStr) continue;
      const dayKey = dayjs(dateStr).format('YYYY-MM-DD');

      if (!matrix[className]) matrix[className] = {};
      if (!matrix[className][dayKey]) matrix[className][dayKey] = { present: 0, absent: 0, late: 0, total: 0, records: [] };

      const cell = matrix[className][dayKey];
      cell.total += 1;
      cell.records.push(r);
      if (r.status === 'present') cell.present += 1;
      else if (r.status === 'absent') cell.absent += 1;
      else if (r.status === 'late') cell.late += 1;
    }

    return matrix;
  }, [gridData]);

  const gridClassNames = Object.keys(gridMatrix).sort();

  const handleCellClick = (className: string, dayKey: string) => {
    const cell = gridMatrix[className]?.[dayKey];
    if (!cell || cell.total === 0) return;
    setCellDetailTitle(`${className} — ${dayjs(dayKey).format('dddd DD/MM/YYYY')}`);
    setCellDetailRecords(cell.records);
    setCellDetailOpen(true);
  };

  // Monthly report generation
  const handleMonthlyReport = () => {
    const records = (gridData?.results || data?.results || []) as Record<string, unknown>[];
    if (records.length === 0) { message.warning('Aucune donnée à exporter'); return; }
    exportToPDF(
      records,
      [
        { key: 'student_name', title: 'Élève' },
        { key: 'class_name', title: 'Classe' },
        { key: 'date', title: 'Date' },
        { key: 'status', title: 'Statut' },
        { key: 'excused', title: 'Justifié' },
      ],
      'rapport-mensuel-absences',
      'Rapport mensuel des absences',
    );
  };

  const handleExportPDF = () => {
    const records = (data?.results || []) as Record<string, unknown>[];
    if (records.length === 0) { message.warning('Aucune donnée à exporter'); return; }
    exportToPDF(
      records,
      [
        { key: 'student_name', title: 'Élève' },
        { key: 'class_name', title: 'Classe' },
        { key: 'date', title: 'Date' },
        { key: 'status', title: 'Statut' },
        { key: 'excused', title: 'Justifié' },
      ],
      'absences',
      'Suivi des absences',
    );
  };

  const handleMark = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date ? values.date.format('YYYY-MM-DD') : undefined,
      };
      await markAttendance.mutateAsync(payload);
      setModalOpen(false);
      form.resetFields();
    } catch { /* validation */ }
  };

  const handleBulkMark = async () => {
    const records = Object.entries(bulkStatuses)
      .filter(([, status]) => !!status)
      .map(([student, status]) => ({
        student,
        status,
        date: bulkDate.format('YYYY-MM-DD'),
        class_id: bulkClass || undefined,
      }));

    if (records.length === 0) {
      message.warning('Veuillez marquer au moins un élève');
      return;
    }

    try {
      await bulkMark.mutateAsync({ records });
      setBulkModalOpen(false);
      setBulkStatuses({});
      message.success(`${records.length} présences enregistrées`);
    } catch {
      message.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleExport = () => {
    const records = (data?.results || []) as Record<string, unknown>[];
    exportToCSV(
      records,
      [
        { key: 'student_name', title: 'Élève' },
        { key: 'class_name', title: 'Classe' },
        { key: 'date', title: 'Date' },
        { key: 'status', title: 'Statut' },
        { key: 'excused', title: 'Justifié' },
      ],
      'absences',
    );
  };

  // Quick stats
  const records = (data?.results || []) as Record<string, unknown>[];
  const presentCount = records.filter((r) => r.status === 'present').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const lateCount = records.filter((r) => r.status === 'late').length;

  const columns = [
    {
      title: 'Élève',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (v: string, r: Record<string, unknown>) =>
        <span className="font-semibold">{v || (r.student as string) || '—'}</span>,
    },
    {
      title: 'Classe',
      dataIndex: 'class_name',
      key: 'class_name',
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '—',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (v: string) =>
        v
          ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          : '—',
      sorter: (a: Record<string, unknown>, b: Record<string, unknown>) =>
        new Date(a.date as string).getTime() - new Date(b.date as string).getTime(),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const info = statusMap[v] || statusMap.present;
        return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
      },
    },
    {
      title: 'Justifié',
      dataIndex: 'excused',
      key: 'excused',
      render: (v: boolean) => v ? <Tag color="blue">Oui</Tag> : <Tag>Non</Tag>,
    },
  ];

  // Bulk columns
  const bulkColumns = [
    {
      title: 'Élève',
      key: 'name',
      render: (_: unknown, r: Record<string, unknown>) => {
        const u = r.user as Record<string, string> | undefined;
        return <span className="font-semibold">{u ? `${u.first_name} ${u.last_name}` : `${r.first_name} ${r.last_name}`}</span>;
      },
    },
    {
      title: 'Statut',
      key: 'status',
      width: 200,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Select
          value={bulkStatuses[r.id as string] || undefined}
          onChange={(v) => setBulkStatuses((prev) => ({ ...prev, [r.id as string]: v }))}
          placeholder="Sélectionner"
          className="w-full"
          allowClear
        >
          <Select.Option value="present"><Tag color="green">Présent</Tag></Select.Option>
          <Select.Option value="absent"><Tag color="red">Absent</Tag></Select.Option>
          <Select.Option value="late"><Tag color="orange">En retard</Tag></Select.Option>
        </Select>
      ),
    },
  ];

  const markAllPresent = () => {
    const statuses: Record<string, string> = {};
    bulkStudents.forEach((s) => { statuses[s.id] = 'present'; });
    setBulkStatuses(statuses);
  };

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Suivi des absences</h1>
          <p>{data?.count ?? 0} enregistrements</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>PDF</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>CSV</Button>
          <Button icon={<CalendarOutlined />} onClick={handleMonthlyReport}>Rapport mensuel</Button>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button icon={<TeamOutlined />} onClick={() => { setBulkStatuses({}); setBulkModalOpen(true); }}>
            Marquage en masse
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            Marquer la présence
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stat-grid">
        <Card size="small" className="stat-card">
          <div className="stat-value">{data?.count ?? 0}</div>
          <div className="stat-label">Total enregistrements</div>
        </Card>
        <Card size="small" className="stat-card">
          <div className="stat-value color-success">{presentCount}</div>
          <div className="stat-label">Présents</div>
        </Card>
        <Card size="small" className="stat-card">
          <div className="stat-value color-danger">{absentCount}</div>
          <div className="stat-label">Absents</div>
        </Card>
        <Card size="small" className="stat-card">
          <div className="stat-value color-warning">{lateCount}</div>
          <div className="stat-label">En retard</div>
        </Card>
        <Card size="small" className="stat-card">
          <div className="stat-value">{records.length > 0 ? `${Math.round((presentCount / records.length) * 100)}%` : '—'}</div>
          <div className="stat-label">Taux de présence</div>
        </Card>
      </div>

      {/* Tabs: List view + Grid view */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'list',
          label: <span><UnorderedListOutlined /> Liste</span>,
          children: (
            <>
              {/* Filters */}
              <Card className="filter-card">
                <Space wrap>
                  <FilterOutlined className="filter-icon" />
                  <Select
                    placeholder="Filtrer par statut"
                    allowClear
                    className="filter-select"
                    value={statusFilter}
                    onChange={(v) => { setStatusFilter(v); setPage(1); }}
                    options={[
                      { value: 'present', label: 'Présent' },
                      { value: 'absent', label: 'Absent' },
                      { value: 'late', label: 'En retard' },
                    ]}
                  />
                  <Select
                    placeholder="Filtrer par classe"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                    className="filter-select-lg"
                    value={classFilter}
                    onChange={(v) => { setClassFilter(v); setPage(1); }}
                    options={classes.map((c) => ({ value: c.id, label: c.name }))}
                  />
                  <DatePicker.RangePicker
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                    format="DD/MM/YYYY"
                    placeholder={['Date début', 'Date fin']}
                  />
                </Space>
              </Card>

              <Card>
                <Table
                  columns={columns}
                  dataSource={data?.results || []}
                  loading={isLoading}
                  rowKey={(r: Record<string, unknown>) => (r.id as string) || `att-${r.student}-${r.date}`}
                  pagination={{
                    current: page,
                    pageSize: 20,
                    total: data?.count || 0,
                    onChange: (p) => setPage(p),
                    showSizeChanger: false,
                    showTotal: (t) => `${t} enregistrements`,
                  }}
                  locale={{ emptyText: 'Aucun enregistrement d\'absence' }}
                />
              </Card>
            </>
          ),
        },
        {
          key: 'grid',
          label: <span><TableOutlined /> Grille</span>,
          children: (
            <>
              {/* Week selector */}
              <Card className="filter-card">
                <Space wrap>
                  <CalendarOutlined />
                  <span className="attendance-grid__week-label">Semaine du {weekStart.format('DD/MM/YYYY')} au {weekEnd.format('DD/MM/YYYY')}</span>
                  <DatePicker
                    picker="week"
                    value={gridWeek}
                    onChange={(d) => d && setGridWeek(d)}
                    format="[Semaine] ww - YYYY"
                  />
                  <Button size="small" onClick={() => setGridWeek(dayjs())}>Aujourd&apos;hui</Button>
                </Space>
              </Card>

              {/* Grid matrix */}
              <Card loading={gridLoading}>
                {gridClassNames.length === 0 ? (
                  <div className="attendance-grid__empty">
                    Aucune donnée de présence pour cette semaine
                  </div>
                ) : (
                  <div className="attendance-grid__scroll">
                    <table className="attendance-grid__table">
                      <thead>
                        <tr>
                          <th className="attendance-grid__th">
                            Classe
                          </th>
                          {weekDays.map((d) => (
                            <th key={d.format('YYYY-MM-DD')} className="attendance-grid__th--day">
                              {d.format('ddd DD/MM')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {gridClassNames.map((className) => (
                          <tr key={className}>
                            <td className="attendance-grid__class-name">
                              {className}
                            </td>
                            {weekDays.map((d) => {
                              const dayKey = d.format('YYYY-MM-DD');
                              const cell = gridMatrix[className]?.[dayKey];
                              const pct = cell && cell.total > 0 ? Math.round((cell.present / cell.total) * 100) : null;
                              const bgClass = pct === null ? 'attendance-grid__cell--bg-none'
                                : pct >= 90 ? 'attendance-grid__cell--bg-green'
                                : pct >= 75 ? 'attendance-grid__cell--bg-yellow'
                                : pct >= 50 ? 'attendance-grid__cell--bg-orange'
                                : 'attendance-grid__cell--bg-red';

                              return (
                                <td
                                  key={dayKey}
                                  onClick={() => handleCellClick(className, dayKey)}
                                  className={`attendance-grid__cell ${bgClass} ${cell && cell.total > 0 ? 'attendance-grid__cell--clickable' : 'attendance-grid__cell--empty'}`}
                                >
                                  {pct !== null ? (
                                    <Tooltip title={`${cell!.present} présents, ${cell!.absent} absents, ${cell!.late} retards sur ${cell!.total}`}>
                                      <div className={`attendance-grid__pct ${pct >= 90 ? 'attendance-grid__pct--good' : pct >= 75 ? 'attendance-grid__pct--warn' : 'attendance-grid__pct--bad'}`}>
                                        {pct}%
                                      </div>
                                      <div className="attendance-grid__detail">
                                        {cell!.absent > 0 && <span>{cell!.absent} abs.</span>}
                                        {cell!.late > 0 && <span> {cell!.late} ret.</span>}
                                      </div>
                                    </Tooltip>
                                  ) : (
                                    <span className="attendance-grid__no-data">—</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          ),
        },
      ]} />

      {/* Single mark modal */}
      <Modal
        title="Marquer la présence"
        open={modalOpen}
        onOk={handleMark}
        onCancel={() => setModalOpen(false)}
        confirmLoading={markAttendance.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner un élève"
              options={students.map((s) => ({
                value: s.id,
                label: s.user
                  ? `${s.user.first_name} ${s.user.last_name}`
                  : `${s.first_name} ${s.last_name}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Date" name="date" rules={[{ required: true, message: 'Requis' }]}>
            <DatePicker format="DD/MM/YYYY" className="w-full" placeholder="Sélectionner la date" />
          </Form.Item>
          <Form.Item label="Statut" name="status" rules={[{ required: true, message: 'Requis' }]}>
            <Select placeholder="Sélectionner le statut">
              <Select.Option value="present">Présent</Select.Option>
              <Select.Option value="absent">Absent</Select.Option>
              <Select.Option value="late">En retard</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Justifié" name="excused" initialValue={false}>
            <Select>
              <Select.Option value={false}>Non</Select.Option>
              <Select.Option value={true}>Oui — Absence justifiée</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Bulk marking modal */}
      <Modal
        title="Marquage en masse"
        open={bulkModalOpen}
        onOk={handleBulkMark}
        onCancel={() => setBulkModalOpen(false)}
        confirmLoading={bulkMark.isPending}
        okText={`Enregistrer (${Object.values(bulkStatuses).filter(Boolean).length})`}
        cancelText="Annuler"
        width={700}
      >
        <Space className="bulk-controls">
          <Select
            placeholder="Classe"
            className="filter-select-lg"
            value={bulkClass || undefined}
            onChange={(v) => { setBulkClass(v); setBulkStatuses({}); }}
            options={classes.map((c) => ({ value: c.id, label: c.name }))}
            allowClear
          />
          <DatePicker
            value={bulkDate}
            onChange={(d) => d && setBulkDate(d)}
            format="DD/MM/YYYY"
          />
          <Button size="small" onClick={markAllPresent}>Tous présents</Button>
        </Space>

        <Table
          columns={bulkColumns}
          dataSource={bulkStudents}
          rowKey={(r) => r.id}
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
          locale={{ emptyText: 'Sélectionnez une classe' }}
          className="bulk-table"
        />
      </Modal>

      {/* Grid cell detail modal */}
      <Modal
        title={cellDetailTitle}
        open={cellDetailOpen}
        onCancel={() => setCellDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setCellDetailOpen(false)}>Fermer</Button>,
          <Button key="export" icon={<DownloadOutlined />} onClick={() => {
            exportToCSV(
              cellDetailRecords,
              [
                { key: 'student_name', title: 'Élève' },
                { key: 'status', title: 'Statut' },
                { key: 'excused', title: 'Justifié' },
              ],
              'detail-absences',
            );
          }}>Exporter</Button>,
        ]}
        width={600}
      >
        <Table
          columns={[
            {
              title: 'Élève',
              dataIndex: 'student_name',
              key: 'student_name',
              render: (v: string, r: Record<string, unknown>) =>
                <span className="attendance-detail__student-name">{v || (r.student as string) || '—'}</span>,
            },
            {
              title: 'Statut',
              dataIndex: 'status',
              key: 'status',
              render: (v: string) => {
                const info = statusMap[v] || statusMap.present;
                return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
              },
            },
            {
              title: 'Justifié',
              dataIndex: 'excused',
              key: 'excused',
              render: (v: boolean) => v ? <Tag color="blue">Oui</Tag> : <Tag>Non</Tag>,
            },
          ]}
          dataSource={cellDetailRecords}
          rowKey={(r: Record<string, unknown>) => (r.id as string) || `${r.student}-${r.date}`}
          pagination={false}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default AttendancePage;
