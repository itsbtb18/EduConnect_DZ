import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardType,
  ViewStyle,
} from 'react-native';
import { Colors, Fonts, Radius, Spacing } from '../../theme';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: KeyboardType;
  secureTextEntry?: boolean;
  error?: string;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  secureTextEntry = false,
  error,
  rightIcon,
  style,
}) => {
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? Colors.danger
    : focused
    ? Colors.primary
    : Colors.gray300;

  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      {label && (
        <Text
          style={{
            fontSize: 11,
            fontFamily: Fonts.bold,
            color: Colors.gray500,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          borderWidth: 1.5,
          borderColor,
          borderRadius: Radius.md,
          backgroundColor: Colors.white,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.gray300}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontSize: 14,
            fontFamily: Fonts.regular,
            color: Colors.gray900,
            padding: 0,
            textAlignVertical: multiline ? 'top' : 'center',
            minHeight: multiline ? numberOfLines * 22 : undefined,
          }}
        />
        {rightIcon && (
          <View style={{ marginLeft: Spacing.sm }}>{rightIcon}</View>
        )}
      </View>
      {error && (
        <Text
          style={{
            fontSize: 11,
            fontFamily: Fonts.medium,
            color: Colors.danger,
            marginTop: 4,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default Input;
