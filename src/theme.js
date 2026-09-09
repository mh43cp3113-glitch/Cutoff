// Visual direction: a physics lab notebook. Pale ruled paper, deep petrol ink,
// and colour reserved strictly for signal (right / wrong / flagged) — never decoration.

export const color = {
  paper: '#EDF0EC',       // page
  card: '#F7F9F6',        // raised surface
  rule: '#C6D0C9',        // grid + hairlines
  ink: '#1B2A2E',         // primary text
  inkSoft: '#5E6F72',     // secondary text
  correct: '#0B6E4F',
  wrong: '#B23A2E',
  flag: '#E5A400',        // bookmarked / needs review
  locked: '#AAB6AF',
};

export const type = {
  display: { fontSize: 30, fontWeight: '700', letterSpacing: -0.6, color: color.ink },
  title: { fontSize: 21, fontWeight: '650', letterSpacing: -0.3, color: color.ink },
  body: { fontSize: 16, lineHeight: 25, color: color.ink },
  small: { fontSize: 13, lineHeight: 19, color: color.inkSoft },
};

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 36 };

export const radius = { sm: 6, md: 10, lg: 16, pill: 999 };
