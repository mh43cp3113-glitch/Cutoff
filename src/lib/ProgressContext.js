import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
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

export function ProgressProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [topicStats, setTopicStats] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [streak, setStreak] = useState(EMPTY_STREAK);
  const [reports, setReports] = useState({});
  const [profile, setProfile] = useState(null);

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
      setProfile(p);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Local-only display name — see storage.js. Not real authentication. */
  const signIn = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next = await saveProfile({ name: trimmed, signedInAt: new Date().toISOString() });
    setProfile(next);
  }, []);

  const signOut = useCallback(async () => {
    await clearProfile();
    setProfile(null);
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

  const value = useMemo(
    () => ({
      ready,
      topicStats,
      attempts,
      streak,
      reports,
      reportedIds,
      recordAttempt,
      reportQuestion,
      clearAll,
      profile,
      signIn,
      signOut,
    }),
    [
      ready,
      topicStats,
      attempts,
      streak,
      reports,
      reportedIds,
      recordAttempt,
      reportQuestion,
      clearAll,
      profile,
      signIn,
      signOut,
    ]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
