import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Progress, Empty } from 'antd';
import {
  BookOutlined, BarChartOutlined, PieChartOutlined, WarningOutlined,
  CheckCircleOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useLibraryUsageReport, useLoans } from '../../hooks/useApi';
import type { LibraryUsageReport, Loan } from '../../types';

const CATEGORY_LABELS: Record<string, string> = {
  FICTION: 'Fiction', NON_FICTION: 'Non-fiction', SCIENCE: 'Sciences',
  MATHEMATICS: 'Mathématiques', HISTORY: 'Histoire', GEOGRAPHY: 'Géographie',
  LITERATURE: 'Littérature', RELIGION: 'Religion', ARTS: 'Arts',
  TECHNOLOGY: 'Technologie', REFERENCE: 'Référence', PHILOSOPHY: 'Philosophie',
  LANGUAGES: 'Langues', SPORTS: 'Sports', OTHER: 'Autre',
};

const CATEGORY_COLORS: Record<string, string> = {
  FICTION: '#3B82F6', NON_FICTION: '#10B981', SCIENCE: '#F59E0B',
  MATHEMATICS: '#EF4444', HISTORY: '#8B5CF6', GEOGRAPHY: '#06B6D4',
  LITERATURE: '#EC4899', RELIGION: '#14B8A6', ARTS: '#F97316',
  TECHNOLOGY: '#6366F1', REFERENCE: '#84CC16', PHILOSOPHY: '#A855F7',
  LANGUAGES: '#0EA5E9', SPORTS: '#22C55E', OTHER: '#9CA3AF',
};

const LibraryReports: React.FC = () => {
  const { data: reportData, isLoading: loadingReport } = useLibraryUsageReport();
  const { data: overdueData, isLoading: loadingOverdue } = useLoans({ status: 'OVERDUE' });

  const report = reportData as LibraryUsageReport | undefined;
  const overdueLoans = (overdueData?.results || overdueData || []) as Loan[];

  if (loadingReport || loadingOverdue) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  if (!report) {
    return <div className="page"><Empty description="Aucune donnée disponible" /></div>;
  }

  const availabilityRate = report.total_copies > 0
    ? Math.round((report.available_copies / report.total_copies) * 100) : 0;

  const categoryData = Object.entries(report.category_distribution || {})
    .map(([cat, count]) => ({ key: cat, category: cat, count: count as number }))
    .sort((a, b) => b.count - a.count);

  const totalCategoryBooks = categoryData.reduce((s, c) => s + c.count, 0);

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>📊 Rapports de la bibliothèque</h1>
          <p>Statistiques et indicateurs de performance</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={4}>
          <Card><Statistic title="Total livres" value={report.total_books} prefix={<BookOutlined />} /></Card>
        </Col>
        <Col xs={12} md={4}>
          <Card><Statistic title="Total exemplaires" value={report.total_copies} prefix={<BookOutlined />} /></Card>
        </Col>
        <Col xs={12} md={4}>
          <Card><Statistic title="Disponibles" value={report.available_copies} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10B981' }} /></Card>
        </Col>
        <Col xs={12} md={4}>
          <Card><Statistic title="Total emprunts" value={report.total_loans} prefix={<BarChartOutlined />} /></Card>
        </Col>
        <Col xs={12} md={4}>
          <Card><Statistic title="Emprunts actifs" value={report.active_loans} prefix={<BookOutlined />} valueStyle={{ color: '#3B82F6' }} /></Card>
        </Col>
        <Col xs={12} md={4}>
          <Card><Statistic title="En retard" value={report.overdue_loans} prefix={<WarningOutlined />} valueStyle={report.overdue_loans > 0 ? { color: '#EF4444' } : undefined} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Availability */}
        <Col xs={24} md={8}>
          <Card title="Taux de disponibilité">
            <div style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={availabilityRate} size={140} strokeColor={availabilityRate > 50 ? '#10B981' : '#F59E0B'} />
              <p style={{ marginTop: 12, color: '#666' }}>
                {report.available_copies} / {report.total_copies} exemplaires disponibles
              </p>
            </div>
          </Card>
        </Col>

        {/* Active borrowers */}
        <Col xs={24} md={8}>
          <Card title="Emprunteurs actifs">
            <div style={{ textAlign: 'center', paddingTop: 20 }}>
              <TeamOutlined style={{ fontSize: 48, color: '#3B82F6', marginBottom: 16 }} />
              <Statistic value={report.active_borrowers} suffix="utilisateurs" />
              <p style={{ color: '#666', marginTop: 8 }}>avec un emprunt en cours</p>
            </div>
          </Card>
        </Col>

        {/* Usage ratio */}
        <Col xs={24} md={8}>
          <Card title="Taux d'utilisation">
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={report.total_copies > 0 ? Math.round(((report.total_copies - report.available_copies) / report.total_copies) * 100) : 0}
                size={140}
                strokeColor="#3B82F6"
              />
              <p style={{ marginTop: 12, color: '#666' }}>
                {report.total_copies - report.available_copies} exemplaires en circulation
              </p>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Popular books */}
        <Col xs={24} md={12}>
          <Card title={<><BarChartOutlined /> Livres les plus empruntés</>} styles={{ body: { padding: 0 } }}>
            <Table
              dataSource={(report.popular_books || []).map((b, i) => ({ ...b, key: i }))}
              columns={[
                { title: '#', render: (_, __, i) => i + 1, width: 50 },
                { title: 'Titre', dataIndex: 'book__title', ellipsis: true },
                {
                  title: 'Emprunts',
                  dataIndex: 'count',
                  width: 100,
                  render: (v: number) => <Tag color="blue">{v}</Tag>,
                },
                {
                  title: '%',
                  width: 120,
                  render: (_: unknown, r: { count: number }) =>
                    report.total_loans > 0 ? (
                      <Progress
                        percent={Math.round((r.count / report.total_loans) * 100)}
                        size="small"
                        strokeColor="#3B82F6"
                      />
                    ) : '—',
                },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Category distribution */}
        <Col xs={24} md={12}>
          <Card title={<><PieChartOutlined /> Répartition par catégorie</>} styles={{ body: { padding: 0 } }}>
            <Table
              dataSource={categoryData}
              columns={[
                {
                  title: 'Catégorie',
                  dataIndex: 'category',
                  render: (v: string) => (
                    <Tag color={CATEGORY_COLORS[v] || '#9CA3AF'}>{CATEGORY_LABELS[v] || v}</Tag>
                  ),
                },
                { title: 'Livres', dataIndex: 'count', width: 80 },
                {
                  title: '%',
                  width: 140,
                  render: (_: unknown, r: { count: number }) => (
                    <Progress
                      percent={totalCategoryBooks > 0 ? Math.round((r.count / totalCategoryBooks) * 100) : 0}
                      size="small"
                      strokeColor={CATEGORY_COLORS[r.count as unknown as string] || '#3B82F6'}
                    />
                  ),
                },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Overdue report */}
      {overdueLoans.length > 0 && (
        <Card
          title={<><WarningOutlined style={{ color: '#EF4444' }} /> Rapport des retards ({overdueLoans.length})</>}
          style={{ marginTop: 16 }}
          styles={{ body: { padding: 0 } }}
        >
          <Table
            dataSource={overdueLoans.map(l => ({ ...l, key: l.id }))}
            columns={[
              { title: 'Livre', dataIndex: 'book_title', ellipsis: true },
              { title: 'Emprunteur', dataIndex: 'borrower_name', ellipsis: true },
              { title: 'Code-barres', dataIndex: 'copy_barcode', width: 130 },
              {
                title: 'Date limite',
                dataIndex: 'due_date',
                width: 110,
                render: (d: string) => new Date(d).toLocaleDateString('fr-FR'),
              },
              {
                title: 'Jours de retard',
                width: 120,
                render: (_: unknown, r: Loan) => {
                  const days = Math.ceil((Date.now() - new Date(r.due_date).getTime()) / 86400000);
                  const color = days > 14 ? 'red' : days > 7 ? 'volcano' : 'orange';
                  return <Tag color={color}>{days} jours</Tag>;
                },
              },
              {
                title: 'Renouvellements',
                dataIndex: 'renewals_count',
                width: 80,
                align: 'center' as const,
                render: (v: number) => `${v}/2`,
              },
            ]}
            pagination={{ pageSize: 20 }}
            size="small"
          />
        </Card>
      )}
    </div>
  );
};

export default LibraryReports;
