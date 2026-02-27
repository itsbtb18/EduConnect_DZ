import React from 'react';
import { BadgeColor } from '../../types';

const COLORS: Record<BadgeColor, { bg: string; text: string }> = {
  blue:   { bg: '#E8F0FF', text: '#1A6BFF' },
  green:  { bg: '#E6FAF5', text: '#00C48C' },
  orange: { bg: '#FFF0EB', text: '#FF6B35' },
  red:    { bg: '#FFE8EA', text: '#FF4757' },
  yellow: { bg: '#FFF8E6', text: '#B45309' },
  gray:   { bg: '#F3F4F6', text: '#374151' },
};

interface BadgeProps {
  label: string;
  color: BadgeColor;
}

const Badge: React.FC<BadgeProps> = ({ label, color }) => {
  const { bg, text } = COLORS[color];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 100,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color: text,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
};

export default Badge;
