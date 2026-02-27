import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  borderColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sub,
  subColor = '#00C48C',
  borderColor,
}) => (
  <div
    style={{
      background: '#fff',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      borderLeft: `4px solid ${borderColor}`,
    }}
  >
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#6B7280',
        marginBottom: 8,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 28,
        fontWeight: 800,
        color: '#1F2937',
        lineHeight: 1,
        marginBottom: sub ? 6 : 0,
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 12, color: subColor, fontWeight: 500 }}>
        {sub}
      </div>
    )}
  </div>
);

export default StatCard;
