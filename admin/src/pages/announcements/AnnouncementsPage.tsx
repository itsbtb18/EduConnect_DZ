import React, { useState, useMemo, useRef } from 'react';
import { Table, Button, Tag, Modal, Form, Input, Select, Popconfirm, Space, DatePicker, Switch, Statistic, Card, Tooltip, message, Upload } from 'antd';
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
  UploadOutlined,
  PaperClipOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useAnnouncements, useCreateAnnouncement, useDeleteAnnouncement, useUpdateAnnouncement, useClasses, useStudents, useUsers, useUploadAnnouncementAttachment } from '../../hooks/useApi';
import { announcementsAPI } from '../../api/services';
import dayjs from 'dayjs';
import './AnnouncementsPage.css';

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: 'Tous',
  PARENTS: 'Parents',
  STUDENTS: 'Élèves',
  TEACHERS: 'Enseignants',
  SPECIFIC_SECTION: 'Section',
  SPECIFIC_CLASS: 'Classe',
};

const AnnouncementsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Record<string, unknown> | null>(null);
  const [searchText, setSearchText] = useState('');
  const [filterAudience, setFilterAudience] = useState<string>('');
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [attachFiles, setAttachFiles] = useState<File[]>([]);

  const { data, isLoading, refetch } = useAnnouncements({ page, page_size: 20 });
  const createAnnouncement = useCreateAnnouncement();
  const deleteAnnouncement = useDeleteAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  const uploadAttachment = useUploadAnnouncementAttachment();
  const { data: classesData } = useClasses();
  const { data: usersData } = useUsers({ page_size: 200 });

  const classes = (classesData?.results || classesData || []) as { id: string; name: string; section?: string }[];
  const sections = [...new Set(classes.map((c) => c.section).filter(Boolean))] as string[];
  const users = (usersData?.results || []) as { id: string; first_name: string; last_name: string; role: string }[];
  const [audienceType, setAudienceType] = useState<string>('ALL');

  // Derived stats
  const allAnnouncements = (data?.results || []) as Record<string, unknown>[];
  const pinnedCount = useMemo(() => allAnnouncements.filter((a) => a.is_pinned).length, [allAnnouncements]);
  const urgentCount = useMemo(() => allAnnouncements.filter((a) => a.is_urgent).length, [allAnnouncements]);
  const scheduledCount = useMemo(
    () => allAnnouncements.filter((a) => a.publish_at && dayjs(a.publish_at as string).isAfter(dayjs())).length,
    [allAnnouncements],
  );

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const payload: Record<string, unknown> = {
        title: values.title,
        body: values.body,
        target_audience: values.target_audience || 'ALL',
        is_pinned: values.is_pinned || false,
        is_urgent: values.is_urgent || false,
        publish_at: values.publish_at ? values.publish_at.toISOString() : undefined,
      };
      if (values.target_audience === 'SPECIFIC_CLASS') payload.target_class_id = values.target_class_id;
      if (values.target_audience === 'SPECIFIC_SECTION') payload.target_section_id = values.target_section_id;

      let announcementId: string;
      if (editingAnnouncement) {
        await updateAnnouncement.mutateAsync({ id: editingAnnouncement.id as string, data: payload });
        announcementId = editingAnnouncement.id as string;
      } else {
        const result = await createAnnouncement.mutateAsync(payload);
        announcementId = (result as Record<string, unknown>).id as string;
      }

      // Upload image if selected
      if (imageFile && announcementId) {
        const imgData = new FormData();
        imgData.append('image', imageFile);
        await announcementsAPI.uploadImage(announcementId, imgData);
      }

      // Upload file attachments
      for (const file of attachFiles) {
        const fd = new FormData();
        fd.append('file', file);
        await uploadAttachment.mutateAsync({ id: announcementId, data: fd });
      }

      setModalOpen(false);
      setEditingAnnouncement(null);
      setAudienceType('ALL');
      setImageFile(null);
      setAttachFiles([]);
      form.resetFields();
      refetch();
    } catch {
      // validation
    }
  };

  const handleEdit = (record: Record<string, unknown>) => {
    setEditingAnnouncement(record);
    setAudienceType((record.target_audience as string) || 'ALL');
    form.setFieldsValue({
      title: record.title,
      body: record.body,
      target_audience: record.target_audience || 'ALL',
      target_class_id: record.target_class,
      target_section_id: record.target_section,
      is_pinned: record.is_pinned || false,
      is_urgent: record.is_urgent || false,
      publish_at: record.publish_at ? dayjs(record.publish_at as string) : undefined,
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
        r.is_pinned ? <PushpinOutlined style={{ color: '#F59E0B', fontSize: 16 }} /> : null,
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      render: (v: string, r: Record<string, unknown>) => {
        const publishAt = r.publish_at as string | undefined;
        const isScheduled = publishAt && dayjs(publishAt).isAfter(dayjs());
        return (
          <span className="font-semibold">
            {v || '—'}
            {isScheduled && (
              <Tag color="blue" className="ml-2" icon={<ClockCircleOutlined />}>
                Programmée {dayjs(publishAt).format('DD/MM HH:mm')}
              </Tag>
            )}
          </span>
        );
      },
    },
    {
      title: 'Aperçu',
      dataIndex: 'body',
      key: 'body',
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
      dataIndex: 'target_audience',
      key: 'target_audience',
      render: (v: string, r: Record<string, unknown>) => {
        let label = AUDIENCE_LABELS[v] || v || 'Tous';
        if (v === 'SPECIFIC_CLASS') label = `Classe: ${r.target_class_name || r.target_class || ''}`;
        if (v === 'SPECIFIC_SECTION') label = `Section: ${r.target_section || ''}`;
        const color = v === 'SPECIFIC_CLASS' ? 'cyan' : v === 'SPECIFIC_SECTION' ? 'geekblue' : 'blue';
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Vues',
      dataIndex: 'views_count',
      key: 'views_count',
      width: 70,
      render: (v: number) => <span><EyeOutlined style={{ marginRight: 4 }} />{v ?? 0}</span>,
    },
    {
      title: 'Lues',
      dataIndex: 'read_count',
      key: 'read_count',
      width: 70,
      render: (v: number) => <span>{v ?? 0}</span>,
    },
    {
      title: 'Pièces jointes',
      key: 'attachments',
      width: 50,
      render: (_: unknown, r: Record<string, unknown>) => {
        const count = (r.attachments as unknown[] || []).length + (r.image_url ? 1 : 0);
        return count > 0 ? <Tag icon={<PaperClipOutlined />}>{count}</Tag> : null;
      },
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: 'Urgent',
      dataIndex: 'is_urgent',
      key: 'is_urgent',
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
        (a.title || '').toLowerCase().includes(q) || (a.body || '').toLowerCase().includes(q),
      );
    }
    // Filter by audience
    if (filterAudience) {
      list = list.filter((a: any) => a.target_audience === filterAudience);
    }
    // Sort pinned first
    list.sort((a: any, b: any) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
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
          <Select.Option value="ALL">Tous</Select.Option>
          <Select.Option value="PARENTS">Parents</Select.Option>
          <Select.Option value="STUDENTS">Élèves</Select.Option>
          <Select.Option value="TEACHERS">Enseignants</Select.Option>
          <Select.Option value="SPECIFIC_CLASS">Classe</Select.Option>
          <Select.Option value="SPECIFIC_SECTION">Section</Select.Option>
        </Select>
      </div>

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={sortedAnnouncements}
          loading={isLoading}
          rowKey={(r: Record<string, any>) => (r.id as string) || `ann-${r.title}-${r.created_at}`}
          rowClassName={(r: Record<string, any>) => r.is_urgent ? 'announcements__row--urgent' : ''}
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
        onCancel={() => { setModalOpen(false); setEditingAnnouncement(null); setAudienceType('ALL'); setImageFile(null); setAttachFiles([]); }}
        confirmLoading={createAnnouncement.isPending || updateAnnouncement.isPending}
        okText={<span><SendOutlined /> Publier</span>}
        cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Titre" name="title" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Titre de l'annonce" />
          </Form.Item>
          <Form.Item label="Contenu" name="body" rules={[{ required: true, message: 'Requis' }]}>
            <Input.TextArea rows={4} placeholder="Contenu de l'annonce..." showCount maxLength={2000} />
          </Form.Item>

          <div className="announcements__form-grid">
            <Form.Item label="Audience" name="target_audience" initialValue="ALL">
              <Select onChange={(v) => setAudienceType(v)}>
                <Select.Option value="ALL">Tous</Select.Option>
                <Select.Option value="PARENTS">Tous les parents</Select.Option>
                <Select.Option value="STUDENTS">Tous les élèves</Select.Option>
                <Select.Option value="TEACHERS">Tous les enseignants</Select.Option>
                <Select.Option value="SPECIFIC_CLASS">Une classe spécifique</Select.Option>
                <Select.Option value="SPECIFIC_SECTION">Une section</Select.Option>
              </Select>
            </Form.Item>

            {audienceType === 'SPECIFIC_CLASS' && (
              <Form.Item label="Classe cible" name="target_class_id" rules={[{ required: true, message: 'Sélectionnez une classe' }]}>
                <Select
                  showSearch
                  optionFilterProp="label"
                  placeholder="Sélectionner une classe"
                  options={classes.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Form.Item>
            )}

            {audienceType === 'SPECIFIC_SECTION' && (
              <Form.Item label="Section cible" name="target_section_id" rules={[{ required: true, message: 'Sélectionnez une section' }]}>
                <Select placeholder="Sélectionner une section">
                  {sections.length > 0
                    ? sections.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)
                    : classes.map((c) => <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>)
                  }
                </Select>
              </Form.Item>
            )}

            <Form.Item label="Urgence" name="is_urgent" initialValue={false}>
              <Select>
                <Select.Option value={false}>Normal</Select.Option>
                <Select.Option value={true}>Urgent</Select.Option>
              </Select>
            </Form.Item>
          </div>

          {/* Image upload */}
          <Form.Item label="Image d'illustration">
            <Upload
              beforeUpload={(file) => { setImageFile(file); return false; }}
              onRemove={() => setImageFile(null)}
              maxCount={1}
              accept="image/*"
              fileList={imageFile ? [{ uid: '-1', name: imageFile.name, status: 'done' } as any] : []}
            >
              <Button icon={<UploadOutlined />}>Choisir une image</Button>
            </Upload>
          </Form.Item>

          {/* File attachments */}
          <Form.Item label="Pièces jointes">
            <Upload
              beforeUpload={(file) => { setAttachFiles((prev) => [...prev, file]); return false; }}
              onRemove={(file) => setAttachFiles((prev) => prev.filter((f) => f.name !== file.name))}
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              fileList={attachFiles.map((f, i) => ({ uid: String(i), name: f.name, status: 'done' } as any))}
            >
              <Button icon={<PaperClipOutlined />}>Joindre des fichiers</Button>
            </Upload>
          </Form.Item>

          <div className="announcements__form-grid">
            <Form.Item label="Programmer l'envoi" name="publish_at">
              <DatePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                placeholder="Immédiat si vide"
                className="w-full"
                disabledDate={(d) => d.isBefore(dayjs(), 'day')}
              />
            </Form.Item>

            <Form.Item label="Épingler l'annonce" name="is_pinned" valuePropName="checked" initialValue={false}>
              <Switch checkedChildren={<PushpinOutlined />} unCheckedChildren="Non" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AnnouncementsPage;
