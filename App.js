import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import SubjectScreen from './src/screens/SubjectScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultScreen from './src/screens/ResultScreen';
import { ProgressProvider } from './src/lib/ProgressContext';
import { color } from './src/theme';

const Stack = createNativeStackNavigator();

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

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ProgressProvider>
        <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerShadowVisible: false,
            headerTitleStyle: { fontSize: 17, fontWeight: '600' },
            contentStyle: { backgroundColor: color.paper },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Subject"
            component={SubjectScreen}
            options={{ title: 'JEE Main · Physics' }}
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
        </Stack.Navigator>
        </NavigationContainer>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
