import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Tag, Drawer, Form, Select, message, Popconfirm, Space, Modal, Alert, DatePicker, Statistic, Card, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ExportOutlined,
  ReloadOutlined,
  UploadOutlined,
  FilePdfOutlined,
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useStudents, useCreateStudent, useUpdateStudent, useDeleteStudent, useClasses } from '../../hooks/useApi';
import { exportToCSV, exportToPDF } from '../../hooks/useExport';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import './StudentList.css';

const StudentList: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Record<string, unknown> | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useStudents({ page, page_size: 20, search: search || undefined });
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();
  const { data: classData } = useClasses({ page_size: 200 });
  const classes = (classData?.results || []) as { id: string; name: string }[];

  // CSV Import state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvPreview, setCsvPreview] = useState<Record<string, string>[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [classFilter, setClassFilter] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick stats
  const allResults = (data?.results || []) as Record<string, unknown>[];
  const activeCount = allResults.filter((r) => (r.is_active as boolean) !== false).length;
  const inactiveCount = allResults.filter((r) => (r.is_active as boolean) === false).length;

  const handleDelete = async (id: string) => {
    try {
      await deleteStudent.mutateAsync(id);
    } catch {
      // error handled by hook
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Format date_of_birth if it's a dayjs object
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth ? dayjs(values.date_of_birth).format('YYYY-MM-DD') : undefined,
      };
      if (editingStudent) {
        await updateStudent.mutateAsync({ id: editingStudent.id as string, data: payload });
      } else {
        await createStudent.mutateAsync({ ...payload, role: 'STUDENT' });
      }
      setDrawerOpen(false);
      form.resetFields();
      setEditingStudent(null);
    } catch {
      // validation or API error handled by hooks
    }
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditingStudent(record);
    form.setFieldsValue({
      ...record,
      date_of_birth: record.date_of_birth ? dayjs(record.date_of_birth as string) : undefined,
    });
    setDrawerOpen(true);
  };

  // CSV Export
  const handleExport = () => {
    const cols = [
      { key: 'first_name', title: 'Prénom' },
      { key: 'last_name', title: 'Nom' },
      { key: 'date_of_birth', title: 'Date de naissance' },
      { key: 'phone_number', title: 'Téléphone' },
      { key: 'parent_phone', title: 'Téléphone parent' },
      { key: 'email', title: 'Email' },
      { key: 'class_name', title: 'Classe' },
    ];
    exportToCSV(data?.results || [], cols, 'eleves');
  };

  // PDF Export
  const handleExportPDF = () => {
    const cols = [
      { key: 'first_name', title: 'Prénom' },
      { key: 'last_name', title: 'Nom' },
      { key: 'date_of_birth', title: 'Date de naissance' },
      { key: 'phone_number', title: 'Téléphone' },
      { key: 'class_name', title: 'Classe' },
    ];
    exportToPDF(data?.results || [], cols, 'eleves', 'Liste des élèves — ILMI');
  };

  // CSV Import — parse file
  const handleCsvFile = (file: File) => {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        message.error('Le fichier CSV doit contenir au moins un en-tête et une ligne de données');
        return;
      }
      const sep = lines[0].includes(';') ? ';' : lines[0].includes('|') ? '|' : ',';
      const headers = lines[0].split(sep).map((h) => normalize(h.trim()));
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(sep).map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          // Map common header names (accent-safe)
          if (h.includes('prenom') || h.includes('first')) row.first_name = vals[i] || '';
          else if (h.includes('nom') || h.includes('last')) row.last_name = vals[i] || '';
          else if (h.includes('date') || h.includes('naissance') || h.includes('birth')) row.date_of_birth = vals[i] || '';
          else if (h.includes('parent') && (h.includes('phone') || h.includes('tel'))) row.parent_phone = vals[i] || '';
          else if (h.includes('phone') || h.includes('tel')) row.phone_number = vals[i] || '';
          else if (h.includes('class') || h.includes('classe')) row.class_name = vals[i] || '';
          else if (h.includes('email')) row.email = vals[i] || '';
        });
        return row;
      }).filter((r) => r.first_name || r.last_name);
      setCsvPreview(rows);
      setImportModalOpen(true);
    };
    reader.readAsText(file);
  };

  // CSV Import — create students
  const handleCsvImport = async () => {
    setCsvImporting(true);
    let success = 0;
    let failed = 0;
    for (const row of csvPreview) {
      try {
        await createStudent.mutateAsync({
          first_name: row.first_name,
          last_name: row.last_name,
          phone_number: row.phone_number || '',
          parent_phone: row.parent_phone || '',
          date_of_birth: row.date_of_birth || '',
          email: row.email || '',
          class_name: row.class_name || '',
          role: 'STUDENT',
        });
        success++;
      } catch {
        failed++;
      }
    }
    setCsvImporting(false);
    setImportModalOpen(false);
    setCsvPreview([]);
    message.success(`Import terminé: ${success} créés, ${failed} échoués`);
    refetch();
  };

  const columns = [
    {
      title: 'Nom',
      key: 'name',
      render: (_: unknown, r: Record<string, unknown>) => (
        <div className="flex-row flex-center gap-10">
          <div className="avatar avatar--sm avatar--primary">
            {((r.first_name as string)?.[0] || '').toUpperCase()}
            {((r.last_name as string)?.[0] || '').toUpperCase()}
          </div>
          <div>
            <div className="font-semibold">
              {(r.first_name as string) || ''} {(r.last_name as string) || ''}
            </div>
            <div className="text-sub">
              {(r.email as string) || (r.phone_number as string) || ''}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Classe',
      dataIndex: 'class_name',
      key: 'class_name',
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : <span className="text-muted">—</span>,
      filters: classes.map((c) => ({ text: c.name, value: c.name })),
      onFilter: (value: unknown, record: Record<string, unknown>) => (record.class_name as string) === value,
    },
    {
      title: 'Date de naissance',
      dataIndex: 'date_of_birth',
      key: 'date_of_birth',
      render: (v: string) => v ? new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : <span className="text-muted">—</span>,
      responsive: ['lg'] as ('lg')[],
    },
    {
      title: 'Telephone',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (v: string) => <span className="font-mono">{v || '—'}</span>,
    },
    {
      title: 'Statut',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (v: boolean) => (
        <Tag color={v !== false ? 'green' : 'red'}>
          {v !== false ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space size={4}>
          <Button
            type="text"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => navigate(`/students/${r.id}`)}
            title="Voir"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEdit(r)}
            title="Modifier"
          />
          <Popconfirm title="Supprimer cet eleve ?" onConfirm={() => handleDelete(r.id as string)}>
            <Button type="text" icon={<DeleteOutlined />} size="small" danger title="Supprimer" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Gestion des élèves</h1>
          <p>{data?.count ?? 0} élèves enregistrés</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Actualiser
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>CSV</Button>
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>PDF</Button>
          <Button
            icon={<UploadOutlined />}
            onClick={() => fileInputRef.current?.click()}
          >
            Importer CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            title="Importer un fichier CSV"
            aria-label="Importer un fichier CSV"
            className="student-list__csv-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCsvFile(file);
              e.target.value = '';
            }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingStudent(null);
              form.resetFields();
              setDrawerOpen(true);
            }}
          >
            Ajouter un eleve
          </Button>
        </div>
      </div>

      {/* Search + Stats */}
      <div className="student-list__stats-row">
        <Card size="small" className="stat-card">
          <Statistic title="Total" value={data?.count ?? 0} prefix={<TeamOutlined />} />
        </Card>
        <Card size="small" className="stat-card">
          <Statistic title="Actifs" value={activeCount} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#10B981' }} />
        </Card>
        <Card size="small" className="stat-card">
          <Statistic title="Inactifs" value={inactiveCount} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#EF4444' }} />
        </Card>
      </div>

      {/* Search */}
      <Input
        prefix={<SearchOutlined className="search-icon" />}
        placeholder="Rechercher par nom, telephone..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        allowClear
        className="search-input"
      />

      {/* Table */}
      <div className="card card--table">
        <Table
          columns={columns}
          dataSource={data?.results || []}
          loading={isLoading}
          rowKey={(r: Record<string, any>) => (r.id as string) || `stu-${r.first_name}-${r.last_name}`}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.count || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (total) => `${total} eleves`,
          }}
          locale={{ emptyText: 'Aucun eleve trouve' }}
        />
      </div>

      {/* Add/Edit Drawer */}
      <Drawer
        title={editingStudent ? 'Modifier l\'eleve' : 'Ajouter un eleve'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingStudent(null); }}
        width={440}
        footer={
          <div className="drawer-footer">
            <Button onClick={() => setDrawerOpen(false)}>Annuler</Button>
            <Button type="primary" onClick={handleSubmit} loading={createStudent.isPending || updateStudent.isPending}>
              {editingStudent ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Prénom" name="first_name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Prénom de l'élève" />
          </Form.Item>
          <Form.Item label="Nom" name="last_name" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Nom de l'élève" />
          </Form.Item>
          <Form.Item label="Date de naissance" name="date_of_birth">
            <DatePicker
              format="DD/MM/YYYY"
              placeholder="Sélectionner la date"
              className="w-full"
              disabledDate={(d) => d.isAfter(dayjs())}
            />
          </Form.Item>
          <Form.Item label="Téléphone élève" name="phone_number">
            <Input placeholder="0550000000" />
          </Form.Item>
          <Form.Item label="Téléphone parent" name="parent_phone">
            <Input placeholder="0551234567" />
          </Form.Item>
          <Form.Item label="Email" name="email">
            <Input placeholder="email@example.com" />
          </Form.Item>
          <Form.Item label="Classe" name="class_name">
            <Select
              placeholder="Sélectionner une classe"
              allowClear
              showSearch
              optionFilterProp="label"
              options={classes.map((c) => ({ value: c.name, label: c.name }))}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* CSV Import Modal */}
      <Modal
        title="Importer des élèves par CSV"
        open={importModalOpen}
        onCancel={() => { setImportModalOpen(false); setCsvPreview([]); }}
        onOk={handleCsvImport}
        confirmLoading={csvImporting}
        okText={`Importer ${csvPreview.length} élèves`}
        cancelText="Annuler"
        width={700}
      >
        <Alert
          message="Format attendu"
          description="Prénom | Nom | Date de naissance | Téléphone parent | Classe — Séparateurs acceptés: virgule, point-virgule, pipe (|)"
          type="info"
          showIcon
          className="mb-16"
        />
        {csvPreview.length > 0 && (
          <Table
            dataSource={csvPreview.slice(0, 20)}
            rowKey={(_, i) => `csv-${i}`}
            size="small"
            pagination={false}
            scroll={{ y: 300 }}
            columns={[
              { title: 'Prénom', dataIndex: 'first_name', key: 'first_name' },
              { title: 'Nom', dataIndex: 'last_name', key: 'last_name' },
              { title: 'Date de naissance', dataIndex: 'date_of_birth', key: 'date_of_birth' },
              { title: 'Téléphone', dataIndex: 'phone_number', key: 'phone_number' },
              { title: 'Classe', dataIndex: 'class_name', key: 'class_name' },
            ]}
          />
        )}
        {csvPreview.length > 20 && (
          <div className="text-sub mt-4">... et {csvPreview.length - 20} autres lignes</div>
        )}
      </Modal>
    </div>
  );
};

export default StudentList;
