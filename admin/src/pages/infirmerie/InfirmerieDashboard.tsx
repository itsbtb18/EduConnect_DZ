import React from 'react';
import { Card, Col, Row, Statistic, Tag, Table, Spin, Alert, Badge } from 'antd';
import {
  MedicineBoxOutlined,
  AlertOutlined,
  HeartOutlined,
  WarningOutlined,
  FileTextOutlined,
  MessageOutlined,
  TeamOutlined,
  ExperimentOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useInfirmerieDashboard } from '../../hooks/useApi';
import type { InfirmerieDashboardData } from '../../types';

const REASON_LABELS: Record<string, string> = {
  HEADACHE: 'Maux de tête',
  STOMACH: 'Maux de ventre',
  FEVER: 'Fièvre',
  INJURY: 'Blessure',
  ALLERGY_REACTION: 'Réaction allergique',
  ASTHMA: 'Crise d\'asthme',
  DIABETES: 'Malaise diabétique',
  EPILEPSY: 'Épilepsie',
  NAUSEA: 'Nausée',
  DIZZINESS: 'Vertige',
  EYE: 'Oculaire',
  DENTAL: 'Dentaire',
  SKIN: 'Cutané',
  PSYCHOLOGICAL: 'Psychologique',
  MEDICATION_ADMIN: 'Médicament',
  FOLLOW_UP: 'Suivi',
  OTHER: 'Autre',
};

const InfirmerieDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useInfirmerieDashboard();
  const dashboard = data as InfirmerieDashboardData | undefined;

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (error) return <Alert type="error" message="Erreur de chargement du tableau de bord" />;
  if (!dashboard) return null;

  const reasonColumns = [
    {
      title: 'Motif',
      dataIndex: 'reason',
      key: 'reason',
      render: (v: string) => REASON_LABELS[v] || v,
    },
    {
      title: 'Nombre',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: { count: number }, b: { count: number }) => a.count - b.count,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 24 }}>
        <MedicineBoxOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        Infirmerie — Tableau de bord
      </h2>

      {/* Alerts row */}
      {(dashboard.active_emergencies > 0 || dashboard.active_epidemics > 0) && (
        <Alert
          type="error"
          showIcon
          icon={<AlertOutlined />}
          message={
            <>
              {dashboard.active_emergencies > 0 && (
                <span style={{ marginRight: 16 }}>
                  🚨 {dashboard.active_emergencies} urgence(s) en cours
                </span>
              )}
              {dashboard.active_epidemics > 0 && (
                <span>⚠️ {dashboard.active_epidemics} alerte(s) épidémique(s)</span>
              )}
            </>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* KPI cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={6}>
          <Card
            hoverable
            onClick={() => navigate('/infirmerie/consultations')}
            style={{ borderLeft: '4px solid #1890ff' }}
          >
            <Statistic
              title="Consultations aujourd'hui"
              value={dashboard.today_consultations}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card
            hoverable
            onClick={() => navigate('/infirmerie/emergencies')}
            style={{ borderLeft: '4px solid #ff4d4f' }}
          >
            <Statistic
              title="Urgences actives"
              value={dashboard.active_emergencies}
              prefix={<AlertOutlined />}
              valueStyle={{ color: dashboard.active_emergencies > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card
            hoverable
            onClick={() => navigate('/infirmerie/records')}
            style={{ borderLeft: '4px solid #722ed1' }}
          >
            <Statistic
              title="Dossiers médicaux"
              value={dashboard.total_medical_records}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ borderLeft: '4px solid #52c41a' }}>
            <Statistic
              title="Couverture vaccinale"
              value={dashboard.vaccination_coverage}
              suffix="%"
              prefix={<ExperimentOutlined />}
              valueStyle={{ color: dashboard.vaccination_coverage >= 80 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card
            hoverable
            style={{ borderLeft: '4px solid #faad14' }}
          >
            <Statistic
              title="Stock bas médicaments"
              value={dashboard.low_stock_medications}
              prefix={<WarningOutlined />}
              valueStyle={{ color: dashboard.low_stock_medications > 0 ? '#faad14' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card style={{ borderLeft: '4px solid #eb2f96' }}>
            <Statistic
              title="Allergies anaphylactiques"
              value={dashboard.anaphylactic_allergies}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card
            hoverable
            onClick={() => navigate('/infirmerie/justifications')}
            style={{ borderLeft: '4px solid #13c2c2' }}
          >
            <Badge count={dashboard.pending_justifications} offset={[15, -5]}>
              <Statistic
                title="Justifications en attente"
                value={dashboard.pending_justifications}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Badge>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card
            hoverable
            onClick={() => navigate('/infirmerie/messages')}
            style={{ borderLeft: '4px solid #fa8c16' }}
          >
            <Badge count={dashboard.unread_messages} offset={[15, -5]}>
              <Statistic
                title="Messages non lus"
                value={dashboard.unread_messages}
                prefix={<MessageOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Badge>
          </Card>
        </Col>
      </Row>

      {/* Evictions */}
      {dashboard.evictions > 0 && (
        <Alert
          type="warning"
          showIcon
          message={`${dashboard.evictions} élève(s) en éviction pour maladie contagieuse`}
          style={{ marginTop: 16 }}
        />
      )}

      {/* Consultations by reason */}
      <Card title="Motifs de consultation (7 derniers jours)" style={{ marginTop: 24 }}>
        <Table
          dataSource={dashboard.consultations_by_reason}
          columns={reasonColumns}
          rowKey="reason"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default InfirmerieDashboard;
