const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadEsm } = require('./support/loadEsm');

const quiz = loadEsm(path.join(__dirname, '..', 'src', 'lib', 'quiz.js'));
const {
  grade,
  scoreAttempt,
  updateTopicStats,
  buildSubjectQuiz,
  buildExamQuiz,
  questionsForSubject,
  countForSubject,
  getPlayableExams,
  getTracks,
  getQuestionById,
} = quiz;

const mcq = (overrides = {}) => ({
  id: 'q_test_mcq',
  subject: 'physics',
  topic: 'test_topic',
  question_type: 'mcq',
  correct_option_ids: ['b'],
  numerical_answer: null,
  marks: 4,
  negative_marks: -1,
  status: 'live',
  ...overrides,
});

const multi = (overrides = {}) => ({
  id: 'q_test_multi',
  subject: 'physics',
  topic: 'test_topic',
  question_type: 'multi_select',
  correct_option_ids: ['a', 'c'],
  numerical_answer: null,
  marks: 4,
  negative_marks: -2,
  status: 'live',
  ...overrides,
});

const numerical = (overrides = {}) => ({
  id: 'q_test_num',
  subject: 'physics',
  topic: 'test_topic',
  question_type: 'numerical',
  correct_option_ids: null,
  numerical_answer: { value: 10, tolerance: 0.5 },
  marks: 4,
  negative_marks: 0,
  status: 'live',
  ...overrides,
});

test('grade() — MCQ', () => {
  const q = mcq();
  assert.equal(grade(q, ['b']), true);
  assert.equal(grade(q, ['a']), false);
  assert.equal(grade(q, null), false);
  assert.equal(grade(q, undefined), false);
});

test('grade() — multi-select is order independent', () => {
  const q = multi();
  assert.equal(grade(q, ['a', 'c']), true);
  assert.equal(grade(q, ['c', 'a']), true);
  assert.equal(grade(q, ['a']), false);
  assert.equal(grade(q, ['a', 'b', 'c']), false);
});

test('grade() — numerical respects tolerance', () => {
  const q = numerical();
  assert.equal(grade(q, '10'), true);
  assert.equal(grade(q, '10.4'), true);
  assert.equal(grade(q, '10.6'), false);
  assert.equal(grade(q, '-10'), false);
});

test('scoreAttempt() — correct, incorrect and skipped questions', () => {
  const questionList = [mcq(), mcq({ id: 'q2' }), mcq({ id: 'q3' })];
  // q1 correct, q2 incorrect, q3 skipped
  const result = scoreAttempt(questionList, [['b'], ['a'], null]);
  assert.equal(result.correctCount, 1);
  assert.equal(result.total, 3);
  assert.equal(result.max, 12);
  // +4 for correct, -1 for incorrect, 0 for skipped
  assert.equal(result.score, 3);
});

test('scoreAttempt() — all skipped scores zero, not negative', () => {
  const questionList = [mcq(), mcq({ id: 'q2' })];
  const result = scoreAttempt(questionList, [null, undefined]);
  assert.equal(result.score, 0);
  assert.equal(result.correctCount, 0);
});

test('updateTopicStats() — accumulates per-topic accuracy, ignoring skips', () => {
  const questionList = [
    mcq({ topic: 'algebra' }),
    mcq({ id: 'q2', topic: 'algebra' }),
    mcq({ id: 'q3', topic: 'geometry' }),
  ];
  const next = updateTopicStats({}, questionList, [['b'], ['a'], null]);
  assert.deepEqual(next.algebra, { attempted: 2, correct: 1 });
  assert.equal(next.geometry, undefined, 'skipped answers should not create a topic entry');
});

test('updateTopicStats() — does not mutate the previous stats object', () => {
  const prev = { algebra: { attempted: 1, correct: 1 } };
  const next = updateTopicStats(prev, [mcq({ topic: 'algebra' })], [['b']]);
  assert.equal(prev.algebra.attempted, 1, 'original object must be untouched');
  assert.equal(next.algebra.attempted, 2);
});

test('questionsForSubject() / countForSubject() agree, and only return live questions', () => {
  const list = questionsForSubject('physics');
  assert.equal(list.length, countForSubject('physics'));
  assert.ok(list.length > 0, 'physics should have real content');
  assert.ok(list.every((q) => q.subject === 'physics'));
});

test('questionsForSubject() honours excludeIds', () => {
  const list = questionsForSubject('physics');
  const excluded = new Set([list[0].id]);
  const filtered = questionsForSubject('physics', excluded);
  assert.equal(filtered.length, list.length - 1);
  assert.ok(!filtered.some((q) => q.id === list[0].id));
});

test('buildSubjectQuiz() returns the requested count, all from one subject', () => {
  const result = buildSubjectQuiz('physics', 10, {});
  assert.equal(result.length, 10);
  assert.ok(result.every((q) => q.subject === 'physics'));
});

test('buildSubjectQuiz() never returns more than the pool has', () => {
  const available = countForSubject('cat_quant');
  const result = buildSubjectQuiz('cat_quant', 9999, {});
  assert.equal(result.length, available);
});

test('buildExamQuiz() mixes across every unlocked subject in the exam', () => {
  const result = buildExamQuiz('entrance', 'jee_main', 21);
  assert.equal(result.length, 21);
  const subjectsSeen = new Set(result.map((q) => q.subject));
  assert.deepEqual(subjectsSeen, new Set(['physics', 'chemistry', 'maths']));
});

test('buildExamQuiz() returns [] for an unknown exam', () => {
  assert.deepEqual(buildExamQuiz('entrance', 'does_not_exist', 20), []);
});

test('buildExamQuiz() honours excludeIds across subjects', () => {
  const full = buildExamQuiz('school', 'class_3', 20);
  const excluded = new Set(full.map((q) => q.id));
  const result = buildExamQuiz('school', 'class_3', 20, excluded);
  assert.ok(result.every((q) => !excluded.has(q.id)));
});

test('getPlayableExams() only returns unlocked exams/subjects with live content', () => {
  const tracks = getTracks();
  for (const track of tracks) {
    const playable = getPlayableExams(track.id);
    if (track.locked) {
      assert.deepEqual(playable, []);
      continue;
    }
    for (const exam of playable) {
      for (const subject of exam.subjects) {
        assert.ok(subject.count > 0, `${exam.examId}/${subject.subjectId} must have live questions`);
      }
    }
  }
});

test('getQuestionById() finds a real question and returns null for an unknown id', () => {
  const [first] = questionsForSubject('physics');
  assert.equal(getQuestionById(first.id).id, first.id);
  assert.equal(getQuestionById('not_a_real_id'), null);
});
