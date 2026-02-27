import React from 'react';

const PALETTE = ['#1A6BFF', '#FF6B35', '#00C48C', '#FFB800', '#9B59B6', '#E74C3C'];

interface AvatarProps {
  name: string;
  size?: number;
  colorIndex?: number;
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 36, colorIndex = 0 }) => {
  const color = PALETTE[colorIndex % PALETTE.length];
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}, ${color}99)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
