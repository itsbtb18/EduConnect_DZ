/**
 * AveragesTab — pivot table of student averages per subject + trimester.
 * Allows override, recalculate, publish, lock/unlock trimester.
 */
import React, { useMemo, useState } from 'react';
import {
  Table, Empty, Button, Space, Tag, Modal, Input, message, Tooltip, Alert,
} from 'antd';
import {
  LockOutlined, UnlockOutlined, CalculatorOutlined,
} from '@ant-design/icons';
import type { GradeFilters, SubjectAverage, TrimesterAverage, StudentAverageRow } from '../../../types/grades';
import type { ClassInfo, LevelSubject, StudentProfile } from '../../../types';
import AverageCell from '../components/AverageCell';
import LockBadge from '../components/LockBadge';
import RankBadge from '../components/RankBadge';
import PublishButton from '../components/PublishButton';
import {
  useSubjectAverages, useRecalcSubjectAverage, useOverrideSubjectAverage,
  usePublishSubjectAverage, useTrimesterAverages, useRecalcTrimesterAverage,
  useOverrideTrimesterAverage, usePublishTrimesterAverage,
  useLockTrimester, useUnlockTrimester,
  useLevelSubjects, useStudents,
} from '../../../hooks/useApi';

interface AveragesTabProps {
  filters: GradeFilters;
  classInfo: ClassInfo | null;
}

const AveragesTab: React.FC<AveragesTabProps> = ({ filters, classInfo }) => {
  const { classroomId, trimester } = filters;
  const levelId = classInfo?.level;
  const streamId = classInfo?.stream;

  // Lock confirmation
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [lockConfirmText, setLockConfirmText] = useState('');

  // Unlock confirmation
  const [unlockConfirmOpen, setUnlockConfirmOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('');

  // Fetch level-subjects
  const { data: levelSubjectsData } = useLevelSubjects(
    levelId ? { level: levelId, ...(streamId ? { stream: streamId } : {}) } : undefined,
  );
  const levelSubjects: LevelSubject[] = (levelSubjectsData?.results || []) as LevelSubject[];

  // Fetch students
  const { data: studentsData } = useStudents(
    classroomId ? { current_class: classroomId, page_size: 200 } : undefined,
  );
  const students: StudentProfile[] = (studentsData?.results || []) as StudentProfile[];

  // Fetch subject averages
  const { data: subjAvgData, isLoading: subjLoading } = useSubjectAverages(
    classroomId ? { classroom_id: classroomId, trimester } : undefined,
  );
  const subjectAverages: SubjectAverage[] = (subjAvgData?.results || []) as SubjectAverage[];

  // Fetch trimester averages
  const { data: trimAvgData, isLoading: trimLoading } = useTrimesterAverages(
    classroomId ? { classroom_id: classroomId, trimester } : undefined,
  );
  const trimesterAverages: TrimesterAverage[] = (trimAvgData?.results || []) as TrimesterAverage[];

  // Mutations
  const recalcSubjAvg = useRecalcSubjectAverage();
  const overrideSubjAvg = useOverrideSubjectAverage();
  const publishSubjAvg = usePublishSubjectAverage();
  const recalcTrimAvg = useRecalcTrimesterAverage();
  const overrideTrimAvg = useOverrideTrimesterAverage();
  const publishTrimAvg = usePublishTrimesterAverage();
  const lockTrim = useLockTrimester();
  const unlockTrim = useUnlockTrimester();

  // Is trimester locked?
  const isLocked = trimesterAverages.some(ta => ta.is_locked);
  const lockedInfo = trimesterAverages.find(ta => ta.is_locked);

  // Build pivot rows
  const rows: StudentAverageRow[] = useMemo(() => {
    return students.map(s => {
      const saMap: Record<string, SubjectAverage> = {};
      subjectAverages
        .filter(sa => sa.student === s.id)
        .forEach(sa => { saMap[sa.subject] = sa; });
      const ta = trimesterAverages.find(ta => ta.student === s.id) || null;
      return {
        studentId: s.id,
        studentName: `${s.last_name} ${s.first_name}`,
        subjectAverages: saMap,
        trimesterAverage: ta,
      };
    }).sort((a, b) => {
      // Sort by rank then by name
      const ra = a.trimesterAverage?.rank_in_class || 9999;
      const rb = b.trimesterAverage?.rank_in_class || 9999;
      if (ra !== rb) return ra - rb;
      return a.studentName.localeCompare(b.studentName);
    });
  }, [students, subjectAverages, trimesterAverages]);

  // All trimester averages published?
  const allTrimPublished = trimesterAverages.length > 0 && trimesterAverages.every(ta => ta.is_published);

  // Handlers
  const handleRecalcSubject = (subjectId: string) => {
    if (!classroomId) return;
    recalcSubjAvg.mutate({ classroom_id: classroomId, subject_id: subjectId, trimester });
  };

  const handleOverrideSubject = (avgId: string, newValue: number, reason: string) => {
    overrideSubjAvg.mutate({ subject_average_id: avgId, new_value: newValue, reason });
  };

  const handlePublishSubject = (subjectId: string) => {
    if (!classroomId) return;
    publishSubjAvg.mutate({ classroom_id: classroomId, subject_id: subjectId, trimester });
  };

  const handleRecalcTrimester = (avgId: string) => {
    if (!classroomId) return;
    recalcTrimAvg.mutate({ classroom_id: classroomId, trimester });
  };

  const handleOverrideTrimester = (avgId: string, newValue: number, reason: string) => {
    overrideTrimAvg.mutate({ trimester_average_id: avgId, new_value: newValue, reason });
  };

  const handlePublishAll = () => {
    if (!classroomId) return;
    publishTrimAvg.mutate({ classroom_id: classroomId, trimester });
  };

  const handleLock = () => {
    if (!classroomId || lockConfirmText !== 'CONFIRMER') return;
    lockTrim.mutate(
      { classroom_id: classroomId, trimester },
      { onSuccess: () => { setLockConfirmOpen(false); setLockConfirmText(''); } },
    );
  };

  const handleUnlock = () => {
    if (!classroomId || !unlockReason.trim()) return;
    unlockTrim.mutate(
      { classroom_id: classroomId, trimester, reason: unlockReason },
      { onSuccess: () => { setUnlockConfirmOpen(false); setUnlockReason(''); } },
    );
  };

  if (!classroomId) {
    return <Empty description="Sélectionnez une classe pour voir les moyennes" />;
  }

  // Build dynamic columns for each subject
  const subjectColumns = levelSubjects.map(ls => ({
    title: (
      <Tooltip title={`${ls.subject_name} (coeff. ${ls.coefficient})`}>
        <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{ls.subject_name}</div>
          <div style={{ fontSize: 10, color: '#999' }}>C:{ls.coefficient}</div>
        </div>
      </Tooltip>
    ),
    key: ls.subject,
    width: 110,
    render: (_: unknown, row: StudentAverageRow) => {
      const sa = row.subjectAverages[ls.subject];
      if (!sa) return <span style={{ color: '#ccc' }}>—</span>;
      return (
        <AverageCell
            id={sa.id}
            calculatedAverage={sa.calculated_average}
            manualOverride={sa.manual_override}
            effectiveAverage={sa.effective_average}
            isPublished={sa.is_published}
            isLocked={isLocked}
            onOverride={(avgId, val, reason) => handleOverrideSubject(avgId, val, reason)}
            onRecalculate={() => handleRecalcSubject(ls.subject)}
            onPublish={() => handlePublishSubject(ls.subject)}
          loading={recalcSubjAvg.isPending || overrideSubjAvg.isPending || publishSubjAvg.isPending}
        />
      );
    },
  }));

  const columns = [
    {
      title: '#',
      width: 50,
      fixed: 'left' as const,
      render: (_: unknown, __: unknown, index: number) => (
        <span style={{ color: '#999', fontSize: 12 }}>{index + 1}</span>
      ),
    },
    {
      title: 'Élève',
      key: 'student',
      width: 180,
      fixed: 'left' as const,
      render: (_: unknown, row: StudentAverageRow) => (
        <span style={{ fontWeight: 500, color: '#0F2044' }}>{row.studentName}</span>
      ),
    },
    ...subjectColumns,
    {
      title: (
        <div style={{ textAlign: 'center', lineHeight: 1.2, fontWeight: 700, color: '#00C9A7' }}>
          Moy. Gén.
        </div>
      ),
      key: 'trimester_avg',
      width: 120,
      render: (_: unknown, row: StudentAverageRow) => {
        const ta = row.trimesterAverage;
        if (!ta) return <span style={{ color: '#ccc' }}>—</span>;
        return (
          <AverageCell
            id={ta.id}
            calculatedAverage={ta.calculated_average}
            manualOverride={ta.manual_override}
            effectiveAverage={ta.effective_average}
            isPublished={ta.is_published}
            isLocked={isLocked}
            onOverride={(avgId, val, reason) => handleOverrideTrimester(avgId, val, reason)}
            onRecalculate={() => handleRecalcTrimester(ta.id)}
            onPublish={handlePublishAll}
            loading={recalcTrimAvg.isPending || overrideTrimAvg.isPending}
          />
        );
      },
    },
    {
      title: 'Rang',
      key: 'rank',
      width: 90,
      render: (_: unknown, row: StudentAverageRow) => {
        if (!row.trimesterAverage?.rank_in_class) return <span style={{ color: '#ccc' }}>—</span>;
        return (
          <RankBadge
            rank={row.trimesterAverage.rank_in_class}
            total={students.length}
          />
        );
      },
      sorter: (a: StudentAverageRow, b: StudentAverageRow) =>
        (a.trimesterAverage?.rank_in_class || 9999) - (b.trimesterAverage?.rank_in_class || 9999),
    },
    {
      title: 'Appréciation',
      key: 'appreciation',
      width: 150,
      render: (_: unknown, row: StudentAverageRow) => (
        <span style={{ fontSize: 12, color: '#4A5568' }}>
          {row.trimesterAverage?.appreciation || '—'}
        </span>
      ),
    },
  ];

  return (
    <div>
      {/* Lock status bar */}
      {isLocked && lockedInfo && (
        <Alert
          type="warning"
          showIcon
          icon={<LockOutlined />}
          message={
            <Space>
              <LockBadge
                isLocked
                lockedAt={lockedInfo.locked_at || undefined}
                canUnlock
                onUnlock={() => setUnlockConfirmOpen(true)}
              />
              <span>Le trimestre est verrouillé. Les notes ne peuvent plus être modifiées.</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Top action bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, flexWrap: 'wrap', gap: 8,
      }}>
        <Space>
          <Button
            icon={<CalculatorOutlined />}
            onClick={() => {
              if (!classroomId) return;
              recalcTrimAvg.mutate({ classroom_id: classroomId, trimester });
            }}
            loading={recalcTrimAvg.isPending}
            disabled={isLocked}
          >
            Recalculer tout
          </Button>
          <Tag color={allTrimPublished ? 'green' : 'default'}>
            {trimesterAverages.filter(ta => ta.is_published).length}/{trimesterAverages.length} publiées
          </Tag>
        </Space>
        <Space>
          <PublishButton
            published={allTrimPublished}
            onPublish={handlePublishAll}
            loading={publishTrimAvg.isPending}
            disabled={trimesterAverages.length === 0 || isLocked}
            label="Publier toutes les moyennes"
            confirmMessage="Publier toutes les moyennes du trimestre ? Les parents/élèves pourront les consulter."
          />
          {!isLocked ? (
            <Button
              icon={<LockOutlined />}
              onClick={() => setLockConfirmOpen(true)}
              disabled={!allTrimPublished}
              style={allTrimPublished ? { background: '#EF4444', borderColor: '#EF4444', color: '#fff' } : undefined}
            >
              Verrouiller le trimestre
            </Button>
          ) : (
            <Button
              icon={<UnlockOutlined />}
              onClick={() => setUnlockConfirmOpen(true)}
              style={{ background: '#F59E0B', borderColor: '#F59E0B', color: '#fff' }}
            >
              Déverrouiller (urgence)
            </Button>
          )}
        </Space>
      </div>

      {/* Pivot table */}
      <Table
        dataSource={rows}
        columns={columns}
        rowKey="studentId"
        size="small"
        pagination={false}
        loading={subjLoading || trimLoading}
        scroll={{ x: 300 + levelSubjects.length * 110 + 500, y: 500 }}
        bordered
      />

      {/* Lock confirmation modal */}
      <Modal
        title="Verrouiller le trimestre"
        open={lockConfirmOpen}
        onCancel={() => { setLockConfirmOpen(false); setLockConfirmText(''); }}
        onOk={handleLock}
        okText="Verrouiller"
        cancelText="Annuler"
        okButtonProps={{
          danger: true,
          disabled: lockConfirmText !== 'CONFIRMER',
          loading: lockTrim.isPending,
        }}
      >
        <Alert
          type="error"
          showIcon
          message="Action irréversible (sauf déverrouillage d'urgence)"
          description="Une fois verrouillé, aucune note ou moyenne ne pourra être modifiée pour ce trimestre."
          style={{ marginBottom: 16 }}
        />
        <p>Tapez <strong>CONFIRMER</strong> pour verrouiller :</p>
        <Input
          value={lockConfirmText}
          onChange={e => setLockConfirmText(e.target.value)}
          placeholder="Tapez CONFIRMER"
          status={lockConfirmText && lockConfirmText !== 'CONFIRMER' ? 'error' : undefined}
        />
      </Modal>

      {/* Unlock confirmation modal */}
      <Modal
        title="Déverrouiller le trimestre (urgence)"
        open={unlockConfirmOpen}
        onCancel={() => { setUnlockConfirmOpen(false); setUnlockReason(''); }}
        onOk={handleUnlock}
        okText="Déverrouiller"
        cancelText="Annuler"
        okButtonProps={{
          disabled: !unlockReason.trim(),
          loading: unlockTrim.isPending,
          style: { background: '#F59E0B', borderColor: '#F59E0B' },
        }}
      >
        <Alert
          type="warning"
          showIcon
          message="Cette action sera consignée dans le journal d'audit"
          style={{ marginBottom: 16 }}
        />
        <p>Raison du déverrouillage :</p>
        <Input.TextArea
          rows={3}
          value={unlockReason}
          onChange={e => setUnlockReason(e.target.value)}
          placeholder="Expliquez pourquoi le trimestre doit être déverrouillé..."
        />
      </Modal>
    </div>
  );
};

export default AveragesTab;
