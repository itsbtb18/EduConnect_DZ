import React, { useState } from 'react';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
  maxWidth?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Rechercher…',
  value,
  onChange,
  maxWidth = 320,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: 'relative', maxWidth, width: '100%' }}>
      <span
        style={{
          position: 'absolute',
          left: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 14,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        🔍
      </span>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          height: 36,
          paddingLeft: 36,
          paddingRight: 12,
          borderRadius: 10,
          border: `1.5px solid ${focused ? '#1A6BFF' : '#D1D5DB'}`,
          outline: 'none',
          fontSize: 13,
          fontFamily: 'var(--font)',
          background: '#fff',
          color: '#1F2937',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  );
};

export default SearchBar;
