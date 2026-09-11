import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme';

// A book mark plus a caps wordmark. No new colour — just ink, at full or
// muted opacity, so the brand mark never competes with the accent/signal
// colours used everywhere else in the app.
const SIZES = {
  lg: { font: 28, icon: 30, gap: 8 },
  sm: { font: 16, icon: 18, gap: 5 },
};

export default function Logo({ size = 'lg', muted = false }) {
  const { color } = useTheme();
  const s = SIZES[size];
  const textColor = muted ? color.inkSoft : color.ink;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="book" size={s.icon} color={textColor} style={{ marginRight: s.gap }} />
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
    </View>
  );
}
