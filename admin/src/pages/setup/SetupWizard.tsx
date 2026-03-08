/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  SetupWizard — 9-Step School Configuration Wizard (Premium v2)         ║
 * ║                                                                         ║
 * ║  Dark header w/ glassmorphism, custom icon stepper, gradient footer.   ║
 * ║  Cycle-aware hierarchy (Section → Level → Stream → Class).             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
import React from 'react';
import { Spin } from 'antd';
import {
  BankOutlined, CalendarOutlined, AppstoreOutlined,
  BookOutlined, TeamOutlined, UserOutlined,
  CheckCircleOutlined, RocketOutlined, ReadOutlined,
  CheckOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  LoadingOutlined, SaveOutlined,
} from '@ant-design/icons';
import { WIZARD_STEPS } from '../../types/wizard';
import { useSetupWizard } from '../../hooks/useSetupWizard';

// Step Components
import Step1Profile from './steps/Step1Profile';
import Step2AcademicYear from './steps/Step2AcademicYear';
import Step3Sections from './steps/Step3Sections';
import Step4LevelsClasses from './steps/Step4LevelsClasses';
import Step5SubjectsCoefficients from './steps/Step5SubjectsCoefficients';
import Step6Teachers from './steps/Step6Teachers';
import Step7Students from './steps/Step7Students';
import Step8Summary from './steps/Step8Summary';
import Step9Finish from './steps/Step9Finish';

import './SetupWizard.css';

// Step icon mapping
const STEP_ICONS: React.ReactNode[] = [
  <BankOutlined />,
  <CalendarOutlined />,
  <AppstoreOutlined />,
  <ReadOutlined />,
  <BookOutlined />,
  <TeamOutlined />,
  <UserOutlined />,
  <CheckCircleOutlined />,
  <RocketOutlined />,
];

const SetupWizard: React.FC = () => {
  const wizard = useSetupWizard();

  if (wizard.loading) {
    return (
      <div className="setup-wizard-loading">
        <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 36, color: '#0d9488' }} spin />} />
        <span style={{ color: '#64748b', fontSize: 14 }}>Chargement du profil de l'école...</span>
      </div>
    );
  }

  const { state, school, saving, canGoNext, summaryStats } = wizard;

  const handleSaveAndNext = async () => {
    await wizard.saveCurrentStep();
    wizard.nextStep();
  };

  const handleComplete = async () => {
    await wizard.saveCurrentStep();
    await wizard.completeSetup();
  };

  const progressPercent = ((state.currentStep + 1) / WIZARD_STEPS.length) * 100;

  const renderStep = () => {
    switch (state.currentStep) {
      case 0:
        return <Step1Profile data={state.profile} onChange={wizard.updateProfile} />;
      case 1:
        return <Step2AcademicYear data={state.academic} onChange={wizard.updateAcademic} />;
      case 2:
        return <Step3Sections data={state.sections} school={school} onChange={wizard.updateSections} />;
      case 3:
        return (
          <Step4LevelsClasses
            levels={state.levels}
            sections={state.sections}
            subStep={state.levelsSubStep}
            onSubStepChange={wizard.setLevelsSubStep}
            onUpdateLevel={wizard.updateLevel}
          />
        );
      case 4:
        return (
          <Step5SubjectsCoefficients
            subjects={state.subjects}
            levels={state.levels}
            sections={state.sections}
            onUpdateSubjects={wizard.updateSubjects}
            onResetToMEN={wizard.resetSubjectsToMEN}
          />
        );
      case 5:
        return (
          <Step6Teachers
            teachers={state.teachers}
            subjects={state.subjects}
            levels={state.levels}
            sections={state.sections}
            onAdd={wizard.addTeacher}
            onUpdate={wizard.updateTeacher}
            onRemove={wizard.removeTeacher}
          />
        );
      case 6:
        return (
          <Step7Students
            students={state.students}
            levels={state.levels}
            onAdd={wizard.addStudent}
            onRemove={wizard.removeStudent}
          />
        );
      case 7:
        return <Step8Summary state={state} summaryStats={summaryStats} />;
      case 8:
        return (
          <Step9Finish
            saving={saving}
            onComplete={handleComplete}
            summaryStats={summaryStats}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="setup-wizard">
      {/* ── Header — dark gradient + glassmorphism badge ── */}
      <div className="setup-wizard-header">
        <div className="setup-wizard-header-content">
          <div className="header-title-section">
            <h1>Configuration de l'École</h1>
            <p>Configurez votre établissement en quelques étapes simples</p>
          </div>
          <div className="header-progress">
            <div className="header-step-badge">
              <span className="badge-num">{state.currentStep + 1}</span>
              <span>Étape {state.currentStep + 1} sur {WIZARD_STEPS.length}</span>
            </div>
            <div className="header-progress-track">
              <div
                className="header-progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Custom Stepper — icon circles ── */}
      <div className="setup-wizard-stepper">
        <div className="stepper-track">
          {WIZARD_STEPS.map((step, idx) => {
            const status = idx < state.currentStep ? 'completed' : idx === state.currentStep ? 'active' : 'pending';
            const isClickable = idx <= state.currentStep;

            return (
              <React.Fragment key={idx}>
                <div
                  className={`stepper-step ${status} ${isClickable ? 'clickable' : ''}`}
                  onClick={() => isClickable && wizard.goToStep(idx)}
                  title={step.label}
                >
                  <div className="stepper-node">
                    <div className="stepper-icon">
                      {status === 'completed' ? (
                        <CheckOutlined className="stepper-check-icon" />
                      ) : (
                        STEP_ICONS[idx]
                      )}
                    </div>
                    <span className="stepper-label">{step.label}</span>
                  </div>
                </div>
                {idx < WIZARD_STEPS.length - 1 && (
                  <div className={`stepper-connector ${idx < state.currentStep ? 'done' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ── Step Content ── */}
      <div className="setup-wizard-body" key={state.currentStep}>
        {renderStep()}
      </div>

      {/* ── Footer Navigation ── */}
      {state.currentStep < 8 && (
        <div className="setup-wizard-footer">
          <div className="footer-left">
            {state.currentStep > 0 && (
              <button
                className="sw-btn-prev"
                onClick={wizard.prevStep}
                type="button"
              >
                <ArrowLeftOutlined />
                Précédent
              </button>
            )}
          </div>
          <div className="footer-right">
            {state.currentStep < 7 ? (
              <button
                className={`sw-btn-next ${saving ? 'saving' : ''}`}
                onClick={handleSaveAndNext}
                disabled={!canGoNext || saving}
                type="button"
              >
                {saving ? (
                  <>
                    <span className="sw-btn-spinner" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <SaveOutlined />
                    Sauvegarder & Continuer
                    <ArrowRightOutlined />
                  </>
                )}
              </button>
            ) : (
              <button
                className="sw-btn-next"
                onClick={() => wizard.nextStep()}
                type="button"
              >
                <RocketOutlined />
                Finaliser la configuration
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SetupWizard;

