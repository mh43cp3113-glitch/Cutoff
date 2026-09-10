import React from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '../theme';

// Borrowed from the OMR sheet every candidate already knows: one cell per
// question, filled as you go. Answered cells are solid accent, the current
// cell is taller, untouched cells stay hairline.

export default function ProgressRail({ total, current, answered, onJump }) {
  const { color } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => {
        const isCurrent = i === current;
        const isAnswered = answered[i] !== null && answered[i] !== undefined && answered[i] !== '';

        return (
          <Pressable
            key={i}
            onPress={() => onJump?.(i)}
            accessibilityLabel={`Question ${i + 1}${isAnswered ? ', answered' : ''}`}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 1,
              backgroundColor: isAnswered ? color.accent : color.rule,
              borderWidth: isCurrent ? 0 : 0,
              opacity: isCurrent ? 1 : isAnswered ? 0.85 : 0.6,
              transform: [{ scaleY: isCurrent ? 2 : 1 }],
            }}
          />
        );
      })}
    </View>
  );
}
