import AsyncStorage from '@react-native-async-storage/async-storage';

// Every read is defensive. A corrupt or half-written value should degrade to
// "no progress yet" rather than crash the app on launch — a student losing their
// streak display is survivable, a boot loop is not.

const KEYS = {
  topicStats: 'progress:topic_stats:v1',
  attempts: 'progress:attempts:v1',
  streak: 'progress:streak:v1',
};

const MAX_ATTEMPTS = 50; // keep history bounded; older attempts fall off

async function readJson(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const loadTopicStats = () => readJson(KEYS.topicStats, {});
export const saveTopicStats = (stats) => writeJson(KEYS.topicStats, stats);

export const loadAttempts = () => readJson(KEYS.attempts, []);

export async function saveAttempt(attempt) {
  const attempts = await loadAttempts();
  const next = [attempt, ...attempts].slice(0, MAX_ATTEMPTS);
  await writeJson(KEYS.attempts, next);
  return next;
}

function todayKey(date = new Date()) {
  // Local calendar date, not UTC — a 1 a.m. study session should count as that
  // night, and UTC would silently roll the streak over in the middle of it.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(fromKey, toKey) {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  return Math.round((to - from) / 86400000);
}

export const loadStreak = () =>
  readJson(KEYS.streak, { current: 0, longest: 0, lastActiveDate: null });

/** Call once per completed quiz. Same-day repeats don't inflate the streak. */
export async function touchStreak() {
  const streak = await loadStreak();
  const today = todayKey();

  if (streak.lastActiveDate === today) return streak;

  const gap = streak.lastActiveDate ? daysBetween(streak.lastActiveDate, today) : null;
  const current = gap === 1 ? streak.current + 1 : 1;

  const next = {
    current,
    longest: Math.max(current, streak.longest),
    lastActiveDate: today,
  };
  await writeJson(KEYS.streak, next);
  return next;
}

export async function resetProgress() {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
    return true;
  } catch {
    return false;
  }
}
