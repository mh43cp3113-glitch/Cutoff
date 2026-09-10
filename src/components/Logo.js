import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';

// The wordmark literalises the name: a thin ink rule splits "Cut" from "off",
// like the line on an answer sheet that separates a qualifying score from a
// rejected one. No new colour — just ink, at full or muted opacity, so it
// never competes with the correct/incorrect/flag signal colours used
// elsewhere.
const SIZES = {
  lg: { font: 22, bar: 15, gap: 6 },
  sm: { font: 13, bar: 9, gap: 4 },
};

export default function Logo({ size = 'lg', muted = false }) {
  const { color } = useTheme();
  const s = SIZES[size];
  const textColor = muted ? color.inkSoft : color.ink;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={{ fontSize: s.font, fontWeight: '800', letterSpacing: -0.4, color: textColor }}>
        Cut
      </Text>
      <View
        style={{
          width: 1.5,
          height: s.bar,
          backgroundColor: textColor,
          opacity: 0.45,
          marginHorizontal: s.gap,
        }}
      />
      <Text style={{ fontSize: s.font, fontWeight: '800', letterSpacing: -0.4, color: textColor }}>
        off
      </Text>
    </View>
  );
}
