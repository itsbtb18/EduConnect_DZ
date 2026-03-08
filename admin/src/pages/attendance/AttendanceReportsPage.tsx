import React, { useState } from 'react';
import { Card, Select, Table, Tag, Space, Button, DatePicker, Empty, Spin, Tabs } from 'antd';
import {
  CalendarOutlined, BarChartOutlined, TrophyOutlined, DownloadOutlined, TeamOutlined,
} from '@ant-design/icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import dayjs from 'dayjs';
import {
  useClasses, useMonthlyAttendanceReport, useAnnualAttendanceReport,
  useAttendanceRanking, useAttendanceExcelExport,
} from '../../hooks/useApi';

const STATUS_COLORS: Record<string, string> = {
  present: '#10B981',
  absent: '#EF4444',
  late: '#F59E0B',
  excused: '#3B82F6',
};

const STATUS_LABELS: Record<string, string> = {
  present: 'P',
  absent: 'A',
  late: 'R',
  excused: 'E',
};

const AttendanceReportsPage: React.FC = () => {
  const { data: classData } = useClasses({ page_size: 200 });
  const classes = classData?.results || [];

  const [classId, setClassId] = useState<string>('');
  const [month, setMonth] = useState(dayjs().month() + 1);
  const [year, setYear] = useState(dayjs().year());

  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyAttendanceReport(
    classId ? { class_id: classId, month, year } : undefined
  );
  const { data: annualData, isLoading: annualLoading } = useAnnualAttendanceReport(
    classId ? { class_id: classId, year } : undefined
  );
  const { data: rankingData, isLoading: rankingLoading } = useAttendanceRanking(
    classId ? { class_id: classId } : undefined
  );
  const excelExport = useAttendanceExcelExport();

  // Build days array for the selected month
  const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Monthly report columns
  const monthlyColumns = [
    {
      title: 'Élève',
      dataIndex: 'student_name',
      key: 'name',
      fixed: 'left' as const,
      width: 180,
      render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span>,
    },
    ...days.map(d => ({
      title: String(d),
      key: `day_${d}`,
      width: 36,
      align: 'center' as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: unknown, record: any) => {
        const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const status = record.daily_status?.[dateKey];
        if (!status) return <span style={{ color: '#d9d9d9' }}>—</span>;
        return (
          <span style={{
            color: STATUS_COLORS[status] || '#999',
            fontWeight: 700,
            fontSize: 12,
          }}>
            {STATUS_LABELS[status] || status[0]?.toUpperCase()}
          </span>
        );
      },
    })),
    {
      title: 'Abs',
      key: 'absences',
      width: 50,
      align: 'center' as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: unknown, r: any) => <Tag color="red">{r.total_absent || 0}</Tag>,
    },
    {
      title: 'Ret',
      key: 'lates',
      width: 50,
      align: 'center' as const,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: unknown, r: any) => <Tag color="orange">{r.total_late || 0}</Tag>,
    },
  ];

  // Annual chart data
  const annualChartData = (annualData?.months || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any) => ({
      name: dayjs().month(m.month - 1).format('MMM'),
      présents: m.present_count || 0,
      absents: m.absent_count || 0,
      retards: m.late_count || 0,
    })
  );

  // Ranking columns
  const rankingColumns = [
    {
      title: '#',
      key: 'rank',
      width: 50,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: unknown, __: any, idx: number) => idx + 1,
    },
    { title: 'Élève', dataIndex: 'student_name', key: 'name' },
    { title: 'Classe', dataIndex: 'class_name', key: 'class', render: (v: string) => <Tag color="blue">{v}</Tag> },
    {
      title: 'Taux de présence',
      dataIndex: 'attendance_rate',
      key: 'rate',
      render: (v: number) => {
        const color = v >= 90 ? 'green' : v >= 70 ? 'orange' : 'red';
        return <Tag color={color}>{v?.toFixed(1)}%</Tag>;
      },
    },
    {
      title: 'Absences',
      dataIndex: 'absent_count',
      key: 'absences',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sorter: (a: any, b: any) => a.absent_count - b.absent_count,
      render: (v: number) => <Tag color="red">{v}</Tag>,
    },
    { title: 'Retards', dataIndex: 'late_count', key: 'lates', render: (v: number) => <Tag color="orange">{v}</Tag> },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><CalendarOutlined /> Rapports de Présence</h1>
          <p>Rapports mensuels, annuels, classement et exports</p>
        </div>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => excelExport.mutate({ class_id: classId, month, year })}
            loading={excelExport.isPending}
            disabled={!classId}
          >
            Export Excel
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            value={classId || undefined}
            onChange={setClassId}
            style={{ width: 220 }}
            placeholder="Sélectionnez une classe"
            showSearch
            optionFilterProp="children"
          >
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {classes.map((c: any) => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
          <DatePicker
            picker="month"
            value={dayjs(`${year}-${month}-01`)}
            onChange={(d) => {
              if (d) {
                setMonth(d.month() + 1);
                setYear(d.year());
              }
            }}
          />
        </Space>
      </Card>

      {!classId ? (
        <Card><Empty description="Sélectionnez une classe pour afficher les rapports" /></Card>
      ) : (
        <Tabs items={[
          {
            key: 'monthly',
            label: <span><CalendarOutlined /> Rapport Mensuel</span>,
            children: monthlyLoading ? (
              <Card style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></Card>
            ) : monthlyData?.students?.length > 0 ? (
              <Card>
                <div style={{ marginBottom: 12 }}>
                  <Space>
                    <Tag color="green">P = Présent</Tag>
                    <Tag color="red">A = Absent</Tag>
                    <Tag color="orange">R = Retard</Tag>
                    <Tag color="blue">E = Excusé</Tag>
                  </Space>
                </div>
                <Table
                  dataSource={monthlyData.students}
                  columns={monthlyColumns}
                  rowKey="student_id"
                  size="small"
                  scroll={{ x: 180 + days.length * 36 + 100 }}
                  pagination={false}
                />
              </Card>
            ) : (
              <Card><Empty description="Aucune donnée pour ce mois" /></Card>
            ),
          },
          {
            key: 'annual',
            label: <span><BarChartOutlined /> Rapport Annuel</span>,
            children: annualLoading ? (
              <Card style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></Card>
            ) : annualChartData.length > 0 ? (
              <Card title={<span><BarChartOutlined /> Évolution annuelle de la présence</span>}>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={annualChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="présents" fill="#10B981" radius={[4, 4, 0, 0]} name="Présents" />
                    <Bar dataKey="absents" fill="#EF4444" radius={[4, 4, 0, 0]} name="Absents" />
                    <Bar dataKey="retards" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Retards" />
                  </BarChart>
                </ResponsiveContainer>
                {annualData?.summary && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Space size="large">
                      <Tag color="green">Total présents: {annualData.summary.total_present}</Tag>
                      <Tag color="red">Total absents: {annualData.summary.total_absent}</Tag>
                      <Tag color="orange">Total retards: {annualData.summary.total_late}</Tag>
                      <Tag color="blue">Taux: {annualData.summary.attendance_rate?.toFixed(1)}%</Tag>
                    </Space>
                  </div>
                )}
              </Card>
            ) : (
              <Card><Empty description="Aucune donnée annuelle" /></Card>
            ),
          },
          {
            key: 'ranking',
            label: <span><TrophyOutlined /> Classement</span>,
            children: rankingLoading ? (
              <Card style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></Card>
            ) : (rankingData?.results || rankingData || []).length > 0 ? (
              <Card title={<span><TeamOutlined /> Classement par assiduité</span>}>
                <Table
                  dataSource={rankingData?.results || rankingData || []}
                  columns={rankingColumns}
                  rowKey="student_id"
                  size="small"
                  pagination={{ pageSize: 20, showTotal: (t) => `${t} élève(s)` }}
                />
              </Card>
            ) : (
              <Card><Empty description="Aucune donnée de classement" /></Card>
            ),
          },
        ]} />
      )}
    </div>
  );
};

export default AttendanceReportsPage;
