import React from 'react';
import './ui.css';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  actions,
  breadcrumbs,
}) => (
  <div className="ui-page-header">
    {breadcrumbs && <div className="ui-page-header__breadcrumbs">{breadcrumbs}</div>}
    <div className="ui-page-header__row">
      <div className="ui-page-header__info">
        {icon && <span className="ui-page-header__icon">{icon}</span>}
        <div>
          <h1 className="ui-page-header__title">{title}</h1>
          {subtitle && <p className="ui-page-header__subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="ui-page-header__actions">{actions}</div>}
    </div>
  </div>
);
