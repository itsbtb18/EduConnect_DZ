import React from 'react';
import { SearchOutlined } from '@ant-design/icons';
import './ui.css';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Rechercher...',
  className = '',
}) => (
  <div className={`ui-search-input ${className}`}>
    <SearchOutlined className="ui-search-input__icon" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="ui-search-input__field"
    />
  </div>
);
