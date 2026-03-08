import React, { useState } from 'react';
import {
  Card, Table, Button, Tag, Space, Modal, Form, Select, Input, Tabs, Popconfirm, Spin, Row, Col, Alert,
} from 'antd';
import {
  PlusOutlined, CheckCircleOutlined, ReloadOutlined, WarningOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { useLoans, useCreateLoan, useReturnLoan, useRenewLoan, useBooks, useBookCopies } from '../../hooks/useApi';
import type { Loan, Book, BookCopy } from '../../types';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Actif', color: 'blue' },
  RETURNED: { label: 'Retourné', color: 'green' },
  OVERDUE: { label: 'En retard', color: 'red' },
  LOST: { label: 'Perdu', color: 'volcano' },
};

const LoanManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [loanModal, setLoanModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>();
  const [form] = Form.useForm();

  const { data: loansData, isLoading } = useLoans(activeTab !== 'ALL' ? { status: activeTab } : undefined);
  const loans = (loansData?.results || loansData || []) as Loan[];

  const { data: booksData } = useBooks();
  const allBooks = (booksData?.results || booksData || []) as Book[];
  const availableBooks = allBooks.filter(b => b.available_copies > 0);

  const { data: copiesData } = useBookCopies(selectedBook ? { book: selectedBook, status: 'AVAILABLE' } : undefined);
  const availableCopies = selectedBook ? ((copiesData?.results || copiesData || []) as BookCopy[]) : [];

  const createLoan = useCreateLoan();
  const returnLoan = useReturnLoan();
  const renewLoan = useRenewLoan();

  const handleCreateLoan = async () => {
    const values = await form.validateFields();
    await createLoan.mutateAsync(values);
    setLoanModal(false);
    form.resetFields();
    setSelectedBook(undefined);
  };

  const columns = [
    { title: 'Livre', dataIndex: 'book_title', ellipsis: true },
    { title: 'Emprunteur', dataIndex: 'borrower_name', ellipsis: true },
    { title: 'Code-barres', dataIndex: 'copy_barcode', width: 130, responsive: ['lg'] as ('lg')[] },
    {
      title: 'Date emprunt',
      dataIndex: 'borrowed_date',
      width: 110,
      render: (d: string) => new Date(d).toLocaleDateString('fr-FR'),
    },
    {
      title: 'Date retour prévue',
      dataIndex: 'due_date',
      width: 130,
      render: (d: string, r: Loan) => (
        <Space>
          {new Date(d).toLocaleDateString('fr-FR')}
          {r.is_overdue && <WarningOutlined style={{ color: '#EF4444' }} />}
        </Space>
      ),
    },
    {
      title: 'Retourné le',
      dataIndex: 'returned_date',
      width: 110,
      render: (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '—',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 110,
      render: (s: string) => <Tag color={STATUS_MAP[s]?.color}>{STATUS_MAP[s]?.label || s}</Tag>,
    },
    {
      title: 'Renouvellements',
      dataIndex: 'renewals_count',
      width: 80,
      align: 'center' as const,
      render: (v: number) => `${v}/2`,
    },
    {
      title: 'Actions',
      width: 140,
      render: (_: unknown, r: Loan) => (
        <Space>
          {(r.status === 'ACTIVE' || r.status === 'OVERDUE') && (
            <>
              <Popconfirm title="Confirmer le retour ?" onConfirm={() => returnLoan.mutate(r.id)}>
                <Button type="primary" size="small" icon={<CheckCircleOutlined />}>Retour</Button>
              </Popconfirm>
              {r.renewals_count < 2 && (
                <Popconfirm title="Renouveler pour 14 jours ?" onConfirm={() => renewLoan.mutate(r.id)}>
                  <Button size="small" icon={<ReloadOutlined />}>Renouveler</Button>
                </Popconfirm>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  const overdueCount = loans.filter(l => l.is_overdue).length;

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>📋 Gestion des emprunts</h1>
          <p>Emprunts, retours et renouvellements</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setLoanModal(true)}>
          Nouvel emprunt
        </Button>
      </div>

      {overdueCount > 0 && activeTab === 'ACTIVE' && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`${overdueCount} emprunt(s) en retard nécessite(nt) une attention`}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 16px' }}
          items={[
            { key: 'ACTIVE', label: <><ClockCircleOutlined /> Actifs</> },
            { key: 'OVERDUE', label: <><WarningOutlined /> En retard</> },
            { key: 'RETURNED', label: <><CheckCircleOutlined /> Retournés</> },
            { key: 'ALL', label: 'Tous' },
          ]}
        />
        <Table
          dataSource={loans.map(l => ({ ...l, key: l.id }))}
          columns={columns}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      {/* New Loan Modal */}
      <Modal
        title="Nouvel emprunt"
        open={loanModal}
        onCancel={() => { setLoanModal(false); form.resetFields(); setSelectedBook(undefined); }}
        onOk={handleCreateLoan}
        confirmLoading={createLoan.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="borrower" label="Emprunteur (ID)" rules={[{ required: true, message: "Sélectionnez l'emprunteur" }]}>
            <Input placeholder="ID de l'utilisateur" />
          </Form.Item>

          <Form.Item label="Livre">
            <Select
              showSearch
              placeholder="Sélectionner un livre disponible"
              value={selectedBook}
              onChange={(val) => {
                setSelectedBook(val);
                form.setFieldValue('book_copy', undefined);
              }}
              optionFilterProp="label"
              options={availableBooks.map(b => ({ value: b.id, label: `${b.title} — ${b.author} (${b.available_copies} dispo.)` }))}
            />
          </Form.Item>

          <Form.Item name="book_copy" label="Exemplaire" rules={[{ required: true, message: "Sélectionnez un exemplaire" }]}>
            <Select
              placeholder={selectedBook ? 'Sélectionner un exemplaire' : "Choisissez d'abord un livre"}
              disabled={!selectedBook}
              options={availableCopies.map(c => ({ value: c.id, label: `${c.barcode} — ${c.location || 'N/A'}` }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="due_date" label="Date retour prévue">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LoanManagement;
