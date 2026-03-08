import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Alert } from 'antd';
import {
  TeamOutlined,
  CoffeeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCanteenStudents, useConsumptionReport, useCanteenMenus } from '../../hooks/useApi';
import type { CanteenStudent, CanteenMenuList } from '../../types';

const RESTRICTION_COLORS: Record<string, string> = {
  NONE: 'default', DIABETIC: 'red', CELIAC: 'orange', LACTOSE: 'gold',
  ALLERGY: 'magenta', VEGETARIAN: 'green', OTHER: 'blue',
};

const CanteenDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: studentsData, isLoading: loadingStudents } = useCanteenStudents({ active: true });
  const { data: reportData, isLoading: loadingReport } = useConsumptionReport();
  const { data: menusData } = useCanteenMenus({ published: true });

  const students: CanteenStudent[] = studentsData?.results || [];
  const report = reportData as import('../../types').ConsumptionReport | undefined;
  const menus: CanteenMenuList[] = menusData?.results || [];

  const allergicStudents = students.filter((s) => s.dietary_restriction === 'ALLERGY');
  const restrictedStudents = students.filter((s) => s.dietary_restriction !== 'NONE');

  if (loadingStudents || loadingReport) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>🍽️ Cantine scolaire</h1>
          <p>Vue d'ensemble de la cantine — inscriptions, menus et fréquentation</p>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/cantine/enrollments')} style={{ borderLeft: '4px solid #00C9A7' }}>
            <Statistic title="Inscrits actifs" value={students.length} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/cantine/menus')} style={{ borderLeft: '4px solid #3B82F6' }}>
            <Statistic title="Menus publiés" value={menus.length} prefix={<CoffeeOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #F59E0B' }}>
            <Statistic title="Restrictions alimentaires" value={restrictedStudents.length} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/cantine/reports')} style={{ borderLeft: '4px solid #10B981' }}>
            <Statistic
              title="Taux présence"
              value={report?.attendance_rate || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Allergen Alerts */}
      {allergicStudents.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`⚠️ ${allergicStudents.length} élève(s) avec allergies alimentaires`}
          description={allergicStudents.map((s) => `${s.student_name}: ${s.allergy_details || 'voir dossier'}`).join(' • ')}
          style={{ marginBottom: 24 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {/* Dietary Restrictions Summary */}
        <Col xs={24} md={12}>
          <Card title={<><PieChartOutlined /> Répartition des restrictions</>} className="card card--table">
            <Table
              dataSource={report?.dietary_restrictions || []}
              rowKey="dietary_restriction"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Restriction', dataIndex: 'dietary_restriction',
                  render: (v: string) => <Tag color={RESTRICTION_COLORS[v] || 'default'}>{v}</Tag>,
                },
                { title: 'Nombre', dataIndex: 'count', align: 'center' as const },
              ]}
            />
          </Card>
        </Col>

        {/* Daily Attendance */}
        <Col xs={24} md={12}>
          <Card title="📊 Fréquentation récente" className="card card--table">
            <Table
              dataSource={(report?.daily_breakdown || []).slice(-7)}
              rowKey="date"
              pagination={false}
              size="small"
              columns={[
                { title: 'Date', dataIndex: 'date' },
                { title: 'Présents', dataIndex: 'present', render: (v: number) => <Tag color="green">{v}</Tag> },
                { title: 'Absents', dataIndex: 'absent', render: (v: number) => <Tag color="red">{v}</Tag> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CanteenDashboard;
