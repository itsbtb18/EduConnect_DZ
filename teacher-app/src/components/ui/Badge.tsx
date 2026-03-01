import React from 'react';
import { View, Text } from 'react-native';
import { Colors, Fonts, Radius } from '../../theme';

type BadgeColor = 'blue' | 'green' | 'orange' | 'red' | 'yellow' | 'gray';

interface BadgeProps {
  label: string;
  color: BadgeColor;
  small?: boolean;
}

const COLOR_MAP: Record<BadgeColor, { bg: string; text: string }> = {
  blue:   { bg: Colors.primaryLight,  text: Colors.primary  },
  green:  { bg: Colors.successLight,  text: Colors.success  },
  orange: { bg: Colors.accentLight,   text: Colors.accent   },
  red:    { bg: Colors.dangerLight,   text: Colors.danger   },
  yellow: { bg: Colors.warningLight,  text: Colors.warning  },
  gray:   { bg: Colors.gray100,       text: Colors.gray500  },
};

const Badge: React.FC<BadgeProps> = ({ label, color, small = false }) => {
  const { bg, text } = COLOR_MAP[color];
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: Radius.full,
        paddingHorizontal: 10,
        paddingVertical: small ? 2 : 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontSize: small ? 9 : 11,
          fontFamily: Fonts.semiBold,
          color: text,
        }}
      >
        {label}
      </Text>
    </View>
  );
};

export default Badge;
