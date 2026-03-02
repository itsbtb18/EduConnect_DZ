import React, { useState, useMemo } from 'react';
import { Table, Button, Tag, Modal, Form, Input, Select, Popconfirm, Space, DatePicker, Switch, Statistic, Card, Tooltip, message } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  ReloadOutlined,
  NotificationOutlined,
  PushpinOutlined,
  ClockCircleOutlined,
  SendOutlined,
  SearchOutlined,
  TeamOutlined,
  AlertOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useUpdateAnnouncement, useClasses, useStudents, useUsers } from '../../hooks/useApi';
import dayjs from 'dayjs';
import './AnnouncementsPage.css';

const AnnouncementsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Record<string, unknown> | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterAudience, setFilterAudience] = useState<string>('');
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useAnnouncements({ page, page_size: 20 });
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const { data: classesData } = useClasses();
  const { data: usersData } = useUsers({ page_size: 200 });

  const classes = (classesData?.results || classesData || []) as { id: string; name: string; section?: string }[];
  const sections = [...new Set(classes.map((c) => c.section).filter(Boolean))] as string[];
  const users = (usersData?.results || []) as { id: string; first_name: string; last_name: string; role: string }[];
  const [audienceType, setAudienceType] = useState<string>('all');

  // Derived stats
  const allAnnouncements = (data?.results || []) as Record<string, unknown>[];
  const pinnedCount = useMemo(() => allAnnouncements.filter((a) => a.pinned).length, [allAnnouncements]);
  const urgentCount = useMemo(() => allAnnouncements.filter((a) => a.urgent).length, [allAnnouncements]);
  const scheduledCount = useMemo(
    () => allAnnouncements.filter((a) => a.scheduled_at && dayjs(a.scheduled_at as string).isAfter(dayjs())).length,
    [allAnnouncements],
  );

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        scheduled_at: values.scheduled_at ? values.scheduled_at.toISOString() : undefined,
      };
      if (editingAnnouncement) {
        await updateAnnouncement.mutateAsync({ id: editingAnnouncement.id as string, data: payload });
      } else {
        await createAnnouncement.mutateAsync(payload);
      }
      setModalOpen(false);
      setEditingAnnouncement(null);
      setAudienceType('all');
      form.resetFields();
    } catch {
      // validation
    }
  };

  const handleEdit = (record: Record<string, unknown>) => {
    setEditingAnnouncement(record);
    setAudienceType((record.audience as string) || 'all');
    form.setFieldsValue({
      ...record,
      scheduled_at: record.scheduled_at ? dayjs(record.scheduled_at as string) : undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteAnnouncement.mutateAsync(id);
  };

  const columns = [
    {
      title: '',
      key: 'pinned',
      width: 40,
      render: (_: unknown, r: Record<string, unknown>) =>
        r.pinned ? <PushpinOutlined style={{ color: '#F59E0B', fontSize: 16 }} /> : null,
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, r: Record<string, unknown>) => {
        const scheduledAt = r.scheduled_at as string | undefined;
        const isScheduled = scheduledAt && dayjs(scheduledAt).isAfter(dayjs());
        return (
          <span className="font-semibold">
            {v || '—'}
            {isScheduled && (
              <Tag color="blue" className="ml-2" icon={<ClockCircleOutlined />}>
                Programmée {dayjs(scheduledAt).format('DD/MM HH:mm')}
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: 'Aperçu',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 200,
      render: (v: string) => (
        <Tooltip title={v}>
          <span className="text-sub">{v ? (v.length > 60 ? v.slice(0, 60) + '…' : v) : '—'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Audience',
      dataIndex: 'audience',
      key: 'audience',
      render: (v: string, r: Record<string, unknown>) => {
        const label = v === 'all' ? 'Tous' : v === 'parents' ? 'Parents' : v === 'students' ? 'Élèves' : v === 'teachers' ? 'Enseignants' : v === 'class' ? `Classe: ${r.target_class_name || r.target_class || ''}` : v === 'section' ? `Section: ${r.target_section || ''}` : v === 'specific' ? 'Spécifiques' : v || 'Tous';
        const color = v === 'specific' ? 'purple' : v === 'class' ? 'cyan' : v === 'section' ? 'geekblue' : 'blue';
        return <Tag color={color} icon={v === 'specific' ? <TeamOutlined /> : undefined}>{label}</Tag>;
      },
    },
    {
      title: 'Canal',
      dataIndex: 'channel',
      key: 'channel',
      render: (v: string) => {
        if (v === 'sms') return <Tag color="purple">SMS</Tag>;
        if (v === 'both') return <><Tag color="green">App</Tag><Tag color="purple">SMS</Tag></>;
        return <Tag color="green">App</Tag>;
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string, r: Record<string, unknown>) => {
        const d = v || (r.date as string);
        return d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—';
      },
    },
    {
      title: 'Urgent',
      dataIndex: 'urgent',
      key: 'urgent',
      render: (v: boolean) => v ? <Tag color="red">Urgent</Tag> : <Tag>Normal</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space size={4}>
          <Button type="text" icon={<EditOutlined />} size="small" title="Modifier" onClick={() => handleEdit(r)} />
          <Popconfirm title="Supprimer cette annonce ?" onConfirm={() => handleDelete(r.id as string)}>
            <Button type="text" icon={<DeleteOutlined />} size="small" danger title="Supprimer" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Sort: pinned first, then by date; then filter by search & audience
  const sortedAnnouncements = useMemo(() => {
    let list = [...(data?.results || [])];
    // Filter by search text
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((a: any) =>
        (a.title || '').toLowerCase().includes(q) || (a.content || '').toLowerCase().includes(q),
      );
    }
    // Filter by audience
    if (filterAudience) {
      list = list.filter((a: any) => a.audience === filterAudience);
    }
    // Sort pinned first
    list.sort((a: any, b: any) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
    return list;
  }, [data?.results, searchText, filterAudience]);

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><NotificationOutlined /> Annonces</h1>
          <p>{data?.count ?? 0} annonces publiées</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditingAnnouncement(null); form.resetFields(); setAudienceType('all'); setModalOpen(true); }}
          >
            Nouvelle annonce
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="announcements__stats">
        <Card size="small" className="announcements__stat-card">
          <Statistic title="Total" value={data?.count || 0} prefix={<NotificationOutlined />} />
        </Card>
        <Card size="small" className="announcements__stat-card">
          <Statistic title="Épinglées" value={pinnedCount} prefix={<PushpinOutlined />} valueStyle={{ color: '#F59E0B' }} />
        </Card>
        <Card size="small" className="announcements__stat-card">
          <Statistic title="Urgentes" value={urgentCount} prefix={<AlertOutlined />} valueStyle={{ color: '#EF4444' }} />
        </Card>
        <Card size="small" className="announcements__stat-card">
          <Statistic title="Programmées" value={scheduledCount} prefix={<ScheduleOutlined />} valueStyle={{ color: '#3B82F6' }} />
        </Card>
      </div>

      {/* Filters */}
      <div className="announcements__filters">
        <Input
          placeholder="Rechercher une annonce..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ maxWidth: 300 }}
        />
        <Select
          placeholder="Filtrer par audience"
          value={filterAudience || undefined}
          onChange={(v) => setFilterAudience(v || '')}
          allowClear
          style={{ minWidth: 180 }}
        >
          <Select.Option value="all">Tous</Select.Option>
          <Select.Option value="parents">Parents</Select.Option>
          <Select.Option value="students">Élèves</Select.Option>
          <Select.Option value="teachers">Enseignants</Select.Option>
          <Select.Option value="class">Classe</Select.Option>
          <Select.Option value="section">Section</Select.Option>
          <Select.Option value="specific">Spécifiques</Select.Option>
        </Select>
      </div>

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={sortedAnnouncements}
          loading={isLoading}
          rowKey={(r: Record<string, any>) => (r.id as string) || `ann-${r.title}-${r.created_at}`}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.count || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          locale={{ emptyText: 'Aucune annonce' }}
        />
      </div>

      <Modal
        title={editingAnnouncement ? "Modifier l'annonce" : 'Nouvelle annonce'}
        open={modalOpen}
        onOk={handleCreate}
        onCancel={() => { setModalOpen(false); setEditingAnnouncement(null); setAudienceType('all'); }}
        confirmLoading={createAnnouncement.isPending || updateAnnouncement.isPending}
        okText={<span><SendOutlined /> Publier</span>}
        cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Titre" name="title" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Titre de l'annonce" />
          </Form.Item>
          <Form.Item label="Contenu" name="content" rules={[{ required: true, message: 'Requis' }]}>
            <Input.TextArea rows={4} placeholder="Contenu de l'annonce..." showCount maxLength={2000} />
          </Form.Item>

          <div className="announcements__form-grid">
            <Form.Item label="Audience" name="audience" initialValue="all">
              <Select onChange={(v) => setAudienceType(v)}>
                <Select.Option value="all">Tous</Select.Option>
                <Select.Option value="parents">Tous les parents</Select.Option>
                <Select.Option value="students">Tous les élèves</Select.Option>
                <Select.Option value="teachers">Tous les enseignants</Select.Option>
                <Select.Option value="class">Une classe spécifique</Select.Option>
                <Select.Option value="section">Une section</Select.Option>
                <Select.Option value="specific">Personnes spécifiques</Select.Option>
              </Select>
            </Form.Item>

            {audienceType === 'class' && (
              <Form.Item label="Classe cible" name="target_class" rules={[{ required: true, message: 'Sélectionnez une classe' }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Sélectionner une classe"
                  options={classes.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Form.Item>
            )}

            {audienceType === 'section' && (
              <Form.Item label="Section cible" name="target_section" rules={[{ required: true, message: 'Sélectionnez une section' }]}>
                <Select placeholder="Sélectionner une section">
                  {sections.length > 0
                    ? sections.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)
                    : classes.map((c) => <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>)
                  }
                </Select>
              </Form.Item>
            )}

            {audienceType === 'specific' && (
              <Form.Item label="Destinataires" name="target_users" rules={[{ required: true, message: 'Sélectionnez au moins un destinataire' }]}>
                <Select
                  mode="multiple"
                  showSearch
                  optionFilterProp="label"
                  placeholder="Rechercher et sélectionner des personnes..."
                  options={users.map((u) => ({
                    value: u.id,
                    label: `${u.first_name} ${u.last_name} (${u.role === 'parent' ? 'Parent' : u.role === 'student' ? 'Élève' : u.role === 'teacher' ? 'Enseignant' : u.role})`,
                  }))}
                  maxTagCount={5}
                />
              </Form.Item>
            )}

            <Form.Item label="Canal d'envoi" name="channel" initialValue="app">
              <Select>
                <Select.Option value="app">Application uniquement</Select.Option>
                <Select.Option value="sms">SMS uniquement</Select.Option>
                <Select.Option value="both">Application + SMS</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Urgence" name="urgent" initialValue={false}>
              <Select>
                <Select.Option value={false}>Normal</Select.Option>
                <Select.Option value={true}>Urgent</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="announcements__form-grid">
            <Form.Item label="Programmer l'envoi" name="scheduled_at">
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                placeholder="Immédiat si vide"
                className="w-full"
                disabledDate={(d) => d.isBefore(dayjs(), 'day')}
              />
            </Form.Item>

            <Form.Item label="Épingler l'annonce" name="pinned" valuePropName="checked" initialValue={false}>
              <Switch checkedChildren={<PushpinOutlined />} unCheckedChildren="Non" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AnnouncementsPage;
