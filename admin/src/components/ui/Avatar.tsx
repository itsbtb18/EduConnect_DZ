import React from 'react';
import './ui.css';

export interface AvatarProps {
  src?: string | null;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'accent' | 'blue' | 'success' | 'warning' | 'danger';
  online?: boolean;
  className?: string;
}

const sizeClass: Record<string, string> = {
  xs: 'ui-avatar--xs',
  sm: 'ui-avatar--sm',
  md: 'ui-avatar--md',
  lg: 'ui-avatar--lg',
  xl: 'ui-avatar--xl',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  initials = '?',
  size = 'md',
  variant = 'accent',
  online,
  className = '',
}) => (
  <div className={`ui-avatar ${sizeClass[size] || ''} ui-avatar--${variant} ${className}`}>
    {src ? (
      <img src={src} alt="" className="ui-avatar__img" />
    ) : (
      <span className="ui-avatar__initials">{initials}</span>
    )}
    {online !== undefined && (
      <span className={`ui-avatar__status ${online ? 'ui-avatar__status--online' : 'ui-avatar__status--offline'}`} />
    )}
  </div>
);
