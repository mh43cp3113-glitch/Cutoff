import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProgress } from '../lib/ProgressContext';
import { getQuestionById } from '../lib/quiz';
import { useTheme } from '../theme';

// Progress only exists inside the signed-in half of the app (see App.js's
// RootNavigator), so `signedIn` is always true here — there's no "not signed
// in" state to render. The null check is just a defensive guard against the
// one-frame gap while a sign-out is propagating and this screen is unmounting.
function AccountSection() {
  const { color, type, space, radius, shadow } = useTheme();
  const { user, displayName, signOutUser, signOutGuest } = useProgress();

  if (!displayName) return null;

  const isGuest = !user;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: color.card,
        borderWidth: 1,
        borderColor: color.rule,
        borderRadius: radius.lg,
        padding: space.md,
        marginBottom: space.lg,
        ...shadow.card,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.pill,
          backgroundColor: color.accent,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: space.md,
        }}
      >
        <Text style={{ color: color.paper, fontWeight: '700', fontSize: 16 }}>
          {displayName.trim().charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { fontWeight: '600' }]}>{displayName}</Text>
        <Text style={[type.small, { marginTop: 1 }]}>
          {isGuest ? 'Guest — signed in on this device only' : 'Signed in with email'}
        </Text>
      </View>
      <Pressable onPress={isGuest ? signOutGuest : signOutUser} hitSlop={8}>
        <Text style={[type.small, { color: color.wrong, fontWeight: '700' }]}>Log out</Text>
      </Pressable>
    </View>
  );
}

function Stat({ value, label }) {
  const { color, type } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: color.accent, letterSpacing: -0.4 }}>
        {value}
      </Text>
      <Text style={[type.small, { marginTop: 2 }]}>{label}</Text>
    </View>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function ProgressScreen({ navigation }) {
  const { color, type, space, radius, shadow } = useTheme();
  const { topicStats, attempts, streak, reports, clearAll } = useProgress();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const totals = Object.values(topicStats).reduce(
    (acc, s) => ({ attempted: acc.attempted + s.attempted, correct: acc.correct + s.correct }),
    { attempted: 0, correct: 0 }
  );
  const totalAnswered = totals.attempted;
  const totalCorrect = totals.correct;
  const overall = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;

  const reportedList = Object.entries(reports);
  const hasProgress = attempts.length > 0 || totalAnswered > 0 || reportedList.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: space.md, paddingBottom: space.xl }}>
        <AccountSection />

        <View
          style={{
            flexDirection: 'row',
            gap: space.md,
            backgroundColor: color.card,
            borderWidth: 1,
            borderColor: color.rule,
            borderRadius: radius.lg,
            padding: space.md,
            ...shadow.card,
          }}
        >
          <Stat value={streak.current} label="day streak" />
          <Stat value={streak.longest} label="longest streak" />
          <Stat value={attempts.length} label={attempts.length === 1 ? 'quiz done' : 'quizzes done'} />
        </View>

        {!hasProgress && (
          <Text style={[type.body, { marginTop: space.lg, color: color.inkSoft }]}>
            No practice yet. Finish a quiz and your topic accuracy, streak and history show up here.
          </Text>
        )}

        {overall !== null && (
          <View style={{ marginTop: space.lg }}>
            <Text style={[type.small, { marginBottom: space.xs }]}>
              Overall · {totalCorrect}/{totalAnswered} correct
            </Text>
            <View
              style={{
                height: 8,
                borderRadius: 2,
                backgroundColor: color.rule,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${overall}%`,
                  height: 8,
                  backgroundColor: overall < 60 ? color.flag : color.correct,
                }}
              />
            </View>
          </View>
        )}

        {attempts.length > 0 && (
          <View style={{ marginTop: space.lg }}>
            <Text style={[type.small, { marginBottom: space.sm }]}>Recent quizzes</Text>
            {attempts.slice(0, 15).map((a) => (
              <View
                key={a.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: space.sm,
                  borderBottomWidth: 1,
                  borderBottomColor: color.rule,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontWeight: '500' }]}>{a.label}</Text>
                  <Text style={[type.small, { marginTop: 2 }]}>
                    {formatDate(a.completed_at)}
                    {a.correctCount !== undefined ? ` · ${a.correctCount}/${a.total} correct` : ''}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '600',
                    color: color.ink,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {a.score}/{a.max}
                </Text>
              </View>
            ))}
          </View>
        )}

        {reportedList.length > 0 && (
          <View style={{ marginTop: space.lg }}>
            <Text style={[type.small, { marginBottom: space.sm }]}>
              Reported questions ({reportedList.length})
            </Text>
            <Text style={[type.small, { marginBottom: space.sm, color: color.inkSoft }]}>
              These are held on this device and left out of your quizzes until they're reviewed.
            </Text>
            {reportedList.map(([id, r]) => {
              const question = getQuestionById(id);
              return (
                <View
                  key={id}
                  style={{
                    paddingVertical: space.sm,
                    borderBottomWidth: 1,
                    borderBottomColor: color.rule,
                  }}
                >
                  <Text
                    style={[type.small, { color: color.ink, fontWeight: '500' }]}
                    numberOfLines={2}
                  >
                    {question ? question.body : `Question ${id} (no longer in the bank)`}
                  </Text>
                  <Text style={[type.small, { marginTop: 2 }]}>{(r.reasons || []).join(', ')}</Text>
                </View>
              );
            })}
          </View>
        )}

        {hasProgress && (
          <View style={{ marginTop: space.xl }}>
            {confirmingReset ? (
              <View style={{ gap: space.sm }}>
                <Text style={[type.small, { color: color.wrong }]}>
                  This clears your streak, topic accuracy, quiz history and reports on this device.
                  It can't be undone.
                </Text>
                <View style={{ flexDirection: 'row', gap: space.sm }}>
                  <Pressable
                    onPress={() => {
                      clearAll();
                      setConfirmingReset(false);
                    }}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: space.md,
                      borderRadius: radius.sm,
                      backgroundColor: color.wrong,
                    }}
                  >
                    <Text style={{ color: color.paper, fontWeight: '600' }}>Reset everything</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setConfirmingReset(false)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: space.md,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderColor: color.rule,
                    }}
                  >
                    <Text style={{ color: color.ink, fontWeight: '600' }}>Keep it</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable onPress={() => setConfirmingReset(true)} hitSlop={6}>
                <Text style={[type.small, { color: color.wrong }]}>Reset progress</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
