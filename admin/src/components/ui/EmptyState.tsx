import React from 'react';
import { InboxOutlined } from '@ant-design/icons';
import './ui.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="ui-empty-state">
    <div className="ui-empty-state__icon">
      {icon || <InboxOutlined />}
    </div>
    <h3 className="ui-empty-state__title">{title}</h3>
    {description && <p className="ui-empty-state__desc">{description}</p>}
    {action && <div className="ui-empty-state__action">{action}</div>}
  </div>
);
