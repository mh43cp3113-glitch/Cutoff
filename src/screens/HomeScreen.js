import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTracks, getPlayableExams } from '../lib/quiz';
import { useProgress } from '../lib/ProgressContext';
import { color, type, space, radius } from '../theme';

// category (track) -> exam -> subject -> topics. Home only makes the first
// choice; it hands off to ExamPicker / SubjectPicker for the rest, skipping a
// step only when there's genuinely one option behind it.
export function routeIntoTrack(navigation, trackId) {
  const exams = getPlayableExams(trackId);
  if (exams.length === 0) return;
  if (exams.length > 1) {
    navigation.navigate('ExamPicker', { trackId });
    return;
  }
  const exam = exams[0];
  if (exam.subjects.length === 1) {
    navigation.navigate('Subject', {
      trackId,
      examId: exam.examId,
      subjectId: exam.subjects[0].subjectId,
    });
  } else {
    navigation.navigate('SubjectPicker', { trackId, examId: exam.examId });
  }
}

export default function HomeScreen({ navigation }) {
  const tracks = getTracks();
  const { streak, attempts, ready } = useProgress();

  const subtitle = !ready
    ? 'Loading your progress'
    : streak.current > 0
    ? `${streak.current} day${streak.current > 1 ? 's' : ''} in a row · ${attempts.length} quiz${
        attempts.length === 1 ? '' : 'zes'
      } finished`
    : 'Choose a category, then the exam and subject you want to practise.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginTop: space.md,
          }}
        >
          <Text style={type.display}>Practice</Text>
          <Pressable
            onPress={() => navigation.navigate('Progress')}
            accessibilityRole="button"
            accessibilityLabel="Your progress"
            hitSlop={8}
            style={({ pressed }) => ({
              borderWidth: 1,
              borderColor: color.rule,
              borderRadius: radius.sm,
              paddingVertical: 6,
              paddingHorizontal: 10,
              marginTop: 6,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text style={[type.small, { color: color.ink, fontWeight: '600' }]}>
              {streak.current > 0 ? `${streak.current}-day streak` : 'Progress'}
            </Text>
          </Pressable>
        </View>

        <Text style={[type.small, { marginTop: space.xs, marginBottom: space.lg }]}>
          {subtitle}
        </Text>

        {tracks.map((track) => {
          const exams = getPlayableExams(track.id);
          const disabled = track.locked || exams.length === 0;
          const questionCount = exams.reduce(
            (n, e) => n + e.subjects.reduce((m, s) => m + s.count, 0),
            0
          );
          return (
            <Pressable
              key={track.id}
              disabled={disabled}
              onPress={() => routeIntoTrack(navigation, track.id)}
              style={({ pressed }) => ({
                backgroundColor: color.card,
                borderWidth: 1,
                borderColor: color.rule,
                borderRadius: radius.md,
                padding: space.md,
                marginBottom: space.sm,
                opacity: disabled ? 0.55 : pressed ? 0.7 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.title, disabled && { color: color.locked }]}>
                    {track.name}
                  </Text>
                  <Text style={[type.small, { marginTop: 2 }]}>{track.hint}</Text>
                </View>
                {disabled ? (
                  <Text style={[type.small, { color: color.locked }]}>Coming soon</Text>
                ) : (
                  <Text style={[type.small, { color: color.inkSoft }]}>
                    {questionCount} question{questionCount === 1 ? '' : 's'}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
