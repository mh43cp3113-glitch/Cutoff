# Cutoff

Exam practice for Indian competitive exams. Phase 1: JEE Main Physics.

An Expo (React Native) app for Android and iOS. The taxonomy already has slots for NEET, CAT, school classes, engineering and
government exams, shown as locked tiles until questions exist for them.

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
  components/MathText.js LaTeX via KaTeX in a self-sizing WebView
  components/ProgressRail.js
  screens/               Home, Subject, Quiz, Result
```

`lib/quiz.js` is deliberately the single data boundary. When you move questions to
Firestore, you rewrite that file and the screens don't change.

## Known gaps

- **Progress is device-only.** Topic stats, attempt history and streak persist
  through AsyncStorage, but they don't follow the user to a new phone. Sign-in and
  Firestore sync are the next step.
- **KaTeX loads from a CDN**, so maths needs a connection on first render. For
  offline support, bundle `katex.min.js` and the CSS as local assets and load them
  from the file system instead.
- **Answers ship to the device.** Fine now, since the questions are yours and
  public. Before launch, move `correct_option_ids` and `explanation` behind a Cloud
  Function that only returns them after submission.
- **Report button is a stub.** It renders but does nothing yet.
- Every track except JEE Main Physics is locked, and Home routes all taps to that
  subject.

## Roadmap

1. Firebase Auth — Google sign-in, phone OTP, guest mode
2. Move questions to Firestore, keep local caching for offline
3. Cloud Function that serves questions without the answer key
4. Timed mock tests with a full paper structure
5. Free tier limits, Play Billing for Pro
6. Report triage — auto-hide a question once reports come in

## Content

The 10 seed questions are original, written for this repo. Keep it that way:
copying questions from published books or other apps is infringement, and it is
the fastest way to get pulled from the Play Store. Write them, license them, or
commission them.
