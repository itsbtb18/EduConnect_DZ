import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, DatePicker, Spin } from 'antd';
import {
  BarChartOutlined, TeamOutlined, CheckCircleOutlined, PieChartOutlined,
} from '@ant-design/icons';
import { useConsumptionReport } from '../../hooks/useApi';
import type { ConsumptionReport } from '../../types';
import dayjs from 'dayjs';

const RESTRICTION_COLORS: Record<string, string> = {
  NONE: 'default', DIABETIC: 'red', CELIAC: 'orange', LACTOSE: 'gold',
  ALLERGY: 'magenta', VEGETARIAN: 'green', OTHER: 'blue',
};

const RESTRICTION_LABELS: Record<string, string> = {
  NONE: 'Aucune', DIABETIC: 'Diabétique', CELIAC: 'Cœliaque', LACTOSE: 'Intolérant lactose',
  ALLERGY: 'Allergie', VEGETARIAN: 'Végétarien', OTHER: 'Autre',
};

const CanteenReports: React.FC = () => {
  const [dateRange, setDateRange] = useState<[string?, string?]>([]);
  const { data, isLoading } = useConsumptionReport({
    ...(dateRange[0] ? { start: dateRange[0] } : {}),
    ...(dateRange[1] ? { end: dateRange[1] } : {}),
  });

  const report = data as ConsumptionReport | undefined;

  if (isLoading) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><BarChartOutlined className="page-header__icon" /> Rapports cantine</h1>
          <p>Statistiques de fréquentation et restrictions alimentaires</p>
        </div>
        <div className="page-header__actions">
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            onChange={(dates) => {
              setDateRange([
                dates?.[0]?.format('YYYY-MM-DD'),
                dates?.[1]?.format('YYYY-MM-DD'),
              ]);
            }}
          />
        </div>
      </div>

      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #00C9A7' }}>
            <Statistic title="Élèves inscrits" value={report?.enrolled_students || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #3B82F6' }}>
            <Statistic title="Repas servis" value={report?.total_present || 0} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #10B981' }}>
            <Statistic title="Taux de présence" value={report?.attendance_rate || 0} suffix="%" />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #F59E0B' }}>
            <Statistic title="Absences" value={report?.total_absent || 0} valueStyle={{ color: '#F59E0B' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Dietary Restrictions Breakdown */}
        <Col xs={24} md={12}>
          <Card title={<><PieChartOutlined /> Restrictions alimentaires</>} className="card card--table">
            <Table
              dataSource={report?.dietary_restrictions || []}
              rowKey="dietary_restriction"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Restriction', dataIndex: 'dietary_restriction',
                  render: (v: string) => (
                    <Tag color={RESTRICTION_COLORS[v] || 'default'}>
                      {RESTRICTION_LABELS[v] || v}
                    </Tag>
                  ),
                },
                {
                  title: 'Nombre', dataIndex: 'count', align: 'center' as const,
                  render: (v: number) => <strong>{v}</strong>,
                },
              ]}
            />
          </Card>
        </Col>

        {/* Daily Breakdown */}
        <Col xs={24} md={12}>
          <Card title="📊 Fréquentation journalière" className="card card--table">
            <Table
              dataSource={report?.daily_breakdown || []}
              rowKey="date"
              pagination={{ pageSize: 10, showTotal: (t) => `${t} jours` }}
              size="small"
              columns={[
                {
                  title: 'Date', dataIndex: 'date',
                  render: (v: string) => dayjs(v).format('DD/MM/YYYY'),
                },
                {
                  title: 'Présents', dataIndex: 'present',
                  render: (v: number) => <Tag color="green">{v}</Tag>,
                },
                {
                  title: 'Absents', dataIndex: 'absent',
                  render: (v: number) => <Tag color="red">{v}</Tag>,
                },
                {
                  title: 'Taux', key: 'rate',
                  render: (_: unknown, r: { present: number; absent: number }) => {
                    const t = r.present + r.absent;
                    const rate = t > 0 ? Math.round((r.present / t) * 100) : 0;
                    return <Tag color={rate >= 80 ? 'green' : rate >= 50 ? 'orange' : 'red'}>{rate}%</Tag>;
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CanteenReports;
