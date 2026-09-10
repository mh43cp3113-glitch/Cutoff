// Structural checks on the content files. These catch the kind of authoring
// bugs (a stray malformed distractor, an orphaned subject id, a duplicate
// question id) that were repeatedly hand-caught during batch content
// generation — this makes that check permanent instead of ad hoc. It does
// NOT verify that an answer key is factually correct; that still needs a
// human review pass (see CLAUDE.md's Constraints section).
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const questions = require(path.join(__dirname, '..', 'src', 'data', 'questions.json'));
const taxonomy = require(path.join(__dirname, '..', 'src', 'data', 'taxonomy.json'));

function allTaxonomySubjectIds() {
  const ids = new Set();
  for (const track of taxonomy.tracks) {
    for (const exam of track.exams || []) {
      for (const subject of exam.subjects || []) {
        ids.add(subject.id);
      }
    }
  }
  return ids;
}

test('every question has a unique id', () => {
  const seen = new Set();
  const dupes = [];
  for (const q of questions) {
    if (seen.has(q.id)) dupes.push(q.id);
    seen.add(q.id);
  }
  assert.deepEqual(dupes, []);
});

test('every question belongs to a subject that exists in taxonomy.json', () => {
  const taxonomySubjects = allTaxonomySubjectIds();
  const orphaned = [...new Set(questions.map((q) => q.subject))].filter(
    (id) => !taxonomySubjects.has(id)
  );
  assert.deepEqual(orphaned, [], 'orphaned subject ids found in questions.json');
});

test('every unlocked taxonomy subject has at least one live question', () => {
  const questionsBySubject = new Set(
    questions.filter((q) => q.status === 'live').map((q) => q.subject)
  );
  const empty = [];
  for (const track of taxonomy.tracks) {
    if (track.locked) continue;
    for (const exam of track.exams || []) {
      if (exam.locked) continue;
      for (const subject of exam.subjects || []) {
        if (subject.locked) continue;
        if (!questionsBySubject.has(subject.id)) {
          empty.push(`${track.id}/${exam.id}/${subject.id}`);
        }
      }
    }
  }
  assert.deepEqual(empty, []);
});

test('MCQ and multi-select questions have exactly 4 well-formed options', () => {
  const bad = [];
  for (const q of questions) {
    if (q.question_type !== 'mcq' && q.question_type !== 'multi_select') continue;
    const ids = (q.options || []).map((o) => o.id).sort().join('');
    const bodies = new Set((q.options || []).map((o) => o.body));
    if (!q.options || q.options.length !== 4 || ids !== 'abcd' || bodies.size !== 4) {
      bad.push(q.id);
    }
  }
  assert.deepEqual(bad, []);
});

test('MCQ correct_option_ids reference a real option, and only one', () => {
  const bad = questions
    .filter((q) => q.question_type === 'mcq')
    .filter((q) => {
      const optionIds = new Set(q.options.map((o) => o.id));
      return q.correct_option_ids.length !== 1 || !optionIds.has(q.correct_option_ids[0]);
    })
    .map((q) => q.id);
  assert.deepEqual(bad, []);
});

test('multi-select correct_option_ids has at least 2 entries, all real options', () => {
  const bad = questions
    .filter((q) => q.question_type === 'multi_select')
    .filter((q) => {
      const optionIds = new Set(q.options.map((o) => o.id));
      return (
        q.correct_option_ids.length < 2 ||
        !q.correct_option_ids.every((id) => optionIds.has(id))
      );
    })
    .map((q) => q.id);
  assert.deepEqual(bad, []);
});

test('numerical questions carry a numerical_answer with value and tolerance, and no options', () => {
  const bad = questions
    .filter((q) => q.question_type === 'numerical')
    .filter((q) => {
      const ans = q.numerical_answer;
      return (
        !ans ||
        typeof ans.value !== 'number' ||
        typeof ans.tolerance !== 'number' ||
        q.options !== null
      );
    })
    .map((q) => q.id);
  assert.deepEqual(bad, []);
});

test('every question has positive marks and non-positive negative_marks', () => {
  const bad = questions
    .filter((q) => !(q.marks > 0) || q.negative_marks > 0)
    .map((q) => q.id);
  assert.deepEqual(bad, []);
});

test('every live question has a non-empty explanation body', () => {
  const bad = questions
    .filter((q) => q.status === 'live')
    .filter((q) => !q.explanation || !q.explanation.body || !q.explanation.body.trim())
    .map((q) => q.id);
  assert.deepEqual(bad, []);
});

test('correct-option position is reasonably spread across a/b/c/d (not skewed to one slot)', () => {
  const singleAnswer = questions.filter(
    (q) => q.question_type === 'mcq' && q.correct_option_ids.length === 1
  );
  const positions = { a: 0, b: 0, c: 0, d: 0 };
  for (const q of singleAnswer) {
    const idx = q.options.findIndex((o) => o.id === q.correct_option_ids[0]);
    const letter = ['a', 'b', 'c', 'd'][idx];
    if (letter) positions[letter] += 1;
  }
  const total = singleAnswer.length;
  for (const letter of Object.keys(positions)) {
    const share = positions[letter] / total;
    assert.ok(
      share > 0.15 && share < 0.35,
      `slot ${letter} holds ${(share * 100).toFixed(1)}% of correct answers — expected roughly 25%`
    );
  }
});
