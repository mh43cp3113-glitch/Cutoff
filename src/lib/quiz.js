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

export function getSubject(trackId, examId, subjectId) {
  const exam = getTrack(trackId)?.exams.find((e) => e.id === examId);
  return exam?.subjects.find((s) => s.id === subjectId) || null;
}

function live(q) {
  return q.status === 'live';
}

export function countByTopic(topicId) {
  return questions.filter((q) => live(q) && q.topic === topicId).length;
}

function shuffle(list) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Practice set drawn from a single topic. */
export function buildTopicQuiz(topicId, count = 5) {
  return shuffle(questions.filter((q) => live(q) && q.topic === topicId)).slice(0, count);
}

/**
 * Mixed set biased toward topics the user answers poorly.
 * topicStats: { [topicId]: { attempted, correct } }
 *
 * Weight rises as accuracy falls, so a topic at 40% is picked roughly twice as
 * often as one at 90%. Unseen topics get a middling weight — worth sampling,
 * but not at the expense of a topic already known to be weak.
 */
export function buildAdaptiveQuiz(subjectId, count = 10, topicStats = {}) {
  const pool = questions.filter((q) => live(q) && q.subject === subjectId);

  const weightFor = (topicId) => {
    const s = topicStats[topicId];
    if (!s || s.attempted < 3) return 1.4;
    const accuracy = s.correct / s.attempted;
    return 0.4 + (1 - accuracy) * 2;
  };

  const scored = pool.map((q) => ({ q, score: Math.random() * weightFor(q.topic) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.q);
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

/** Roll an attempt into per-topic accuracy, for the adaptive weighting above. */
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
