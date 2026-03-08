import React, { useState } from 'react';
import {
  Table, Tag, Button, Modal, Form, Input, Select, Upload,
  Switch, Popconfirm, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload';
import {
  FileAddOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SearchOutlined,
  BookOutlined,
  CloudUploadOutlined,
  FilterOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  useContentResources,
  useCreateContent,
  useUpdateContent,
  useDeleteContent,
} from '../../hooks/useApi';
import {
  PageHeader,
  DataCard,
  LoadingSkeleton,
  EmptyState,
} from '../../components/ui';
import type { ContentResource, ContentCategory } from '../../types';
import '../superadmin/SuperAdmin.css';

const { TextArea } = Input;

const CATEGORY_OPTIONS: { value: ContentCategory; label: string; color: string }[] = [
  { value: 'BEP', label: 'BEP', color: 'blue' },
  { value: 'BEM', label: 'BEM', color: 'green' },
  { value: 'BAC', label: 'BAC', color: 'purple' },
  { value: 'TEXTBOOK', label: 'Manuel scolaire', color: 'orange' },
  { value: 'GUIDE', label: 'Guide pédagogique', color: 'cyan' },
  { value: 'OTHER', label: 'Autre', color: 'default' },
];

const LEVEL_OPTIONS = [
  '5AP', '4AM', '3AM', '2AM', '1AM',
  '1AS', '2AS', '3AS',
  'TC_LET', 'TC_SCI',
];

const ContentManagement: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentResource | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const { data: resources, isLoading } = useContentResources(
    filterCategory ? { category: filterCategory } : undefined
  );
  const createMutation = useCreateContent();
  const updateMutation = useUpdateContent();
  const deleteMutation = useDeleteContent();

  const allResources = (
    Array.isArray(resources) ? resources : resources?.results || []
  ) as ContentResource[];

  const filteredResources = searchText
    ? allResources.filter(
        (r) =>
          r.title.toLowerCase().includes(searchText.toLowerCase()) ||
          r.subject.toLowerCase().includes(searchText.toLowerCase())
      )
    : allResources;

  const handleOpenCreate = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (item: ContentResource) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      description: item.description,
      category: item.category,
      subject: item.subject,
      level: item.level,
      year: item.year,
      file_url: item.file_url,
      is_published: item.is_published,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const formData = new FormData();
    Object.entries(values).forEach(([key, val]) => {
      if (key === 'file' && val) {
        const fileList = val as UploadFile[];
        if (fileList.length > 0 && fileList[0].originFileObj) {
          formData.append('file', fileList[0].originFileObj);
        }
      } else if (key === 'is_published') {
        formData.append(key, val ? 'true' : 'false');
      } else if (val !== undefined && val !== null) {
        formData.append(key, String(val));
      }
    });

    if (editingItem) {
      updateMutation.mutate(
        { id: editingItem.id, data: formData },
        { onSuccess: () => setModalOpen(false) }
      );
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setModalOpen(false),
      });
    }
  };

  const columns: ColumnsType<ContentResource> = [
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
          {record.description && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      render: (cat: ContentCategory) => {
        const opt = CATEGORY_OPTIONS.find((o) => o.value === cat);
        return <Tag color={opt?.color || 'default'}>{opt?.label || cat}</Tag>;
      },
      filters: CATEGORY_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (value, record) => record.category === value,
    },
    {
      title: 'Matière',
      dataIndex: 'subject',
      key: 'subject',
      render: (s: string) => s || '—',
    },
    {
      title: 'Niveau',
      dataIndex: 'level',
      key: 'level',
      render: (l: string) => l ? <Tag>{l}</Tag> : '—',
    },
    {
      title: 'Année',
      dataIndex: 'year',
      key: 'year',
      render: (y: string) => y || '—',
    },
    {
      title: 'Statut',
      dataIndex: 'is_published',
      key: 'published',
      render: (pub: boolean) => (
        <Tag color={pub ? 'green' : 'orange'}>
          {pub ? 'Publié' : 'Brouillon'}
        </Tag>
      ),
    },
    {
      title: 'Téléchargements',
      dataIndex: 'download_count',
      key: 'downloads',
      render: (c: number) => (
        <span>
          <DownloadOutlined style={{ marginRight: 4 }} />
          {c}
        </span>
      ),
      sorter: (a, b) => a.download_count - b.download_count,
    },
    {
      title: 'Créé le',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: ContentResource) => (
        <div style={{ display: 'flex', gap: 8 }}>
          {(record.file || record.file_url) && (
            <Tooltip title="Voir">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => {
                  const url = record.file || record.file_url;
                  if (url) window.open(url, '_blank');
                }}
              />
            </Tooltip>
          )}
          <Tooltip title="Modifier">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Supprimer ce contenu ?"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </div>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton variant="table" rows={8} />;

  return (
    <div className="sa-page">
      <PageHeader
        title="Gestion du contenu"
        subtitle="Ressources pédagogiques : sujets d'examens, manuels, guides"
        icon={<BookOutlined />}
        actions={
          <Button
            type="primary"
            icon={<FileAddOutlined />}
            size="large"
            onClick={handleOpenCreate}
          >
            Ajouter une ressource
          </Button>
        }
      />

      {/* Filters */}
      <DataCard>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <Input
            placeholder="Rechercher par titre ou matière..."
            prefix={<SearchOutlined />}
            style={{ maxWidth: 320 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Filtrer par catégorie"
            style={{ minWidth: 200 }}
            allowClear
            value={filterCategory}
            onChange={setFilterCategory}
            options={CATEGORY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            suffixIcon={<FilterOutlined />}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            {filteredResources.length} ressource(s)
          </span>
        </div>
      </DataCard>

      {/* Table */}
      <div style={{ marginTop: 16 }}>
      <DataCard noPadding>
        <Table
          columns={columns}
          dataSource={filteredResources}
          rowKey="id"
          pagination={{ pageSize: 15, showSizeChanger: true }}
          size="small"
          locale={{
            emptyText: (
              <EmptyState
                icon={<BookOutlined />}
                title="Aucune ressource"
                description="Ajoutez des sujets d'examens, manuels ou guides pédagogiques."
              />
            ),
          }}
          className="sa-dark-table"
        />
      </DataCard>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? 'Modifier la ressource' : 'Nouvelle ressource'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        okText={editingItem ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        width={640}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="Titre"
            rules={[{ required: true, message: 'Le titre est requis' }]}
          >
            <Input placeholder="Ex: Sujet BAC 2024 — Mathématiques" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Description optionnelle..." />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="category"
              label="Catégorie"
              rules={[{ required: true, message: 'Sélectionnez une catégorie' }]}
            >
              <Select
                placeholder="Choisir..."
                options={CATEGORY_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </Form.Item>

            <Form.Item name="subject" label="Matière">
              <Input placeholder="Ex: Mathématiques, Physique..." />
            </Form.Item>

            <Form.Item name="level" label="Niveau">
              <Select
                placeholder="Choisir..."
                allowClear
                options={LEVEL_OPTIONS.map((l) => ({ value: l, label: l }))}
              />
            </Form.Item>

            <Form.Item name="year" label="Année">
              <Input placeholder="Ex: 2024" />
            </Form.Item>
          </div>

          <Form.Item
            name="file"
            label="Fichier (PDF, image...)"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<CloudUploadOutlined />}>Choisir un fichier</Button>
            </Upload>
          </Form.Item>

          <Form.Item name="file_url" label="Ou URL externe">
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            name="is_published"
            label="Publié"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Oui" unCheckedChildren="Non" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContentManagement;
