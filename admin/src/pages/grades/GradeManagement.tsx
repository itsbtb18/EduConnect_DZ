import React, { useState, useRef } from 'react';
import { Table, Button, Tag, Select, Input, Modal, Form, InputNumber, Popconfirm, Tooltip, Space, Tabs, Card, message, Alert } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  FileTextOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilePdfOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useGrades, useCreateGrade, useUpdateGrade, useDeleteGrade, useStudents, useSubjects, useReportCards, useGenerateReportCard } from '../../hooks/useApi';
import { useDebounce } from '../../hooks/useDebounce';
import { exportToCSV, exportToPDF } from '../../hooks/useExport';

const GradeManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [rcPage, setRcPage] = useState(1);
  const [form] = Form.useForm();
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [csvGrades, setCsvGrades] = useState<Record<string, string>[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, refetch } = useGrades({ page, page_size: 20, search: debouncedSearch || undefined });
  const createGrade = useCreateGrade();
  const updateGrade = useUpdateGrade();
  const deleteGrade = useDeleteGrade();
  const { data: studentsData } = useStudents({ page_size: 200 });
  const { data: subjectsData } = useSubjects();
  const { data: reportCards, isLoading: rcLoading } = useReportCards({ page: rcPage, page_size: 20 });
  const generateRC = useGenerateReportCard();

  const students = (studentsData?.results || []) as { id: string; first_name: string; last_name: string; user?: { first_name: string; last_name: string } }[];
  const subjects = (subjectsData?.results || subjectsData || []) as { id: string; name: string }[];

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editId) {
        await updateGrade.mutateAsync({ id: editId, data: values });
      } else {
        await createGrade.mutateAsync(values);
      }
      setModalOpen(false);
      form.resetFields();
      setEditId(null);
    } catch { /* validation */ }
  };

  const openEdit = (record: Record<string, unknown>) => {
    setEditId(record.id as string);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleGenerateRC = async () => {
    try {
      await generateRC.mutateAsync({});
      message.success('Bulletins générés avec succès');
    } catch {
      message.error('Erreur lors de la génération');
    }
  };

  const handleExportGrades = () => {
    const cols = [
      { key: 'student_name', title: 'Élève' },
      { key: 'subject', title: 'Matière' },
      { key: 'trimester', title: 'Trimestre' },
      { key: 'score', title: 'Note' },
      { key: 'status', title: 'Statut' },
    ];
    exportToCSV(data?.results || [], cols, 'notes');
  };

  const handleExportPDF = () => {
    const cols = [
      { key: 'student_name', title: 'Élève' },
      { key: 'subject', title: 'Matière' },
      { key: 'trimester', title: 'Trimestre' },
      { key: 'score', title: 'Note /20' },
      { key: 'status', title: 'Statut' },
    ];
    exportToPDF(data?.results || [], cols, 'notes', 'Notes & Bulletins — ILMI');
  };

  // CSV Import for bulk grades
  const handleGradeCsvFile = (file: File) => {
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        message.error('Le fichier CSV doit contenir au moins un en-tête et une ligne');
        return;
      }
      const sep = lines[0].includes(';') ? ';' : lines[0].includes('|') ? '|' : ',';
      const headers = lines[0].split(sep).map((h) => normalize(h.trim()));
      const rows = lines.slice(1).map((line) => {
        const vals = line.split(sep).map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
          if (h.includes('eleve') || h.includes('student') || h.includes('nom')) row.student_name = vals[i] || '';
          else if (h.includes('matiere') || h.includes('subject')) row.subject_name = vals[i] || '';
          else if (h.includes('trimestre') || h.includes('trim')) row.trimester = vals[i] || '';
          else if (h.includes('note') || h.includes('score') || h.includes('grade')) row.score = vals[i] || '';
        });
        return row;
      }).filter((r) => r.student_name && r.score);
      setCsvGrades(rows);
      setCsvImportOpen(true);
    };
    reader.readAsText(file);
  };

  const handleCsvGradeImport = async () => {
    setCsvImporting(true);
    let success = 0;
    let failed = 0;
    for (const row of csvGrades) {
      try {
        // Find student and subject by name
        const student = students.find((s) => {
          const fullName = s.user
            ? `${s.user.first_name} ${s.user.last_name}`
            : `${s.first_name} ${s.last_name}`;
          return fullName.toLowerCase().includes(row.student_name.toLowerCase());
        });
        const subject = subjects.find((s) =>
          s.name.toLowerCase().includes((row.subject_name || '').toLowerCase()),
        );
        if (!student) { failed++; continue; }
        await createGrade.mutateAsync({
          student: student.id,
          subject: subject?.id || row.subject_name,
          trimester: parseInt(row.trimester) || 1,
          score: parseFloat(row.score),
          status: 'submitted',
        });
        success++;
      } catch {
        failed++;
      }
    }
    setCsvImporting(false);
    setCsvImportOpen(false);
    setCsvGrades([]);
    message.success(`Import terminé: ${success} notes créées, ${failed} échouées`);
  };

  const statusColors: Record<string, string> = {
    draft: 'default',
    submitted: 'blue',
    published: 'green',
  };

  const gradeColumns = [
    {
      title: 'Élève',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (v: string, r: Record<string, unknown>) =>
        <span className="font-semibold">{v || (r.student as string) || '—'}</span>,
    },
    {
      title: 'Matière',
      dataIndex: 'subject',
      key: 'subject',
      render: (v: string, r: Record<string, unknown>) =>
        <Tag color="blue">{v || (r.subject_name as string) || '—'}</Tag>,
    },
    {
      title: 'Trimestre',
      dataIndex: 'trimester',
      key: 'trimester',
      width: 100,
      render: (v: number) => v ? `T${v}` : '—',
    },
    {
      title: 'Note',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (v: number, r: Record<string, unknown>) => {
        const score = v ?? (r.average as number) ?? (r.grade as number);
        if (score == null) return '—';
        return <span className={score >= 10 ? 'score--pass' : 'score--fail'}>{score}/20</span>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={statusColors[v] || 'default'}>{v || '—'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, r: Record<string, unknown>) => (
        <Space>
          <Tooltip title="Modifier">
            <Button type="text" icon={<EditOutlined />} size="small" onClick={() => openEdit(r)} />
          </Tooltip>
          <Popconfirm title="Supprimer cette note ?" onConfirm={() => deleteGrade.mutate(r.id as string)} okText="Oui" cancelText="Non">
            <Tooltip title="Supprimer">
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Report card columns
  const rcResults = (reportCards?.results || []) as Record<string, unknown>[];
  const rcColumns = [
    {
      title: 'Élève',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (v: string, r: Record<string, unknown>) =>
        <span className="font-semibold">{v || (r.student as string) || '—'}</span>,
    },
    {
      title: 'Trimestre',
      dataIndex: 'trimester',
      key: 'trimester',
      render: (v: number) => v ? `Trimestre ${v}` : '—',
    },
    {
      title: 'Moyenne',
      dataIndex: 'average',
      key: 'average',
      render: (v: number) => {
        if (v == null) return '—';
        return <span className={v >= 10 ? 'score--pass' : 'score--fail'}>{v.toFixed(2)}/20</span>;
      },
    },
    {
      title: 'Année',
      dataIndex: 'academic_year_name',
      key: 'academic_year',
      render: (v: string, r: Record<string, unknown>) => v || (r.academic_year as string) || '—',
    },
    {
      title: 'Généré le',
      dataIndex: 'generated_at',
      key: 'generated_at',
      render: (v: string) => v ? new Date(v).toLocaleDateString('fr-FR') : '—',
    },
  ];

  const gradesTab = (
    <>
      {/* Quick stats */}
      <div className="stat-grid mb-16">
        <Card size="small" className="stat-card">
          <div className="stat-value">{data?.count ?? 0}</div>
          <div className="stat-label">Total notes</div>
        </Card>
        <Card size="small" className="stat-card">
          <div className="stat-value color-success">
            {((data?.results || []) as Record<string, unknown>[]).filter((r) => ((r.score as number) ?? 0) >= 10).length}
          </div>
          <div className="stat-label">Réussis (≥10)</div>
        </Card>
        <Card size="small" className="stat-card">
          <div className="stat-value color-danger">
            {((data?.results || []) as Record<string, unknown>[]).filter((r) => ((r.score as number) ?? 0) < 10).length}
          </div>
          <div className="stat-label">En difficulté (&lt;10)</div>
        </Card>
      </div>

      <div className="filter-row">
        <Input
          prefix={<SearchOutlined className="search-icon" />}
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          className="search-input"
        />
        <Space>
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
            title="Importer des notes CSV"
            aria-label="Importer des notes CSV"
            className="student-list__csv-input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleGradeCsvFile(file);
              e.target.value = '';
            }}
          />
          <Button icon={<DownloadOutlined />} onClick={handleExportGrades}>CSV</Button>
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>PDF</Button>
        </Space>
      </div>

      <div className="card card--table">
        <Table
          columns={gradeColumns}
          dataSource={data?.results || []}
          loading={isLoading}
          rowKey={(r: Record<string, unknown>) => (r.id as string) || `grade-${r.student}-${r.subject}-${r.trimester}`}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.count || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          locale={{ emptyText: 'Aucune note trouvée' }}
        />
      </div>
    </>
  );

  const reportCardsTab = (
    <>
      <div className="filter-row">
        <div />
        <Button
          type="primary"
          icon={<FileTextOutlined />}
          onClick={handleGenerateRC}
          loading={generateRC.isPending}
        >
          Générer les bulletins
        </Button>
      </div>

      <div className="card card--table">
        <Table
          columns={rcColumns}
          dataSource={rcResults}
          loading={rcLoading}
          rowKey={(r: Record<string, unknown>) => (r.id as string) || `rc-${r.student}-${r.trimester}`}
          pagination={{
            current: rcPage,
            pageSize: 20,
            total: reportCards?.count || 0,
            onChange: (p) => setRcPage(p),
            showSizeChanger: false,
          }}
          locale={{ emptyText: 'Aucun bulletin généré' }}
        />
      </div>
    </>
  );

  return (
    <div className="page animate-fade-in">
      <div className="page-header">
        <div className="page-header__info">
          <h1>Notes & Bulletins</h1>
          <p>{data?.count ?? 0} notes enregistrées</p>
        </div>
        <div className="page-header__actions">
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Actualiser</Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => { setEditId(null); form.resetFields(); setModalOpen(true); }}
          >
            Ajouter une note
          </Button>
        </div>
      </div>

      <Tabs
        defaultActiveKey="grades"
        items={[
          { key: 'grades', label: 'Notes', children: gradesTab },
          { key: 'reportCards', label: 'Bulletins', children: reportCardsTab },
        ]}
      />

      <Modal
        title={editId ? 'Modifier la note' : 'Ajouter une note'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditId(null); }}
        confirmLoading={createGrade.isPending || updateGrade.isPending}
        okText={editId ? 'Enregistrer' : 'Ajouter'}
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" className="modal-form">
          <Form.Item label="Élève" name="student" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner un élève"
              options={students.map((s) => ({
                value: s.id,
                label: s.user
                  ? `${s.user.first_name} ${s.user.last_name}`
                  : `${s.first_name} ${s.last_name}`,
              }))}
            />
          </Form.Item>
          <Form.Item label="Matière" name="subject" rules={[{ required: true, message: 'Requis' }]}>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Sélectionner une matière"
              options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
          <Form.Item label="Trimestre" name="trimester">
            <Select placeholder="Trimestre">
              <Select.Option value={1}>Trimestre 1</Select.Option>
              <Select.Option value={2}>Trimestre 2</Select.Option>
              <Select.Option value={3}>Trimestre 3</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Note" name="score" rules={[{ required: true, message: 'Requis' }]}>
            <InputNumber min={0} max={20} step={0.5} className="w-full" placeholder="Note sur 20" />
          </Form.Item>
          <Form.Item label="Statut" name="status">
            <Select placeholder="Statut">
              <Select.Option value="draft">Brouillon</Select.Option>
              <Select.Option value="submitted">Soumis</Select.Option>
              <Select.Option value="published">Publié</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* CSV Import Modal for Grades */}
      <Modal
        title="Importer des notes par CSV"
        open={csvImportOpen}
        onCancel={() => { setCsvImportOpen(false); setCsvGrades([]); }}
        onOk={handleCsvGradeImport}
        confirmLoading={csvImporting}
        okText={`Importer ${csvGrades.length} notes`}
        cancelText="Annuler"
        width={700}
      >
        <Alert
          message="Format attendu"
          description="Élève | Matière | Trimestre | Note — Séparateurs acceptés: virgule, point-virgule, pipe (|)"
          type="info"
          showIcon
          className="mb-16"
        />
        {csvGrades.length > 0 && (
          <Table
            dataSource={csvGrades.slice(0, 20)}
            rowKey={(_, i) => `csv-grade-${i}`}
            size="small"
            pagination={false}
            scroll={{ y: 300 }}
            columns={[
              { title: 'Élève', dataIndex: 'student_name', key: 'student_name' },
              { title: 'Matière', dataIndex: 'subject_name', key: 'subject_name' },
              { title: 'Trimestre', dataIndex: 'trimester', key: 'trimester' },
              { title: 'Note', dataIndex: 'score', key: 'score' },
            ]}
          />
        )}
        {csvGrades.length > 20 && (
          <div className="text-sub mt-4">... et {csvGrades.length - 20} autres lignes</div>
        )}
      </Modal>
    </div>
  );
};

export default GradeManagement;
