import React from 'react';
import { View, Text } from 'react-native';
import { Colors } from '../../theme';

interface AvatarProps {
  name: string;
  size?: number;
  colorIndex?: number;
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 40, colorIndex = 0 }) => {
  const bg = Colors.subjects[colorIndex % Colors.subjects.length];
  const initials = name
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: Colors.white,
          fontSize: size * 0.38,
          fontWeight: '700',
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

export default Avatar;
