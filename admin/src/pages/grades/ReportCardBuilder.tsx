import React, { useState } from 'react';
import {
  Card, Button, Table, Modal, Form, Input, Switch, ColorPicker, Space, Tag,
  Select, Progress, Tabs, Popconfirm, message, Empty, Spin, Divider, InputNumber,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, DownloadOutlined,
  FileExcelOutlined, StarOutlined, StarFilled, ReloadOutlined,
} from '@ant-design/icons';
import type { Color } from 'antd/es/color-picker';
import {
  useReportCardTemplates, useCreateReportCardTemplate, useUpdateReportCardTemplate,
  useDeleteReportCardTemplate, useGenerateClassReportCards, useGenerateSchoolReportCards,
  useReportCardProgress, useMENExport, useClasses, useAcademicYears,
} from '../../hooks/useApi';

interface TemplateSignature { title: string; name: string }
interface TemplateSection { key: string; label: string; visible: boolean; order: number }

const DEFAULT_SECTIONS: TemplateSection[] = [
  { key: 'header', label: 'En-tête', visible: true, order: 0 },
  { key: 'grades', label: 'Notes', visible: true, order: 1 },
  { key: 'averages', label: 'Moyennes', visible: true, order: 2 },
  { key: 'attendance', label: 'Assiduité', visible: true, order: 3 },
  { key: 'observations', label: 'Observations', visible: true, order: 4 },
  { key: 'signatures', label: 'Signatures', visible: true, order: 5 },
];

const DEFAULT_SIGNATURES: TemplateSignature[] = [
  { title: 'Le Directeur', name: '' },
  { title: "L'Enseignant Principal", name: '' },
  { title: 'Le Parent', name: '' },
];

const ReportCardBuilder: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generateModal, setGenerateModal] = useState<'class' | 'school' | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [genForm] = Form.useForm();

  const { data: templates, isLoading } = useReportCardTemplates();
  const { data: classData } = useClasses({ page_size: 200 });
  const { data: yearData } = useAcademicYears();
  const createTemplate = useCreateReportCardTemplate();
  const updateTemplate = useUpdateReportCardTemplate();
  const deleteTemplate = useDeleteReportCardTemplate();
  const generateClass = useGenerateClassReportCards();
  const generateSchool = useGenerateSchoolReportCards();
  const menExport = useMENExport();
  const { data: progress } = useReportCardProgress(taskId);

  const templateList = Array.isArray(templates) ? templates : templates?.results || [];
  const classes = classData?.results || [];
  const years = Array.isArray(yearData) ? yearData : yearData?.results || [];

  const openCreate = () => {
    setEditingId(null);
    form.resetFields();
    form.setFieldsValue({
      primary_color: '#1a5276',
      secondary_color: '#2ecc71',
      show_coefficient: true,
      show_ranking: true,
      show_class_average: true,
      show_appreciation: true,
      show_attendance: true,
      show_min_max: false,
      is_default: false,
      signatures: DEFAULT_SIGNATURES,
      sections_config: DEFAULT_SECTIONS,
    });
    setModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (record: any) => {
    setEditingId(record.id);
    form.setFieldsValue({
      ...record,
      primary_color: record.primary_color || '#1a5276',
      secondary_color: record.secondary_color || '#2ecc71',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      primary_color: typeof values.primary_color === 'string' ? values.primary_color : (values.primary_color as Color)?.toHexString?.() || '#1a5276',
      secondary_color: typeof values.secondary_color === 'string' ? values.secondary_color : (values.secondary_color as Color)?.toHexString?.() || '#2ecc71',
    };
    if (editingId) {
      await updateTemplate.mutateAsync({ id: editingId, data: payload });
    } else {
      await createTemplate.mutateAsync(payload);
    }
    setModalOpen(false);
  };

  const handleGenerate = async () => {
    const values = await genForm.validateFields();
    const mutate = generateModal === 'school' ? generateSchool : generateClass;
    const res = await mutate.mutateAsync(values);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tid = (res as any)?.data?.task_id;
    if (tid) {
      setTaskId(tid);
      message.info('Génération en cours… Suivez la progression ci-dessous.');
    }
    setGenerateModal(null);
  };

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (v: string, r: any) => (
        <Space>
          {r.is_default ? <StarFilled style={{ color: '#fadb14' }} /> : <StarOutlined style={{ color: '#d9d9d9' }} />}
          <span style={{ fontWeight: 600 }}>{v}</span>
        </Space>
      ),
    },
    {
      title: 'Couleurs',
      key: 'colors',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: unknown, r: any) => (
        <Space>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: r.primary_color || '#1a5276' }} />
          <div style={{ width: 20, height: 20, borderRadius: 4, background: r.secondary_color || '#2ecc71' }} />
        </Space>
      ),
    },
    {
      title: 'Options',
      key: 'options',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: unknown, r: any) => (
        <Space wrap>
          {r.show_coefficient && <Tag color="blue">Coefficient</Tag>}
          {r.show_ranking && <Tag color="green">Classement</Tag>}
          {r.show_class_average && <Tag color="cyan">Moy. classe</Tag>}
          {r.show_min_max && <Tag color="purple">Min/Max</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: unknown, r: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          <Popconfirm title="Supprimer ce modèle ?" onConfirm={() => deleteTemplate.mutate(r.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><PrinterOutlined /> Bulletins & Modèles</h1>
          <p>Personnalisez vos modèles de bulletins et lancez la génération</p>
        </div>
        <Space>
          <Button icon={<FileExcelOutlined />} onClick={() => menExport.mutate({ academic_year_id: years[0]?.id })} loading={menExport.isPending}>
            Export MEN
          </Button>
          <Button icon={<PrinterOutlined />} onClick={() => { genForm.resetFields(); setGenerateModal('class'); }}>
            Générer par classe
          </Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={() => { genForm.resetFields(); setGenerateModal('school'); }}>
            Générer toute l&apos;école
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nouveau modèle
          </Button>
        </Space>
      </div>

      {/* Progress bar */}
      {taskId && progress && (
        <Card style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <strong>Génération en cours</strong>
              {progress.current_class && <Tag color="blue">{progress.current_class}</Tag>}
              {progress.status === 'completed' && <Tag color="green">Terminé !</Tag>}
              {progress.status === 'failed' && <Tag color="red">Échoué</Tag>}
            </Space>
            <Progress
              percent={progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}
              status={progress.status === 'failed' ? 'exception' : progress.status === 'completed' ? 'success' : 'active'}
            />
            {progress.status === 'completed' && progress.zip_url && (
              <Button type="primary" icon={<DownloadOutlined />} href={progress.zip_url} target="_blank">
                Télécharger le ZIP
              </Button>
            )}
            {(progress.status === 'completed' || progress.status === 'failed') && (
              <Button icon={<ReloadOutlined />} onClick={() => setTaskId(null)} size="small">Fermer</Button>
            )}
          </Space>
        </Card>
      )}

      {/* Templates table */}
      <Card>
        {isLoading ? <Spin /> : (
          <Table
            dataSource={templateList}
            columns={columns}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: <Empty description="Aucun modèle de bulletin" /> }}
          />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={createTemplate.isPending || updateTemplate.isPending}
        title={editingId ? 'Modifier le modèle' : 'Nouveau modèle de bulletin'}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Tabs items={[
            {
              key: 'general',
              label: 'Général',
              children: (
                <>
                  <Form.Item name="name" label="Nom du modèle" rules={[{ required: true, message: 'Requis' }]}>
                    <Input placeholder="Ex: Bulletin officiel 2024" />
                  </Form.Item>
                  <Form.Item name="is_default" label="Modèle par défaut" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Space size="large">
                    <Form.Item name="primary_color" label="Couleur principale">
                      <ColorPicker />
                    </Form.Item>
                    <Form.Item name="secondary_color" label="Couleur secondaire">
                      <ColorPicker />
                    </Form.Item>
                  </Space>
                  <Form.Item name="logo_url" label="URL du logo">
                    <Input placeholder="https://..." />
                  </Form.Item>
                  <Form.Item name="header_text" label="Texte d'en-tête">
                    <Input.TextArea rows={2} placeholder="Ex: République Algérienne Démocratique et Populaire" />
                  </Form.Item>
                  <Form.Item name="footer_text" label="Texte de pied de page">
                    <Input.TextArea rows={2} placeholder="Ex: Ce bulletin est un document officiel..." />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'display',
              label: 'Affichage',
              children: (
                <>
                  <Form.Item name="show_coefficient" label="Afficher les coefficients" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="show_ranking" label="Afficher le classement" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="show_class_average" label="Afficher la moyenne de classe" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="show_appreciation" label="Afficher les appréciations" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="show_attendance" label="Afficher l'assiduité" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item name="show_min_max" label="Afficher Min/Max" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'signatures',
              label: 'Signatures',
              children: (
                <Form.List name="signatures">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                          <Form.Item {...restField} name={[name, 'title']} rules={[{ required: true }]}>
                            <Input placeholder="Titre (ex: Le Directeur)" style={{ width: 200 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'name']}>
                            <Input placeholder="Nom (optionnel)" style={{ width: 200 }} />
                          </Form.Item>
                          <Button icon={<DeleteOutlined />} onClick={() => remove(name)} danger size="small" />
                        </Space>
                      ))}
                      <Button type="dashed" onClick={() => add({ title: '', name: '' })} icon={<PlusOutlined />}>
                        Ajouter une signature
                      </Button>
                    </>
                  )}
                </Form.List>
              ),
            },
            {
              key: 'sections',
              label: 'Sections',
              children: (
                <Form.List name="sections_config">
                  {(fields) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                          <Form.Item {...restField} name={[name, 'label']}>
                            <Input style={{ width: 180 }} />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'visible']} valuePropName="checked">
                            <Switch checkedChildren="Visible" unCheckedChildren="Masqué" />
                          </Form.Item>
                          <Form.Item {...restField} name={[name, 'order']}>
                            <InputNumber min={0} style={{ width: 70 }} placeholder="Ordre" />
                          </Form.Item>
                        </Space>
                      ))}
                    </>
                  )}
                </Form.List>
              ),
            },
          ]} />
        </Form>
      </Modal>

      {/* Generate Modal */}
      <Modal
        open={!!generateModal}
        onCancel={() => setGenerateModal(null)}
        onOk={handleGenerate}
        confirmLoading={generateClass.isPending || generateSchool.isPending}
        title={generateModal === 'school' ? 'Générer les bulletins — École entière' : 'Générer les bulletins — Classe'}
        destroyOnClose
      >
        <Form form={genForm} layout="vertical">
          <Form.Item name="academic_year_id" label="Année scolaire" rules={[{ required: true }]}>
            <Select placeholder="Sélectionnez">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {years.map((y: any) => (
                <Select.Option key={y.id} value={y.id}>{y.name || y.label || `${y.start_date} — ${y.end_date}`}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="trimester" label="Trimestre" rules={[{ required: true }]}>
            <Select placeholder="Sélectionnez">
              <Select.Option value={1}>Trimestre 1</Select.Option>
              <Select.Option value={2}>Trimestre 2</Select.Option>
              <Select.Option value={3}>Trimestre 3</Select.Option>
            </Select>
          </Form.Item>
          {generateModal === 'class' && (
            <Form.Item name="class_id" label="Classe" rules={[{ required: true }]}>
              <Select placeholder="Sélectionnez" showSearch optionFilterProp="children">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {classes.map((c: any) => (
                  <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="template_id" label="Modèle (optionnel)">
            <Select placeholder="Modèle par défaut" allowClear>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {templateList.map((t: any) => (
                <Select.Option key={t.id} value={t.id}>{t.name}{t.is_default ? ' ⭐' : ''}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Divider />
          <Form.Item name="send_to_parents" label="Envoyer aux parents après génération" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportCardBuilder;
