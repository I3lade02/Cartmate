import { Alert, Pressable, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { logoutUser } from "../../services/authServices";
import {
  requestListNotificationPermission,
  supportsListNotifications,
} from "../../services/notificationServices";
import { useAuthStore } from "../../store/authStore";
import { useThemeStore } from "../../store/themeStore";
import {
  DEFAULT_THEME_ID,
  themeOptions,
  type ThemeId,
} from "../../theme/theme";

export function SettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const theme = useThemeStore((state) => state.theme);
  const themeId = useThemeStore((state) => state.themeId);
  const setThemeId = useThemeStore((state) => state.setThemeId);
  const colors = theme.colors;

  async function handleLogout() {
    try {
      await Haptics.selectionAsync();
      await logoutUser();
    } catch (error) {
      console.log(error);
      Alert.alert("Logout failed", "Something went wrong.");
    }
  }

  async function handleClearPreferences() {
    try {
      await AsyncStorage.removeItem("cartmate-preferences");
      await AsyncStorage.removeItem("cartmate-theme");
      await setThemeId(DEFAULT_THEME_ID);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
      Alert.alert("Preferences cleared", "Local app preferences were reset.");
    } catch (error) {
      console.log(error);
      Alert.alert("Clear failed", "Could not clear local preferences.");
    }
  }

  async function handleEnableNotifications() {
    try {
      const granted = await requestListNotificationPermission();

      if (granted) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        Alert.alert(
          "Notifications enabled",
          "CartMate can now alert you when other members add items."
        );
      } else {
        const message = supportsListNotifications()
          ? "You can enable notifications for CartMate in your phone settings."
          : "Expo Go on Android does not support this notification module. Use a development build to test phone notifications.";

        Alert.alert("Notifications disabled", message);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Notifications unavailable", "Could not enable alerts.");
    }
  }

  async function handleSelectTheme(nextThemeId: ThemeId) {
    if (nextThemeId === themeId) {
      return;
    }

    try {
      await Haptics.selectionAsync();
      await setThemeId(nextThemeId);
    } catch (error) {
      console.log(error);
      Alert.alert("Theme unavailable", "Could not save this theme.");
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingHorizontal: 24,
        paddingVertical: 32,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: "700" }}>
        Settings
      </Text>

      <View
        style={{
          marginTop: 32,
          padding: 20,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ color: colors.mutedText }}>Signed in as</Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            fontWeight: "700",
            marginTop: 4,
          }}
        >
          {user?.email}
        </Text>
      </View>

      <View
        style={{
          marginTop: 16,
          padding: 20,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>
          App theme
        </Text>
        <Text style={{ color: colors.mutedText, marginTop: 6 }}>
          Choose how CartMate looks on this device.
        </Text>

        <View style={{ gap: 10, marginTop: 16 }}>
          {themeOptions.map((option) => {
            const isSelected = option.id === themeId;

            return (
              <Pressable
                key={option.id}
                style={{
                  padding: 14,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: isSelected
                    ? colors.primary
                    : colors.border,
                  backgroundColor: isSelected
                    ? colors.primarySoft
                    : colors.surfaceMuted,
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => handleSelectTheme(option.id)}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: isSelected
                          ? colors.primarySoftText
                          : colors.text,
                        fontSize: 16,
                        fontWeight: "700",
                      }}
                    >
                      {option.name}
                    </Text>
                    <Text
                      style={{
                        color: isSelected
                          ? colors.primarySoftText
                          : colors.mutedText,
                        marginTop: 4,
                        lineHeight: 19,
                      }}
                    >
                      {option.description}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", gap: 5 }}>
                    <View
                      style={{
                        width: 16,
                        height: 28,
                        borderTopLeftRadius: 999,
                        borderBottomLeftRadius: 999,
                        backgroundColor: option.colors.background,
                      }}
                    />
                    <View
                      style={{
                        width: 16,
                        height: 28,
                        backgroundColor: option.colors.surface,
                      }}
                    />
                    <View
                      style={{
                        width: 16,
                        height: 28,
                        borderTopRightRadius: 999,
                        borderBottomRightRadius: 999,
                        backgroundColor: option.colors.primary,
                      }}
                    />
                  </View>
                </View>

                {isSelected && (
                  <Text
                    style={{
                      color: colors.primarySoftText,
                      marginTop: 10,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    ACTIVE
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable
        style={{
          minHeight: 52,
          marginTop: 16,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.borderStrong,
          backgroundColor: colors.surface,
        }}
        accessibilityRole="button"
        onPress={handleClearPreferences}
      >
        <Text style={{ color: colors.text, fontWeight: "700" }}>
          Clear local preferences
        </Text>
      </Pressable>

      <Pressable
        style={{
          minHeight: 52,
          marginTop: 16,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.primary,
          backgroundColor: colors.primarySoft,
        }}
        accessibilityRole="button"
        onPress={handleEnableNotifications}
      >
        <Text style={{ color: colors.primarySoftText, fontWeight: "700" }}>
          Enable list notifications
        </Text>
      </Pressable>

      <Pressable
        style={{
          minHeight: 56,
          marginTop: 24,
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 16,
          backgroundColor: colors.danger,
        }}
        accessibilityRole="button"
        onPress={handleLogout}
      >
        <Text style={{ color: colors.dangerButtonText, fontWeight: "700" }}>
          Log out
        </Text>
      </Pressable>
    </View>
  );
}
