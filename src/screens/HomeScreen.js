import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTracks } from '../lib/quiz';
import { useProgress } from '../lib/ProgressContext';
import { color, type, space, radius } from '../theme';

export default function HomeScreen({ navigation }) {
  const tracks = getTracks();
  const { streak, attempts, ready } = useProgress();

  const subtitle = !ready
    ? 'Loading your progress'
    : streak.current > 0
    ? `${streak.current} day${streak.current > 1 ? 's' : ''} in a row · ${attempts.length} quiz${
        attempts.length === 1 ? '' : 'zes'
      } finished`
    : 'Pick a track to begin. More open up as questions are added.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <Text style={[type.display, { marginTop: space.md }]}>Practice</Text>
        <Text style={[type.small, { marginTop: space.xs, marginBottom: space.lg }]}>
          {subtitle}
        </Text>

        {tracks.map((track) => (
          <Pressable
            key={track.id}
            disabled={track.locked}
            onPress={() =>
              navigation.navigate('Subject', {
                trackId: 'entrance',
                examId: 'jee_main',
                subjectId: 'physics',
              })
            }
            style={({ pressed }) => ({
              backgroundColor: color.card,
              borderWidth: 1,
              borderColor: color.rule,
              borderRadius: radius.md,
              padding: space.md,
              marginBottom: space.sm,
              opacity: track.locked ? 0.55 : pressed ? 0.7 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[type.title, track.locked && { color: color.locked }]}>
                  {track.name}
                </Text>
                <Text style={[type.small, { marginTop: 2 }]}>{track.hint}</Text>
              </View>
              {track.locked && (
                <Text style={[type.small, { color: color.locked }]}>Coming soon</Text>
              )}
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
