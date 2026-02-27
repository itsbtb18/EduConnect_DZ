import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    }}
  >
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1F2937', margin: 0 }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 0 }}>
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;
