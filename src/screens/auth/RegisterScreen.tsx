import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/AppNavigator";
import { registerUser } from "../../services/authServices";
import { useThemeStore } from "../../store/themeStore";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const theme = useThemeStore((state) => state.theme);
  const colors = theme.colors;
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleRegister() {
    try {
      await Haptics.selectionAsync();

      if (!displayName.trim() || !email.trim() || !password.trim()) {
        Alert.alert("Missing info", "Please fill in all fields.");
        return;
      }

      if (password.length < 6) {
        Alert.alert("Weak password", "Password must have at least 6 characters.");
        return;
      }

      await registerUser(email.trim(), password, displayName.trim());
    } catch (error) {
      console.log(error);
      Alert.alert("Register failed", "Could not create your account.");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 24,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: colors.text, fontSize: 36, fontWeight: "700" }}>
            Create account
          </Text>
          <Text style={{ color: colors.mutedText, marginTop: 8, lineHeight: 21 }}>
            Join CartMate and tame the grocery chaos.
          </Text>
        </View>

        <View style={{ gap: 16 }}>
          <TextInput
            style={{
              minHeight: 56,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              backgroundColor: colors.surface,
            }}
            placeholder="Display name"
            placeholderTextColor={colors.subtleText}
            cursorColor={colors.primaryAccent}
            selectionColor={colors.primaryAccent}
            value={displayName}
            onChangeText={setDisplayName}
            returnKeyType="next"
          />

          <TextInput
            style={{
              minHeight: 56,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              backgroundColor: colors.surface,
            }}
            placeholder="Email"
            placeholderTextColor={colors.subtleText}
            cursorColor={colors.primaryAccent}
            selectionColor={colors.primaryAccent}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
          />

          <TextInput
            style={{
              minHeight: 56,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: colors.text,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 16,
              backgroundColor: colors.surface,
            }}
            placeholder="Password"
            placeholderTextColor={colors.subtleText}
            cursorColor={colors.primaryAccent}
            selectionColor={colors.primaryAccent}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />

          <Pressable
            style={{
              minHeight: 56,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 16,
              backgroundColor: colors.primary,
            }}
            accessibilityRole="button"
            onPress={handleRegister}
          >
            <Text
              style={{
                color: colors.primaryText,
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Create account
            </Text>
          </Pressable>

          <Pressable
            style={{
              minHeight: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: colors.primaryAccent, fontWeight: "600" }}>
              Already have an account?
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
