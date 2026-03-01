import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '../../theme';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, { container: ViewStyle; text: TextStyle; indicatorColor: string }> = {
  primary: {
    container: { backgroundColor: Colors.primary, borderWidth: 0 },
    text: { color: Colors.white },
    indicatorColor: Colors.white,
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
    text: { color: Colors.primary },
    indicatorColor: Colors.primary,
  },
  ghost: {
    container: { backgroundColor: 'transparent', borderWidth: 0 },
    text: { color: Colors.primary },
    indicatorColor: Colors.primary,
  },
  danger: {
    container: { backgroundColor: Colors.danger, borderWidth: 0 },
    text: { color: Colors.white },
    indicatorColor: Colors.white,
  },
  success: {
    container: { backgroundColor: Colors.success, borderWidth: 0 },
    text: { color: Colors.white },
    indicatorColor: Colors.white,
  },
};

const SIZE_STYLES: Record<Size, { paddingVertical: number; paddingHorizontal: number; fontSize: number; borderRadius: number }> = {
  sm: { paddingVertical: Spacing.xs,  paddingHorizontal: Spacing.md, fontSize: 12, borderRadius: Radius.sm },
  md: { paddingVertical: Spacing.sm,  paddingHorizontal: Spacing.xl, fontSize: 14, borderRadius: Radius.md },
  lg: { paddingVertical: Spacing.md,  paddingHorizontal: Spacing.xxl, fontSize: 16, borderRadius: Radius.lg },
};

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
}) => {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          borderRadius: s.borderRadius,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
        v.container,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.indicatorColor} size="small" />
      ) : (
        <Text
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: s.fontSize,
            ...v.text,
          }}
        >
          {icon ? `${icon}  ${label}` : label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
