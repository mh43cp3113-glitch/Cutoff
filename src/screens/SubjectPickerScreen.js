import React, { useLayoutEffect } from 'react';
import { Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrack, getExam, getPlayableExams } from '../lib/quiz';
import { color, type, space, radius } from '../theme';

export default function SubjectPickerScreen({ route, navigation }) {
  const { trackId, examId } = route.params;
  const track = getTrack(trackId);
  const exam = getExam(trackId, examId);
  const playable = getPlayableExams(trackId).find((e) => e.examId === examId);
  const subjects = playable ? playable.subjects : [];

  useLayoutEffect(() => {
    navigation.setOptions({
      title: exam ? exam.name : track ? track.name : 'Choose a subject',
    });
  }, [navigation, exam, track]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <Text style={[type.small, { marginBottom: space.sm }]}>Which subject?</Text>
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
            <Text style={[type.small, { marginTop: 2 }]}>
              {s.count} question{s.count === 1 ? '' : 's'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
