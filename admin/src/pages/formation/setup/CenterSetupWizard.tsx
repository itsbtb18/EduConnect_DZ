/**
 * Formation — Center Setup Wizard (6 Steps)
 *
 * Step 1: General Info (name, address, logo, capacity, rooms, opening hours)
 * Step 2: Departments (Langues, Soutien, Numérique, etc.)
 * Step 3: Formations/Programs per department
 * Step 4: Time Slots (standard slots, working days)
 * Step 5: Financial Settings (payment modes, policies, VAT)
 * Step 6: Initial Data Import (trainers + learners via Excel)
 */
import React, { useState, useCallback } from 'react';
import { Button, message, Spin } from 'antd';
import {
  BankOutlined, AppstoreOutlined, BookOutlined,
  ClockCircleOutlined, DollarOutlined, UploadOutlined,
  CheckOutlined, ArrowLeftOutlined, ArrowRightOutlined,
  LoadingOutlined, RocketOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSchoolProfile } from '../../../hooks/useApi';
import { formationAPI } from '../../../api/formationService';
import { schoolsAPI } from '../../../api/services';
import type { CenterSetupWizardState } from '../../../types/formation';
import { DEPARTMENT_COLORS, DEFAULT_TIME_SLOTS } from '../../../constants/training-center';

import CenterStep1General from './CenterStep1General';
import CenterStep2Departments from './CenterStep2Departments';
import CenterStep3Formations from './CenterStep3Formations';
import CenterStep4TimeSlots from './CenterStep4TimeSlots';
import CenterStep5Finance from './CenterStep5Finance';
import CenterStep6Import from './CenterStep6Import';

import '../SetupWizard.css';

const STEPS = [
  { label: 'Informations', icon: <BankOutlined /> },
  { label: 'Départements', icon: <AppstoreOutlined /> },
  { label: 'Formations', icon: <BookOutlined /> },
  { label: 'Créneaux', icon: <ClockCircleOutlined /> },
  { label: 'Finance', icon: <DollarOutlined /> },
  { label: 'Import', icon: <UploadOutlined /> },
];

const initialState: CenterSetupWizardState = {
  currentStep: 0,
  general: {
    name: '',
    address: '',
    capacity: 100,
    rooms: [{ name: 'Salle 1', capacity: 30 }],
    opening_hours: { start: '08:00', end: '21:00' },
    working_days: [0, 1, 2, 3, 4], // Sun-Thu
  },
  departments: [
    { name: 'Langues', color: DEPARTMENT_COLORS[0] },
    { name: 'Soutien scolaire', color: DEPARTMENT_COLORS[1] },
  ],
  formations: [],
  timeSlots: DEFAULT_TIME_SLOTS.map(s => ({ ...s })),
  finance: {
    payment_methods: ['cash', 'bank_transfer'],
    registration_policy: 'Frais d\'inscription non remboursables',
    refund_policy: 'Remboursement partiel possible avant le début de la formation',
    reminder_days: 3,
    tva_rate: 19,
  },
  trainers: [],
  learners: [],
};

const CenterSetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const { data: schoolProfile, isLoading: profileLoading } = useSchoolProfile();
  const [state, setState] = useState<CenterSetupWizardState>(initialState);
  const [saving, setSaving] = useState(false);

  const school = schoolProfile as Record<string, unknown> | undefined;

  // Pre-fill from school profile
  React.useEffect(() => {
    if (school && state.general.name === '') {
      setState(prev => ({
        ...prev,
        general: {
          ...prev.general,
          name: (school.name as string) || '',
          address: (school.address as string) || '',
        },
      }));
    }
  }, [school, state.general.name]);

  const updateGeneral = useCallback((partial: Partial<CenterSetupWizardState['general']>) => {
    setState(prev => ({ ...prev, general: { ...prev.general, ...partial } }));
  }, []);

  const updateDepartments = useCallback((deps: CenterSetupWizardState['departments']) => {
    setState(prev => ({ ...prev, departments: deps }));
  }, []);

  const updateFormations = useCallback((fms: CenterSetupWizardState['formations']) => {
    setState(prev => ({ ...prev, formations: fms }));
  }, []);

  const updateTimeSlots = useCallback((slots: CenterSetupWizardState['timeSlots']) => {
    setState(prev => ({ ...prev, timeSlots: slots }));
  }, []);

  const updateFinance = useCallback((partial: Partial<CenterSetupWizardState['finance']>) => {
    setState(prev => ({ ...prev, finance: { ...prev.finance, ...partial } }));
  }, []);

  const updateTrainers = useCallback((trainers: CenterSetupWizardState['trainers']) => {
    setState(prev => ({ ...prev, trainers }));
  }, []);

  const updateLearners = useCallback((learners: CenterSetupWizardState['learners']) => {
    setState(prev => ({ ...prev, learners }));
  }, []);

  const nextStep = () => setState(prev => ({ ...prev, currentStep: Math.min(prev.currentStep + 1, STEPS.length - 1) }));
  const prevStep = () => setState(prev => ({ ...prev, currentStep: Math.max(prev.currentStep - 1, 0) }));
  const goToStep = (idx: number) => { if (idx <= state.currentStep) setState(prev => ({ ...prev, currentStep: idx })); };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // 1. Update school profile
      await schoolsAPI.updateProfile({
        name: state.general.name,
        address: state.general.address,
      });

      // 2. Create rooms
      for (const room of state.general.rooms) {
        try {
          await formationAPI.departments.create({ name: '__room__' + room.name, color: '#000', is_room: true });
        } catch { /* rooms created separately or via academics */ }
      }

      // 3. Create departments
      const deptIds: string[] = [];
      for (const dept of state.departments) {
        try {
          const res = await formationAPI.departments.create({
            name: dept.name,
            color: dept.color,
            description: dept.description || '',
          });
          deptIds.push(res.data.id);
        } catch { /* skip duplicates */ }
      }

      // 4. Create formations
      for (const fm of state.formations) {
        const deptId = deptIds[fm.department_index];
        if (!deptId) continue;
        try {
          await formationAPI.formations.create({
            name: fm.name,
            department: deptId,
            audience: fm.audience,
            total_duration_hours: fm.total_duration_hours,
            prerequisites: fm.prerequisites || '',
            entry_evaluation_mode: fm.entry_evaluation_mode,
            levels: fm.levels,
            fee_amount: fm.fee_amount,
            billing_cycle: fm.billing_cycle,
            registration_fee: fm.registration_fee,
            max_learners_per_group: fm.max_learners_per_group,
          });
        } catch { /* skip */ }
      }

      // 5. Complete setup
      await schoolsAPI.completeSetup();
      message.success('Configuration du centre terminée !');
      navigate('/formation/dashboard');
    } catch {
      message.error('Erreur lors de la configuration');
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="setup-wizard-loading">
        <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 36, color: '#0d9488' }} spin />} />
        <span style={{ color: '#64748b', fontSize: 14 }}>Chargement du profil du centre...</span>
      </div>
    );
  }

  const progressPercent = ((state.currentStep + 1) / STEPS.length) * 100;

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: return <CenterStep1General data={state.general} onChange={updateGeneral} />;
      case 1: return <CenterStep2Departments data={state.departments} onChange={updateDepartments} />;
      case 2: return <CenterStep3Formations data={state.formations} departments={state.departments} onChange={updateFormations} />;
      case 3: return <CenterStep4TimeSlots data={state.timeSlots} workingDays={state.general.working_days} onChange={updateTimeSlots} onWorkingDaysChange={(d: number[]) => updateGeneral({ working_days: d })} />;
      case 4: return <CenterStep5Finance data={state.finance} onChange={updateFinance} />;
      case 5: return <CenterStep6Import trainers={state.trainers} learners={state.learners} onTrainersChange={updateTrainers} onLearnersChange={updateLearners} />;
      default: return null;
    }
  };

  const isLastStep = state.currentStep === STEPS.length - 1;

  return (
    <div className="setup-wizard">
      {/* Header */}
      <div className="setup-wizard-header">
        <div className="setup-wizard-header-content">
          <div className="header-title-section">
            <h1>Configuration du Centre de Formation</h1>
            <p>Configurez votre centre en quelques étapes simples</p>
          </div>
          <div className="header-progress">
            <div className="header-step-badge">
              <span className="badge-num">{state.currentStep + 1}</span>
              <span>Étape {state.currentStep + 1} sur {STEPS.length}</span>
            </div>
            <div className="header-progress-track">
              <div className="header-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="setup-wizard-stepper">
        <div className="stepper-track">
          {STEPS.map((step, idx) => {
            const status = idx < state.currentStep ? 'completed' : idx === state.currentStep ? 'active' : 'pending';
            const isClickable = idx <= state.currentStep;
            return (
              <React.Fragment key={idx}>
                <div
                  className={`stepper-step ${status} ${isClickable ? 'clickable' : ''}`}
                  onClick={() => isClickable && goToStep(idx)}
                  title={step.label}
                >
                  <div className="stepper-node">
                    <div className="stepper-icon">
                      {status === 'completed' ? <CheckOutlined className="stepper-check-icon" /> : step.icon}
                    </div>
                    <span className="stepper-label">{step.label}</span>
                  </div>
                </div>
                {idx < STEPS.length - 1 && <div className={`stepper-connector ${idx < state.currentStep ? 'done' : ''}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="setup-wizard-body" key={state.currentStep}>
        {renderStep()}
      </div>

      {/* Footer */}
      <div className="setup-wizard-footer">
        <div className="setup-wizard-footer-content">
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={prevStep}
            disabled={state.currentStep === 0}
          >
            Précédent
          </Button>
          <div style={{ flex: 1 }} />
          {isLastStep ? (
            <Button
              type="primary"
              size="large"
              icon={<RocketOutlined />}
              onClick={handleComplete}
              loading={saving}
            >
              Terminer la configuration
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={nextStep}
            >
              Suivant
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CenterSetupWizard;
