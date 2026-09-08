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

/**
 * Every unlocked subject under a track that actually has live questions, each as
 * `{ trackId, examId, subjectId, examName, subjectName, count }`. Home uses this
 * to decide where a track tile leads: straight into the subject when there's only
 * one, or to a picker when there's a choice.
 */
export function getPlayableSubjects(trackId) {
  const track = getTrack(trackId);
  if (!track || track.locked) return [];
  const out = [];
  for (const exam of track.exams || []) {
    if (exam.locked) continue;
    for (const subject of exam.subjects || []) {
      if (subject.locked) continue;
      const count = questions.filter(
        (q) => live(q) && q.exam === exam.id && q.subject === subject.id
      ).length;
      if (count === 0) continue;
      out.push({
        trackId: track.id,
        examId: exam.id,
        subjectId: subject.id,
        examName: exam.name,
        subjectName: subject.name,
        count,
      });
    }
  }
  return out;
}

/** Human-readable topic name from its id, searched across the whole taxonomy. */
export function getTopicName(topicId) {
  for (const track of taxonomy.tracks) {
    for (const exam of track.exams || []) {
      for (const subject of exam.subjects || []) {
        const topic = (subject.topics || []).find((t) => t.id === topicId);
        if (topic) return topic.name;
      }
    }
  }
  return topicId;
}

function live(q) {
  return q.status === 'live';
}

/** A question is playable if it's live and not reported on this device. */
function playable(q, excludeIds) {
  return live(q) && !(excludeIds && excludeIds.has(q.id));
}

export function countByTopic(topicId, excludeIds) {
  return questions.filter((q) => playable(q, excludeIds) && q.topic === topicId).length;
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
 * Practice set drawn from a single topic. Reported questions (`excludeIds`) are
 * left out — unless that would empty the set, in which case the student's own
 * report shouldn't lock them out of practising the topic.
 */
export function buildTopicQuiz(topicId, count = 5, excludeIds) {
  const inTopic = questions.filter((q) => live(q) && q.topic === topicId);
  const filtered = inTopic.filter((q) => playable(q, excludeIds));
  return shuffle(filtered.length ? filtered : inTopic).slice(0, count);
}

/**
 * Mixed set biased toward topics the user answers poorly.
 * topicStats: { [topicId]: { attempted, correct } }
 *
 * Weight rises as accuracy falls, so a topic at 40% is picked roughly twice as
 * often as one at 90%. Unseen topics get a middling weight — worth sampling,
 * but not at the expense of a topic already known to be weak.
 */
export function buildAdaptiveQuiz(subjectId, count = 10, topicStats = {}, excludeIds) {
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
