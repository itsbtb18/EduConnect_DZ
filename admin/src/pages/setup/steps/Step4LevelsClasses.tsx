/**
 * Step 4 — Niveaux & Classes
 * Two sub-steps:
 *   4A: Select which levels are enabled (toggle cards grouped by cycle)
 *   4B: Configure class count per level (with stream-specific config for Lycée)
 *        + editable class name chips
 *        + custom stream/group creation for ANY level
 */
import React from 'react';
import {
  Card, Row, Col, Switch, InputNumber, Tag, Button, Divider, Badge, Tabs, Empty,
  Popconfirm,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined,
  ArrowRightOutlined, ArrowLeftOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { CYCLE_COLORS, ALL_STREAMS, LEVELS_BY_CYCLE, type CycleType } from '../../../constants/algerian-curriculum';
import type { LevelConfig, SectionConfig, CustomStream } from '../../../types/wizard';
import EditableClassChip from '../../../components/setup/EditableClassChip';
import CustomStreamForm from '../../../components/setup/CustomStreamForm';

interface Props {
  levels: LevelConfig[];
  sections: SectionConfig[];
  subStep: 'select' | 'classes';
  onSubStepChange: (sub: 'select' | 'classes') => void;
  onUpdateLevel: (code: string, data: Partial<LevelConfig>) => void;
}

// ── Sub-step 4A: Level Selection Cards ────────────────────────────────
const LevelSelectionPanel: React.FC<{
  levels: LevelConfig[];
  sections: SectionConfig[];
  onUpdateLevel: Props['onUpdateLevel'];
}> = ({ levels, sections, onUpdateLevel }) => {
  const enabledCycles = sections.filter(s => s.enabled).map(s => s.type as CycleType);

  const cycleTabs = enabledCycles.map(cycle => {
    const cycleLevels = levels.filter(l => l.cycle === cycle);
    const colors = CYCLE_COLORS[cycle];
    const levelDefs = LEVELS_BY_CYCLE[cycle];

    return {
      key: cycle,
      label: (
        <span style={{ color: colors.bg, fontWeight: 600 }}>
          {colors.label}
          <Badge
            count={cycleLevels.filter(l => l.enabled).length}
            style={{ backgroundColor: colors.bg, marginLeft: 8, boxShadow: 'none' }}
            size="small"
          />
        </span>
      ),
      children: (
        <Row gutter={[12, 12]}>
          {cycleLevels.map(level => {
            const def = levelDefs.find(d => d.code === level.code);
            return (
              <Col xs={12} sm={8} md={6} key={level.code}>
                <Card
                  className={`level-select-card ${level.enabled ? 'level-enabled' : ''}`}
                  hoverable
                  style={{
                    borderColor: level.enabled ? colors.bg : '#e8e8e8',
                    borderWidth: level.enabled ? 2 : 1,
                    background: level.enabled ? colors.light : '#fafafa',
                    cursor: 'pointer',
                  }}
                  onClick={() => onUpdateLevel(level.code, { enabled: !level.enabled })}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: level.enabled ? colors.bg : '#999',
                      marginBottom: 4,
                    }}>
                      {level.code}
                    </div>
                    <div style={{ fontSize: 12, color: level.enabled ? colors.text : '#999' }}>
                      {level.name}
                    </div>
                    {def?.hasStreams && (
                      <Tag
                        color="blue"
                        style={{ marginTop: 8, fontSize: 10 }}
                      >
                        Filières
                      </Tag>
                    )}
                    <div style={{ marginTop: 8 }}>
                      {level.enabled ? (
                        <CheckCircleOutlined style={{ color: colors.bg, fontSize: 20 }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#d9d9d9', fontSize: 20 }} />
                      )}
                    </div>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      ),
    };
  });

  return (
    <div>
      <div className="step-header">
        <h2>Sélection des Niveaux</h2>
        <p>Cliquez sur un niveau pour l'activer ou le désactiver</p>
      </div>
      {cycleTabs.length > 0 ? (
        <Tabs
          items={cycleTabs}
          type="card"
          className="cycle-tabs"
        />
      ) : (
        <Empty description="Aucune section activée" />
      )}
    </div>
  );
};

// ── Sub-step 4B: Class Configuration ──────────────────────────────────
const ClassConfigPanel: React.FC<{
  levels: LevelConfig[];
  sections: SectionConfig[];
  onUpdateLevel: Props['onUpdateLevel'];
}> = ({ levels, sections, onUpdateLevel }) => {
  const enabledCycles = sections.filter(s => s.enabled).map(s => s.type as CycleType);
  const enabledLevels = levels.filter(l => l.enabled && enabledCycles.includes(l.cycle));

  const handleClassCountChange = (code: string, count: number) => {
    const level = levels.find(l => l.code === code);
    if (!level) return;

    // When decreasing, trim classNames from the end
    const newNames = { ...(level.classNames || {}) };
    for (let i = count + 1; i <= 20; i++) {
      const defaultKey = `${code}-${i}`;
      delete newNames[defaultKey];
    }
    onUpdateLevel(code, { classCount: count, classNames: newNames });
  };

  const handleClassNameChange = (levelCode: string, defaultName: string, newName: string) => {
    const level = levels.find(l => l.code === levelCode);
    if (!level) return;
    const classNames = { ...(level.classNames || {}) };
    if (newName === defaultName) {
      delete classNames[defaultName]; // revert to default
    } else {
      classNames[defaultName] = newName;
    }
    onUpdateLevel(levelCode, { classNames });
  };

  const handleStreamClassCountChange = (code: string, streamCode: string, count: number) => {
    const level = levels.find(l => l.code === code);
    if (!level) return;
    // Trim stream class names from the end
    const newNames = { ...(level.streamClassNames || {}) };
    for (let i = count + 1; i <= 20; i++) {
      const defaultKey = `${code}-${streamCode.replace('TC_', '')}-${i}`;
      delete newNames[defaultKey];
    }
    onUpdateLevel(code, {
      streamClasses: { ...level.streamClasses, [streamCode]: count },
      streamClassNames: newNames,
    });
  };

  const handleStreamClassNameChange = (levelCode: string, defaultName: string, newName: string) => {
    const level = levels.find(l => l.code === levelCode);
    if (!level) return;
    const streamClassNames = { ...(level.streamClassNames || {}) };
    if (newName === defaultName) {
      delete streamClassNames[defaultName];
    } else {
      streamClassNames[defaultName] = newName;
    }
    onUpdateLevel(levelCode, { streamClassNames });
  };

  const handleStreamToggle = (code: string, streamCode: string, enabled: boolean) => {
    const level = levels.find(l => l.code === code);
    if (!level) return;
    const enabledStreams = enabled
      ? [...level.enabledStreams, streamCode]
      : level.enabledStreams.filter(s => s !== streamCode);
    const streamClasses = { ...level.streamClasses };
    if (enabled && !streamClasses[streamCode]) {
      streamClasses[streamCode] = 1;
    } else if (!enabled) {
      delete streamClasses[streamCode];
    }
    onUpdateLevel(code, { enabledStreams, streamClasses });
  };

  const handleAddCustomStream = (levelCode: string, stream: CustomStream) => {
    const level = levels.find(l => l.code === levelCode);
    if (!level) return;
    const customStreams = [...(level.customStreams || []), stream];
    onUpdateLevel(levelCode, { customStreams });
  };

  const handleRemoveCustomStream = (levelCode: string, tempId: string) => {
    const level = levels.find(l => l.code === levelCode);
    if (!level) return;
    const customStreams = (level.customStreams || []).filter(s => s.tempId !== tempId);
    // Also clean up any stream class names
    const streamClassNames = { ...(level.streamClassNames || {}) };
    const removed = (level.customStreams || []).find(s => s.tempId === tempId);
    if (removed) {
      for (let i = 1; i <= 20; i++) {
        delete streamClassNames[`${levelCode}-${removed.code}-${i}`];
      }
    }
    onUpdateLevel(levelCode, { customStreams, streamClassNames });
  };

  const handleCustomStreamClassCount = (levelCode: string, tempId: string, count: number) => {
    const level = levels.find(l => l.code === levelCode);
    if (!level) return;
    const customStreams = (level.customStreams || []).map(s =>
      s.tempId === tempId ? { ...s, classCount: count } : s,
    );
    onUpdateLevel(levelCode, { customStreams });
  };

  /** Collect all class names at a level for duplicate detection */
  const getAllClassNames = (level: LevelConfig): string[] => {
    const names: string[] = [];
    if (level.enabledStreams.length === 0 && (level.customStreams || []).length === 0) {
      for (let i = 1; i <= level.classCount; i++) {
        const def = `${level.code}-${i}`;
        names.push(level.classNames?.[def] || def);
      }
    }
    // Stream classes (official)
    for (const sc of level.enabledStreams) {
      const count = level.streamClasses[sc] || 1;
      for (let i = 1; i <= count; i++) {
        const def = `${level.code}-${sc.replace('TC_', '')}-${i}`;
        names.push(level.streamClassNames?.[def] || def);
      }
    }
    // Custom stream classes
    for (const cs of (level.customStreams || [])) {
      for (let i = 1; i <= cs.classCount; i++) {
        const def = `${level.code}-${cs.code}-${i}`;
        names.push(level.streamClassNames?.[def] || def);
      }
    }
    return names;
  };

  const groupedByCycle = enabledCycles.map(cycle => ({
    cycle,
    levels: enabledLevels.filter(l => l.cycle === cycle),
  })).filter(g => g.levels.length > 0);

  return (
    <div>
      <div className="step-header">
        <h2>Configuration des Classes</h2>
        <p>Définissez le nombre de classes par niveau et filière. <strong>Cliquez sur un nom de classe pour le personnaliser.</strong></p>
      </div>

      {groupedByCycle.map(({ cycle, levels: cycleLevels }) => {
        const colors = CYCLE_COLORS[cycle];
        return (
          <div key={cycle} style={{ marginBottom: 24 }}>
            <Divider>
              <Tag color={colors.bg} style={{ fontSize: 14, padding: '4px 12px' }}>
                {colors.label}
              </Tag>
            </Divider>

            {cycleLevels.map(level => {
              const levelDef = LEVELS_BY_CYCLE[cycle]?.find(d => d.code === level.code);
              const hasMENStreams = levelDef?.hasStreams ?? false;
              const hasAnyStreams = level.enabledStreams.length > 0 || (level.customStreams || []).length > 0;
              const allNames = getAllClassNames(level);

              return (
                <Card
                  key={level.code}
                  className="class-config-card"
                  style={{ marginBottom: 12, borderLeft: `4px solid ${colors.bg}` }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <Tag color={colors.bg} style={{ fontWeight: 700, fontSize: 14 }}>
                        {level.code}
                      </Tag>
                      <span style={{ fontWeight: 500 }}>{level.name}</span>
                    </div>

                    {/* Class count for levels without any streams */}
                    {!hasAnyStreams && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: '#666' }}>Nombre de classes :</span>
                        <InputNumber
                          value={level.classCount}
                          onChange={v => handleClassCountChange(level.code, v ?? 1)}
                          min={1}
                          max={20}
                          style={{ width: 70 }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Editable class chips (no streams) */}
                  {!hasAnyStreams && level.classCount > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {Array.from({ length: level.classCount }, (_, i) => {
                        const defaultName = `${level.code}-${i + 1}`;
                        const displayName = level.classNames?.[defaultName] || defaultName;
                        return (
                          <EditableClassChip
                            key={defaultName}
                            name={displayName}
                            defaultName={defaultName}
                            color={colors.bg}
                            onChange={newName => handleClassNameChange(level.code, defaultName, newName)}
                            usedNames={allNames}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* ── MEN Official Streams (Lycée) ── */}
                  {hasMENStreams && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                        Filières officielles (MEN) :
                      </div>
                      <Row gutter={[8, 8]}>
                        {(levelDef?.streamCodes || []).map(sc => {
                          const streamDef = ALL_STREAMS.find(s => s.code === sc);
                          const isEnabled = level.enabledStreams.includes(sc);
                          const classCount = level.streamClasses[sc] || 1;
                          return (
                            <Col xs={24} sm={12} md={8} key={sc}>
                              <div
                                style={{
                                  padding: '10px 14px',
                                  borderRadius: 8,
                                  border: `1px solid ${isEnabled ? (streamDef?.color || colors.bg) : '#e8e8e8'}`,
                                  background: isEnabled ? `${streamDef?.color || colors.bg}10` : '#fafafa',
                                  transition: 'all 0.2s',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                  <span style={{ fontWeight: 500, fontSize: 13 }}>
                                    {streamDef?.shortName || sc}
                                  </span>
                                  <Switch
                                    size="small"
                                    checked={isEnabled}
                                    onChange={v => handleStreamToggle(level.code, sc, v)}
                                  />
                                </div>
                                {isEnabled && (
                                  <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                      <span style={{ fontSize: 12, color: '#666' }}>Classes :</span>
                                      <InputNumber
                                        size="small"
                                        value={classCount}
                                        onChange={v => handleStreamClassCountChange(level.code, sc, v ?? 1)}
                                        min={1}
                                        max={10}
                                        style={{ width: 60 }}
                                      />
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                      {Array.from({ length: classCount }, (_, i) => {
                                        const defaultName = `${level.code}-${sc.replace('TC_', '')}-${i + 1}`;
                                        const displayName = level.streamClassNames?.[defaultName] || defaultName;
                                        return (
                                          <EditableClassChip
                                            key={defaultName}
                                            name={displayName}
                                            defaultName={defaultName}
                                            color={streamDef?.color || colors.bg}
                                            onChange={newName => handleStreamClassNameChange(level.code, defaultName, newName)}
                                            usedNames={allNames}
                                          />
                                        );
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>
                            </Col>
                          );
                        })}
                      </Row>
                    </div>
                  )}

                  {/* ── Custom Streams (any level) ── */}
                  {(level.customStreams || []).length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                        Groupes personnalisés :
                      </div>
                      <Row gutter={[8, 8]}>
                        {(level.customStreams || []).map(cs => (
                          <Col xs={24} sm={12} md={8} key={cs.tempId}>
                            <div
                              style={{
                                padding: '10px 14px',
                                borderRadius: 8,
                                border: `1px solid ${cs.color}`,
                                background: `${cs.color}10`,
                                transition: 'all 0.2s',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: 13, color: cs.color }}>
                                  {cs.name}
                                </span>
                                <Popconfirm
                                  title="Supprimer ce groupe ?"
                                  onConfirm={() => handleRemoveCustomStream(level.code, cs.tempId)}
                                  okText="Oui"
                                  cancelText="Non"
                                >
                                  <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                                </Popconfirm>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <span style={{ fontSize: 12, color: '#666' }}>Classes :</span>
                                <InputNumber
                                  size="small"
                                  value={cs.classCount}
                                  onChange={v => handleCustomStreamClassCount(level.code, cs.tempId, v ?? 1)}
                                  min={1}
                                  max={20}
                                  style={{ width: 60 }}
                                />
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {Array.from({ length: cs.classCount }, (_, i) => {
                                  const defaultName = `${level.code}-${cs.code}-${i + 1}`;
                                  const displayName = level.streamClassNames?.[defaultName] || defaultName;
                                  return (
                                    <EditableClassChip
                                      key={defaultName}
                                      name={displayName}
                                      defaultName={defaultName}
                                      color={cs.color}
                                      onChange={newName => handleStreamClassNameChange(level.code, defaultName, newName)}
                                      usedNames={allNames}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}

                  {/* ── Add Custom Stream Button ── */}
                  <CustomStreamForm
                    existingStreams={level.customStreams || []}
                    existingStreamCodes={level.enabledStreams}
                    levelCode={level.code}
                    accentColor={colors.bg}
                    onAdd={(stream) => handleAddCustomStream(level.code, stream)}
                  />
                </Card>
              );
            })}
          </div>
        );
      })}

      {enabledLevels.length === 0 && (
        <Empty description="Aucun niveau activé — retournez à la sélection" />
      )}
    </div>
  );
};

// ── Main Step 4 Component ─────────────────────────────────────────────
const Step4LevelsClasses: React.FC<Props> = ({
  levels,
  sections,
  subStep,
  onSubStepChange,
  onUpdateLevel,
}) => {
  const enabledCount = levels.filter(l => l.enabled).length;

  return (
    <div className="wizard-step-content">
      {/* Sub-step navigation */}
      <div className="substep-nav" style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
        <Button
          type={subStep === 'select' ? 'primary' : 'default'}
          onClick={() => onSubStepChange('select')}
        >
          4A — Sélection des niveaux
        </Button>
        <Button
          type={subStep === 'classes' ? 'primary' : 'default'}
          onClick={() => onSubStepChange('classes')}
          disabled={enabledCount === 0}
        >
          4B — Configuration des classes
          {enabledCount > 0 && (
            <Badge count={enabledCount} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} size="small" />
          )}
        </Button>
      </div>

      {subStep === 'select' ? (
        <>
          <LevelSelectionPanel
            levels={levels}
            sections={sections}
            onUpdateLevel={onUpdateLevel}
          />
          {enabledCount > 0 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => onSubStepChange('classes')}
                size="large"
              >
                Configurer les classes ({enabledCount} niveaux)
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => onSubStepChange('select')}
            >
              Retour à la sélection
            </Button>
          </div>
          <ClassConfigPanel
            levels={levels}
            sections={sections}
            onUpdateLevel={onUpdateLevel}
          />
        </>
      )}
    </div>
  );
};

export default Step4LevelsClasses;
