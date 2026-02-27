import React from 'react';

const AVATAR_COLORS = ['#1A6BFF', '#FF6B35', '#00C48C', '#FFB800', '#9B59B6', '#E74C3C'];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface AvatarProps {
  name: string;
  size?: number;
  color?: string;
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 36, color }) => {
  const bg = color || AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length];
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bg}, ${bg}99)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
