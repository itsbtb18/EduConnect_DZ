/**
 * Formation Dashboard — Training Center adapted dashboard
 * Shows: active groups, today's sessions, enrolled learners,
 *        pending payments, available trainers
 */
import React from 'react';
import { Card, Row, Col, Table, Tag, Statistic, Spin, Empty, Badge, List, Progress } from 'antd';
import {
  TeamOutlined, CalendarOutlined, DollarOutlined,
  UserOutlined, AppstoreOutlined, ClockCircleOutlined,
  RiseOutlined, BookOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useFormationDashboard, useTrainingSessions, useTrainingGroups, useEnrollments, useLearnerPayments } from '../../hooks/useFormation';
import dayjs from 'dayjs';
import type { TrainingSession, TrainingGroup } from '../../types/formation';
import { GROUP_STATUS_OPTIONS, SESSION_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../../constants/training-center';

const FormationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useFormationDashboard();
  const { data: todaySessions } = useTrainingSessions({ date: dayjs().format('YYYY-MM-DD') });
  const { data: groups } = useTrainingGroups({ status: 'IN_PROGRESS' });
  const { data: pendingPayments } = useLearnerPayments({ status: 'PENDING' });

  const dashboardStats = stats || {
    department_count: 0, formation_count: 0, active_groups: 0,
    active_learners: 0, monthly_revenue: 0, upcoming_sessions: 0,
  };

  const todaySessionList = (todaySessions?.results || []) as TrainingSession[];
  const activeGroups = (groups?.results || []) as TrainingGroup[];
  const pendingPaymentList = (pendingPayments?.results || []) as Record<string, unknown>[];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 }}>
          Tableau de bord — Centre de Formation
        </h1>
        <p style={{ color: '#64748b', margin: '4px 0 0' }}>
          Vue d'ensemble de votre activité
        </p>
      </div>

      {/* Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} lg={4}>
          <Card hoverable onClick={() => navigate('/formation/groups')} style={{ borderRadius: 12, cursor: 'pointer' }}>
            <Statistic
              title="Groupes actifs"
              value={dashboardStats.active_groups}
              prefix={<AppstoreOutlined style={{ color: '#3B82F6' }} />}
              valueStyle={{ color: '#3B82F6' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card hoverable onClick={() => navigate('/formation/schedule')} style={{ borderRadius: 12, cursor: 'pointer' }}>
            <Statistic
              title="Séances du jour"
              value={todaySessionList.length}
              prefix={<CalendarOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card hoverable onClick={() => navigate('/formation/learners')} style={{ borderRadius: 12, cursor: 'pointer' }}>
            <Statistic
              title="Apprenants inscrits"
              value={dashboardStats.active_learners}
              prefix={<TeamOutlined style={{ color: '#8B5CF6' }} />}
              valueStyle={{ color: '#8B5CF6' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card hoverable onClick={() => navigate('/formation/finance')} style={{ borderRadius: 12, cursor: 'pointer' }}>
            <Statistic
              title="Paiements en attente"
              value={pendingPaymentList.length}
              prefix={<DollarOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ color: '#F59E0B' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Formations"
              value={dashboardStats.formation_count}
              prefix={<BookOutlined style={{ color: '#EC4899' }} />}
              valueStyle={{ color: '#EC4899' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Revenus du mois"
              value={dashboardStats.monthly_revenue}
              prefix={<RiseOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981' }}
              suffix="DA"
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Today's Sessions */}
        <Col xs={24} lg={14}>
          <Card
            title={<span><ClockCircleOutlined style={{ marginRight: 8 }} />Séances du jour</span>}
            style={{ borderRadius: 12 }}
            extra={<a onClick={() => navigate('/formation/schedule')}>Voir tout</a>}
          >
            {todaySessionList.length > 0 ? (
              <Table
                dataSource={todaySessionList}
                columns={[
                  { title: 'Groupe', dataIndex: 'group_name', key: 'group' },
                  { title: 'Horaire', key: 'time',
                    render: (_: unknown, r: TrainingSession) => `${r.start_time?.slice(0, 5)} - ${r.end_time?.slice(0, 5)}` },
                  { title: 'Salle', dataIndex: 'room_name', key: 'room', render: (v: string) => v || '—' },
                  { title: 'Formateur', dataIndex: 'trainer_name', key: 'trainer', render: (v: string) => v || '—' },
                  { title: 'Statut', dataIndex: 'status', key: 'status',
                    render: (s: string) => {
                      const opt = SESSION_STATUS_OPTIONS.find(o => o.value === s);
                      return <Tag color={opt?.color || 'default'}>{opt?.label || s}</Tag>;
                    },
                  },
                ]}
                rowKey="id"
                size="small"
                pagination={false}
              />
            ) : (
              <Empty description="Aucune séance aujourd'hui" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>

        {/* Active Groups */}
        <Col xs={24} lg={10}>
          <Card
            title={<span><AppstoreOutlined style={{ marginRight: 8 }} />Groupes en cours</span>}
            style={{ borderRadius: 12 }}
            extra={<a onClick={() => navigate('/formation/groups')}>Voir tout</a>}
          >
            {activeGroups.length > 0 ? (
              <List
                dataSource={activeGroups.slice(0, 6)}
                renderItem={(g: TrainingGroup) => (
                  <List.Item>
                    <List.Item.Meta
                      title={g.name}
                      description={
                        <span style={{ fontSize: 12 }}>
                          {g.formation_name} · Niveau {g.level} · <UserOutlined /> {g.trainer_name || '—'}
                        </span>
                      }
                    />
                    <div style={{ textAlign: 'right' }}>
                      <Progress
                        percent={g.capacity ? Math.round(((g.enrolled_count || 0) / g.capacity) * 100) : 0}
                        size="small"
                        style={{ width: 100 }}
                        format={() => `${g.enrolled_count || 0}/${g.capacity}`}
                      />
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Aucun groupe en cours" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Pending Payments */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card
            title={<span><DollarOutlined style={{ marginRight: 8 }} />Paiements en attente</span>}
            style={{ borderRadius: 12 }}
            extra={<a onClick={() => navigate('/formation/finance')}>Gérer</a>}
          >
            {pendingPaymentList.length > 0 ? (
              <Table
                dataSource={pendingPaymentList}
                columns={[
                  { title: 'Apprenant', dataIndex: 'learner_name', key: 'learner' },
                  { title: 'Montant', dataIndex: 'amount', key: 'amount',
                    render: (v: number) => `${v?.toLocaleString()} DA` },
                  { title: 'Date', dataIndex: 'payment_date', key: 'date',
                    render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY') : '—' },
                  { title: 'Statut', dataIndex: 'status', key: 'status',
                    render: (s: string) => {
                      const opt = PAYMENT_STATUS_OPTIONS.find(o => o.value === s);
                      return <Tag color={opt?.color || 'default'}>{opt?.label || s}</Tag>;
                    },
                  },
                ]}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
              />
            ) : (
              <Empty description="Aucun paiement en attente" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FormationDashboard;
