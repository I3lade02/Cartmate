import "react-native-gesture-handler";

import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firebaseConfigError } from "./src/lib/firebase";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { configureNotificationHandling } from "./src/services/notificationServices";
import { useAuthStore } from "./src/store/authStore";
import { useThemeStore } from "./src/store/themeStore";

export default function App() {
  const { setUser, setIsLoading } = useAuthStore();
  const loadThemePreference = useThemeStore((state) => state.loadThemePreference);
  const statusBarStyle = useThemeStore((state) => state.theme.statusBarStyle);

  useEffect(() => {
    configureNotificationHandling();
    loadThemePreference().catch((error) => console.log(error));
  }, [loadThemePreference]);

  useEffect(() => {
    if (firebaseConfigError) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email ?? "",
          displayName: firebaseUser.displayName ?? "",
        });
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return unsubscribe;
  }, [setUser, setIsLoading]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={statusBarStyle} />
      {firebaseConfigError ? (
        <FirebaseConfigErrorScreen message={firebaseConfigError} />
      ) : (
        <AppNavigator />
      )}
    </GestureHandlerRootView>
  );
}

function FirebaseConfigErrorScreen({ message }: { message: string }) {
  const colors = useThemeStore((state) => state.theme.colors);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: colors.background,
      }}
    >
      <View
        style={{
          padding: 22,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.dangerBorder,
          backgroundColor: colors.dangerSurface,
        }}
      >
        <Text style={{ color: colors.dangerText, fontSize: 22, fontWeight: "700" }}>
          App setup missing
        </Text>
        <Text style={{ color: colors.dangerText, marginTop: 10, lineHeight: 21 }}>
          This APK was built without the Firebase environment values it needs.
          Add the EXPO_PUBLIC_FIREBASE values to EAS, rebuild the APK, and
          install the new build.
        </Text>
        <Text style={{ color: colors.dangerText, marginTop: 14, lineHeight: 21 }}>
          {message}
        </Text>
      </View>
    </View>
  );
}
