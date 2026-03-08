import React, { useMemo, useState } from 'react';
import { Card, Spin, Empty, Table, Tag, Button, InputNumber, Space, Tooltip, message, Select } from 'antd';
import {
  TeamOutlined,
  SolutionOutlined,
  BookOutlined,
  DollarOutlined,
  BarChartOutlined,
  WarningOutlined,
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  AlertOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { useDashboardStats, useClasses, usePayments, useAttendance, useTeachers, useGradeAnalytics, useAcademicYears } from '../../hooks/useApi';
import dayjs from 'dayjs';
import './AnalyticsPage.css';

const COLORS = ['#00C9A7', '#10B981', '#F59E0B', '#EF4444', '#1B5C7A', '#EC4899'];

const AnalyticsPage: React.FC = () => {
  const { studentCount, teacherCount, classCount, paymentCount, isLoading } = useDashboardStats();
  const { data: classData, isLoading: classesLoading } = useClasses();
  const { data: paymentData } = usePayments({ page_size: 100 });
  const { data: attendanceData } = useAttendance({ page_size: 5000 });
  const { data: teacherData } = useTeachers({ page_size: 200 });
  const { data: yearData } = useAcademicYears();

  const [absentThreshold, setAbsentThreshold] = useState(3);
  const [selectedTrimester, setSelectedTrimester] = useState<number>(1);

  const years = Array.isArray(yearData) ? yearData : yearData?.results || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentYear = years.find((y: any) => y.is_current) || years[0];
  const [selectedYearId, setSelectedYearId] = useState<string | undefined>(undefined);
  const yearId = selectedYearId || currentYear?.id;

  const { data: gradeAnalytics, isLoading: analyticsLoading } = useGradeAnalytics(
    yearId ? { academic_year_id: yearId, trimester: selectedTrimester } : undefined
  );

  const overviewData = [
    { name: 'Élèves', value: studentCount, icon: <TeamOutlined />, colorClass: 'stat-card__icon--blue' },
    { name: 'Enseignants', value: teacherCount, icon: <SolutionOutlined />, colorClass: 'stat-card__icon--green' },
    { name: 'Classes', value: classCount, icon: <BookOutlined />, colorClass: 'stat-card__icon--yellow' },
    { name: 'Paiements', value: paymentCount, icon: <DollarOutlined />, colorClass: 'stat-card__icon--purple' },
  ];

  // Build class distribution for charts
  const classResults = classData?.results || [];
  const classChartData = classResults.slice(0, 8).map((c: any) => ({
    name: (c.name as string) || 'Classe',
    effectif: (c.student_count as number) || 0,
  }));

  // Payment summary
  const payments = paymentData?.results || [];
  const paymentStatusData = [
    { name: 'Payés', value: payments.filter((p: any) => p.status === 'paid').length },
    { name: 'En attente', value: payments.filter((p: any) => p.status === 'pending' || p.status === 'unpaid').length },
    { name: 'Partiels', value: payments.filter((p: any) => p.status === 'partial').length },
    { name: 'En retard', value: payments.filter((p: any) => p.status === 'overdue').length },
  ].filter((d) => d.value > 0);

  // --- CHRONIC ABSENTEEISM TRACKER ---
  const attendanceRecords = (attendanceData?.results || []) as Record<string, unknown>[];
  const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');

  const chronicAbsentees = useMemo(() => {
    // Count absences per student this month
    const absMap: Record<string, { name: string; className: string; absences: number; lates: number }> = {};
    for (const r of attendanceRecords) {
      const dateStr = r.date as string;
      if (!dateStr || dateStr < monthStart) continue;
      if (r.status !== 'absent' && r.status !== 'late') continue;

      const studentId = (r.student as string) || (r.student_id as string) || '';
      const studentName = (r.student_name as string) || 'Inconnu';
      const className = (r.class_name as string) || '—';

      if (!absMap[studentId]) absMap[studentId] = { name: studentName, className, absences: 0, lates: 0 };
      if (r.status === 'absent') absMap[studentId].absences += 1;
      if (r.status === 'late') absMap[studentId].lates += 1;
    }

    return Object.entries(absMap)
      .filter(([, v]) => v.absences >= absentThreshold)
      .map(([id, v]) => ({ id, ...v, total: v.absences + v.lates }))
      .sort((a, b) => b.absences - a.absences);
  }, [attendanceRecords, monthStart, absentThreshold]);

  // --- CLASS COMPARISON ---
  const classAttendanceData = useMemo(() => {
    const classMap: Record<string, { present: number; absent: number; late: number; total: number }> = {};
    for (const r of attendanceRecords) {
      const className = (r.class_name as string) || 'Inconnue';
      if (!classMap[className]) classMap[className] = { present: 0, absent: 0, late: 0, total: 0 };
      classMap[className].total += 1;
      if (r.status === 'present') classMap[className].present += 1;
      if (r.status === 'absent') classMap[className].absent += 1;
      if (r.status === 'late') classMap[className].late += 1;
    }

    return Object.entries(classMap)
      .map(([name, v]) => ({
        name,
        présence: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
        absences: v.absent,
        retards: v.late,
      }))
      .sort((a, b) => b.présence - a.présence);
  }, [attendanceRecords]);

  // --- TEACHER ENGAGEMENT ---
  const teachers = (teacherData?.results || []) as Record<string, unknown>[];

  const teacherEngagement = useMemo(() => {
    // Count how many days each teacher submitted attendance this month
    const teacherMap: Record<string, { name: string; daysActive: Set<string>; totalRecords: number }> = {};

    for (const r of attendanceRecords) {
      const dateStr = r.date as string;
      if (!dateStr || dateStr < monthStart) continue;

      const teacherId = (r.teacher as string) || (r.teacher_id as string) || (r.marked_by as string) || '';
      const teacherName = (r.teacher_name as string) || (r.marked_by_name as string) || '';

      if (!teacherId && !teacherName) continue;
      const key = teacherId || teacherName;
      if (!teacherMap[key]) teacherMap[key] = { name: teacherName || key, daysActive: new Set(), totalRecords: 0 };
      teacherMap[key].daysActive.add(dateStr);
      teacherMap[key].totalRecords += 1;
    }

    // Number of school days so far this month (weekdays only, Mon-Sat for Algeria)
    const today = dayjs();
    let schoolDays = 0;
    let d = dayjs().startOf('month');
    while (d.isBefore(today) || d.isSame(today, 'day')) {
      const dow = d.day(); // 0=Sun
      if (dow >= 1 && dow <= 6) schoolDays += 1; // Mon-Sat
      d = d.add(1, 'day');
    }
    if (schoolDays === 0) schoolDays = 1;

    return Object.entries(teacherMap)
      .map(([id, v]) => ({
        id,
        name: v.name,
        daysActive: v.daysActive.size,
        totalRecords: v.totalRecords,
        submissionRate: Math.min(100, Math.round((v.daysActive.size / schoolDays) * 100)),
        schoolDays,
      }))
      .sort((a, b) => b.submissionRate - a.submissionRate);
  }, [attendanceRecords, monthStart]);

  const handleNotifyParent = (studentName: string) => {
    message.success(`Notification envoyée aux parents de ${studentName}`);
  };

  if (isLoading) {
    return (
      <div className="page loading-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Analytiques</h1>
          <p>Statistiques et indicateurs de performance — {dayjs().format('MMMM YYYY')}</p>
        </div>
      </div>

      {/* Overview numbers */}
      <div className="stats-grid stagger-children">
        {overviewData.map((item) => (
          <div key={item.name} className="stat-card">
            <div className={`stat-card__icon ${item.colorClass}`}>
              {item.icon}
            </div>
            <div className="stat-card__content">
              <div className="stat-card__label">{item.name}</div>
              <div className="stat-card__value">{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Effectif par classe */}
        <Card title={<span className="section-title"><BarChartOutlined /> Effectif par classe</span>}>
          {classChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={classChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 10,
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="effectif" fill="#00C9A7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Aucune donnée de classe" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        {/* Payment distribution */}
        <Card title={<span className="section-title"><DollarOutlined /> Répartition des paiements</span>}>
          {paymentStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {paymentStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Aucune donnée de paiement" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </div>

      {/* CLASS COMPARISON - Attendance by class */}
      <Card
        title={<span className="section-title"><BarChartOutlined /> Comparaison des classes — Taux de présence</span>}
        style={{ marginTop: 16 }}
      >
        {classAttendanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={classAttendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <YAxis unit="%" tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
              <RechartsTooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
                formatter={(value?: number, name?: string) => {
                  const n = name || '';
                  return [`${value ?? 0}${n === 'présence' ? '%' : ''}`, n.charAt(0).toUpperCase() + n.slice(1)];
                }}
              />
              <Legend />
              <Bar dataKey="présence" fill="#10B981" radius={[6, 6, 0, 0]} name="Présence %" />
              <Bar dataKey="absences" fill="#EF4444" radius={[6, 6, 0, 0]} name="Absences" />
              <Bar dataKey="retards" fill="#F59E0B" radius={[6, 6, 0, 0]} name="Retards" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty description="Aucune donnée de présence disponible" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* CHRONIC ABSENTEEISM TRACKER */}
      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#EF4444' }} />
            <span className="section-title">Absentéisme chronique</span>
            <Tag color="red">{chronicAbsentees.length} élève(s)</Tag>
          </Space>
        }
        extra={
          <Space>
            <span className="analytics__threshold-label">Seuil :</span>
            <InputNumber
              min={1}
              max={30}
              value={absentThreshold}
              onChange={(v) => v && setAbsentThreshold(v)}
              size="small"
              style={{ width: 60 }}
            />
            <span className="analytics__threshold-label">absences/mois</span>
          </Space>
        }
        style={{ marginTop: 16 }}
      >
        {chronicAbsentees.length > 0 ? (
          <Table
            dataSource={chronicAbsentees}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, showTotal: (t) => `${t} élève(s)` }}
            columns={[
              {
                title: 'Élève',
                dataIndex: 'name',
                key: 'name',
                render: (v: string) => <span className="analytics__student-name">{v}</span>,
              },
              {
                title: 'Classe',
                dataIndex: 'className',
                key: 'className',
                render: (v: string) => <Tag color="blue">{v}</Tag>,
              },
              {
                title: 'Absences',
                dataIndex: 'absences',
                key: 'absences',
                sorter: (a: any, b: any) => a.absences - b.absences,
                render: (v: number) => <Tag color="red" icon={<CloseCircleOutlined />}>{v}</Tag>,
              },
              {
                title: 'Retards',
                dataIndex: 'lates',
                key: 'lates',
                render: (v: number) => v > 0 ? <Tag color="orange" icon={<ClockCircleOutlined />}>{v}</Tag> : <span className="analytics__zero-value">0</span>,
              },
              {
                title: 'Action',
                key: 'action',
                render: (_: unknown, r: any) => (
                  <Tooltip title="Envoyer une notification aux parents">
                    <Button
                      type="primary"
                      danger
                      size="small"
                      icon={<BellOutlined />}
                      onClick={() => handleNotifyParent(r.name)}
                    >
                      Notifier les parents
                    </Button>
                  </Tooltip>
                ),
              },
            ]}
          />
        ) : (
          <Empty
            description={`Aucun élève avec ${absentThreshold}+ absences ce mois-ci`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {/* TEACHER ENGAGEMENT */}
      <Card
        title={
          <Space>
            <SolutionOutlined style={{ color: '#1B5C7A' }} />
            <span className="section-title">Engagement des enseignants — Soumission des présences</span>
          </Space>
        }
        style={{ marginTop: 16 }}
      >
        {teacherEngagement.length > 0 ? (
          <Table
            dataSource={teacherEngagement}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: 'Enseignant',
                dataIndex: 'name',
                key: 'name',
                render: (v: string) => <span className="analytics__teacher-name">{v}</span>,
              },
              {
                title: 'Jours actifs',
                dataIndex: 'daysActive',
                key: 'daysActive',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                render: (v: number, r: any) => `${v} / ${r.schoolDays} jours`,
              },
              {
                title: 'Enregistrements',
                dataIndex: 'totalRecords',
                key: 'totalRecords',
              },
              {
                title: 'Taux de soumission',
                dataIndex: 'submissionRate',
                key: 'submissionRate',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sorter: (a: any, b: any) => a.submissionRate - b.submissionRate,
                render: (v: number) => {
                  const color = v >= 80 ? 'green' : v >= 50 ? 'orange' : 'red';
                  const icon = v >= 80 ? <CheckCircleOutlined /> : v >= 50 ? <ClockCircleOutlined /> : <CloseCircleOutlined />;
                  return <Tag color={color} icon={icon}>{v}%</Tag>;
                },
              },
              {
                title: 'Statut',
                key: 'status',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                render: (_: unknown, r: any) => {
                  if (r.submissionRate >= 80) return <Tag color="success">Actif</Tag>;
                  if (r.submissionRate >= 50) return <Tag color="warning">Attention</Tag>;
                  return <Tag color="error">Inactif</Tag>;
                },
              },
            ]}
          />
        ) : (
          <Empty
            description="Aucune donnée d'engagement enseignant ce mois-ci"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {/* ═══════════════════ GRADE ANALYTICS (Prompt V) ═══════════════════ */}
      <Card style={{ marginTop: 24, marginBottom: 16 }}>
        <Space>
          <strong><LineChartOutlined /> Analytiques des Notes</strong>
          <Select
            value={selectedYearId || currentYear?.id}
            onChange={setSelectedYearId}
            style={{ width: 200 }}
            placeholder="Année scolaire"
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {years.map((y: any) => (
              <Select.Option key={y.id} value={y.id}>{y.name || `${y.start_date} — ${y.end_date}`}</Select.Option>
            ))}
          </Select>
          <Select value={selectedTrimester} onChange={setSelectedTrimester} style={{ width: 140 }}>
            <Select.Option value={1}>Trimestre 1</Select.Option>
            <Select.Option value={2}>Trimestre 2</Select.Option>
            <Select.Option value={3}>Trimestre 3</Select.Option>
          </Select>
        </Space>
      </Card>

      {analyticsLoading ? (
        <Card style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></Card>
      ) : gradeAnalytics ? (
        <>
          {/* Subject Averages */}
          {gradeAnalytics.subject_averages && Object.keys(gradeAnalytics.subject_averages).length > 0 && (
            <Card
              title={<span className="section-title"><BookOutlined /> Moyennes par matière</span>}
              style={{ marginTop: 16 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(gradeAnalytics.subject_averages).map(([name, avg]) => ({ name, moyenne: Number(avg) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} angle={-20} textAnchor="end" height={60} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <RechartsTooltip />
                  <Bar dataKey="moyenne" fill="#1B5C7A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Pass/Fail Rates + Class Comparison */}
          <div className="grid-2" style={{ marginTop: 16 }}>
            {gradeAnalytics.pass_fail_rates && (
              <Card title={<span className="section-title"><CheckCircleOutlined /> Taux de réussite / échec</span>}>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Réussite', value: gradeAnalytics.pass_fail_rates.pass_count || 0 },
                        { name: 'Échec', value: gradeAnalytics.pass_fail_rates.fail_count || 0 },
                      ]}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#EF4444" />
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Tag color="green">Moy. réussites: {gradeAnalytics.pass_fail_rates.pass_avg?.toFixed(2) || '—'}</Tag>
                  <Tag color="red">Moy. échecs: {gradeAnalytics.pass_fail_rates.fail_avg?.toFixed(2) || '—'}</Tag>
                </div>
              </Card>
            )}

            {gradeAnalytics.class_comparison && gradeAnalytics.class_comparison.length > 0 && (
              <Card title={<span className="section-title"><BarChartOutlined /> Comparaison des classes</span>}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={gradeAnalytics.class_comparison} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="class_name" type="category" tick={{ fontSize: 11 }} width={100} />
                    <RechartsTooltip />
                    <Bar dataKey="average" fill="#00C9A7" radius={[0, 6, 6, 0]} name="Moyenne" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Trimester Evolution */}
          {gradeAnalytics.trimester_evolution && gradeAnalytics.trimester_evolution.length > 0 && (
            <Card
              title={<span className="section-title"><LineChartOutlined /> Évolution trimestrielle</span>}
              style={{ marginTop: 16 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gradeAnalytics.trimester_evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="trimester" tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="average" stroke="#1B5C7A" strokeWidth={2} name="Moyenne" dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="highest" stroke="#10B981" strokeWidth={2} name="Max" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="lowest" stroke="#EF4444" strokeWidth={2} name="Min" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Top Students by Level */}
          {gradeAnalytics.top_students_by_level && Object.keys(gradeAnalytics.top_students_by_level).length > 0 && (
            <Card
              title={<span className="section-title"><TrophyOutlined /> Meilleurs élèves par niveau</span>}
              style={{ marginTop: 16 }}
            >
              {Object.entries(gradeAnalytics.top_students_by_level).map(([level, students]) => (
                <div key={level} style={{ marginBottom: 16 }}>
                  <Tag color="blue" style={{ marginBottom: 8, fontSize: 14 }}>{level}</Tag>
                  <Table
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    dataSource={students as any[]}
                    rowKey="student_id"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: 'Rang', dataIndex: 'rank', key: 'rank', width: 60 },
                      { title: 'Élève', dataIndex: 'student_name', key: 'name' },
                      { title: 'Classe', dataIndex: 'class_name', key: 'class' },
                      {
                        title: 'Moyenne',
                        dataIndex: 'average',
                        key: 'average',
                        render: (v: number) => <Tag color={v >= 16 ? 'gold' : v >= 10 ? 'green' : 'red'}>{v?.toFixed(2)}</Tag>,
                      },
                    ]}
                  />
                </div>
              ))}
            </Card>
          )}

          {/* At-Risk Students */}
          {gradeAnalytics.at_risk_students && gradeAnalytics.at_risk_students.length > 0 && (
            <Card
              title={
                <Space>
                  <AlertOutlined style={{ color: '#EF4444' }} />
                  <span className="section-title">Élèves à risque — Baisse de performance</span>
                  <Tag color="red">{gradeAnalytics.at_risk_students.length}</Tag>
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <Table
                dataSource={gradeAnalytics.at_risk_students}
                rowKey="student_id"
                size="small"
                pagination={{ pageSize: 10 }}
                columns={[
                  { title: 'Élève', dataIndex: 'student_name', key: 'name' },
                  { title: 'Classe', dataIndex: 'class_name', key: 'class', render: (v: string) => <Tag color="blue">{v}</Tag> },
                  {
                    title: 'Moy. précédente',
                    dataIndex: 'previous_average',
                    key: 'prev',
                    render: (v: number) => v?.toFixed(2),
                  },
                  {
                    title: 'Moy. actuelle',
                    dataIndex: 'current_average',
                    key: 'curr',
                    render: (v: number) => <Tag color={v < 10 ? 'red' : 'orange'}>{v?.toFixed(2)}</Tag>,
                  },
                  {
                    title: 'Baisse',
                    dataIndex: 'drop',
                    key: 'drop',
                    render: (v: number) => <Tag color="red">-{v?.toFixed(2)} pts</Tag>,
                  },
                ]}
              />
            </Card>
          )}

          {/* Teacher Analytics */}
          {gradeAnalytics.teacher_analytics && gradeAnalytics.teacher_analytics.length > 0 && (
            <Card
              title={<span className="section-title"><SolutionOutlined /> Analytiques enseignants — Notes</span>}
              style={{ marginTop: 16 }}
            >
              <Table
                dataSource={gradeAnalytics.teacher_analytics}
                rowKey="teacher_id"
                size="small"
                pagination={{ pageSize: 10 }}
                columns={[
                  { title: 'Enseignant', dataIndex: 'teacher_name', key: 'name' },
                  { title: 'Matière', dataIndex: 'subject', key: 'subject', render: (v: string) => <Tag>{v}</Tag> },
                  {
                    title: 'Moy. des classes',
                    dataIndex: 'class_average',
                    key: 'avg',
                    render: (v: number) => <Tag color={v >= 10 ? 'green' : 'red'}>{v?.toFixed(2)}</Tag>,
                  },
                  {
                    title: 'Taux de soumission',
                    dataIndex: 'submission_rate',
                    key: 'rate',
                    render: (v: number) => {
                      const color = v >= 80 ? 'green' : v >= 50 ? 'orange' : 'red';
                      return <Tag color={color}>{v}%</Tag>;
                    },
                  },
                ]}
              />
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
};

export default AnalyticsPage;
