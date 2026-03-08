import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Progress } from 'antd';
import {
  BookOutlined, TeamOutlined, WarningOutlined, CheckCircleOutlined,
  ClockCircleOutlined, StarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLibraryUsageReport, useLoans } from '../../hooks/useApi';
import type { LibraryUsageReport, Loan } from '../../types';

const LibraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: reportData, isLoading: loadingReport } = useLibraryUsageReport();
  const { data: loansData, isLoading: loadingLoans } = useLoans({ status: 'OVERDUE' });

  const report = reportData as LibraryUsageReport | undefined;
  const overdueLoans = (loansData?.results || loansData || []) as Loan[];

  const availabilityRate = report && report.total_copies > 0
    ? Math.round((report.available_copies / report.total_copies) * 100)
    : 0;

  if (loadingReport || loadingLoans) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>📚 Bibliothèque</h1>
          <p>Vue d&apos;ensemble de la bibliothèque scolaire</p>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/library/catalog')} style={{ borderLeft: '4px solid #3B82F6' }}>
            <Statistic title="Total livres" value={report?.total_books || 0} prefix={<BookOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/library/catalog')} style={{ borderLeft: '4px solid #10B981' }}>
            <Statistic title="Exemplaires disponibles" value={report?.available_copies || 0} suffix={`/ ${report?.total_copies || 0}`} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/library/loans')} style={{ borderLeft: '4px solid #F59E0B' }}>
            <Statistic title="Emprunts actifs" value={report?.active_loans || 0} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card hoverable onClick={() => navigate('/library/loans')} style={{ borderLeft: '4px solid #EF4444' }}>
            <Statistic title="En retard" value={report?.overdue_loans || 0} prefix={<WarningOutlined />} valueStyle={report?.overdue_loans ? { color: '#EF4444' } : undefined} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card title="Taux de disponibilité">
            <div style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={availabilityRate} strokeColor={availabilityRate > 50 ? '#10B981' : '#F59E0B'} />
              <p style={{ marginTop: 12, color: '#666' }}>
                {report?.available_copies || 0} exemplaires disponibles sur {report?.total_copies || 0}
              </p>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Emprunteurs actifs">
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <Statistic value={report?.active_borrowers || 0} prefix={<TeamOutlined style={{ fontSize: 28, color: '#3B82F6' }} />} />
              <p style={{ marginTop: 12, color: '#666' }}>utilisateurs avec un emprunt en cours</p>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Total emprunts">
            <div style={{ textAlign: 'center', paddingTop: 24 }}>
              <Statistic value={report?.total_loans || 0} prefix={<BookOutlined style={{ fontSize: 28, color: '#00C9A7' }} />} />
              <p style={{ marginTop: 12, color: '#666' }}>emprunts depuis le début</p>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title={<><StarOutlined /> Livres les plus empruntés</>} styles={{ body: { padding: 0 } }}>
            <Table
              dataSource={(report?.popular_books || []).map((b, i) => ({ ...b, key: i }))}
              columns={[
                { title: '#', render: (_, __, i) => i + 1, width: 50 },
                { title: 'Titre', dataIndex: 'book__title' },
                { title: 'Emprunts', dataIndex: 'count', width: 100, render: (v: number) => <Tag color="blue">{v}</Tag> },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={<><WarningOutlined style={{ color: '#EF4444' }} /> Emprunts en retard</>} styles={{ body: { padding: 0 } }}>
            <Table
              dataSource={overdueLoans.slice(0, 10).map(l => ({ ...l, key: l.id }))}
              columns={[
                { title: 'Livre', dataIndex: 'book_title', ellipsis: true },
                { title: 'Emprunteur', dataIndex: 'borrower_name', ellipsis: true },
                { title: 'Date limite', dataIndex: 'due_date', width: 110, render: (d: string) => new Date(d).toLocaleDateString('fr-FR') },
                {
                  title: 'Retard',
                  width: 90,
                  render: (_, r: Loan) => {
                    const days = Math.ceil((Date.now() - new Date(r.due_date).getTime()) / 86400000);
                    return <Tag color="red">{days}j</Tag>;
                  },
                },
              ]}
              pagination={false}
              size="small"
              locale={{ emptyText: 'Aucun retard 🎉' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LibraryDashboard;
