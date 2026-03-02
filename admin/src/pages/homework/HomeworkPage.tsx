import React, { useState } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
  Space,
  Empty,
  Tooltip,
  Badge,
} from 'antd';
import {
  BookOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  useHomework,
  useCreateHomework,
  useUpdateHomework,
  useDeleteHomework,
  useClasses,
  useSubjects,
} from '../../hooks/useApi';
import dayjs from 'dayjs';

interface HomeworkRecord {
  id: string;
  title: string;
  description: string;
  due_date: string;
  is_corrected: boolean;
  created_at: string;
  class_obj?: string | { id: string; name: string };
  class_name?: string;
  subject?: string | { id: string; name: string };
  subject_name?: string;
  teacher?: string | { id: string; first_name: string; last_name: string };
  teacher_name?: string;
}

const HomeworkPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HomeworkRecord | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useHomework({ page_size: 50, search });
  const createHW = useCreateHomework();
  const updateHW = useUpdateHomework();
  const deleteHW = useDeleteHomework();
  const { data: classesData } = useClasses();
  const { data: subjectsData } = useSubjects();

  const homework = (data?.results || []) as unknown as HomeworkRecord[];
  const classes = (classesData?.results || classesData || []) as { id: string; name: string }[];
  const subjects = (subjectsData?.results || subjectsData || []) as { id: string; name: string }[];

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record: HomeworkRecord) => {
    setEditing(record);
    const classId = typeof record.class_obj === 'object' ? record.class_obj?.id : record.class_obj;
    const subjectId = typeof record.subject === 'object' ? record.subject?.id : record.subject;
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      class_obj: classId,
      subject: subjectId,
      due_date: record.due_date ? dayjs(record.due_date) : undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      due_date: values.due_date?.toISOString(),
    };
    if (editing) {
      updateHW.mutate({ id: editing.id, ...payload }, { onSuccess: () => setModalOpen(false) });
    } else {
      createHW.mutate(payload, { onSuccess: () => setModalOpen(false) });
    }
  };

  const overdue = homework.filter(
    (h) => !h.is_corrected && new Date(h.due_date) < new Date()
  ).length;
  const corrected = homework.filter((h) => h.is_corrected).length;

  const columns = [
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: HomeworkRecord) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-sub">
            {record.description?.slice(0, 80)}
            {record.description?.length > 80 ? '...' : ''}
          </div>
        </div>
      ),
    },
    {
      title: 'Classe',
      key: 'class',
      render: (_: unknown, record: HomeworkRecord) => {
        const name =
          record.class_name ||
          (typeof record.class_obj === 'object' ? record.class_obj?.name : record.class_obj) ||
          '—';
        return <Tag color="blue">{String(name)}</Tag>;
      },
    },
    {
      title: 'Matière',
      key: 'subject',
      render: (_: unknown, record: HomeworkRecord) => {
        const name =
          record.subject_name ||
          (typeof record.subject === 'object' ? record.subject?.name : record.subject) ||
          '—';
        return <Tag color="purple">{String(name)}</Tag>;
      },
    },
    {
      title: 'Date limite',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (d: string) => {
        if (!d) return '—';
        const date = new Date(d);
        const isOverdue = date < new Date();
        return (
          <span className={isOverdue ? 'color-danger' : ''}>
            <ClockCircleOutlined className="mr-4" />
            {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        );
      },
      sorter: (a: HomeworkRecord, b: HomeworkRecord) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    },
    {
      title: 'Statut',
      dataIndex: 'is_corrected',
      key: 'status',
      render: (corrected: boolean, record: HomeworkRecord) => {
        if (corrected)
          return (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Corrigé
            </Tag>
          );
        const isOverdue = new Date(record.due_date) < new Date();
        return isOverdue ? (
          <Tag color="error">En retard</Tag>
        ) : (
          <Tag color="processing">En cours</Tag>
        );
      },
      filters: [
        { text: 'En cours', value: 'pending' },
        { text: 'Corrigé', value: 'corrected' },
        { text: 'En retard', value: 'overdue' },
      ],
      onFilter: (value: unknown, record: HomeworkRecord) => {
        if (value === 'corrected') return record.is_corrected;
        if (value === 'overdue')
          return !record.is_corrected && new Date(record.due_date) < new Date();
        return !record.is_corrected;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: HomeworkRecord) => (
        <Space>
          <Tooltip title="Modifier">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Supprimer ce devoir ?"
            onConfirm={() => deleteHW.mutate(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>
            <BookOutlined className="mr-10" />
            Devoirs
          </h1>
          <p>Gérez les devoirs assignés aux classes</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Actualiser
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nouveau devoir
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="stat-grid">
        <Card size="small" className="stat-card">
          <div className="stat-value">{homework.length}</div>
          <div className="stat-label">Total devoirs</div>
        </Card>
        <Card size="small" className="stat-card">
          <div className="stat-value color-success">
            {corrected}
          </div>
          <div className="stat-label">Corrigés</div>
        </Card>
        <Card size="small" className="stat-card">
          <div className="stat-value color-warning">
            {homework.length - corrected - overdue}
          </div>
          <div className="stat-label">En cours</div>
        </Card>
        <Card size="small" className="stat-card">
          <div className="stat-value color-danger">
            {overdue}
          </div>
          <div className="stat-label">En retard</div>
        </Card>
      </div>

      {/* Search */}
      <Card className="mb-16">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Rechercher un devoir..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          className="search-input"
        />
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={homework}
          rowKey={(r) => r.id || `${r.title}-${r.due_date}`}
          loading={isLoading}
          pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `${t} devoirs` }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Aucun devoir trouvé"
              />
            ),
          }}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editing ? 'Modifier le devoir' : 'Nouveau devoir'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createHW.isPending || updateHW.isPending}
        okText={editing ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical" className="mt-16">
          <Form.Item name="title" label="Titre" rules={[{ required: true, message: 'Titre requis' }]}>
            <Input placeholder="Ex: Exercices de mathématiques Chapitre 5" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Description requise' }]}
          >
            <Input.TextArea rows={3} placeholder="Instructions détaillées du devoir..." />
          </Form.Item>
          <div className="form-row">
            <Form.Item name="class_obj" label="Classe" rules={[{ required: true, message: 'Classe requise' }]}>
              <Select
                placeholder="Sélectionner une classe"
                showSearch
                optionFilterProp="label"
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
            <Form.Item name="subject" label="Matière" rules={[{ required: true, message: 'Matière requise' }]}>
              <Select
                placeholder="Sélectionner une matière"
                showSearch
                optionFilterProp="label"
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
              />
            </Form.Item>
          </div>
          <Form.Item
            name="due_date"
            label="Date limite"
            rules={[{ required: true, message: 'Date limite requise' }]}
          >
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              className="w-full"
              placeholder="Sélectionner la date et l'heure"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HomeworkPage;
