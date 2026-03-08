/**
 * Center Setup — Step 4: Time Slots
 */
import React from 'react';
import { TimePicker, Input, Button, Card, Checkbox, Tag, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CenterTimeSlotEntry } from '../../../types/formation';
import { DAYS_OF_WEEK } from '../../../constants/training-center';

interface Props {
  data: CenterTimeSlotEntry[];
  workingDays: number[];
  onChange: (slots: CenterTimeSlotEntry[]) => void;
  onWorkingDaysChange: (days: number[]) => void;
}

const CenterStep4TimeSlots: React.FC<Props> = ({ data, workingDays, onChange, onWorkingDaysChange }) => {
  const addSlot = () => {
    const last = data[data.length - 1];
    const start = last ? last.end : '08:00';
    const [h, m] = start.split(':').map(Number);
    const endH = h + 1;
    const end = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    onChange([...data, { label: `Créneau ${data.length + 1}`, start, end }]);
  };

  const updateSlot = (index: number, field: keyof CenterTimeSlotEntry, value: string) => {
    onChange(data.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const removeSlot = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const toggleDay = (day: number) => {
    if (workingDays.includes(day)) {
      onWorkingDaysChange(workingDays.filter(d => d !== day));
    } else {
      onWorkingDaysChange([...workingDays, day].sort());
    }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ marginBottom: 4, color: '#0f172a' }}>
        <ClockCircleOutlined style={{ marginRight: 8 }} />
        Créneaux horaires
      </h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Configurez les tranches horaires standard et les jours ouvrables
      </p>

      {/* Working Days */}
      <Card size="small" style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#334155' }}>Jours ouvrables</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {DAYS_OF_WEEK.map(d => (
            <Checkbox
              key={d.value}
              checked={workingDays.includes(d.value)}
              onChange={() => toggleDay(d.value)}
            >
              {d.label}
            </Checkbox>
          ))}
          <Checkbox
            checked={workingDays.includes(5)}
            onChange={() => toggleDay(5)}
          >
            Vendredi
          </Checkbox>
          <Checkbox
            checked={workingDays.includes(6)}
            onChange={() => toggleDay(6)}
          >
            Samedi
          </Checkbox>
        </div>
      </Card>

      {/* Time Slots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((slot, idx) => (
          <Card key={idx} size="small" style={{ background: '#f8fafc' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Tag color="blue">{idx + 1}</Tag>
              <Input
                value={slot.label}
                onChange={e => updateSlot(idx, 'label', e.target.value)}
                placeholder="Label"
                style={{ flex: 2 }}
              />
              <TimePicker
                value={dayjs(slot.start, 'HH:mm')}
                onChange={v => updateSlot(idx, 'start', v?.format('HH:mm') || slot.start)}
                format="HH:mm"
                style={{ flex: 1 }}
              />
              <span style={{ color: '#94a3b8' }}>→</span>
              <TimePicker
                value={dayjs(slot.end, 'HH:mm')}
                onChange={v => updateSlot(idx, 'end', v?.format('HH:mm') || slot.end)}
                format="HH:mm"
                style={{ flex: 1 }}
              />
              <Popconfirm title="Supprimer ?" onConfirm={() => removeSlot(idx)}>
                <Button icon={<DeleteOutlined />} danger size="small" />
              </Popconfirm>
            </div>
          </Card>
        ))}
      </div>

      <Button type="dashed" icon={<PlusOutlined />} onClick={addSlot} style={{ width: '100%', marginTop: 12 }}>
        Ajouter un créneau
      </Button>
    </div>
  );
};

export default CenterStep4TimeSlots;
