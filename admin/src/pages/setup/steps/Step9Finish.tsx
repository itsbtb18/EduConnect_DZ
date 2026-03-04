/**
 * Step 9 — Terminer / Launch
 * Final step with animated launch button and completion
 */
import React, { useState } from 'react';
import { Button, Result, Spin, Card, Row, Col } from 'antd';
import {
  RocketOutlined, CheckCircleOutlined, LoadingOutlined,
  DashboardOutlined, SettingOutlined,
} from '@ant-design/icons';

interface Props {
  saving: boolean;
  onComplete: () => Promise<void>;
  summaryStats: {
    sections: number;
    levels: number;
    classes: number;
    subjects: number;
    teachers: number;
    students: number;
  };
}

const Step9Finish: React.FC<Props> = ({ saving, onComplete, summaryStats }) => {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleLaunch = async () => {
    await onComplete();
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <div className="wizard-step-content" style={{ textAlign: 'center', padding: '60px 0' }}>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#0d9488', fontSize: 72 }} />}
          title="Configuration Terminée ! 🎉"
          subTitle="Votre école est maintenant configurée et prête à utiliser ILMI"
          extra={[
            <Button
              key="dashboard"
              type="primary"
              size="large"
              icon={<DashboardOutlined />}
              href="/"
            >
              Accéder au Tableau de Bord
            </Button>,
            <Button
              key="settings"
              size="large"
              icon={<SettingOutlined />}
              href="/schools/settings"
            >
              Paramètres
            </Button>,
          ]}
        />
      </div>
    );
  }

  const stats = [
    { val: summaryStats.sections, label: 'Sections', color: '#0d9488' },
    { val: summaryStats.levels, label: 'Niveaux', color: '#3b82f6' },
    { val: summaryStats.classes, label: 'Classes', color: '#f59e0b' },
    { val: summaryStats.subjects, label: 'Matières', color: '#a855f7' },
    { val: summaryStats.teachers, label: 'Enseignants', color: '#ef4444' },
    { val: summaryStats.students, label: 'Élèves', color: '#10b981' },
  ];

  return (
    <div className="wizard-step-content" style={{ textAlign: 'center' }}>
      <div className="step-header">
        <h2>Prêt à Lancer ! 🚀</h2>
        <p>Toute la configuration sera sauvegardée et votre école sera opérationnelle</p>
      </div>

      <Row gutter={16} justify="center" style={{ marginBottom: 40 }}>
        <Col>
          <Card style={{ textAlign: 'center', padding: 16, borderRadius: 16 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏫</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 32px' }}>
              {stats.map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Button
        type="primary"
        size="large"
        icon={saving ? <LoadingOutlined /> : <RocketOutlined />}
        onClick={handleLaunch}
        loading={saving}
        className="launch-button"
      >
        {saving ? 'Lancement en cours...' : 'Lancer ILMI 🚀'}
      </Button>

      <div style={{ marginTop: 16, color: '#94a3b8', fontSize: 13 }}>
        Cette opération va créer toutes les entités dans la base de données
      </div>
    </div>
  );
};

export default Step9Finish;
