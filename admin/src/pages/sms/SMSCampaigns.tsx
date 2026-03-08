import React, { useState } from 'react';
import { Table, Tag, Modal, Form, Input, Select, DatePicker, Button, Space, message, Popconfirm, Progress, Descriptions } from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useSMSCampaigns, useSMSCampaign, useCreateSMSCampaign, useDeleteSMSCampaign, useSections, useClasses } from '../../hooks/useApi';
import { PageHeader, EmptyState, LoadingSkeleton } from '../../components/ui';
import type { SMSCampaign, SMSCampaignTarget } from '../../types';

const targetOptions: { value: SMSCampaignTarget; label: string }[] = [
  { value: 'ALL', label: 'Tous les parents' },
  { value: 'SECTION', label: 'Par section' },
  { value: 'CLASS', label: 'Par classe' },
];

const statusColors: Record<string, string> = {
  DRAFT: 'default',
  SCHEDULED: 'blue',
  SENDING: 'processing',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

const SMSCampaigns: React.FC = () => {
  const { data: campaigns, isLoading } = useSMSCampaigns();
  const createMutation = useCreateSMSCampaign();
  const deleteMutation = useDeleteSMSCampaign();
  const { data: sections } = useSections();
  const { data: classes } = useClasses();

  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const targetType = Form.useWatch('target_type', form);

  const { data: detailData } = useSMSCampaign(detailId || '');

  const handleCreate = async () => {
    const values = await form.validateFields();
    const payload: Record<string, unknown> = {
      title: values.title,
      message: values.message,
      target_type: values.target_type,
    };
    if (values.target_type === 'SECTION') payload.target_section = values.target_section;
    if (values.target_type === 'CLASS') payload.target_class = values.target_class;
    if (values.scheduled_at) payload.scheduled_at = values.scheduled_at.toISOString();

    await createMutation.mutateAsync(payload);
    message.success('Campagne créée');
    setCreateOpen(false);
    form.resetFields();
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    message.success('Campagne supprimée');
  };

  const columns = [
    { title: 'Titre', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: 'Cible', dataIndex: 'target_type_display', key: 'target',
      render: (t: string) => <Tag icon={<TeamOutlined />}>{t}</Tag>,
    },
    {
      title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string, r: SMSCampaign) => <Tag color={statusColors[s]}>{r.status_display}</Tag>,
    },
    {
      title: 'Destinataires', dataIndex: 'total_recipients', key: 'recipients',
      render: (v: number) => v.toLocaleString('fr-FR'),
    },
    {
      title: 'Livraison', key: 'delivery',
      render: (_: unknown, r: SMSCampaign) => (
        r.status === 'COMPLETED' || r.status === 'SENDING'
          ? <Progress percent={r.delivery_rate} size="small" />
          : <span style={{ color: '#94A3B8' }}>—</span>
      ),
    },
    {
      title: 'Coût estimé', dataIndex: 'estimated_cost', key: 'cost',
      render: (c: number) => `${c.toLocaleString('fr-FR')} DA`,
    },
    {
      title: 'Planifié', dataIndex: 'scheduled_at', key: 'scheduled',
      render: (d: string | null) => d
        ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
        : <Tag>Immédiat</Tag>,
    },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, record: SMSCampaign) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => setDetailId(record.id)} />
          {(record.status === 'DRAFT' || record.status === 'SCHEDULED') && (
            <Popconfirm title="Annuler cette campagne ?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton variant="table" rows={6} />;

  const detail = detailData as SMSCampaign | undefined;

  return (
    <div className="sa-page">
      <PageHeader
        title="Campagnes SMS"
        subtitle="Envoyez des messages groupés à vos parents d'élèves"
        icon={<SendOutlined />}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setCreateOpen(true); }}>
            Nouvelle campagne
          </Button>
        }
      />

      {(campaigns as SMSCampaign[] | undefined)?.length === 0 ? (
        <EmptyState
          icon={<SendOutlined />}
          title="Aucune campagne"
          description="Créez votre première campagne SMS."
          action={<Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>Créer une campagne</Button>}
        />
      ) : (
        <Table
          dataSource={campaigns as SMSCampaign[]}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}

      {/* Create Modal */}
      <Modal
        title="Nouvelle campagne SMS"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        confirmLoading={createMutation.isPending}
        width={600}
        okText="Lancer la campagne"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Titre de la campagne" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="ex: Réunion parents-professeurs" />
          </Form.Item>

          <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Requis' }]}>
            <Input.TextArea rows={4} placeholder="Le contenu du SMS à envoyer..." showCount maxLength={320} />
          </Form.Item>

          <Form.Item name="target_type" label="Cible" rules={[{ required: true, message: 'Requis' }]}>
            <Select options={targetOptions} placeholder="Sélectionner la cible" />
          </Form.Item>

          {targetType === 'SECTION' && (
            <Form.Item name="target_section" label="Section" rules={[{ required: true, message: 'Requis' }]}>
              <Select
                placeholder="Choisir une section"
                options={((sections as unknown as Array<{ id: string; name: string }>) || []).map(s => ({ value: s.id, label: s.name }))}
              />
            </Form.Item>
          )}

          {targetType === 'CLASS' && (
            <Form.Item name="target_class" label="Classe" rules={[{ required: true, message: 'Requis' }]}>
              <Select
                placeholder="Choisir une classe"
                options={((classes as unknown as Array<{ id: string; name: string }>) || []).map(c => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
          )}

          <Form.Item name="scheduled_at" label={<span><ClockCircleOutlined /> Planifier l'envoi (optionnel)</span>}>
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              placeholder="Laisser vide pour envoi immédiat"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={detail ? `Campagne : ${detail.title}` : 'Détails'}
        open={!!detailId}
        onCancel={() => setDetailId(null)}
        footer={<Button onClick={() => setDetailId(null)}>Fermer</Button>}
        width={700}
      >
        {detail && (
          <>
            <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Statut">
                <Tag color={statusColors[detail.status]}>{detail.status_display}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Cible">{detail.target_type_display}</Descriptions.Item>
              <Descriptions.Item label="Destinataires">{detail.total_recipients}</Descriptions.Item>
              <Descriptions.Item label="Coût estimé">{detail.estimated_cost.toLocaleString('fr-FR')} DA</Descriptions.Item>
              <Descriptions.Item label="Envoyés">{detail.sent_count}</Descriptions.Item>
              <Descriptions.Item label="Livrés">{detail.delivered_count}</Descriptions.Item>
              <Descriptions.Item label="Échoués">{detail.failed_count}</Descriptions.Item>
              <Descriptions.Item label="Taux livraison">
                <Progress percent={detail.delivery_rate} size="small" />
              </Descriptions.Item>
            </Descriptions>

            <div style={{ padding: '12px 16px', background: '#F8FAFC', borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Message</div>
              <div>{detail.message}</div>
            </div>

            {detail.messages && detail.messages.length > 0 && (
              <Table
                dataSource={detail.messages}
                columns={[
                  { title: 'Destinataire', dataIndex: 'recipient_name', key: 'name' },
                  { title: 'Téléphone', dataIndex: 'recipient_phone', key: 'phone' },
                  {
                    title: 'Statut', dataIndex: 'status', key: 'status',
                    render: (s: string) => {
                      const c: Record<string, string> = { PENDING: 'default', SENT: 'blue', DELIVERED: 'green', FAILED: 'red' };
                      return <Tag color={c[s]}>{s}</Tag>;
                    },
                  },
                ]}
                rowKey="id"
                size="small"
                pagination={{ pageSize: 5 }}
              />
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default SMSCampaigns;
