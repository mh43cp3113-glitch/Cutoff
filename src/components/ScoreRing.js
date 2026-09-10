import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../theme';

// A circular progress ring for the Result screen — the score's own visual
// weight, rather than just a line of text. Negative marking can put `score`
// below zero; the arc clamps to empty rather than drawing backwards.
export default function ScoreRing({ score, max, size = 140, strokeWidth = 12 }) {
  const { color, type } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = max > 0 ? Math.max(0, Math.min(1, score / max)) : 0;
  const dashOffset = circumference * (1 - fraction);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color.rule}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color.accent}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: color.ink, letterSpacing: -0.5 }}>
          {score}
        </Text>
        <Text style={type.small}>out of {max}</Text>
      </View>
    </View>
  );
}
