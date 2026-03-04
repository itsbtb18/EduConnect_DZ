import React from 'react';
import './ui.css';

export interface DataCardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  subtitle,
  icon,
  extra,
  children,
  noPadding = false,
  className = '',
  hoverable = false,
  onClick,
}) => (
  <div
    className={`ui-data-card ${hoverable ? 'ui-data-card--hoverable' : ''} ${onClick ? 'ui-data-card--clickable' : ''} ${className}`}
    onClick={onClick}
  >
    {(title || extra) && (
      <div className="ui-data-card__header">
        <div className="ui-data-card__header-info">
          {icon && <span className="ui-data-card__header-icon">{icon}</span>}
          <div>
            {title && <h3 className="ui-data-card__title">{title}</h3>}
            {subtitle && <p className="ui-data-card__subtitle">{subtitle}</p>}
          </div>
        </div>
        {extra && <div className="ui-data-card__extra">{extra}</div>}
      </div>
    )}
    <div className={`ui-data-card__body ${noPadding ? 'ui-data-card__body--flush' : ''}`}>
      {children}
    </div>
  </div>
);
