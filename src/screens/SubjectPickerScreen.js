import React, { useLayoutEffect } from 'react';
import { Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrack, getExam, getPlayableExams, buildExamQuiz } from '../lib/quiz';
import { useProgress } from '../lib/ProgressContext';
import { color, type, space, radius } from '../theme';

const RANDOM_TEST_LENGTH = 20;

export default function SubjectPickerScreen({ route, navigation }) {
  const { trackId, examId } = route.params;
  const track = getTrack(trackId);
  const exam = getExam(trackId, examId);
  const playable = getPlayableExams(trackId).find((e) => e.examId === examId);
  const subjects = playable ? playable.subjects : [];
  const { reportedIds } = useProgress();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: exam ? exam.name : track ? track.name : 'Choose a subject',
    });
  }, [navigation, exam, track]);

  const startRandomTest = () => {
    const questionList = buildExamQuiz(trackId, examId, RANDOM_TEST_LENGTH, reportedIds);
    if (!questionList.length) return;
    navigation.navigate('Quiz', {
      questionList,
      label: exam ? `${exam.name} · Random test` : 'Random test',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <Pressable
          onPress={startRandomTest}
          style={({ pressed }) => ({
            backgroundColor: color.ink,
            borderRadius: radius.lg,
            padding: space.md,
            marginBottom: space.lg,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: '650', color: color.paper }}>
            Random test
          </Text>
          <Text style={{ fontSize: 13, marginTop: 2, color: color.rule }}>
            A mixed set pulling from every subject below
          </Text>
        </Pressable>

        <Text style={[type.small, { marginBottom: space.sm }]}>
          Or pick one subject to practise:
        </Text>
        {subjects.map((s) => (
          <Pressable
            key={s.subjectId}
            onPress={() =>
              navigation.navigate('Subject', { trackId, examId, subjectId: s.subjectId })
            }
            style={({ pressed }) => ({
              backgroundColor: color.card,
              borderWidth: 1,
              borderColor: color.rule,
              borderRadius: radius.md,
              padding: space.md,
              marginBottom: space.sm,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={type.title}>{s.subjectName}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
