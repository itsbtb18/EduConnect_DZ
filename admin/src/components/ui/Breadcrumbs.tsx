import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RightOutlined } from '@ant-design/icons';
import './ui.css';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <nav className="ui-breadcrumbs">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <RightOutlined className="ui-breadcrumbs__sep" />}
          {item.path ? (
            <button
              className="ui-breadcrumbs__link"
              onClick={() => navigate(item.path!)}
              type="button"
            >
              {item.label}
            </button>
          ) : (
            <span className="ui-breadcrumbs__current">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
