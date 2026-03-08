import React, { useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Spin, Button, Modal, Form,
  Input, Select, DatePicker, Space, Tabs, Upload, Popconfirm, message,
} from 'antd';
import {
  TeamOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
  UserOutlined, FileTextOutlined,
} from '@ant-design/icons';
import {
  useStaffMembers, useCreateStaffMember, useUpdateStaffMember, useDeleteStaffMember,
  useStaffAttendance, useCreateStaffAttendance,
  useStaffLeaves, useCreateStaffLeave, useApproveStaffLeave, useRejectStaffLeave,
  useStaffDocuments, useUploadStaffDocument, useDeleteStaffDocument,
  useStaffStats,
} from '../../hooks/useApi';
import type {
  StaffMember, StaffAttendanceRecord, StaffLeave, StaffDocument, StaffStats,
} from '../../types';
import dayjs from 'dayjs';

const POSITION_OPTIONS = [
  { value: 'SECRETARY', label: 'Secrétaire' },
  { value: 'ACCOUNTANT', label: 'Comptable' },
  { value: 'LIBRARIAN', label: 'Bibliothécaire' },
  { value: 'SUPERVISOR', label: 'Surveillant(e)' },
  { value: 'COUNSELOR', label: 'Conseiller(ère)' },
  { value: 'NURSE', label: 'Infirmier(ère)' },
  { value: 'JANITOR', label: "Agent d'entretien" },
  { value: 'SECURITY', label: 'Agent de sécurité' },
  { value: 'IT_ADMIN', label: 'Responsable informatique' },
  { value: 'DRIVER', label: 'Chauffeur' },
  { value: 'COOK', label: 'Cuisinier(ère)' },
  { value: 'DIRECTOR', label: 'Directeur(trice)' },
  { value: 'VICE_DIRECTOR', label: 'Sous-directeur(trice)' },
  { value: 'OTHER', label: 'Autre' },
];

const CONTRACT_OPTIONS = [
  { value: 'CDI', label: 'CDI' },
  { value: 'CDD', label: 'CDD' },
  { value: 'VACATAIRE', label: 'Vacataire' },
  { value: 'STAGIAIRE', label: 'Stagiaire' },
];

const LEAVE_TYPE_OPTIONS = [
  { value: 'ANNUAL', label: 'Congé annuel' },
  { value: 'SICK', label: 'Congé maladie' },
  { value: 'MATERNITY', label: 'Congé maternité' },
  { value: 'UNPAID', label: 'Sans solde' },
  { value: 'PERSONAL', label: 'Personnel' },
  { value: 'OTHER', label: 'Autre' },
];

const LEAVE_STATUS_COLORS: Record<string, string> = { PENDING: 'orange', APPROVED: 'green', REJECTED: 'red' };
const ATT_STATUS_COLORS: Record<string, string> = { PRESENT: 'green', ABSENT: 'red', LATE: 'orange', ON_LEAVE: 'blue' };

const StaffManagement: React.FC = () => {
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [form] = Form.useForm();
  const [attendanceForm] = Form.useForm();
  const [leaveForm] = Form.useForm();

  const { data: statsData, isLoading: loadingStats } = useStaffStats();
  const { data: membersData, isLoading: loadingMembers } = useStaffMembers(filters);
  const { data: leavesData } = useStaffLeaves({ status: 'PENDING' });
  const { data: docsData } = useStaffDocuments(selectedStaff ? { staff_id: selectedStaff.id } : undefined);
  const { data: attData } = useStaffAttendance(selectedStaff ? { staff_id: selectedStaff.id } : undefined);

  const createMember = useCreateStaffMember();
  const updateMember = useUpdateStaffMember();
  const deleteMember = useDeleteStaffMember();
  const createAttendance = useCreateStaffAttendance();
  const createLeave = useCreateStaffLeave();
  const approveLeave = useApproveStaffLeave();
  const rejectLeave = useRejectStaffLeave();
  const uploadDoc = useUploadStaffDocument();
  const deleteDoc = useDeleteStaffDocument();

  const stats = statsData as StaffStats | undefined;
  const members = (Array.isArray(membersData) ? membersData : membersData?.results || []) as StaffMember[];
  const pendingLeaves = (Array.isArray(leavesData) ? leavesData : leavesData?.results || []) as StaffLeave[];
  const documents = (Array.isArray(docsData) ? docsData : docsData?.results || []) as StaffDocument[];
  const attendance = (Array.isArray(attData) ? attData : attData?.results || []) as StaffAttendanceRecord[];

  const handleCreateMember = async (values: Record<string, unknown>) => {
    const payload = {
      ...values,
      hire_date: (values.hire_date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
      contract_end_date: (values.contract_end_date as dayjs.Dayjs)?.format('YYYY-MM-DD') || null,
    };
    await createMember.mutateAsync(payload);
    setShowCreate(false);
    form.resetFields();
  };

  const handleUpdateMember = async (values: Record<string, unknown>) => {
    if (!editingMember) return;
    const payload = {
      ...values,
      hire_date: (values.hire_date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
      contract_end_date: (values.contract_end_date as dayjs.Dayjs)?.format('YYYY-MM-DD') || null,
    };
    await updateMember.mutateAsync({ id: editingMember.id, data: payload });
    setEditingMember(null);
    form.resetFields();
  };

  const handleAttendance = async (values: Record<string, unknown>) => {
    if (!selectedStaff) return;
    const payload = {
      staff: selectedStaff.id,
      date: (values.date as dayjs.Dayjs)?.format('YYYY-MM-DD'),
      status: values.status,
      clock_in: (values.clock_in as dayjs.Dayjs)?.format('HH:mm') || null,
      clock_out: (values.clock_out as dayjs.Dayjs)?.format('HH:mm') || null,
      notes: values.notes || '',
    };
    await createAttendance.mutateAsync(payload);
    setShowAttendance(false);
    attendanceForm.resetFields();
  };

  const handleLeave = async (values: Record<string, unknown>) => {
    if (!selectedStaff) return;
    const dates = values.dates as [dayjs.Dayjs, dayjs.Dayjs];
    const payload = {
      staff: selectedStaff.id,
      leave_type: values.leave_type,
      start_date: dates[0].format('YYYY-MM-DD'),
      end_date: dates[1].format('YYYY-MM-DD'),
      reason: values.reason || '',
    };
    await createLeave.mutateAsync(payload);
    setShowLeaveForm(false);
    leaveForm.resetFields();
  };

  const handleDocUpload = async (file: File) => {
    if (!selectedStaff) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('staff', selectedStaff.id);
    fd.append('title', file.name);
    fd.append('doc_type', 'OTHER');
    await uploadDoc.mutateAsync(fd);
    setShowDocUpload(false);
  };

  if (loadingStats || loadingMembers) {
    return <div className="page" style={{ display: 'flex', justifyContent: 'center', paddingTop: 100 }}><Spin size="large" /></div>;
  }

  const memberColumns = [
    {
      title: 'Nom', key: 'name',
      render: (_: unknown, r: StaffMember) => (
        <Space>
          <UserOutlined />
          <a onClick={() => setSelectedStaff(r)}>{r.full_name}</a>
        </Space>
      ),
    },
    { title: 'Poste', dataIndex: 'position_label', key: 'position' },
    { title: 'Contrat', dataIndex: 'contract_label', key: 'contract' },
    { title: 'Téléphone', dataIndex: 'phone_number', key: 'phone' },
    {
      title: 'Statut', key: 'status',
      render: (_: unknown, r: StaffMember) => r.is_active
        ? <Tag color="green">Actif</Tag>
        : <Tag color="red">Inactif</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, r: StaffMember) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => { setEditingMember(r); form.setFieldsValue({ ...r, hire_date: r.hire_date ? dayjs(r.hire_date) : null, contract_end_date: r.contract_end_date ? dayjs(r.contract_end_date) : null }); }} />
          <Popconfirm title="Supprimer ce personnel ?" onConfirm={() => deleteMember.mutate(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const leaveColumns = [
    { title: 'Personnel', dataIndex: 'staff_name', key: 'staff_name' },
    { title: 'Type', dataIndex: 'leave_type_label', key: 'type' },
    { title: 'Début', dataIndex: 'start_date', key: 'start' },
    { title: 'Fin', dataIndex: 'end_date', key: 'end' },
    { title: 'Jours', dataIndex: 'days', key: 'days' },
    {
      title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string, r: StaffLeave) => <Tag color={LEAVE_STATUS_COLORS[s]}>{r.status_label}</Tag>,
    },
    {
      title: 'Actions', key: 'actions', width: 160,
      render: (_: unknown, r: StaffLeave) => r.status === 'PENDING' ? (
        <Space>
          <Button size="small" type="primary" onClick={() => approveLeave.mutate(r.id)}>Approuver</Button>
          <Button size="small" danger onClick={() => rejectLeave.mutate(r.id)}>Rejeter</Button>
        </Space>
      ) : null,
    },
  ];

  const attColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date' },
    {
      title: 'Statut', dataIndex: 'status', key: 'status',
      render: (s: string, r: StaffAttendanceRecord) => <Tag color={ATT_STATUS_COLORS[s]}>{r.status_label}</Tag>,
    },
    { title: 'Entrée', dataIndex: 'clock_in', key: 'clock_in', render: (v: string | null) => v || '—' },
    { title: 'Sortie', dataIndex: 'clock_out', key: 'clock_out', render: (v: string | null) => v || '—' },
    { title: 'Heures', dataIndex: 'hours_worked', key: 'hours', render: (v: number) => `${v}h` },
    { title: 'Source', dataIndex: 'source', key: 'source' },
  ];

  const docColumns = [
    { title: 'Titre', dataIndex: 'title', key: 'title' },
    { title: 'Type', dataIndex: 'doc_type_label', key: 'type' },
    { title: 'Date', dataIndex: 'uploaded_at', key: 'date', render: (v: string) => v?.slice(0, 10) },
    {
      title: 'Actions', key: 'actions', width: 120,
      render: (_: unknown, r: StaffDocument) => (
        <Space>
          <Button type="link" href={r.file} target="_blank" icon={<FileTextOutlined />}>Voir</Button>
          <Popconfirm title="Supprimer ?" onConfirm={() => deleteDoc.mutate(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const memberForm = (
    <Form form={form} layout="vertical" onFinish={editingMember ? handleUpdateMember : handleCreateMember}>
      <Row gutter={16}>
        {!editingMember && (
          <>
            <Col span={8}>
              <Form.Item name="last_name" label="Nom" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="first_name" label="Prénom" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone_number" label="Téléphone" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
          </>
        )}
        <Col span={editingMember ? 12 : 8}>
          <Form.Item name="position" label="Poste" rules={[{ required: true }]}>
            <Select options={POSITION_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={editingMember ? 12 : 8}>
          <Form.Item name="contract_type" label="Type de contrat" rules={[{ required: true }]}>
            <Select options={CONTRACT_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={editingMember ? 12 : 8}>
          <Form.Item name="hire_date" label="Date d'embauche">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="base_salary" label="Salaire brut (DA)">
            <Input type="number" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="department" label="Département">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      {!editingMember && (
        <Form.Item name="email" label="Email">
          <Input type="email" />
        </Form.Item>
      )}
      <Form.Item name="emergency_contact" label="Contact d'urgence">
        <Input />
      </Form.Item>
      <Form.Item name="notes" label="Notes">
        <Input.TextArea rows={2} />
      </Form.Item>
    </Form>
  );

  return (
    <div className="page animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-header__info">
          <h1>👥 Gestion du Personnel</h1>
          <p>Personnel administratif et de soutien</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setShowCreate(true); form.resetFields(); }}>
          Ajouter un personnel
        </Button>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #3B82F6' }}>
            <Statistic title="Total personnel" value={stats?.total_staff || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #10B981' }}>
            <Statistic title="Actifs" value={stats?.active_staff || 0} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #F59E0B' }}>
            <Statistic title="Présents aujourd'hui" value={stats?.present_today || 0} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card style={{ borderLeft: '4px solid #EF4444' }}>
            <Statistic title="Congés en attente" value={stats?.pending_leaves || 0} prefix={<WarningOutlined />} valueStyle={stats?.pending_leaves ? { color: '#EF4444' } : undefined} />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          allowClear placeholder="Poste" style={{ width: 180 }}
          onChange={(v) => setFilters(f => ({ ...f, position: v }))}
          options={POSITION_OPTIONS}
        />
        <Select
          allowClear placeholder="Contrat" style={{ width: 140 }}
          onChange={(v) => setFilters(f => ({ ...f, contract_type: v }))}
          options={CONTRACT_OPTIONS}
        />
        <Input.Search
          placeholder="Rechercher..." style={{ width: 220 }}
          onSearch={(v) => setFilters(f => ({ ...f, search: v || undefined }))}
          allowClear
        />
      </Space>

      <Tabs
        defaultActiveKey="members"
        items={[
          {
            key: 'members',
            label: <><TeamOutlined /> Personnel</>,
            children: (
              <Table dataSource={members} columns={memberColumns} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
            ),
          },
          {
            key: 'leaves',
            label: <><ClockCircleOutlined /> Congés en attente ({pendingLeaves.length})</>,
            children: (
              <Table dataSource={pendingLeaves} columns={leaveColumns} rowKey="id" pagination={{ pageSize: 10 }} size="small" />
            ),
          },
        ]}
      />

      {/* Staff Detail Modal */}
      <Modal
        title={selectedStaff ? `${selectedStaff.full_name} — ${selectedStaff.position_label}` : ''}
        open={!!selectedStaff}
        onCancel={() => setSelectedStaff(null)}
        width={800}
        footer={
          <Space>
            <Button icon={<ClockCircleOutlined />} onClick={() => { setShowAttendance(true); attendanceForm.resetFields(); }}>Pointage</Button>
            <Button icon={<CalendarIcon />} onClick={() => { setShowLeaveForm(true); leaveForm.resetFields(); }}>Demande de congé</Button>
            <Button icon={<UploadOutlined />} onClick={() => setShowDocUpload(true)}>Ajouter document</Button>
            <Button onClick={() => setSelectedStaff(null)}>Fermer</Button>
          </Space>
        }
      >
        {selectedStaff && (
          <Tabs items={[
            {
              key: 'info', label: 'Informations',
              children: (
                <div>
                  <Row gutter={16}>
                    <Col span={12}><p><strong>Téléphone :</strong> {selectedStaff.phone_number}</p></Col>
                    <Col span={12}><p><strong>Email :</strong> {selectedStaff.email || '—'}</p></Col>
                    <Col span={12}><p><strong>Contrat :</strong> {selectedStaff.contract_label}</p></Col>
                    <Col span={12}><p><strong>Date d&apos;embauche :</strong> {selectedStaff.hire_date || '—'}</p></Col>
                    <Col span={12}><p><strong>Salaire :</strong> {selectedStaff.base_salary} DA</p></Col>
                    <Col span={12}><p><strong>Département :</strong> {selectedStaff.department || '—'}</p></Col>
                    <Col span={24}><p><strong>Contact urgence :</strong> {selectedStaff.emergency_contact || '—'}</p></Col>
                  </Row>
                </div>
              ),
            },
            {
              key: 'attendance', label: `Pointage (${attendance.length})`,
              children: <Table dataSource={attendance} columns={attColumns} rowKey="id" size="small" pagination={{ pageSize: 5 }} />,
            },
            {
              key: 'documents', label: `Documents (${documents.length})`,
              children: <Table dataSource={documents} columns={docColumns} rowKey="id" size="small" pagination={{ pageSize: 5 }} />,
            },
          ]} />
        )}
      </Modal>

      {/* Create / Edit Member Modal */}
      <Modal
        title={editingMember ? 'Modifier le personnel' : 'Ajouter un personnel'}
        open={showCreate || !!editingMember}
        onCancel={() => { setShowCreate(false); setEditingMember(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={createMember.isPending || updateMember.isPending}
        width={700}
      >
        {memberForm}
      </Modal>

      {/* Attendance Modal */}
      <Modal
        title="Enregistrer le pointage"
        open={showAttendance}
        onCancel={() => setShowAttendance(false)}
        onOk={() => attendanceForm.submit()}
        confirmLoading={createAttendance.isPending}
      >
        <Form form={attendanceForm} layout="vertical" onFinish={handleAttendance}>
          <Form.Item name="date" label="Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Statut" rules={[{ required: true }]}>
            <Select options={[
              { value: 'PRESENT', label: 'Présent' },
              { value: 'ABSENT', label: 'Absent' },
              { value: 'LATE', label: 'En retard' },
              { value: 'ON_LEAVE', label: 'En congé' },
            ]} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clock_in" label="Entrée">
                <DatePicker picker="time" format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="clock_out" label="Sortie">
                <DatePicker picker="time" format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Leave Request Modal */}
      <Modal
        title="Demande de congé"
        open={showLeaveForm}
        onCancel={() => setShowLeaveForm(false)}
        onOk={() => leaveForm.submit()}
        confirmLoading={createLeave.isPending}
      >
        <Form form={leaveForm} layout="vertical" onFinish={handleLeave}>
          <Form.Item name="leave_type" label="Type de congé" rules={[{ required: true }]}>
            <Select options={LEAVE_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="dates" label="Période" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Motif">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Document Upload Modal */}
      <Modal
        title="Ajouter un document"
        open={showDocUpload}
        onCancel={() => setShowDocUpload(false)}
        footer={null}
      >
        <Upload.Dragger
          beforeUpload={(file) => { handleDocUpload(file); return false; }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize: 32 }} /></p>
          <p>Cliquez ou glissez un fichier ici</p>
        </Upload.Dragger>
      </Modal>
    </div>
  );
};

// Small calendar icon component
const CalendarIcon: React.FC = () => <ClockCircleOutlined />;

export default StaffManagement;
