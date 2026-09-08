# Cutoff

Exam practice app for Indian competitive exams. React Native via Expo, targeting
Android and iOS from one codebase. Phase 1 ships JEE Main Physics only.

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

**Planned tracks.** Classes 1–10; Classes 11–12 across Science, Commerce and Arts;
entrance exams (JEE, NEET, CAT); engineering (B.Tech semesters, GATE); government
exams (SSC, banking, railways). All of these already exist in the taxonomy as
locked tiles. Only JEE Main Physics has questions.

---

## Current state

Working today:

- Home screen with track list, locked "coming soon" tiles, streak display
- Subject screen: topics with question counts, per-topic accuracy, weak-topic flag
- Quiz player handling MCQ, multi-select, and numerical entry with tolerance
- LaTeX rendering through KaTeX in a self-sizing WebView
- Scoring with per-question negative marking
- Result screen with per-question review and explanations
- Adaptive mixed practice weighted by past accuracy
- Persistence via AsyncStorage: topic stats, last 50 attempts, daily streak

Not built yet: authentication, any backend, subscriptions, timed mock tests, a
working report button, and every track other than JEE Main Physics.

---

## Architecture

```
App.js                      navigation stack, wrapped in ProgressProvider
src/theme.js                design tokens
src/data/questions.json     10 seed questions
src/data/taxonomy.json      navigation tree with locked branches
src/lib/quiz.js             question queries, adaptive selection, grading
src/lib/storage.js          AsyncStorage reads and writes
src/lib/ProgressContext.js  progress state, hydrated once at launch
src/components/MathText.js  LaTeX renderer
src/components/ProgressRail.js
src/screens/                Home, Subject, Quiz, Result
```

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

**Adaptive weighting.** Weight rises as accuracy falls, so a topic at 40% is drawn
roughly twice as often as one at 90%. Topics with fewer than 3 attempts get a
middling weight — worth sampling, but not ahead of a topic already known to be
weak.

**Streaks use local calendar dates, not UTC.** A 1 a.m. session should count as
that night. UTC would roll the streak over mid-session.

**Storage reads are failure-tolerant.** A corrupt value degrades to "no progress
yet". Losing a streak display is survivable; a boot loop is not.

**Attempt recording is guarded with a ref**, because React 18 double-invokes
effects in development and would otherwise double-count every topic.

**WebViews only for LaTeX.** Each one is an expensive instance and a question
screen can hold five. Plain text takes the `<Text>` path.

**KaTeX ships vendored, not from a CDN.** `src/vendor/katex/` holds KaTeX 0.16.9
(`katex.min.js`, `auto-render.min.js`, `katex.min.css`) as JS modules exporting
the file contents as strings, with `.woff2` fonts inlined as base64 `data:` URIs
in the CSS. `MathText.js` injects them straight into the WebView's HTML — no
network needed, matching the audience's patchy connectivity. See
`src/vendor/katex/README.md` to upgrade the version. The WebView HTML also
declares `<meta charset="utf-8">`; without it, non-ASCII characters in question
text (en dashes, µ, °, etc.) can render as mojibake since `file://`-sourced HTML
doesn't reliably default to UTF-8.

**Design direction:** a physics lab notebook. Pale paper `#EDF0EC`, deep petrol ink
`#1B2A2E`, hairline rules. Colour is reserved strictly for signal — green correct,
red incorrect, amber flagged — and never used as decoration. The one bold element
is the OMR-style progress rail, borrowed from the answer sheet every candidate
already knows.

---

## Constraints

**Content is the bottleneck, not code.** Coding this takes weeks; sourcing accurate
questions across every planned track takes years. Launch one vertical filled in and
leave the rest locked.

**Never copy questions from published books or other apps.** It's infringement and
the fastest route to removal from the Play Store. Write them, license them, or
commission them. The 10 seed questions are original.

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

1. Firebase Auth — Google sign-in, phone OTP, guest mode. Guest mode matters:
   forcing signup before the first quiz kills retention.
2. Move questions to Firestore, keep local caching for offline use
3. Cloud Function serving questions without the answer key
4. Timed mock tests with full paper structure
5. Free tier limits and Play Billing for Pro
6. Report triage — auto-hide a question once reports arrive

---

## Known gaps

- Progress is device-only; it doesn't follow a user to a new phone
- The report button renders but does nothing
- Home routes every tap to JEE Main Physics regardless of which tile is pressed
- No test suite

---

## Immediate next step

Run it in Expo Go and confirm LaTeX renders correctly on a real device — the last
mile (WebView font/encoding behavior on real Android/iOS) hasn't been checked on
hardware yet, even though the rendering pipeline itself is now verified headless
(see below).

```bash
npm install
npx expo install react-native-screens react-native-safe-area-context \
  react-native-webview @react-native-async-storage/async-storage
npx expo start
```
