/**
 * Step 8 — Récapitulatif
 * Summary of all configured data before final submission
 */
import React from 'react';
import { Card, Row, Col, Tag, Divider, Statistic, List, Badge } from 'antd';
import {
  HomeOutlined, CalendarOutlined, AppstoreOutlined, BookOutlined,
  TeamOutlined, UserOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { CYCLE_COLORS, ALL_STREAMS, type CycleType } from '../../../constants/algerian-curriculum';
import type { WizardState } from '../../../types/wizard';

interface Props {
  state: WizardState;
  summaryStats: {
    sections: number;
    levels: number;
    classes: number;
    subjects: number;
    teachers: number;
    students: number;
  };
}

const Step8Summary: React.FC<Props> = ({ state, summaryStats }) => {
  const enabledLevels = state.levels.filter(l => l.enabled);
  const enabledSections = state.sections.filter(s => s.enabled);

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <h2>Récapitulatif</h2>
        <p>Vérifiez la configuration avant de finaliser</p>
      </div>

      {/* Stats overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Sections"
              value={summaryStats.sections}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#0d9488' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Niveaux"
              value={summaryStats.levels}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Classes"
              value={summaryStats.classes}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Matières"
              value={summaryStats.subjects}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#a855f7' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Enseignants"
              value={summaryStats.teachers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Élèves"
              value={summaryStats.students}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Profile */}
      <Card
        title={<><HomeOutlined /> Profil de l'établissement</>}
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Row gutter={16}>
          <Col span={12}>
            <div className="summary-field">
              <span className="summary-label">Nom:</span>
              <span className="summary-value">{state.profile.name || '—'}</span>
            </div>
            <div className="summary-field">
              <span className="summary-label">Wilaya:</span>
              <span className="summary-value">{state.profile.wilaya || '—'}</span>
            </div>
          </Col>
          <Col span={12}>
            <div className="summary-field">
              <span className="summary-label">Téléphone:</span>
              <span className="summary-value">{state.profile.phone || '—'}</span>
            </div>
            <div className="summary-field">
              <span className="summary-label">Email:</span>
              <span className="summary-value">{state.profile.email || '—'}</span>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Academic Year */}
      <Card
        title={<><CalendarOutlined /> Année Scolaire</>}
        style={{ marginBottom: 16 }}
        size="small"
      >
        <div className="summary-field">
          <span className="summary-label">Année:</span>
          <span className="summary-value">{state.academic.name}</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          {state.academic.trimesters.map(t => (
            <Tag key={t.number} color={['#10b981', '#f59e0b', '#ef4444'][t.number - 1]}>
              T{t.number}: {t.startDate} → {t.endDate}
            </Tag>
          ))}
        </div>
      </Card>

      {/* Levels & Classes */}
      <Card
        title={<><AppstoreOutlined /> Niveaux & Classes</>}
        style={{ marginBottom: 16 }}
        size="small"
      >
        {enabledSections.map(section => {
          const cycle = section.type as CycleType;
          const colors = CYCLE_COLORS[cycle];
          const sectionLevels = enabledLevels.filter(l => l.cycle === cycle);

          return (
            <div key={section.type} style={{ marginBottom: 16 }}>
              <Tag color={colors.bg} style={{ fontWeight: 600, marginBottom: 8 }}>
                {colors.label} — Note /{section.gradingMax}, seuil {section.passingGrade}
              </Tag>
              <List
                size="small"
                dataSource={sectionLevels}
                renderItem={level => {
                  const classes: string[] = [];
                  if (level.enabledStreams.length > 0) {
                    for (const sc of level.enabledStreams) {
                      const count = level.streamClasses[sc] || 1;
                      for (let i = 1; i <= count; i++) {
                        classes.push(`${level.code}-${sc.replace('TC_', '')}-${i}`);
                      }
                    }
                  } else {
                    for (let i = 1; i <= level.classCount; i++) {
                      classes.push(`${level.code}-${i}`);
                    }
                  }
                  return (
                    <List.Item>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <Tag color={colors.bg}>{level.code}</Tag>
                        <span style={{ fontWeight: 500 }}>{level.name}</span>
                        <span style={{ color: '#999', fontSize: 12 }}>→</span>
                        {classes.map(c => (
                          <Tag key={c} style={{ fontSize: 11 }}>{c}</Tag>
                        ))}
                      </div>
                    </List.Item>
                  );
                }}
              />
            </div>
          );
        })}
      </Card>

      {/* Teachers */}
      {state.teachers.length > 0 && (
        <Card
          title={<><TeamOutlined /> Enseignants ({state.teachers.length})</>}
          style={{ marginBottom: 16 }}
          size="small"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {state.teachers.map(t => (
              <Tag key={t.tempId} icon={<UserOutlined />}>
                {t.lastName} {t.firstName}
              </Tag>
            ))}
          </div>
        </Card>
      )}

      {/* Students */}
      {state.students.length > 0 && (
        <Card
          title={<><UserOutlined /> Élèves ({state.students.length})</>}
          size="small"
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {state.students.map(s => (
              <Tag key={s.tempId}>
                {s.lastName} {s.firstName}
                {s.classAssignment && <Badge count={s.classAssignment} style={{ marginLeft: 6, backgroundColor: '#52c41a' }} />}
              </Tag>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default Step8Summary;
