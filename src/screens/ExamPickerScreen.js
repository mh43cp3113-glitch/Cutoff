import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrack, getPlayableExams } from '../lib/quiz';
import { color, type, space, radius } from '../theme';

export default function ExamPickerScreen({ route, navigation }) {
  const { trackId } = route.params;
  const track = getTrack(trackId);
  const exams = getPlayableExams(trackId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: track ? track.name : 'Choose an exam' });
  }, [navigation, track]);

  const openExam = (exam) => {
    if (exam.subjects.length === 1) {
      navigation.navigate('Subject', {
        trackId,
        examId: exam.examId,
        subjectId: exam.subjects[0].subjectId,
      });
    } else {
      navigation.navigate('SubjectPicker', { trackId, examId: exam.examId });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <Text style={[type.small, { marginBottom: space.sm }]}>Which exam?</Text>
        {exams.map((exam) => {
          const total = exam.subjects.reduce((n, s) => n + s.count, 0);
          return (
            <Pressable
              key={exam.examId}
              onPress={() => openExam(exam)}
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
              <Text style={type.title}>{exam.examName}</Text>
              <Text style={[type.small, { marginTop: 2 }]}>
                {exam.subjects.map((s) => s.subjectName).join(' · ')} · {total} question
                {total === 1 ? '' : 's'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
