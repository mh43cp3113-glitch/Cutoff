import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { updateTopicStats } from './quiz';
import {
  loadTopicStats,
  saveTopicStats,
  loadAttempts,
  saveAttempt,
  loadStreak,
  touchStreak,
  resetProgress,
} from './storage';

const ProgressContext = createContext(null);

export function ProgressProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [topicStats, setTopicStats] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0, lastActiveDate: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [stats, history, s] = await Promise.all([
        loadTopicStats(),
        loadAttempts(),
        loadStreak(),
      ]);
      if (cancelled) return;
      setTopicStats(stats);
      setAttempts(history);
      setStreak(s);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Record one finished quiz. State updates immediately so the UI never waits on
   * disk; the writes settle behind it. A failed write costs one attempt's history,
   * not the session.
   */
  const recordAttempt = useCallback(
    async ({ questionList, answers, label, score, max }) => {
      const nextStats = updateTopicStats(topicStats, questionList, answers);
      setTopicStats(nextStats);

      const attempt = {
        id: `a_${Date.now()}`,
        label,
        score,
        max,
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

  const clearAll = useCallback(async () => {
    await resetProgress();
    setTopicStats({});
    setAttempts([]);
    setStreak({ current: 0, longest: 0, lastActiveDate: null });
  }, []);

  return (
    <ProgressContext.Provider
      value={{ ready, topicStats, attempts, streak, recordAttempt, clearAll }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
