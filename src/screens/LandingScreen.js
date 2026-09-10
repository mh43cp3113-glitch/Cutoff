import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../components/Logo';
import { useTheme } from '../theme';

const HIGHLIGHTS = [
  ['5 tracks', 'Entrance, School, Engineering, Government exams and more'],
  ['Adaptive practice', 'Weighted toward the topics you actually get wrong'],
  ['Timed random tests', 'A mixed mock pulled from every subject in an exam'],
];

export default function LandingScreen({ navigation }) {
  const { color, type, space, radius, shadow } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: space.md,
          paddingTop: space.xl,
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Logo size="lg" />
          <Text style={[type.display, { marginTop: space.lg }]}>
            Practice that gets{'\n'}sharper as you go.
          </Text>
          <Text style={[type.body, { marginTop: space.sm, color: color.inkSoft }]}>
            Question sets for India's competitive exams, weighted toward what
            you personally get wrong — not another shuffle-and-hope quiz app.
          </Text>

          <View style={{ marginTop: space.xl, gap: space.sm }}>
            {HIGHLIGHTS.map(([title, body]) => (
              <View
                key={title}
                style={{
                  backgroundColor: color.card,
                  borderWidth: 1,
                  borderColor: color.rule,
                  borderRadius: radius.lg,
                  padding: space.md,
                  ...shadow.card,
                }}
              >
                <Text style={[type.title, { fontSize: 17 }]}>{title}</Text>
                <Text style={[type.small, { marginTop: 2 }]}>{body}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ marginTop: space.xl }}>
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => ({
              backgroundColor: color.ink,
              borderRadius: radius.lg,
              padding: space.md,
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
              ...shadow.card,
            })}
          >
            <Text style={{ color: color.paper, fontWeight: '650', fontSize: 17 }}>
              Get started
            </Text>
          </Pressable>
          <Text style={[type.small, { marginTop: space.sm, textAlign: 'center' }]}>
            Just a name — no account, no password.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
