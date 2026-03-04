/**
 * CustomStreamForm — Inline form to add custom streams/groups to any level.
 *
 * Displays a "+ Add group" button that expands into a mini-form with:
 *   - Name input
 *   - Color picker (8 preset colors)
 *   - Class count input
 *   - Confirm / Cancel buttons
 */
import React, { useState } from 'react';
import { Button, Input, InputNumber, Space, Tag, Tooltip } from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { CustomStream } from '../../types/wizard';

const PRESET_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

interface Props {
  /** Existing custom streams for duplicate validation */
  existingStreams: CustomStream[];
  /** MEN stream codes already used at this level */
  existingStreamCodes: string[];
  /** Level code for generating temp IDs */
  levelCode: string;
  /** Accent color for the button */
  accentColor?: string;
  /** Callback when a new stream is confirmed */
  onAdd: (stream: CustomStream) => void;
}

const CustomStreamForm: React.FC<Props> = ({
  existingStreams,
  existingStreamCodes,
  levelCode,
  accentColor = '#1677ff',
  onAdd,
}) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [classCount, setClassCount] = useState(1);
  const [error, setError] = useState('');

  const reset = () => {
    setName('');
    setColor(PRESET_COLORS[0]);
    setClassCount(1);
    setError('');
    setOpen(false);
  };

  const generateCode = (n: string): string => {
    // Generate a short code from the name
    const words = n.trim().split(/\s+/);
    let code = words.length >= 2
      ? words.map(w => w[0]).join('').toUpperCase().slice(0, 5)
      : n.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    // Ensure uniqueness
    const allCodes = [
      ...existingStreamCodes,
      ...existingStreams.map(s => s.code),
    ];
    let suffix = 1;
    let candidate = code;
    while (allCodes.includes(candidate)) {
      candidate = `${code}${suffix}`;
      suffix++;
    }
    return candidate || `CUST_${Date.now()}`;
  };

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Le nom est requis');
      return;
    }
    const allNames = [
      ...existingStreams.map(s => s.name.toLowerCase()),
    ];
    if (allNames.includes(trimmed.toLowerCase())) {
      setError('Ce nom de groupe existe déjà');
      return;
    }

    const stream: CustomStream = {
      tempId: `${levelCode}_custom_${Date.now()}`,
      name: trimmed,
      code: generateCode(trimmed),
      color,
      classCount,
    };
    onAdd(stream);
    reset();
  };

  if (!open) {
    return (
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={() => setOpen(true)}
        style={{
          borderColor: accentColor,
          color: accentColor,
          marginTop: 8,
        }}
        block
      >
        Ajouter un groupe / filière
      </Button>
    );
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        borderRadius: 8,
        border: '1px solid #d9d9d9',
        background: '#fafafa',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {/* Name */}
        <div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Nom du groupe</div>
          <Input
            placeholder="Ex: Bilingue, Sportif, Intensif Maths…"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            status={error ? 'error' : undefined}
            autoFocus
          />
          {error && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 2 }}>{error}</div>}
        </div>

        {/* Color picker */}
        <div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Couleur</div>
          <Space wrap size={4}>
            {PRESET_COLORS.map(c => (
              <Tooltip key={c} title={c}>
                <div
                  onClick={() => setColor(c)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: c,
                    cursor: 'pointer',
                    border: color === c ? '3px solid #333' : '2px solid transparent',
                    transition: 'border 0.15s',
                  }}
                />
              </Tooltip>
            ))}
          </Space>
        </div>

        {/* Class count */}
        <div>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Nombre de classes</div>
          <InputNumber
            value={classCount}
            onChange={v => setClassCount(v ?? 1)}
            min={1}
            max={20}
            style={{ width: 100 }}
          />
        </div>

        {/* Actions */}
        <Space>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleConfirm}
            size="small"
            style={{ background: accentColor, borderColor: accentColor }}
          >
            Confirmer
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={reset}
            size="small"
          >
            Annuler
          </Button>
        </Space>
      </Space>

      {/* Preview */}
      {name.trim() && (
        <div style={{ marginTop: 8 }}>
          <Tag color={color} style={{ fontWeight: 600 }}>
            {name.trim()} — {classCount} classe{classCount > 1 ? 's' : ''}
          </Tag>
        </div>
      )}
    </div>
  );
};

export default CustomStreamForm;
