import React from 'react';

interface ColorBoxProps {
  children: React.ReactNode;
  variant: 'warning' | 'danger' | 'success' | 'info';
}

const variantMap = {
  warning: { bg: '#FFF8E6', color: '#92400E' },
  danger:  { bg: '#FFE8EA', color: '#991B1B' },
  success: { bg: '#E6FAF5', color: '#065F46' },
  info:    { bg: '#E8F0FF', color: '#1E40AF' },
};

const ColorBox: React.FC<ColorBoxProps> = ({ children, variant }) => {
  const v = variantMap[variant];
  return (
    <div
      style={{
        padding: '10px 12px',
        background: v.bg,
        borderRadius: 10,
        fontSize: 12,
        color: v.color,
        fontWeight: 500,
      }}
    >
      {children}
    </div>
  );
};

export default ColorBox;
