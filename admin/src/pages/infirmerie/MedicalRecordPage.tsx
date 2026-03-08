import React, { useState } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, InputNumber, Tag, Space,
  Tabs, Spin, Popconfirm, Tooltip, Card, Descriptions, Badge, DatePicker,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ReloadOutlined, UserOutlined, MedicineBoxOutlined, EyeOutlined,
} from '@ant-design/icons';
import {
  useMedicalRecords, useMedicalRecord, useCreateMedicalRecord, useUpdateMedicalRecord,
} from '../../hooks/useApi';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN'];
const INSURANCE_TYPES = [
  { value: 'CNAS', label: 'CNAS' },
  { value: 'CASNOS', label: 'CASNOS' },
  { value: 'MUTUELLE', label: 'Mutuelle' },
  { value: 'PRIVATE', label: 'Privée' },
  { value: 'NONE', label: 'Aucune' },
];
const ALLERGY_TYPES = [
  { value: 'FOOD', label: 'Alimentaire' },
  { value: 'DRUG', label: 'Médicamenteuse' },
  { value: 'RESPIRATORY', label: 'Respiratoire' },
  { value: 'SKIN', label: 'Cutanée' },
  { value: 'INSECT', label: 'Insecte' },
  { value: 'OTHER', label: 'Autre' },
];
const ALLERGY_SEVERITY = [
  { value: 'MILD', label: 'Légère', color: 'green' },
  { value: 'MODERATE', label: 'Modérée', color: 'orange' },
  { value: 'SEVERE', label: 'Sévère', color: 'red' },
  { value: 'ANAPHYLACTIC', label: 'Anaphylactique', color: 'magenta' },
];
const HISTORY_TYPES = [
  { value: 'CHRONIC', label: 'Chronique' },
  { value: 'SURGICAL', label: 'Chirurgicale' },
  { value: 'HEREDITARY', label: 'Héréditaire' },
  { value: 'INFECTIOUS', label: 'Infectieuse' },
  { value: 'OTHER', label: 'Autre' },
];
const VACCINATION_STATUS = [
  { value: 'DONE', label: 'Effectué', color: 'green' },
  { value: 'SCHEDULED', label: 'Planifié', color: 'blue' },
  { value: 'NOT_DONE', label: 'Non fait', color: 'default' },
  { value: 'OVERDUE', label: 'En retard', color: 'red' },
];

interface RecordItem {
  id: string;
  student_name?: string;
  student?: { id: string; first_name: string; last_name: string };
  blood_group: string;
  weight?: number;
  height?: number;
  bmi?: number;
  insurance_type?: string;
  allergies?: { id: string; allergy_type: string; allergen: string; severity: string; has_epipen: boolean }[];
  medical_history?: { id: string; history_type: string; condition_name: string; is_ongoing: boolean }[];
  vaccinations?: { id: string; vaccine_name: string; status: string; next_due_date?: string }[];
  medications?: { id: string; dci_name: string; commercial_name: string; is_active: boolean; stock_quantity: number }[];
  disabilities?: { id: string; disability_type: string; autonomy_level: string }[];
  psychological_records?: { id: string; is_restricted: boolean }[];
}

const MedicalRecordPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useMedicalRecords({ page, page_size: 20, search: search || undefined });
  const { data: detailData, isLoading: detailLoading } = useMedicalRecord(detailId || '');
  const createRecord = useCreateMedicalRecord();
  const updateRecord = useUpdateMedicalRecord();

  const results = (data?.results || data || []) as RecordItem[];
  const total = (data as Record<string, unknown>)?.count as number ?? results.length;
  const detail = detailData as RecordItem | undefined;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editId) {
        await updateRecord.mutateAsync({ id: editId, data: values });
      } else {
        await createRecord.mutateAsync(values);
      }
      setModalOpen(false);
      form.resetFields();
      setEditId(null);
    } catch { /* validation */ }
  };

  const openEdit = (record: RecordItem) => {
    setEditId(record.id);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const columns = [
    {
      title: 'Élève',
      key: 'student',
      render: (_: unknown, r: RecordItem) =>
        r.student ? `${r.student.first_name} ${r.student.last_name}` : r.student_name || '—',
    },
    {
      title: 'Groupe sanguin',
      dataIndex: 'blood_group',
      key: 'blood_group',
      render: (v: string) => <Tag color="red">{v}</Tag>,
    },
    {
      title: 'IMC',
      dataIndex: 'bmi',
      key: 'bmi',
      render: (v: number) => v ? v.toFixed(1) : '—',
    },
    {
      title: 'Assurance',
      dataIndex: 'insurance_type',
      key: 'insurance_type',
      render: (v: string) => v || '—',
    },
    {
      title: 'Allergies',
      key: 'allergies',
      render: (_: unknown, r: RecordItem) => {
        const count = r.allergies?.length || 0;
        if (!count) return <Tag>Aucune</Tag>;
        const hasAnaph = r.allergies?.some((a) => a.severity === 'ANAPHYLACTIC');
        return (
          <Badge count={count} size="small" color={hasAnaph ? 'magenta' : 'blue'}>
            <Tag color={hasAnaph ? 'magenta' : 'blue'}>
              {count} allergie{count > 1 ? 's' : ''}
            </Tag>
          </Badge>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, r: RecordItem) => (
        <Space>
          <Tooltip title="Voir le dossier">
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => setDetailId(r.id)} />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1><MedicineBoxOutlined className="page-header__icon" /> Dossiers médicaux</h1>
          <p>{total} dossiers</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditId(null); form.resetFields(); setModalOpen(true); }}
          >
            Nouveau dossier
          </Button>
        </div>
      </div>

      <div className="filter-row">
        <Input
          prefix={<SearchOutlined className="search-icon" />}
          placeholder="Rechercher un élève..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          className="search-input"
        />
      </div>

      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={results}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page, pageSize: 20, total,
            onChange: (p) => setPage(p),
            showTotal: (t) => `${t} dossiers`,
          }}
          locale={{ emptyText: 'Aucun dossier trouvé' }}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        title={editId ? 'Modifier le dossier' : 'Nouveau dossier médical'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditId(null); }}
        confirmLoading={createRecord.isPending || updateRecord.isPending}
        okText={editId ? 'Enregistrer' : 'Créer'}
        cancelText="Annuler"
        width={600}
      >
        <Form form={form} layout="vertical">
          {!editId && (
            <Form.Item label="ID Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
              <Input prefix={<UserOutlined />} placeholder="UUID de l'élève" />
            </Form.Item>
          )}
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Groupe sanguin" name="blood_group" style={{ flex: 1 }}>
              <Select options={BLOOD_GROUPS.map((g) => ({ value: g, label: g }))} placeholder="Sélectionner" />
            </Form.Item>
            <Form.Item label="Poids (kg)" name="weight" style={{ flex: 1 }}>
              <InputNumber min={5} max={200} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Taille (cm)" name="height" style={{ flex: 1 }}>
              <InputNumber min={50} max={250} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item label="Médecin traitant" name="treating_doctor" style={{ flex: 1 }}>
              <Input placeholder="Dr. ..." />
            </Form.Item>
            <Form.Item label="Assurance" name="insurance_type" style={{ flex: 1 }}>
              <Select options={INSURANCE_TYPES} placeholder="Type" allowClear />
            </Form.Item>
          </div>
          <Form.Item label="N° Assurance" name="insurance_number">
            <Input placeholder="Numéro de police" />
          </Form.Item>
          <Form.Item label="Contact d'urgence" name="emergency_contact_name">
            <Input placeholder="Nom" />
          </Form.Item>
          <Form.Item label="Tél d'urgence" name="emergency_contact_phone">
            <Input placeholder="Téléphone" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Drawer / Modal */}
      <Modal
        title="Dossier médical complet"
        open={!!detailId}
        onCancel={() => setDetailId(null)}
        footer={null}
        width={900}
      >
        {detailLoading ? (
          <Spin style={{ display: 'block', margin: '40px auto' }} />
        ) : detail ? (
          <Tabs
            items={[
              {
                key: 'info',
                label: 'Informations',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Groupe sanguin">
                      <Tag color="red">{detail.blood_group}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="IMC">{detail.bmi?.toFixed(1) ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Poids">{detail.weight ? `${detail.weight} kg` : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Taille">{detail.height ? `${detail.height} cm` : '—'}</Descriptions.Item>
                    <Descriptions.Item label="Assurance">{detail.insurance_type || '—'}</Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'history',
                label: `Antécédents (${detail.medical_history?.length || 0})`,
                children: (
                  <Table
                    dataSource={detail.medical_history || []}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: 'Type', dataIndex: 'history_type', render: (v: string) => HISTORY_TYPES.find((h) => h.value === v)?.label || v },
                      { title: 'Condition', dataIndex: 'condition_name' },
                      { title: 'En cours', dataIndex: 'is_ongoing', render: (v: boolean) => v ? <Tag color="red">Oui</Tag> : <Tag color="green">Non</Tag> },
                    ]}
                  />
                ),
              },
              {
                key: 'allergies',
                label: (
                  <Badge count={detail.allergies?.filter((a) => a.severity === 'ANAPHYLACTIC').length || 0} size="small">
                    Allergies ({detail.allergies?.length || 0})
                  </Badge>
                ),
                children: (
                  <Table
                    dataSource={detail.allergies || []}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: 'Type', dataIndex: 'allergy_type', render: (v: string) => ALLERGY_TYPES.find((a) => a.value === v)?.label || v },
                      { title: 'Allergène', dataIndex: 'allergen' },
                      {
                        title: 'Sévérité',
                        dataIndex: 'severity',
                        render: (v: string) => {
                          const s = ALLERGY_SEVERITY.find((a) => a.value === v);
                          return <Tag color={s?.color || 'default'}>{s?.label || v}</Tag>;
                        },
                      },
                      { title: 'EpiPen', dataIndex: 'has_epipen', render: (v: boolean) => v ? <Tag color="blue">Oui</Tag> : '—' },
                    ]}
                  />
                ),
              },
              {
                key: 'medications',
                label: `Médicaments (${detail.medications?.length || 0})`,
                children: (
                  <Table
                    dataSource={detail.medications || []}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: 'DCI', dataIndex: 'dci_name' },
                      { title: 'Commercial', dataIndex: 'commercial_name' },
                      { title: 'Actif', dataIndex: 'is_active', render: (v: boolean) => v ? <Tag color="green">Oui</Tag> : <Tag>Non</Tag> },
                      { title: 'Stock', dataIndex: 'stock_quantity' },
                    ]}
                  />
                ),
              },
              {
                key: 'vaccinations',
                label: `Vaccinations (${detail.vaccinations?.length || 0})`,
                children: (
                  <Table
                    dataSource={detail.vaccinations || []}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: 'Vaccin', dataIndex: 'vaccine_name' },
                      {
                        title: 'Statut',
                        dataIndex: 'status',
                        render: (v: string) => {
                          const s = VACCINATION_STATUS.find((vs) => vs.value === v);
                          return <Tag color={s?.color || 'default'}>{s?.label || v}</Tag>;
                        },
                      },
                      { title: 'Prochaine dose', dataIndex: 'next_due_date', render: (v: string) => v || '—' },
                    ]}
                  />
                ),
              },
              {
                key: 'disabilities',
                label: `Handicaps (${detail.disabilities?.length || 0})`,
                children: (
                  <Table
                    dataSource={detail.disabilities || []}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    columns={[
                      { title: 'Type', dataIndex: 'disability_type' },
                      { title: 'Autonomie', dataIndex: 'autonomy_level' },
                    ]}
                  />
                ),
              },
            ]}
          />
        ) : null}
      </Modal>
    </div>
  );
};

export default MedicalRecordPage;
