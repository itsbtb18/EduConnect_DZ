import React from 'react';
import './ui.css';

export interface IconButtonProps {
  icon: React.ReactNode;
  onClick?: () => void;
  title?: string;
  active?: boolean;
  badge?: number;
  variant?: 'default' | 'ghost' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  title,
  active = false,
  badge,
  variant = 'default',
  size = 'md',
  className = '',
}) => (
  <div className="ui-icon-btn-wrapper">
    <button
      className={`ui-icon-btn ui-icon-btn--${variant} ui-icon-btn--${size} ${active ? 'ui-icon-btn--active' : ''} ${className}`}
      onClick={onClick}
      title={title}
      type="button"
    >
      {icon}
    </button>
    {badge !== undefined && badge > 0 && (
      <span className="ui-icon-btn__badge">{badge > 9 ? '9+' : badge}</span>
    )}
  </div>
);
