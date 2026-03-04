/**
 * EditableClassChip — Inline-editable chip for class names.
 *
 * Displays a tag/chip that turns into an input on click, allowing
 * the admin to rename auto-generated class names freely.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Tag, Input, Tooltip } from 'antd';
import type { InputRef } from 'antd';
import { EditOutlined } from '@ant-design/icons';

interface Props {
  /** Current display name */
  name: string;
  /** Default auto-generated name (shown as placeholder) */
  defaultName: string;
  /** Color of the chip border / accent */
  color?: string;
  /** Callback when the name changes */
  onChange: (newName: string) => void;
  /** Names already used at this level (for duplicate check) */
  usedNames?: string[];
}

const EditableClassChip: React.FC<Props> = ({
  name,
  defaultName,
  color = '#1677ff',
  onChange,
  usedNames = [],
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [error, setError] = useState('');
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    setValue(name);
  }, [name]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const validate = (v: string): string => {
    const trimmed = v.trim();
    if (!trimmed) return 'Le nom ne peut pas être vide';
    if (usedNames.some(n => n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== name.toLowerCase())) {
      return 'Ce nom est déjà utilisé dans ce niveau';
    }
    return '';
  };

  const handleConfirm = () => {
    const trimmed = value.trim();
    const err = validate(trimmed);
    if (err) {
      setError(err);
      return;
    }
    setEditing(false);
    setError('');
    onChange(trimmed || defaultName);
  };

  const handleCancel = () => {
    setEditing(false);
    setValue(name);
    setError('');
  };

  if (editing) {
    return (
      <Tooltip title={error} open={!!error} color="red">
        <Input
          ref={inputRef}
          size="small"
          value={value}
          placeholder={defaultName}
          onChange={e => {
            setValue(e.target.value);
            setError('');
          }}
          onPressEnter={handleConfirm}
          onBlur={handleConfirm}
          onKeyDown={e => {
            if (e.key === 'Escape') handleCancel();
          }}
          style={{
            width: Math.max(80, value.length * 9 + 32),
            maxWidth: 200,
            borderColor: error ? '#ff4d4f' : color,
          }}
          status={error ? 'error' : undefined}
        />
      </Tooltip>
    );
  }

  const isCustomized = name !== defaultName;

  return (
    <Tag
      color={isCustomized ? color : undefined}
      style={{
        cursor: 'pointer',
        borderStyle: isCustomized ? 'solid' : 'dashed',
        fontSize: 13,
        padding: '2px 10px',
        marginBottom: 4,
        transition: 'all 0.2s',
        userSelect: 'none',
      }}
      onClick={() => setEditing(true)}
    >
      {name}
      <EditOutlined style={{ marginLeft: 4, fontSize: 10, opacity: 0.6 }} />
    </Tag>
  );
};

export default EditableClassChip;
