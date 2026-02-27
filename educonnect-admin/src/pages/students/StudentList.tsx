import React, { useState, useMemo } from 'react';
import { Modal, Tabs } from 'antd';
import PageHeader from '../../components/ui/PageHeader';
import SearchBar from '../../components/ui/SearchBar';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import { students, classrooms } from '../../data/mockData';
import { Student, BadgeColor } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fullName = (s: Student) => `${s.firstName} ${s.lastName}`;

const presenceColor = (v: number) => v >= 90 ? '#00C48C' : v >= 75 ? '#FF6B35' : '#FF4757';
const avgColor      = (v: number) => v >= 14  ? '#00C48C' : v >= 10 ? '#1A6BFF' : '#FF4757';

const statusBadge: Record<Student['status'], { label: string; color: BadgeColor }> = {
  active:    { label: 'Actif',          color: 'green'  },
  watch:     { label: 'En surveillance',color: 'yellow' },
  suspended: { label: 'Suspendu',       color: 'red'    },
};

const uniqueClasses = Array.from(new Set(students.map((s) => s.className))).sort();

const PAGE_SIZE = 10;

// ─── Mock grades per level ────────────────────────────────────────────────────

const makeGrades = (level: Student['level']) => {
  const max = level === 'Primaire' ? 10 : 20;
  const subjects =
    level === 'Primaire'
      ? ['Arabe', 'Français', 'Mathématiques', 'Éducation Islamique', 'Éducation Physique']
      : ['Mathématiques', 'Français', 'Physique-Chimie', 'SVT', 'Anglais'];
  return subjects.map((subj) => {
    const p  = +(Math.random() * (max * 0.2)           ).toFixed(1);
    const c1 = +(max * 0.5 + Math.random() * max * 0.5 ).toFixed(1);
    const c2 = +(max * 0.5 + Math.random() * max * 0.5 ).toFixed(1);
    const ex = +(max * 0.5 + Math.random() * max * 0.5 ).toFixed(1);
    const avg = +((p * 0.1 + c1 * 0.25 + c2 * 0.25 + ex * 0.4) / 1).toFixed(2);
    return { subj, p, c1, c2, ex, avg: Math.min(avg, max) };
  });
};

const mockAbsences = [
  { date: '23/02/2026', type: 'Absent',    excused: false },
  { date: '17/02/2026', type: 'En retard', excused: true  },
  { date: '10/02/2026', type: 'Absent',    excused: true  },
  { date: '04/02/2026', type: 'En retard', excused: false },
  { date: '27/01/2026', type: 'Absent',    excused: false },
];

// ─── Shared card style ────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const th: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: '#6B7280',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid #F3F4F6',
  background: '#F9FAFB',
  whiteSpace: 'nowrap',
};

const td: React.CSSProperties = {
  padding: '12px 14px',
  fontSize: 13,
  color: '#374151',
  borderBottom: '1px solid #F3F4F6',
  whiteSpace: 'nowrap',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 14px',
  borderRadius: 10,
  border: '1.5px solid #D1D5DB',
  fontSize: 13,
  color: '#374151',
  background: 'white',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'var(--font)',
};

const smallBtnBase: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font)',
  transition: 'background 0.15s',
};

// ─── Modal Tabs ───────────────────────────────────────────────────────────────

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</div>
  </div>
);

const NotesTab: React.FC<{ student: Student }> = ({ student }) => {
  const grades = useMemo(() => makeGrades(student.level), [student.id]); // eslint-disable-line
  const max    = student.level === 'Primaire' ? 10 : 20;
  const trimAvg = +(grades.reduce((s, g) => s + g.avg, 0) / grades.length).toFixed(2);

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
      <thead>
        <tr>
          {['Matière', 'Participation', 'Compo 1', 'Compo 2', 'Examen', 'Moyenne'].map((h) => (
            <th key={h} style={th}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {grades.map((g, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
            <td style={td}><span style={{ fontWeight: 600 }}>{g.subj}</span></td>
            <td style={td}>{g.p}/{max * 0.2}</td>
            <td style={td}>{g.c1}/{max}</td>
            <td style={td}>{g.c2}/{max}</td>
            <td style={td}>{g.ex}/{max}</td>
            <td style={td}><span style={{ fontWeight: 700, color: avgColor(g.avg * (20 / max)) }}>{g.avg}</span></td>
          </tr>
        ))}
        <tr style={{ background: '#E8F0FF' }}>
          <td colSpan={5} style={{ ...td, fontWeight: 700, color: '#1A6BFF' }}>Moyenne trimestrielle</td>
          <td style={{ ...td, fontWeight: 800, color: '#1A6BFF', fontSize: 14 }}>{trimAvg}/{max}</td>
        </tr>
      </tbody>
    </table>
  );
};

const AbsencesTab: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
    {mockAbsences.map((a, i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: 10,
          background: '#F9FAFB',
          border: '1px solid #F3F4F6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18 }}>{a.type === 'Absent' ? '🔴' : '🟡'}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{a.type}</div>
            <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{a.date}</div>
          </div>
        </div>
        <Badge label={a.excused ? 'Justifiée' : 'Non justifiée'} color={a.excused ? 'green' : 'red'} />
      </div>
    ))}
  </div>
);

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const StudentModal: React.FC<{ student: Student | null; onClose: () => void }> = ({ student, onClose }) => {
  if (!student) return null;
  const name = fullName(student);
  const mainTeacher = classrooms.find((c) => c.name === student.className)?.teacher ?? '—';

  const infoItems: [string, React.ReactNode][] = [
    ['Date de naissance', '01/09/2010'],
    ['Classe',            <Badge label={student.className} color="blue" />],
    ['Niveau',            student.level],
    ['Enseignant principal', mainTeacher],
    ['Téléphone parent',  student.parentPhone],
    ['Nom du parent',     student.parentName],
    ["Taux de présence",  <span style={{ color: presenceColor(student.attendanceRate), fontWeight: 700 }}>{student.attendanceRate}%</span>],
    ['Statut',            <Badge {...statusBadge[student.status]} />],
  ];

  return (
    <Modal
      open={!!student}
      onCancel={onClose}
      footer={null}
      width={680}
      styles={{ body: { padding: '4px 0 0' } }}
    >
      {/* Modal header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <Avatar name={name} size={56} colorIndex={parseInt(student.id.replace('s', ''), 10) - 1} />
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1F2937', marginBottom: 4 }}>{name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Badge label={student.className} color="blue" />
            <span style={{ fontSize: 12, color: '#6B7280', fontFamily: 'monospace' }}>{student.studentId}</span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>· Inscrit le 03/09/2024</span>
          </div>
        </div>
      </div>

      <Tabs
        defaultActiveKey="info"
        items={[
          {
            key: 'info',
            label: 'Informations',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', paddingTop: 8 }}>
                {infoItems.map(([label, value]) => (
                  <InfoRow key={label} label={label} value={value} />
                ))}
              </div>
            ),
          },
          {
            key: 'notes',
            label: 'Notes',
            children: <NotesTab student={student} />,
          },
          {
            key: 'absences',
            label: 'Absences',
            children: <AbsencesTab />,
          },
        ]}
      />
    </Modal>
  );
};

// ─── Pagination ───────────────────────────────────────────────────────────────

const Pagination: React.FC<{
  total: number;
  page: number;
  onPage: (p: number) => void;
}> = ({ total, page, onPage }) => {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const displayed = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);
  const start = (page - 1) * PAGE_SIZE + 1;

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
      <span style={{ fontSize: 12, color: '#6B7280' }}>
        Affichage {start}–{displayed} sur {total} élèves
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        {pages.map((p) => (
          <PageBtn key={p} num={p} active={p === page} onClick={() => onPage(p)} />
        ))}
      </div>
    </div>
  );
};

const PageBtn: React.FC<{ num: number; active: boolean; onClick: () => void }> = ({ num, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: 32,
      height: 32,
      borderRadius: 8,
      border: active ? 'none' : '1.5px solid #D1D5DB',
      background: active ? '#1A6BFF' : 'white',
      color: active ? '#fff' : '#374151',
      fontSize: 13,
      fontWeight: active ? 700 : 400,
      cursor: 'pointer',
      fontFamily: 'var(--font)',
    }}
  >
    {num}
  </button>
);

// ─── Small action buttons ─────────────────────────────────────────────────────

const ActionBtn: React.FC<{ label: string; onClick?: () => void; outline?: boolean }> = ({ label, onClick, outline }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        ...smallBtnBase,
        background: outline ? (hov ? '#E8F0FF' : 'white') : (hov ? '#F3F4F6' : '#F9FAFB'),
        border: outline ? '1.5px solid #1A6BFF' : '1.5px solid #D1D5DB',
        color: outline ? '#1A6BFF' : '#374151',
      }}
    >
      {label}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentList: React.FC = () => {
  const [search,     setSearch]     = useState('');
  const [levelFilter,setLevelFilter]= useState('');
  const [classFilter,setClassFilter]= useState('');
  const [statusFilter,setStatusFilter]=useState('');
  const [page,       setPage]       = useState(1);
  const [selected,   setSelected]   = useState<Student | null>(null);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const name  = fullName(s).toLowerCase();
      const q     = search.toLowerCase();
      const matchQ = !q || name.includes(q) || s.studentId.toLowerCase().includes(q);
      const matchL = !levelFilter  || s.level     === levelFilter;
      const matchC = !classFilter  || s.className === classFilter;
      const matchS = !statusFilter || s.status    === statusFilter;
      return matchQ && matchL && matchC && matchS;
    });
  }, [search, levelFilter, classFilter, statusFilter]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const resetPage = () => setPage(1);

  // Primary button
  const [hPrimary, setHPrimary] = useState(false);
  const [hImport,  setHImport]  = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Gestion des Élèves"
        subtitle="284 élèves inscrits · 2025/2026"
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onMouseEnter={() => setHImport(true)}
              onMouseLeave={() => setHImport(false)}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: '1.5px solid #D1D5DB',
                background: hImport ? '#F3F4F6' : 'white',
                fontSize: 13,
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
              }}
            >
              📥 Import Excel
            </button>
            <button
              onMouseEnter={() => setHPrimary(true)}
              onMouseLeave={() => setHPrimary(false)}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: hPrimary ? '#1558d6' : '#1A6BFF',
                fontSize: 13,
                fontWeight: 600,
                color: 'white',
                cursor: 'pointer',
                fontFamily: 'var(--font)',
                transition: 'background 0.15s',
              }}
            >
              + Inscrire un élève
            </button>
          </div>
        }
      />

      <div style={card}>
        {/* Filter row */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          <SearchBar
            placeholder="Rechercher par nom, ID..."
            value={search}
            onChange={(v) => { setSearch(v); resetPage(); }}
            maxWidth={280}
          />

          <select
            style={selectStyle}
            value={levelFilter}
            onChange={(e) => { setLevelFilter(e.target.value); resetPage(); }}
          >
            <option value="">Tous les niveaux</option>
            <option value="Primaire">Primaire</option>
            <option value="Collège">Collège</option>
            <option value="Lycée">Lycée</option>
          </select>

          <select
            style={selectStyle}
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); resetPage(); }}
          >
            <option value="">Toutes les classes</option>
            {uniqueClasses.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            style={selectStyle}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="watch">En surveillance</option>
            <option value="suspended">Suspendu</option>
          </select>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Élève', 'ID', 'Classe', 'Parent', 'Téléphone', 'Présence', 'Moyenne', 'Statut', 'Actions'].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ ...td, textAlign: 'center', padding: 32, color: '#9CA3AF' }}>
                    Aucun élève trouvé
                  </td>
                </tr>
              ) : (
                paginated.map((s, i) => {
                  const name    = fullName(s);
                  const globalI = (page - 1) * PAGE_SIZE + i;
                  return (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar name={name} size={34} colorIndex={globalI} />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1F2937' }}>{name}</span>
                        </div>
                      </td>
                      <td style={td}>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6B7280' }}>
                          {s.studentId}
                        </span>
                      </td>
                      <td style={td}>
                        <Badge label={s.className} color="blue" />
                      </td>
                      <td style={td}>{s.parentName}</td>
                      <td style={{ ...td, fontSize: 12 }}>{s.parentPhone}</td>
                      <td style={td}>
                        <span style={{ fontWeight: 700, color: presenceColor(s.attendanceRate) }}>
                          {s.attendanceRate}%
                        </span>
                      </td>
                      <td style={td}>
                        <span style={{ fontWeight: 700, color: avgColor(s.average) }}>
                          {s.average.toFixed(1)}/20
                        </span>
                      </td>
                      <td style={td}>
                        <Badge {...statusBadge[s.status]} />
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <ActionBtn label="Voir" outline onClick={() => setSelected(s)} />
                          <ActionBtn label="⋯" />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination total={filtered.length} page={page} onPage={setPage} />
      </div>

      <StudentModal student={selected} onClose={() => setSelected(null)} />
    </div>
  );
};

export default StudentList;
