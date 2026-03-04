/**
 * ExamTypesTab — configure exam types per subject with percentage validation.
 * Grouped by subject, shows percentage progress bar, inline add/edit.
 */
import React, { useState, useMemo } from 'react';
import {
  Table, Button, Tag, InputNumber, Input, Space, Popconfirm,
  Progress, Empty, Tooltip, message, Select,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined,
} from '@ant-design/icons';
import type { GradeFilters, ExamType, ExamTypeCreatePayload } from '../../../types/grades';
import {
  useExamTypes, useCreateExamType, useUpdateExamType, useDeleteExamType,
  useLevelSubjects,
} from '../../../hooks/useApi';
import type { LevelSubject, ClassInfo } from '../../../types';

interface ExamTypesTabProps {
  filters: GradeFilters;
  classInfo: ClassInfo | null;
}

const ExamTypesTab: React.FC<ExamTypesTabProps> = ({ filters, classInfo }) => {
  const { classroomId, trimester } = filters;

  // Fetch exam types for this classroom + trimester
  const { data: examTypesData, isLoading } = useExamTypes(
    classroomId ? { classroom_id: classroomId, trimester } : undefined,
  );
  const examTypes: ExamType[] = (examTypesData?.results || []) as ExamType[];

  // Fetch subjects assigned to this level
  const levelId = classInfo?.level;
  const streamId = classInfo?.stream;
  const { data: levelSubjectsData } = useLevelSubjects(
    levelId ? { level: levelId, ...(streamId ? { stream: streamId } : {}) } : undefined,
  );
  const levelSubjects: LevelSubject[] = (levelSubjectsData?.results || []) as LevelSubject[];

  const createExamType = useCreateExamType();
  const updateExamType = useUpdateExamType();
  const deleteExamType = useDeleteExamType();

  // Inline add state
  const [addingForSubject, setAddingForSubject] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPercentage, setNewPercentage] = useState<number>(0);
  const [newMaxScore, setNewMaxScore] = useState<number>(20);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPercentage, setEditPercentage] = useState<number>(0);
  const [editMaxScore, setEditMaxScore] = useState<number>(20);

  // Quick-add subject selector for when there are no exam types for a subject yet
  const [quickAddSubject, setQuickAddSubject] = useState<string | null>(null);

  // Group exam types by subject
  const grouped = useMemo(() => {
    const map: Record<string, { subjectId: string; subjectName: string; coefficient: number; items: ExamType[]; totalPct: number }> = {};
    for (const et of examTypes) {
      if (!map[et.subject]) {
        map[et.subject] = { subjectId: et.subject, subjectName: et.subject_name, coefficient: 0, items: [], totalPct: 0 };
      }
      map[et.subject].items.push(et);
      map[et.subject].totalPct += Number(et.percentage);
    }
    // Add coefficient from level-subjects
    for (const ls of levelSubjects) {
      if (map[ls.subject]) {
        map[ls.subject].coefficient = ls.coefficient;
      }
    }
    return map;
  }, [examTypes, levelSubjects]);

  // Subjects that have no exam types yet
  const subjectsWithoutTypes = useMemo(() => {
    return levelSubjects.filter(ls => !grouped[ls.subject]);
  }, [levelSubjects, grouped]);

  const handleAdd = async (subjectId: string) => {
    if (!classroomId || !newName.trim()) return;
    const payload: ExamTypeCreatePayload = {
      subject: subjectId,
      classroom: classroomId,
      academic_year: classInfo?.academic_year || '',
      trimester,
      name: newName.trim(),
      percentage: newPercentage,
      max_score: newMaxScore,
    };
    try {
      await createExamType.mutateAsync({ ...payload } as Record<string, unknown>);
      setAddingForSubject(null);
      setNewName('');
      setNewPercentage(0);
      setNewMaxScore(20);
    } catch { /* error shown by hook */ }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateExamType.mutateAsync({
        id,
        data: { name: editName, percentage: editPercentage, max_score: editMaxScore },
      });
      setEditingId(null);
    } catch { /* handled */ }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteExamType.mutateAsync(id);
    } catch { /* handled */ }
  };

  const handleQuickAdd = () => {
    if (quickAddSubject) {
      setAddingForSubject(quickAddSubject);
      setQuickAddSubject(null);
    }
  };

  if (!classroomId) {
    return <Empty description="Sélectionnez une classe pour configurer les types d'examens" />;
  }

  const pctColor = (pct: number) => {
    if (pct === 100) return '#10B981';
    if (pct > 100) return '#EF4444';
    return '#F59E0B';
  };

  const pctStatus = (pct: number): 'success' | 'exception' | 'active' => {
    if (pct === 100) return 'success';
    if (pct > 100) return 'exception';
    return 'active';
  };

  return (
    <div>
      {/* Quick-add new subject */}
      {subjectsWithoutTypes.length > 0 && (
        <div style={{
          display: 'flex', gap: 8, marginBottom: 16, padding: '12px 16px',
          background: '#F7F9FC', borderRadius: 10, border: '1px dashed #E2E8F0',
        }}>
          <Select
            placeholder="Ajouter un type d'examen pour une matière..."
            value={quickAddSubject}
            onChange={setQuickAddSubject}
            style={{ flex: 1 }}
            allowClear
            options={subjectsWithoutTypes.map(ls => ({
              value: ls.subject,
              label: `${ls.subject_name} (coeff. ${ls.coefficient})`,
            }))}
          />
          <Button icon={<PlusOutlined />} onClick={handleQuickAdd} disabled={!quickAddSubject}>
            Configurer
          </Button>
        </div>
      )}

      {/* Per-subject groups */}
      {Object.values(grouped).map(grp => (
        <div key={grp.subjectId} style={{
          background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0',
          padding: 16, marginBottom: 16,
        }}>
          {/* Subject header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#0F2044' }}>{grp.subjectName}</span>
              <Tag color="blue" style={{ marginLeft: 8 }}>Coeff. {grp.coefficient}</Tag>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
              <Progress
                percent={Math.min(grp.totalPct, 100)}
                status={pctStatus(grp.totalPct)}
                size="small"
                strokeColor={pctColor(grp.totalPct)}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <Tag color={pctColor(grp.totalPct)} style={{ fontWeight: 600 }}>
                {grp.totalPct}%
              </Tag>
            </div>
          </div>

          {/* Exam types table */}
          <Table
            dataSource={grp.items}
            rowKey="id"
            size="small"
            pagination={false}
            columns={[
              {
                title: 'Type d\'examen',
                dataIndex: 'name',
                render: (text: string, record: ExamType) => {
                  if (editingId === record.id) {
                    return (
                      <Input
                        size="small"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        style={{ width: 160 }}
                      />
                    );
                  }
                  return <span style={{ fontWeight: 500 }}>{text}</span>;
                },
              },
              {
                title: 'Pourcentage (%)',
                dataIndex: 'percentage',
                width: 140,
                render: (val: number, record: ExamType) => {
                  if (editingId === record.id) {
                    return (
                      <InputNumber
                        size="small"
                        min={0}
                        max={100}
                        value={editPercentage}
                        onChange={v => setEditPercentage(v as number)}
                        style={{ width: 80 }}
                        suffix="%"
                      />
                    );
                  }
                  return <Tag>{Number(val)}%</Tag>;
                },
              },
              {
                title: 'Barème',
                dataIndex: 'max_score',
                width: 110,
                render: (val: number, record: ExamType) => {
                  if (editingId === record.id) {
                    return (
                      <InputNumber
                        size="small"
                        min={1}
                        max={100}
                        value={editMaxScore}
                        onChange={v => setEditMaxScore(v as number)}
                        style={{ width: 70 }}
                      />
                    );
                  }
                  return `/${val}`;
                },
              },
              {
                title: '',
                width: 100,
                render: (_: unknown, record: ExamType) => {
                  if (editingId === record.id) {
                    return (
                      <Space size={4}>
                        <Button
                          size="small" type="primary" icon={<CheckOutlined />}
                          onClick={() => handleUpdate(record.id)}
                          loading={updateExamType.isPending}
                          style={{ background: '#10B981', borderColor: '#10B981' }}
                        />
                        <Button
                          size="small" icon={<CloseOutlined />}
                          onClick={() => setEditingId(null)}
                        />
                      </Space>
                    );
                  }
                  return (
                    <Space size={4}>
                      <Tooltip title="Modifier">
                        <Button
                          size="small" icon={<EditOutlined />}
                          onClick={() => {
                            setEditingId(record.id);
                            setEditName(record.name);
                            setEditPercentage(Number(record.percentage));
                            setEditMaxScore(record.max_score);
                          }}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Supprimer ce type d'examen ?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Supprimer"
                        cancelText="Annuler"
                        okButtonProps={{ danger: true }}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  );
                },
              },
            ]}
          />

          {/* Inline add row */}
          {addingForSubject === grp.subjectId ? (
            <div style={{
              display: 'flex', gap: 8, marginTop: 8, padding: '8px 12px',
              background: '#F7F9FC', borderRadius: 8,
            }}>
              <Input
                size="small"
                placeholder="Nom (ex: Devoir surveillé 1)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ flex: 1 }}
                onPressEnter={() => handleAdd(grp.subjectId)}
                autoFocus
              />
              <InputNumber
                size="small" min={0} max={100}
                value={newPercentage}
                onChange={v => setNewPercentage(v as number)}
                style={{ width: 80 }}
                placeholder="%"
                addonAfter="%"
              />
              <InputNumber
                size="small" min={1} max={100}
                value={newMaxScore}
                onChange={v => setNewMaxScore(v as number)}
                style={{ width: 70 }}
                placeholder="/20"
                addonBefore="/"
              />
              <Button
                size="small" type="primary" icon={<CheckOutlined />}
                onClick={() => handleAdd(grp.subjectId)}
                loading={createExamType.isPending}
                disabled={!newName.trim() || newPercentage <= 0}
                style={{ background: '#00C9A7', borderColor: '#00C9A7' }}
              />
              <Button
                size="small" icon={<CloseOutlined />}
                onClick={() => {
                  setAddingForSubject(null);
                  setNewName('');
                  setNewPercentage(0);
                  setNewMaxScore(20);
                }}
              />
            </div>
          ) : (
            <Button
              type="dashed" size="small" icon={<PlusOutlined />}
              onClick={() => setAddingForSubject(grp.subjectId)}
              style={{ marginTop: 8 }}
            >
              Ajouter un type
            </Button>
          )}
        </div>
      ))}

      {/* When adding for a subject that doesn't have exam types yet */}
      {addingForSubject && !grouped[addingForSubject] && (
        <div style={{
          background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0',
          padding: 16, marginBottom: 16,
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#0F2044', marginBottom: 12 }}>
            {levelSubjects.find(ls => ls.subject === addingForSubject)?.subject_name || 'Matière'}
          </div>
          <div style={{
            display: 'flex', gap: 8, padding: '8px 12px',
            background: '#F7F9FC', borderRadius: 8,
          }}>
            <Input
              size="small"
              placeholder="Nom (ex: Devoir surveillé 1)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              style={{ flex: 1 }}
              onPressEnter={() => handleAdd(addingForSubject)}
              autoFocus
            />
            <InputNumber
              size="small" min={0} max={100}
              value={newPercentage}
              onChange={v => setNewPercentage(v as number)}
              style={{ width: 80 }}
              addonAfter="%"
            />
            <InputNumber
              size="small" min={1} max={100}
              value={newMaxScore}
              onChange={v => setNewMaxScore(v as number)}
              style={{ width: 70 }}
              addonBefore="/"
            />
            <Button
              size="small" type="primary" icon={<CheckOutlined />}
              onClick={() => handleAdd(addingForSubject)}
              loading={createExamType.isPending}
              disabled={!newName.trim() || newPercentage <= 0}
              style={{ background: '#00C9A7', borderColor: '#00C9A7' }}
            />
            <Button
              size="small" icon={<CloseOutlined />}
              onClick={() => {
                setAddingForSubject(null);
                setNewName('');
                setNewPercentage(0);
                setNewMaxScore(20);
              }}
            />
          </div>
        </div>
      )}

      {Object.keys(grouped).length === 0 && !addingForSubject && (
        <Empty description="Aucun type d'examen configuré pour ce trimestre" />
      )}
    </div>
  );
};

export default ExamTypesTab;
