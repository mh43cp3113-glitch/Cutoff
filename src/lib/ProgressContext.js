import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Platform } from 'react-native';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
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
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null; // the user closed the Google popup themselves — not an error worth showing
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup — allow popups for this site and try again.';
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

  // The only notion of "signed in" — a real Firebase account. There is no
  // guest mode (removed per direction; it existed briefly to avoid forcing
  // signup before the first quiz, but that's no longer how this app works).
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
      const [stats, history, s, r] = await Promise.all([
        loadTopicStats(),
        loadAttempts(),
        loadStreak(),
        loadReports(),
      ]);
      if (cancelled) return;
      setTopicStats(stats);
      setAttempts(history);
      setStreak(s);
      setReports(r);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
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

  /**
   * Google sign-in via Firebase's own popup flow — this works today with zero
   * extra setup beyond enabling Google under Authentication in the Firebase
   * console (already done), because Firebase manages its own OAuth client for
   * this web flow. It only works on web: React Native has no browser popup,
   * so native Google sign-in still needs expo-auth-session plus a separate
   * OAuth client ID from the Google Cloud console — not set up yet.
   */
  const signInWithGoogle = useCallback(async () => {
    if (Platform.OS !== 'web') {
      const err = new Error('Google sign-in is web-only for now.');
      err.code = 'auth/operation-not-supported-in-this-environment';
      throw err;
    }
    await signInWithPopup(auth, new GoogleAuthProvider());
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

  const displayName = user?.displayName || user?.email || null;
  const signedIn = Boolean(user);

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
      displayName,
      signedIn,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOutUser,
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
      displayName,
      signedIn,
      signUpWithEmail,
      signInWithEmail,
      signInWithGoogle,
      signOutUser,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
