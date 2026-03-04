/**
 * GradesFullPage — comprehensive grade management page with 4 tabs.
 * Route: /notes-bulletins
 */
import React, { useState, useMemo } from 'react';
import { Tabs, Select, Badge, Tag } from 'antd';
import {
  SettingOutlined,
  EditOutlined,
  BarChartOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { GradeFilters } from '../../types/grades';
import type { Section, Level, ClassInfo } from '../../types';
import { useSections, useLevels, useClasses, usePendingAppealsCount } from '../../hooks/useApi';
import ExamTypesTab from './tabs/ExamTypesTab';
import GradeEntryTab from './tabs/GradeEntryTab';
import AveragesTab from './tabs/AveragesTab';
import AppealsTab from './tabs/AppealsTab';
import './GradesFullPage.css';

const TRIMESTER_OPTIONS = [
  { value: 1, label: '1er Trimestre' },
  { value: 2, label: '2ème Trimestre' },
  { value: 3, label: '3ème Trimestre' },
];

const GradesFullPage: React.FC = () => {
  // Filter state
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);
  const [classroomId, setClassroomId] = useState<string | null>(null);
  const [trimester, setTrimester] = useState<1 | 2 | 3>(1);
  const [activeTab, setActiveTab] = useState('exam-types');

  // Data fetching
  const { data: sectionsData } = useSections();
  const sections: Section[] = (sectionsData?.results || []) as Section[];

  const { data: levelsData } = useLevels(sectionId ? { section: sectionId } : undefined);
  const levels: Level[] = (levelsData?.results || []) as Level[];

  const { data: classesData } = useClasses(levelId ? { level: levelId } : undefined);
  const classes: ClassInfo[] = (classesData?.results || []) as ClassInfo[];

  const { data: pendingCount } = usePendingAppealsCount();

  // Current class info for passing to tabs
  const classInfo: ClassInfo | null = useMemo(
    () => classes.find(c => c.id === classroomId) || null,
    [classes, classroomId],
  );

  const filters: GradeFilters = {
    sectionId,
    levelId,
    classroomId,
    trimester,
  };

  const handleSectionChange = (val: string | null) => {
    setSectionId(val);
    setLevelId(null);
    setClassroomId(null);
  };

  const handleLevelChange = (val: string | null) => {
    setLevelId(val);
    setClassroomId(null);
  };

  const tabItems = [
    {
      key: 'exam-types',
      label: (
        <span>
          <SettingOutlined /> Types d'Examens
        </span>
      ),
      children: <ExamTypesTab filters={filters} classInfo={classInfo} />,
    },
    {
      key: 'grade-entry',
      label: (
        <span>
          <EditOutlined /> Saisie & Notes
        </span>
      ),
      children: <GradeEntryTab filters={filters} classInfo={classInfo} />,
    },
    {
      key: 'averages',
      label: (
        <span>
          <BarChartOutlined /> Moyennes & Classements
        </span>
      ),
      children: <AveragesTab filters={filters} classInfo={classInfo} />,
    },
    {
      key: 'appeals',
      label: (
        <Badge count={pendingCount || 0} offset={[8, -2]} size="small">
          <span>
            <ExclamationCircleOutlined /> Recours
          </span>
        </Badge>
      ),
      children: <AppealsTab filters={filters} />,
    },
  ];

  return (
    <div className="page animate-fade-in">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header__info">
          <h1 className="page-header__title">📊 Notes & Bulletins</h1>
          <p className="page-header__subtitle">
            Gestion complète des notes, moyennes, classements et recours
          </p>
        </div>
        {classInfo && (
          <div className="page-header__actions">
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              {classInfo.level_name} — {classInfo.name}
            </Tag>
            <Tag color="cyan" style={{ fontSize: 14, padding: '4px 12px' }}>
              {TRIMESTER_OPTIONS.find(t => t.value === trimester)?.label}
            </Tag>
            {classInfo.student_count != null && (
              <Tag style={{ fontSize: 13, padding: '4px 10px' }}>
                👥 {classInfo.student_count} élèves
              </Tag>
            )}
          </div>
        )}
      </div>

      {/* Filter bar */}
      <div className="grades-filter-bar">
        <Select
          placeholder="Section"
          value={sectionId}
          onChange={handleSectionChange}
          allowClear
          style={{ width: 180 }}
          options={sections.map(s => ({ value: s.id, label: s.name }))}
        />
        <Select
          placeholder="Niveau"
          value={levelId}
          onChange={handleLevelChange}
          allowClear
          disabled={!sectionId}
          style={{ width: 180 }}
          options={levels.map(l => ({ value: l.id, label: `${l.name} (${l.code})` }))}
        />
        <Select
          placeholder="Classe"
          value={classroomId}
          onChange={setClassroomId}
          allowClear
          disabled={!levelId}
          style={{ width: 200 }}
          options={classes.map(c => ({
            value: c.id,
            label: `${c.name}${c.student_count != null ? ` (${c.student_count} él.)` : ''}`,
          }))}
        />
        <Select
          value={trimester}
          onChange={(v) => setTrimester(v as 1 | 2 | 3)}
          style={{ width: 160 }}
          options={TRIMESTER_OPTIONS}
        />
      </div>

      {/* Tabs */}
      <div className="card card--table" style={{ padding: '16px 20px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          style={{ minHeight: 400 }}
        />
      </div>
    </div>
  );
};

export default GradesFullPage;
