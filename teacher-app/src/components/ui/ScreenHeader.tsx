import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../../theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: Colors.headerBg,
        paddingTop: insets.top + 12,
        paddingBottom: 16,
        paddingHorizontal: Spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      {/* Back button */}
      {showBack && (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          style={{ marginRight: Spacing.md, padding: 4 }}
        >
          <Text style={{ fontSize: 20, color: Colors.white }}>←</Text>
        </TouchableOpacity>
      )}

      {/* Title / subtitle */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: Fonts.extraBold,
            color: Colors.white,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 12,
              fontFamily: Fonts.regular,
              color: 'rgba(255,255,255,0.6)',
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right action */}
      {rightAction && (
        <View style={{ marginLeft: Spacing.md }}>{rightAction}</View>
      )}
    </View>
  );
};

export default ScreenHeader;
