import React, { useLayoutEffect } from 'react';
import { Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getTrack, getExam, getPlayableExams, buildExamQuiz } from '../lib/quiz';
import { useProgress } from '../lib/ProgressContext';
import { useTheme } from '../theme';

// A random test scales with how many subjects the exam has — enough per
// subject to feel representative, capped so a wide exam (e.g. an 8-subject
// Engineering stream) doesn't turn into a marathon. Paced at roughly a minute
// per question, matching how the average_time_seconds fields across the bank
// tend to run.
const PER_SUBJECT = 4;
const MIN_LENGTH = 12;
const MAX_LENGTH = 30;
const SECONDS_PER_QUESTION = 60;

export default function SubjectPickerScreen({ route, navigation }) {
  const { color, type, space, radius, shadow } = useTheme();
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

  const targetLength = Math.min(
    MAX_LENGTH,
    Math.max(MIN_LENGTH, subjects.length * PER_SUBJECT)
  );
  const estimatedMinutes = Math.round((targetLength * SECONDS_PER_QUESTION) / 60);

  const startRandomTest = () => {
    const questionList = buildExamQuiz(trackId, examId, targetLength, reportedIds);
    if (!questionList.length) return;
    navigation.navigate('Quiz', {
      questionList,
      label: exam ? `${exam.name} · Random test` : 'Random test',
      timeLimitSeconds: questionList.length * SECONDS_PER_QUESTION,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <Pressable
          onPress={startRandomTest}
          style={({ pressed }) => ({
            backgroundColor: color.accent,
            borderRadius: radius.lg,
            padding: space.md,
            marginBottom: space.lg,
            opacity: pressed ? 0.85 : 1,
            ...shadow.card,
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: '650', color: color.paper }}>
            Random test
          </Text>
          <Text style={{ fontSize: 13, marginTop: 2, color: color.rule }}>
            Timed · about {estimatedMinutes} min · mixed from every subject below
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
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: color.card,
              borderWidth: 1,
              borderColor: color.rule,
              borderRadius: radius.lg,
              padding: space.md,
              marginBottom: space.sm,
              opacity: pressed ? 0.7 : 1,
              ...shadow.card,
            })}
          >
            <Text style={[type.title, { flex: 1 }]}>{s.subjectName}</Text>
            <Ionicons name="chevron-forward" size={20} color={color.inkSoft} style={{ marginLeft: space.sm }} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
