import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: string;
  borderColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, subColor, borderColor }) => (
  <div
    style={{
      background: 'white',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      borderLeft: `4px solid ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}
  >
    <span style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {label}
    </span>
    <span style={{ fontSize: 28, fontWeight: 800, color: '#1F2937' }}>{value}</span>
    {sub && (
      <span style={{ fontSize: 12, fontWeight: 600, color: subColor || '#00C48C' }}>{sub}</span>
    )}
  </div>
);

export default StatCard;
