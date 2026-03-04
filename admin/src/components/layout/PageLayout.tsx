import React from 'react';
import './PageLayout.css';

interface PageAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'default' | 'ghost';
}

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: PageAction[];
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'full';
  noPadding?: boolean;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  icon,
  actions,
  children,
  maxWidth = 'full',
  noPadding = false,
}) => {
  return (
    <div className={`page-layout page-layout--${maxWidth}`}>
      {/* Page header */}
      <div className="page-layout__header">
        <div className="page-layout__header-left">
          {icon && <div className="page-layout__icon">{icon}</div>}
          <div>
            <h1 className="page-layout__title">{title}</h1>
            {subtitle && <p className="page-layout__subtitle">{subtitle}</p>}
          </div>
        </div>
        {actions && actions.length > 0 && (
          <div className="page-layout__actions">
            {actions.map((action, i) => (
              <button
                key={i}
                className={`page-layout__action page-layout__action--${action.variant || 'default'}`}
                onClick={action.onClick}
              >
                {action.icon && <span className="page-layout__action-icon">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`page-layout__body ${noPadding ? 'page-layout__body--no-pad' : ''}`}>
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
