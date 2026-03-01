import React from 'react';
import { Text } from 'react-native';
import { Colors, Fonts } from '../../theme';

interface GradeColorTextProps {
  value: number;
  maxValue: number;
  size?: number;
  bold?: boolean;
}

const GradeColorText: React.FC<GradeColorTextProps> = ({
  value,
  maxValue,
  size = 14,
  bold = false,
}) => {
  const ratio = value / maxValue;
  const color =
    ratio >= 0.7
      ? Colors.success
      : ratio >= 0.5
      ? Colors.primary
      : Colors.danger;

  return (
    <Text
      style={{
        fontSize: size,
        fontFamily: bold ? Fonts.bold : Fonts.medium,
        color,
      }}
    >
      {value}/{maxValue}
    </Text>
  );
};

export default GradeColorText;
