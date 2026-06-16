import "react-native-gesture-handler";

import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/lib/firebase";
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
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
