// The only module that knows where questions come from.
// Swapping local JSON for a Firestore call later means editing this file alone —
// screens never touch the data source directly.

import questions from '../data/questions.json';
import taxonomy from '../data/taxonomy.json';

export function getTracks() {
  return taxonomy.tracks;
}

export function getTrack(trackId) {
  return taxonomy.tracks.find((t) => t.id === trackId) || null;
}

export function getExam(trackId, examId) {
  return getTrack(trackId)?.exams.find((e) => e.id === examId) || null;
}

export function getSubject(trackId, examId, subjectId) {
  return getExam(trackId, examId)?.subjects.find((s) => s.id === subjectId) || null;
}

/** Looks a question up by id — used to show a reported question's own text
 * instead of its bare id (Progress screen's reported-questions list). */
export function getQuestionById(id) {
  return questions.find((q) => q.id === id) || null;
}

function live(q) {
  return q.status === 'live';
}

/** A question is playable if it's live and not reported on this device. */
function playable(q, excludeIds) {
  return live(q) && !(excludeIds && excludeIds.has(q.id));
}

// Questions are tagged with a subject and pooled across every exam that teaches
// that subject — JEE, NEET and Class 11–12 physics are one pool. The `exam`
// field on a question is metadata, never a practice filter. (Questions still
// carry a hidden `topic` tag, used only to weight the adaptive set below.)
export function questionsForSubject(subjectId, excludeIds) {
  return questions.filter((q) => playable(q, excludeIds) && q.subject === subjectId);
}

export function countForSubject(subjectId, excludeIds) {
  return questionsForSubject(subjectId, excludeIds).length;
}

/**
 * Every unlocked exam under a track that has at least one playable subject, as
 * `{ trackId, examId, examName, subjects: [{ subjectId, subjectName, count }] }`.
 * Home and the pickers walk this to route category → exam → subject.
 */
export function getPlayableExams(trackId) {
  const track = getTrack(trackId);
  if (!track || track.locked) return [];
  const out = [];
  for (const exam of track.exams || []) {
    if (exam.locked) continue;
    const subjects = [];
    for (const subject of exam.subjects || []) {
      if (subject.locked) continue;
      const count = countForSubject(subject.id);
      if (count === 0) continue;
      subjects.push({ subjectId: subject.id, subjectName: subject.name, count });
    }
    if (subjects.length) {
      out.push({ trackId: track.id, examId: exam.id, examName: exam.name, subjects });
    }
  }
  return out;
}

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * A practice set for one subject. Selection leans towards areas the student
 * answers poorly — weight rises as accuracy on a question's (hidden) topic
 * falls, so a weak area at 40% is drawn about twice as often as one at 90%.
 * Areas with fewer than 3 attempts get a middling weight.
 *
 * topicStats: { [topicId]: { attempted, correct } } — kept internally, never
 * shown to the student.
 */
export function buildSubjectQuiz(subjectId, count = 10, topicStats = {}, excludeIds) {
  const all = questions.filter((q) => live(q) && q.subject === subjectId);
  const filtered = all.filter((q) => playable(q, excludeIds));
  const pool = filtered.length ? filtered : all;

  const weightFor = (topicId) => {
    const s = topicStats[topicId];
    if (!s || s.attempted < 3) return 1.4;
    const accuracy = s.correct / s.attempted;
    return 0.4 + (1 - accuracy) * 2;
  };

  const scored = pool.map((q) => ({ q, score: Math.random() * weightFor(q.topic) }));
  scored.sort((a, b) => b.score - a.score);
  return shuffle(scored.slice(0, count).map((s) => s.q));
}

/**
 * A mixed "random test" pulling proportionally from every unlocked subject in
 * one exam — e.g. a JEE Main mock spanning Physics, Chemistry and Maths in one
 * sitting, rather than one subject at a time. Unlike buildSubjectQuiz,
 * selection is uniform random per subject, not weighted by topic accuracy:
 * this is meant to feel like a real mixed paper, not another practice set.
 */
export function buildExamQuiz(trackId, examId, count = 20, excludeIds) {
  const exam = getExam(trackId, examId);
  if (!exam) return [];
  const subjectIds = (exam.subjects || []).filter((s) => !s.locked).map((s) => s.id);
  if (!subjectIds.length) return [];

  const perSubject = Math.max(1, Math.floor(count / subjectIds.length));
  const pools = {};
  const picked = [];
  subjectIds.forEach((id) => {
    const pool = shuffle(questionsForSubject(id, excludeIds));
    pools[id] = pool;
    picked.push(...pool.slice(0, perSubject));
  });

  if (picked.length < count) {
    const pickedIds = new Set(picked.map((q) => q.id));
    const leftover = subjectIds
      .flatMap((id) => pools[id].slice(perSubject))
      .filter((q) => !pickedIds.has(q.id));
    picked.push(...shuffle(leftover).slice(0, count - picked.length));
  }

  return shuffle(picked.slice(0, count));
}

/** Grade one response. `answer` is an array of option ids, or a number. */
export function grade(question, answer) {
  if (answer === null || answer === undefined) return false;

  if (question.question_type === 'numerical') {
    const { value, tolerance } = question.numerical_answer;
    return Math.abs(Number(answer) - value) <= tolerance;
  }

  const given = [...answer].sort();
  const expected = [...question.correct_option_ids].sort();
  return (
    given.length === expected.length && given.every((id, i) => id === expected[i])
  );
}

export function scoreAttempt(questionList, answers) {
  let score = 0;
  let max = 0;
  let correctCount = 0;

  questionList.forEach((q, i) => {
    max += q.marks;
    const answer = answers[i];
    const skipped = answer === null || answer === undefined || answer === '';
    if (skipped) return;
    if (grade(q, answer)) {
      score += q.marks;
      correctCount += 1;
    } else {
      score += q.negative_marks;
    }
  });

  return { score, max, correctCount, total: questionList.length };
}

/** Roll an attempt into per-area accuracy, for the adaptive weighting above. */
export function updateTopicStats(prevStats, questionList, answers) {
  const next = { ...prevStats };
  questionList.forEach((q, i) => {
    const answer = answers[i];
    if (answer === null || answer === undefined || answer === '') return;
    const s = next[q.topic] || { attempted: 0, correct: 0 };
    next[q.topic] = {
      attempted: s.attempted + 1,
      correct: s.correct + (grade(q, answer) ? 1 : 0),
    };
  });
  return next;
}
