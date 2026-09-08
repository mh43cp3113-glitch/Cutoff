import React, { useLayoutEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getTrack,
  getSubject,
  countByTopic,
  buildTopicQuiz,
  buildAdaptiveQuiz,
} from '../lib/quiz';
import { useProgress } from '../lib/ProgressContext';
import { color, type, space, radius } from '../theme';

export default function SubjectScreen({ route, navigation }) {
  const { trackId, examId, subjectId } = route.params;
  const subject = getSubject(trackId, examId, subjectId);
  const exam = getTrack(trackId)?.exams.find((e) => e.id === examId);
  const { topicStats: stats, reportedIds } = useProgress();

  useLayoutEffect(() => {
    if (subject) {
      navigation.setOptions({
        title: exam ? `${exam.name} · ${subject.name}` : subject.name,
      });
    }
  }, [navigation, exam, subject]);

  const startTopic = (topicId, topicName) => {
    const questionList = buildTopicQuiz(topicId, 5, reportedIds);
    if (!questionList.length) return;
    navigation.navigate('Quiz', { questionList, label: topicName });
  };

  const startMixed = () => {
    const questionList = buildAdaptiveQuiz(subjectId, 8, stats, reportedIds);
    if (!questionList.length) return;
    navigation.navigate('Quiz', { questionList, label: 'Mixed practice' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <Pressable
          onPress={startMixed}
          style={({ pressed }) => ({
            backgroundColor: color.ink,
            borderRadius: radius.md,
            padding: space.md,
            marginBottom: space.lg,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontSize: 17, fontWeight: '650', color: color.paper }}>
            Mixed practice
          </Text>
          <Text style={{ fontSize: 13, color: color.rule, marginTop: 2 }}>
            8 questions, weighted towards your weaker topics
          </Text>
        </Pressable>

        <Text style={[type.small, { marginBottom: space.sm }]}>By topic</Text>

        {subject.topics.map((topic) => {
          const count = countByTopic(topic.id, reportedIds);
          const stat = stats[topic.id];
          const accuracy =
            stat && stat.attempted > 0
              ? Math.round((stat.correct / stat.attempted) * 100)
              : null;

          return (
            <Pressable
              key={topic.id}
              disabled={count === 0}
              onPress={() => startTopic(topic.id, topic.name)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: space.md,
                borderBottomWidth: 1,
                borderBottomColor: color.rule,
                opacity: count === 0 ? 0.45 : pressed ? 0.6 : 1,
              })}
            >
              <View style={{ flex: 1 }}>
                <Text style={[type.body, { fontWeight: '500' }]}>{topic.name}</Text>
                <Text style={[type.small, { marginTop: 2 }]}>
                  {count === 0 ? 'No questions yet' : `${count} question${count > 1 ? 's' : ''}`}
                  {accuracy !== null ? ` · ${accuracy}% correct so far` : ''}
                </Text>
              </View>
              {accuracy !== null && accuracy < 60 && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: color.flag,
                  }}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
