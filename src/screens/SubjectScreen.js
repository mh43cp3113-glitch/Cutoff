import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getExam, getSubject, countForSubject, buildSubjectQuiz } from '../lib/quiz';
import { useProgress } from '../lib/ProgressContext';
import { useTheme } from '../theme';

const LENGTHS = [10, 20];

export default function SubjectScreen({ route, navigation }) {
  const { color, type, space, radius, shadow } = useTheme();
  const { trackId, examId, subjectId } = route.params;
  const subject = getSubject(trackId, examId, subjectId);
  const exam = getExam(trackId, examId);
  const { topicStats: stats, reportedIds } = useProgress();

  const available = countForSubject(subjectId, reportedIds);

  useLayoutEffect(() => {
    if (subject) {
      navigation.setOptions({
        title: exam ? `${exam.name} · ${subject.name}` : subject.name,
      });
    }
  }, [navigation, exam, subject]);

  if (!subject) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }}>
        <Text style={[type.body, { padding: space.md }]}>Subject not found.</Text>
      </SafeAreaView>
    );
  }

  const start = (requested) => {
    const count = Math.min(requested, available);
    if (count === 0) return;
    const questionList = buildSubjectQuiz(subjectId, count, stats, reportedIds);
    if (!questionList.length) return;
    navigation.navigate('Quiz', { questionList, label: subject.name });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <Text style={type.display}>{subject.name}</Text>
        <Text style={[type.small, { marginTop: space.xs, marginBottom: space.xl }]}>
          {available === 0
            ? 'No questions here yet — check back soon.'
            : 'Each set is mixed from the whole subject and leans towards the kind of question you get wrong.'}
        </Text>

        {LENGTHS.filter((len, i) => i === 0 || available > LENGTHS[0]).map((len, i) => {
          const count = Math.min(len, available);
          const disabled = available === 0;
          const primary = i === 0;
          return (
            <Pressable
              key={len}
              disabled={disabled}
              onPress={() => start(len)}
              style={({ pressed }) => ({
                backgroundColor: primary ? color.ink : color.card,
                borderWidth: primary ? 0 : 1,
                borderColor: color.rule,
                borderRadius: radius.lg,
                padding: space.md,
                marginBottom: space.sm,
                opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
                ...(disabled ? null : shadow.card),
              })}
            >
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: '650',
                  color: primary ? color.paper : color.ink,
                }}
              >
                {primary ? 'Start practice' : 'Longer set'}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  marginTop: 2,
                  color: primary ? color.rule : color.inkSoft,
                }}
              >
                {count} question{count === 1 ? '' : 's'}
                {count < len ? ' (all that are available)' : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
