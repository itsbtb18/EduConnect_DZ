import React from 'react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
  maxWidth?: number | string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher...',
  value,
  onChange,
  maxWidth = 320,
}) => (
  <div style={{ position: 'relative', flex: 1, maxWidth }}>
    <span
      style={{
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 14,
        pointerEvents: 'none',
      }}
    >
      🔍
    </span>
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 14px 10px 36px',
        borderRadius: 10,
        border: '1.5px solid #D1D5DB',
        fontSize: 13,
        color: '#1F2937',
        outline: 'none',
        background: 'white',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    />
  </div>
);

export default SearchBar;
