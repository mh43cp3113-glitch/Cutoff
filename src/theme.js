// Visual direction: warm and a little more alive than a form — cream paper,
// warm brown ink, one olive-brown accent carrying every interactive/progress
// signal (selection, CTAs, the progress rail), plus the original
// correct/wrong/flag trio for grading. Dark mode inverts the paper (pale ink
// on warm dark brown) rather than introducing a different visual language.
import { useColorScheme } from 'react-native';

const light = {
  paper: '#FBF6EF', // page
  card: '#FFFFFF', // raised surface
  rule: '#E9E0D2', // grid + hairlines
  ink: '#2E2620', // primary text
  inkSoft: '#8C7C6A', // secondary text
  accent: '#8A6D3F', // selection, CTAs, progress — the one interactive colour
  accentSoft: '#F1E4D0', // accent tinted onto a surface (selected option bg)
  correct: '#3F7D4A',
  wrong: '#C1453A',
  flag: '#D98C2B', // bookmarked / needs review
  locked: '#C9BEAE',
};

// Signal and accent colours are brightened relative to their light-mode
// values, not for decoration but because the light-mode versions are too dark
// to meet contrast against a near-black page — the same colours, legible at
// night.
const dark = {
  paper: '#20180F',
  card: '#2C2216',
  rule: '#4A3C28',
  ink: '#F3EAE0',
  inkSoft: '#B3A392',
  accent: '#C9A66B',
  accentSoft: '#3D3220',
  correct: '#5FBF71',
  wrong: '#E2685A',
  flag: '#F0B84D',
  locked: '#6B5D4D',
};

// A warm hero gradient for the Result score ring and Landing's header — see
// GradientBackdrop usage in those screens. Three stops, light-to-dark or
// warm-to-cool, always ending back near the page colour so it blends out
// rather than hard-cutting into the rest of the screen.
const gradientLight = ['#FBEFDD', '#F3D9C7', '#EAD3DE'];
const gradientDark = ['#3A2A1C', '#402A28', '#332338'];

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
    shadowColor: '#2E2013',
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
    gradient: isDark ? gradientDark : gradientLight,
  };
}
