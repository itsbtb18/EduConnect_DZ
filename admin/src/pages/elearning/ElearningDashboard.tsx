import { Card, Col, Row, Statistic, Table, Tag, Progress, Empty, Spin } from 'antd';
import {
  BookOutlined,
  FileTextOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  EyeOutlined,
  DownloadOutlined,
  TrophyOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { ElearningAnalytics } from '../../types';
import { useElearningAnalytics, useQuizzes, useElearningResources } from '../../hooks/useApi';

export default function ElearningDashboard() {
  const { data: analytics, isLoading } = useElearningAnalytics();
  const { data: quizzes } = useQuizzes({ published: 'true' });
  const { data: resources } = useElearningResources();

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '120px auto' }} />;

  const stats: ElearningAnalytics | undefined = analytics;

  const resourceColumns = [
    { title: 'Ressource', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Type', dataIndex: 'resource_type', key: 'type',
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: 'Vues', dataIndex: 'view_count', key: 'views',
      sorter: (a: { view_count: number }, b: { view_count: number }) => a.view_count - b.view_count,
      render: (v: number) => <><EyeOutlined /> {v}</>,
    },
    {
      title: 'Télécharg.', dataIndex: 'download_count', key: 'downloads',
      render: (v: number) => <><DownloadOutlined /> {v}</>,
    },
  ];

  const quizColumns = [
    { title: 'Quiz', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Tentatives', dataIndex: 'attempt_count', key: 'attempts',
      render: (v: number) => v ?? 0,
    },
    {
      title: 'Réussi', dataIndex: 'pass_count', key: 'pass_count',
      render: (v: number, r: { attempt_count: number }) => {
        const rate = r.attempt_count > 0 ? Math.round((v / r.attempt_count) * 100) : 0;
        return <Progress percent={rate} size="small" status={rate >= 50 ? 'success' : 'exception'} />;
      },
    },
    {
      title: 'Score moyen', dataIndex: 'avg_score', key: 'avg_score',
      render: (v: number | null) => v != null ? v.toFixed(1) : '—',
    },
  ];

  const subjectColumns = [
    { title: 'Matière', dataIndex: 'subject__name', key: 'subject' },
    { title: 'Ressources', dataIndex: 'count', key: 'count' },
    {
      title: 'Vues totales', dataIndex: 'total_views', key: 'views',
      render: (v: number) => <><EyeOutlined /> {v}</>,
    },
    {
      title: 'Téléchargements', dataIndex: 'total_downloads', key: 'downloads',
      render: (v: number) => <><DownloadOutlined /> {v}</>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>E-Learning — Tableau de bord</h2>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Ressources numériques"
              value={stats?.total_resources ?? resources?.length ?? 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Banque d'examens"
              value={stats?.total_exams ?? 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Quiz créés"
              value={stats?.total_quizzes ?? quizzes?.length ?? 0}
              prefix={<QuestionCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Tentatives quiz"
              value={stats?.total_attempts ?? 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Popular Resources */}
        <Col xs={24} lg={12}>
          <Card title={<><TrophyOutlined /> Ressources les plus consultées</>}>
            {(stats?.popular_resources?.length ?? 0) > 0 ? (
              <Table
                dataSource={stats!.popular_resources}
                columns={resourceColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="Aucune donnée" />
            )}
          </Card>
        </Col>

        {/* Quiz Performance */}
        <Col xs={24} lg={12}>
          <Card title={<><BarChartOutlined /> Performance des quiz</>}>
            {(stats?.quiz_stats?.length ?? 0) > 0 ? (
              <Table
                dataSource={stats!.quiz_stats}
                columns={quizColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="Aucun quiz" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Resource Usage by Subject */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Utilisation par matière">
            {(stats?.resource_by_subject?.length ?? 0) > 0 ? (
              <Table
                dataSource={stats!.resource_by_subject}
                columns={subjectColumns}
                rowKey="subject__name"
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="Aucune donnée" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
