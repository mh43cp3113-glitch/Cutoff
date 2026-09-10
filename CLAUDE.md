# Cutoff

Exam practice app for Indian competitive exams. React Native via Expo, targeting
Android, iOS and the web from one codebase. All five tracks are unlocked, spanning
87 subject pools and ~1675 questions. Coverage is uneven by design: the original
Science subjects (70–100 each), Government's original 3 subjects (~50 each),
School (20 each) and the original 20 Engineering subjects (20 each) are solid.
The rest — CAT, Commerce, Humanities, Government's 3 newer subjects, Engineering
Mathematics, and the newer Engineering subjects/streams (40 pools in total) — are
still a ~10-question first batch, to be topped up the same way School and the
original Engineering subjects just were.

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
- **Government exams** — SSC CGL, Banking, RRB NTPC. Six shared pools across the
  three exams: `quant`, `reasoning`, `general_awareness`, plus `english`,
  `gen_science`, `computer_awareness`. General Awareness is deliberately static
  GK only (polity, history, geography, science, economy) — no current affairs,
  so it doesn't rot.
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
track name and hint. Home was restyled (rounded cards, a streak pill, unlocked
tracks first then a "Coming soon" group) — HomeScreen only; other screens keep
the original look.

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
- Quiz player handling MCQ, multi-select, and numerical entry with tolerance
- LaTeX rendering through KaTeX in a self-sizing WebView
- Scoring with per-question negative marking
- Result screen with per-question review and explanations
- Adaptive mixed practice weighted by past accuracy
- Persistence via AsyncStorage: topic stats, last 50 attempts, daily streak, reports
- Progress screen: streak (current + longest), overall accuracy, recent quizzes,
  reported-questions list, and a two-step "reset progress"
- Working report button: a reported question is stored locally (with reasons) and
  dropped from that device's future quizzes (`buildSubjectQuiz` takes an
  `excludeIds` set); each report carries `sync: false` for a later push
- Home routes by the real taxonomy — category → exam → subject via ExamPicker /
  SubjectPicker. Every screen title is derived, not hard-coded.
- Web target: runs in a browser as a responsive mobile-first site (full-bleed on
  a phone, phone-width centred column on desktop). `npm run web` / `npm run
  build:web`. AsyncStorage falls back to localStorage on web.

Not built yet: authentication, any backend (so reports don't leave the device),
subscriptions, timed mock tests, and the school / engineering / govt tracks.

---

## Architecture

```
App.js                      navigation stack, wrapped in ProgressProvider
src/theme.js                design tokens
src/data/questions.json     ~1675 original questions across 87 subject pools
src/data/taxonomy.json      navigation tree with locked branches
src/lib/quiz.js             question queries, adaptive selection, grading
src/lib/storage.js          AsyncStorage reads and writes
src/lib/ProgressContext.js  progress state, hydrated once at launch
src/components/MathText.js  LaTeX renderer — WebView per formula (native)
src/components/MathText.web.js  LaTeX renderer — KaTeX into the DOM (web override)
src/components/ProgressRail.js
src/screens/                Home, ExamPicker, SubjectPicker, Subject, Quiz, Result, Progress
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
commission them. Every question in `questions.json` is original — written from
standard textbook facts and computations, `source: "original"`. The bank is
~1675 questions across 87 subject pools. Solid (20+ questions each): the
original Science subjects (70–100 each), Government's original 3 subjects
(~50 each), all of School (20 each), and the 20 original Engineering subjects
(20 each). Still a **~10-question first batch, not a finished bank**: CAT,
Commerce, Humanities, Government's 3 newer subjects, Engineering Mathematics,
and the 27 newer Engineering subjects (3 more per original stream, plus the 4
new streams). Topping those up to 20+ and reviewing the answer keys (especially
the niche Engineering streams: Chemical, Aerospace, Instrumentation) is real,
outstanding work — don't treat the presence of a pool as equivalent to it being
vetted. Spot-check answer keys before any store release. The correct option is
spread evenly across the four slots by construction (the app does not shuffle
options at runtime), so the answer isn't always in the same place.

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
- Reports are stored locally only — no backend to receive them yet
- Question bank ~1675 across 87 pools. Solid (20+/subject): Science (70–100),
  Government's original 3 subjects (~50), School (20), original 20 Engineering
  subjects (20). Still a ~10/subject first batch: CAT, Commerce, Humanities,
  Government's 3 newer subjects, Engineering Maths, and 27 newer Engineering
  subjects (4 new streams + 3 more per original stream) — top up and review keys
- School/Engineering/CAT/Commerce/Humanities/Govt-new questions are all
  plain-text MCQ — no numericals, no LaTeX yet
- No test suite

---

## Immediate next step

The client app is feature-complete for what it can do offline (practice flows,
adaptive mixing, scoring, review, progress, reports, web + native). The two things
left are both backend, and both need your Firebase project:

1. **Firebase Auth + Firestore** (roadmap 1–3) — so progress and reports follow the
   user, and the answer key stops shipping to the device.
2. **Timed mock tests** (roadmap 4) — can be built client-side but wants a real
   paper structure and question volume first.

Still worth doing on hardware before any of that: run in Expo Go and confirm LaTeX
renders correctly on a real device — the WebView font/encoding last mile on real
Android/iOS hasn't been checked, though the pipeline is verified headless.

```bash
npm install
npx expo start
```
