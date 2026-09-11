import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This config identifies the Firebase project to Firebase's servers — it is
// not a secret. Real access control comes from Firebase Security Rules, not
// from hiding this object, so it's safe to commit. (See Firebase's own docs
// on this if it looks alarming: "API keys for Firebase services are ok to
// include in code".)
const firebaseConfig = {
  apiKey: 'AIzaSyAfvNpkTMS5Gpn5lAxA9ViZwphZZybdkIk',
  authDomain: 'cutoff-3113.firebaseapp.com',
  projectId: 'cutoff-3113',
  storageBucket: 'cutoff-3113.firebasestorage.app',
  messagingSenderId: '60508394476',
  appId: '1:60508394476:web:b302e2612300cc08e4a6c9',
  measurementId: 'G-4HC8SM12F4',
};

// Guard against re-initializing on Fast Refresh / hot reload.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth state must be persisted explicitly through AsyncStorage on native —
// the browser's own persistence (used automatically by getAuth() on web)
// doesn't exist there. This native path is written to the SDK's documented
// pattern but has NOT been verified on a real device or in Expo Go — this
// project's native builds have never been run outside a web build so far
// (see CLAUDE.md). Test on-device before relying on session persistence
// surviving an app restart on native.
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    // initializeAuth throws if called twice (e.g. Fast Refresh) — fall back
    // to the already-initialized instance instead of crashing.
    auth = getAuth(app);
  }
}

export { auth };
export default app;
