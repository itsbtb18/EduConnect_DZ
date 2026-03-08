/**
 * GradeEntryTab — bulk grade entry table per exam type.
 * Select subject + exam type, then enter grades for all students.
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Table, Select, Empty, Button, Space, Tag, Alert, message,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import type { GradeFilters, ExamType, GradeEntry, GradeBulkItem } from '../../../types/grades';
import type { ClassInfo, LevelSubject, StudentProfile } from '../../../types';
import GradeInput from '../components/GradeInput';
import PublishButton from '../components/PublishButton';
import {
  useExamTypes, useBulkEnterGrades, usePublishGrades,
  useLevelSubjects, useStudents, useGrades,
} from '../../../hooks/useApi';

interface GradeEntryTabProps {
  filters: GradeFilters;
  classInfo: ClassInfo | null;
}

interface LocalGrade {
  studentId: string;
  score: number | null;
  isAbsent: boolean;
  dirty: boolean;
}

const GradeEntryTab: React.FC<GradeEntryTabProps> = ({ filters, classInfo }) => {
  const { classroomId, trimester } = filters;

  // Selected subject + exam type
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null);

  // Local grade edits
  const [localGrades, setLocalGrades] = useState<Record<string, LocalGrade>>({});

  // Fetch subjects for this level
  const levelId = classInfo?.level;
  const streamId = classInfo?.stream;
  const { data: levelSubjectsData } = useLevelSubjects(
    levelId ? { level: levelId, ...(streamId ? { stream: streamId } : {}) } : undefined,
  );
  const levelSubjects: LevelSubject[] = (levelSubjectsData?.results || []) as LevelSubject[];

  // Fetch exam types for this classroom + trimester
  const { data: examTypesData } = useExamTypes(
    classroomId ? { classroom_id: classroomId, trimester } : undefined,
  );
  const allExamTypes: ExamType[] = (examTypesData?.results || []) as ExamType[];

  // Filter exam types for selected subject
  const subjectExamTypes = useMemo(
    () => allExamTypes.filter(et => et.subject === selectedSubject),
    [allExamTypes, selectedSubject],
  );

  // Get current exam type object
  const currentExamType = useMemo(
    () => allExamTypes.find(et => et.id === selectedExamType),
    [allExamTypes, selectedExamType],
  );

  // Fetch students in this class
  const { data: studentsData } = useStudents(
    classroomId ? { current_class: classroomId, page_size: 200 } : undefined,
  );
  const students: StudentProfile[] = (studentsData?.results || []) as StudentProfile[];

  // Fetch existing grades for this exam type
  const { data: gradesData, isLoading: gradesLoading, refetch: refetchGrades } = useGrades(
    selectedExamType ? { exam_type: selectedExamType, page_size: 200 } : undefined,
  );
  const existingGrades: GradeEntry[] = (gradesData?.results || []) as GradeEntry[];

  const bulkEnter = useBulkEnterGrades();
  const publishGrades = usePublishGrades();

  // Initialize local grades from existing data when exam type changes
  const gradeMap = useMemo(() => {
    const map: Record<string, GradeEntry> = {};
    for (const g of existingGrades) {
      map[g.student] = g;
    }
    return map;
  }, [existingGrades]);

  // Get effective grade for a student (local override or existing)
  const getStudentGrade = useCallback((studentId: string): { score: number | null; isAbsent: boolean; dirty: boolean } => {
    if (localGrades[studentId]) {
      return localGrades[studentId];
    }
    const existing = gradeMap[studentId];
    if (existing) {
      return { score: existing.score, isAbsent: existing.is_absent, dirty: false };
    }
    return { score: null, isAbsent: false, dirty: false };
  }, [localGrades, gradeMap]);

  const handleScoreChange = (studentId: string, score: number | null) => {
    setLocalGrades(prev => ({
      ...prev,
      [studentId]: { ...getStudentGrade(studentId), studentId, score, dirty: true },
    }));
  };

  const handleAbsentChange = (studentId: string, isAbsent: boolean) => {
    setLocalGrades(prev => ({
      ...prev,
      [studentId]: {
        ...getStudentGrade(studentId),
        studentId,
        isAbsent,
        score: isAbsent ? null : getStudentGrade(studentId).score,
        dirty: true,
      },
    }));
  };

  const dirtyCount = useMemo(
    () => Object.values(localGrades).filter(g => g.dirty).length,
    [localGrades],
  );

  const handleSave = async () => {
    if (!selectedExamType) return;
    // Build payload: all students (dirty + unchanged)
    const grades: GradeBulkItem[] = students.map(s => {
      const g = getStudentGrade(s.id);
      return { student_id: s.id, score: g.score, is_absent: g.isAbsent };
    });
    try {
      await bulkEnter.mutateAsync({ exam_type_id: selectedExamType, grades });
      setLocalGrades({});
      refetchGrades();
      message.success('Notes enregistrées avec succès');
    } catch { /* handled by hook */ }
  };

  const handlePublish = async () => {
    if (!selectedExamType) return;
    try {
      await publishGrades.mutateAsync({ exam_type_id: selectedExamType });
    } catch { /* handled */ }
  };

  // Check if all grades for this exam type are published
  const allPublished = existingGrades.length > 0 && existingGrades.every(g => g.is_published);

  // Stats
  const filledCount = students.filter(s => {
    const g = getStudentGrade(s.id);
    return g.score !== null || g.isAbsent;
  }).length;
  const absentCount = students.filter(s => getStudentGrade(s.id).isAbsent).length;

  if (!classroomId) {
    return <Empty description="Sélectionnez une classe pour saisir les notes" />;
  }

  const columns = [
    {
      title: '#',
      width: 50,
      render: (_: unknown, __: unknown, index: number) => (
        <span style={{ color: '#999', fontSize: 12 }}>{index + 1}</span>
      ),
    },
    {
      title: 'Élève',
      key: 'student',
      render: (_: unknown, record: StudentProfile) => (
        <span style={{ fontWeight: 500, color: '#0F2044' }}>
          {record.last_name} {record.first_name}
        </span>
      ),
      sorter: (a: StudentProfile, b: StudentProfile) =>
        `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`),
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: `Note /${currentExamType?.max_score || 20}`,
      key: 'grade',
      width: 220,
      render: (_: unknown, record: StudentProfile) => {
        const g = getStudentGrade(record.id);
        return (
          <GradeInput
            value={g.score}
            maxScore={currentExamType?.max_score || 20}
            isAbsent={g.isAbsent}
            disabled={!selectedExamType || allPublished}
            onChange={(v) => handleScoreChange(record.id, v)}
            onAbsentChange={(a) => handleAbsentChange(record.id, a)}
          />
        );
      },
    },
    {
      title: 'Statut',
      key: 'status',
      width: 100,
      render: (_: unknown, record: StudentProfile) => {
        const existing = gradeMap[record.id];
        const local = localGrades[record.id];
        if (local?.dirty) return <Tag color="orange">Modifié</Tag>;
        if (existing?.is_published) return <Tag color="green">Publié</Tag>;
        if (existing) return <Tag color="blue">Enregistré</Tag>;
        return <Tag>Vide</Tag>;
      },
    },
  ];

  return (
    <div>
      {/* Subject + exam type selectors */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <Select
          placeholder="Matière"
          value={selectedSubject}
          onChange={(v) => {
            setSelectedSubject(v);
            setSelectedExamType(null);
            setLocalGrades({});
          }}
          style={{ width: 220 }}
          allowClear
          options={levelSubjects.map(ls => ({
            value: ls.subject,
            label: ls.subject_name || ls.subject,
          }))}
        />
        <Select
          placeholder="Type d'examen"
          value={selectedExamType}
          onChange={(v) => {
            setSelectedExamType(v);
            setLocalGrades({});
          }}
          style={{ width: 250 }}
          allowClear
          disabled={!selectedSubject}
          options={subjectExamTypes.map(et => ({
            value: et.id,
            label: `${et.name} (${Number(et.percentage)}% — /${et.max_score})`,
          }))}
        />

        {selectedExamType && (
          <>
            <div style={{ flex: 1 }} />
            <Space>
              <Tag color="blue">
                {filledCount}/{students.length} saisis
              </Tag>
              {absentCount > 0 && (
                <Tag color="volcano">{absentCount} absent(s)</Tag>
              )}
              {dirtyCount > 0 && (
                <Tag color="orange">{dirtyCount} modification(s)</Tag>
              )}
            </Space>
          </>
        )}
      </div>

      {!selectedExamType && selectedSubject && subjectExamTypes.length === 0 && (
        <Alert
          type="warning"
          showIcon
          message="Aucun type d'examen configuré pour cette matière."
          description="Allez dans l'onglet « Types d'Examens » pour en créer."
          style={{ marginBottom: 16 }}
        />
      )}

      {!selectedExamType ? (
        <Empty description="Sélectionnez une matière et un type d'examen pour saisir les notes" />
      ) : (
        <>
          <Table
            dataSource={[...students].sort((a, b) =>
              `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
            )}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            loading={gradesLoading}
            scroll={{ y: 500 }}
            rowClassName={(record) => {
              const g = getStudentGrade(record.id);
              if (g.isAbsent) return 'grade-row--absent';
              if (localGrades[record.id]?.dirty) return 'grade-row--dirty';
              return '';
            }}
          />

          {/* Action bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, padding: '12px 16px',
            background: '#F7F9FC', borderRadius: 10,
          }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setLocalGrades({});
                  refetchGrades();
                }}
                disabled={dirtyCount === 0 && !bulkEnter.isPending}
              >
                Réinitialiser
              </Button>
            </Space>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={bulkEnter.isPending}
                disabled={dirtyCount === 0}
                style={{ background: '#00C9A7', borderColor: '#00C9A7' }}
              >
                Enregistrer ({dirtyCount})
              </Button>
              <PublishButton
                published={allPublished}
                onPublish={handlePublish}
                loading={publishGrades.isPending}
                disabled={existingGrades.length === 0 || dirtyCount > 0}
              />
            </Space>
          </div>
        </>
      )}
    </div>
  );
};

export default GradeEntryTab;
