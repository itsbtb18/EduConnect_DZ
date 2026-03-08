import React, { useState } from 'react';
import { Table, Tag, Modal, Form, Input, Select, Switch, Button, Space, message, Popconfirm } from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { useSMSTemplates, useCreateSMSTemplate, useUpdateSMSTemplate, useDeleteSMSTemplate } from '../../hooks/useApi';
import { PageHeader, EmptyState, LoadingSkeleton } from '../../components/ui';
import type { SMSTemplate, SMSTemplateEventType, SMSLanguage } from '../../types';

const eventTypeOptions: { value: SMSTemplateEventType; label: string }[] = [
  { value: 'ABSENCE', label: 'Absence' },
  { value: 'ARRIVAL', label: 'Arrivée' },
  { value: 'LOW_GRADE', label: 'Note basse' },
  { value: 'PAYMENT_REMINDER', label: 'Rappel paiement' },
  { value: 'PAYMENT_OVERDUE', label: 'Retard paiement' },
  { value: 'URGENT_ANNOUNCEMENT', label: 'Annonce urgente' },
  { value: 'EVENT_REMINDER', label: 'Rappel événement' },
  { value: 'WELCOME', label: 'Bienvenue' },
  { value: 'CUSTOM', label: 'Personnalisé' },
];

const languageOptions: { value: SMSLanguage; label: string }[] = [
  { value: 'FR', label: '🇫🇷 Français' },
  { value: 'AR', label: '🇩🇿 Arabe' },
];

const variablesList = [
  '[NOM_ELEVE]', '[PRENOM_ELEVE]', '[CLASSE]', '[DATE]',
  '[HEURE]', '[NOM_ECOLE]', '[MATIERE]', '[NOTE]', '[MONTANT]',
];

const SMSTemplates: React.FC = () => {
  const { data: templates, isLoading } = useSMSTemplates();
  const createMutation = useCreateSMSTemplate();
  const updateMutation = useUpdateSMSTemplate();
  const deleteMutation = useDeleteSMSTemplate();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SMSTemplate | null>(null);
  const [form] = Form.useForm();
  const contentValue = Form.useWatch('content', form) || '';

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ language: 'FR', is_active: true });
    setModalOpen(true);
  };

  const openEdit = (tpl: SMSTemplate) => {
    setEditing(tpl);
    form.setFieldsValue({
      name: tpl.name,
      content: tpl.content,
      language: tpl.language,
      event_type: tpl.event_type,
      is_active: tpl.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...values });
      message.success('Modèle mis à jour');
    } else {
      await createMutation.mutateAsync(values);
      message.success('Modèle créé');
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    message.success('Modèle supprimé');
  };

  const insertVariable = (variable: string) => {
    const current = form.getFieldValue('content') || '';
    form.setFieldsValue({ content: current + variable });
  };

  const columns = [
    { title: 'Nom', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: 'Type', dataIndex: 'event_type_display', key: 'event_type',
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'Langue', dataIndex: 'language', key: 'language',
      render: (l: string) => l === 'AR' ? '🇩🇿 Arabe' : '🇫🇷 Français',
    },
    {
      title: 'Caractères', dataIndex: 'char_count', key: 'char_count',
      render: (c: number) => (
        <span style={{ color: c > 160 ? '#EF4444' : c > 140 ? '#F59E0B' : '#10B981' }}>
          {c} / 160
        </span>
      ),
    },
    {
      title: 'Actif', dataIndex: 'is_active', key: 'is_active',
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? 'Oui' : 'Non'}</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: SMSTemplate) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Supprimer ce modèle ?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton variant="table" rows={6} />;

  return (
    <div className="sa-page">
      <PageHeader
        title="Modèles SMS"
        subtitle="Gérez vos modèles de messages avec variables dynamiques"
        icon={<FileTextOutlined />}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nouveau modèle
          </Button>
        }
      />

      {(templates as SMSTemplate[] | undefined)?.length === 0 ? (
        <EmptyState
          icon={<FileTextOutlined />}
          title="Aucun modèle SMS"
          description="Créez des modèles pour automatiser vos messages."
          action={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Créer un modèle</Button>}
        />
      ) : (
        <Table
          dataSource={templates as SMSTemplate[]}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}

      <Modal
        title={editing ? 'Modifier le modèle' : 'Nouveau modèle SMS'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={640}
        okText={editing ? 'Enregistrer' : 'Créer'}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nom du modèle" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="ex: Notification d'absence" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="event_type" label="Type d'événement" rules={[{ required: true, message: 'Requis' }]}>
              <Select options={eventTypeOptions} placeholder="Sélectionner" />
            </Form.Item>
            <Form.Item name="language" label="Langue" rules={[{ required: true, message: 'Requis' }]}>
              <Select options={languageOptions} />
            </Form.Item>
          </div>

          <Form.Item
            name="content"
            label={
              <span>
                Contenu du message
                <span style={{
                  marginLeft: 8,
                  fontSize: 12,
                  color: contentValue.length > 160 ? '#EF4444' : contentValue.length > 140 ? '#F59E0B' : '#94A3B8',
                }}>
                  {contentValue.length} / 160
                </span>
              </span>
            }
            rules={[{ required: true, message: 'Requis' }]}
          >
            <Input.TextArea rows={4} placeholder="Cher parent, votre enfant [NOM_ELEVE] de [CLASSE]..." />
          </Form.Item>

          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: '#94A3B8', marginRight: 8 }}>
              <TranslationOutlined /> Variables disponibles :
            </span>
            <Space wrap size={4}>
              {variablesList.map((v) => (
                <Tag key={v} color="blue" style={{ cursor: 'pointer' }} onClick={() => insertVariable(v)}>
                  {v}
                </Tag>
              ))}
            </Space>
          </div>

          <Form.Item name="is_active" label="Actif" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SMSTemplates;
