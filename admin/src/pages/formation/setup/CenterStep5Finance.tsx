/**
 * Center Setup — Step 5: Financial Settings
 */
import React from 'react';
import { Form, Input, InputNumber, Checkbox, Card } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import type { CenterSetupWizardState } from '../../../types/formation';

interface Props {
  data: CenterSetupWizardState['finance'];
  onChange: (partial: Partial<CenterSetupWizardState['finance']>) => void;
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Espèces' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'ccp', label: 'CCP' },
  { value: 'baridi_mob', label: 'BaridiMob' },
  { value: 'dahabia', label: 'Carte Dahabia' },
];

const CenterStep5Finance: React.FC<Props> = ({ data, onChange }) => {
  const toggleMethod = (method: string) => {
    if (data.payment_methods.includes(method)) {
      onChange({ payment_methods: data.payment_methods.filter(m => m !== method) });
    } else {
      onChange({ payment_methods: [...data.payment_methods, method] });
    }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 style={{ marginBottom: 4, color: '#0f172a' }}>
        <DollarOutlined style={{ marginRight: 8 }} />
        Paramètres financiers
      </h2>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Configurez les modes de paiement, la politique d'inscription et la TVA
      </p>

      <Form layout="vertical">
        {/* Payment Methods */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#334155' }}>Modes de paiement acceptés</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {PAYMENT_METHOD_OPTIONS.map(pm => (
              <Checkbox
                key={pm.value}
                checked={data.payment_methods.includes(pm.value)}
                onChange={() => toggleMethod(pm.value)}
              >
                {pm.label}
              </Checkbox>
            ))}
          </div>
        </Card>

        <Form.Item label="Politique d'inscription">
          <Input.TextArea
            value={data.registration_policy}
            onChange={e => onChange({ registration_policy: e.target.value })}
            rows={3}
            placeholder="Ex: Frais d'inscription non remboursables..."
          />
        </Form.Item>

        <Form.Item label="Politique de remboursement">
          <Input.TextArea
            value={data.refund_policy}
            onChange={e => onChange({ refund_policy: e.target.value })}
            rows={3}
            placeholder="Conditions de remboursement..."
          />
        </Form.Item>

        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item label="Rappel de paiement (jours avant)" style={{ flex: 1 }}>
            <InputNumber
              value={data.reminder_days}
              onChange={v => onChange({ reminder_days: v || 3 })}
              min={1}
              max={30}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item label="Taux TVA (%)" style={{ flex: 1 }}>
            <InputNumber
              value={data.tva_rate}
              onChange={v => onChange({ tva_rate: v || 0 })}
              min={0}
              max={100}
              style={{ width: '100%' }}
              addonAfter="%"
            />
          </Form.Item>
        </div>
      </Form>
    </div>
  );
};

export default CenterStep5Finance;
