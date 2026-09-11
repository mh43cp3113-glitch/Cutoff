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

// The app's only unauthenticated screen — there is no Landing page and no
// guest mode (both removed per direction). Everyone either has a real
// Firebase account already, or creates one here (email/password or Google).
export default function LoginScreen() {
  const { color, type, space, radius, shadow } = useTheme();
  const { signUpWithEmail, signInWithEmail, signInWithGoogle, authErrorMessage } = useProgress();

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const submitGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = authErrorMessage(err);
      if (message) setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.paper }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: space.md, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <Logo size="lg" />
          <Text style={[type.display, { marginTop: space.md }]}>
            {mode === 'signup' ? 'Create an account' : 'Log in'}
          </Text>
          {mode === 'signup' && (
            <Text style={[type.small, { marginTop: space.xs }]}>
              Your account is real and saved — but your quiz progress and history still
              stay on this device for now, until that syncs too.
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

          <Pressable
            disabled={busy}
            onPress={submitGoogle}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: color.card,
              borderWidth: 1,
              borderColor: color.rule,
              borderRadius: radius.lg,
              padding: space.md,
              marginBottom: space.md,
              opacity: busy ? 0.6 : 1,
              ...shadow.card,
            }}
          >
            <Ionicons name="logo-google" size={20} color={color.ink} style={{ marginRight: space.sm }} />
            <Text style={{ color: color.ink, fontWeight: '650', fontSize: 16 }}>
              {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
            </Text>
          </Pressable>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: space.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: color.rule }} />
            <Text style={[type.small, { marginHorizontal: space.sm }]}>or with email</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: color.rule }} />
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
