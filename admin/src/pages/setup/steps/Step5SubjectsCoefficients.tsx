/**
 * Step 5 — Matières & Coefficients
 * Pre-filled from MEN data, fully editable inline, tabs by cycle/level.
 *
 * Features:
 *   - Inline editing of name, code, coefficient, mandatory
 *   - Add custom subjects (inline new row)
 *   - Delete subjects (with grade-count confirmation)
 *   - Reset to MEN defaults (with confirmation)
 *   - Custom badge for admin-created subjects
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Card, Tabs, Table, InputNumber, Switch, Button, Tag, Tooltip, Empty,
  Badge, Input, Popconfirm, message,
} from 'antd';
import type { InputRef } from 'antd';
import {
  ReloadOutlined, BookOutlined, InfoCircleOutlined,
  PlusOutlined, DeleteOutlined, EditOutlined, StarFilled,
  CheckOutlined, CloseOutlined,
} from '@ant-design/icons';
import { CYCLE_COLORS, SUBJECTS, ALL_STREAMS, LEVELS_BY_CYCLE, type CycleType } from '../../../constants/algerian-curriculum';
import type { LevelSubjectConfig, SubjectConfig, LevelConfig, SectionConfig } from '../../../types/wizard';

interface Props {
  subjects: LevelSubjectConfig[];
  levels: LevelConfig[];
  sections: SectionConfig[];
  onUpdateSubjects: (levelCode: string, streamCode: string | null, subjects: SubjectConfig[]) => void;
  onResetToMEN: (levelCode: string, streamCode: string | null) => void;
}

// ── Inline-editable cell ──────────────────────────────────────────────
const EditableCell: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}> = ({ value, onChange, placeholder, style }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const confirm = () => {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        size="small"
        value={draft}
        placeholder={placeholder}
        onChange={e => setDraft(e.target.value)}
        onPressEnter={confirm}
        onBlur={confirm}
        onKeyDown={e => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        style={{ width: '100%', ...style }}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      style={{ cursor: 'pointer', borderBottom: '1px dashed #d9d9d9', paddingBottom: 1, ...style }}
      title="Cliquer pour modifier"
    >
      {value || <span style={{ color: '#bbb' }}>{placeholder}</span>}
      <EditOutlined style={{ marginLeft: 4, fontSize: 10, opacity: 0.4 }} />
    </span>
  );
};

// ── Subject table for a single level/stream combination ──────────────
const SubjectTable: React.FC<{
  levelCode: string;
  streamCode: string | null;
  config: LevelSubjectConfig | undefined;
  accentColor: string;
  streamLabel?: string;
  onUpdateSubjects: Props['onUpdateSubjects'];
  onResetToMEN: Props['onResetToMEN'];
}> = ({ levelCode, streamCode, config, accentColor, streamLabel, onUpdateSubjects, onResetToMEN }) => {
  const subjectsList = config?.subjects ?? [];

  // ── Field change handler ──
  const handleChange = useCallback((subjectCode: string, field: keyof SubjectConfig, value: unknown) => {
    const updated = subjectsList.map(s =>
      s.subjectCode === subjectCode ? { ...s, [field]: value } : s,
    );
    onUpdateSubjects(levelCode, streamCode, updated);
  }, [subjectsList, levelCode, streamCode, onUpdateSubjects]);

  // ── Delete ──
  const handleDelete = useCallback((subjectCode: string) => {
    const updated = subjectsList.filter(s => s.subjectCode !== subjectCode);
    onUpdateSubjects(levelCode, streamCode, updated);
    message.success('Matière supprimée');
  }, [subjectsList, levelCode, streamCode, onUpdateSubjects]);

  // ── Add new row ──
  const handleAdd = useCallback(() => {
    const tempCode = `CUST_${Date.now().toString(36).toUpperCase()}`;
    const newSubject: SubjectConfig = {
      subjectCode: tempCode,
      subjectName: '',
      arabicName: '',
      coefficient: 1,
      isMandatory: false,
      color: '#9e9e9e',
      isCustom: true,
    };
    onUpdateSubjects(levelCode, streamCode, [...subjectsList, newSubject]);
  }, [subjectsList, levelCode, streamCode, onUpdateSubjects]);

  // ── Columns ──
  const columns = [
    {
      title: 'Matière',
      dataIndex: 'subjectName',
      key: 'subjectName',
      render: (_: string, record: SubjectConfig) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 12, height: 12, borderRadius: '50%',
              background: record.color, flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <EditableCell
                value={record.subjectName}
                placeholder="Nom de la matière"
                onChange={v => handleChange(record.subjectCode, 'subjectName', v)}
              />
              {record.isCustom && (
                <Tooltip title="Matière personnalisée">
                  <StarFilled style={{ color: '#f59e0b', fontSize: 12 }} />
                </Tooltip>
              )}
            </div>
            {(record.arabicName || record.isCustom) && (
              <EditableCell
                value={record.arabicName}
                placeholder="الاسم بالعربية"
                onChange={v => handleChange(record.subjectCode, 'arabicName', v)}
                style={{ fontSize: 11, direction: 'rtl' }}
              />
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'subjectCode',
      key: 'subjectCode',
      width: 110,
      render: (_: string, record: SubjectConfig) => (
        <EditableCell
          value={record.subjectCode}
          placeholder="CODE"
          onChange={v => {
            // Update code: need to update all references
            const upper = v.toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 20);
            if (!upper) return;
            // Ensure unique in this table
            if (subjectsList.some(s => s.subjectCode === upper && s.subjectCode !== record.subjectCode)) {
              message.warning('Ce code est déjà utilisé dans ce niveau');
              return;
            }
            const updated = subjectsList.map(s =>
              s.subjectCode === record.subjectCode
                ? { ...s, subjectCode: upper }
                : s,
            );
            onUpdateSubjects(levelCode, streamCode, updated);
          }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      ),
    },
    {
      title: 'Coeff.',
      dataIndex: 'coefficient',
      key: 'coefficient',
      width: 90,
      render: (val: number, record: SubjectConfig) => (
        <InputNumber
          value={val}
          onChange={v => handleChange(record.subjectCode, 'coefficient', v ?? 1)}
          min={1}
          max={10}
          size="small"
          style={{ width: 60 }}
        />
      ),
    },
    {
      title: 'Oblig.',
      dataIndex: 'isMandatory',
      key: 'isMandatory',
      width: 70,
      render: (val: boolean, record: SubjectConfig) => (
        <Switch
          size="small"
          checked={val}
          onChange={v => handleChange(record.subjectCode, 'isMandatory', v)}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 45,
      render: (_: unknown, record: SubjectConfig) => (
        <Popconfirm
          title="Supprimer cette matière ?"
          description="Cette matière sera retirée de ce niveau."
          onConfirm={() => handleDelete(record.subjectCode)}
          okText="Supprimer"
          okButtonProps={{ danger: true }}
          cancelText="Annuler"
        >
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const totalCoeff = subjectsList.reduce((s, sub) => s + sub.coefficient, 0);

  return (
    <div>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ fontSize: 12, color: '#666' }}>
          {streamLabel ? <InfoCircleOutlined /> : <BookOutlined />}
          {' '}{subjectsList.length} matière{subjectsList.length > 1 ? 's' : ''}
          {' '}• Σ coeff = {totalCoeff}
          {subjectsList.filter(s => s.isCustom).length > 0 && (
            <Tag color="gold" style={{ marginLeft: 8, fontSize: 10 }}>
              <StarFilled /> {subjectsList.filter(s => s.isCustom).length} personnalisée{subjectsList.filter(s => s.isCustom).length > 1 ? 's' : ''}
            </Tag>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Popconfirm
            title="Réinitialiser depuis les données MEN ?"
            description="Cela effacera vos modifications personnalisées pour ce niveau."
            onConfirm={() => onResetToMEN(levelCode, streamCode)}
            okText="Réinitialiser"
            cancelText="Annuler"
          >
            <Tooltip title="Réinitialiser depuis les données MEN">
              <Button size="small" icon={<ReloadOutlined />}>
                Reset MEN
              </Button>
            </Tooltip>
          </Popconfirm>
        </div>
      </div>

      {/* Table */}
      <Table
        dataSource={subjectsList}
        columns={columns}
        rowKey="subjectCode"
        pagination={false}
        size="small"
        bordered
        rowClassName={record => record.isCustom ? 'custom-subject-row' : ''}
      />

      {/* Add custom subject button */}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginTop: 8, borderColor: accentColor, color: accentColor }}
        block
      >
        Ajouter une matière
      </Button>
    </div>
  );
};

// ── Main Step 5 Component ─────────────────────────────────────────────
const Step5SubjectsCoefficients: React.FC<Props> = ({
  subjects,
  levels,
  sections,
  onUpdateSubjects,
  onResetToMEN,
}) => {
  const enabledCycles = sections.filter(s => s.enabled).map(s => s.type as CycleType);
  const enabledLevels = levels.filter(l => l.enabled && enabledCycles.includes(l.cycle));

  // Build tabs per cycle
  const cycleTabs = enabledCycles.map(cycle => {
    const cycleLevels = enabledLevels.filter(l => l.cycle === cycle);
    const colors = CYCLE_COLORS[cycle];

    // Build level tabs within cycle
    const levelTabs = cycleLevels.map(level => {
      const hasStreams = level.enabledStreams.length > 0;
      const customStreams = level.customStreams || [];

      if (hasStreams || customStreams.length > 0) {
        // Stream sub-tabs (official MEN + custom)
        const allStreamTabs = [
          ...level.enabledStreams.map(sc => {
            const streamDef = ALL_STREAMS.find(s => s.code === sc);
            const config = subjects.find(ls => ls.levelCode === level.code && ls.streamCode === sc);
            return {
              key: `${level.code}_${sc}`,
              label: (
                <span style={{ fontSize: 12 }}>
                  {streamDef?.shortName || sc}
                  <Badge
                    count={config?.subjects.length || 0}
                    style={{ backgroundColor: streamDef?.color || '#666', marginLeft: 6 }}
                    size="small"
                  />
                </span>
              ),
              children: (
                <SubjectTable
                  levelCode={level.code}
                  streamCode={sc}
                  config={config}
                  accentColor={streamDef?.color || colors.bg}
                  streamLabel={streamDef?.shortName || sc}
                  onUpdateSubjects={onUpdateSubjects}
                  onResetToMEN={onResetToMEN}
                />
              ),
            };
          }),
          ...customStreams.map(cs => {
            const config = subjects.find(ls => ls.levelCode === level.code && ls.streamCode === cs.code);
            return {
              key: `${level.code}_${cs.code}`,
              label: (
                <span style={{ fontSize: 12 }}>
                  <StarFilled style={{ color: cs.color, marginRight: 3, fontSize: 10 }} />
                  {cs.name}
                  <Badge
                    count={config?.subjects.length || 0}
                    style={{ backgroundColor: cs.color, marginLeft: 6 }}
                    size="small"
                  />
                </span>
              ),
              children: (
                <SubjectTable
                  levelCode={level.code}
                  streamCode={cs.code}
                  config={config}
                  accentColor={cs.color}
                  streamLabel={cs.name}
                  onUpdateSubjects={onUpdateSubjects}
                  onResetToMEN={onResetToMEN}
                />
              ),
            };
          }),
        ];
        return {
          key: level.code,
          label: (
            <span>
              <Tag color={colors.bg} style={{ marginRight: 4 }}>{level.code}</Tag>
              {level.name}
            </span>
          ),
          children: <Tabs items={allStreamTabs} size="small" type="card" />,
        };
      } else {
        // No streams — direct table
        const config = subjects.find(ls => ls.levelCode === level.code && ls.streamCode === null);
        return {
          key: level.code,
          label: (
            <span>
              <Tag color={colors.bg} style={{ marginRight: 4 }}>{level.code}</Tag>
            </span>
          ),
          children: (
            <SubjectTable
              levelCode={level.code}
              streamCode={null}
              config={config}
              accentColor={colors.bg}
              onUpdateSubjects={onUpdateSubjects}
              onResetToMEN={onResetToMEN}
            />
          ),
        };
      }
    });

    return {
      key: cycle,
      label: (
        <span style={{ fontWeight: 600, color: colors.bg }}>
          {colors.label}
          <Badge
            count={cycleLevels.length}
            style={{ backgroundColor: colors.bg, marginLeft: 8 }}
            size="small"
          />
        </span>
      ),
      children: (
        <Tabs
          items={levelTabs}
          tabPosition="left"
          size="small"
        />
      ),
    };
  });

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <h2>Matières & Coefficients</h2>
        <p>
          Les matières sont pré-remplies selon le programme MEN algérien.
          <strong> Cliquez sur un nom, un code ou un coefficient pour le modifier.</strong>
          {' '}Utilisez <PlusOutlined /> pour ajouter vos propres matières.
        </p>
      </div>

      {cycleTabs.length > 0 ? (
        <Card>
          <Tabs items={cycleTabs} type="card" className="subjects-cycle-tabs" />
        </Card>
      ) : (
        <Empty description="Aucun niveau configuré" />
      )}
    </div>
  );
};

export default Step5SubjectsCoefficients;
