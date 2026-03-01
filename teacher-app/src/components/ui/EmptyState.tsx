import React from 'react';
import { View, Text } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';
import Button from './Button';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xxxl,
    }}
  >
    <Text style={{ fontSize: 48, marginBottom: Spacing.lg }}>{icon}</Text>
    <Text
      style={{
        fontSize: 16,
        fontFamily: Fonts.bold,
        color: Colors.gray700,
        textAlign: 'center',
        marginBottom: Spacing.sm,
      }}
    >
      {title}
    </Text>
    {subtitle && (
      <Text
        style={{
          fontSize: 13,
          fontFamily: Fonts.regular,
          color: Colors.gray500,
          textAlign: 'center',
          marginBottom: Spacing.xl,
        }}
      >
        {subtitle}
      </Text>
    )}
    {actionLabel && onAction && (
      <View style={{ marginTop: Spacing.md }}>
        <Button label={actionLabel} onPress={onAction} />
      </View>
    )}
  </View>
);

export default EmptyState;
