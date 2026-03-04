import React from 'react';
import './ui.css';

export interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'stat' | 'text' | 'avatar';
  rows?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  rows = 3,
  className = '',
}) => {
  if (variant === 'stat') {
    return (
      <div className={`ui-skeleton ui-skeleton--stat ${className}`}>
        <div className="ui-skeleton__circle" />
        <div className="ui-skeleton__lines">
          <div className="ui-skeleton__line ui-skeleton__line--short" />
          <div className="ui-skeleton__line ui-skeleton__line--wide" />
        </div>
      </div>
    );
  }

  if (variant === 'avatar') {
    return <div className={`ui-skeleton__circle ui-skeleton__circle--lg ${className}`} />;
  }

  if (variant === 'table') {
    return (
      <div className={`ui-skeleton ui-skeleton--table ${className}`}>
        <div className="ui-skeleton__line ui-skeleton__line--header" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="ui-skeleton__line ui-skeleton__line--row" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`ui-skeleton ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="ui-skeleton__line"
            style={{ width: i === rows - 1 ? '60%' : '100%', animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
    );
  }

  // Default card
  return (
    <div className={`ui-skeleton ui-skeleton--card ${className}`}>
      <div className="ui-skeleton__line ui-skeleton__line--heading" />
      <div className="ui-skeleton__line" />
      <div className="ui-skeleton__line ui-skeleton__line--short" />
    </div>
  );
};
