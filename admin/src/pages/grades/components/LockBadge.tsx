/**
 * LockBadge — Trimester lock/unlock indicator badge.
 */
import React from 'react';
import { Tag, Tooltip } from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';

interface LockBadgeProps {
  isLocked: boolean;
  lockedAt?: string | null;
  lockedBy?: string | null;
  onUnlock?: () => void;
  canUnlock?: boolean;
}

const LockBadge: React.FC<LockBadgeProps> = ({
  isLocked,
  lockedAt,
  onUnlock,
  canUnlock = false,
}) => {
  if (!isLocked) return null;

  const lockDate = lockedAt
    ? new Date(lockedAt).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <Tag
        color="red"
        icon={<LockOutlined />}
        style={{ fontSize: 13, padding: '4px 12px', fontWeight: 600 }}
      >
        🔒 Trimestre verrouillé
      </Tag>
      {lockDate && (
        <span style={{ fontSize: 11, color: '#888' }}>
          Verrouillé le {lockDate}
        </span>
      )}
      {canUnlock && onUnlock && (
        <Tooltip title="Déverrouiller (urgence)">
          <Tag
            color="orange"
            icon={<UnlockOutlined />}
            style={{ cursor: 'pointer', fontWeight: 500 }}
            onClick={onUnlock}
          >
            🔓 Déverrouiller
          </Tag>
        </Tooltip>
      )}
    </div>
  );
};

export default LockBadge;
