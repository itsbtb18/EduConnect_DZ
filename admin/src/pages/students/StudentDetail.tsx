import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Tag, Spin, Table, Form, Input, Select, Modal,
  DatePicker,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PhoneOutlined,
  CalendarOutlined,
  UserOutlined,
  BookOutlined,
  IdcardOutlined,
  TeamOutlined,
  MailOutlined,
  ReloadOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  WarningOutlined,
  TrophyOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import {
  useStudent, useUpdateStudent,
  useGrades, useAttendance, usePayments,
  useTeachers, useClasses,
} from '../../hooks/useApi';
import { academicsAPI } from '../../api/services';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import './StudentDetail.css';

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type R = Record<string, any>;

interface TabDef {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { key: 'profil',        label: 'Profil',        icon: <UserOutlined /> },
  { key: 'absences',      label: 'Absences',      icon: <CalendarOutlined /> },
  { key: 'notes',         label: 'Notes',         icon: <FileTextOutlined /> },
  { key: 'paiements',     label: 'Paiements',     icon: <DollarOutlined /> },
  { key: 'comportement',  label: 'Comportement',  icon: <ExclamationCircleOutlined /> },
  { key: 'enseignants',   label: 'Enseignants',   icon: <SolutionOutlined /> },
];

/* ═══════════════════════════════════════════════════════════════════════
   HELPER: extractData
   ═══════════════════════════════════════════════════════════════════════ */
function extractData(res: { data: unknown }): { results: R[]; count: number } {
  const d = res.data as R;
  if (Array.isArray(d)) return { results: d, count: d.length };
  if (d && typeof d === 'object' && 'results' in d) return { results: d.results, count: d.count };
  return { results: [], count: 0 };
}

/* ═══════════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════════ */
const MiniStat: React.FC<{
  label: string;
  value: string | number;
  accent?: string;
  icon: React.ReactNode;
}> = ({ label, value, accent = '#00C9A7', icon }) => (
  <div className="sd-stat" style={{ borderLeftColor: accent }}>
    <div className="sd-stat__icon" style={{ color: accent }}>{icon}</div>
    <div className="sd-stat__body">
      <div className="sd-stat__value">{value}</div>
      <div className="sd-stat__label">{label}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   ERROR BLOCK
   ═══════════════════════════════════════════════════════════════════════ */
const ErrorBlock: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="sd-empty">
    <ExclamationCircleOutlined className="sd-empty__icon sd-empty__icon--error" />
    <div className="sd-empty__title">Erreur de chargement</div>
    <div className="sd-empty__desc">Impossible de recuperer les donnees.</div>
    <Button icon={<ReloadOutlined />} onClick={onRetry} className="sd-empty__btn">Reessayer</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════════ */
const EmptyBlock: React.FC<{ text: string; icon?: React.ReactNode }> = ({ text, icon }) => (
  <div className="sd-empty">
    {icon && <div className="sd-empty__icon">{icon}</div>}
    <div className="sd-empty__desc">{text}</div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════
   TAB: PROFIL
   ═══════════════════════════════════════════════════════════════════════ */
const TabProfil: React.FC<{ student: R; onUpdated: () => void }> = ({ student, onUpdated }) => {
  const [editOpen, setEditOpen] = useState(false);
  const [form] = Form.useForm();
  const updateStudent = useUpdateStudent();
  const { data: classData } = useClasses({ page_size: 200 });
  const classes = (classData?.results || []) as { id: string; name: string }[];

  const openEdit = () => {
    form.setFieldsValue({
      first_name: student.first_name,
      last_name: student.last_name,
      phone_number: student.phone_number,
      email: student.email,
      date_of_birth: student.date_of_birth ? dayjs(student.date_of_birth) : undefined,
      parent_phone: student.parent_phone,
      class_name: student.class_name,
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth ? dayjs(values.date_of_birth).format('YYYY-MM-DD') : undefined,
      };
      await updateStudent.mutateAsync({ id: student.id, data: payload });
      setEditOpen(false);
      onUpdated();
    } catch {
      // validation / API error
    }
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="sd-tab-content">
      <div className="sd-cards-row">
        {/* Personal info */}
        <div className="sd-info-card">
          <div className="sd-info-card__header">
            <UserOutlined className="sd-info-card__icon" />
            <span>Informations personnelles</span>
            <Button type="text" icon={<EditOutlined />} className="sd-info-card__edit" onClick={openEdit}>Modifier</Button>
          </div>
          <div className="sd-info-card__grid">
            <div className="sd-field">
              <div className="sd-field__label">Nom complet</div>
              <div className="sd-field__value">{student.first_name || '—'} {student.last_name || '—'}</div>
            </div>
            <div className="sd-field">
              <div className="sd-field__label">Date de naissance</div>
              <div className="sd-field__value">{fmtDate(student.date_of_birth)}</div>
            </div>
            <div className="sd-field">
              <div className="sd-field__label">Telephone</div>
              <div className="sd-field__value">{student.phone_number || '—'}</div>
            </div>
            <div className="sd-field">
              <div className="sd-field__label">Email</div>
              <div className="sd-field__value">{student.email || '—'}</div>
            </div>
            <div className="sd-field">
              <div className="sd-field__label">Genre</div>
              <div className="sd-field__value">{student.gender === 'M' ? 'Masculin' : student.gender === 'F' ? 'Feminin' : '—'}</div>
            </div>
            <div className="sd-field">
              <div className="sd-field__label">Adresse</div>
              <div className="sd-field__value">{student.address || '—'}</div>
            </div>
          </div>
        </div>

        {/* Parent info */}
        <div className="sd-info-card">
          <div className="sd-info-card__header">
            <TeamOutlined className="sd-info-card__icon" />
            <span>Parent / Tuteur</span>
          </div>
          <div className="sd-info-card__grid">
            <div className="sd-field">
              <div className="sd-field__label">Nom du parent</div>
              <div className="sd-field__value">{student.parent_name || '—'}</div>
            </div>
            <div className="sd-field">
              <div className="sd-field__label">Telephone parent</div>
              <div className="sd-field__value">{student.parent_phone || '—'}</div>
            </div>
            <div className="sd-field">
              <div className="sd-field__label">Email parent</div>
              <div className="sd-field__value">{student.parent_email || '—'}</div>
            </div>
            <div className="sd-field">
              <div className="sd-field__label">Relation</div>
              <div className="sd-field__value">{student.parent_relation || '—'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* School info */}
      <div className="sd-info-card sd-info-card--full">
        <div className="sd-info-card__header">
          <BookOutlined className="sd-info-card__icon" />
          <span>Informations scolaires</span>
        </div>
        <div className="sd-info-card__grid sd-info-card__grid--3">
          <div className="sd-field">
            <div className="sd-field__label">Classe</div>
            <div className="sd-field__value">{student.class_name || '—'}</div>
          </div>
          <div className="sd-field">
            <div className="sd-field__label">Numero etudiant</div>
            <div className="sd-field__value">{student.student_id || '—'}</div>
          </div>
          <div className="sd-field">
            <div className="sd-field__label">Date d'inscription</div>
            <div className="sd-field__value">{fmtDate(student.enrollment_date || student.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        title="Modifier le profil"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={handleSave}
        confirmLoading={updateStudent.isPending}
        okText="Enregistrer"
        cancelText="Annuler"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="sd-edit-form">
          <div className="sd-edit-row">
            <Form.Item label="Prenom" name="first_name" rules={[{ required: true, message: 'Requis' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Nom" name="last_name" rules={[{ required: true, message: 'Requis' }]}>
              <Input />
            </Form.Item>
          </div>
          <div className="sd-edit-row">
            <Form.Item label="Date de naissance" name="date_of_birth">
              <DatePicker format="DD/MM/YYYY" className="sd-datepicker" disabledDate={(d) => d.isAfter(dayjs())} />
            </Form.Item>
            <Form.Item label="Telephone" name="phone_number">
              <Input />
            </Form.Item>
          </div>
          <div className="sd-edit-row">
            <Form.Item label="Email" name="email">
              <Input />
            </Form.Item>
            <Form.Item label="Telephone parent" name="parent_phone">
              <Input />
            </Form.Item>
          </div>
          <Form.Item label="Classe" name="class_name">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={classes.map((c) => ({ value: c.name, label: c.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   TAB: ABSENCES
   ═══════════════════════════════════════════════════════════════════════ */
const TabAbsences: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { data, isLoading, isError, refetch } = useAttendance({ student: studentId });
  const records = (data?.results || []) as R[];

  const totalAbsences = records.filter((r) => r.status === 'ABSENT').length;
  const justified = records.filter((r) => r.status === 'ABSENT' && r.excused).length;
  const unjustified = totalAbsences - justified;

  if (isLoading) return <div className="sd-loader"><Spin indicator={<LoadingOutlined />} size="large" /></div>;
  if (isError) return <ErrorBlock onRetry={refetch} />;

  return (
    <div className="sd-tab-content">
      <div className="sd-stats-row">
        <MiniStat label="Total absences" value={totalAbsences} accent="#3B82F6" icon={<CalendarOutlined />} />
        <MiniStat label="Justifiees" value={justified} accent="#10B981" icon={<CheckCircleOutlined />} />
        <MiniStat label="Non justifiees" value={unjustified} accent="#EF4444" icon={<CloseCircleOutlined />} />
      </div>

      {records.length === 0 ? (
        <EmptyBlock text="Aucune absence enregistree" icon={<CalendarOutlined />} />
      ) : (
        <div className="sd-table-wrap">
          <Table
            dataSource={records}
            rowKey={(r) => r.id || `att-${r.date}`}
            size="small"
            pagination={{ pageSize: 15, showSizeChanger: false }}
            columns={[
              {
                title: 'Date',
                dataIndex: 'date',
                key: 'date',
                render: (v: string) => v ? new Date(v).toLocaleDateString('fr-FR') : '—',
                sorter: (a: R, b: R) => new Date(a.date).getTime() - new Date(b.date).getTime(),
                defaultSortOrder: 'descend',
              },
              {
                title: 'Matiere',
                dataIndex: 'subject_name',
                key: 'subject',
                render: (v: string) => v || '—',
              },
              {
                title: 'Enseignant',
                dataIndex: 'teacher_name',
                key: 'teacher',
                render: (v: string) => v || '—',
              },
              {
                title: 'Type',
                key: 'type',
                render: (_: unknown, r: R) => {
                  if (r.status !== 'ABSENT') return <Tag color="green">Present</Tag>;
                  return r.excused
                    ? <Tag color="blue">Justifiee</Tag>
                    : <Tag color="red">Non justifiee</Tag>;
                },
              },
              {
                title: 'Statut',
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => {
                  const map: Record<string, { color: string; label: string }> = {
                    PRESENT: { color: 'green', label: 'Present' },
                    ABSENT: { color: 'red', label: 'Absent' },
                    LATE: { color: 'orange', label: 'En retard' },
                    EXCUSED: { color: 'blue', label: 'Excuse' },
                  };
                  const m = map[v] || { color: 'default', label: v || '—' };
                  return <Tag color={m.color}>{m.label}</Tag>;
                },
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   TAB: NOTES
   ═══════════════════════════════════════════════════════════════════════ */
const TabNotes: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { data, isLoading, isError, refetch } = useGrades({ student: studentId });
  const grades = (data?.results || []) as R[];

  const average = useMemo(() => {
    if (!grades.length) return null;
    const valid = grades.filter((g) => g.score != null);
    if (!valid.length) return null;
    const sum = valid.reduce((acc, g) => acc + (Number(g.score) || 0), 0);
    return (sum / valid.length).toFixed(2);
  }, [grades]);

  if (isLoading) return <div className="sd-loader"><Spin indicator={<LoadingOutlined />} size="large" /></div>;
  if (isError) return <ErrorBlock onRetry={refetch} />;

  return (
    <div className="sd-tab-content">
      {average !== null && (
        <div className="sd-average-card">
          <div className="sd-average-card__label">Moyenne generale</div>
          <div className="sd-average-card__value">{average}<span className="sd-average-card__suffix">/20</span></div>
        </div>
      )}

      {grades.length === 0 ? (
        <EmptyBlock text="Aucune note enregistree" icon={<FileTextOutlined />} />
      ) : (
        <div className="sd-table-wrap">
          <Table
            dataSource={grades}
            rowKey={(r) => r.id || `gr-${r.subject_name}-${r.trimester}`}
            size="small"
            pagination={{ pageSize: 20, showSizeChanger: false }}
            columns={[
              {
                title: 'Matiere',
                dataIndex: 'subject_name',
                key: 'subject',
                render: (v: string) => <span className="sd-text-bold">{v || '—'}</span>,
              },
              {
                title: 'Enseignant',
                dataIndex: 'teacher_name',
                key: 'teacher',
                render: (v: string) => v || '—',
              },
              {
                title: 'Note',
                dataIndex: 'score',
                key: 'score',
                render: (v: number) => v != null ? (
                  <span className={`sd-grade ${v >= 10 ? 'sd-grade--pass' : 'sd-grade--fail'}`}>
                    {v}/20
                  </span>
                ) : '—',
                sorter: (a: R, b: R) => (a.score || 0) - (b.score || 0),
              },
              {
                title: 'Coef.',
                dataIndex: 'coefficient',
                key: 'coef',
                render: (v: number) => v ?? '—',
              },
              {
                title: 'Type',
                dataIndex: 'exam_type',
                key: 'exam_type',
                render: (v: string) => {
                  const map: Record<string, string> = {
                    DEVOIR: 'Devoir',
                    COMPOSITION: 'Composition',
                    TEST: 'Test',
                    HOMEWORK: 'Devoir maison',
                  };
                  return map[v] || v || '—';
                },
              },
              {
                title: 'Trimestre',
                dataIndex: 'trimester',
                key: 'trimester',
                render: (v: string | number) => v ? `T${v}` : '—',
              },
              {
                title: 'Date',
                dataIndex: 'date',
                key: 'date',
                render: (v: string) => v ? new Date(v).toLocaleDateString('fr-FR') : '—',
                sorter: (a: R, b: R) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime(),
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   TAB: PAIEMENTS
   ═══════════════════════════════════════════════════════════════════════ */
const TabPaiements: React.FC<{ studentId: string }> = ({ studentId }) => {
  const { data, isLoading, isError, refetch } = usePayments({ student: studentId });
  const payments = (data?.results || []) as R[];

  const totalPaid = useMemo(
    () => payments.filter((p) => p.status === 'PAID' || p.status === 'COMPLETED')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [payments],
  );
  const remaining = useMemo(
    () => payments.filter((p) => p.status === 'PENDING' || p.status === 'OVERDUE')
      .reduce((s, p) => s + (Number(p.amount) || 0), 0),
    [payments],
  );
  const lastDate = useMemo(() => {
    const paid = payments.filter((p) => p.status === 'PAID' || p.status === 'COMPLETED');
    if (!paid.length) return '—';
    const sorted = paid.sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
    const d = sorted[0].date || sorted[0].created_at;
    return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  }, [payments]);

  if (isLoading) return <div className="sd-loader"><Spin indicator={<LoadingOutlined />} size="large" /></div>;
  if (isError) return <ErrorBlock onRetry={refetch} />;

  return (
    <div className="sd-tab-content">
      <div className="sd-stats-row">
        <MiniStat label="Total paye" value={`${totalPaid.toLocaleString('fr-FR')} DA`} accent="#10B981" icon={<CheckCircleOutlined />} />
        <MiniStat label="Solde restant" value={`${remaining.toLocaleString('fr-FR')} DA`} accent="#F59E0B" icon={<ExclamationCircleOutlined />} />
        <MiniStat label="Dernier paiement" value={lastDate} accent="#3B82F6" icon={<CalendarOutlined />} />
      </div>

      {payments.length === 0 ? (
        <EmptyBlock text="Aucun paiement enregistre" icon={<DollarOutlined />} />
      ) : (
        <div className="sd-table-wrap">
          <Table
            dataSource={payments}
            rowKey={(r) => r.id || `pay-${r.date}`}
            size="small"
            pagination={{ pageSize: 15, showSizeChanger: false }}
            columns={[
              {
                title: 'Date',
                key: 'date',
                render: (_: unknown, r: R) => {
                  const d = r.date || r.created_at;
                  return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
                },
                sorter: (a: R, b: R) => new Date(a.date || a.created_at || 0).getTime() - new Date(b.date || b.created_at || 0).getTime(),
                defaultSortOrder: 'descend',
              },
              {
                title: 'Montant',
                dataIndex: 'amount',
                key: 'amount',
                render: (v: number) => v != null ? `${Number(v).toLocaleString('fr-FR')} DA` : '—',
              },
              {
                title: 'Type de paiement',
                dataIndex: 'payment_type',
                key: 'type',
                render: (v: string) => v || '—',
              },
              {
                title: 'Methode',
                dataIndex: 'payment_method',
                key: 'method',
                render: (v: string) => {
                  const map: Record<string, string> = {
                    CASH: 'Especes',
                    BARIDIMOB: 'BaridiMob',
                    CIB: 'CIB',
                    BANK_TRANSFER: 'Virement',
                  };
                  return map[v] || v || '—';
                },
              },
              {
                title: 'N recu',
                dataIndex: 'receipt_number',
                key: 'receipt',
                render: (v: string) => v || '—',
              },
              {
                title: 'Statut',
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => {
                  const map: Record<string, { color: string; label: string }> = {
                    PAID: { color: 'green', label: 'Paye' },
                    COMPLETED: { color: 'green', label: 'Paye' },
                    PENDING: { color: 'orange', label: 'En attente' },
                    OVERDUE: { color: 'red', label: 'En retard' },
                  };
                  const m = map[v] || { color: 'default', label: v || '—' };
                  return <Tag color={m.color}>{m.label}</Tag>;
                },
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   TAB: COMPORTEMENT
   ═══════════════════════════════════════════════════════════════════════ */
const TabComportement: React.FC<{ studentId: string }> = ({ studentId }) => {
  // No dedicated behavior endpoint exists yet — query gracefully returns empty
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['behavior', studentId],
    queryFn: async () => {
      try {
        const res = await academicsAPI.subjects({ student: studentId, type: 'behavior' });
        return extractData(res);
      } catch {
        return { results: [], count: 0 };
      }
    },
    retry: 0,
  });

  const records = (data?.results || []) as R[];

  const warnings = records.filter((r) => r.type === 'WARNING' || r.type === 'AVERTISSEMENT').length;
  const commendations = records.filter((r) => r.type === 'COMMENDATION' || r.type === 'FELICITATION').length;

  if (isLoading) return <div className="sd-loader"><Spin indicator={<LoadingOutlined />} size="large" /></div>;
  if (isError) return <ErrorBlock onRetry={refetch} />;

  return (
    <div className="sd-tab-content">
      <div className="sd-stats-row">
        <MiniStat label="Avertissements" value={warnings} accent="#EF4444" icon={<WarningOutlined />} />
        <MiniStat label="Felicitations" value={commendations} accent="#10B981" icon={<TrophyOutlined />} />
      </div>

      {records.length === 0 ? (
        <EmptyBlock text="Aucun incident ou comportement enregistre" icon={<ExclamationCircleOutlined />} />
      ) : (
        <div className="sd-table-wrap">
          <Table
            dataSource={records}
            rowKey={(r) => r.id || `beh-${r.date}`}
            size="small"
            pagination={{ pageSize: 15, showSizeChanger: false }}
            columns={[
              {
                title: 'Date',
                dataIndex: 'date',
                key: 'date',
                render: (v: string) => v ? new Date(v).toLocaleDateString('fr-FR') : '—',
                defaultSortOrder: 'descend',
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
                render: (v: string) => {
                  const map: Record<string, { color: string; label: string }> = {
                    WARNING: { color: 'red', label: 'Avertissement' },
                    AVERTISSEMENT: { color: 'red', label: 'Avertissement' },
                    COMMENDATION: { color: 'green', label: 'Felicitation' },
                    FELICITATION: { color: 'green', label: 'Felicitation' },
                    INCIDENT: { color: 'orange', label: 'Incident' },
                    NOTE: { color: 'blue', label: 'Note de comportement' },
                  };
                  const m = map[v] || { color: 'default', label: v || '—' };
                  return <Tag color={m.color}>{m.label}</Tag>;
                },
              },
              { title: 'Description', dataIndex: 'description', key: 'desc', ellipsis: true },
              { title: 'Rapporte par', dataIndex: 'reported_by', key: 'reporter', render: (v: string) => v || '—' },
              {
                title: 'Severite',
                dataIndex: 'severity',
                key: 'severity',
                render: (v: string) => {
                  if (!v) return '—';
                  const map: Record<string, string> = { LOW: 'Faible', MEDIUM: 'Moyen', HIGH: 'Eleve', CRITICAL: 'Critique' };
                  return map[v] || v;
                },
              },
            ]}
          />
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   TAB: ENSEIGNANTS
   ═══════════════════════════════════════════════════════════════════════ */
const TabEnseignants: React.FC<{ student: R }> = ({ student }) => {
  const { data: assignData, isLoading: assignLoading, isError: assignError, refetch: assignRefetch } = useQuery({
    queryKey: ['teacher-assignments', student.current_class || student.class_name],
    queryFn: async () => {
      const res = await academicsAPI.teachers({ class_name: student.class_name, page_size: 100 });
      return extractData(res);
    },
    enabled: !!(student.current_class || student.class_name),
    retry: 1,
  });

  const { data: teacherData, isLoading: teacherLoading } = useTeachers({ page_size: 200 });

  const isLoading = assignLoading || teacherLoading;

  const assignments = (assignData?.results || []) as R[];
  const allTeachers = (teacherData?.results || []) as R[];

  const teacherCards = useMemo(() => {
    if (assignments.length > 0) {
      return assignments.map((a) => {
        const teacher = allTeachers.find((t) => t.id === a.teacher || t.id === a.teacher_id);
        return {
          id: a.teacher || a.teacher_id || a.id,
          first_name: a.teacher_first_name || teacher?.first_name || '—',
          last_name: a.teacher_last_name || teacher?.last_name || '',
          subject: a.subject_name || a.subject || teacher?.subject || '—',
          phone_number: teacher?.phone_number || a.teacher_phone || '—',
          email: teacher?.email || a.teacher_email || '—',
        };
      });
    }
    if (allTeachers.length > 0) {
      return allTeachers.map((t) => ({
        id: t.id,
        first_name: t.first_name || '—',
        last_name: t.last_name || '',
        subject: t.subject || t.specialization || '—',
        phone_number: t.phone_number || '—',
        email: t.email || '—',
      }));
    }
    return [];
  }, [assignments, allTeachers]);

  if (isLoading) return <div className="sd-loader"><Spin indicator={<LoadingOutlined />} size="large" /></div>;
  if (assignError) return <ErrorBlock onRetry={assignRefetch} />;

  return (
    <div className="sd-tab-content">
      {teacherCards.length === 0 ? (
        <EmptyBlock text="Aucun enseignant assigne a cette classe" icon={<SolutionOutlined />} />
      ) : (
        <div className="sd-teacher-grid">
          {teacherCards.map((t) => {
            const initials = `${(t.first_name[0] || '').toUpperCase()}${(t.last_name[0] || '').toUpperCase()}`;
            return (
              <div key={t.id} className="sd-teacher-card">
                <div className="sd-teacher-card__avatar">{initials}</div>
                <div className="sd-teacher-card__body">
                  <div className="sd-teacher-card__name">{t.first_name} {t.last_name}</div>
                  <div className="sd-teacher-card__subject">
                    <BookOutlined /> {t.subject}
                  </div>
                  <div className="sd-teacher-card__contact">
                    <span><PhoneOutlined /> {t.phone_number}</span>
                    <span><MailOutlined /> {t.email}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */
const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: student, isLoading, isError, refetch } = useStudent(id || '');
  const [activeTab, setActiveTab] = useState('profil');

  if (isLoading) {
    return (
      <div className="sd-page">
        <div className="sd-loader sd-loader--full">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} />} />
          <span className="sd-loader__text">Chargement du profil...</span>
        </div>
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="sd-page">
        <div className="sd-empty sd-empty--full">
          <ExclamationCircleOutlined className="sd-empty__icon sd-empty__icon--error" />
          <div className="sd-empty__title">Eleve introuvable</div>
          <div className="sd-empty__desc">Cet eleve n'existe pas ou a ete supprime.</div>
          <Button type="primary" onClick={() => navigate('/students')} className="sd-empty__btn">
            Retour a la liste
          </Button>
        </div>
      </div>
    );
  }

  const s = student as R;
  const fullName = `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Eleve';
  const initials = `${(s.first_name?.[0] || '').toUpperCase()}${(s.last_name?.[0] || '').toUpperCase()}` || 'EL';
  const isActive = s.is_active !== false;

  return (
    <div className="sd-page">
      {/* Back button */}
      <button className="sd-back" onClick={() => navigate('/students')}>
        <ArrowLeftOutlined />
        <span>Retour aux eleves</span>
      </button>

      {/* Header */}
      <div className="sd-header">
        <div className="sd-header__avatar">{initials}</div>
        <div className="sd-header__info">
          <h1 className="sd-header__name">{fullName}</h1>
          <div className="sd-header__meta">
            {s.class_name && <Tag color="blue" className="sd-header__tag">{s.class_name}</Tag>}
            <Tag color={isActive ? 'green' : 'red'} className="sd-header__tag">
              {isActive ? 'Actif' : 'Inactif'}
            </Tag>
          </div>
          <div className="sd-header__chips">
            {s.phone_number && (
              <span className="sd-chip"><PhoneOutlined /> {s.phone_number}</span>
            )}
            {s.date_of_birth && (
              <span className="sd-chip">
                <CalendarOutlined /> {new Date(s.date_of_birth).toLocaleDateString('fr-FR')}
              </span>
            )}
            {s.student_id && (
              <span className="sd-chip"><IdcardOutlined /> {s.student_id}</span>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="sd-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`sd-tabs__item ${activeTab === tab.key ? 'sd-tabs__item--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content — lazy: only render the active tab */}
      <div className="sd-tab-panel">
        {activeTab === 'profil' && <TabProfil student={s} onUpdated={refetch} />}
        {activeTab === 'absences' && <TabAbsences studentId={id!} />}
        {activeTab === 'notes' && <TabNotes studentId={id!} />}
        {activeTab === 'paiements' && <TabPaiements studentId={id!} />}
        {activeTab === 'comportement' && <TabComportement studentId={id!} />}
        {activeTab === 'enseignants' && <TabEnseignants student={s} />}
      </div>
    </div>
  );
};

export default StudentDetail;
