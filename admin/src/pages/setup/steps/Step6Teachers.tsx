/**
 * Step 6 — Enseignants
 *
 * New teacher form with:
 *   1. Identity: Nom, Prénom, Téléphone, Email
 *   2. Sections: Multi-select checkboxes (Primaire / CEM / Lycée)
 *   3. Matières: Filtered by selected sections
 *   4. Classes: Filtered by selected sections
 *   5. Password with generate button
 *   + Import buttons (design only, no backend logic)
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  Card, Form, Input, Button, Table, Tag, Popconfirm, Row, Col, Select,
  Empty, Statistic, Checkbox, Space, Tooltip, Divider, message,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, UserOutlined, PhoneOutlined,
  MailOutlined, LockOutlined, ReloadOutlined,
  EyeOutlined, EyeInvisibleOutlined,
} from '@ant-design/icons';
import ImportButtons from '../../../components/ui/ImportButtons';
import { CYCLE_COLORS, SUBJECTS, type CycleType } from '../../../constants/algerian-curriculum';
import type {
  TeacherEntry, LevelSubjectConfig, LevelConfig, SectionConfig,
} from '../../../types/wizard';

// ── Helpers ───────────────────────────────────────────────────────────

/** Generate a cryptographically-ish strong random password */
function generatePassword(length = 12): string {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;
  // Ensure at least one of each category
  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = pwd.length; i < length; i++) {
    pwd.push(all[Math.floor(Math.random() * all.length)]);
  }
  // Shuffle
  pwd = pwd.sort(() => Math.random() - 0.5);
  return pwd.join('');
}

/** Map cycle type to section type label */
const SECTION_OPTIONS: { value: CycleType; label: string; emoji: string; color: string }[] = [
  { value: 'PRIMARY', label: 'Primaire',      emoji: '', color: CYCLE_COLORS.PRIMARY.bg },
  { value: 'MIDDLE',  label: 'CEM (Moyen)',   emoji: '', color: CYCLE_COLORS.MIDDLE.bg },
  { value: 'HIGH',    label: 'Lycée',         emoji: '', color: CYCLE_COLORS.HIGH.bg },
];

// ── Props ─────────────────────────────────────────────────────────────

interface Props {
  teachers: TeacherEntry[];
  subjects: LevelSubjectConfig[];
  levels: LevelConfig[];
  sections: SectionConfig[];
  onAdd: (teacher: TeacherEntry) => void;
  onUpdate: (tempId: string, data: Partial<TeacherEntry>) => void;
  onRemove: (tempId: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────

const Step6Teachers: React.FC<Props> = ({
  teachers, subjects, levels, sections, onAdd, onUpdate, onRemove,
}) => {
  const [form] = Form.useForm();
  const [showPassword, setShowPassword] = useState(false);

  // Only show section options that are actually enabled in the school
  const enabledSections = useMemo(() =>
    SECTION_OPTIONS.filter(opt =>
      sections.some(s => s.type === opt.value && s.enabled),
    ),
  [sections]);

  // Watch form's sectionTypes for dynamic filtering
  const formSectionTypes: CycleType[] = Form.useWatch('sectionTypes', form) || [];

  // ── Available subjects: filtered by selected sections ───────────
  const availableSubjects = useMemo(() => {
    if (formSectionTypes.length === 0) return [];
    const subjectMap = new Map<string, { code: string; name: string; color: string }>();
    for (const lsc of subjects) {
      // Find the level to determine its cycle
      const lvl = levels.find(l => l.code === lsc.levelCode);
      if (!lvl || !formSectionTypes.includes(lvl.cycle)) continue;
      for (const sub of lsc.subjects) {
        if (!subjectMap.has(sub.subjectCode)) {
          subjectMap.set(sub.subjectCode, {
            code: sub.subjectCode,
            name: sub.subjectName || SUBJECTS[sub.subjectCode]?.name || sub.subjectCode,
            color: sub.color || SUBJECTS[sub.subjectCode]?.color || '#666',
          });
        }
      }
    }
    return Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [formSectionTypes, subjects, levels]);

  // ── Available classes: filtered by selected sections ────────────
  const availableClasses = useMemo(() => {
    if (formSectionTypes.length === 0) return [];
    const classes: { value: string; label: string; cycle: CycleType }[] = [];
    for (const lvl of levels) {
      if (!lvl.enabled || !formSectionTypes.includes(lvl.cycle)) continue;
      const hasStreams = lvl.enabledStreams.length > 0 || (lvl.customStreams || []).length > 0;

      if (!hasStreams) {
        // Simple classes: CODE-1, CODE-2, etc.
        for (let i = 1; i <= lvl.classCount; i++) {
          const defaultName = `${lvl.code}-${i}`;
          const displayName = lvl.classNames?.[defaultName] || defaultName;
          classes.push({ value: defaultName, label: displayName, cycle: lvl.cycle });
        }
      } else {
        // Official stream classes
        for (const sc of lvl.enabledStreams) {
          const count = lvl.streamClasses[sc] || 1;
          for (let i = 1; i <= count; i++) {
            const defaultName = `${lvl.code}-${sc.replace('TC_', '')}-${i}`;
            const displayName = lvl.streamClassNames?.[defaultName] || defaultName;
            classes.push({ value: defaultName, label: displayName, cycle: lvl.cycle });
          }
        }
        // Custom stream classes
        for (const cs of (lvl.customStreams || [])) {
          for (let i = 1; i <= cs.classCount; i++) {
            const defaultName = `${lvl.code}-${cs.code}-${i}`;
            const displayName = lvl.streamClassNames?.[defaultName] || defaultName;
            classes.push({ value: defaultName, label: displayName, cycle: lvl.cycle });
          }
        }
      }
    }
    return classes;
  }, [formSectionTypes, levels]);

  // ── When sections change → clean up subjects & classes ──────────
  const handleSectionChange = useCallback((checkedValues: CycleType[]) => {
    form.setFieldsValue({ sectionTypes: checkedValues });
    // Remove subject codes that belong to unchecked sections
    const currentSubjects: string[] = form.getFieldValue('subjectCodes') || [];
    const currentClasses: string[] = form.getFieldValue('classAssignments') || [];
    // Build set of valid subject codes for the checked sections
    const validSubjects = new Set<string>();
    for (const lsc of subjects) {
      const lvl = levels.find(l => l.code === lsc.levelCode);
      if (!lvl || !checkedValues.includes(lvl.cycle)) continue;
      for (const sub of lsc.subjects) validSubjects.add(sub.subjectCode);
    }
    // Build set of valid class keys for checked sections
    const validClasses = new Set<string>();
    for (const lvl of levels) {
      if (!lvl.enabled || !checkedValues.includes(lvl.cycle)) continue;
      const hasStreams = lvl.enabledStreams.length > 0 || (lvl.customStreams || []).length > 0;
      if (!hasStreams) {
        for (let i = 1; i <= lvl.classCount; i++) validClasses.add(`${lvl.code}-${i}`);
      } else {
        for (const sc of lvl.enabledStreams) {
          const count = lvl.streamClasses[sc] || 1;
          for (let i = 1; i <= count; i++) validClasses.add(`${lvl.code}-${sc.replace('TC_', '')}-${i}`);
        }
        for (const cs of (lvl.customStreams || [])) {
          for (let i = 1; i <= cs.classCount; i++) validClasses.add(`${lvl.code}-${cs.code}-${i}`);
        }
      }
    }
    form.setFieldsValue({
      subjectCodes: currentSubjects.filter(c => validSubjects.has(c)),
      classAssignments: currentClasses.filter(c => validClasses.has(c)),
    });
  }, [form, subjects, levels]);

  // ── Password generation ─────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    const pwd = generatePassword();
    form.setFieldsValue({ password: pwd, passwordConfirm: pwd });
    message.info('Mot de passe généré !');
  }, [form]);

  // ── Add teacher ─────────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    form.validateFields().then(values => {
      const entry: TeacherEntry = {
        tempId: `teacher_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        email: values.email || '',
        sectionTypes: values.sectionTypes || [],
        subjectCodes: values.subjectCodes || [],
        classAssignments: values.classAssignments || [],
        password: values.password,
      };
      onAdd(entry);
      form.resetFields();
      setShowPassword(false);
    });
  }, [form, onAdd]);

  // ── Table columns ───────────────────────────────────────────────
  const columns = [
    {
      title: 'Enseignant',
      key: 'name',
      render: (_: unknown, record: TeacherEntry) => (
        <div>
          <UserOutlined style={{ marginRight: 8 }} />
          <strong>{record.lastName} {record.firstName}</strong>
        </div>
      ),
    },
    {
      title: 'Téléphone',
      dataIndex: 'phone',
      key: 'phone',
      width: 140,
      render: (val: string) => (
        <span><PhoneOutlined style={{ marginRight: 4 }} />{val}</span>
      ),
    },
    {
      title: 'Sections',
      dataIndex: 'sectionTypes',
      key: 'sectionTypes',
      width: 180,
      render: (types: string[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(types || []).map(t => {
            const opt = SECTION_OPTIONS.find(o => o.value === t);
            return (
              <Tag key={t} color={opt?.color || '#666'} style={{ fontSize: 11 }}>
                {opt?.emoji} {opt?.label || t}
              </Tag>
            );
          })}
        </div>
      ),
    },
    {
      title: 'Matières',
      dataIndex: 'subjectCodes',
      key: 'subjectCodes',
      render: (codes: string[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(codes || []).map(c => (
            <Tag key={c} color={SUBJECTS[c]?.color || '#666'} style={{ fontSize: 11 }}>
              {SUBJECTS[c]?.name || c}
            </Tag>
          ))}
          {(!codes || codes.length === 0) && <Tag>—</Tag>}
        </div>
      ),
    },
    {
      title: 'Classes',
      dataIndex: 'classAssignments',
      key: 'classAssignments',
      render: (ids: string[]) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(ids || []).map(id => (
            <Tag key={id} style={{ fontSize: 11 }}>{id}</Tag>
          ))}
          {(!ids || ids.length === 0) && <Tag>—</Tag>}
        </div>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: TeacherEntry) => (
        <Popconfirm
          title="Supprimer cet enseignant ?"
          okText="Oui"
          cancelText="Non"
          onConfirm={() => onRemove(record.tempId)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="wizard-step-content">
      <div className="step-header">
        <h2>Enseignants</h2>
        <p>Ajoutez vos enseignants avec leurs sections, matières et classes. Cette étape est optionnelle.</p>
      </div>

      {/* ── Import Buttons (Design Only — Coming Soon) ── */}
      <Row gutter={12} style={{ marginBottom: 16 }} align="middle">
        <Col>
          <ImportButtons templateType="teachers" />
        </Col>
        <Col flex="auto" />
        <Col>
          <Card size="small" style={{ background: '#f0f9ff', border: '1px solid #bae0ff' }}>
            <Statistic
              title="Enseignants ajoutés"
              value={teachers.length}
              prefix={<UserOutlined />}
              valueStyle={{ fontSize: 20 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Add Teacher Form ── */}
      <Card
        title={<span><PlusOutlined style={{ marginRight: 8 }} />Ajouter un enseignant</span>}
        style={{ marginBottom: 24, borderColor: '#0d9488' }}
        headStyle={{ background: '#f0fdfa', borderBottom: '1px solid #99f6e4' }}
      >
        <Form form={form} layout="vertical" size="middle" requiredMark="optional">
          {/* ── Ligne 1: Identité ── */}
          <Row gutter={16}>
            <Col xs={24} md={6}>
              <Form.Item
                name="lastName"
                label="Nom"
                rules={[{ required: true, message: 'Le nom est requis' }]}
              >
                <Input placeholder="Nom de famille" prefix={<UserOutlined style={{ color: '#bbb' }} />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="firstName"
                label="Prénom"
                rules={[{ required: true, message: 'Le prénom est requis' }]}
              >
                <Input placeholder="Prénom" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name="phone"
                label="Téléphone"
                rules={[
                  { required: true, message: 'Le téléphone est requis' },
                  { pattern: /^0[5-7]\d{8}$/, message: 'Format: 05/06/07 XX XX XX XX' },
                ]}
              >
                <Input placeholder="0XX XX XX XX" prefix={<PhoneOutlined style={{ color: '#bbb' }} />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item name="email" label="Email">
                <Input placeholder="email@exemple.dz" prefix={<MailOutlined style={{ color: '#bbb' }} />} />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Ligne 2: Sections enseignées ── */}
          <Form.Item
            name="sectionTypes"
            label="Sections enseignées"
            rules={[{
              required: true,
              message: 'Sélectionnez au moins une section',
              type: 'array',
              min: 1,
            }]}
          >
            <Checkbox.Group
              onChange={vals => handleSectionChange(vals as CycleType[])}
              style={{ width: '100%' }}
            >
              <Space size={12}>
                {enabledSections.map(opt => (
                  <Checkbox
                    key={opt.value}
                    value={opt.value}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: `2px solid ${formSectionTypes.includes(opt.value) ? opt.color : '#e8e8e8'}`,
                      background: formSectionTypes.includes(opt.value) ? `${opt.color}10` : '#fafafa',
                      transition: 'all 0.2s',
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ color: formSectionTypes.includes(opt.value) ? opt.color : '#666' }}>
                      {opt.emoji} {opt.label}
                    </span>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>

          {/* ── Ligne 3: Matières enseignées ── */}
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="subjectCodes" label="Matières enseignées">
                <Select
                  mode="multiple"
                  placeholder={formSectionTypes.length === 0
                    ? 'Sélectionnez d\'abord les sections ci-dessus'
                    : 'Sélectionnez les matières'
                  }
                  disabled={formSectionTypes.length === 0}
                  optionFilterProp="label"
                  options={availableSubjects.map(s => ({
                    value: s.code,
                    label: s.name,
                  }))}
                  tagRender={(props) => {
                    const subj = availableSubjects.find(s => s.code === props.value);
                    return (
                      <Tag
                        color={subj?.color || '#666'}
                        closable={props.closable}
                        onClose={props.onClose}
                        style={{ marginRight: 3, fontSize: 11 }}
                      >
                        {props.label}
                      </Tag>
                    );
                  }}
                />
              </Form.Item>
            </Col>

            {/* ── Ligne 4: Classes assignées ── */}
            <Col xs={24} md={12}>
              <Form.Item name="classAssignments" label="Classes assignées">
                <Select
                  mode="multiple"
                  placeholder={formSectionTypes.length === 0
                    ? 'Sélectionnez d\'abord les sections ci-dessus'
                    : 'Sélectionnez les classes'
                  }
                  disabled={formSectionTypes.length === 0}
                  optionFilterProp="label"
                  options={availableClasses.map(c => ({
                    value: c.value,
                    label: c.label,
                  }))}
                  tagRender={(props) => {
                    const cls = availableClasses.find(c => c.value === props.value);
                    const cyc = cls?.cycle;
                    const color = cyc ? CYCLE_COLORS[cyc].bg : '#666';
                    return (
                      <Tag
                        color={color}
                        closable={props.closable}
                        onClose={props.onClose}
                        style={{ marginRight: 3, fontSize: 11 }}
                      >
                        {props.label}
                      </Tag>
                    );
                  }}
                />
              </Form.Item>
            </Col>
          </Row>

          {formSectionTypes.length > 0 && (
            <div style={{ fontSize: 12, color: '#999', fontStyle: 'italic', marginTop: -12, marginBottom: 12 }}>
              Vous pouvez modifier les assignations de classes depuis la page Classes après la configuration.
            </div>
          )}

          {/* ── Mot de passe ── */}
          <Divider style={{ margin: '8px 0 16px' }} />
          <Row gutter={16} align="bottom">
            <Col xs={24} md={8}>
              <Form.Item
                name="password"
                label="Mot de passe"
                rules={[
                  { required: true, message: 'Le mot de passe est requis' },
                  { min: 8, message: 'Minimum 8 caractères' },
                ]}
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  prefix={<LockOutlined style={{ color: '#bbb' }} />}
                  suffix={
                    <Button
                      type="text"
                      size="small"
                      icon={showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ marginRight: -4 }}
                    />
                  }
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="passwordConfirm"
                label="Confirmer le mot de passe"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Confirmez le mot de passe' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Les mots de passe ne correspondent pas'));
                    },
                  }),
                ]}
              >
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirmer"
                  prefix={<LockOutlined style={{ color: '#bbb' }} />}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={4} style={{ paddingBottom: 24 }}>
              <Tooltip title="Générer un mot de passe aléatoire fort">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleGenerate}
                >
                  Générer
                </Button>
              </Tooltip>
            </Col>
            <Col flex="auto" style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 24 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                size="large"
              >
                Ajouter l'enseignant
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* ── Teachers List ── */}
      {teachers.length > 0 ? (
        <Card title={`${teachers.length} enseignant${teachers.length > 1 ? 's' : ''} ajouté${teachers.length > 1 ? 's' : ''}`}>
          <Table
            dataSource={teachers}
            columns={columns}
            rowKey="tempId"
            pagination={teachers.length > 10 ? { pageSize: 10 } : false}
            size="small"
            scroll={{ x: 900 }}
          />
        </Card>
      ) : (
        <Empty
          description="Aucun enseignant ajouté"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <p style={{ color: '#999', fontSize: 13 }}>
            Vous pourrez ajouter des enseignants après la configuration initiale
          </p>
        </Empty>
      )}
    </div>
  );
};

export default Step6Teachers;
