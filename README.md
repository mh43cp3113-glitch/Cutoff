# Cutoff

Exam practice for Indian competitive exams. Phase 1: JEE Main Physics.

An Expo (React Native) app for Android, iOS **and the web** — one codebase, three
targets. The taxonomy already has slots for NEET, CAT, school classes, engineering
and government exams, shown as locked tiles until questions exist for them.

## Running it

You need Node.js 18 or newer on a desktop.

```bash
npm install
npx expo install react-native-screens react-native-safe-area-context \
  react-native-webview @react-native-async-storage/async-storage
npx expo start
```

`npx expo install` matters — it pins native packages to versions matching your Expo
SDK. Plain `npm install` will let you install a version that crashes on device.

Then install **Expo Go** on your phone and scan the QR code. Same code runs on
Android and iOS.

## Running it as a website

The same app also runs in a browser — as a responsive mobile-first site: full-bleed
on a phone, centred in a phone-width column on a desktop.

```bash
npm run web          # dev server at http://localhost:8081
npm run build:web    # static export to dist/ — deploy to any static host
```

Web needs `react-native-web`, `react-dom` and `@expo/metro-runtime` — already in
`package.json`, so a plain `npm install` covers it. `dist/` is a folder of static
files; drop it on Netlify, Vercel, GitHub Pages, EAS Hosting, or `npx serve dist`.

### GitHub Pages (automatic)

`.github/workflows/deploy-web.yml` builds and publishes the site on every push to
`main`. One-time setup: repo **Settings → Pages → Source: "GitHub Actions"**. After
that it's live at **https://mh43cp3113-glitch.github.io/Cutoff/** and redeploys
itself on each push.

The Pages build sets `EXPO_PUBLIC_BASE_URL=/Cutoff` (see `app.config.js`) because
a project site is served from a subpath. Local `npm run web` leaves it unset and
serves from the root.

On web, LaTeX renders straight into the DOM via `src/components/MathText.web.js`
(the native build uses a WebView per formula; that file is the web override). The
vendored KaTeX assets are shared, so there's still no network dependency.

## Putting it on GitHub

```bash
git init
git add .
git commit -m "Cutoff: navigation, LaTeX rendering, adaptive practice, persistence"
git branch -M main
git remote add origin https://github.com/mh43cp3113-glitch/Cutoff.git
git push -u origin main
```

After this you can read and edit the
code from your phone through the GitHub app, and pull it on any desktop.

## Project context

`CLAUDE.md` holds the full picture — data model, decisions, constraints, roadmap.
Claude Code reads it automatically at the start of a session. Keep it current when
decisions change.

## What's here

```
src/
  data/questions.json    10 seed questions — mcq, multi-select, numerical, LaTeX
  data/taxonomy.json     navigation tree, with locked branches
  lib/quiz.js            the only file that knows where questions come from
  lib/storage.js         AsyncStorage reads and writes, all failure-tolerant
  lib/ProgressContext.js progress state, hydrated once at launch
  components/MathText.js LaTeX via KaTeX in a self-sizing WebView (native)
  components/MathText.web.js  same, rendering KaTeX straight into the DOM (web)
  components/ProgressRail.js
  screens/               Home, SubjectPicker, Subject, Quiz, Result, Progress
```

`lib/quiz.js` is deliberately the single data boundary. When you move questions to
Firestore, you rewrite that file and the screens don't change.

## Known gaps

- **Progress is device-only.** Topic stats, attempt history, streak and reports
  persist through AsyncStorage and are all shown on the Progress screen, but they
  don't follow the user to a new phone. Sign-in and Firestore sync are the next step.
- **Answers ship to the device.** Fine now, since the questions are yours and
  public. Before launch, move `correct_option_ids` and `explanation` behind a Cloud
  Function that only returns them after submission.
- **Reports have nowhere to go yet.** The report button works — a reported question
  is stored locally and dropped from that device's future quizzes — but until
  there's a backend, reports don't reach you. Each stored report carries
  `sync: false` so a later Firestore push knows what to send.
- **Only JEE Main Physics has questions.** Every other track is locked. Home now
  routes by the real taxonomy (and shows a subject picker when a track has more
  than one), so nothing is hard-coded — the tiles just have nothing behind them yet.

## Roadmap

1. Firebase Auth — Google sign-in, phone OTP, guest mode
2. Move questions to Firestore, keep local caching for offline
3. Cloud Function that serves questions without the answer key
4. Timed mock tests with a full paper structure
5. Free tier limits, Play Billing for Pro
6. Report triage — server-side, once reports sync

## Content

The 10 seed questions are original, written for this repo. Keep it that way:
copying questions from published books or other apps is infringement, and it is
the fastest way to get pulled from the Play Store. Write them, license them, or
commission them.
