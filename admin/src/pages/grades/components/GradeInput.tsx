/**
 * GradeInput — numeric input for grade entry with validation.
 * Supports tab navigation, absent toggle, and max score enforcement.
 */
import React, { useRef, useEffect } from 'react';
import { InputNumber, Checkbox, Tag } from 'antd';

interface GradeInputProps {
  value: number | null;
  maxScore: number;
  isAbsent: boolean;
  disabled?: boolean;
  onChange: (value: number | null) => void;
  onAbsentChange: (absent: boolean) => void;
  autoFocus?: boolean;
}

const GradeInput: React.FC<GradeInputProps> = ({
  value,
  maxScore,
  isAbsent,
  disabled = false,
  onChange,
  onAbsentChange,
  autoFocus,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <InputNumber
        ref={inputRef as never}
        min={0}
        max={maxScore}
        step={0.25}
        precision={2}
        value={isAbsent ? null : value}
        disabled={disabled || isAbsent}
        onChange={(v) => onChange(v as number | null)}
        style={{
          width: 80,
          opacity: isAbsent ? 0.4 : 1,
          background: isAbsent ? '#f5f5f5' : undefined,
        }}
        placeholder={isAbsent ? 'ABS' : `/${maxScore}`}
      />
      <Checkbox
        checked={isAbsent}
        disabled={disabled}
        onChange={(e) => {
          onAbsentChange(e.target.checked);
          if (e.target.checked) onChange(null);
        }}
      >
        <span style={{ fontSize: 12, color: '#666' }}>Absent</span>
      </Checkbox>
      {!isAbsent && value != null && (
        <Tag color={value >= (maxScore / 2) ? 'green' : 'red'} style={{ margin: 0 }}>
          {value}/{maxScore}
        </Tag>
      )}
      {isAbsent && <Tag color="default" style={{ margin: 0 }}>ABS</Tag>}
    </div>
  );
};

export default GradeInput;
