import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  const baseStyle: ViewStyle = {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.card,
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={baseStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={baseStyle}>{children}</View>;
};

export default Card;
