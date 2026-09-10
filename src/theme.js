// Visual direction: a physics lab notebook. Pale ruled paper, deep petrol ink,
// and colour reserved strictly for signal (right / wrong / flagged) — never
// decoration. Dark mode inverts the paper (pale ink on dark paper) rather than
// introducing a different visual language — same notebook, read at night.
import { useColorScheme } from 'react-native';

const light = {
  paper: '#EDF0EC', // page
  card: '#F7F9F6', // raised surface
  rule: '#C6D0C9', // grid + hairlines
  ink: '#1B2A2E', // primary text
  inkSoft: '#5E6F72', // secondary text
  correct: '#0B6E4F',
  wrong: '#B23A2E',
  flag: '#E5A400', // bookmarked / needs review
  locked: '#AAB6AF',
};

// Signal colours are brightened relative to their light-mode values, not for
// decoration but because the light-mode greens/reds are too dark to meet
// contrast against a near-black page — the same signal, legible at night.
const dark = {
  paper: '#11171A',
  card: '#1A2226',
  rule: '#33403F',
  ink: '#E8ECEA',
  inkSoft: '#93A29E',
  correct: '#3FBF8F',
  wrong: '#E2685A',
  flag: '#F0B84D',
  locked: '#5B6A67',
};

function buildType(c) {
  return {
    display: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: c.ink },
    title: { fontSize: 21, fontWeight: '650', letterSpacing: -0.3, color: c.ink },
    body: { fontSize: 16, lineHeight: 25, color: c.ink },
    small: { fontSize: 13, lineHeight: 19, color: c.inkSoft },
  };
}

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 36 };

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };

// One soft elevation, applied to every raised card/button so the app reads as
// "surfaces resting on the paper" rather than flat bordered boxes. iOS and
// Android pick up shadowColor/Offset/Opacity/Radius vs. elevation
// respectively; react-native-web translates the shadow* props to a CSS
// box-shadow.
const shadowLight = {
  card: {
    shadowColor: '#0F1A1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
};

// A dark shadow is invisible against a near-black page, and a light "glow"
// shadow reads as a design borrowed from somewhere else. Cards separate from
// the page in dark mode through the card/paper colour step and hairline
// border alone, so there's deliberately no shadow here.
const shadowDark = { card: {} };

/**
 * The single theme entry point. Every component that needs colour, type or
 * shadow tokens calls this — never import a static palette, since only the
 * hook re-renders when the OS-level light/dark setting changes.
 * `space` and `radius` don't vary by scheme, so they're plain exports above;
 * re-exported here too, only so call sites can destructure everything from
 * one hook call.
 */
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const color = isDark ? dark : light;
  return {
    isDark,
    color,
    type: buildType(color),
    space,
    radius,
    shadow: isDark ? shadowDark : shadowLight,
  };
}
