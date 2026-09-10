import React, { useState } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ExamPickerScreen from './src/screens/ExamPickerScreen';
import SubjectPickerScreen from './src/screens/SubjectPickerScreen';
import SubjectScreen from './src/screens/SubjectScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import { ProgressProvider, useProgress } from './src/lib/ProgressContext';
import { useTheme } from './src/theme';

const Stack = createNativeStackNavigator();
const DESKTOP_BREAKPOINT = 820;

// Screens with their own desktop layout (a real multi-column/wide design, not
// just a stretched phone screen) get the wide frame on a desktop-width
// browser. Everything else — Quiz above all, mid-question is no time to be
// redesigning layout — keeps the phone-width column at any viewport size.
const WIDE_SCREENS = new Set(['Landing', 'Home']);

function activeRouteName(state) {
  if (!state) return undefined;
  const route = state.routes[state.index];
  return route.state ? activeRouteName(route.state) : route.name;
}

// On the web the app runs as a responsive site: full-bleed on a phone
// browser, and — for the screens built for it — a real wide desktop layout
// on a larger one. Everything else still centres in a phone-width column so
// a mobile-tuned layout never stretches awkwardly across a desktop monitor.
function AppFrame({ children, routeName }) {
  const { color, isDark } = useTheme();
  const { width } = useWindowDimensions();
  if (Platform.OS !== 'web') return children;

  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const wide = isDesktop && WIDE_SCREENS.has(routeName);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#120C08' : '#E9DFCE',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: wide ? 1100 : 480,
          backgroundColor: color.paper,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: color.rule,
        }}
      >
        {children}
      </View>
    </View>
  );
}

// There is no real authentication (see ProgressContext / storage.js) — `profile`
// is just a device-local display name. But it still gates the app: nobody
// reaches Home until they've named themselves. Swapping which screens exist
// based on `profile` (rather than always mounting everything and redirecting)
// is the pattern React Navigation itself recommends for an auth split — it
// resets the stack for free on both sign-in and sign-out, no manual reset.
function RootNavigator() {
  const { color } = useTheme();
  const { ready, profile } = useProgress();

  if (!ready) {
    // Blank instead of flashing Landing then Home while storage hydrates.
    return <View style={{ flex: 1, backgroundColor: color.paper }} />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: 17, fontWeight: '600' },
        contentStyle: { backgroundColor: color.paper },
      }}
    >
      {!profile ? (
        <>
          <Stack.Screen
            name="Landing"
            component={LandingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ExamPicker"
            component={ExamPickerScreen}
            options={{ title: 'Choose an exam' }}
          />
          <Stack.Screen
            name="SubjectPicker"
            component={SubjectPickerScreen}
            options={{ title: 'Choose a subject' }}
          />
          <Stack.Screen
            name="Subject"
            component={SubjectScreen}
            options={{ title: 'Practice' }}
          />
          <Stack.Screen
            name="Quiz"
            component={QuizScreen}
            options={({ route }) => ({ title: route.params.label, headerBackTitle: 'Exit' })}
          />
          <Stack.Screen
            name="Result"
            component={ResultScreen}
            options={{ title: 'Your result', headerBackVisible: false }}
          />
          <Stack.Screen
            name="Progress"
            component={ProgressScreen}
            options={{ title: 'Your progress' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const { color, isDark } = useTheme();
  const [routeName, setRouteName] = useState('Landing');

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: color.paper,
      card: color.paper,
      text: color.ink,
      border: color.rule,
      primary: color.ink,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ProgressProvider>
        <AppFrame routeName={routeName}>
        <NavigationContainer
          theme={navTheme}
          onStateChange={(state) => setRouteName(activeRouteName(state))}
        >
          <RootNavigator />
        </NavigationContainer>
        </AppFrame>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
