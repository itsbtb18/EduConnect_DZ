import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Colors, Fonts, Spacing } from '../../theme';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.background,
    }}
  >
    <ActivityIndicator size="large" color={Colors.primary} />
    {message && (
      <Text
        style={{
          marginTop: Spacing.lg,
          fontSize: 14,
          fontFamily: Fonts.regular,
          color: Colors.gray500,
        }}
      >
        {message}
      </Text>
    )}
  </View>
);

export default LoadingScreen;
