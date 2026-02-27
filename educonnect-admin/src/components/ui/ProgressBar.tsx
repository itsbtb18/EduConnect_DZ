import React from 'react';

interface ProgressBarProps {
  value: number;
  color?: string;
}

const autoColor = (value: number): string => {
  if (value >= 92) return '#00C48C';
  if (value >= 75) return '#FFB800';
  return '#FF4757';
};

const ProgressBar: React.FC<ProgressBarProps> = ({ value, color }) => {
  const fill = color ?? autoColor(value);
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      style={{
        height: 6,
        borderRadius: 100,
        background: '#F3F4F6',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: 100,
          width: `${clamped}%`,
          background: fill,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
};

export default ProgressBar;
