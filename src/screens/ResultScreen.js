import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MathText from '../components/MathText';
import { scoreAttempt, grade } from '../lib/quiz';
import { useProgress } from '../lib/ProgressContext';
import { color, type, space, radius } from '../theme';

function answerLabel(question, answer) {
  if (answer === null || answer === undefined || answer === '') return 'Skipped';
  if (question.question_type === 'numerical') return String(answer);
  return answer.join(', ').toUpperCase();
}

export default function ResultScreen({ route, navigation }) {
  const { questionList, answers, label } = route.params;
  const { score, max, correctCount, total } = scoreAttempt(questionList, answers);
  const { recordAttempt, streak } = useProgress();

  // Guarded against React 18 double-invoking effects in development, which would
  // otherwise log the same attempt twice and double-count every topic.
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordAttempt({ questionList, answers, label, score, max });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <Text style={[type.small]}>{label}</Text>
        <Text style={[type.display, { marginTop: space.xs }]}>
          {score} out of {max}
        </Text>
        <Text style={[type.small, { marginTop: space.xs, marginBottom: space.lg }]}>
          {correctCount} of {total} correct. Negative marking applied where the exam uses it.
        </Text>

        {questionList.map((question, i) => {
          const answer = answers[i];
          const skipped = answer === null || answer === undefined || answer === '';
          const ok = !skipped && grade(question, answer);
          const mark = skipped ? color.locked : ok ? color.correct : color.wrong;

          return (
            <View
              key={question.id}
              style={{
                borderLeftWidth: 3,
                borderLeftColor: mark,
                paddingLeft: space.md,
                marginBottom: space.lg,
              }}
            >
              <Text style={[type.small, { color: mark, fontWeight: '600' }]}>
                {skipped ? 'Skipped' : ok ? 'Correct' : 'Incorrect'} · your answer:{' '}
                {answerLabel(question, answer)}
              </Text>

              <MathText
                body={question.body}
                contentType={question.content_type}
                fontSize={16}
                style={{ marginTop: space.sm }}
              />

              <View
                style={{
                  backgroundColor: color.card,
                  borderRadius: radius.sm,
                  padding: space.md,
                  marginTop: space.sm,
                }}
              >
                <Text style={[type.small, { marginBottom: space.xs }]}>Why</Text>
                <MathText
                  body={question.explanation.body}
                  contentType={question.explanation.content_type}
                  fontSize={15}
                />
              </View>

              <Pressable onPress={() => {}} style={{ marginTop: space.sm }}>
                <Text style={[type.small, { color: color.inkSoft }]}>
                  Report a problem with this question
                </Text>
              </Pressable>
            </View>
          );
        })}

        <Pressable
          onPress={() => navigation.popToTop()}
          style={{
            backgroundColor: color.ink,
            borderRadius: radius.sm,
            padding: space.md,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: color.paper, fontWeight: '600', fontSize: 16 }}>
            Back to topics
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
