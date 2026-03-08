import { useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Select, Progress, Tag, Empty,
} from 'antd';
import {
  TrophyOutlined, TeamOutlined, CheckCircleOutlined,
  CloseCircleOutlined, BarChartOutlined,
} from '@ant-design/icons';
import type { QuizListItem, QuizAttempt, ElearningAnalytics } from '../../types';
import { useQuizzes, useQuizAttempts, useElearningAnalytics } from '../../hooks/useApi';

export default function QuizAnalytics() {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);

  const { data: quizzes } = useQuizzes();
  const { data: analytics, isLoading: loadingAnalytics } = useElearningAnalytics();
  const { data: attempts, isLoading: loadingAttempts } = useQuizAttempts(selectedQuizId ?? '');

  const stats = analytics as ElearningAnalytics | undefined;
  const quizList = quizzes as QuizListItem[] | undefined;
  const attemptsList = attempts as QuizAttempt[] | undefined;

  // Compute stats for the selected quiz attempts
  const selectedStats = (() => {
    if (!attemptsList || attemptsList.length === 0) return null;
    const total = attemptsList.length;
    const passed = attemptsList.filter(a => a.passed).length;
    const avgScore =
      attemptsList.reduce((s, a) => s + (a.total_points ? (a.score / a.total_points) * 100 : 0), 0) / total;
    const topScore = Math.max(...attemptsList.map(a => a.total_points ? (a.score / a.total_points) * 100 : 0));
    return { total, passed, passRate: (passed / total) * 100, avgScore, topScore };
  })();

  const attemptColumns = [
    {
      title: 'Élève', dataIndex: 'student_name', key: 'student', ellipsis: true,
      render: (v: string) => v || '—',
    },
    {
      title: 'Score', key: 'score', width: 140,
      render: (_: unknown, r: QuizAttempt) => {
        const pct = r.total_points ? Math.round((r.score / r.total_points) * 100) : 0;
        return (
          <span>
            {r.score}/{r.total_points}{' '}
            <Tag color={pct >= 50 ? 'green' : 'red'}>{pct}%</Tag>
          </span>
        );
      },
      sorter: (a: QuizAttempt, b: QuizAttempt) => a.score - b.score,
    },
    {
      title: 'Résultat', dataIndex: 'passed', key: 'passed', width: 100,
      render: (v: boolean) =>
        v ? <Tag icon={<CheckCircleOutlined />} color="success">Réussi</Tag>
          : <Tag icon={<CloseCircleOutlined />} color="error">Échoué</Tag>,
      filters: [{ text: 'Réussi', value: true }, { text: 'Échoué', value: false }],
      onFilter: (v: unknown, r: QuizAttempt) => r.passed === v,
    },
    {
      title: 'Date', dataIndex: 'finished_at', key: 'date', width: 160,
      render: (v: string | null) => v ? new Date(v).toLocaleString('fr-DZ') : 'En cours',
      sorter: (a: QuizAttempt, b: QuizAttempt) =>
        new Date(a.finished_at ?? 0).getTime() - new Date(b.finished_at ?? 0).getTime(),
    },
  ];

  // Quiz performance table from analytics
  const quizPerfColumns = [
    { title: 'Quiz', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Tentatives', dataIndex: 'attempt_count', key: 'attempts', width: 100 },
    {
      title: 'Taux de réussite', key: 'pass_rate', width: 160,
      render: (_: unknown, r: { attempt_count: number; pass_count: number }) => {
        const rate = r.attempt_count > 0 ? Math.round((r.pass_count / r.attempt_count) * 100) : 0;
        return <Progress percent={rate} size="small" />;
      },
    },
    {
      title: 'Score moyen', dataIndex: 'avg_score', key: 'avg', width: 120,
      render: (v: number | null) => v != null ? `${Math.round(v)}%` : '—',
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Analytiques Quiz</h2>

      {/* Global KPIs */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Quiz"
              value={stats?.total_quizzes ?? 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Total Tentatives"
              value={stats?.total_attempts ?? 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Ressources"
              value={stats?.total_resources ?? 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Examens"
              value={stats?.total_exams ?? 0}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Quiz performance summary table */}
      <Card title="Performance par Quiz" size="small" style={{ marginBottom: 24 }}>
        <Table
          dataSource={stats?.quiz_stats}
          columns={quizPerfColumns}
          rowKey="id"
          loading={loadingAnalytics}
          size="small"
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Detailed quiz analysis */}
      <Card
        title="Analyse détaillée d'un Quiz"
        size="small"
        extra={
          <Select
            placeholder="Sélectionnez un quiz"
            allowClear
            style={{ width: 280 }}
            value={selectedQuizId}
            onChange={v => setSelectedQuizId(v ?? null)}
            options={quizList?.map(q => ({ value: q.id, label: q.title })) ?? []}
          />
        }
      >
        {selectedQuizId && selectedStats ? (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic title="Tentatives" value={selectedStats.total} />
              </Col>
              <Col span={6}>
                <Statistic title="Réussis" value={selectedStats.passed} valueStyle={{ color: '#3f8600' }} />
              </Col>
              <Col span={6}>
                <Statistic
                  title="Taux de réussite"
                  value={Math.round(selectedStats.passRate)}
                  suffix="%"
                  valueStyle={{ color: selectedStats.passRate >= 50 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={6}>
                <Statistic title="Score moyen" value={Math.round(selectedStats.avgScore)} suffix="%" />
              </Col>
            </Row>

            <Table
              dataSource={attemptsList}
              columns={attemptColumns}
              rowKey="id"
              loading={loadingAttempts}
              size="small"
              pagination={{ pageSize: 15 }}
            />
          </>
        ) : (
          <Empty description="Sélectionnez un quiz pour voir les détails" />
        )}
      </Card>
    </div>
  );
}
