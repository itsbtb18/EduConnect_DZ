import React, { useState } from 'react';
import { Modal, Tabs } from 'antd';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import { students, grades } from '../../data/mockData';
import type { Student } from '../../types';

const AVATAR_COLORS = ['#1A6BFF', '#FF6B35', '#00C48C', '#FFB800', '#9B59B6', '#E74C3C'];

const StudentList: React.FC = () => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);

  const filtered = students.filter((s) => {
    const matchSearch =
      !search ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase());
    const matchLevel = !levelFilter || s.level === levelFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchLevel && matchStatus;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Gestion des Élèves"
        subtitle="284 élèves inscrits · 2025/2026"
        actions={
          <>
            <button style={btn('outline')}>📥 Import Excel</button>
            <button style={btn('primary')}>+ Inscrire un élève</button>
          </>
        }
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <SearchBar placeholder="Rechercher par nom, ID..." value={search} onChange={setSearch} />
        <select style={selectStyle} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
          <option value="">Tous les niveaux</option>
          <option value="Primaire">Primaire</option>
          <option value="Collège">Collège</option>
          <option value="Lycée">Lycée</option>
        </select>
        <select style={selectStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="watch">Attention</option>
          <option value="suspended">Suspendu</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Élève', 'ID', 'Classe', 'Parent', 'Téléphone', 'Présence', 'Moyenne', 'Statut', 'Actions'].map(
                  (h) => (
                    <th key={h} style={th}>
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={`${s.firstName} ${s.lastName}`} size={34} color={AVATAR_COLORS[i % 6]} />
                      <span style={{ fontWeight: 600, color: '#1F2937' }}>
                        {s.firstName} {s.lastName}
                      </span>
                    </div>
                  </td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: 12 }}>{s.studentId}</td>
                  <td style={td}>
                    <Badge label={s.class} color="blue" />
                  </td>
                  <td style={{ ...td, fontSize: 12 }}>{s.parentName}</td>
                  <td style={{ ...td, fontSize: 12 }}>{s.parentPhone}</td>
                  <td style={td}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: s.attendanceRate >= 90 ? '#00C48C' : s.attendanceRate >= 75 ? '#FFB800' : '#FF4757',
                      }}
                    >
                      {s.attendanceRate}%
                    </span>
                  </td>
                  <td
                    style={{
                      ...td,
                      fontWeight: 700,
                      color: s.average >= 14 ? '#00C48C' : s.average >= 10 ? '#1A6BFF' : '#FF4757',
                    }}
                  >
                    {s.average}/20
                  </td>
                  <td style={td}>
                    <Badge
                      label={s.status === 'active' ? 'Actif' : s.status === 'watch' ? 'Attention' : 'Suspendu'}
                      color={s.status === 'active' ? 'green' : s.status === 'watch' ? 'yellow' : 'red'}
                    />
                  </td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={btn('outline')} onClick={() => setSelected(s)}>
                        Voir
                      </button>
                      <button style={btn('secondary')}>⋯</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '0 4px' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            Affichage {filtered.length} sur 284 élèves
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['‹', '1', '2', '3', '...', '48', '›'].map((p, i) => (
              <button
                key={i}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  border: `1px solid ${p === '1' ? '#1A6BFF' : '#D1D5DB'}`,
                  background: p === '1' ? '#1A6BFF' : '#fff',
                  color: p === '1' ? '#fff' : '#374151',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student Detail Modal */}
      <Modal
        open={!!selected}
        onCancel={() => setSelected(null)}
        footer={null}
        width={700}
        title={null}
        styles={{ body: { padding: 0 } }}
      >
        {selected && <StudentDetail student={selected} />}
      </Modal>
    </div>
  );
};

/* ── Student Detail ───────────────────────────────── */

const StudentDetail: React.FC<{ student: Student }> = ({ student }) => {
  const studentGrades = grades.filter((g) => g.studentId === student.id);

  return (
    <div style={{ padding: 24 }}>
      {/* Profile header */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 24 }}>
        <Avatar name={`${student.firstName} ${student.lastName}`} size={64} />
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1F2937', margin: 0 }}>
            {student.firstName} {student.lastName}
          </h2>
          <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            {student.studentId} · {student.class} · {student.level}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            Inscrit le {student.enrollmentDate}
          </div>
          <div style={{ marginTop: 8 }}>
            <Badge
              label={student.status === 'active' ? 'Actif' : student.status === 'watch' ? 'Attention' : 'Suspendu'}
              color={student.status === 'active' ? 'green' : student.status === 'watch' ? 'yellow' : 'red'}
            />
          </div>
        </div>
      </div>

      <Tabs
        items={[
          {
            key: 'info',
            label: 'Infos',
            children: (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <InfoRow label="Parent" value={student.parentName} />
                <InfoRow label="Téléphone" value={student.parentPhone} />
                <InfoRow label="Classe" value={student.class} />
                <InfoRow label="Niveau" value={student.level} />
                <InfoRow label="Présence" value={`${student.attendanceRate}%`} />
                <InfoRow label="Moyenne" value={`${student.average}/20`} />
              </div>
            ),
          },
          {
            key: 'grades',
            label: 'Notes',
            children: studentGrades.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Matière', 'Continu', 'Comp. 1', 'Comp. 2', 'Examen', 'Moyenne'].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentGrades.map((g) => (
                    <tr key={g.id}>
                      <td style={{ ...td, fontWeight: 600 }}>{g.subject}</td>
                      <td style={td}>{g.continuous}</td>
                      <td style={td}>{g.test1}</td>
                      <td style={td}>{g.test2}</td>
                      <td style={td}>{g.final}</td>
                      <td style={{ ...td, fontWeight: 700, color: g.average >= 14 ? '#00C48C' : g.average >= 10 ? '#1A6BFF' : '#FF4757' }}>
                        {g.average}/20
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: '#6B7280', padding: 20 }}>Aucune note disponible</div>
            ),
          },
          {
            key: 'absences',
            label: 'Absences',
            children: <div style={{ color: '#6B7280', padding: 20 }}>Historique des absences</div>,
          },
          {
            key: 'behavior',
            label: 'Comportement',
            children: <div style={{ color: '#6B7280', padding: 20 }}>Notes de comportement</div>,
          },
        ]}
      />
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{value}</div>
  </div>
);

/* ── Shared styles ───────────────────────────────── */

const th: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #F3F4F6', background: '#F9FAFB',
};
const td: React.CSSProperties = {
  padding: '12px 14px', fontSize: 13, color: '#374151', borderBottom: '1px solid #F3F4F6',
};
const selectStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10, border: '1.5px solid #D1D5DB', fontSize: 13, color: '#374151',
  background: '#fff', outline: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
};

function btn(variant: 'primary' | 'outline' | 'ghost' | 'secondary' = 'primary'): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif",
  };
  switch (variant) {
    case 'primary': return { ...base, background: '#1A6BFF', color: '#fff' };
    case 'outline': return { ...base, background: '#fff', color: '#1A6BFF', border: '1.5px solid #1A6BFF' };
    case 'ghost': return { ...base, background: 'transparent', color: '#1A6BFF' };
    case 'secondary': return { ...base, background: '#F3F4F6', color: '#374151' };
  }
}

export default StudentList;
