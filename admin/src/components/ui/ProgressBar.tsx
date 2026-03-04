import React from 'react';
import './ui.css';

export interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'accent' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'accent',
  size = 'sm',
  showLabel = false,
  className = '',
}) => {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className={`ui-progress ${className}`}>
      <div className={`ui-progress__track ui-progress__track--${size}`}>
        <div
          className={`ui-progress__fill ui-progress__fill--${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="ui-progress__label">{pct}%</span>}
    </div>
  );
};
