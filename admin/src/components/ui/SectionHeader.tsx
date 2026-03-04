import React from 'react';
import './ui.css';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
}) => (
  <div className="ui-section-header">
    <div className="ui-section-header__left">
      {icon && <span className="ui-section-header__icon">{icon}</span>}
      <div>
        <h3 className="ui-section-header__title">{title}</h3>
        {subtitle && <p className="ui-section-header__subtitle">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="ui-section-header__action">{action}</div>}
  </div>
);
