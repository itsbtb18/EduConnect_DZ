import { useState } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Upload, Tag, Space,
  Row, Col, Popconfirm, InputNumber, Tooltip,
} from 'antd';
import {
  PlusOutlined, UploadOutlined, EditOutlined, DeleteOutlined,
  DownloadOutlined, SearchOutlined, FileTextOutlined,
} from '@ant-design/icons';
import type { ExamBankItem, ExamBankType } from '../../types';
import {
  useExamBankItems,
  useCreateExamBankItem,
  useUpdateExamBankItem,
  useDeleteExamBankItem,
} from '../../hooks/useApi';

const EXAM_TYPES: { value: ExamBankType; label: string }[] = [
  { value: 'BEP', label: 'BEP' },
  { value: 'BEM', label: 'BEM' },
  { value: 'BAC', label: 'BAC' },
  { value: 'EXERCISE', label: 'Exercice' },
  { value: 'HOMEWORK', label: 'Devoir' },
  { value: 'MOCK_EXAM', label: 'Examen blanc' },
];

export default function ExamBankPage() {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExamBankItem | null>(null);
  const [form] = Form.useForm();

  const queryParams = { ...filters, ...(search ? { q: search } : {}) };
  const { data: items, isLoading } = useExamBankItems(queryParams);
  const createMutation = useCreateExamBankItem();
  const updateMutation = useUpdateExamBankItem();
  const deleteMutation = useDeleteExamBankItem();

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: ExamBankItem) => {
    setEditing(record);
    form.setFieldsValue({
      title: record.title,
      exam_type: record.exam_type,
      year: record.year,
      description: record.description,
      solution_visible: record.solution_visible,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const fd = new FormData();
    fd.append('title', values.title);
    fd.append('exam_type', values.exam_type);
    if (values.year) fd.append('year', String(values.year));
    if (values.description) fd.append('description', values.description);
    fd.append('solution_visible', String(!!values.solution_visible));
    if (values.level) fd.append('level', values.level);
    if (values.subject) fd.append('subject', values.subject);
    if (values.file?.fileList?.[0]?.originFileObj) {
      fd.append('file', values.file.fileList[0].originFileObj);
    }
    if (values.solution_file?.fileList?.[0]?.originFileObj) {
      fd.append('solution_file', values.solution_file.fileList[0].originFileObj);
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
      render: (t: string) => <><FileTextOutlined style={{ marginRight: 6 }} />{t}</>,
    },
    {
      title: 'Type', dataIndex: 'exam_type', key: 'type', width: 120,
      render: (t: string) => {
        const colors: Record<string, string> = {
          BEP: 'cyan', BEM: 'blue', BAC: 'magenta', EXERCISE: 'green', HOMEWORK: 'orange', MOCK_EXAM: 'purple',
        };
        return <Tag color={colors[t] || 'default'}>{EXAM_TYPES.find(et => et.value === t)?.label ?? t}</Tag>;
      },
      filters: EXAM_TYPES.map(et => ({ text: et.label, value: et.value })),
      onFilter: (v: unknown, r: ExamBankItem) => r.exam_type === v,
    },
    {
      title: 'Matière', dataIndex: 'subject_name', key: 'subject', width: 140,
      render: (v: string) => v || '—',
    },
    {
      title: 'Niveau', dataIndex: 'level_name', key: 'level', width: 120,
      render: (v: string) => v || '—',
    },
    {
      title: 'Année', dataIndex: 'year', key: 'year', width: 80,
      sorter: (a: ExamBankItem, b: ExamBankItem) => (a.year ?? 0) - (b.year ?? 0),
      render: (v: number | null) => v ?? '—',
    },
    {
      title: 'Solution', key: 'solution', width: 90,
      render: (_: unknown, r: ExamBankItem) =>
        r.solution_file ? (
          <Tag color={r.solution_visible ? 'green' : 'orange'}>
            {r.solution_visible ? 'Visible' : 'Après tentative'}
          </Tag>
        ) : <Tag>Non</Tag>,
    },
    {
      title: 'Télécharg.', dataIndex: 'download_count', key: 'downloads', width: 100,
      render: (v: number) => <><DownloadOutlined /> {v}</>,
    },
    {
      title: 'Actions', key: 'actions', width: 150,
      render: (_: unknown, r: ExamBankItem) => (
        <Space size="small">
          <Tooltip title="Télécharger">
            <Button type="link" size="small" icon={<DownloadOutlined />} href={r.file} target="_blank" />
          </Tooltip>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="Supprimer cet examen ?" onConfirm={() => deleteMutation.mutate(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Banque d'examens</h2>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={12} align="middle">
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
              options={EXAM_TYPES}
              onChange={v => setFilters(p => ({ ...p, type: v }))}
            />
          </Col>
          <Col xs={12} sm={4}>
            <InputNumber
              placeholder="Année"
              style={{ width: '100%' }}
              min={2000}
              max={2030}
              onChange={v => setFilters(p => ({ ...p, year: v ?? undefined }))}
            />
          </Col>
          <Col xs={12} sm={4}>
            <Input
              placeholder="Matière (ID)"
              allowClear
              onChange={e => setFilters(p => ({ ...p, subject: e.target.value || undefined }))}
            />
          </Col>
          <Col xs={12} sm={4}>
            <Input
              placeholder="Niveau (ID)"
              allowClear
              onChange={e => setFilters(p => ({ ...p, level: e.target.value || undefined }))}
            />
          </Col>
          <Col xs={24} sm={2}>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} block>
              Ajouter
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={items as ExamBankItem[] | undefined}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
        size="small"
        scroll={{ x: 900 }}
      />

      <Modal
        title={editing ? "Modifier l'examen" : 'Ajouter un examen'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Titre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="exam_type" label="Type" rules={[{ required: true }]}>
                <Select options={EXAM_TYPES} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="year" label="Année">
                <InputNumber style={{ width: '100%' }} min={2000} max={2030} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="solution_visible" label="Solution visible">
                <Select
                  options={[
                    { value: true, label: 'Oui, directement' },
                    { value: false, label: 'Après tentative' },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="level" label="Niveau">
                <Input placeholder="ID niveau" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="subject" label="Matière">
                <Input placeholder="ID matière" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="file"
            label="Fichier PDF"
            rules={editing ? [] : [{ required: true, message: 'Fichier requis' }]}
          >
            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
              <Button icon={<UploadOutlined />}>Sélectionner le PDF</Button>
            </Upload>
          </Form.Item>
          <Form.Item name="solution_file" label="Solution (corrigé)">
            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf">
              <Button icon={<UploadOutlined />}>Sélectionner le corrigé</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
