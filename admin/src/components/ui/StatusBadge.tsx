import React from 'react';
import './ui.css';

export interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'danger' | 'info';
  label: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

const statusColors: Record<string, string> = {
  active: 'status-badge--active',
  inactive: 'status-badge--inactive',
  pending: 'status-badge--pending',
  success: 'status-badge--success',
  warning: 'status-badge--warning',
  danger: 'status-badge--danger',
  info: 'status-badge--info',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  dot = true,
  size = 'sm',
}) => (
  <span className={`ui-status-badge ${statusColors[status] || ''} ui-status-badge--${size}`}>
    {dot && <span className="ui-status-badge__dot" />}
    {label}
  </span>
);
