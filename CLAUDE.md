# Cutoff

Exam practice app for Indian competitive exams. React Native via Expo, targeting
Android, iOS and the web from one codebase. All five tracks are unlocked, spanning
87 subject pools and ~2073 questions — **every pool now has 20+ questions**, so
there's no more "first batch" tier to call out. Depth still varies (Science
70–100/subject, Government's original 3 subjects ~50/subject, everything else
~20/subject), which is fine — 20 is enough for both practice lengths (10/20) and
a Random test to draw from without every session feeling identical.

This file is the project's working memory. Claude Code reads it automatically at
the start of a session — keep it current when decisions change.

---

## Product

A quiz app for students preparing for competitive exams. The differentiator is
adaptive practice: question selection is weighted toward topics the student
actually gets wrong, rather than the shuffle-and-hope that most free quiz apps do.

**Audience.** Indian students, mostly 16–18, often studying at night on mid-range
Android phones with patchy connectivity. Offline capability matters more than
polish.

**Tracks.** All five are unlocked:

- **Entrance** — JEE Main, NEET, and now **CAT** (Quant Ability, VARC, DILR).
  Shared pools: `physics`, `chemistry`, `maths`, `biology` across JEE/NEET/Science.
- **Class 11–12** — Science (shares the four pools above), plus **Commerce**
  (Accountancy, Business Studies, Economics) and **Humanities** (History,
  Political Science, Geography) — each a new exam with its own three subjects.
- **Government exams** — SSC CGL, Banking, RRB NTPC, **UPSC Civil Services,
  MPSC**. Six shared pools across all five exams: `quant`, `reasoning`,
  `general_awareness`, plus `english`, `gen_science`, `computer_awareness`.
  UPSC/MPSC reuse the same six pools rather than getting dedicated content
  (no Ethics/optional-subject papers, no essay) — General Awareness's static
  GK (polity, history, geography, science, economy) covers their General
  Studies angle reasonably well, but it's a rough fit, not a tailored one.
  General Awareness deliberately excludes current affairs, so it doesn't rot.
- **School (Class 1–10)** — exam level is the grade (`class_1` … `class_10`);
  subjects are Mathematics and Science. **Pools are per-grade, not shared**:
  subject ids are `s_math_<grade>` / `s_sci_<grade>`, so Class 3 Maths and Class 9
  Maths are separate pools. No negative marking. 20 questions per pool.
- **Engineering** — exam level is the stream. The original five (CSE, ECE,
  Mechanical, Civil, Electrical) now each carry seven core subjects
  (`cse_dsa`, `mech_thermo`, …) instead of four, plus four new streams — IT,
  Chemical, Aerospace, Instrumentation — with three subjects each. **One pool,
  `eng_maths` (Engineering Mathematics), is shared across all nine streams** —
  the one deliberate exception to "each stream has its own pools" in
  Engineering. GATE-style marking (+2 / −0.5). Questions are conceptual, not
  numerical. The **original 20 subjects** (the four per original stream) have
  20 questions each; the **28 subjects added afterwards** (Engineering Maths,
  the 3 extra per original stream, and the 4 new streams) still have ~10 each.

Still missing: Class 1–10 boards beyond CBSE-style Maths/Science, and English
as a School subject.

**Navigation.** category (track) → exam → subject, chosen explicitly:
Home → ExamPicker → SubjectPicker → Subject → Quiz. A step is skipped only when
there is genuinely one option behind it. **There is no topic level in the UI** —
the student picks a subject and gets a mixed set from the whole subject.
The exam and subject pickers **do not show per-subject question counts** (the
newer tracks are thin and the number is noise); the Home tiles show only the
track name and hint. Home was restyled first (rounded cards, a streak pill,
unlocked tracks first then a "Coming soon" group); that `radius.lg` rounded-card
language was then extended to ExamPicker, SubjectPicker, Subject and Result's
primary buttons, and Progress's stats card, so the app now reads as one design
system rather than Home-plus-everything-else. Quiz itself keeps its original,
denser layout — it's the one screen where screen space is at a premium (a
question, options, the progress rail and now a countdown), so it wasn't
touched cosmetically, only functionally (see the Random test note below).

**SubjectPicker also offers a "Random test"**, above the subject list, for
every exam that reaches that screen (every exam in the app has 2+ subjects, so
none currently skip straight from ExamPicker to Subject). It calls
`buildExamQuiz(trackId, examId, count, excludeIds)` in `quiz.js`, which samples
close to evenly across every unlocked subject in that exam and shuffles the
result — a mixed mock spanning the whole exam, sitting alongside (not
replacing) the existing per-subject "Start practice" / "Longer set" flow.
Unlike `buildSubjectQuiz`, it is **uniform random, not adaptive-weighted** —
deliberately, since a random test is meant to feel like an exam paper, not
another practice set biased toward weak topics.

**Random test is timed; regular practice is not.** Length scales with the exam
— `Math.min(30, Math.max(12, subjects.length * 4))` questions — paced at 60
seconds each, so a 6-subject Government exam gets a longer test than a
2-subject School grade. `QuizScreen` accepts an optional `timeLimitSeconds`
route param; when present it shows a countdown (turning red under 30 seconds)
and auto-submits to Result when it hits zero, reading answers from a ref so the
submit can't fire with a stale answer set. Quizzes started from `SubjectScreen`
never pass this param, so ordinary practice stays untimed.

**Shared question pool.** Subjects use the same id across exams (`physics` is one
pool, drawn on by JEE, NEET and Class 11–12); the `exam` field on a question is
metadata, never a practice filter. `questionsForSubject(subjectId)` in `quiz.js`
is the whole pool for a subject. Questions still carry a hidden `topic` tag, used
*only* to weight the adaptive set — never shown to the student.

---

## Current state

Working today:

- Home screen with track list, locked "coming soon" tiles, streak display
- Subject screen: a launch pad — question count + "Start practice" (10) / "Longer set" (20)
- SubjectPicker: a timed "Random test" (12–30 questions scaled to the exam's
  subject count, evenly sampled across all of them) above the per-subject list,
  for exam-wide mock practice
- Quiz player handling MCQ, multi-select, and numerical entry with tolerance
- A "Rough work" scratchpad below every question — freehand touch drawing for
  calculations, cleared automatically when the question changes
- LaTeX rendering through KaTeX in a self-sizing WebView
- Scoring with per-question negative marking
- Result screen with per-question review and explanations
- Adaptive mixed practice weighted by past accuracy (per-subject); the exam-wide
  random test is uniform random instead, by design
- Persistence via AsyncStorage: topic stats, last 50 attempts, daily streak, reports
- Progress screen: streak (current + longest), overall accuracy, recent quizzes,
  reported-questions list (shows the question's own text via `getQuestionById`,
  not its bare id — that was a real bug, fixed this pass), and a two-step
  "reset progress"
- Working report button: a reported question is stored locally (with reasons) and
  dropped from that device's future quizzes (`buildSubjectQuiz` takes an
  `excludeIds` set); each report carries `sync: false` for a later push
- Home routes by the real taxonomy — category → exam → subject via ExamPicker /
  SubjectPicker. Every screen title is derived, not hard-coded.
- Web target: runs in a browser as a responsive mobile-first site (full-bleed on
  a phone, phone-width centred column on desktop). `npm run web` / `npm run
  build:web`. AsyncStorage falls back to localStorage on web.
- **Real Firebase Auth — email/password and Google, no guest mode, no Landing
  page.** `src/lib/firebase.js` holds the Firebase project config (Firebase's
  own docs: this config is not a secret — it identifies the project, real
  access control is Security Rules — safe to commit) and initializes `auth`,
  using `getReactNativePersistence(AsyncStorage)` on native vs. the browser's
  own persistence on web. `ProgressContext` exposes `user` (the Firebase user,
  or null) via `signUpWithEmail` / `signInWithEmail` / `signInWithGoogle` /
  `signOutUser`; `signedIn` and `displayName` derive from `user` alone.
  **Guest mode and `LandingScreen.js` were both removed per direction** — an
  earlier pass added a device-local guest fallback (reasoning: forcing signup
  before the first quiz kills retention) and a marketing-style intro screen;
  both were explicitly cut. `LoginScreen` is now the app's *only*
  unauthenticated screen — no header, no back arrow (nothing to go back to),
  Log In / Sign Up tabs, a "Continue/Sign up with Google" button, then email
  + password below a divider. If guest mode or a landing page is ever wanted
  again, that reasoning is still sound — it just isn't what was asked for now.
  **Google sign-in works today on web with no extra setup beyond enabling
  Google in the Firebase console** (already done): `signInWithPopup(auth, new
  GoogleAuthProvider())` uses Firebase's own managed OAuth client for this
  flow, which is a different, simpler path from the `expo-auth-session` +
  manual Google Cloud OAuth-client-ID approach native would need. **On native,
  `signInWithGoogle` deliberately throws** (`Platform.OS !== 'web'` guard) —
  there's no browser popup on native, and that separate client-ID setup hasn't
  happened. Native is untested anyway (see the recurring caveat), so this
  isn't a regression, just an honest boundary.
  **Important nuance the signup copy says out loud:** a real account does not
  yet mean synced progress. `topicStats`/`attempts`/`streak`/`reports` are
  still `AsyncStorage`-only (see Architecture), completely independent of
  `user` — so today, signing up buys a persistent login (survives a reinstall,
  in principle — unverified on a real device, see below) but *not* progress
  that follows you to a new device. That needs Firestore (roadmap #2).
  **Needs one more manual step in the Firebase console**, not yet done as far
  as this file knows: **Authentication → Sign-in method → enable
  Email/Password** (only Google was enabled per the original setup steps).
  Without it, `createUserWithEmailAndPassword` fails with
  `auth/operation-not-allowed`.
- **The app is gated behind `signedIn`** — `App.js`'s `RootNavigator` renders
  either just `Login`, or the full Home-and-onward stack, switching on
  `signedIn` (React Navigation's standard auth-split pattern: swapping which
  screens exist, not mounting everything and redirecting — this gets the stack
  reset on both sign-in and sign-out for free). `ready` (progress-storage
  hydrated *and* Firebase's initial `onAuthStateChanged` callback having fired)
  gates a blank frame first, so it never flashes Login then immediately Home.

Not built yet: Google/OAuth sign-in on native (needs client IDs from the Firebase/GCP
project — see above), phone OTP, Firestore (so a real account's progress still
doesn't follow it anywhere, and reports still don't leave the device), a Cloud
Function to stop shipping answer keys to the client, and subscriptions.

---

## Architecture

```
App.js                      navigation stack, wrapped in ProgressProvider
src/theme.js                useTheme() hook — colour/type/shadow, light + dark
src/data/questions.json     ~2073 original questions across 87 subject pools
src/data/taxonomy.json      navigation tree with locked branches
src/lib/quiz.js             question queries, adaptive selection, grading
src/lib/storage.js          AsyncStorage reads and writes
src/lib/ProgressContext.js  progress state + auth (user/profile), hydrated once
src/lib/firebase.js         Firebase app/auth init — config is not a secret
src/components/MathText.js  LaTeX renderer — WebView per formula (native)
src/components/MathText.web.js  LaTeX renderer — KaTeX into the DOM (web override)
src/components/ProgressRail.js
src/components/Logo.js      brand mark (book icon + wordmark) — Home/Login only
src/components/ScratchPad.js  touch scratchpad on Quiz, rotated-View strokes
src/components/ScoreRing.js  SVG circular score ring, used on Result
src/screens/                Login, Home, ExamPicker, SubjectPicker, Subject,
                             Quiz, Result, Progress
tests/                       node:test — quiz.js logic + content structural checks
```

**Run tests with `npm test`** (`node --test`, no framework dependency added — see
`tests/support/loadEsm.js`, which transpiles `quiz.js`'s ES-module syntax with
the `@babel/core` already in devDependencies rather than pulling in Jest).
`tests/quiz.test.js` covers grading, scoring, adaptive/random selection and
`excludeIds` handling; `tests/data-integrity.test.js` re-checks the structural
invariants (unique ids, 4 well-formed options, valid `correct_option_ids`,
every taxonomy subject non-empty, answer position spread) that were being
verified ad hoc with one-off `node -e` scripts during content batches — now
they run on every change instead of only when someone remembers to check.

**`src/lib/quiz.js` is the single data boundary.** It is the only module that knows
where questions come from. Moving to Firestore means rewriting that file; screens
must not import question data directly. Preserve this — it's what makes the backend
migration cheap.

**`ProgressContext` owns all progress state.** Screens read it through
`useProgress()`. Don't pass stats through navigation params; that was the earlier
approach and it broke as soon as persistence landed.

---

## Data model

Questions live in one flat collection with tag fields, not nested under categories.
Nested subcollections can't be queried across branches, which would break any query
spanning topics — including the adaptive mixed quiz. This shape is deliberate.

```js
// questions/{questionId}
{
  track: "entrance",        // school | stream | entrance | engineering | govt
  exam: "jee_main",
  subject: "physics",
  topic: "rotational_motion",
  subtopic: "moment_of_inertia",

  question_type: "numerical",   // mcq | multi_select | numerical
  content_type: "latex",        // text | latex | image
  body: "A disc of mass $M$ and radius $R$...",
  image_url: null,

  options: [{ id, content_type, body }],   // null for numerical
  correct_option_ids: ["a"],               // null for numerical
  numerical_answer: { value, tolerance, unit },
  explanation: { content_type, body },

  difficulty: 2,            // 1–3
  marks: 4,
  negative_marks: -1,
  avg_time_seconds: 90,
  source: "original",       // original | licensed | contributed
  year: null,               // past-paper year

  times_attempted: 0,
  times_correct: 0,
  reports_open: 0,          // >0 pulls the question from new quizzes
  status: "live"            // draft | live | retired
}
```

`content_type` and `question_type` were added before any content existed, on
purpose. Retrofitting either one means migrating every question.

Planned Firestore collections beyond this: `taxonomy/{nodeId}` for the navigation
tree, `users/{uid}`, `users/{uid}/topic_stats/{topicId}`,
`users/{uid}/attempts/{attemptId}`, plus separate `reports` and `feedback`
collections. Reports attach to a question and need triage; feedback is general and
needs no workflow.

Composite indexes needed before seeding real data:
- `track + exam + subject + topic + status`
- `exam + subject + difficulty + status`
- `exam + year + status`

---

## Decisions worth keeping

**Adaptive weighting.** `buildSubjectQuiz` leans the set towards a question's
hidden `topic` tag when the student answers that area poorly — weight rises as
accuracy falls (an area at 40% is drawn ~2× as often as one at 90%); areas with
fewer than 3 attempts get a middling weight. The student never sees or picks
these areas; it's just "practice more of what you get wrong".

**Streaks use local calendar dates, not UTC.** A 1 a.m. session should count as
that night. UTC would roll the streak over mid-session.

**Storage reads are failure-tolerant.** A corrupt value degrades to "no progress
yet". Losing a streak display is survivable; a boot loop is not.

**Attempt recording is guarded with a ref**, because React 18 double-invokes
effects in development and would otherwise double-count every topic.

**WebViews only for LaTeX.** Each one is an expensive instance and a question
screen can hold five. Plain text takes the `<Text>` path.

**ScratchPad draws with rotated `View` rectangles, not SVG** — even though
`react-native-svg` is now a dependency anyway (for `ScoreRing`). `PanResponder`
records touch points per stroke; each consecutive pair becomes a short `View`
sized to the distance between them and rotated to the angle between them,
positioned by its centre (so `transform: rotate` behaves identically on native
and web with no `transformOrigin` needed). Rebuilding an SVG path string on
every touch-move event is more churn than appending a `View`, so this stays as
is — revisit only if it ever needs undo/redo, real pen pressure, or saving a
drawing.

**KaTeX ships vendored, not from a CDN.** `src/vendor/katex/` holds KaTeX 0.16.9
(`katex.min.js`, `auto-render.min.js`, `katex.min.css`) as JS modules exporting
the file contents as strings, with `.woff2` fonts inlined as base64 `data:` URIs
in the CSS. `MathText.js` injects them straight into the WebView's HTML — no
network needed, matching the audience's patchy connectivity. See
`src/vendor/katex/README.md` to upgrade the version. The WebView HTML also
declares `<meta charset="utf-8">`; without it, non-ASCII characters in question
text (en dashes, µ, °, etc.) can render as mojibake since `file://`-sourced HTML
doesn't reliably default to UTF-8.

**Web is a first-class target, via `react-native-web`.** No separate web codebase.
Platform differences live in `.web.js` overrides (only `MathText.web.js` so far)
and `Platform.OS === 'web'` branches (the centred phone-width frame in `App.js`).
`react-native-webview` is never bundled on web — the `.web.js` override means its
import is never reached. `app.json` → `expo.web` sets `bundler: metro`, `output:
single`. `npm run build:web` emits a static `dist/` for any static host.
`.github/workflows/deploy-web.yml` auto-deploys that to GitHub Pages on push to
main (needs Settings → Pages → Source: GitHub Actions once). `app.config.js`
computes `experiments.baseUrl` from `EXPO_PUBLIC_BASE_URL` — the Pages build sets
it to `/Cutoff`; local dev leaves it empty.

**Design direction (v2 — warm/icon-rich).** The original look was a "physics
lab notebook": cool grey-green paper, deep petrol ink, colour reserved
strictly for signal, no icons anywhere. That was explicitly replaced after
feedback that it read as too plain/form-like, in favour of something warmer
and more visually alive, closer to modern consumer study-app references:
cream paper, warm brown ink, **one accent colour** (`color.accent`, an
olive-brown) carrying every interactive/progress signal — selection state,
primary buttons, the progress rail, stat numbers — plus the original
correct/wrong/flag trio for grading, which stayed put since that's real
signal, not styling. `color.accentSoft` is the accent tinted onto a surface
(selected-option background, icon-badge fills). The OMR-progress-rail idea
survived the pivot; it just fills in `accent` instead of plain ink now.

**Dark mode.** `theme.js` exports one hook, `useTheme()` — `{ color, type, space,
radius, shadow, gradient, isDark }` — and that hook is the *only* way any
component should read a token; there is no static `color`/`type` export, so a
component that imported a plain object instead of calling the hook wouldn't
re-render when the OS-level scheme flips. Dark mode inverts the palette (pale
ink on warm near-black paper) rather than introducing a second visual
language, and `accent`/`correct`/`wrong`/`flag` are independently *brightened*
for dark mode — contrast, not decoration. `app.json`'s `userInterfaceStyle` is
`"automatic"` so native picks up the OS setting; web follows
`prefers-color-scheme` via `useColorScheme()`. Given the audience studies at
night (see Audience above), this is a real usability fix. Still not covered: a
dark splash-screen asset, and real-device verification (web-build-only so far,
same caveat as the rest of the UI).

**Brand mark:** `src/components/Logo.js` pairs an Ionicons `"book"` glyph with
the caps wordmark "CUTOFF" — both ink-coloured regardless of the accent
system, so the mark itself never competes with interactive colour. `size="lg"`
(28pt text / 30pt icon) on Login's header, `size="sm" muted` (16pt / 18pt) in
Home's footer. Doesn't appear on any other screen — inner screens show
contextual titles.

**Elevation:** `theme.js` exports `shadow.card`, one soft shadow applied to
every raised card and primary button. Quiz is excluded on purpose — mid-
question isn't the moment to add visual noise.

**Icons and imagery — three new dependencies, added deliberately for this
redesign:**
- `@expo/vector-icons` for icons (option-selection state, track badges on
  Home, chevrons, back arrows). **Always import the specific family from its
  own subpath** — `import Ionicons from '@expo/vector-icons/Ionicons'` — never
  `import { Ionicons } from '@expo/vector-icons'`. The barrel import pulls in
  every icon family's font file (~3MB across 19 fonts) into the web bundle
  regardless of which one is used; the subpath import only bundles Ionicons
  (390KB). This bit once already — check any new icon usage still does this.
- `expo-linear-gradient` for the warm hero gradient (`theme.js`'s `gradient`
  token, three warm stops that blend back toward the page colour) — used
  behind Result's score ring. (It also backed Landing's hero section before
  Landing was removed — `gradient` is still there for Result to use.)
- `react-native-svg`, used by `src/components/ScoreRing.js` — a circular
  progress ring (score/max as an arc, clamped to 0 so negative marking can't
  draw it backwards) replacing Result's old plain "score out of max" text.

**Responsive desktop layout.** Still one React Native codebase (no separate
website was built — that alternative was considered and explicitly declined).
`App.js`'s `AppFrame` used to hard-clamp every web view to a 480px phone-width
column regardless of screen size — "responsive" in name only. Now it tracks
the active route name (via `NavigationContainer`'s `onStateChange` and a
`getActiveRouteName`-style walk of the nav state) and widens to 1100px **only**
for screens in `WIDE_SCREENS` (currently just `Home`) on a >=820px viewport;
everything else — Quiz above all — stays phone-width at any screen size, so a
mobile-tuned layout never stretches awkwardly across a monitor. Home also
carries its own internal desktop logic (`useWindowDimensions` + a local
`isDesktop` flag): its tracks lay out as a 2-column wrap instead of a single
column above the breakpoint. (Landing used to be in `WIDE_SCREENS` too, with
its own two-column hero; removed along with the screen itself.) Extending
another screen to the wide frame means adding it to `WIDE_SCREENS` *and*
giving it its own desktop-width layout logic — just adding it to the set
without that would stretch a single-column screen across the wide frame with
a wall of empty space either side.

---

## Constraints

**Content is the bottleneck, not code.** Coding this takes weeks; sourcing accurate
questions across every planned track takes years. Launch one vertical filled in and
leave the rest locked.

**Never copy questions from published books or other apps.** It's infringement and
the fastest route to removal from the Play Store. Write them, license them, or
commission them. Every question in `questions.json` is original — written from
standard, current-syllabus textbook facts and computations, `source: "original"`.
"Current syllabus" means the standard, presently-taught curriculum for each
subject/grade/exam — not current-affairs content. This matters most for
Government's General Awareness pool, which is **deliberately static GK only**
(polity, history, geography, science, economy) with no current-affairs
questions, so it can't go stale — see the Tracks section above. If that
"relevant to this year" bar is ever meant to include current affairs instead,
that's a real policy change (it reintroduces the staleness problem this design
avoided) and should be a deliberate decision, not an assumption.

The bank is ~2073 questions across 87 subject pools, and **every pool now has at
least 20 questions** — Science and Government's original three subjects run
much deeper (70–100 and ~50 respectively), everything else sits around 20.
Depth is no longer the open item; **an independent human review of the answer
keys is** — I've self-checked every question while authoring and
`tests/data-integrity.test.js` catches structural bugs, but nobody else has
verified the facts, especially in the niche Engineering streams (Chemical,
Aerospace, Instrumentation) and the humanities/commerce content, which lean
more on recalled facts than the STEM content's clean derivations. Spot-check
answer keys before any store release. The correct option is spread evenly
across the four slots by construction (the app does not shuffle options at
runtime), so the answer isn't always in the same place.

**Don't put "JEE" or "NEET" in the app's store name.** Play treats exam names as
third-party marks and it's a common rejection reason.

**Answers currently ship to the device.** Acceptable now — the questions are ours
and public. Before launch, `correct_option_ids` and `explanation` must move behind
a Cloud Function that only returns them after submission. A determined user reads
them straight out of the network response otherwise.

**Play Store, when it's time.** $25 one-time developer account. Personal (non-org)
accounts require closed testing with 12 testers for 14 days before production —
plan the launch around that. Needs a privacy policy URL even with no data
collection, plus content rating and data safety forms. Builds go through EAS, which
means no Mac is required.

---

## Roadmap

1. ~~Firebase Auth~~ — **email/password and Google (web) done, no guest mode**;
   Google on native and phone OTP still need real credentials/setup — see the
   Current State note above for exactly what's missing.
2. Move progress (topic stats, attempts, streak, reports) and questions to
   Firestore, keep local caching for offline use — this is what actually makes
   an account worth having; right now signing up buys a persistent login but
   not synced progress
3. Cloud Function serving questions without the answer key
4. ~~Timed mock tests~~ — done as "Random test" (see Navigation section) for a
   mixed, timed set per exam; still missing a real paper structure (sections,
   per-section timing, official marks scheme per exam)
5. Free tier limits and Play Billing for Pro
6. Report triage — auto-hide a question once reports arrive

---

## Known gaps

- Progress is device-only; it doesn't follow a user to a new phone
- Reports are stored locally only — no backend to receive them yet
- Question bank ~2073 across 87 pools, every pool at 20+ questions (Science and
  Government's original 3 subjects run deeper, 70–100 and ~50 respectively) —
  depth is no longer the gap, an independent answer-key review still is
- School/Engineering/CAT/Commerce/Humanities/Govt-new questions are all
  plain-text MCQ — no numericals, no LaTeX yet
- UPSC/MPSC reuse SSC's generic Quant/Reasoning/GA pools — a placeholder fit,
  not real UPSC/MPSC content (no Ethics, no optional subjects, no essay)
- Answer keys have been self-checked during authoring and are covered by
  structural tests (`tests/data-integrity.test.js`), but **no independent human
  review pass has happened yet** — still required before any store release,
  per the Constraints section above
- `correct_option_ids` still ships in the client bundle (see Constraints) —
  fixing this needs Firestore + a Cloud Function (roadmap #2–3). **A Firebase
  project now exists** (`cutoff-3113`, see `src/lib/firebase.js`), so this is
  no longer blocked on "no project" — it just hasn't been built yet
- Firebase Auth's native persistence (`getReactNativePersistence`) is wired
  per the SDK's documented pattern but **unverified on a real device** — this
  project's native build has never been run outside a web build, same
  long-standing caveat as everything else UI-related
- The Firebase console needs **Email/Password enabled** under Authentication →
  Sign-in method (only Google was enabled per the original setup steps) or
  sign-up/log-in will fail with `auth/operation-not-allowed`
- Dark mode has no dark splash-screen asset yet — native cold start still
  briefly shows the light splash image before the themed UI mounts
- No haptic/visual feedback on answer selection beyond the border/background
  change, and accessibility labels only exist on Home — every other screen's
  buttons announce as generic "button" to a screen reader
- The "pick up where you left off" copy on Home implies a resume-in-progress-
  quiz feature that doesn't exist; nothing currently saves mid-quiz state

---

## Immediate next step

Firebase Auth (email/password + Google on web) is done, no guest mode, no
Landing page — `LoginScreen` is the app's sole unauthenticated screen. The
Firebase project (`cutoff-3113`) now exists, so what's left is no longer
blocked on "no backend" — it's just not built yet:

1. Enable **Email/Password** in the Firebase console (Authentication →
   Sign-in method) — sign-up/log-in will fail without this one manual step.
2. **Firestore** for progress/reports (roadmap #2) — this is what makes an
   account actually worth having; right now it isn't (see the nuance above).
3. **A Cloud Function to stop shipping `correct_option_ids`** to the client
   (roadmap #3) — the last real security gap before any store release.
4. **Google sign-in on native** — needs real OAuth client IDs from the same
   Firebase/GCP project (Google Cloud Console → APIs & Services →
   Credentials) plus `expo-auth-session`; the web flow already works without
   this via Firebase's own popup-based OAuth.

Still worth doing on hardware before any of that: run in Expo Go and confirm
(a) LaTeX renders correctly on a real device — the WebView font/encoding last
mile on real Android/iOS hasn't been checked, though the pipeline is verified
headless — and (b) that Firebase Auth's native persistence actually survives
an app restart, which is untested outside a web build.

```bash
npm install
npx expo start
```
