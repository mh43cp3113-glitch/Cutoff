import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrack, getPlayableSubjects } from '../lib/quiz';
import { color, type, space, radius } from '../theme';

// Shown only when a track has more than one subject to practise. With the seed
// content (JEE Main Physics alone) Home skips straight past this, but the flow is
// here for when Chemistry, Maths, NEET and the rest come online.
export default function SubjectPickerScreen({ route, navigation }) {
  const { trackId } = route.params;
  const track = getTrack(trackId);
  const options = getPlayableSubjects(trackId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <Text style={[type.small, { marginBottom: space.sm }]}>
          {track?.name} · choose a subject
        </Text>

        {options.map((opt) => (
          <Pressable
            key={`${opt.examId}/${opt.subjectId}`}
            onPress={() =>
              navigation.navigate('Subject', {
                trackId: opt.trackId,
                examId: opt.examId,
                subjectId: opt.subjectId,
              })
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
            <Text style={type.title}>{opt.subjectName}</Text>
            <Text style={[type.small, { marginTop: 2 }]}>
              {opt.examName} · {opt.count} question{opt.count === 1 ? '' : 's'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
