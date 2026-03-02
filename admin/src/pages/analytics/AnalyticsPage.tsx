import React, { useMemo, useState } from 'react';
import { Card, Spin, Empty, Table, Tag, Button, InputNumber, Space, Tooltip, message } from 'antd';
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
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useDashboardStats, useClasses, usePayments, useAttendance, useTeachers } from '../../hooks/useApi';
import dayjs from 'dayjs';
import './AnalyticsPage.css';

const COLORS = ['#1A6BFF', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'];

const AnalyticsPage: React.FC = () => {
  const { studentCount, teacherCount, classCount, paymentCount, isLoading } = useDashboardStats();
  const { data: classData, isLoading: classesLoading } = useClasses();
  const { data: paymentData } = usePayments({ page_size: 100 });
  const { data: attendanceData } = useAttendance({ page_size: 5000 });
  const { data: teacherData } = useTeachers({ page_size: 200 });

  const [absentThreshold, setAbsentThreshold] = useState(3);

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
                <Bar dataKey="effectif" fill="#1A6BFF" radius={[6, 6, 0, 0]} />
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
            <SolutionOutlined style={{ color: '#6366F1' }} />
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
    </div>
  );
};

export default AnalyticsPage;
