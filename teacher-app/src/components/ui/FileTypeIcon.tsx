import React from 'react';
import { Text } from 'react-native';
import { Colors } from '../../theme';

interface FileTypeIconProps {
  fileType: string;
  size?: number;
}

const FILE_MAP: Record<string, { emoji: string; color: string }> = {
  pdf:   { emoji: '📄', color: Colors.danger  },
  pptx:  { emoji: '📊', color: Colors.accent  },
  docx:  { emoji: '📝', color: Colors.primary },
  image: { emoji: '🖼️', color: Colors.success },
  video: { emoji: '🎬', color: '#8E44AD'      },
  link:  { emoji: '🔗', color: Colors.gray500 },
};

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ fileType, size = 22 }) => {
  const entry = FILE_MAP[fileType] ?? FILE_MAP['link'];
  return (
    <Text style={{ fontSize: size, color: entry.color }}>{entry.emoji}</Text>
  );
};

export default FileTypeIcon;
