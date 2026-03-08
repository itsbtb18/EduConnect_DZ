/**
 * Center Setup — Step 2: Departments
 */
import React from 'react';
import { Input, Button, Card, ColorPicker, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { CenterDepartmentEntry } from '../../../types/formation';
import { DEPARTMENT_COLORS } from '../../../constants/training-center';

interface Props {
  data: CenterDepartmentEntry[];
  onChange: (deps: CenterDepartmentEntry[]) => void;
}

const SUGGESTED_DEPARTMENTS = [
  'Langues', 'Soutien scolaire', 'Informatique', 'Formation professionnelle',
  'Préparation examens', 'Développement personnel', 'Arts & Design',
];

const CenterStep2Departments: React.FC<Props> = ({ data, onChange }) => {
  const addDepartment = (name?: string) => {
    const color = DEPARTMENT_COLORS[data.length % DEPARTMENT_COLORS.length];
    onChange([...data, { name: name || '', color, description: '' }]);
  };

  const updateDept = (index: number, field: keyof CenterDepartmentEntry, value: string) => {
    onChange(data.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const removeDept = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const existingNames = new Set(data.map(d => d.name));
  const suggestions = SUGGESTED_DEPARTMENTS.filter(s => !existingNames.has(s));

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ marginBottom: 4, color: '#0f172a' }}>
        <AppstoreOutlined style={{ marginRight: 8 }} />
        Départements
      </h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Définissez les départements de votre centre (Langues, Soutien, Numérique, etc.)
      </p>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <span style={{ color: '#64748b', fontSize: 13, marginRight: 8 }}>Suggestions :</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map(s => (
              <Button key={s} size="small" onClick={() => addDepartment(s)} style={{ fontSize: 12 }}>
                + {s}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Department List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((dept, idx) => (
          <Card key={idx} size="small" style={{ borderLeft: `4px solid ${dept.color}` }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <ColorPicker
                value={dept.color}
                onChange={(_, hex) => updateDept(idx, 'color', hex)}
                size="small"
              />
              <Input
                value={dept.name}
                onChange={e => updateDept(idx, 'name', e.target.value)}
                placeholder="Nom du département"
                style={{ flex: 2 }}
              />
              <Input
                value={dept.description}
                onChange={e => updateDept(idx, 'description', e.target.value)}
                placeholder="Description (optionnel)"
                style={{ flex: 2 }}
              />
              <Popconfirm title="Supprimer ce département ?" onConfirm={() => removeDept(idx)}>
                <Button icon={<DeleteOutlined />} danger size="small" />
              </Popconfirm>
            </div>
          </Card>
        ))}
      </div>

      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => addDepartment()}
        style={{ marginTop: 16, width: '100%' }}
      >
        Ajouter un département
      </Button>
    </div>
  );
};

export default CenterStep2Departments;
