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
        {exams.map((exam) => (
          <Pressable
            key={exam.examId}
            onPress={() => openExam(exam)}
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
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={type.title}>{exam.examName}</Text>
              <Text style={[type.small, { marginTop: 2 }]}>
                {exam.subjects.map((s) => s.subjectName).join(' · ')}
              </Text>
            </View>
            <Text style={{ fontSize: 22, color: color.inkSoft, marginLeft: space.sm }}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
