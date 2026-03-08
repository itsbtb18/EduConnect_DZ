import { useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Upload, Tag, Space,
  Tabs, Row, Col, Popconfirm, message, Tooltip, Badge,
} from 'antd';
import {
  PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, DownloadOutlined, SearchOutlined, LinkOutlined,
  StarOutlined, StarFilled,
} from '@ant-design/icons';
import type { DigitalResource, ElearningResourceType } from '../../types';
import {
  useElearningResources,
  useCreateElearningResource,
  useUpdateElearningResource,
  useDeleteElearningResource,
  useToggleFavouriteResource,
} from '../../hooks/useApi';

const RESOURCE_TYPES: { value: ElearningResourceType; label: string }[] = [
  { value: 'PDF', label: 'PDF' },
  { value: 'VIDEO', label: 'Vidéo' },
  { value: 'COURSE', label: 'Cours' },
  { value: 'SUMMARY', label: 'Résumé' },
  { value: 'EXERCISE', label: 'Exercice' },
  { value: 'OTHER', label: 'Autre' },
];

const SCOPES = [
  { value: 'SCHOOL', label: 'École' },
  { value: 'GLOBAL', label: 'ILMI Global' },
];

export default function ResourceManagement() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DigitalResource | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | undefined>();
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>();
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>();
  const [form] = Form.useForm();

  const queryParams = {
    ...filters,
    ...(search ? { q: search } : {}),
    ...(selectedSection ? { section: selectedSection } : {}),
    ...(selectedLevel ? { level: selectedLevel } : {}),
    ...(selectedSubject ? { subject: selectedSubject } : {}),
  };

  const { data: resources, isLoading } = useElearningResources(queryParams);
  const createMutation = useCreateElearningResource();
  const updateMutation = useUpdateElearningResource();
  const deleteMutation = useDeleteElearningResource();
  const favouriteMutation = useToggleFavouriteResource();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: DigitalResource) => {
    setEditing(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      resource_type: record.resource_type,
      scope: record.scope,
      chapter: record.chapter,
      external_url: record.external_url,
      tags: record.tags,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const fd = new FormData();
    fd.append('title', values.title);
    fd.append('description', values.description || '');
    fd.append('resource_type', values.resource_type);
    fd.append('scope', values.scope || 'SCHOOL');
    if (values.chapter) fd.append('chapter', values.chapter);
    if (values.external_url) fd.append('external_url', values.external_url);
    if (values.section) fd.append('section', values.section);
    if (values.level) fd.append('level', values.level);
    if (values.subject) fd.append('subject', values.subject);
    if (values.tags) fd.append('tags', JSON.stringify(values.tags));
    if (values.file?.fileList?.[0]?.originFileObj) {
      fd.append('file', values.file.fileList[0].originFileObj);
    }

    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: fd });
    } else {
      await createMutation.mutateAsync(fd);
    }
    setModalOpen(false);
    form.resetFields();
  };

  const columns = [
    {
      title: 'Titre', dataIndex: 'title', key: 'title', ellipsis: true,
      render: (t: string, r: DigitalResource) => (
        <Space>
          <Tooltip title={r.is_favourited ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
            <Button
              type="text"
              size="small"
              icon={r.is_favourited ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
              onClick={() => favouriteMutation.mutate(r.id)}
            />
          </Tooltip>
          {t}
        </Space>
      ),
    },
    {
      title: 'Type', dataIndex: 'resource_type', key: 'type', width: 100,
      render: (t: string) => {
        const colors: Record<string, string> = {
          PDF: 'red', VIDEO: 'blue', COURSE: 'green', SUMMARY: 'orange', EXERCISE: 'purple', OTHER: 'default',
        };
        return <Tag color={colors[t] || 'default'}>{RESOURCE_TYPES.find(rt => rt.value === t)?.label ?? t}</Tag>;
      },
    },
    {
      title: 'Matière', dataIndex: 'subject_name', key: 'subject', width: 140,
      render: (v: string) => v || '—',
    },
    { title: 'Chapitre', dataIndex: 'chapter', key: 'chapter', width: 150, ellipsis: true },
    {
      title: 'Niveau', dataIndex: 'level_name', key: 'level', width: 120,
      render: (v: string) => v || '—',
    },
    {
      title: 'Portée', dataIndex: 'scope', key: 'scope', width: 80,
      render: (v: string) => <Tag color={v === 'GLOBAL' ? 'geekblue' : 'green'}>{v}</Tag>,
    },
    {
      title: 'Stats', key: 'stats', width: 120,
      render: (_: unknown, r: DigitalResource) => (
        <Space size="small">
          <Badge count={r.view_count} overflowCount={9999} showZero>
            <EyeOutlined style={{ fontSize: 16 }} />
          </Badge>
          <Badge count={r.download_count} overflowCount={9999} showZero>
            <DownloadOutlined style={{ fontSize: 16 }} />
          </Badge>
        </Space>
      ),
    },
    {
      title: 'Actions', key: 'actions', width: 140,
      render: (_: unknown, r: DigitalResource) => (
        <Space size="small">
          {r.file && (
            <Tooltip title="Ouvrir">
              <Button type="link" size="small" icon={<LinkOutlined />} href={r.file} target="_blank" />
            </Tooltip>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Supprimer cette ressource ?" onConfirm={() => deleteMutation.mutate(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Gestion des ressources numériques</h2>

      {/* Navigation: Section → Niveau → Matière → Chapitre */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={12}>
          <Col xs={24} sm={6}>
            <Input.Search
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onSearch={v => setSearch(v)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={12} sm={4}>
            <Select
              placeholder="Type"
              allowClear
              style={{ width: '100%' }}
              options={RESOURCE_TYPES}
              value={filters.type as string | undefined}
              onChange={v => setFilters(p => ({ ...p, type: v }))}
            />
          </Col>
          <Col xs={12} sm={4}>
            <Input
              placeholder="Section"
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value || undefined)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={4}>
            <Input
              placeholder="Niveau"
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value || undefined)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={4}>
            <Input
              placeholder="Matière"
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value || undefined)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={2}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} block>
              Ajouter
            </Button>
          </Col>
        </Row>
      </Card>

      <Tabs
        items={[
          {
            key: 'all',
            label: `Toutes (${(resources as DigitalResource[] | undefined)?.length ?? 0})`,
            children: (
              <Table
                dataSource={resources as DigitalResource[] | undefined}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 15 }}
                size="small"
                scroll={{ x: 900 }}
              />
            ),
          },
          ...RESOURCE_TYPES.map(rt => ({
            key: rt.value,
            label: rt.label,
            children: (
              <Table
                dataSource={(resources as DigitalResource[] | undefined)?.filter(r => r.resource_type === rt.value)}
                columns={columns}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 15 }}
                size="small"
                scroll={{ x: 900 }}
              />
            ),
          })),
        ]}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editing ? 'Modifier la ressource' : 'Ajouter une ressource'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Titre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="resource_type" label="Type" rules={[{ required: true }]}>
                <Select options={RESOURCE_TYPES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="scope" label="Portée" initialValue="SCHOOL">
                <Select options={SCOPES} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="section" label="Section">
                <Input placeholder="ID section" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="level" label="Niveau">
                <Input placeholder="ID niveau" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="subject" label="Matière">
                <Input placeholder="ID matière" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="chapter" label="Chapitre">
            <Input />
          </Form.Item>
          <Form.Item name="external_url" label="Lien externe (vidéo, etc.)">
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Ajouter des tags" />
          </Form.Item>
          <Form.Item name="file" label="Fichier">
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Sélectionner un fichier</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
