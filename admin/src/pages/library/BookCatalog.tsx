import React, { useState } from 'react';
import {
  Card, Table, Button, Input, Select, Tag, Space, Modal, Form, Row, Col,
  Tooltip, Badge, InputNumber, Drawer, Descriptions, List, Popconfirm, Spin, Tabs,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, BookOutlined,
  AppstoreOutlined, UnorderedListOutlined, EyeOutlined, CopyOutlined,
} from '@ant-design/icons';
import {
  useBooks, useCreateBook, useUpdateBook, useDeleteBook,
  useBookCopies, useCreateBookCopy, useUpdateBookCopy, useDeleteBookCopy,
} from '../../hooks/useApi';
import type { Book, BookCopy, BookCategory, BookLanguage, BookCopyCondition, BookCopyStatus } from '../../types';

const CATEGORIES: { value: BookCategory; label: string }[] = [
  { value: 'FICTION', label: 'Fiction' }, { value: 'NON_FICTION', label: 'Non-fiction' },
  { value: 'SCIENCE', label: 'Sciences' }, { value: 'MATHEMATICS', label: 'Mathématiques' },
  { value: 'HISTORY', label: 'Histoire' }, { value: 'GEOGRAPHY', label: 'Géographie' },
  { value: 'LITERATURE', label: 'Littérature' }, { value: 'RELIGION', label: 'Religion' },
  { value: 'ARTS', label: 'Arts' }, { value: 'TECHNOLOGY', label: 'Technologie' },
  { value: 'REFERENCE', label: 'Référence' }, { value: 'PHILOSOPHY', label: 'Philosophie' },
  { value: 'LANGUAGES', label: 'Langues' }, { value: 'SPORTS', label: 'Sports' },
  { value: 'OTHER', label: 'Autre' },
];

const LANGUAGES: { value: BookLanguage; label: string }[] = [
  { value: 'ARABIC', label: 'Arabe' }, { value: 'FRENCH', label: 'Français' },
  { value: 'ENGLISH', label: 'Anglais' }, { value: 'TAMAZIGHT', label: 'Tamazight' },
  { value: 'OTHER', label: 'Autre' },
];

const COPY_CONDITIONS: { value: BookCopyCondition; label: string }[] = [
  { value: 'NEW', label: 'Neuf' }, { value: 'GOOD', label: 'Bon' },
  { value: 'FAIR', label: 'Correct' }, { value: 'POOR', label: 'Usé' },
  { value: 'DAMAGED', label: 'Endommagé' },
];

const COPY_STATUSES: { value: BookCopyStatus; label: string; color: string }[] = [
  { value: 'AVAILABLE', label: 'Disponible', color: 'green' },
  { value: 'BORROWED', label: 'Emprunté', color: 'blue' },
  { value: 'RESERVED', label: 'Réservé', color: 'orange' },
  { value: 'LOST', label: 'Perdu', color: 'red' },
  { value: 'DAMAGED', label: 'Endommagé', color: 'volcano' },
  { value: 'RETIRED', label: 'Retiré', color: 'default' },
];

const categoryLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label || v;
const languageLabel = (v: string) => LANGUAGES.find(l => l.value === v)?.label || v;
const conditionLabel = (v: string) => COPY_CONDITIONS.find(c => c.value === v)?.label || v;
const statusTag = (v: string) => {
  const s = COPY_STATUSES.find(s => s.value === v);
  return <Tag color={s?.color || 'default'}>{s?.label || v}</Tag>;
};

const BookCatalog: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>();
  const [language, setLanguage] = useState<string>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [bookModal, setBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [detailDrawer, setDetailDrawer] = useState<Book | null>(null);
  const [copyModal, setCopyModal] = useState(false);
  const [editingCopy, setEditingCopy] = useState<BookCopy | null>(null);
  const [form] = Form.useForm();
  const [copyForm] = Form.useForm();

  const params: Record<string, unknown> = {};
  if (search) params.q = search;
  if (category) params.category = category;
  if (language) params.language = language;

  const { data: booksData, isLoading } = useBooks(params);
  const books = (booksData?.results || booksData || []) as Book[];

  const { data: copiesData, isLoading: loadingCopies } = useBookCopies(
    detailDrawer ? { book: detailDrawer.id } : undefined,
  );
  const copies = detailDrawer ? ((copiesData?.results || copiesData || []) as BookCopy[]) : [];

  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();
  const createCopy = useCreateBookCopy();
  const updateCopy = useUpdateBookCopy();
  const deleteCopy = useDeleteBookCopy();

  const openBookModal = (book?: Book) => {
    setEditingBook(book || null);
    form.resetFields();
    if (book) form.setFieldsValue(book);
    setBookModal(true);
  };

  const handleBookSubmit = async () => {
    const values = await form.validateFields();
    if (editingBook) {
      await updateBook.mutateAsync({ id: editingBook.id, data: values });
    } else {
      await createBook.mutateAsync(values);
    }
    setBookModal(false);
  };

  const openCopyModal = (copy?: BookCopy) => {
    setEditingCopy(copy || null);
    copyForm.resetFields();
    if (copy) {
      copyForm.setFieldsValue(copy);
    } else if (detailDrawer) {
      copyForm.setFieldsValue({ book: detailDrawer.id });
    }
    setCopyModal(true);
  };

  const handleCopySubmit = async () => {
    const values = await copyForm.validateFields();
    if (editingCopy) {
      await updateCopy.mutateAsync({ id: editingCopy.id, data: values });
    } else {
      await createCopy.mutateAsync(values);
    }
    setCopyModal(false);
  };

  const columns = [
    { title: 'Titre', dataIndex: 'title', sorter: (a: Book, b: Book) => a.title.localeCompare(b.title), ellipsis: true },
    { title: 'Auteur', dataIndex: 'author', ellipsis: true },
    { title: 'ISBN', dataIndex: 'isbn', width: 140, responsive: ['lg'] as ('lg')[] },
    { title: 'Catégorie', dataIndex: 'category', width: 130, render: (v: string) => <Tag>{categoryLabel(v)}</Tag> },
    { title: 'Langue', dataIndex: 'language', width: 100, render: (v: string) => languageLabel(v) },
    {
      title: 'Disponibilité',
      width: 130,
      render: (_: unknown, r: Book) => (
        <Badge
          status={r.available_copies > 0 ? 'success' : 'error'}
          text={`${r.available_copies} / ${r.total_copies}`}
        />
      ),
    },
    {
      title: 'Actions',
      width: 140,
      render: (_: unknown, r: Book) => (
        <Space>
          <Tooltip title="Détails"><Button type="text" icon={<EyeOutlined />} onClick={() => setDetailDrawer(r)} /></Tooltip>
          <Tooltip title="Modifier"><Button type="text" icon={<EditOutlined />} onClick={() => openBookModal(r)} /></Tooltip>
          <Popconfirm title="Supprimer ce livre ?" onConfirm={() => deleteBook.mutate(r.id)}>
            <Tooltip title="Supprimer"><Button type="text" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderGrid = () => (
    <Row gutter={[16, 16]}>
      {books.map(book => (
        <Col xs={12} sm={8} md={6} lg={4} key={book.id}>
          <Card
            hoverable
            onClick={() => setDetailDrawer(book)}
            cover={
              book.cover_image_url
                ? <img alt={book.title} src={book.cover_image_url} style={{ height: 180, objectFit: 'cover' }} />
                : <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f5ff' }}>
                    <BookOutlined style={{ fontSize: 48, color: '#3B82F6' }} />
                  </div>
            }
            styles={{ body: { padding: 12 } }}
          >
            <Card.Meta
              title={<span style={{ fontSize: 13 }}>{book.title}</span>}
              description={
                <>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{book.author}</div>
                  <Badge
                    status={book.available_copies > 0 ? 'success' : 'error'}
                    text={<span style={{ fontSize: 11 }}>{book.available_copies} dispo.</span>}
                  />
                </>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  );

  if (isLoading) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>📖 Catalogue des livres</h1>
          <p>{books.length} livres au catalogue</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openBookModal()}>
          Ajouter un livre
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={8}>
            <Input
              placeholder="Rechercher par titre, auteur, ISBN…"
              prefix={<SearchOutlined />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} md={5}>
            <Select
              placeholder="Catégorie"
              options={CATEGORIES}
              value={category}
              onChange={setCategory}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              placeholder="Langue"
              options={LANGUAGES}
              value={language}
              onChange={setLanguage}
              allowClear
              style={{ width: '100%' }}
            />
          </Col>
          <Col>
            <Space>
              <Tooltip title="Vue grille">
                <Button
                  icon={<AppstoreOutlined />}
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  onClick={() => setViewMode('grid')}
                />
              </Tooltip>
              <Tooltip title="Vue liste">
                <Button
                  icon={<UnorderedListOutlined />}
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  onClick={() => setViewMode('list')}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {viewMode === 'list' ? (
        <Card styles={{ body: { padding: 0 } }}>
          <Table dataSource={books.map(b => ({ ...b, key: b.id }))} columns={columns} pagination={{ pageSize: 20 }} />
        </Card>
      ) : (
        renderGrid()
      )}

      {/* Book Create/Edit Modal */}
      <Modal
        title={editingBook ? 'Modifier le livre' : 'Ajouter un livre'}
        open={bookModal}
        onCancel={() => setBookModal(false)}
        onOk={handleBookSubmit}
        confirmLoading={createBook.isPending || updateBook.isPending}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={16}><Form.Item name="title" label="Titre" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="isbn" label="ISBN"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="author" label="Auteur" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="publisher" label="Éditeur"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="category" label="Catégorie" rules={[{ required: true }]}>
                <Select options={CATEGORIES} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="language" label="Langue" rules={[{ required: true }]}>
                <Select options={LANGUAGES} />
              </Form.Item>
            </Col>
            <Col span={8}><Form.Item name="subject" label="Matière"><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="publication_year" label="Année"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="edition" label="Édition"><Input /></Form.Item></Col>
            <Col span={8}><Form.Item name="page_count" label="Pages"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="cover_image_url" label="URL de couverture"><Input /></Form.Item>
        </Form>
      </Modal>

      {/* Book Detail Drawer with Copies */}
      <Drawer
        title={detailDrawer?.title || 'Détails du livre'}
        open={!!detailDrawer}
        onClose={() => setDetailDrawer(null)}
        width={600}
      >
        {detailDrawer && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Titre" span={2}>{detailDrawer.title}</Descriptions.Item>
              <Descriptions.Item label="Auteur">{detailDrawer.author}</Descriptions.Item>
              <Descriptions.Item label="ISBN">{detailDrawer.isbn || '—'}</Descriptions.Item>
              <Descriptions.Item label="Éditeur">{detailDrawer.publisher || '—'}</Descriptions.Item>
              <Descriptions.Item label="Catégorie">{categoryLabel(detailDrawer.category)}</Descriptions.Item>
              <Descriptions.Item label="Langue">{languageLabel(detailDrawer.language)}</Descriptions.Item>
              <Descriptions.Item label="Matière">{detailDrawer.subject || '—'}</Descriptions.Item>
              <Descriptions.Item label="Année">{detailDrawer.publication_year || '—'}</Descriptions.Item>
              <Descriptions.Item label="Pages">{detailDrawer.page_count || '—'}</Descriptions.Item>
              <Descriptions.Item label="Disponibilité" span={2}>
                <Badge status={detailDrawer.available_copies > 0 ? 'success' : 'error'}
                  text={`${detailDrawer.available_copies} disponible(s) / ${detailDrawer.total_copies} total`}
                />
              </Descriptions.Item>
              {detailDrawer.description && (
                <Descriptions.Item label="Description" span={2}>{detailDrawer.description}</Descriptions.Item>
              )}
            </Descriptions>

            <Tabs
              items={[{
                key: 'copies',
                label: <><CopyOutlined /> Exemplaires ({copies.length})</>,
                children: (
                  <>
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => openCopyModal()} style={{ marginBottom: 12 }}>
                      Ajouter un exemplaire
                    </Button>
                    <List
                      loading={loadingCopies}
                      dataSource={copies}
                      renderItem={(copy: BookCopy) => (
                        <List.Item
                          actions={[
                            <Button key="edit" type="text" icon={<EditOutlined />} onClick={() => openCopyModal(copy)} />,
                            <Popconfirm key="del" title="Supprimer cet exemplaire ?" onConfirm={() => deleteCopy.mutate(copy.id)}>
                              <Button type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            title={<>Code-barres : <strong>{copy.barcode}</strong></>}
                            description={
                              <Space>
                                {statusTag(copy.status)}
                                <Tag>{conditionLabel(copy.condition)}</Tag>
                                {copy.location && <span>📍 {copy.location}</span>}
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </>
                ),
              }]}
            />
          </>
        )}
      </Drawer>

      {/* Copy Create/Edit Modal */}
      <Modal
        title={editingCopy ? "Modifier l'exemplaire" : 'Ajouter un exemplaire'}
        open={copyModal}
        onCancel={() => setCopyModal(false)}
        onOk={handleCopySubmit}
        confirmLoading={createCopy.isPending || updateCopy.isPending}
      >
        <Form form={copyForm} layout="vertical">
          <Form.Item name="book" hidden><Input /></Form.Item>
          <Form.Item name="barcode" label="Code-barres" rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="condition" label="État" rules={[{ required: true }]}>
                <Select options={COPY_CONDITIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Statut" initialValue="AVAILABLE">
                <Select options={COPY_STATUSES.map(s => ({ value: s.value, label: s.label }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="location" label="Emplacement"><Input placeholder="ex: Étagère A3" /></Form.Item>
          <Form.Item name="acquisition_date" label="Date d'acquisition"><Input type="date" /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BookCatalog;
