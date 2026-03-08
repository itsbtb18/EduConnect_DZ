import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Spin, Tag } from 'antd';
import {
  BookOutlined, BarChartOutlined, ContainerOutlined,
  ReconciliationOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useBooks, useLoans, useLibraryRequests, useLibraryUsageReport } from '../../hooks/useApi';
import './RoleDashboard.css';

const LibrarianDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: booksRaw, isLoading: booksLoading } = useBooks({ page_size: 5 });
  const { data: loansRaw, isLoading: loansLoading } = useLoans({ page_size: 10 });
  const { data: requestsRaw } = useLibraryRequests();
  const { data: usageRaw } = useLibraryUsageReport();

  const books = useMemo(() => {
    const d = booksRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [booksRaw]);

  const loans = useMemo(() => {
    const d = loansRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [loansRaw]);

  const requests = useMemo(() => {
    const d = requestsRaw as any;
    return Array.isArray(d) ? d : d?.results ?? [];
  }, [requestsRaw]);

  const usage = usageRaw as any;

  const totalBooks = (booksRaw as any)?.count ?? books.length;
  const activeLoans = loans.filter((l: any) => l.status === 'BORROWED' || l.status === 'ACTIVE').length;
  const pendingRequests = requests.filter((r: any) => r.status === 'PENDING').length;

  const statCards = [
    { label: 'Livres au catalogue', value: totalBooks, icon: <BookOutlined />, bg: '#F5F3FF', color: '#7C3AED' },
    { label: 'Emprunts actifs', value: activeLoans, icon: <ContainerOutlined />, bg: '#EFF6FF', color: '#2563EB' },
    { label: 'Demandes en attente', value: pendingRequests, icon: <ReconciliationOutlined />, bg: '#FFF7ED', color: '#EA580C' },
    { label: 'Consultations ce mois', value: usage?.monthly_visitors ?? '—', icon: <TeamOutlined />, bg: '#ECFDF5', color: '#059669' },
  ];

  const loanColumns = [
    { title: 'Livre', dataIndex: 'book_title', key: 'book_title',
      render: (v: string, r: any) => v || r.book_name || '—' },
    { title: 'Emprunteur', dataIndex: 'borrower_name', key: 'borrower',
      render: (v: string, r: any) => v || r.student_name || '—' },
    { title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string) => (
        <Tag color={s === 'RETURNED' ? 'green' : s === 'OVERDUE' ? 'red' : 'blue'}>
          {s === 'RETURNED' ? 'Rendu' : s === 'OVERDUE' ? 'En retard' : 'Emprunté'}
        </Tag>
      ),
    },
    { title: 'Date', dataIndex: 'borrowed_at', key: 'date',
      render: (d: string) => d ? new Date(d).toLocaleDateString('fr-DZ') : '—' },
  ];

  return (
    <div className="rd-page">
      <div className="rd-header">
        <div className="rd-header__info">
          <h1><BookOutlined style={{ color: '#7C3AED' }} /> Tableau de bord Bibliothèque</h1>
          <div className="rd-header__subtitle">
            Catalogue, emprunts, retours et rapports de la bibliothèque
          </div>
        </div>
      </div>

      {booksLoading ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <div className="rd-stats">
          {statCards.map((c) => (
            <div className="rd-stat-card" key={c.label}>
              <div className="rd-stat-card__icon" style={{ background: c.bg, color: c.color }}>
                {c.icon}
              </div>
              <div>
                <div className="rd-stat-card__value">{c.value}</div>
                <div className="rd-stat-card__label">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rd-actions">
        <Button type="primary" icon={<BookOutlined />} onClick={() => navigate('/library/catalog')}>
          Catalogue
        </Button>
        <Button icon={<ContainerOutlined />} onClick={() => navigate('/library/loans')}>
          Emprunts
        </Button>
        <Button icon={<ReconciliationOutlined />} onClick={() => navigate('/library/requests')}>
          Demandes ({pendingRequests})
        </Button>
        <Button icon={<BarChartOutlined />} onClick={() => navigate('/library/reports')}>
          Rapports
        </Button>
      </div>

      <div className="rd-section">
        <div className="rd-section__header">
          <h3 className="rd-section__title"><ContainerOutlined /> Derniers emprunts</h3>
        </div>
        <div className="rd-section__body">
          <Table
            dataSource={loans}
            columns={loanColumns}
            rowKey="id"
            loading={loansLoading}
            pagination={false}
            size="small"
          />
        </div>
      </div>
    </div>
  );
};

export default LibrarianDashboard;
