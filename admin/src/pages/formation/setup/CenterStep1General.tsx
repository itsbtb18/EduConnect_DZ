/**
 * Center Setup — Step 1: General Information
 */
import React from 'react';
import { Form, Input, InputNumber, TimePicker, Button, Card, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, HomeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CenterSetupWizardState, CenterRoomEntry } from '../../../types/formation';

interface Props {
  data: CenterSetupWizardState['general'];
  onChange: (partial: Partial<CenterSetupWizardState['general']>) => void;
}

const CenterStep1General: React.FC<Props> = ({ data, onChange }) => {
  const addRoom = () => {
    onChange({ rooms: [...data.rooms, { name: `Salle ${data.rooms.length + 1}`, capacity: 20 }] });
  };

  const updateRoom = (index: number, field: keyof CenterRoomEntry, value: string | number) => {
    const updated = data.rooms.map((r, i) => i === index ? { ...r, [field]: value } : r);
    onChange({ rooms: updated });
  };

  const removeRoom = (index: number) => {
    if (data.rooms.length <= 1) return;
    onChange({ rooms: data.rooms.filter((_, i) => i !== index) });
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ marginBottom: 4, color: '#0f172a' }}>Informations générales</h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Renseignez les informations de base de votre centre de formation</p>

      <Form layout="vertical">
        <Form.Item label="Nom du centre" required>
          <Input
            value={data.name}
            onChange={e => onChange({ name: e.target.value })}
            placeholder="Ex: Centre de Formation ILMI"
            size="large"
          />
        </Form.Item>

        <Form.Item label="Adresse">
          <Input.TextArea
            value={data.address}
            onChange={e => onChange({ address: e.target.value })}
            placeholder="Adresse complète"
            rows={2}
          />
        </Form.Item>

        <Form.Item label="Capacité totale (apprenants)">
          <InputNumber
            value={data.capacity}
            onChange={v => onChange({ capacity: v || 0 })}
            min={1}
            style={{ width: '100%' }}
            size="large"
          />
        </Form.Item>

        <Form.Item label="Horaires d'ouverture">
          <Space size="middle">
            <TimePicker
              value={dayjs(data.opening_hours.start, 'HH:mm')}
              onChange={v => onChange({ opening_hours: { ...data.opening_hours, start: v?.format('HH:mm') || '08:00' } })}
              format="HH:mm"
              placeholder="Ouverture"
            />
            <span style={{ color: '#94a3b8' }}>à</span>
            <TimePicker
              value={dayjs(data.opening_hours.end, 'HH:mm')}
              onChange={v => onChange({ opening_hours: { ...data.opening_hours, end: v?.format('HH:mm') || '21:00' } })}
              format="HH:mm"
              placeholder="Fermeture"
            />
          </Space>
        </Form.Item>

        {/* Rooms */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, color: '#0f172a' }}><HomeOutlined /> Salles</h3>
            <Button icon={<PlusOutlined />} onClick={addRoom} size="small">Ajouter une salle</Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.rooms.map((room, idx) => (
              <Card key={idx} size="small" style={{ background: '#f8fafc' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Input
                    value={room.name}
                    onChange={e => updateRoom(idx, 'name', e.target.value)}
                    placeholder="Nom de la salle"
                    style={{ flex: 2 }}
                  />
                  <InputNumber
                    value={room.capacity}
                    onChange={v => updateRoom(idx, 'capacity', v || 0)}
                    min={1}
                    style={{ flex: 1 }}
                    addonAfter="places"
                  />
                  <Button
                    icon={<DeleteOutlined />}
                    danger
                    size="small"
                    onClick={() => removeRoom(idx)}
                    disabled={data.rooms.length <= 1}
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Form>
    </div>
  );
};

export default CenterStep1General;
