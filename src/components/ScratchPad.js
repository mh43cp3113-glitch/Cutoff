import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, PanResponder } from 'react-native';
import { useTheme } from '../theme';

// A touch scratchpad for rough work — the empty space below a question's
// options was doing nothing useful, and students solving numerical or
// calculation-heavy questions need somewhere to work that isn't a physical
// sheet of paper. Strokes are drawn as a chain of short rotated rectangles
// between consecutive touch points rather than an SVG path, so this needs no
// new dependency (react-native-svg, Skia, ...) — just PanResponder and View,
// both already part of react-native / react-native-web.
const STROKE_WIDTH = 2.5;
const PAD_HEIGHT = 200;

function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function angleDeg(a, b) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

// `resetKey` clears the pad when it changes (the caller passes the current
// question index) — rough work is scoped to one question, not carried into
// the next and quietly accumulated for the whole quiz.
export default function ScratchPad({ resetKey }) {
  const { color, type, space, radius } = useTheme();
  const [strokes, setStrokes] = useState([]);

  useEffect(() => {
    setStrokes([]);
  }, [resetKey]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setStrokes((prev) => [...prev, [{ x: locationX, y: locationY }]]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setStrokes((prev) => {
          const next = prev.slice();
          const last = next[next.length - 1];
          next[next.length - 1] = last.concat([{ x: locationX, y: locationY }]);
          return next;
        });
      },
    })
  ).current;

  const hasInk = strokes.some((s) => s.length > 1);

  return (
    <View
      style={{
        marginTop: space.lg,
        borderWidth: 1,
        borderColor: color.rule,
        borderRadius: radius.lg,
        backgroundColor: color.card,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
          borderBottomWidth: 1,
          borderBottomColor: color.rule,
        }}
      >
        <Text style={type.small}>Rough work</Text>
        {hasInk && (
          <Pressable onPress={() => setStrokes([])} hitSlop={8}>
            <Text style={[type.small, { color: color.inkSoft, fontWeight: '600' }]}>
              Clear
            </Text>
          </Pressable>
        )}
      </View>

      <View
        style={{
          height: PAD_HEIGHT,
          justifyContent: hasInk ? undefined : 'center',
          alignItems: hasInk ? undefined : 'center',
        }}
        {...panResponder.panHandlers}
      >
        {!hasInk && (
          <Text style={[type.small, { color: color.locked, textAlign: 'center' }]}>
            Scribble your working here — it clears between questions
          </Text>
        )}

        {strokes.map((stroke, si) =>
          stroke.slice(1).map((point, i) => {
            const prev = stroke[i];
            const len = distance(prev, point);
            const angle = angleDeg(prev, point);
            const midX = (prev.x + point.x) / 2;
            const midY = (prev.y + point.y) / 2;
            return (
              <View
                key={`${si}-${i}`}
                style={{
                  position: 'absolute',
                  left: midX - len / 2,
                  top: midY - STROKE_WIDTH / 2,
                  width: len,
                  height: STROKE_WIDTH,
                  borderRadius: STROKE_WIDTH / 2,
                  backgroundColor: color.ink,
                  transform: [{ rotate: `${angle}deg` }],
                }}
              />
            );
          })
        )}
      </View>
    </View>
  );
}
