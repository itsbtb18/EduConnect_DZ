import React from 'react';
import './ui.css';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'sm' | 'md' | 'lg';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  onClick,
  padding = 'md',
}) => (
  <div
    className={`ui-glass-card ui-glass-card--${padding} ${onClick ? 'ui-glass-card--clickable' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);
