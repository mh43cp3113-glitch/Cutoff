import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../theme';

// A plain caps wordmark. No new colour — just ink, at full or muted opacity,
// so it never competes with the correct/incorrect/flag signal colours used
// elsewhere.
const SIZES = {
  lg: { font: 28 },
  sm: { font: 16 },
};

export default function Logo({ size = 'lg', muted = false }) {
  const { color } = useTheme();
  const s = SIZES[size];
  const textColor = muted ? color.inkSoft : color.ink;

  return (
    <Text
      style={{
        fontSize: s.font,
        fontWeight: '800',
        letterSpacing: 1,
        color: textColor,
      }}
    >
      CUTOFF
    </Text>
  );
}
