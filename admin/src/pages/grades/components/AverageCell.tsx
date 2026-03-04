/**
 * AverageCell — clickable cell that shows average value + popover for override.
 * Used in the Averages tab for both SubjectAverage and TrimesterAverage.
 */
import React, { useState } from 'react';
import { Popover, InputNumber, Input, Button, Space, Tag, Divider } from 'antd';
import { EditOutlined, ReloadOutlined, SendOutlined } from '@ant-design/icons';

interface AverageCellProps {
  id: string;
  calculatedAverage: number | null;
  manualOverride: number | null;
  effectiveAverage: number | null;
  isPublished: boolean;
  isLocked: boolean;
  onOverride: (id: string, value: number, reason: string) => void;
  onRecalculate?: () => void;
  onPublish?: () => void;
  label?: string;
  loading?: boolean;
}

const AverageCell: React.FC<AverageCellProps> = ({
  id,
  calculatedAverage,
  manualOverride,
  effectiveAverage,
  isPublished,
  isLocked,
  onOverride,
  onRecalculate,
  onPublish,
  label,
}) => {
  const [open, setOpen] = useState(false);
  const [overrideVal, setOverrideVal] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const avg = effectiveAverage;
  const hasOverride = manualOverride != null;

  const handleConfirmOverride = () => {
    if (overrideVal != null && reason.trim()) {
      onOverride(id, overrideVal, reason);
      setOpen(false);
      setOverrideVal(null);
      setReason('');
    }
  };

  const popoverContent = (
    <div style={{ width: 260 }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 8, color: '#0F2044' }}>{label}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
        <span style={{ color: '#666' }}>Calculée auto :</span>
        <span style={{ fontWeight: 600 }}>{calculatedAverage != null ? `${calculatedAverage}/20` : '—'}</span>
      </div>
      {hasOverride && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#F59E0B' }}>Override admin :</span>
          <span style={{ fontWeight: 600, color: '#F59E0B' }}>{manualOverride}/20</span>
        </div>
      )}
      <Divider style={{ margin: '8px 0' }} />
      {!isLocked && (
        <>
          <div style={{ marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#666' }}>
            Modifier manuellement :
          </div>
          <InputNumber
            min={0}
            max={20}
            step={0.25}
            precision={2}
            value={overrideVal}
            onChange={(v) => setOverrideVal(v as number | null)}
            placeholder="Nouvelle valeur"
            style={{ width: '100%', marginBottom: 6 }}
          />
          <Input.TextArea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Raison du changement..."
            style={{ marginBottom: 8 }}
          />
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            {onRecalculate && (
              <Button size="small" icon={<ReloadOutlined />} onClick={onRecalculate}>
                Recalculer
              </Button>
            )}
            {onPublish && !isPublished && (
              <Button size="small" icon={<SendOutlined />} onClick={onPublish}>
                Publier
              </Button>
            )}
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              disabled={overrideVal == null || !reason.trim()}
              onClick={handleConfirmOverride}
            >
              Confirmer
            </Button>
          </Space>
        </>
      )}
      {isLocked && (
        <Tag color="red" style={{ width: '100%', textAlign: 'center' }}>
          🔒 Trimestre verrouillé
        </Tag>
      )}
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottom"
    >
      <div
        style={{
          cursor: isLocked ? 'default' : 'pointer',
          fontWeight: 600,
          color: avg == null ? '#999' : avg >= 10 ? '#10B981' : '#EF4444',
          textDecoration: hasOverride ? 'underline' : undefined,
          textDecorationColor: '#F59E0B',
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {avg != null ? avg.toFixed(2) : '—'}
        {hasOverride && <span style={{ fontSize: 10, color: '#F59E0B' }}>✏️</span>}
        {isPublished && <span style={{ fontSize: 10 }}>✅</span>}
      </div>
    </Popover>
  );
};

export default AverageCell;
