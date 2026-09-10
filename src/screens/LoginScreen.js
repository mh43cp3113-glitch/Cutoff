import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Logo from '../components/Logo';
import { useProgress } from '../lib/ProgressContext';
import { useTheme } from '../theme';

// Signing in only sets a display name on this device — see ProgressContext
// and storage.js. There's no password, no verification, and (deliberately,
// per direction received) no Google/OAuth option. Once signIn() succeeds,
// `profile` becomes non-null and App.js's RootNavigator swaps the whole stack
// over to the main app on its own — this screen doesn't navigate anywhere
// itself on success.
export default function LoginScreen({ navigation }) {
  const { color, type, space, radius } = useTheme();
  const { signIn } = useProgress();
  const [name, setName] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    signIn(name);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ padding: space.md }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
            <Ionicons name="chevron-back" size={24} color={color.inkSoft} />
          </Pressable>
        </View>

        <View style={{ flex: 1, padding: space.md, justifyContent: 'center' }}>
          <Logo size="sm" muted />
          <Text style={[type.display, { marginTop: space.md }]}>What's your name?</Text>
          <Text style={[type.small, { marginTop: space.xs, marginBottom: space.lg }]}>
            Just a name for this device — nothing syncs anywhere yet.
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={color.locked}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
            style={{
              borderWidth: 1,
              borderColor: color.rule,
              borderRadius: radius.sm,
              backgroundColor: color.card,
              padding: space.md,
              fontSize: 18,
              color: color.ink,
            }}
          />

          <Pressable
            disabled={!name.trim()}
            onPress={submit}
            style={{
              marginTop: space.md,
              backgroundColor: color.accent,
              borderRadius: radius.lg,
              padding: space.md,
              alignItems: 'center',
              opacity: name.trim() ? 1 : 0.4,
            }}
          >
            <Text style={{ color: color.paper, fontWeight: '650', fontSize: 16 }}>
              Continue
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
