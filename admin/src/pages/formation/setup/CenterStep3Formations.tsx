/**
 * Center Setup — Step 3: Formations / Programs
 */
import React, { useState } from 'react';
import { Input, InputNumber, Select, Button, Card, Tag, Modal, Form, Space, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import type { CenterFormationEntry, CenterDepartmentEntry } from '../../../types/formation';
import { AUDIENCE_OPTIONS, BILLING_CYCLE_OPTIONS, ENTRY_EVALUATION_OPTIONS } from '../../../constants/training-center';

interface Props {
  data: CenterFormationEntry[];
  departments: CenterDepartmentEntry[];
  onChange: (formations: CenterFormationEntry[]) => void;
}

const CenterStep3Formations: React.FC<Props> = ({ data, departments, onChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  const openAdd = () => {
    form.resetFields();
    form.setFieldsValue({
      audience: 'MIXED',
      entry_evaluation_mode: 'NONE',
      billing_cycle: 'MONTHLY',
      levels: [],
      total_duration_hours: 60,
      fee_amount: 5000,
      registration_fee: 1000,
      max_learners_per_group: 20,
    });
    setEditIndex(null);
    setModalOpen(true);
  };

  const openEdit = (idx: number) => {
    const fm = data[idx];
    form.setFieldsValue(fm);
    setEditIndex(idx);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editIndex !== null) {
        onChange(data.map((f, i) => i === editIndex ? values : f));
      } else {
        onChange([...data, values]);
      }
      setModalOpen(false);
    } catch { /* validation error */ }
  };

  const removeFormation = (idx: number) => {
    onChange(data.filter((_, i) => i !== idx));
  };

  const groupedByDept = departments.map((dept, deptIdx) => ({
    ...dept,
    deptIndex: deptIdx,
    formations: data.filter(f => f.department_index === deptIdx),
  }));

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ marginBottom: 4, color: '#0f172a' }}>
        <BookOutlined style={{ marginRight: 8 }} />
        Formations & Programmes
      </h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Définissez les formations proposées dans chaque département
      </p>

      {groupedByDept.map(dept => (
        <div key={dept.deptIndex} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: dept.color }} />
            <h3 style={{ margin: 0, fontSize: 15, color: '#334155' }}>{dept.name}</h3>
            <Tag>{dept.formations.length} formation{dept.formations.length !== 1 ? 's' : ''}</Tag>
          </div>

          {dept.formations.length === 0 ? (
            <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 8, color: '#94a3b8', fontSize: 13 }}>
              Aucune formation dans ce département
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {dept.formations.map((fm) => {
                const globalIdx = data.indexOf(fm);
                return (
                  <Card key={globalIdx} size="small" hoverable onClick={() => openEdit(globalIdx)}
                    style={{ cursor: 'pointer', borderLeft: `3px solid ${dept.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{fm.name}</strong>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {AUDIENCE_OPTIONS.find(a => a.value === fm.audience)?.label} · {fm.total_duration_hours}h · {fm.fee_amount} DA
                          {fm.levels.length > 0 && <> · {fm.levels.join(' → ')}</>}
                        </div>
                      </div>
                      <Button icon={<DeleteOutlined />} size="small" danger
                        onClick={e => { e.stopPropagation(); removeFormation(globalIdx); }} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {departments.length === 0 && (
        <Empty description="Veuillez d'abord créer des départements (étape 2)" />
      )}

      <Button type="dashed" icon={<PlusOutlined />} onClick={openAdd} style={{ width: '100%', marginTop: 8 }} disabled={departments.length === 0}>
        Ajouter une formation
      </Button>

      <Modal
        title={editIndex !== null ? 'Modifier la formation' : 'Nouvelle formation'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={600}
        okText="Enregistrer"
        cancelText="Annuler"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="department_index" label="Département" rules={[{ required: true, message: 'Requis' }]}>
            <Select placeholder="Choisir un département">
              {departments.map((d, i) => (
                <Select.Option key={i} value={i}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, display: 'inline-block' }} />
                    {d.name}
                  </span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="name" label="Nom de la formation" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Ex: Anglais Général, Mathématiques BEM, etc." />
          </Form.Item>

          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item name="audience" label="Public cible" style={{ flex: 1 }}>
              <Select options={AUDIENCE_OPTIONS} />
            </Form.Item>
            <Form.Item name="total_duration_hours" label="Durée totale (heures)" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item name="prerequisites" label="Prérequis">
            <Input.TextArea rows={2} placeholder="Aucun prérequis" />
          </Form.Item>

          <Form.Item name="entry_evaluation_mode" label="Mode d'évaluation d'entrée">
            <Select options={ENTRY_EVALUATION_OPTIONS} />
          </Form.Item>

          <Form.Item name="levels" label="Niveaux (dans l'ordre de progression)">
            <Select mode="tags" placeholder="Ex: A1, A2, B1, B2, C1" tokenSeparators={[',']} />
          </Form.Item>

          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item name="fee_amount" label="Tarif (DA)" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="billing_cycle" label="Cycle de facturation" style={{ flex: 1 }}>
              <Select options={BILLING_CYCLE_OPTIONS} />
            </Form.Item>
          </Space>

          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item name="registration_fee" label="Frais d'inscription (DA)" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="max_learners_per_group" label="Max apprenants/groupe" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default CenterStep3Formations;
