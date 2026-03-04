import React from 'react';
import './ui.css';

export interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: React.ReactNode;
  variant?: 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'pink';
  onClick?: () => void;
}

const variantMap: Record<string, string> = {
  accent: 'stat-card--accent',
  success: 'stat-card--success',
  warning: 'stat-card--warning',
  danger: 'stat-card--danger',
  info: 'stat-card--info',
  pink: 'stat-card--pink',
};

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  sub,
  variant = 'accent',
  onClick,
}) => (
  <div
    className={`ui-stat-card ${variantMap[variant] || ''} ${onClick ? 'ui-stat-card--clickable' : ''}`}
    onClick={onClick}
  >
    <div className={`ui-stat-card__icon ui-stat-card__icon--${variant}`}>
      {icon}
    </div>
    <div className="ui-stat-card__body">
      <span className="ui-stat-card__label">{label}</span>
      <span className="ui-stat-card__value">{value}</span>
      {sub && <span className="ui-stat-card__sub">{sub}</span>}
    </div>
  </div>
);
