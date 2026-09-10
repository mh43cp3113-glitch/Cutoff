import React from 'react';
import { View, Text, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Logo from '../components/Logo';
import { useTheme } from '../theme';

const HIGHLIGHTS = [
  ['layers-outline', '5 tracks', 'Entrance, School, Engineering, Government exams and more'],
  ['trending-up-outline', 'Adaptive practice', 'Weighted toward the topics you actually get wrong'],
  ['timer-outline', 'Timed random tests', 'A mixed mock pulled from every subject in an exam'],
];

const DESKTOP_BREAKPOINT = 820;

export default function LandingScreen({ navigation }) {
  const { color, type, space, radius, shadow, gradient } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
        }}
      >
        <LinearGradient colors={gradient} style={{ paddingBottom: space.xl }}>
          <View
            style={{
              padding: space.md,
              paddingTop: space.xl,
              maxWidth: isDesktop ? 960 : undefined,
              width: '100%',
              alignSelf: 'center',
            }}
          >
            <Logo size="lg" />
            <Text
              style={[
                type.display,
                { marginTop: space.lg, fontSize: isDesktop ? 40 : 30, maxWidth: isDesktop ? 560 : undefined },
              ]}
            >
              Practice that gets{'\n'}sharper as you go.
            </Text>
            <Text
              style={[
                type.body,
                { marginTop: space.sm, color: color.inkSoft, maxWidth: isDesktop ? 480 : undefined },
              ]}
            >
              Question sets for India's competitive exams, weighted toward what
              you personally get wrong — not another shuffle-and-hope quiz app.
            </Text>

            <View
              style={{
                marginTop: space.xl,
                gap: space.sm,
                flexDirection: isDesktop ? 'row' : 'column',
              }}
            >
              {HIGHLIGHTS.map(([icon, title, body]) => (
                <View
                  key={title}
                  style={{
                    flex: isDesktop ? 1 : undefined,
                    backgroundColor: color.card,
                    borderWidth: 1,
                    borderColor: color.rule,
                    borderRadius: radius.lg,
                    padding: space.md,
                    ...shadow.card,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: radius.md,
                      backgroundColor: color.accentSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: space.sm,
                    }}
                  >
                    <Ionicons name={icon} size={18} color={color.accent} />
                  </View>
                  <Text style={[type.title, { fontSize: 17 }]}>{title}</Text>
                  <Text style={[type.small, { marginTop: 2 }]}>{body}</Text>
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>

        <View
          style={{
            padding: space.md,
            marginTop: space.xl,
            maxWidth: isDesktop ? 400 : undefined,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={({ pressed }) => ({
              backgroundColor: color.accent,
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
