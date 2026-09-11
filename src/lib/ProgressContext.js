import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth } from './firebase';
import { updateTopicStats } from './quiz';
import {
  loadTopicStats,
  saveTopicStats,
  loadAttempts,
  saveAttempt,
  loadStreak,
  touchStreak,
  loadReports,
  saveReport,
  resetProgress,
  loadProfile,
  saveProfile,
  clearProfile,
} from './storage';

const ProgressContext = createContext(null);

const EMPTY_STREAK = { current: 0, longest: 0, lastActiveDate: null };

// Firebase error codes -> copy a student can actually act on.
function authErrorMessage(err) {
  switch (err?.code) {
    case 'auth/email-already-in-use':
      return 'That email already has an account — try logging in instead.';
    case 'auth/invalid-email':
      return 'That doesn\'t look like a valid email address.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts — wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'No internet connection — check your network and try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export function ProgressProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [topicStats, setTopicStats] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [streak, setStreak] = useState(EMPTY_STREAK);
  const [reports, setReports] = useState({});

  // Two independent notions of "signed in": a real Firebase account (`user`),
  // or a device-local guest name (`profile`, unchanged from before Firebase
  // existed). Either satisfies App.js's RootNavigator gate — a real account
  // gets real (if currently Auth-only, no Firestore yet) sign-in; a guest
  // gets in with just a name, since forcing real signup before the first
  // quiz is a known retention killer (see CLAUDE.md's Product notes).
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stats, history, s, r, p] = await Promise.all([
        loadTopicStats(),
        loadAttempts(),
        loadStreak(),
        loadReports(),
        loadProfile(),
      ]);
      if (cancelled) return;
      setTopicStats(stats);
      setAttempts(history);
      setStreak(s);
      setReports(r);
      setProfileState(p);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [profile, setProfileState] = useState(null);

  /** Local-only guest name — see storage.js. Not real authentication. */
  const signInGuest = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = await saveProfile({ name: trimmed, signedInAt: new Date().toISOString() });
    setProfileState(next);
  }, []);

  const signOutGuest = useCallback(async () => {
    await clearProfile();
    setProfileState(null);
  }, []);

  /** Real Firebase account creation. Throws on failure — callers show authErrorMessage(err). */
  const signUpWithEmail = useCallback(async (email, password, name) => {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (name?.trim()) {
      await updateFirebaseProfile(credential.user, { displayName: name.trim() });
    }
    // updateProfile mutates the server record but not always the cached
    // client object in every SDK version — re-read to be sure `user` carries
    // the display name immediately rather than waiting for the next refresh.
    setUser({ ...auth.currentUser });
  }, []);

  const signInWithEmail = useCallback(async (email, password) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOutUser = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  /**
   * Record one finished quiz. State updates immediately so the UI never waits on
   * disk; the writes settle behind it. A failed write costs one attempt's history,
   * not the session.
   */
  const recordAttempt = useCallback(
    async ({ questionList, answers, label, score, max, correctCount, total }) => {
      const nextStats = updateTopicStats(topicStats, questionList, answers);
      setTopicStats(nextStats);

      const attempt = {
        id: `a_${Date.now()}`,
        label,
        score,
        max,
        correctCount,
        total: total ?? questionList.length,
        question_ids: questionList.map((q) => q.id),
        completed_at: new Date().toISOString(),
      };

      const [nextAttempts, nextStreak] = await Promise.all([
        saveAttempt(attempt),
        touchStreak(),
        saveTopicStats(nextStats),
      ]);

      setAttempts(nextAttempts);
      setStreak(nextStreak);
    },
    [topicStats]
  );

  /** Flag a question as broken. Held on-device until there's a backend to receive it. */
  const reportQuestion = useCallback(async (questionId, reason) => {
    const next = await saveReport(questionId, reason);
    setReports(next);
  }, []);

  const clearAll = useCallback(async () => {
    await resetProgress();
    setTopicStats({});
    setAttempts([]);
    setStreak(EMPTY_STREAK);
    setReports({});
  }, []);

  const reportedIds = useMemo(() => new Set(Object.keys(reports)), [reports]);

  const displayName = user?.displayName || user?.email || profile?.name || null;
  const signedIn = Boolean(user || profile);

  const value = useMemo(
    () => ({
      ready: ready && authReady,
      topicStats,
      attempts,
      streak,
      reports,
      reportedIds,
      recordAttempt,
      reportQuestion,
      clearAll,
      user,
      profile,
      displayName,
      signedIn,
      signUpWithEmail,
      signInWithEmail,
      signOutUser,
      signInGuest,
      signOutGuest,
      authErrorMessage,
    }),
    [
      ready,
      authReady,
      topicStats,
      attempts,
      streak,
      reports,
      reportedIds,
      recordAttempt,
      reportQuestion,
      clearAll,
      user,
      profile,
      displayName,
      signedIn,
      signUpWithEmail,
      signInWithEmail,
      signOutUser,
      signInGuest,
      signOutGuest,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
