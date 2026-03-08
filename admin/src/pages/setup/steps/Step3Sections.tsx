/**
 * Step 3 — Sections & Barèmes de notation
 * Auto-created from school cycles, admin configures grading scales
 */
import React from 'react';
import { Card, Row, Col, InputNumber, Switch, Tag, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { CYCLE_COLORS, type CycleType } from '../../../constants/algerian-curriculum';
import type { SectionConfig } from '../../../types/wizard';

interface Props {
  data: SectionConfig[];
  school: { has_primary: boolean; has_middle: boolean; has_high: boolean };
  onChange: (sections: SectionConfig[]) => void;
}

const SECTION_LABELS: Record<string, { name: string; icon: string; cycle: CycleType }> = {
  PRIMARY: { name: 'Section Primaire', icon: '', cycle: 'PRIMARY' },
  MIDDLE:  { name: 'Section Moyenne (CEM)', icon: '', cycle: 'MIDDLE' },
  HIGH:    { name: 'Section Secondaire (Lycée)', icon: '', cycle: 'HIGH' },
};

const Step3Sections: React.FC<Props> = ({ data, school, onChange }) => {
  const handleChange = (type: string, field: keyof SectionConfig, value: unknown) => {
    const updated = data.map(s =>
      s.type === type ? { ...s, [field]: value } : s,
    );
    onChange(updated);
  };

  // Build display sections based on school config
  const allPossibleSections: SectionConfig[] = [
    ...(school.has_primary ? [data.find(s => s.type === 'PRIMARY') || { type: 'PRIMARY' as const, enabled: true, gradingMax: 10, passingGrade: 5 }] : []),
    ...(school.has_middle ? [data.find(s => s.type === 'MIDDLE') || { type: 'MIDDLE' as const, enabled: true, gradingMax: 20, passingGrade: 10 }] : []),
    ...(school.has_high ? [data.find(s => s.type === 'HIGH') || { type: 'HIGH' as const, enabled: true, gradingMax: 20, passingGrade: 10 }] : []),
  ];

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <h2>Sections & Barèmes</h2>
        <p>Les sections sont créées automatiquement selon les cycles de votre école. Ajustez les barèmes de notation.</p>
      </div>

      <Row gutter={16}>
        {allPossibleSections.map(section => {
          const info = SECTION_LABELS[section.type];
          const colors = CYCLE_COLORS[info.cycle];
          return (
            <Col xs={24} md={8} key={section.type}>
              <Card
                className={`section-card ${section.enabled ? 'section-enabled' : 'section-disabled'}`}
                style={{
                  borderTop: `4px solid ${section.enabled ? colors.bg : '#d9d9d9'}`,
                  opacity: section.enabled ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontSize: 24, marginRight: 8 }}>{info.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{info.name}</span>
                  </div>
                  <Switch
                    checked={section.enabled}
                    onChange={v => handleChange(section.type, 'enabled', v)}
                    checkedChildren={<CheckCircleOutlined />}
                    unCheckedChildren={<CloseCircleOutlined />}
                  />
                </div>

                <Tag color={colors.bg} style={{ marginBottom: 16 }}>
                  {colors.label}
                </Tag>

                <Divider style={{ margin: '12px 0' }} />

                <div className="grading-config">
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                        Note maximale
                      </label>
                      <InputNumber
                        value={section.gradingMax}
                        onChange={v => handleChange(section.type, 'gradingMax', v ?? 20)}
                        min={5}
                        max={100}
                        disabled={!section.enabled}
                        style={{ width: 80 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                        Seuil de passage
                      </label>
                      <InputNumber
                        value={section.passingGrade}
                        onChange={v => handleChange(section.type, 'passingGrade', v ?? 10)}
                        min={1}
                        max={section.gradingMax}
                        disabled={!section.enabled}
                        style={{ width: 80 }}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop: 12, padding: '8px 12px', background: colors.light, borderRadius: 6, fontSize: 13 }}>
                    <strong>Formule :</strong> Moyenne = Σ(note × coeff) ÷ Σ(coeff)
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default Step3Sections;
