import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTracks, getPlayableExams } from '../lib/quiz';
import { useProgress } from '../lib/ProgressContext';
import Logo from '../components/Logo';
import { color, type, space, radius, shadow } from '../theme';
import packageJson from '../../package.json';

// category (track) -> exam -> subject. Home only makes the first choice; it
// hands off to ExamPicker / SubjectPicker for the rest, skipping a step only
// when there's genuinely one option behind it.
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

function TrackCard({ track, open, onPress }) {
  return (
    <Pressable
      disabled={!open}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={track.name + (open ? '' : ', coming soon')}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: open ? color.card : 'transparent',
        borderWidth: 1,
        borderColor: open ? color.rule : 'transparent',
        borderRadius: radius.lg,
        paddingVertical: space.md,
        paddingHorizontal: space.md,
        marginBottom: space.sm,
        opacity: open ? (pressed ? 0.7 : 1) : 0.5,
        ...(open ? shadow.card : null),
      })}
    >
      {open && (
        <View
          style={{
            width: 3,
            alignSelf: 'stretch',
            borderRadius: 2,
            backgroundColor: color.ink,
            marginRight: space.md,
          }}
        />
      )}
      <View style={{ flex: 1 }}>
        <Text style={[type.title, !open && { color: color.locked }]}>{track.name}</Text>
        <Text style={[type.small, { marginTop: 2 }]}>{track.hint}</Text>
      </View>
      {open ? (
        <Text style={{ fontSize: 22, color: color.inkSoft, marginLeft: space.sm }}>›</Text>
      ) : (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: color.locked,
            marginLeft: space.sm,
          }}
        >
          Soon
        </Text>
      )}
    </Pressable>
  );
}

export default function HomeScreen({ navigation }) {
  const tracks = getTracks();
  const { streak, attempts, ready } = useProgress();

  const withOpen = tracks.map((t) => ({ track: t, open: getPlayableExams(t.id).length > 0 }));
  const openTracks = withOpen.filter((t) => t.open);
  const lockedTracks = withOpen.filter((t) => !t.open);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        {/* Brand header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: space.sm,
          }}
        >
          <Logo size="lg" />
          <Pressable
            onPress={() => navigation.navigate('Progress')}
            accessibilityRole="button"
            accessibilityLabel="Your progress"
            hitSlop={8}
            style={({ pressed }) => ({
              backgroundColor: color.ink,
              borderRadius: radius.pill,
              paddingVertical: 7,
              paddingHorizontal: 14,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: color.paper }}>
              {ready && streak.current > 0 ? `${streak.current}-day streak` : 'Progress'}
            </Text>
          </Pressable>
        </View>

        {/* Page heading */}
        <Text style={[type.display, { marginTop: space.lg }]}>Practice</Text>
        <Text style={[type.small, { marginTop: space.xs, marginBottom: space.lg }]}>
          {ready && attempts.length > 0
            ? `${attempts.length} quiz${attempts.length === 1 ? '' : 'zes'} done · pick up where you left off`
            : 'Choose a category, then the exam and subject you want to practise.'}
        </Text>

        {/* Unlocked tracks */}
        {openTracks.map(({ track, open }) => (
          <TrackCard
            key={track.id}
            track={track}
            open={open}
            onPress={() => routeIntoTrack(navigation, track.id)}
          />
        ))}

        {/* Locked tracks */}
        {lockedTracks.length > 0 && (
          <>
            <Text
              style={[
                type.small,
                {
                  marginTop: space.lg,
                  marginBottom: space.sm,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  fontSize: 11,
                  fontWeight: '700',
                },
              ]}
            >
              Coming soon
            </Text>
            {lockedTracks.map(({ track, open }) => (
              <TrackCard key={track.id} track={track} open={open} onPress={() => {}} />
            ))}
          </>
        )}

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: space.xl, gap: space.xs }}>
          <Logo size="sm" muted />
          <Text style={[type.small, { color: color.locked }]}>
            v{packageJson.version} · practice with a purpose
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
