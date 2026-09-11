import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import Logo from '../components/Logo';
import { useProgress } from '../lib/ProgressContext';
import { useTheme } from '../theme';

// Three modes on one screen: real sign up, real log in (both backed by
// Firebase Auth — see ProgressContext's signUpWithEmail/signInWithEmail), and
// a guest fallback (just a device-local name, no account at all). Guest mode
// stays deliberately one tap away, not removed — forcing a real signup before
// the first quiz is a known retention killer (see CLAUDE.md's Product notes).
// No Google/OAuth button here: it needs real client IDs from a Google
// Cloud/Firebase project, which don't exist yet — see CLAUDE.md.
export default function LoginScreen({ navigation }) {
  const { color, type, space, radius } = useTheme();
  const { signUpWithEmail, signInWithEmail, signInGuest, authErrorMessage } = useProgress();

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'guest'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submitAuth = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter both an email and a password.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      // On success, ProgressContext's `user` becomes non-null and App.js's
      // RootNavigator swaps the stack over on its own — nothing to navigate.
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const submitGuest = () => {
    if (!guestName.trim()) return;
    signInGuest(guestName);
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

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: space.md, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Logo size="sm" muted />

          {mode !== 'guest' ? (
            <>
              <Text style={[type.display, { marginTop: space.md }]}>
                {mode === 'signup' ? 'Create an account' : 'Log in'}
              </Text>
              {mode === 'signup' && (
                <Text style={[type.small, { marginTop: space.xs }]}>
                  Your account is real and saved — but your quiz progress and history still
                  stay on this device for now, same as a guest, until that syncs too.
                </Text>
              )}

              <View style={{ flexDirection: 'row', marginTop: space.md, marginBottom: space.lg, gap: space.sm }}>
                {['login', 'signup'].map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => {
                      setMode(m);
                      setError(null);
                    }}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingVertical: space.sm,
                      borderRadius: radius.pill,
                      backgroundColor: mode === m ? color.accent : color.card,
                      borderWidth: mode === m ? 0 : 1,
                      borderColor: color.rule,
                    }}
                  >
                    <Text
                      style={{
                        fontWeight: '650',
                        color: mode === m ? color.paper : color.inkSoft,
                      }}
                    >
                      {m === 'login' ? 'Log In' : 'Sign Up'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {mode === 'signup' && (
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={color.locked}
                  returnKeyType="next"
                  style={{
                    borderWidth: 1,
                    borderColor: color.rule,
                    borderRadius: radius.sm,
                    backgroundColor: color.card,
                    padding: space.md,
                    fontSize: 16,
                    color: color.ink,
                    marginBottom: space.sm,
                  }}
                />
              )}

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={color.locked}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                style={{
                  borderWidth: 1,
                  borderColor: color.rule,
                  borderRadius: radius.sm,
                  backgroundColor: color.card,
                  padding: space.md,
                  fontSize: 16,
                  color: color.ink,
                  marginBottom: space.sm,
                }}
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={color.locked}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={submitAuth}
                style={{
                  borderWidth: 1,
                  borderColor: color.rule,
                  borderRadius: radius.sm,
                  backgroundColor: color.card,
                  padding: space.md,
                  fontSize: 16,
                  color: color.ink,
                }}
              />

              {error && (
                <Text style={[type.small, { color: color.wrong, marginTop: space.sm }]}>
                  {error}
                </Text>
              )}

              <Pressable
                disabled={busy}
                onPress={submitAuth}
                style={{
                  marginTop: space.md,
                  backgroundColor: color.accent,
                  borderRadius: radius.lg,
                  padding: space.md,
                  alignItems: 'center',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                {busy ? (
                  <ActivityIndicator color={color.paper} />
                ) : (
                  <Text style={{ color: color.paper, fontWeight: '650', fontSize: 16 }}>
                    {mode === 'signup' ? 'Create account' : 'Log in'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode('guest');
                  setError(null);
                }}
                hitSlop={8}
                style={{ marginTop: space.lg, alignItems: 'center' }}
              >
                <Text style={[type.small, { color: color.inkSoft }]}>
                  Or continue as a guest instead
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[type.display, { marginTop: space.md }]}>What's your name?</Text>
              <Text style={[type.small, { marginTop: space.xs, marginBottom: space.lg }]}>
                Just a name for this device — no account, nothing syncs anywhere.
              </Text>

              <TextInput
                value={guestName}
                onChangeText={setGuestName}
                placeholder="Your name"
                placeholderTextColor={color.locked}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={submitGuest}
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
                disabled={!guestName.trim()}
                onPress={submitGuest}
                style={{
                  marginTop: space.md,
                  backgroundColor: color.accent,
                  borderRadius: radius.lg,
                  padding: space.md,
                  alignItems: 'center',
                  opacity: guestName.trim() ? 1 : 0.4,
                }}
              >
                <Text style={{ color: color.paper, fontWeight: '650', fontSize: 16 }}>
                  Continue
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setMode('login')}
                hitSlop={8}
                style={{ marginTop: space.lg, alignItems: 'center' }}
              >
                <Text style={[type.small, { color: color.inkSoft }]}>
                  Or log in / create an account instead
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
