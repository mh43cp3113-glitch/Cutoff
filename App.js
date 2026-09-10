import React from 'react';
import { Platform, View } from 'react-native';
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

// On the web the app runs as a responsive site: full-bleed on a phone browser,
// and centred in a phone-width column on a wider screen so the layout — tuned
// for a handset — never stretches awkwardly across a desktop monitor.
function AppFrame({ children }) {
  const { color, isDark } = useTheme();
  if (Platform.OS !== 'web') return children;
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#05080A' : '#DCE1DC',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 480,
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
        <AppFrame>
        <NavigationContainer theme={navTheme}>
          <RootNavigator />
        </NavigationContainer>
        </AppFrame>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
