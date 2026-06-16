import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import type { Auth, Persistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

type PersistenceValue = Record<string, unknown> | string;

type AsyncStorageAuthPersistence = Persistence & {
  _isAvailable: () => Promise<boolean>;
  _set: (key: string, value: PersistenceValue) => Promise<void>;
  _get: <T extends PersistenceValue>(key: string) => Promise<T | null>;
  _remove: (key: string) => Promise<void>;
  _addListener: () => void;
  _removeListener: () => void;
};

const rawFirebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const missingFirebaseConfigKeys = Object.entries(rawFirebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const firebaseConfigError =
  missingFirebaseConfigKeys.length > 0
    ? `Missing Firebase config: ${missingFirebaseConfigKeys.join(", ")}`
    : null;

const firebaseConfig = {
  apiKey: rawFirebaseConfig.apiKey ?? "missing-api-key",
  authDomain: rawFirebaseConfig.authDomain ?? "missing.firebaseapp.com",
  projectId: rawFirebaseConfig.projectId ?? "missing-project",
  storageBucket: rawFirebaseConfig.storageBucket ?? "missing.appspot.com",
  messagingSenderId: rawFirebaseConfig.messagingSenderId ?? "000000000000",
  appId: rawFirebaseConfig.appId ?? "1:000000000000:web:missing",
};

const asyncStorageAuthPersistence: AsyncStorageAuthPersistence = {
  type: "LOCAL",
  async _isAvailable() {
    try {
      const testKey = "cartmate-firebase-auth-storage-test";
      await AsyncStorage.setItem(testKey, "1");
      await AsyncStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },
  async _set(key, value) {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  async _get(key) {
    const value = await AsyncStorage.getItem(key);

    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value as PersistenceValue;
    }
  },
  async _remove(key) {
    await AsyncStorage.removeItem(key);
  },
  _addListener() {
    // AsyncStorage does not provide cross-process storage events.
  },
  _removeListener() {
    // AsyncStorage does not provide cross-process storage events.
  },
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;

try {
  auth = initializeAuth(app, {
    persistence: asyncStorageAuthPersistence,
  });
} catch (error) {
  console.log("Firebase Auth already initialized or persistence unavailable", error);
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
